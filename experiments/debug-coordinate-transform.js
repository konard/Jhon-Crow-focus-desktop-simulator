/**
 * Debug the coordinate transformation by simulating what happens in the real app.
 *
 * Key insight from video: The pen is visually in one position, but drawing appears elsewhere.
 *
 * Let's trace through exactly what happens:
 *
 * 1. User moves mouse
 * 2. onMouseMove fires
 * 3. Raycast from camera through screen position hits the paper
 * 4. crosshairPoint = intersection.point (world coordinates)
 * 5. Pen position is set to crosshairPoint (clamped)
 * 6. addDrawingPoint(crosshairPoint) is called
 * 7. worldToDrawingCoords(crosshairPoint, paper) calculates canvas position
 *
 * The question: Is there a mismatch between what the user SEES and what we CALCULATE?
 */

// Paper dimensions
const PAPER_WIDTH = 0.28;
const PAPER_DEPTH = 0.4;
const CANVAS_SIZE = 512;

// worldToDrawingCoords (current implementation)
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

// Simulate camera setup
const camera = {
  position: { x: 0, y: 4.5, z: 5.5 },
  lookAt: { x: 0, y: 0, z: -1.5 }
};

console.log('=== DEBUG: Understanding the coordinate mismatch ===\n');

// Scenario: Paper is at center (0, 0.01, 0), rotated 90 degrees
const paperPosition = { x: 0, y: 0.01, z: 0 };
const paperRotationDeg = 90;
const paperRotationRad = (paperRotationDeg * Math.PI) / 180;

console.log(`Paper position: (${paperPosition.x}, ${paperPosition.z})`);
console.log(`Paper rotation: ${paperRotationDeg}°\n`);

// Calculate paper corners in world space
function paperLocalToWorld(localX, localZ, paperPos, rotation) {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  return {
    x: paperPos.x + localX * cos - localZ * sin,
    z: paperPos.z + localX * sin + localZ * cos
  };
}

console.log('Paper corners in world space (after 90° rotation):');
const corners = [
  { name: 'top-left', local: { x: -PAPER_WIDTH/2, z: PAPER_DEPTH/2 } },
  { name: 'top-right', local: { x: PAPER_WIDTH/2, z: PAPER_DEPTH/2 } },
  { name: 'bottom-left', local: { x: -PAPER_WIDTH/2, z: -PAPER_DEPTH/2 } },
  { name: 'bottom-right', local: { x: PAPER_WIDTH/2, z: -PAPER_DEPTH/2 } },
];

for (const corner of corners) {
  const world = paperLocalToWorld(corner.local.x, corner.local.z, paperPosition, paperRotationRad);
  console.log(`  ${corner.name}: world (${world.x.toFixed(3)}, ${world.z.toFixed(3)})`);
}
console.log();

// Now, suppose user clicks at world position (0.1, 0.01, 0)
// This is to the RIGHT of the paper center in world space
// But since paper is rotated 90°, this is at the BACK of the paper
const clickWorldPos = { x: 0.1, y: 0.01, z: 0 };

console.log(`User clicks at world position: (${clickWorldPos.x}, ${clickWorldPos.z})`);

// Transform to canvas coordinates
const canvasPos = worldToDrawingCoords(clickWorldPos, paperPosition, paperRotationRad);
console.log(`Canvas coordinates: (${canvasPos.x}, ${canvasPos.y})`);

// Calculate paper-local position
const cos = Math.cos(-paperRotationRad);
const sin = Math.sin(-paperRotationRad);
const localX = clickWorldPos.x * cos - clickWorldPos.z * sin;
const localZ = clickWorldPos.x * sin + clickWorldPos.z * cos;
console.log(`Paper-local coords: (${localX.toFixed(3)}, ${localZ.toFixed(3)})`);

// At 90° rotation:
// - World X+ direction corresponds to paper's Z+ direction (toward "back" of paper)
// - World Z+ direction corresponds to paper's X- direction (toward "left" of paper)

console.log('\n=== VISUAL CHECK ===');
console.log('At 90° rotation (paper rotated counterclockwise when viewed from above):');
console.log('- Paper X-axis now points in world Z direction');
console.log('- Paper Z-axis now points in world -X direction');
console.log();
console.log('Click at world (0.1, 0) means:');
console.log('- To the RIGHT of paper center in world space');
console.log('- But this is at the BACK of the rotated paper (paper +Z direction)');
console.log(`- Paper-local: (${localX.toFixed(3)}, ${localZ.toFixed(3)})`);
console.log(`- Canvas: (${canvasPos.x}, ${canvasPos.y})`);
console.log();

// The expected behavior:
// - If paper-local Z is positive (back of paper), canvas Y should be near 0 (top)
// - If paper-local Z is negative (front of paper), canvas Y should be near 512 (bottom)
// - If paper-local X is positive (right of paper), canvas X should be near 512 (right)
// - If paper-local X is negative (left of paper), canvas X should be near 0 (left)

const normalizedX = (localX / PAPER_WIDTH) + 0.5;
const normalizedY = 1.0 - ((localZ / PAPER_DEPTH) + 0.5);
console.log(`Normalized coords: (${normalizedX.toFixed(3)}, ${normalizedY.toFixed(3)})`);
console.log(`Expected canvas: (${Math.floor(normalizedX * 512)}, ${Math.floor(normalizedY * 512)})`);

// Check if this matches what the function returns
console.log();
console.log('=== CONCLUSION ===');
if (canvasPos.x === Math.floor(normalizedX * 512) && canvasPos.y === Math.floor(normalizedY * 512)) {
  console.log('✓ Coordinate transformation is mathematically correct.');
  console.log('\nThe bug might be elsewhere:');
  console.log('1. Pen visual position not matching crosshairPoint');
  console.log('2. Texture UV mapping issue');
  console.log('3. Something with how the drawing is rendered on the 3D surface');
} else {
  console.log('✗ Coordinate transformation has an error!');
}
