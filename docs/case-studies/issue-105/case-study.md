# Case Study: Issue #105 - Drawing Not Under Pen When Paper is Rotated

## Timeline

### Initial Report
- **Issue**: When the notebook or paper is rotated, the drawing does not appear directly under the pen tip.
- **Expected behavior**: Drawing should always appear under the pen tip regardless of paper rotation.

### Attempted Fixes (Chronological)

#### Attempt 1: Coordinate Transformation with Inverse Rotation
**Approach**: Apply inverse rotation to world coordinates to get paper-local coordinates.

```javascript
// Apply INVERSE rotation to transform world offset to paper-local offset
const cos = Math.cos(-rotation);
const sin = Math.sin(-rotation);
const localX = worldOffsetX * cos - worldOffsetZ * sin;
const localZ = worldOffsetX * sin + worldOffsetZ * cos;
```

**User Feedback**: "Problem persists" (Проблема сохранилась)

#### Attempt 2: Texture Rotation
**Approach**: Rotate the texture itself to compensate.

```javascript
texture.center.set(0.5, 0.5);  // Rotate around center
texture.rotation = drawableObject.rotation.y;  // Match object rotation
```

**User Feedback**: "Drawing direction is now correct, but the image rotates relative to the observer (there should be no changes for the observer)" (Направление рисования теперь правильное, но картинка поворачивается относительно наблюдателя)

#### Attempt 3: Canvas Content Rotation Compensation
**Approach**: Counter-rotate canvas content when paper rotates.

**User Feedback**: "Compensation doesn't work" (Компенсация не работает)

#### Attempt 4: Disable Texture FlipY
**Approach**: Set `texture.flipY = false` and remove canvas rotation.

**Current Status**: User reports "Problem persists" with activity log attachment.

---

## Root Cause Analysis

### Understanding the Coordinate Systems

1. **World Space**:
   - X-axis: Left/Right
   - Y-axis: Up/Down
   - Z-axis: Toward/Away from camera (positive Z = toward camera)

2. **Paper-Local Space**:
   - The paper lies flat on the desk (XZ plane)
   - When rotated around Y-axis, its local X/Z axes rotate with it

3. **Canvas Space** (2D drawing surface):
   - X-axis: Left (0) to Right (512)
   - Y-axis: Top (0) to Bottom (512)

4. **BoxGeometry UV Mapping**:
   - Face 4-5 (+Y) is the top face we draw on
   - UV coordinates: (0,0) at one corner, (1,1) at opposite corner
   - The UV orientation on BoxGeometry's top face needs verification

### The Core Problem

The issue is a **mismatch between**:
1. How coordinates are calculated for drawing
2. How the texture is applied to the 3D geometry
3. How the UV mapping on BoxGeometry's top face is oriented

### BoxGeometry Top Face UV Analysis

For a BoxGeometry with dimensions (width, height, depth) centered at origin:

- The +Y (top) face spans from (-width/2, height/2, -depth/2) to (width/2, height/2, depth/2)
- UV coordinates on this face:
  - In THREE.js, BoxGeometry's top face has UV (0,0) at (-width/2, height/2, depth/2)
  - And UV (1,1) at (width/2, height/2, -depth/2)

**This means**:
- Canvas X=0 corresponds to world -X (left side of paper)
- Canvas X=512 corresponds to world +X (right side of paper)
- Canvas Y=0 corresponds to world +Z (front/toward camera) when flipY=false
- Canvas Y=512 corresponds to world -Z (back/away from camera) when flipY=false

### Current Implementation Review

```javascript
// worldToDrawingCoords() in renderer.js
const normalizedX = (localX / width) + 0.5;
const normalizedY = 1.0 - ((localZ / depth) + 0.5);
```

This maps:
- localX=-width/2 → normalizedX=0 → canvasX=0 ✓
- localX=+width/2 → normalizedX=1 → canvasX=512 ✓
- localZ=+depth/2 → normalizedY=0 → canvasY=0 (should be front)
- localZ=-depth/2 → normalizedY=1 → canvasY=512 (should be back)

**The Y-inversion (`1.0 - ...`) is intended to flip the canvas Y to match screen convention (Y increases downward).**

### Hypothesis

The actual UV mapping on BoxGeometry's top face may not match our assumed orientation. The discrepancy could be:

1. **UV origin mismatch**: BoxGeometry may place UV (0,0) at a different corner than expected
2. **flipY interaction**: When flipY=false, the texture orientation changes
3. **Camera perspective**: The viewer's perspective affects perceived "correct" drawing position

---

## Proposed Solution

### Option A: Verify and Match UV Mapping

1. Create a diagnostic to print actual UV coordinates of BoxGeometry's top face
2. Adjust worldToDrawingCoords() to match the actual UV layout
3. Test at multiple rotation angles

### Option B: Use Explicit UV Mapping

1. Create custom UV coordinates for the drawing face
2. Ensure UV (0,0) = paper corner (-width/2, +depth/2) = front-left
3. Ensure UV (1,1) = paper corner (+width/2, -depth/2) = back-right

### Option C: Screen-Space Drawing

1. Instead of transforming coordinates, use raycast UV directly
2. THREE.js raycaster returns UV coordinates at intersection point
3. Use `intersection.uv` directly for drawing position

---

## Files to Examine

- `/src/renderer.js` lines 8621-8662: `worldToDrawingCoords()` function
- `/src/renderer.js` lines 8705-8736: `updateDrawingTexture()` function
- `/src/renderer.js` lines 3735-3777: `createNotebook()` function
- `/src/renderer.js` lines 4577-4614: `createPaper()` function

## Test Scenarios

1. Draw at paper center - should always work regardless of rotation
2. Draw at corners - verify all 4 corners map correctly
3. Draw a line while rotating - verify line continuity
4. Draw after rotation - verify position is correct

## Activity Log (User Feedback)

See: `activity-log-2026-01-07.txt`

The log shows drawing strokes were completed on the notebook, but the exact mismatch is not visible in the log data.
