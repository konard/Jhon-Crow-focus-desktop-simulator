/**
 * Simulate actual raycast behavior to understand the drawing position bug.
 *
 * The key insight: When we raycast to a rotated paper, the intersection point
 * is in world coordinates. We need to understand if there's a mismatch between
 * where the user visually sees the pen tip and where drawing occurs.
 */

// Paper dimensions
const PAPER_WIDTH = 0.28;
const PAPER_DEPTH = 0.4;
const CANVAS_SIZE = 512;

// Current worldToDrawingCoords implementation
function worldToDrawingCoords(worldPos, paperPosition, paperRotationY, paperScale = 1.0) {
  const objPosX = paperPosition.x;
  const objPosZ = paperPosition.z;

  const worldOffsetX = worldPos.x - objPosX;
  const worldOffsetZ = worldPos.z - objPosZ;

  const rotation = paperRotationY;
  const cos = Math.cos(-rotation);
  const sin = Math.sin(-rotation);
  const localX = worldOffsetX * cos - worldOffsetZ * sin;
  const localZ = worldOffsetX * sin + worldOffsetZ * cos;

  const width = PAPER_WIDTH * paperScale;
  const depth = PAPER_DEPTH * paperScale;

  const normalizedX = (localX / width) + 0.5;
  const normalizedY = 1.0 - ((localZ / depth) + 0.5);

  return {
    x: Math.floor(normalizedX * CANVAS_SIZE),
    y: Math.floor(normalizedY * CANVAS_SIZE)
  };
}

// Simulate camera looking down at desk
const cameraPosition = { x: 0, y: 4.5, z: 5.5 };
const cameraLookAt = { x: 0, y: 0, z: -1.5 };

// Simulate a paper at position (0, 0.01, 0) with different rotations
const paperPosition = { x: 0, y: 0.01, z: 0 };

console.log('=== RAYCAST SIMULATION TEST ===\n');

// Test scenario: User is visually aiming at the CENTER of the paper
// The question is: what world coordinate does the raycast return?

// At 0° rotation: paper corners in world space
// Front-left: (-0.14, 0, -0.2)
// Front-right: (0.14, 0, -0.2)
// Back-left: (-0.14, 0, 0.2)
// Back-right: (0.14, 0, 0.2)

// At 90° rotation: paper corners in world space (rotated CCW)
// What was front-left (-0.14, -0.2) becomes (0.2, -0.14) relative to center
// What was front-right (0.14, -0.2) becomes (0.2, 0.14) relative to center

console.log('Scenario: User aims at a fixed world position (0.05, 0.01, -0.1)');
console.log('This is slightly right of center, slightly toward the camera.\n');

const fixedWorldPos = { x: 0.05, y: 0.01, z: -0.1 };

for (let deg = 0; deg <= 270; deg += 90) {
  const rotationRad = (deg * Math.PI) / 180;

  console.log(`Paper rotated ${deg}°:`);

  const canvasPos = worldToDrawingCoords(fixedWorldPos, paperPosition, rotationRad);
  console.log(`  World pos (${fixedWorldPos.x}, ${fixedWorldPos.z}) → Canvas (${canvasPos.x}, ${canvasPos.y})`);

  // Calculate paper-local position for understanding
  const cos = Math.cos(-rotationRad);
  const sin = Math.sin(-rotationRad);
  const localX = fixedWorldPos.x * cos - fixedWorldPos.z * sin;
  const localZ = fixedWorldPos.x * sin + fixedWorldPos.z * cos;
  console.log(`  Paper-local coords: (${localX.toFixed(3)}, ${localZ.toFixed(3)})`);
  console.log();
}

console.log('---');
console.log('Key Question: Is the problem that the raycaster intersection point');
console.log('moves when the paper rotates, but we want canvas position to stay fixed?');
console.log();

// NEW TEST: What if the user is VISUALLY aiming at the same spot on the paper?
// When paper rotates, the raycast intersection point changes in world coordinates.

console.log('=== NEW SCENARIO ===');
console.log('User visually aims at the TOP-RIGHT corner of the paper');
console.log('As paper rotates, the world coordinates of that corner change.\n');

for (let deg = 0; deg <= 270; deg += 90) {
  const rotationRad = (deg * Math.PI) / 180;

  // Top-right corner in paper-local space: (PAPER_WIDTH/2, PAPER_DEPTH/2)
  const localX = PAPER_WIDTH / 2;
  const localZ = PAPER_DEPTH / 2;

  // Transform to world space
  const cos = Math.cos(rotationRad);
  const sin = Math.sin(rotationRad);
  const worldX = paperPosition.x + localX * cos - localZ * sin;
  const worldZ = paperPosition.z + localX * sin + localZ * cos;

  const worldPos = { x: worldX, y: 0.01, z: worldZ };

  console.log(`Paper rotated ${deg}°:`);
  console.log(`  Top-right corner in world: (${worldX.toFixed(3)}, ${worldZ.toFixed(3)})`);

  const canvasPos = worldToDrawingCoords(worldPos, paperPosition, rotationRad);
  console.log(`  Canvas position: (${canvasPos.x}, ${canvasPos.y})`);

  // Expected: top-right corner should ALWAYS map to canvas (512, 0)
  const expected = { x: 512, y: 0 };
  const isCorrect = Math.abs(canvasPos.x - expected.x) <= 2 && Math.abs(canvasPos.y - expected.y) <= 2;
  console.log(`  Expected (512, 0): ${isCorrect ? '✓ CORRECT' : '✗ WRONG'}`);
  console.log();
}

console.log('=== CONCLUSION ===');
console.log('If all "CORRECT" above, the worldToDrawingCoords function is working.');
console.log('The bug might be elsewhere - perhaps in how the raycast point is determined,');
console.log('or in how the pen position is calculated.\n');
