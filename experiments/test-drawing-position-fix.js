/**
 * Comprehensive test for issue #105 fix: Drawing position under pen tip
 *
 * This test simulates the actual drawing flow and verifies that:
 * 1. Drawing occurs under the pen tip at any paper rotation
 * 2. The coordinate transformation correctly handles all rotation angles
 */

const PAPER_WIDTH = 0.28;
const PAPER_DEPTH = 0.4;
const CANVAS_SIZE = 512;

// FIXED worldToDrawingCoords (matching src/renderer.js)
function worldToDrawingCoords(worldPos, drawableObject) {
  if (!drawableObject) return null;

  const objPos = drawableObject.position;
  const worldOffsetX = worldPos.x - objPos.x;
  const worldOffsetZ = worldPos.z - objPos.z;

  const rotation = drawableObject.rotation.y;
  const cos = Math.cos(-rotation);
  const sin = Math.sin(-rotation);
  const localX = worldOffsetX * cos - worldOffsetZ * sin;
  const localZ = worldOffsetX * sin + worldOffsetZ * cos;

  const baseWidth = drawableObject.userData.type === 'notebook' ? 0.4 : PAPER_WIDTH;
  const baseDepth = drawableObject.userData.type === 'notebook' ? 0.55 : PAPER_DEPTH;
  const scale = drawableObject.userData.scale || 1.0;
  const width = baseWidth * scale;
  const depth = baseDepth * scale;

  const normalizedX = (localX / width) + 0.5;
  const normalizedY = 1.0 - ((localZ / depth) + 0.5);

  return {
    x: Math.floor(normalizedX * CANVAS_SIZE),
    y: Math.floor(normalizedY * CANVAS_SIZE)
  };
}

// Helper: Create a paper object
function createPaper(rotationDegrees) {
  return {
    position: { x: 0, y: 0.01, z: 0 },
    rotation: { y: (rotationDegrees * Math.PI) / 180 },
    userData: { type: 'paper', scale: 1.0 }
  };
}

// Helper: Transform paper-local position to world position
function paperLocalToWorld(localX, localZ, paper) {
  const cos = Math.cos(paper.rotation.y);
  const sin = Math.sin(paper.rotation.y);
  return {
    x: paper.position.x + localX * cos - localZ * sin,
    y: 0.01,
    z: paper.position.z + localX * sin + localZ * cos
  };
}

console.log('=== COMPREHENSIVE TEST: Drawing Position Fix ===\n');

let passCount = 0;
let failCount = 0;

function runTest(name, actual, expected, tolerance = 1) {
  const xDiff = Math.abs(actual.x - expected.x);
  const yDiff = Math.abs(actual.y - expected.y);
  const pass = xDiff <= tolerance && yDiff <= tolerance;

  if (pass) {
    console.log(`✓ ${name}`);
    passCount++;
  } else {
    console.log(`✗ ${name}`);
    console.log(`  Expected: (${expected.x}, ${expected.y})`);
    console.log(`  Got: (${actual.x}, ${actual.y})`);
    failCount++;
  }
}

// Test 1: Drawing at paper center (should be canvas center)
console.log('TEST 1: Drawing at paper center');
console.log('-------------------------------');
for (let deg = 0; deg <= 360; deg += 45) {
  const paper = createPaper(deg);
  const worldPos = paperLocalToWorld(0, 0, paper);
  const canvasPos = worldToDrawingCoords(worldPos, paper);
  runTest(`  Paper at ${deg}°`, canvasPos, { x: 256, y: 256 });
}
console.log();

// Test 2: Drawing at paper corners
console.log('TEST 2: Drawing at paper corners');
console.log('--------------------------------');
const corners = [
  { local: { x: PAPER_WIDTH / 2, z: PAPER_DEPTH / 2 }, expected: { x: 512, y: 0 }, name: 'top-right' },
  { local: { x: -PAPER_WIDTH / 2, z: PAPER_DEPTH / 2 }, expected: { x: 0, y: 0 }, name: 'top-left' },
  { local: { x: PAPER_WIDTH / 2, z: -PAPER_DEPTH / 2 }, expected: { x: 512, y: 512 }, name: 'bottom-right' },
  { local: { x: -PAPER_WIDTH / 2, z: -PAPER_DEPTH / 2 }, expected: { x: 0, y: 512 }, name: 'bottom-left' }
];

for (const corner of corners) {
  for (let deg = 0; deg <= 270; deg += 90) {
    const paper = createPaper(deg);
    const worldPos = paperLocalToWorld(corner.local.x, corner.local.z, paper);
    const canvasPos = worldToDrawingCoords(worldPos, paper);
    runTest(`  ${corner.name} at ${deg}°`, canvasPos, corner.expected, 2);
  }
}
console.log();

// Test 3: Simulating user drawing from top to bottom
console.log('TEST 3: Drawing line from top to bottom (paper-local)');
console.log('-----------------------------------------------------');
console.log('User intention: Draw a vertical line from top-center to bottom-center');
console.log('Expected: Canvas Y should increase from ~64 to ~448');
console.log();

for (let deg = 0; deg <= 270; deg += 90) {
  const paper = createPaper(deg);

  // Top of paper (paper-local: x=0, z=+0.15) → canvas y ~64
  const topLocal = { x: 0, z: 0.15 };
  const topWorld = paperLocalToWorld(topLocal.x, topLocal.z, paper);
  const topCanvas = worldToDrawingCoords(topWorld, paper);

  // Bottom of paper (paper-local: x=0, z=-0.15) → canvas y ~448
  const bottomLocal = { x: 0, z: -0.15 };
  const bottomWorld = paperLocalToWorld(bottomLocal.x, bottomLocal.z, paper);
  const bottomCanvas = worldToDrawingCoords(bottomWorld, paper);

  const yDelta = bottomCanvas.y - topCanvas.y;

  console.log(`Paper at ${deg}°:`);
  console.log(`  Top (paper-local: z=+0.15): canvas (${topCanvas.x}, ${topCanvas.y})`);
  console.log(`  Bottom (paper-local: z=-0.15): canvas (${bottomCanvas.x}, ${bottomCanvas.y})`);
  console.log(`  Y delta: ${yDelta} ${yDelta > 0 ? '(correct direction ✓)' : '(INVERTED ✗)'}`);
  console.log();

  if (yDelta > 0) passCount++;
  else failCount++;
}

console.log('=== TEST SUMMARY ===');
console.log(`Passed: ${passCount}`);
console.log(`Failed: ${failCount}`);
console.log();

if (failCount === 0) {
  console.log('🎉 ALL TESTS PASSED! Drawing position fix is working correctly.');
} else {
  console.log('⚠️ Some tests failed. Please review the fix.');
}
