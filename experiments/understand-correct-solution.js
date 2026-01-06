/**
 * Understanding the correct solution for rotation drawing
 *
 * KEY INSIGHT:
 * The user's requirement is that the DRAWING should stay visually stable from the observer's perspective.
 * When you rotate the paper, the drawing should NOT appear to rotate.
 *
 * This means we need to:
 * 1. Draw at the pen tip position (in world space)
 * 2. Compensate for paper rotation so the drawing appears stable to the viewer
 */

const PAPER_WIDTH = 0.28;
const PAPER_DEPTH = 0.4;
const CANVAS_SIZE = 512;

console.log("=".repeat(70));
console.log("UNDERSTANDING THE CORRECT SOLUTION");
console.log("=".repeat(70));

console.log("\n📋 USER REQUIREMENT:");
console.log("When the paper rotates, the drawing should NOT rotate from the viewer's perspective.");
console.log("The pen should draw under its tip, but the canvas content should compensate");
console.log("for the paper's rotation.\n");

console.log("🎯 CORRECT BEHAVIOR:\n");
console.log("Scenario: User draws letter 'A' on paper at 0° rotation");
console.log("Step 1: Paper at 0°, user draws 'A' → Drawing shows 'A'");
console.log("Step 2: Paper rotates to 90°");
console.log("  - From VIEWER perspective: 'A' should still look like 'A' (not rotated)");
console.log("  - From PAPER perspective: The canvas content needs to compensate");
console.log("Step 3: User continues drawing at 90°");
console.log("  - New strokes should follow pen tip");
console.log("  - But be added in a way that compensates for rotation\n");

console.log("🔍 SOLUTION APPROACH:\n");

console.log("Option A: Rotate canvas content to compensate");
console.log("  - When paper rotates +45°, rotate canvas content -45°");
console.log("  - This keeps the visual appearance stable");
console.log("  - New drawing coords must be rotated to match canvas orientation");
console.log();

console.log("Option B: Don't rotate canvas, but map coords differently");
console.log("  - Keep canvas in paper-local space");
console.log("  - Let the 3D mesh rotation handle visual display");
console.log("  - This is WRONG for the requirement!");
console.log();

console.log("💡 THE ISSUE WITH CURRENT CODE:\n");
console.log("Current code uses Option B - it transforms to paper-local space.");
console.log("This makes the drawing rotate with the paper from viewer's perspective.");
console.log("User's feedback confirms this is NOT the desired behavior.\n");

console.log("✅ CORRECT SOLUTION:\n");
console.log("We need to implement Option A:");
console.log("1. Track paper rotation changes");
console.log("2. When rotation changes, rotate canvas content by -delta");
console.log("3. For new drawing, apply rotation to coordinates");
console.log();

console.log("🧪 TESTING THE THEORY:\n");

// Simulate the correct coordinate transformation
function worldToCanvasWithCompensation(worldPos, paperRotation) {
  const objPos = { x: 0, z: 0 };

  // Get position relative to paper center in world space
  const localX = worldPos.x - objPos.x;
  const localZ = worldPos.z - objPos.z;

  // DON'T rotate the coordinates!
  // We want to draw in WORLD space on the canvas
  // The canvas itself will be visually rotated by the 3D mesh

  // Wait, that's still not right...
  // Let me think about this differently

  // The canvas is a texture on the paper
  // When paper rotates, texture rotates with it
  // To keep drawing stable, we need to:
  //   1. Rotate canvas texture by -paperRotation
  //   2. Draw coordinates in rotated space

  // Actually, let's approach this from first principles:
  // - Canvas texture is mapped to paper mesh
  // - Canvas has its own 2D coordinate system (0-512, 0-512)
  // - When we draw at canvas (100, 100), that pixel appears at a certain world position
  // - When paper rotates, that world position changes
  // - To keep the pixel appearing at the same screen position, we need to:
  //   Either rotate the canvas texture, OR adjust where we draw

  // Hmm, let me reconsider the user's comment more carefully...
}

console.log("🤔 RE-READING USER FEEDBACK:\n");
console.log('User said (translated):');
console.log('"Направление рисования теперь правильное, но картинка поворачивается');
console.log('относительно наблюдателя (для наблюдателя изменений быть не должно)."');
console.log();
console.log('Translation: "The drawing direction is now correct, but the picture rotates');
console.log('relative to the observer (for the observer there should be no changes)."');
console.log();
console.log('User then said:');
console.log('"То есть поворот изображения нарисованного на холсте должен компенсировать');
console.log('поворот холста (например копировать всё что уже нарисовано и вставлять с');
console.log('определённым поворотом)."');
console.log();
console.log('Translation: "That is, the rotation of the image drawn on the canvas should');
console.log('compensate for the rotation of the canvas (for example, copy everything that');
console.log('is already drawn and paste with a certain rotation)."');
console.log();

console.log("💡 CLEAR REQUIREMENT:\n");
console.log("The user wants:");
console.log("1. Drawing position follows pen tip ✓");
console.log("2. When paper rotates, canvas content should counter-rotate");
console.log("3. Result: From viewer perspective, drawing appears stationary\n");

console.log("🔧 IMPLEMENTATION STRATEGY:\n");
console.log("In updateDrawingTexture():");
console.log("1. Detect rotation change: if (currentRotation !== lastRotation)");
console.log("2. Calculate delta: rotationDelta = currentRotation - lastRotation");
console.log("3. Rotate canvas content by -rotationDelta");
console.log("   - Create temporary canvas");
console.log("   - Draw rotated current content");
console.log("   - Replace original");
console.log("4. Update lastRotation");
console.log();
console.log("In worldToDrawingCoords():");
console.log("1. Transform world pos to paper-local coords (with rotation)");
console.log("2. Map to canvas coords");
console.log("3. The coordinates are already in the right space because we");
console.log("   rotated the canvas content!\n");

console.log("=".repeat(70));
