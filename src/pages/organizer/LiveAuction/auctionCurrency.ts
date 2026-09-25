// ============================================================================
// Cricket Conquest – Centralized Auction Currency & Normalization Utility
// Ensures all prices are consistently displayed and calculated in Crores (Cr).
// Handles both raw database values (e.g., 20000000, 12500000, 7500000)
// and crore units (e.g., 2, 1.25, 0.75, 100).
// ============================================================================

/**
 * Normalizes any price amount into Crores.
 * - If value is >= 10,000, it treats it as raw Indian Rupees (1 Crore = 10,000,000 = 1e7)
 *   20000000 -> 2
 *   12500000 -> 1.25
 *   7500000  -> 0.75
 *   3000000  -> 0.3
 * - If value is < 10,000, it is already in Crores (e.g., 2, 0.75, 42.5, 100).
 */
export function normalizeToCrores(val: number | string | null | undefined): number {
  if (val === null || val === undefined) return 0;
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num) || num <= 0) return 0;

  if (num >= 10000) {
    return Number((num / 10000000).toFixed(4));
  }
  return Number(num.toFixed(4));
}

/**
 * Returns clean numeric string in Crores without trailing decimal zeroes.
 * Examples:
 *   20000000 -> "2"
 *   12500000 -> "1.25"
 *   7500000  -> "0.75"
 *   2        -> "2"
 *   1.25     -> "1.25"
 *   0.75     -> "0.75"
 */
export function formatCroreNumber(val: number | string | null | undefined): string {
  const cr = normalizeToCrores(val);
  if (cr === 0) return '0';
  return cr % 1 === 0 ? cr.toString() : parseFloat(cr.toFixed(2)).toString();
}

/**
 * Standard complete display formatting:
 * Examples:
 *   20000000 -> "₹2 Cr"
 *   12500000 -> "₹1.25 Cr"
 *   7500000  -> "₹0.75 Cr"
 *   3000000  -> "₹0.3 Cr"
 *   2        -> "₹2 Cr"
 */
export function formatCrores(val: number | string | null | undefined): string {
  return `₹${formatCroreNumber(val)} Cr`;
}
