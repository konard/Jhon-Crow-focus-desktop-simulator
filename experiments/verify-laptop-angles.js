// Verify laptop lid angle calculations
// Initial position: -90° (perpendicular to base)
// Range: 0° (closed) to -180° (fully open)

const initialRotation = -Math.PI / 2; // -90°
const minRotation = -Math.PI; // -180° (fully open)
const maxRotation = 0; // 0° (fully closed)

// Convert radians to degrees
const radToDeg = (rad) => (rad * 180 / Math.PI).toFixed(1);

console.log('=== Laptop Lid Rotation Angles ===\n');

console.log(`Initial position: ${radToDeg(initialRotation)}°`);
console.log(`  (Screen perpendicular to base, normal working position)\n`);

console.log(`Range: ${radToDeg(maxRotation)}° (closed) to ${radToDeg(minRotation)}° (fully open)\n`);

// Calculate closing range
const closingRange = initialRotation - maxRotation;
console.log(`From initial position (-90°):`);
console.log(`  Can close by: ${Math.abs(radToDeg(closingRange))}° (to ${radToDeg(maxRotation)}° - fully closed)`);

// Calculate opening range
const openingRange = minRotation - initialRotation;
console.log(`  Can open by: ${Math.abs(radToDeg(openingRange))}° (to ${radToDeg(minRotation)}° - fully open)\n`);

console.log('✅ Requirements met:');
console.log(`   - Can close 90° from starting position: ${Math.abs(closingRange) >= Math.PI / 2 ? 'YES' : 'NO'}`);
console.log(`   - Can open 85° from starting position: ${Math.abs(openingRange) >= (85 * Math.PI / 180) ? 'YES' : 'NO'}`);
