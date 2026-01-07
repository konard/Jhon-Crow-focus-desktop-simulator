/**
 * Diagnostic script to analyze drawing position offset issue
 *
 * The user reports that drawing doesn't occur under the pen.
 * This script analyzes the coordinate transformation to identify the root cause.
 */

// Paper dimensions (matching renderer.js)
const PAPER_WIDTH = 0.28;
const PAPER_DEPTH = 0.4;
const CANVAS_SIZE = 512;

// Current worldToDrawingCoords implementation (from renderer.js line 8620)
function worldToDrawingCoords_CURRENT(worldPos, paper) {
  if (!paper) return null;

  // Get object's world position (paper center)
  const objPos = paper.position;

  // Calculate offset from object center in WORLD space
  const localX = worldPos.x - objPos.x;
  const localZ = worldPos.z - objPos.z;

  // Get object dimensions with scale applied
  const baseWidth = paper.userData.type === 'notebook' ? 0.4 : PAPER_WIDTH;
  const baseDepth = paper.userData.type === 'notebook' ? 0.55 : PAPER_DEPTH;
  const scale = paper.userData.scale || 1.0;
  const width = baseWidth * scale;
  const depth = baseDepth * scale;

  // Convert to normalized coordinates (0-1) in WORLD space
  // This is the PROBLEM: It doesn't account for paper rotation!
  const normalizedX = (localX / width) + 0.5;
  const normalizedY = 1.0 - ((localZ / depth) + 0.5);

  // Convert to canvas coordinates
  return {
    x: Math.floor(normalizedX * CANVAS_SIZE),
    y: Math.floor(normalizedY * CANVAS_SIZE)
  };
}

// Fixed version: Apply inverse rotation to transform world coords to paper-local coords
function worldToDrawingCoords_FIXED(worldPos, paper) {
  if (!paper) return null;

  // Get object's world position (paper center)
  const objPos = paper.position;

  // Calculate offset from object center in WORLD space
  const worldOffsetX = worldPos.x - objPos.x;
  const worldOffsetZ = worldPos.z - objPos.z;

  // Get paper rotation
  const rotation = paper.rotation.y;

  // Apply INVERSE rotation to transform world offset to paper-local offset
  // If paper is rotated by +θ, world coords need to be rotated by -θ to get paper-local
  const cos = Math.cos(-rotation);
  const sin = Math.sin(-rotation);
  const localX = worldOffsetX * cos - worldOffsetZ * sin;
  const localZ = worldOffsetX * sin + worldOffsetZ * cos;

  // Get object dimensions with scale applied
  const baseWidth = paper.userData.type === 'notebook' ? 0.4 : PAPER_WIDTH;
  const baseDepth = paper.userData.type === 'notebook' ? 0.55 : PAPER_DEPTH;
  const scale = paper.userData.scale || 1.0;
  const width = baseWidth * scale;
  const depth = baseDepth * scale;

  // Convert to normalized coordinates (0-1) in PAPER-LOCAL space
  const normalizedX = (localX / width) + 0.5;
  const normalizedY = 1.0 - ((localZ / depth) + 0.5);

  // Convert to canvas coordinates
  return {
    x: Math.floor(normalizedX * CANVAS_SIZE),
    y: Math.floor(normalizedY * CANVAS_SIZE)
  };
}

// Test cases
console.log('=== ANALYSIS OF DRAWING OFFSET ISSUE ===\n');

// Simulate paper at center of desk, no rotation
const paper0 = {
  position: { x: 0, y: 0.01, z: 0 },
  rotation: { y: 0 },
  userData: { type: 'paper', scale: 1.0 }
};

// Simulate paper rotated 90 degrees clockwise
const paper90 = {
  position: { x: 0, y: 0.01, z: 0 },
  rotation: { y: Math.PI / 2 },  // 90 degrees
  userData: { type: 'paper', scale: 1.0 }
};

console.log('TEST 1: Paper at 0° rotation');
console.log('----------------------------');
// Drawing point at world (0.1, 0, 0.05) - right and slightly back from paper center
const worldPoint1 = { x: 0.1, y: 0.01, z: 0.05 };
const current1 = worldToDrawingCoords_CURRENT(worldPoint1, paper0);
const fixed1 = worldToDrawingCoords_FIXED(worldPoint1, paper0);
console.log(`World point: (${worldPoint1.x}, ${worldPoint1.z})`);
console.log(`Current implementation: (${current1.x}, ${current1.y})`);
console.log(`Fixed implementation: (${fixed1.x}, ${fixed1.y})`);
console.log(`At 0° rotation, both should be the same: ${current1.x === fixed1.x && current1.y === fixed1.y ? '✓' : '✗'}`);
console.log();

console.log('TEST 2: Paper at 90° rotation');
console.log('-----------------------------');
// Same world point - if pen is at world (0.1, 0, 0.05),
// on a 90° rotated paper, that point is at a DIFFERENT paper-local position
const worldPoint2 = { x: 0.1, y: 0.01, z: 0.05 };
const current2 = worldToDrawingCoords_CURRENT(worldPoint2, paper90);
const fixed2 = worldToDrawingCoords_FIXED(worldPoint2, paper90);
console.log(`World point: (${worldPoint2.x}, ${worldPoint2.z})`);
console.log(`Paper rotation: 90° (π/2 radians)`);
console.log(`Current implementation: (${current2.x}, ${current2.y})`);
console.log(`Fixed implementation: (${fixed2.x}, ${fixed2.y})`);
console.log();

// Key insight: At 90° rotation:
// - World +X maps to paper +Z (towards the back of the paper in its local frame)
// - World +Z maps to paper -X (towards the left of the paper in its local frame)
console.log('ANALYSIS:');
console.log('---------');
console.log('At 90° rotation:');
console.log('  - World +X (0.1) should map to paper +Z (back of paper)');
console.log('  - World +Z (0.05) should map to paper -X (left side of paper)');
console.log('');
console.log('Current implementation ignores rotation:');
console.log(`  localX = worldX - objX = ${worldPoint2.x} - 0 = ${worldPoint2.x}`);
console.log(`  localZ = worldZ - objZ = ${worldPoint2.z} - 0 = ${worldPoint2.z}`);
console.log('  This treats world coords as paper-local coords - INCORRECT!');
console.log('');
console.log('Fixed implementation applies inverse rotation:');
const cos = Math.cos(-Math.PI/2);
const sin = Math.sin(-Math.PI/2);
const correctLocalX = worldPoint2.x * cos - worldPoint2.z * sin;
const correctLocalZ = worldPoint2.x * sin + worldPoint2.z * cos;
console.log(`  cos(-90°) = ${cos.toFixed(4)}, sin(-90°) = ${sin.toFixed(4)}`);
console.log(`  localX = ${worldPoint2.x} * ${cos.toFixed(2)} - ${worldPoint2.z} * ${sin.toFixed(2)} = ${correctLocalX.toFixed(4)}`);
console.log(`  localZ = ${worldPoint2.x} * ${sin.toFixed(2)} + ${worldPoint2.z} * ${cos.toFixed(2)} = ${correctLocalZ.toFixed(4)}`);
console.log('  This correctly transforms world coords to paper-local coords');
console.log();

console.log('TEST 3: Verify paper center always maps to canvas center');
console.log('-------------------------------------------------------');
const centerPoint = { x: 0, y: 0.01, z: 0 };
const center0 = worldToDrawingCoords_FIXED(centerPoint, paper0);
const center90 = worldToDrawingCoords_FIXED(centerPoint, paper90);
console.log(`Paper center at 0° rotation: (${center0.x}, ${center0.y}) - Expected: (256, 256)`);
console.log(`Paper center at 90° rotation: (${center90.x}, ${center90.y}) - Expected: (256, 256)`);
console.log(`Both should be (256, 256): ${center0.x === 256 && center0.y === 256 && center90.x === 256 && center90.y === 256 ? '✓' : '✗'}`);
console.log();

console.log('=== CONCLUSION ===');
console.log('');
console.log('The PROBLEM is that worldToDrawingCoords() does NOT apply rotation transformation.');
console.log('');
console.log('When the paper is rotated:');
console.log('  1. The pen tip position is in WORLD coordinates');
console.log('  2. The canvas is attached to the PAPER in its local coordinate system');
console.log('  3. We need to transform world coords → paper-local coords');
console.log('  4. This requires applying the INVERSE of the paper\'s rotation');
console.log('');
console.log('The FIX is to add rotation transformation in worldToDrawingCoords().');
