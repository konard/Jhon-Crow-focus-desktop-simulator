# Test Plan for PNG Deletion Order Fix (Issue #106)

## Issue
After PR #113 was merged, which initially fixed PNG deletion, a subsequent commit (8538f71) introduced a regression that broke PNG deletion again.

## Root Cause

### Timeline of Events:
1. **PR #113 (Jan 7, 2026)**: Fixed PNG deletion by implementing `deleteDrawingFile()` in both `removeObject()` and `clearAllObjects()`
2. **Commit 8538f71 (Jan 8, 2026)**: Added memory leak fixes with `disposeThreeObject()` function
3. **Issue #106 reopened**: User reported that PNG deletion stopped working after the latest updates

### Technical Root Cause:
The memory leak fix introduced a `disposeThreeObject()` function that clears `userData.drawingLines`:

```javascript
// In disposeThreeObject() at renderer.js:8791-8794
// Clear drawing lines array references
if (object.userData.drawingLines) {
  object.userData.drawingLines = null;
}
```

However, in both `removeObject()` and `clearAllObjects()`, the order of operations was:

1. Call `disposeThreeObject(object)` - which sets `drawingLines = null`
2. Check if object has drawings: `object.userData.drawingLines.length > 0` - **FAILS**
3. Call `deleteDrawingFile(object)` - **NEVER CALLED**

This created a regression where drawings were no longer deleted.

## Solution

Move the PNG deletion **before** the `disposeThreeObject()` call in both functions:

### Fixed Order in `removeObject()` (renderer.js:8837-8859):
```javascript
deskObjects.splice(index, 1);
scene.remove(object);

// Delete drawing file BEFORE disposeThreeObject() clears userData.drawingLines
if ((object.userData.type === 'notebook' || object.userData.type === 'paper') &&
    object.userData.drawingLines && object.userData.drawingLines.length > 0) {
  deleteDrawingFile(object);
}

// THEN dispose Three.js resources
disposeThreeObject(object);
```

### Fixed Order in `clearAllObjects()` (renderer.js:8877-8902):
```javascript
while (deskObjects.length > 0) {
  const obj = deskObjects.pop();
  scene.remove(obj);

  // Delete drawing file BEFORE disposeThreeObject() clears userData.drawingLines
  if ((obj.userData.type === 'notebook' || obj.userData.type === 'paper') &&
      obj.userData.drawingLines && obj.userData.drawingLines.length > 0) {
    deleteDrawingFile(obj);
  }

  // THEN dispose Three.js resources
  disposeThreeObject(obj);
}
```

## Test Scenarios

### Scenario 1: Delete paper sheet with drawing in custom folder
**Setup:**
1. Create paper sheet
2. Configure pen to save to custom folder
3. Draw on paper sheet
4. Drawing saved to both app data AND custom folder

**Action:**
Delete the paper sheet using delete button

**Expected Result:**
- `deleteDrawingFile()` is called BEFORE `disposeThreeObject()`
- PNG file deleted from app data storage ✓
- PNG file deleted from custom folder ✓
- Console logs confirm both deletions

### Scenario 2: Delete notebook with drawing in app data only
**Setup:**
1. Create notebook
2. Draw on it without custom folder configured
3. Drawing only saved to app data

**Action:**
Delete the notebook using delete button

**Expected Result:**
- PNG file deleted from app data storage ✓
- No error for missing custom folder

### Scenario 3: Clear all objects with mixed drawings
**Setup:**
1. Create multiple papers and notebooks
2. Draw on some of them
3. Mix of objects with/without custom folder saves

**Action:**
Use "Clear All Objects" function

**Expected Result:**
- All PNG files deleted from both locations
- No errors or crashes

### Scenario 4: Delete object from floor
**Setup:**
1. Create paper sheet with drawing
2. Push it off the desk (falls to floor)

**Action:**
Delete object from floor using middle mouse button hold

**Expected Result:**
- `deleteObjectFromFloor()` calls `removeObject()`
- PNG files deleted properly (same as Scenario 1)

## Verification Steps

### Manual Testing:
1. Run `npm start` to launch the app
2. Test each scenario above
3. Check console for deletion logs
4. Verify files are actually deleted from:
   - App data: `~/.userData/object-data/{objectId}-drawing.data`
   - Custom folder: user-specified location

### Code Review:
- [x] PNG deletion happens BEFORE `disposeThreeObject()` in `removeObject()`
- [x] PNG deletion happens BEFORE `disposeThreeObject()` in `clearAllObjects()`
- [x] Order ensures `drawingLines` is still available for the check
- [x] Comments explain why order matters
- [x] No other cleanup order dependencies introduced

## Related Files
- `src/renderer.js:8827-8867` - `removeObject()` function
- `src/renderer.js:8870-8906` - `clearAllObjects()` function
- `src/renderer.js:8716-8800` - `disposeThreeObject()` function
- `src/renderer.js:10374-10403` - `deleteDrawingFile()` function

## Edge Cases Handled
1. **No custom folder configured**: Deletion check skips gracefully
2. **Empty drawingLines array**: Check fails, no deletion attempt
3. **File already deleted**: IPC handler returns success (idempotent)
4. **Object from floor**: `deleteObjectFromFloor()` → `removeObject()` works correctly

## Notes
- This is a **critical ordering fix** - the functionality was correct, just in wrong order
- No changes to `deleteDrawingFile()` or IPC handlers needed
- Memory management still works correctly with `disposeThreeObject()` called after deletion
- Fix is minimal and surgical - only reorders existing code
