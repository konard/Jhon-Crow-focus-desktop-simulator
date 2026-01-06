/**
 * Final diagnostic test to identify the exact issue
 *
 * This test simulates exactly what the user described:
 * "после поворота на 90 deg, когда провожу линию сверху вниз - проводится линия снизу вверх"
 * "after rotating 90 degrees, when I draw a line from top to bottom - a line is drawn from bottom to top"
 */

const PAPER_WIDTH = 0.28;
const PAPER_DEPTH = 0.4;
const CANVAS_SIZE = 512;

// Current implementation from renderer.js
function worldToDrawingCoords(worldPos, rotation) {
  const objPos = { x: 0, z: 0 };

  const localX = worldPos.x - objPos.x;
  const localZ = worldPos.z - objPos.z;

  const cos = Math.cos(-rotation);
  const sin = Math.sin(-rotation);
  const rotatedX = localX * cos - localZ * sin;
  const rotatedZ = localX * sin + localZ * cos;

  const normalizedX = (rotatedX / PAPER_WIDTH) + 0.5;
  const normalizedY = 1.0 - ((rotatedZ / PAPER_DEPTH) + 0.5);

  return {
    x: Math.floor(normalizedX * CANVAS_SIZE),
    y: Math.floor(normalizedY * CANVAS_SIZE)
  };
}

console.log("=".repeat(80));
console.log("FINAL DIAGNOSTIC: Understanding the User's Issue");
console.log("=".repeat(80));

console.log("\n🎯 USER'S EXACT COMPLAINT:\n");
console.log("After 90° rotation, drawing top→bottom produces bottom→top line\n");

console.log("📋 KEY QUESTION:\n");
console.log("What does 'top to bottom' mean?");
console.log("Option A: Mouse movement top to bottom on SCREEN");
console.log("Option B: Drawing from visual top to bottom on the ROTATED PAPER\n");

console.log("Let's test BOTH interpretations:\n");
console.log("=".repeat(80));

console.log("\n🧪 TEST 1: Option A - Mouse movement on screen\n");
console.log("Paper at 90° rotation (rotated clockwise when viewed from above)");
console.log("User moves mouse from TOP of screen to BOTTOM of screen");
console.log("What happens in world space?");
console.log();

// This requires understanding the camera and raycasting
// Camera at (0, 4.5, 5.5) looking at (0, 0, -1.5)
// When user moves mouse down on screen, the raycast moves in a specific world direction
// But this depends on where on the paper they're drawing...

console.log("For this test, we need to make assumptions about raycasting.");
console.log("Let's skip to Option B which is more concrete.\n");

console.log("=".repeat(80));

console.log("\n🧪 TEST 2: Option B - Drawing on rotated paper\n");
console.log("Paper at 90° rotation");
console.log("User sees the paper rotated 90° on screen");
console.log("User draws from what LOOKS like top to bottom on that rotated paper");
console.log();

// When paper is at 90°:
// - Paper's local -Z (which was pointing toward camera at 0°) now points to world -X
// - Paper's local +X (which was pointing right at 0°) now points to world +Z

// If user draws from "top to bottom" on the visible rotated paper:
// This means drawing along the direction that LOOKS vertical on screen
// When paper is at 90°, what looks vertical on the rotated paper?

console.log("Let me think about the coordinate system:");
console.log("- At 0°: paper local -Z points to world +Z (toward camera)");
console.log("- At 90°: paper local -Z points to world +X (to the right)");
console.log();
console.log("If 'top of paper' means 'toward camera' always:");
console.log("- At 0°: top = world +Z");
console.log("- At 90°: top = world +X (because paper rotated)");
console.log();

// Test drawing from world +X to -X at 90° rotation
const rotation90 = Math.PI / 2;
console.log("Test: Draw from world +X to -X at 90° rotation");
console.log("(This represents drawing from right to left in world space)");
console.log("(Which is top to bottom on the rotated paper)\n");

const topPoint = { x: 0.15, z: 0 };
const bottomPoint = { x: -0.15, z: 0 };

const canvasTop = worldToDrawingCoords(topPoint, rotation90);
const canvasBottom = worldToDrawingCoords(bottomPoint, rotation90);

console.log(`Top of paper:    world (${topPoint.x}, ${topPoint.z}) → canvas (${canvasTop.x}, ${canvasTop.y})`);
console.log(`Bottom of paper: world (${bottomPoint.x}, ${bottomPoint.z}) → canvas (${canvasBottom.x}, ${canvasBottom.y})`);
console.log();

const deltaY = canvasBottom.y - canvasTop.y;
console.log(`Canvas Y delta: ${deltaY}`);

if (deltaY > 0) {
  console.log("✓ Canvas Y INCREASES → Line goes DOWN on canvas → CORRECT");
} else if (deltaY < 0) {
  console.log("✗ Canvas Y DECREASES → Line goes UP on canvas → INVERTED!");
} else {
  console.log("? Canvas Y unchanged → Line is HORIZONTAL");
}

console.log("\n" + "=".repeat(80));
console.log("🔍 DETAILED TRANSFORMATION TRACE");
console.log("=".repeat(80));

console.log("\n--- Top point ---");
console.log(`World: (${topPoint.x}, ${topPoint.z})`);
const cos = Math.cos(-rotation90);
const sin = Math.sin(-rotation90);
const rotatedTopX = topPoint.x * cos - topPoint.z * sin;
const rotatedTopZ = topPoint.x * sin + topPoint.z * cos;
console.log(`After inverse rotation: (${rotatedTopX.toFixed(3)}, ${rotatedTopZ.toFixed(3)})`);
const normTopX = (rotatedTopX / PAPER_WIDTH) + 0.5;
const normTopY = 1.0 - ((rotatedTopZ / PAPER_DEPTH) + 0.5);
console.log(`Normalized: (${normTopX.toFixed(3)}, ${normTopY.toFixed(3)})`);
console.log(`Canvas: (${Math.floor(normTopX * CANVAS_SIZE)}, ${Math.floor(normTopY * CANVAS_SIZE)})`);

console.log("\n--- Bottom point ---");
console.log(`World: (${bottomPoint.x}, ${bottomPoint.z})`);
const rotatedBottomX = bottomPoint.x * cos - bottomPoint.z * sin;
const rotatedBottomZ = bottomPoint.x * sin + bottomPoint.z * cos;
console.log(`After inverse rotation: (${rotatedBottomX.toFixed(3)}, ${rotatedBottomZ.toFixed(3)})`);
const normBottomX = (rotatedBottomX / PAPER_WIDTH) + 0.5;
const normBottomY = 1.0 - ((rotatedBottomZ / PAPER_DEPTH) + 0.5);
console.log(`Normalized: (${normBottomX.toFixed(3)}, ${normBottomY.toFixed(3)})`);
console.log(`Canvas: (${Math.floor(normBottomX * CANVAS_SIZE)}, ${Math.floor(normBottomY * CANVAS_SIZE)})`);

console.log("\n" + "=".repeat(80));
console.log("💡 CONCLUSION");
console.log("=".repeat(80));

if (deltaY < 0) {
  console.log("\n❌ BUG CONFIRMED!");
  console.log("The coordinate transformation IS producing inverted Y coordinates at 90° rotation.");
  console.log();
  console.log("Root cause:");
  console.log("The Y-axis inversion `1.0 - (...)` was designed for 0° rotation,");
  console.log("but at 90° rotation, the relationship between rotatedZ and visual position changes.");
  console.log();
  console.log("🔧 SOLUTION:");
  console.log("We need canvas rotation compensation as the user requested!");
  console.log("1. Don't apply rotation transformation to coordinates");
  console.log("2. Draw in world/screen space on canvas");
  console.log("3. Counter-rotate canvas content when paper rotates");
  console.log("4. This keeps coordinates simple and visual appearance stable");
} else {
  console.log("\n✓ Coordinates appear correct in this test.");
  console.log("The issue might be elsewhere in the implementation.");
}

console.log("\n" + "=".repeat(80));
