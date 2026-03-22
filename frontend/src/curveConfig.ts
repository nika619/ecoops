import * as THREE from 'three';

/**
 * Shared curve configuration for the Data Highway.
 * 5 scroll pages = 5 stations. Each page maps to one station.
 * Stations spread ~55 units apart on a winding path.
 */

// Station positions along the 3D highway
export const STATION_POSITIONS = [
  new THREE.Vector3(0, 0, 0),         // Station 1: GitLab Ingestion
  new THREE.Vector3(50, 12, -50),     // Station 2: Gemini AI Analysis
  new THREE.Vector3(100, -8, -100),   // Station 3: YAML Optimization
  new THREE.Vector3(155, 5, -155),    // Station 4: Clean Branch
  new THREE.Vector3(210, 8, -210),    // Station 5: Green Impact Tree
];

// The main CatmullRom curve connecting all stations
export const HIGHWAY_CURVE = new THREE.CatmullRomCurve3(STATION_POSITIONS);

// Camera offset: above and behind the curve path
export const CAMERA_OFFSET = new THREE.Vector3(0, 4, 10);

// Number of scroll pages — MUST match station count for alignment
export const SCROLL_PAGES = 5;

// Station labels for typography
export const STATION_LABELS = [
  '01 // THE PROBLEM',
  '02 // AI ANALYSIS',
  '03 // YAML OPTIMIZATION',
  '04 // INTEGRATION',
  '05 // GREEN IMPACT',
];
