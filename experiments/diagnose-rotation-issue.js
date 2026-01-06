/**
 * Diagnostic test to understand the rotation inversion issue
 *
 * The user reports that after rotating 90 degrees, when drawing a line from top to bottom,
 * the line is drawn from bottom to top (inverted).
 *
 * Let's simulate the transformation and identify the problem.
 */

// Simulate the camera setup
const CAMERA_POS = { x: 0, y: 4.5, z: 5.5 };
const CAMERA_LOOK_AT = { x: 0, y: 0, z: -1.5 };

// Paper dimensions
const PAPER_WIDTH = 0.28;
const PAPER_DEPTH = 0.4;
const CANVAS_SIZE = 512;

/**
 * Current implementation from renderer.js
 */
function worldToDrawingCoords_CURRENT(worldPos, rotation) {
  const objPos = { x: 0, y: 0, z: 0 }; // Assume paper at origin for simplicity

  // Calculate local offset from object center
  const localX = worldPos.x - objPos.x;
  const localZ = worldPos.z - objPos.z;

  // Apply inverse rotation
  const cos = Math.cos(-rotation);
  const sin = Math.sin(-rotation);
  const rotatedX = localX * cos - localZ * sin;
  const rotatedZ = localX * sin + localZ * cos;

  // Convert to normalized coordinates with Z-to-Y inversion
  const normalizedX = (rotatedX / PAPER_WIDTH) + 0.5;
  const normalizedY = 1.0 - ((rotatedZ / PAPER_DEPTH) + 0.5);

  return {
    x: Math.floor(normalizedX * CANVAS_SIZE),
    y: Math.floor(normalizedY * CANVAS_SIZE)
  };
}

/**
 * Test scenario: Paper at 90° rotation
 * User draws from top to bottom on the screen
 */
console.log("=" * 70);
console.log("DIAGNOSTIC TEST: Rotation Inversion Issue");
console.log("=" * 70);

console.log("\n📋 SCENARIO:");
console.log("- Paper rotated 90° (Math.PI/2 radians)");
console.log("- User moves pen from TOP of screen to BOTTOM");
console.log("- Expected: Line should be drawn following the pen movement");
console.log("- Issue: Line appears inverted\n");

// Paper at 90° rotation
const rotation90 = Math.PI / 2;

console.log("🔍 TEST 1: Understanding coordinate spaces at 90° rotation\n");

// When paper is at 90°:
// - Paper's "forward" (local -Z) points toward world +X
// - Paper's "right" (local +X) points toward world +Z
// - Paper's "up" (local +Y) stays as world +Y

// Simulate pen positions when user draws from top to bottom on screen
// At 90° rotation, what does "top to bottom" on screen mean?

console.log("Paper rotation: 90° (π/2)");
console.log("Paper at world origin (0, 0, 0)\n");

// Let's think about what happens:
// When paper is at 0°: paper faces camera (normal = +Z direction)
// When paper is at 90°: paper faces to the right (normal = +X direction)

// If user sees the paper rotated 90° and draws "down" on what they see:
// - The "down" direction on the ROTATED paper corresponds to a specific world direction

// Let's test with actual pen positions
const testPoints = [
  { name: "Top of visible paper (90°)", worldPos: { x: 0.2, y: 0, z: 0 } },
  { name: "Middle of visible paper (90°)", worldPos: { x: 0.1, y: 0, z: 0 } },
  { name: "Bottom of visible paper (90°)", worldPos: { x: 0, y: 0, z: 0 } },
];

console.log("Test: Drawing a vertical line on rotated paper (90°)");
console.log("World positions represent pen moving on the rotated paper:\n");

testPoints.forEach(({ name, worldPos }) => {
  const canvas = worldToDrawingCoords_CURRENT(worldPos, rotation90);
  console.log(`${name}:`);
  console.log(`  World: (${worldPos.x}, ${worldPos.z})`);
  console.log(`  Canvas: (${canvas.x}, ${canvas.y})`);
  console.log();
});

console.log("\n🔍 TEST 2: Paper at 0° vs 90° - Same screen position\n");

console.log("Scenario: Pen at top-center of paper as viewed from camera");
console.log();

// At 0° rotation: paper faces camera
// Top of paper (toward camera) = world Z = +0.2
const worldPos0deg = { x: 0, y: 0, z: 0.2 };
const canvas0deg = worldToDrawingCoords_CURRENT(worldPos0deg, 0);

console.log("At 0° rotation:");
console.log(`  World position: (${worldPos0deg.x}, ${worldPos0deg.z})`);
console.log(`  Canvas coords: (${canvas0deg.x}, ${canvas0deg.y})`);
console.log();

// At 90° rotation: paper faces right
// Same "top of paper" position = world X = +0.2 (because paper rotated)
const worldPos90deg = { x: 0.2, y: 0, z: 0 };
const canvas90deg = worldToDrawingCoords_CURRENT(worldPos90deg, Math.PI / 2);

console.log("At 90° rotation:");
console.log(`  World position: (${worldPos90deg.x}, ${worldPos90deg.z})`);
console.log(`  Canvas coords: (${canvas90deg.x}, ${canvas90deg.y})`);
console.log();

console.log("\n🔍 TEST 3: Line direction analysis\n");

console.log("Drawing a line from top to bottom at 90° rotation:");
console.log("(simulating mouse movement down on screen)\n");

// When paper is at 90°, and user moves mouse down:
// The pen should move along the paper's local -Z axis (which is world -X)
const lineStart = { x: 0.15, y: 0, z: 0 };  // Top of paper
const lineEnd = { x: -0.15, y: 0, z: 0 };   // Bottom of paper

const canvasStart = worldToDrawingCoords_CURRENT(lineStart, Math.PI / 2);
const canvasEnd = worldToDrawingCoords_CURRENT(lineEnd, Math.PI / 2);

console.log(`Line start (top): world (${lineStart.x}, ${lineStart.z}) → canvas (${canvasStart.x}, ${canvasStart.y})`);
console.log(`Line end (bottom): world (${lineEnd.x}, ${lineEnd.z}) → canvas (${canvasEnd.x}, ${canvasEnd.y})`);
console.log();

const deltaY = canvasEnd.y - canvasStart.y;
if (deltaY > 0) {
  console.log(`✓ Canvas Y increases: ${canvasStart.y} → ${canvasEnd.y} (CORRECT - line goes down)`);
} else if (deltaY < 0) {
  console.log(`✗ Canvas Y decreases: ${canvasStart.y} → ${canvasEnd.y} (WRONG - line goes up! INVERTED!)`);
} else {
  console.log(`? Canvas Y unchanged (line is horizontal)`);
}

console.log("\n🔍 TEST 4: Detailed coordinate transformation trace\n");

function traceTransformation(worldPos, rotation, label) {
  console.log(`--- ${label} ---`);
  console.log(`Input world position: (${worldPos.x.toFixed(3)}, ${worldPos.z.toFixed(3)})`);
  console.log(`Rotation: ${(rotation * 180 / Math.PI).toFixed(1)}°`);

  const objPos = { x: 0, z: 0 };
  const localX = worldPos.x - objPos.x;
  const localZ = worldPos.z - objPos.z;
  console.log(`Local offset: (${localX.toFixed(3)}, ${localZ.toFixed(3)})`);

  const cos = Math.cos(-rotation);
  const sin = Math.sin(-rotation);
  const rotatedX = localX * cos - localZ * sin;
  const rotatedZ = localX * sin + localZ * cos;
  console.log(`After inverse rotation: (${rotatedX.toFixed(3)}, ${rotatedZ.toFixed(3)})`);

  const normalizedX = (rotatedX / PAPER_WIDTH) + 0.5;
  const normalizedY_withoutInversion = (rotatedZ / PAPER_DEPTH) + 0.5;
  const normalizedY = 1.0 - normalizedY_withoutInversion;

  console.log(`Normalized (before inversion): X=${normalizedX.toFixed(3)}, Y=${normalizedY_withoutInversion.toFixed(3)}`);
  console.log(`Normalized (after Y inversion): X=${normalizedX.toFixed(3)}, Y=${normalizedY.toFixed(3)}`);

  const canvasX = Math.floor(normalizedX * CANVAS_SIZE);
  const canvasY = Math.floor(normalizedY * CANVAS_SIZE);
  console.log(`Canvas coords: (${canvasX}, ${canvasY})`);
  console.log();

  return { x: canvasX, y: canvasY };
}

traceTransformation({ x: 0.1, y: 0, z: 0 }, Math.PI / 2, "90° rotation, pen at +X");
traceTransformation({ x: -0.1, y: 0, z: 0 }, Math.PI / 2, "90° rotation, pen at -X");

console.log("\n💡 ANALYSIS:\n");
console.log("The issue is likely in how the coordinate system is interpreted");
console.log("when the paper is rotated. We need to understand:");
console.log("1. What direction does 'down on screen' correspond to in world space?");
console.log("2. How should that map to canvas coordinates?");
console.log("3. Is the inversion happening in the rotation or in the Y-axis mapping?");
console.log("\n" + "=".repeat(70));
