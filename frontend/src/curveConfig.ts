import * as THREE from 'three';

/**
 * Shared curve configuration for the Data Highway.
 * 5 scroll pages = 5 stations. Each page maps to one station.
 * Stations spread ~55 units apart on a winding path.
 */

// Station positions along the 3D highway — 6 stations matching the step table
export const STATION_POSITIONS = [
  new THREE.Vector3(0, 0, 0),         // Station 1: GitLab Fetch
  new THREE.Vector3(50, 12, -50),     // Station 2: Gemini Analyze Waste
  new THREE.Vector3(100, -8, -100),   // Station 3: Gemini Generate YAML
  new THREE.Vector3(130, 2, -130),    // Station 4: CI Linter Validate ← NEW
  new THREE.Vector3(170, 5, -170),    // Station 5: Create Branch + Commit (was [3])
  new THREE.Vector3(220, 8, -220),    // Station 6: Open MR + Green Impact (was [4])
];

// The main CatmullRom curve connecting all stations
export const HIGHWAY_CURVE = new THREE.CatmullRomCurve3(STATION_POSITIONS);

// Camera offset: above and behind the curve path
export const CAMERA_OFFSET = new THREE.Vector3(0, 4, 10);

// Number of scroll pages — MUST match station count for alignment
export const SCROLL_PAGES = 6;

// Station labels — matches step table exactly
export const STATION_LABELS = [
  '01 // GitLab API — Fetch Commits & Diffs',
  '02 // Gemini AI — Analyze Waste Patterns',
  '03 // Gemini AI — Generate Optimized YAML',
  '04 // GitLab CI Linter — Validate YAML',
  '05 // GitLab API — Create Branch + Commit',
  '06 // GitLab API — Open MR + Green Impact',
];
