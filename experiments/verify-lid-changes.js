/**
 * Verification script for laptop lid rotation changes
 *
 * Changes made:
 * 1. Starting position is closed (0°) instead of open (-90°)
 * 2. Min rotation limit at 0° (cannot close further)
 * 3. Max rotation limit configurable, default -130°
 * 4. Lower half of screen allows moving laptop (not just rotating lid)
 * 5. Edit mode has min/max angle controls
 */

const fs = require('fs');
const path = require('path');

const rendererPath = path.join(__dirname, '..', 'src', 'renderer.js');
const content = fs.readFileSync(rendererPath, 'utf8');

let allPassed = true;

function check(description, condition) {
  if (condition) {
    console.log(`✓ ${description}`);
  } else {
    console.log(`✗ ${description}`);
    allPassed = false;
  }
}

// Check 1: Initial lid rotation starts at 0 (closed)
check(
  'Initial lidRotation is 0 (closed position)',
  content.includes('lidRotation: 0, // Current lid rotation (starts at 0° closed position)')
);

// Check 2: Initial target rotation is 0
check(
  'Initial targetLidRotation is 0',
  content.includes('targetLidRotation: 0, // Target lid rotation for smooth animation (starts at 0° closed position)')
);

// Check 3: Screen group starts at 0° rotation
check(
  'Screen group rotation.x starts at 0 (closed)',
  content.includes('screenGroup.rotation.x = 0; // Start at closed position')
);

// Check 4: lidMinRotation property exists
check(
  'lidMinRotation property exists (default 0°)',
  content.includes('lidMinRotation: 0, // Minimum lid rotation')
);

// Check 5: lidMaxRotation property exists
check(
  'lidMaxRotation property exists (default -130°)',
  content.includes('lidMaxRotation: -Math.PI * 130 / 180')
);

// Check 6: Rotation limits are applied
check(
  'Rotation limits are applied using Math.max/min',
  content.includes('newRotation = Math.max(maxRotation, Math.min(minRotation, newRotation))')
);

// Check 7: Lower half detection for open lid
check(
  'Open lid click detection checks upper/lower half',
  content.includes('clickedOnUpperHalf = localPointOpen.y > 0.25')
);

// Check 8: Lower half allows moving laptop
check(
  'Lower half click allows moving laptop when lid is open',
  content.includes("'Moving laptop (grabbed lower screen)'")
);

// Check 9: Edit mode has lid angle controls
check(
  'Edit mode has lid min angle slider',
  content.includes('id="laptop-lid-min-angle"')
);

check(
  'Edit mode has lid max angle slider',
  content.includes('id="laptop-lid-max-angle"')
);

// Check 10: Save includes lid rotation settings
check(
  'Save includes lidMinRotation',
  content.includes('data.lidMinRotation = obj.userData.lidMinRotation')
);

check(
  'Save includes lidMaxRotation',
  content.includes('data.lidMaxRotation = obj.userData.lidMaxRotation')
);

check(
  'Save includes lidRotation state',
  content.includes('data.lidRotation = obj.userData.lidRotation')
);

// Check 11: Load restores lid rotation settings
check(
  'Load restores lidMinRotation',
  content.includes('obj.userData.lidMinRotation = objData.lidMinRotation')
);

check(
  'Load restores lidMaxRotation',
  content.includes('obj.userData.lidMaxRotation = objData.lidMaxRotation')
);

check(
  'Load restores lidRotation and updates visual',
  content.includes('screenGroup.rotation.x = objData.lidRotation')
);

// Check 12: Event handlers for lid angle sliders
check(
  'Event handlers for lid min angle slider',
  content.includes("getElementById('laptop-lid-min-angle')")
);

check(
  'Event handlers for lid max angle slider',
  content.includes("getElementById('laptop-lid-max-angle')")
);

console.log('\n' + '='.repeat(50));
if (allPassed) {
  console.log('All checks passed! ✓');
  process.exit(0);
} else {
  console.log('Some checks failed! ✗');
  process.exit(1);
}
