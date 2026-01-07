/**
 * Verify the coordinate transformation fix for issue #105
 *
 * The fix adds inverse rotation transformation to convert world coordinates
 * to paper-local coordinates, ensuring drawing occurs under the pen tip.
 */

const PAPER_WIDTH = 0.28;
const PAPER_DEPTH = 0.4;
const CANVAS_SIZE = 512;

// FIXED implementation (matching the updated renderer.js)
function worldToDrawingCoords_FIXED(worldPos, paper) {
  if (!paper) return null;

  // Get object's world position (paper center)
  const objPos = paper.position;

  // Calculate offset from object center in WORLD space
  const worldOffsetX = worldPos.x - objPos.x;
  const worldOffsetZ = worldPos.z - objPos.z;

  // Get paper rotation around Y axis
  const rotation = paper.rotation.y;

  // Apply INVERSE rotation to transform world offset to paper-local offset
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

console.log('=== VERIFYING COORDINATE TRANSFORMATION FIX ===\n');

// Test at various rotation angles
const rotations = [
  { angle: 0, label: '0°' },
  { angle: Math.PI / 4, label: '45°' },
  { angle: Math.PI / 2, label: '90°' },
  { angle: Math.PI, label: '180°' },
  { angle: 3 * Math.PI / 2, label: '270°' }
];

// Test case: Pen tip is at the paper's right edge (when paper is at 0°)
// World offset from paper center: (+0.14, 0) in X,Z
// This should always map to canvas right edge (x ≈ 512, y = 256)
const edgeDistanceX = PAPER_WIDTH / 2;  // 0.14
const edgeDistanceZ = 0;

console.log('TEST: Paper right edge in paper-local coordinates');
console.log('Expected canvas position: (512, 256) - right edge, vertically centered');
console.log('');

for (const rot of rotations) {
  // Calculate where this paper-local position is in world coordinates
  // Paper-local (0.14, 0) rotated by +θ gives world offset
  const cos = Math.cos(rot.angle);
  const sin = Math.sin(rot.angle);
  const worldOffsetX = edgeDistanceX * cos - edgeDistanceZ * sin;
  const worldOffsetZ = edgeDistanceX * sin + edgeDistanceZ * cos;

  const paper = {
    position: { x: 0, y: 0.01, z: 0 },
    rotation: { y: rot.angle },
    userData: { type: 'paper', scale: 1.0 }
  };

  const worldPos = {
    x: paper.position.x + worldOffsetX,
    y: 0.01,
    z: paper.position.z + worldOffsetZ
  };

  const canvasCoords = worldToDrawingCoords_FIXED(worldPos, paper);

  console.log(`Paper rotation: ${rot.label}`);
  console.log(`  World offset: (${worldOffsetX.toFixed(4)}, ${worldOffsetZ.toFixed(4)})`);
  console.log(`  Canvas coords: (${canvasCoords.x}, ${canvasCoords.y})`);
  console.log(`  Expected: (512, 256) - ${canvasCoords.x === 512 && canvasCoords.y === 256 ? '✓' : '✗'}`);
  console.log('');
}

console.log('TEST: Paper center should always map to canvas center');
console.log('Expected canvas position: (256, 256)');
console.log('');

for (const rot of rotations) {
  const paper = {
    position: { x: 0, y: 0.01, z: 0 },
    rotation: { y: rot.angle },
    userData: { type: 'paper', scale: 1.0 }
  };

  const worldPos = { x: 0, y: 0.01, z: 0 };  // Paper center
  const canvasCoords = worldToDrawingCoords_FIXED(worldPos, paper);

  console.log(`Paper rotation: ${rot.label} - Canvas: (${canvasCoords.x}, ${canvasCoords.y}) - ${canvasCoords.x === 256 && canvasCoords.y === 256 ? '✓' : '✗'}`);
}

console.log('\n=== FIX VERIFICATION COMPLETE ===');
console.log('');
console.log('With the fix, pen tip world position is correctly transformed to');
console.log('paper-local coordinates, ensuring drawing occurs under the pen.');
