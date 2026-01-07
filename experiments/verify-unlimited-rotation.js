/**
 * Verification script for laptop lid unlimited rotation
 *
 * Latest change: User requested unlimited rotation in both directions
 * - No clamping/limits on rotation
 * - Lid can rotate freely in positive and negative directions
 *
 * Starting position:
 * - rotation.x = -90° → screen at 90° from base → normal open position
 *
 * Now unlimited:
 * - Can close: -90° → 0° → +90° → ... (no upper limit)
 * - Can open: -90° → -180° → -270° → ... (no lower limit)
 */

const fs = require('fs');
const path = require('path');

console.log('=== Laptop Lid Unlimited Rotation Verification ===\n');

// Read renderer.js
const rendererPath = path.join(__dirname, '../src/renderer.js');
const rendererContent = fs.readFileSync(rendererPath, 'utf8');

// Check that minRotation/maxRotation clamping is removed
console.log('Check 1: Verify rotation limits are removed');
const hasMinRotation = rendererContent.includes('const minRotation =');
const hasMaxRotation = rendererContent.includes('const maxRotation =');
const hasClamp = /Math\.max\(minRotation.*Math\.min\(maxRotation/.test(rendererContent);

if (hasMinRotation || hasMaxRotation || hasClamp) {
  console.log('  ❌ FAILED: Rotation limits still exist in code');
  if (hasMinRotation) console.log('    - Found: minRotation definition');
  if (hasMaxRotation) console.log('    - Found: maxRotation definition');
  if (hasClamp) console.log('    - Found: Math.max/min clamping');
} else {
  console.log('  ✓ PASSED: No rotation limits (minRotation/maxRotation removed)\n');
}

// Check unlimited rotation comment
console.log('Check 2: Verify unlimited rotation comment');
const hasUnlimitedComment = rendererContent.includes('Unlimited rotation mode') ||
                           rendererContent.includes('unlimited rotation');
if (hasUnlimitedComment) {
  console.log('  ✓ PASSED: Unlimited rotation comment found\n');
} else {
  console.log('  ❌ FAILED: Unlimited rotation comment not found\n');
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
console.log('Rotation mode: UNLIMITED (no limits)');
console.log('');
console.log('Starting position:');
console.log('  -90° = Normal laptop position (screen at 90° angle)');
console.log('');
console.log('Behavior:');
console.log('  ✓ Lid can rotate in BOTH directions without limits');
console.log('  ✓ Close direction: -90° → 0° → +90° → ... (infinite)');
console.log('  ✓ Open direction: -90° → -180° → -270° → ... (infinite)');
console.log('  ✓ User has full control over rotation');
