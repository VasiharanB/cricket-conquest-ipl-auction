import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { UploadCloud, FileSpreadsheet, Download, AlertCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Modal } from '../Modal/Modal';
import { Button } from '../Button/Button';
import { playerService } from '../../services/playerService';
import type { ImportPlayerPayload, ImportResult } from '../../services/playerService';
import './PlayerImportModal.css';

interface PlayerImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: ImportResult) => void;
}

interface ParsedRow {
  rowNum: number;
  playerId: string;
  playerName: string;
  role: string;
  nationality: string;
  playerCategory: string;
  basePrice: number;
  rating: number | null;
  keyPoints?: number;
  notes?: string;
  isValid: boolean;
  errors: string[];
}

const ALLOWED_ROLES = ['Batter', 'Bowler', 'All-rounder', 'Wicketkeeper'];

function normalizeRole(role: string): string {
  const trimmed = (role || '').trim();
  if (trimmed.toLowerCase() === 'batsman') return 'Batter';
  const found = ALLOWED_ROLES.find((r) => r.toLowerCase() === trimmed.toLowerCase());
  return found || trimmed;
}

export const PlayerImportModal: React.FC<PlayerImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFile(null);
    setParsedRows([]);
    setIsParsing(false);
    setIsSubmitting(false);
    setSubmitError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetState();
    onClose();
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        'Player ID': 'P001',
        'Player Name': 'Virat Kohli',
        Role: 'Batter',
        Nationality: 'Indian',
        'Player Category': 'Marquee',
        'Base Price': 2.0,
        Rating: 94.5,
        'Key Points': 95,
        Notes: 'Top-order batsman and icon player',
      },
      {
        'Player ID': 'P002',
        'Player Name': 'Jasprit Bumrah',
        Role: 'Bowler',
        Nationality: 'Indian',
        'Player Category': 'Marquee',
        'Base Price': 2.0,
        Rating: 95.0,
        'Key Points': 98,
        Notes: 'Premier fast bowler',
      },
      {
        'Player ID': 'P003',
        'Player Name': 'Hardik Pandya',
        Role: 'All-rounder',
        Nationality: 'Indian',
        'Player Category': 'Capped',
        'Base Price': 1.5,
        Rating: 89.0,
        'Key Points': 88,
        Notes: 'Pace bowling all-rounder',
      },
      {
        'Player ID': 'P004',
        'Player Name': 'Heinrich Klaasen',
        Role: 'Wicketkeeper',
        Nationality: 'Overseas',
        'Player Category': 'Capped',
        'Base Price': 1.5,
        Rating: 91.0,
        'Key Points': 92,
        Notes: 'Middle-order hard hitter',
      },
      {
        'Player ID': 'P005',
        'Player Name': 'Pat Cummins',
        Role: 'Bowler',
        Nationality: 'Australia',
        'Player Category': 'Marquee',
        'Base Price': 2.0,
        Rating: 93.0,
        'Key Points': 90,
        Notes: 'Right-arm fast',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Players');
    XLSX.writeFile(wb, 'player_master_template.xlsx');
  };

  const processFile = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setIsParsing(true);
    setSubmitError(null);

    try {
      const data = await uploadedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

      const rows: ParsedRow[] = [];
      const seenIdsInBatch = new Set<string>();

      rawJson.forEach((row, idx) => {
        const rowNum = idx + 2; // header is row 1
        const errors: string[] = [];

        // Normalize keys
        const getField = (...keys: string[]): any => {
          for (const key of keys) {
            const match = Object.keys(row).find(
              (k) => k.trim().toLowerCase() === key.trim().toLowerCase()
            );
            if (match && row[match] !== undefined && row[match] !== '') {
              return row[match];
            }
          }
          return '';
        };

        const rawId = String(getField('Player ID', 'player_id', 'PlayerId', 'id')).trim();
        const rawName = String(getField('Player Name', 'player_name', 'PlayerName', 'name')).trim();
        const rawRole = String(getField('Role', 'role')).trim();
        const rawNat = String(getField('Nationality', 'nationality', 'Country')).trim();
        const rawCategory = String(getField('Player Category', 'player_category', 'Category', 'category')).trim() || 'General';
        const rawBasePrice = getField('Base Price', 'base_price', 'BasePrice', 'Price');
        const rawRating = getField('Rating', 'rating');
        const rawKeyPoints = getField('Key Points', 'key_points', 'KeyPoints', 'Points', 'PointsValue');
        const rawNotes = String(getField('Notes', 'notes')).trim();

        // Validation
        if (!rawId) {
          errors.push('Missing Player ID');
        } else if (seenIdsInBatch.has(rawId.toUpperCase())) {
          errors.push(`Duplicate Player ID '${rawId}' in file`);
        } else {
          seenIdsInBatch.add(rawId.toUpperCase());
        }

        if (!rawName) {
          errors.push('Missing Player Name');
        }

        const normalizedRole = normalizeRole(rawRole);
        if (!rawRole) {
          errors.push('Missing Role');
        } else if (!ALLOWED_ROLES.includes(normalizedRole)) {
          errors.push(`Invalid role '${rawRole}'. Allowed: ${ALLOWED_ROLES.join(', ')}`);
        }

        if (!rawNat) {
          errors.push('Missing Nationality');
        }

        const parsedBasePrice = Number(rawBasePrice);
        if (rawBasePrice === '' || isNaN(parsedBasePrice) || parsedBasePrice <= 0) {
          errors.push('Base price must be greater than 0');
        }

        let parsedRating: number | null = null;
        if (rawRating !== '' && rawRating !== undefined && rawRating !== null) {
          parsedRating = Number(rawRating);
          if (isNaN(parsedRating) || parsedRating < 0 || parsedRating > 100) {
            errors.push('Rating must be between 0 and 100');
          }
        }

        let parsedKeyPoints: number | undefined = undefined;
        if (rawKeyPoints !== '' && rawKeyPoints !== undefined && rawKeyPoints !== null) {
          parsedKeyPoints = Number(rawKeyPoints);
          if (isNaN(parsedKeyPoints) || parsedKeyPoints < 0) {
            errors.push('Key points must be a valid positive number');
          }
        }

        rows.push({
          rowNum,
          playerId: rawId,
          playerName: rawName,
          role: normalizedRole || rawRole,
          nationality: rawNat,
          playerCategory: rawCategory,
          basePrice: isNaN(parsedBasePrice) ? 0 : parsedBasePrice,
          rating: parsedRating,
          keyPoints: parsedKeyPoints,
          notes: rawNotes,
          isValid: errors.length === 0,
          errors,
        });
      });

      setParsedRows(rows);
    } catch (err: any) {
      console.error('File parsing error:', err);
      setSubmitError(err.message || 'Failed to parse file. Please verify it is a valid .xlsx or .csv.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const validRows = parsedRows.filter((r) => r.isValid);
  const errorRows = parsedRows.filter((r) => !r.isValid);

  const handleImport = async () => {
    if (validRows.length === 0) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload: ImportPlayerPayload[] = validRows.map((r) => ({
        player_id: r.playerId,
        player_name: r.playerName,
        role: r.role,
        nationality: r.nationality,
        player_category: r.playerCategory,
        base_price: r.basePrice,
        rating: r.rating,
        key_points: r.keyPoints,
        notes: r.notes,
      }));

      const result = await playerService.importPlayers(payload, 'skip');
      onSuccess(result);
      handleClose();
    } catch (err: any) {
      console.error('Import failed:', err);
      setSubmitError(err.message || 'Import failed. Database transaction was rolled back.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Players" size="lg">
      <div className="player-import">
        <div className="player-import__intro">
          <div>
            <p className="player-import__subtitle">Upload your player master Excel file (.xlsx or .csv)</p>
            <p className="player-import__hint">
              Required columns: <code>Player ID</code>, <code>Player Name</code>, <code>Role</code>,{' '}
              <code>Nationality</code>, <code>Player Category</code>, <code>Base Price</code>, <code>Rating</code>
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={<Download size={14} />}
            onClick={downloadTemplate}
          >
            Download Template
          </Button>
        </div>

        {/* Dropzone */}
        {!file && (
          <div
            className={`player-import__dropzone ${dragOver ? 'player-import__dropzone--active' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
            />
            <div className="player-import__dropzone-icon">
              <UploadCloud size={32} />
            </div>
            <p className="player-import__dropzone-text">
              <strong>Click to upload</strong> or drag and drop spreadsheet
            </p>
            <span className="player-import__dropzone-types">Microsoft Excel (.xlsx) or CSV</span>
          </div>
        )}

        {isParsing && (
          <div className="player-import__parsing">
            <Loader2 className="animate-spin" size={24} />
            <span>Parsing and validating spreadsheet data...</span>
          </div>
        )}

        {submitError && (
          <div className="player-import__alert player-import__alert--danger">
            <AlertCircle size={16} />
            <span>{submitError}</span>
          </div>
        )}

        {/* File & Validation Summary */}
        {file && !isParsing && (
          <div className="player-import__results">
            <div className="player-import__file-bar">
              <div className="player-import__file-info">
                <FileSpreadsheet size={18} className="text-royal" />
                <span className="player-import__filename">{file.name}</span>
                <span className="player-import__filesize">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetState}
                disabled={isSubmitting}
              >
                Choose another file
              </Button>
            </div>

            {/* Summary Stat Cards */}
            <div className="player-import__stats">
              <div className="player-import__stat-pill">
                <span className="player-import__stat-count">{parsedRows.length}</span>
                <span className="player-import__stat-label">Players Found</span>
              </div>
              <div className="player-import__stat-pill player-import__stat-pill--valid">
                <CheckCircle2 size={16} />
                <span className="player-import__stat-count">{validRows.length}</span>
                <span className="player-import__stat-label">Valid Rows</span>
              </div>
              {errorRows.length > 0 && (
                <div className="player-import__stat-pill player-import__stat-pill--error">
                  <XCircle size={16} />
                  <span className="player-import__stat-count">{errorRows.length}</span>
                  <span className="player-import__stat-label">Errors</span>
                </div>
              )}
            </div>

            {/* Preview Table */}
            <div className="player-import__table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Player ID</th>
                    <th>Player Name</th>
                    <th>Role</th>
                    <th>Nationality</th>
                    <th>Base Price</th>
                    <th>Rating</th>
                    <th>Key Points 🔒</th>
                    <th>Validation Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((row) => (
                    <tr
                      key={`${row.rowNum}-${row.playerId}`}
                      className={!row.isValid ? 'player-import__row--error' : ''}
                    >
                      <td className="data-table__mono">#{row.rowNum}</td>
                      <td className="data-table__bold">{row.playerId || '—'}</td>
                      <td>{row.playerName || '—'}</td>
                      <td>{row.role || '—'}</td>
                      <td>{row.nationality || '—'}</td>
                      <td>{row.basePrice > 0 ? `₹${row.basePrice} Cr` : '—'}</td>
                      <td>{row.rating !== null ? `${row.rating}` : '—'}</td>
                      <td>
                        {row.keyPoints !== undefined ? (
                          <span style={{ color: '#00F59B', fontWeight: 700, fontSize: 13 }}>
                            {row.keyPoints} pts
                          </span>
                        ) : (
                          <span style={{ color: '#94A3B8', fontSize: 12 }}>—</span>
                        )}
                      </td>
                      <td>
                        {row.isValid ? (
                          <span className="player-import__status-tag player-import__status-tag--valid">
                            <CheckCircle2 size={12} /> Valid
                          </span>
                        ) : (
                          <div className="player-import__status-errors">
                            {row.errors.map((err, i) => (
                              <span
                                key={i}
                                className="player-import__status-tag player-import__status-tag--error"
                                title={err}
                              >
                                {err}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Confirmation Banner */}
            <div className="player-import__confirm-box">
              <div className="player-import__confirm-text">
                <p>
                  You are about to import <strong>{validRows.length}</strong> validated players.
                </p>
                <p className="text-secondary text-xs">
                  Duplicate player IDs already in the database will be automatically skipped without overwriting.
                </p>
              </div>

              <div className="player-import__actions">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleImport}
                  disabled={validRows.length === 0 || isSubmitting}
                  icon={isSubmitting ? <Loader2 className="animate-spin" size={16} /> : undefined}
                >
                  {isSubmitting ? 'Importing to MySQL...' : `Import ${validRows.length} Players`}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
