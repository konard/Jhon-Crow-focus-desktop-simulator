/**
 * Test script to verify the collision changes work correctly
 * Run with: node experiments/test-collision-changes.js
 */

// Mock THREE.js objects
const THREE = {
  Group: class {
    constructor() {
      this.userData = {};
      this.position = { x: 0, y: 0, z: 0, copy: function(p) { this.x = p.x; this.y = p.y; this.z = p.z; } };
      this.scale = { x: 1, y: 1, z: 1 };
      this.rotation = { x: 0, y: 0, z: 0 };
    }
  }
};

// Extract relevant code from renderer.js for testing
const OBJECT_PHYSICS = {
  'clock': { weight: 0.5, stability: 0.5, height: 0.6, baseOffset: 0.35, friction: 0.4, noStackingOnTop: true },
  'lamp': { weight: 1.2, stability: 0.85, height: 0.9, baseOffset: 0, friction: 0.5 },
  'laptop': { weight: 1.5, stability: 0.95, height: 0.3, baseOffset: 0, friction: 0.6 },
  'notebook': { weight: 0.3, stability: 0.95, height: 0.1, baseOffset: 0, friction: 0.7 },
  'photo-frame': { weight: 0.3, stability: 0.35, height: 0.5, baseOffset: 0.25, friction: 0.4, noStackingOnTop: true }
};

function getObjectPhysics(object) {
  const type = object.userData.type;
  return OBJECT_PHYSICS[type] || { weight: 0.5, stability: 0.5, height: 0.3, baseOffset: 0, friction: 0.5 };
}

// Updated getExtraCollisionPoints matching the new implementation
function getExtraCollisionPoints(object) {
  const type = object.userData.type;
  const scale = object.scale?.x || 1;
  const objectRotationY = object.rotation?.y || 0;

  // Laptop has multiple collision points along the tilted monitor screen
  if (type === 'laptop') {
    const points = [];
    // The laptop screen is at (0, 0.28, -0.23) rotated -PI/6 (30 deg backward)
    // Screen is 0.78 wide (x) and 0.5 tall (y before rotation)
    // After rotation, the screen extends backward (negative Z) and upward
    const screenTilt = Math.PI / 6; // 30 degrees
    const screenHeight = 0.5;
    const screenWidth = 0.78;
    const screenCenterY = 0.28;
    const screenCenterZ = -0.23;

    // Calculate the bottom and top edges of the tilted screen
    // Bottom edge is at -screenHeight/2 from center, rotated by screenTilt
    const bottomEdgeY = screenCenterY - (screenHeight / 2) * Math.cos(screenTilt);
    const bottomEdgeZ = screenCenterZ + (screenHeight / 2) * Math.sin(screenTilt);
    // Top edge is at +screenHeight/2 from center, rotated by screenTilt
    const topEdgeY = screenCenterY + (screenHeight / 2) * Math.cos(screenTilt);
    const topEdgeZ = screenCenterZ - (screenHeight / 2) * Math.sin(screenTilt);

    // Create 5 small collision cylinders spread across the screen width
    // Each cylinder extends from keyboard level to top of screen
    const numPoints = 5;
    const collisionRadius = 0.04; // Small radius for each collision point

    // Collision should start from keyboard level (y=0.03) and extend to top of screen
    const keyboardLevel = 0.03;
    const collisionHeight = topEdgeY - keyboardLevel; // From keyboard to top of screen

    for (let i = 0; i < numPoints; i++) {
      // Spread points along the X axis (screen width)
      const t = (i / (numPoints - 1)) - 0.5; // -0.5 to 0.5
      const xOffset = t * (screenWidth - 0.1); // Leave small margin at edges

      // Position collision cylinder at the center Z of the screen (between bottom and top edges)
      const centerZ = (bottomEdgeZ + topEdgeZ) / 2;

      points.push({
        x: xOffset * scale,
        z: centerZ * scale,
        radius: collisionRadius * scale,
        height: collisionHeight * scale,
        baseY: keyboardLevel * scale, // Start from keyboard level
        rotation: objectRotationY // Store object's Y rotation for collision detection
      });
    }

    return points;
  }

  // No extra collision points for other objects
  return [];
}

// Collision detection helper matching the new implementation
function checkExtraCollisionPoints(pointX, pointZ, pointRadius, pointY, targetObj) {
  const extraPoints = getExtraCollisionPoints(targetObj);
  if (extraPoints.length === 0) return null;

  for (const point of extraPoints) {
    // Apply rotation to transform local collision point to world space
    const rotation = point.rotation || 0;
    const cosR = Math.cos(rotation);
    const sinR = Math.sin(rotation);

    // Rotate the local x,z offset by the object's Y rotation
    const rotatedX = point.x * cosR - point.z * sinR;
    const rotatedZ = point.x * sinR + point.z * cosR;

    // Calculate world position of this collision point
    const collisionX = targetObj.position.x + rotatedX;
    const collisionZ = targetObj.position.z + rotatedZ;
    const collisionY = targetObj.position.y + point.baseY;

    // Check horizontal distance
    const dx = pointX - collisionX;
    const dz = pointZ - collisionZ;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const minDist = pointRadius + point.radius;

    // Check if collision occurs
    if (dist < minDist && dist > 0.01) {
      // Check vertical overlap
      const pointBottom = pointY;
      const pointTop = pointY + 0.1;
      const collisionTop = collisionY + point.height;

      if (pointBottom < collisionTop && pointTop > collisionY) {
        return {
          dx: dx,
          dz: dz,
          dist: dist,
          minDist: minDist,
          collisionX: collisionX,
          collisionZ: collisionZ
        };
      }
    }
  }
  return null;
}

// Tests
console.log('Testing collision changes...\n');

// Test 1: noStackingOnTop property
console.log('Test 1: noStackingOnTop property');
const clockPhysics = OBJECT_PHYSICS['clock'];
const photoFramePhysics = OBJECT_PHYSICS['photo-frame'];
const laptopPhysics = OBJECT_PHYSICS['laptop'];
const lampPhysics = OBJECT_PHYSICS['lamp'];

console.log(`  Clock noStackingOnTop: ${clockPhysics.noStackingOnTop === true ? 'PASS' : 'FAIL'}`);
console.log(`  Photo-frame noStackingOnTop: ${photoFramePhysics.noStackingOnTop === true ? 'PASS' : 'FAIL'}`);
console.log(`  Laptop noStackingOnTop: ${laptopPhysics.noStackingOnTop === undefined ? 'PASS (undefined = allows stacking)' : 'FAIL'}`);
console.log(`  Lamp noStackingOnTop: ${lampPhysics.noStackingOnTop === undefined ? 'PASS (undefined = allows stacking)' : 'FAIL'}`);

// Test 2: Extra collision points for laptop
console.log('\nTest 2: Extra collision points for laptop');
const mockLaptop = new THREE.Group();
mockLaptop.userData.type = 'laptop';

const laptopPoints = getExtraCollisionPoints(mockLaptop);
console.log(`  Laptop has ${laptopPoints.length} collision points: ${laptopPoints.length === 5 ? 'PASS' : 'FAIL'}`);

if (laptopPoints.length > 0) {
  const firstPoint = laptopPoints[0];
  const lastPoint = laptopPoints[4];
  console.log(`  First point x: ${firstPoint.x.toFixed(3)}`);
  console.log(`  First point z: ${firstPoint.z.toFixed(3)}`);
  console.log(`  First point baseY: ${firstPoint.baseY.toFixed(3)}`);
  console.log(`  First point height: ${firstPoint.height.toFixed(3)}`);
  console.log(`  Points spread across X axis: ${firstPoint.x < 0 && lastPoint.x > 0 ? 'PASS' : 'FAIL'}`);

  // Verify baseY starts from keyboard level (0.03)
  console.log(`  Collision starts at keyboard level (0.03): ${Math.abs(firstPoint.baseY - 0.03) < 0.001 ? 'PASS' : 'FAIL'}`);

  // Verify height extends to top of screen
  const expectedTopY = 0.28 + (0.5 / 2) * Math.cos(Math.PI / 6); // ~0.497
  const actualTop = firstPoint.baseY + firstPoint.height;
  console.log(`  Collision extends to top of screen (${expectedTopY.toFixed(3)}): ${Math.abs(actualTop - expectedTopY) < 0.01 ? 'PASS' : 'FAIL'}`);
}

// Test 3: No extra collision points for other objects
console.log('\nTest 3: No extra collision points for non-laptop objects');
const mockClock = new THREE.Group();
mockClock.userData.type = 'clock';
const clockPoints = getExtraCollisionPoints(mockClock);
console.log(`  Clock has ${clockPoints.length} extra points: ${clockPoints.length === 0 ? 'PASS' : 'FAIL'}`);

const mockNotebook = new THREE.Group();
mockNotebook.userData.type = 'notebook';
const notebookPoints = getExtraCollisionPoints(mockNotebook);
console.log(`  Notebook has ${notebookPoints.length} extra points: ${notebookPoints.length === 0 ? 'PASS' : 'FAIL'}`);

// Test 4: Scale affects collision points
console.log('\nTest 4: Scale affects collision points');
const mockLaptopScaled = new THREE.Group();
mockLaptopScaled.userData.type = 'laptop';
mockLaptopScaled.scale = { x: 2, y: 2, z: 2 };

const scaledPoints = getExtraCollisionPoints(mockLaptopScaled);
const normalPoint = laptopPoints[0];
const scaledPoint = scaledPoints[0];

console.log(`  Scaled radius is 2x normal: ${Math.abs(scaledPoint.radius / normalPoint.radius - 2) < 0.001 ? 'PASS' : 'FAIL'}`);
console.log(`  Scaled height is 2x normal: ${Math.abs(scaledPoint.height / normalPoint.height - 2) < 0.001 ? 'PASS' : 'FAIL'}`);
console.log(`  Scaled x is 2x normal: ${Math.abs(scaledPoint.x / normalPoint.x - 2) < 0.001 ? 'PASS' : 'FAIL'}`);
console.log(`  Scaled z is 2x normal: ${Math.abs(scaledPoint.z / normalPoint.z - 2) < 0.001 ? 'PASS' : 'FAIL'}`);

// Test 5: Rotation affects collision detection
console.log('\nTest 5: Rotation affects collision points in world space');
const mockLaptopRotated = new THREE.Group();
mockLaptopRotated.userData.type = 'laptop';
mockLaptopRotated.rotation = { x: 0, y: Math.PI / 2, z: 0 }; // Rotated 90 degrees
mockLaptopRotated.position = { x: 0, y: 0, z: 0 };

const rotatedPoints = getExtraCollisionPoints(mockLaptopRotated);
console.log(`  Rotated laptop stores Y rotation: ${Math.abs(rotatedPoints[0].rotation - Math.PI / 2) < 0.001 ? 'PASS' : 'FAIL'}`);

// Test collision detection with rotation
// Create a laptop at origin, rotated 90 degrees, and test if collision detection works
// The first collision point should be at x = -0.34 * scale in local space
// After 90 degree rotation:
// rotatedX = x * cos(90) - z * sin(90) = 0 - z * 1 = -z
// rotatedZ = x * sin(90) + z * cos(90) = x * 1 + 0 = x
// So a point at local (-0.34, -0.23) should become world (0.23, -0.34) approximately

// World position of first collision point after 90 degree rotation is (0.230, -0.340)
// Test slightly off to the side (within collision radius + test radius = 0.04 + 0.05 = 0.09)
const testPointX = 0.230 + 0.05; // 0.05 offset - should still collide
const testPointZ = -0.340;
const testPointRadius = 0.05;
const testPointY = 0.1;

const collisionResult = checkExtraCollisionPoints(testPointX, testPointZ, testPointRadius, testPointY, mockLaptopRotated);
console.log(`  Collision detected at rotated position: ${collisionResult !== null ? 'PASS' : 'FAIL'}`);

// Additional verification: test that NOT rotating produces collision at different position
const mockLaptopUnrotated = new THREE.Group();
mockLaptopUnrotated.userData.type = 'laptop';
mockLaptopUnrotated.rotation = { x: 0, y: 0, z: 0 }; // No rotation
mockLaptopUnrotated.position = { x: 0, y: 0, z: 0 };

// Unrotated first point is at local (-0.340, -0.230), test near there
const unrotatedTestX = -0.340 + 0.05;
const unrotatedTestZ = -0.230;
const unrotatedResult = checkExtraCollisionPoints(unrotatedTestX, unrotatedTestZ, testPointRadius, testPointY, mockLaptopUnrotated);
console.log(`  Unrotated collision at original position: ${unrotatedResult !== null ? 'PASS' : 'FAIL'}`);

console.log('\n=== All tests completed ===');
