// Test script to verify the new angle system for laptop lid rotation
// New angle system:
//   0° = open perpendicular (screen at 90° to keyboard)
//   90° = closed (screen flat on keyboard)
//   -90° = fully open (screen leaning back)

const PI = Math.PI;

// Default values from renderer.js
const lidRotation = 0; // Starting position (perpendicular)
const targetLidRotation = 0;
const lidMinRotation = -PI / 2; // -90° = fully open
const lidMaxRotation = PI / 2;  // 90° = closed

console.log('=== New Angle System Test ===');
console.log('');
console.log('Default values:');
console.log(`  Starting rotation: ${(lidRotation * 180 / PI).toFixed(1)}° (expected: 0°)`);
console.log(`  Min rotation (fully open): ${(lidMinRotation * 180 / PI).toFixed(1)}° (expected: -90°)`);
console.log(`  Max rotation (closed): ${(lidMaxRotation * 180 / PI).toFixed(1)}° (expected: 90°)`);
console.log('');

// Test isLidOpen check
function isLidOpen(rotation) {
  return rotation < PI / 2 - 0.15; // Open if not nearly at 90° (closed)
}

console.log('isLidOpen check:');
console.log(`  At 0° (perpendicular): ${isLidOpen(0)} (expected: true)`);
console.log(`  At -90° (fully open): ${isLidOpen(-PI/2)} (expected: true)`);
console.log(`  At 90° (closed): ${isLidOpen(PI/2)} (expected: false)`);
console.log(`  At 81.4° (nearly closed): ${isLidOpen(PI/2 - 0.15)} (expected: false)`);
console.log(`  At 81.3° (still open): ${isLidOpen(PI/2 - 0.16)} (expected: true)`);
console.log('');

// Test isLidNearlyClosed check
function isLidNearlyClosed(rotation) {
  return Math.abs(rotation - PI / 2) < 0.15; // ~8.5 degrees threshold from closed
}

console.log('isLidNearlyClosed check:');
console.log(`  At 0° (perpendicular): ${isLidNearlyClosed(0)} (expected: false)`);
console.log(`  At -90° (fully open): ${isLidNearlyClosed(-PI/2)} (expected: false)`);
console.log(`  At 90° (closed): ${isLidNearlyClosed(PI/2)} (expected: true)`);
console.log(`  At 85° (almost closed): ${isLidNearlyClosed(85 * PI / 180)} (expected: true)`);
console.log(`  At 80° (not closed): ${isLidNearlyClosed(80 * PI / 180)} (expected: false)`);
console.log('');

// Test clamping logic
function clampRotation(newRotation, minRot, maxRot) {
  const lowerBound = Math.min(maxRot, minRot);
  const upperBound = Math.max(maxRot, minRot);
  return Math.max(lowerBound, Math.min(upperBound, newRotation));
}

console.log('Clamping logic:');
console.log(`  At -100° (beyond fully open): ${(clampRotation(-100 * PI / 180, lidMinRotation, lidMaxRotation) * 180 / PI).toFixed(1)}° (expected: -90°)`);
console.log(`  At 100° (beyond closed): ${(clampRotation(100 * PI / 180, lidMinRotation, lidMaxRotation) * 180 / PI).toFixed(1)}° (expected: 90°)`);
console.log(`  At 45° (in range): ${(clampRotation(45 * PI / 180, lidMinRotation, lidMaxRotation) * 180 / PI).toFixed(1)}° (expected: 45°)`);
console.log(`  At 0° (in range): ${(clampRotation(0, lidMinRotation, lidMaxRotation) * 180 / PI).toFixed(1)}° (expected: 0°)`);
console.log('');

// Test slider values
console.log('Slider UI values:');
console.log(`  Min slider range: -90° to 180°`);
console.log(`  Max slider range: -90° to 180°`);
console.log(`  Default Min value: ${Math.round(lidMinRotation * 180 / PI)}° (expected: -90°)`);
console.log(`  Default Max value: ${Math.round(lidMaxRotation * 180 / PI)}° (expected: 90°)`);
console.log('');

console.log('=== All tests passed if expected values match! ===');
