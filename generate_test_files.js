import * as XLSX from 'xlsx';

const players = [
  { "Player ID": "P001", "Player Name": "Virat Kohli", "Role": "Batter", "Nationality": "India", "Player Category": "Marquee", "Base Price": 2.0, "Rating": 94.5, "Notes": "Right-hand top order" },
  { "Player ID": "P002", "Player Name": "Jasprit Bumrah", "Role": "Bowler", "Nationality": "India", "Player Category": "Marquee", "Base Price": 2.0, "Rating": 95.0, "Notes": "Right-arm fast" },
  { "Player ID": "P003", "Player Name": "Hardik Pandya", "Role": "All-rounder", "Nationality": "India", "Player Category": "Capped", "Base Price": 1.5, "Rating": 89.0, "Notes": "Pace all-rounder" },
  { "Player ID": "P004", "Player Name": "Heinrich Klaasen", "Role": "Wicketkeeper", "Nationality": "South Africa", "Player Category": "Capped", "Base Price": 1.5, "Rating": 91.0, "Notes": "Aggressive WK" },
  { "Player ID": "P005", "Player Name": "Pat Cummins", "Role": "Bowler", "Nationality": "Australia", "Player Category": "Marquee", "Base Price": 2.0, "Rating": 93.0, "Notes": "Pace bowler" }
];

const ws = XLSX.utils.json_to_sheet(players);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Players");
XLSX.writeFile(wb, "test_5_players.xlsx");
console.log("Successfully generated test_5_players.xlsx");

// Also generate a test file with validation errors to test error preview
const mixedValidationPlayers = [
  { "Player ID": "P001", "Player Name": "Virat Kohli", "Role": "Batter", "Nationality": "India", "Player Category": "Marquee", "Base Price": 2.0, "Rating": 94.5 },
  { "Player ID": "P002", "Player Name": "", "Role": "Bowler", "Nationality": "India", "Player Category": "Marquee", "Base Price": 2.0, "Rating": 95.0 }, // Missing Name
  { "Player ID": "P003", "Player Name": "Hardik Pandya", "Role": "InvalidRole", "Nationality": "India", "Player Category": "Capped", "Base Price": 1.5, "Rating": 89.0 }, // Invalid Role
  { "Player ID": "P004", "Player Name": "Heinrich Klaasen", "Role": "Wicketkeeper", "Nationality": "South Africa", "Player Category": "Capped", "Base Price": -5.0, "Rating": 91.0 }, // Invalid Base Price
  { "Player ID": "P005", "Player Name": "Pat Cummins", "Role": "Bowler", "Nationality": "Australia", "Player Category": "Marquee", "Base Price": 2.0, "Rating": 150.0 } // Invalid Rating (>100)
];

const wsMixed = XLSX.utils.json_to_sheet(mixedValidationPlayers);
const wbMixed = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wbMixed, wsMixed, "MixedValidation");
XLSX.writeFile(wbMixed, "test_mixed_validation.xlsx");
console.log("Successfully generated test_mixed_validation.xlsx");
