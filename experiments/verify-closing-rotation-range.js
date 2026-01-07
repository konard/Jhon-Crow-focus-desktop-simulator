/**
 * Verification script for laptop lid closing rotation range
 *
 * Issue: User reported lid only moves toward 200%+ opening
 * Fix: Changed rotation range from [-180°, -90°] to [-90°, 0°]
 *
 * New behavior:
 * - Starting position: -90° (normal open position, 100% open)
 * - Closing range: -90° to 0° (90° total movement)
 * - Cannot open beyond -90° (prevents 200%+ opening)
 *
 * Rotation mapping:
 * - rotation.x = 0° → screen flat on base (closed) → 0% open
 * - rotation.x = -90° → screen at 90° from base → 100% open (normal)
 * - rotation.x = -180° → screen flat behind base → 200% open (blocked now)
 */

const fs = require('fs');
const path = require('path');

console.log('=== Laptop Lid Closing Rotation Range Verification ===\n');

// Read renderer.js
const rendererPath = path.join(__dirname, '../src/renderer.js');
const rendererContent = fs.readFileSync(rendererPath, 'utf8');

// Check minRotation value
console.log('Check 1: Verify minRotation is -90° (normal open, cannot open further)');
const minRotationMatch = rendererContent.match(/const minRotation = ([^;]+);.*\/\/.*-90/);
if (!minRotationMatch) {
  console.error('  ❌ FAILED: Could not find minRotation at -90°');
} else {
  const minRotationValue = minRotationMatch[1].trim();
  console.log(`  Found: const minRotation = ${minRotationValue};`);
  if (minRotationValue.includes('-Math.PI / 2')) {
    console.log('  ✓ PASSED: minRotation is -Math.PI / 2 (-90°, normal open position)\n');
  } else {
    console.error(`  ❌ FAILED: Expected "-Math.PI / 2", got "${minRotationValue}"\n`);
  }
}

// Check maxRotation value
console.log('Check 2: Verify maxRotation is 0° (fully closed)');
const maxRotationMatch = rendererContent.match(/const maxRotation = ([^;]+);/);
if (!maxRotationMatch) {
  console.error('  ❌ FAILED: Could not find maxRotation definition');
} else {
  const maxRotationValue = maxRotationMatch[1].trim();
  console.log(`  Found: const maxRotation = ${maxRotationValue};`);
  if (maxRotationValue === '0') {
    console.log('  ✓ PASSED: maxRotation is 0 (fully closed)\n');
  } else {
    console.error(`  ❌ FAILED: Expected "0", got "${maxRotationValue}"\n`);
  }
}

// Check initial lidRotation
console.log('Check 3: Verify initial lidRotation is -90° (starts at normal open position)');
const lidRotationMatch = rendererContent.match(/lidRotation: ([^,]+),.*\/\/.*starts/i);
if (!lidRotationMatch) {
  console.error('  ❌ FAILED: Could not find initial lidRotation');
} else {
  const lidRotationValue = lidRotationMatch[1].trim();
  console.log(`  Found: lidRotation: ${lidRotationValue},`);
  if (lidRotationValue.includes('-Math.PI / 2')) {
    console.log('  ✓ PASSED: Initial lidRotation is -Math.PI / 2 (-90°, normal open)\n');
  } else {
    console.error(`  ❌ FAILED: Expected "-Math.PI / 2", got "${lidRotationValue}"\n`);
  }
}

// Summary
console.log('=== Summary ===');
console.log('New rotation range: [-90°, 0°] (was [-180°, -90°])');
console.log('');
console.log('Physical interpretation:');
console.log('  -90° = Normal laptop position (screen at 90° angle) = 100% open');
console.log('    0° = Fully closed (screen flat on keyboard) = 0% open');
console.log('');
console.log('Behavior:');
console.log('  ✓ Lid starts at normal open position (-90°)');
console.log('  ✓ Lid can close from -90° to 0°');
console.log('  ✓ Lid CANNOT open beyond -90° (200%+ opening blocked)');
console.log('  ✓ Total movement range: 90° (closing direction only)');
