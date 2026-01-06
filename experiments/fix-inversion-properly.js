/**
 * Fix for the inversion issue at 90° rotation
 *
 * User's issue: After rotating 90°, drawing from top to bottom creates a line from bottom to top.
 *
 * Root cause analysis from our diagnostic test showed:
 * - Line start (top): world (0.15, 0) → canvas (256, 448)
 * - Line end (bottom): world (-0.15, 0) → canvas (255, 64)
 * - Result: Canvas Y decreases (448 → 64) when it should increase!
 *
 * The problem is in how we map rotatedZ to canvas Y.
 */

const PAPER_WIDTH = 0.28;
const PAPER_DEPTH = 0.4;
const CANVAS_SIZE = 512;

console.log("=".repeat(80));
console.log("FIXING THE INVERSION AT 90° ROTATION");
console.log("=".repeat(80));

console.log("\n🔍 ROOT CAUSE:\n");
console.log("After inverse rotation at 90°:");
console.log("- Pen at world +X → rotatedZ = -0.1 → normalized Y = 0.75 → canvas Y = 384");
console.log("- Pen at world -X → rotatedZ = +0.1 → normalized Y = 0.25 → canvas Y = 128");
console.log();
console.log("But from the CAMERA's perspective at 90° rotation:");
console.log("- World +X is BOTTOM of the rotated paper (far from camera)");
console.log("- World -X is TOP of the rotated paper (close to camera)");
console.log();
console.log("So the mapping is backwards!");
console.log();

console.log("💡 THE REAL ISSUE:\n");
console.log("The problem is that the Y-inversion (1.0 - ...) was added to fix 0° rotation,");
console.log("but it breaks 90° rotation.");
console.log();
console.log("At 0° rotation:");
console.log("- Moving mouse DOWN on screen = moving pen toward -Z (away from camera)");
console.log("- rotatedZ becomes more negative");
console.log("- We need Y inversion so canvas Y increases");
console.log();
console.log("At 90° rotation:");
console.log("- Moving mouse DOWN on screen = moving pen toward -X (to the left)");
console.log("- After rotation transform, this affects rotatedZ");
console.log("- But the direction is OPPOSITE to 0° case!");
console.log();

console.log("🤔 DEEPER ANALYSIS:\n");

function analyzeRotation(rotation, penMovement) {
  console.log(`\nRotation: ${(rotation * 180 / Math.PI).toFixed(0)}°`);
  console.log(`Pen movement: ${penMovement}`);

  // Start and end positions based on movement direction
  let worldStart, worldEnd;

  if (rotation === 0) {
    // At 0°, paper faces +Z (toward camera)
    // "Down" on screen means moving toward -Z
    worldStart = { x: 0, z: 0.15 };  // Top (toward camera)
    worldEnd = { x: 0, z: -0.15 };   // Bottom (away from camera)
  } else if (Math.abs(rotation - Math.PI / 2) < 0.01) {
    // At 90°, paper faces +X (to the right)
    // "Down" on screen means... wait, which direction?
    // Camera is at (0, 4.5, 5.5) looking at (0, 0, -1.5)
    // Paper normal at 90° points to +X
    // Moving "down" on the visible paper...

    // Actually, let's think about it differently:
    // The paper rotates around Y axis
    // At 0°: paper normal = +Z, "up on paper" = -Z
    // At 90°: paper normal = +X, "up on paper" = -Z still? No!

    // Paper local coordinates:
    // - Local +X = paper's right
    // - Local +Z = paper's forward (away from the normal)
    // - Local +Y = paper's up (perpendicular to surface)

    // At 0° rotation:
    // - Local +X → World +X (right)
    // - Local +Z → World +Z (forward/toward camera)
    // - Local +Y → World +Y (up)

    // At 90° rotation (around Y axis):
    // - Local +X → World +Z (what was right is now forward)
    // - Local +Z → World -X (what was forward is now left)
    // - Local +Y → World +Y (up unchanged)

    // So when user sees paper at 90° and moves pen "down" on the visible paper surface:
    // - This is moving in local -Z direction
    // - Which is world +X direction

    worldStart = { x: -0.15, z: 0 };  // Top of rotated paper
    worldEnd = { x: 0.15, z: 0 };     // Bottom of rotated paper

    // Wait, let me reconsider...
    // At 90° rotation, viewing from camera:
    // The paper appears rotated 90° clockwise (when viewed from above)
    // What was the "top" of the paper (toward camera at 0°) is now pointing to the RIGHT
    // What is now the "top" (toward camera) is what was the LEFT side of the paper

    // Let me use the camera position to determine "up" and "down":
    // Camera at (0, 4.5, 5.5) looking at (0, 0, -1.5)
    // The "up" direction on screen is world -Z (toward camera in Z)
    // The "down" direction on screen is world +Z (away from camera in Z)... no wait

    // Actually the camera is looking DOWN and FORWARD
    // Screen "up" is approximately world +Y and +Z
    // Screen "down" is approximately world -Y and -Z

    // This is getting confusing. Let me think about raycasting instead.
  }

  console.log(`World start: (${worldStart.x}, ${worldStart.z})`);
  console.log(`World end: (${worldEnd.x}, ${worldEnd.z})`);

  // Apply transformation
  const cos = Math.cos(-rotation);
  const sin = Math.sin(-rotation);

  const rotatedStartX = worldStart.x * cos - worldStart.z * sin;
  const rotatedStartZ = worldStart.x * sin + worldStart.z * cos;

  const rotatedEndX = worldEnd.x * cos - worldEnd.z * sin;
  const rotatedEndZ = worldEnd.x * sin + worldEnd.z * cos;

  console.log(`Rotated start: (${rotatedStartX.toFixed(3)}, ${rotatedStartZ.toFixed(3)})`);
  console.log(`Rotated end: (${rotatedEndX.toFixed(3)}, ${rotatedEndZ.toFixed(3)})`);

  const normStartY = 1.0 - ((rotatedStartZ / PAPER_DEPTH) + 0.5);
  const normEndY = 1.0 - ((rotatedEndZ / PAPER_DEPTH) + 0.5);

  const canvasStartY = Math.floor(normStartY * CANVAS_SIZE);
  const canvasEndY = Math.floor(normEndY * CANVAS_SIZE);

  console.log(`Canvas start Y: ${canvasStartY}`);
  console.log(`Canvas end Y: ${canvasEndY}`);

  if (canvasEndY > canvasStartY) {
    console.log(`✓ Correct: Y increases (line goes down)`);
  } else {
    console.log(`✗ Wrong: Y decreases (line goes up - INVERTED!)`);
  }
}

analyzeRotation(0, "Mouse down on screen");
analyzeRotation(Math.PI / 2, "Mouse down on screen");

console.log("\n" + "=".repeat(80));
console.log("🎯 SOLUTION");
console.log("=".repeat(80));

console.log("\nThe issue is that we're trying to use ONE formula for all rotations,");
console.log("but the relationship between screen movement and canvas coordinates");
console.log("changes with rotation.");
console.log();
console.log("Actually, wait. Let me reconsider the whole approach.");
console.log();
console.log("The user wants:");
console.log("1. Pen draws at its world position tip");
console.log("2. Drawing should appear stable from viewer perspective when paper rotates");
console.log();
console.log("This means we should NOT use paper-local coordinates at all!");
console.log("We should use SCREEN-SPACE or CAMERA-SPACE coordinates!");
console.log();
console.log("Alternative approach:");
console.log("- Canvas represents the VIEW from the camera, not the paper surface");
console.log("- When paper rotates, canvas content rotates to compensate");
console.log("- Drawing coordinates are in camera/view space");
console.log();
console.log("This matches what the user asked for:");
console.log('\"поворот изображения нарисованного на холсте должен компенсировать поворот холста\"');
console.log('\"the rotation of the drawn image should compensate for the canvas rotation\"');
console.log();
