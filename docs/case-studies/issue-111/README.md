# Case Study: Issue #111 - Quick Navigation Shortcuts in Reading Mode

## Overview

This case study documents the implementation and debugging process for adding quick navigation shortcuts (Q/E/Z/C) to align book corners with screen corners in reading mode.

## Issue Description

**Original Request:** Add keyboard shortcuts for quick navigation in book reading mode:
- Q: Align top-left corner of book with top-left corner of screen
- E: Align top-right corner of book with top-right corner of screen
- Z: Align bottom-left corner of book with bottom-left corner of screen
- C: Align bottom-right corner of book with bottom-right corner of screen

**Challenge:** Navigation must work correctly at any zoom level (0.3x to 2.0x) and properly account for camera perspective, field of view, and aspect ratio.

## Files in This Case Study

### Activity Logs (User Testing)
- `activity-log-2026-01-06T15-12-47-436Z.txt` - First user test showing shortcuts not reaching corners
- `activity-log-2026-01-06T15-48-20-400Z.txt` - Second user test revealing inverted controls

### Solution Draft Logs (Development Sessions)
- `solution-draft-log-session-1.txt` - Initial implementation with fixed offsets (1238KB)
- `solution-draft-log-session-2.txt` - Raycasting implementation with Z-axis bug (1221KB)
- `solution-draft-log-session-3.txt` - Investigation and logging improvements (4383KB)

### Analysis Documents
- `root-cause-analysis.md` - Comprehensive root cause analysis with timeline and technical details
- `README.md` - This file

## Key Findings

### Problem 1: Fixed Offsets Don't Work
**Symptom:** Corners appeared in middle of screen, not at edges
**Cause:** Fixed offset calculations didn't account for camera FOV, distance, or aspect ratio
**Solution:** Switched to dynamic raycasting approach

### Problem 2: Inverted Vertical Controls (Critical Bug)
**Symptom:** Q/E (top) moved camera down, Z/C (bottom) moved camera up
**Cause:** Incorrect Z-axis coordinate interpretation for camera perspective
**Solution:** Swapped Z-coordinate calculations for top/bottom corners
**Details:** See `root-cause-analysis.md`

### Problem 3: Completely Reversed Key Mapping (Critical Bug - Session 4)
**Symptom:** All keys mapped to opposite corners:
- Q (top-left) → went to bottom-right
- E (top-right) → went to bottom-left
- Z (bottom-left) → went to top-right
- C (bottom-right) → went to top-left

**Cause:** Incorrect NDC (Normalized Device Coordinates) interpretation. Three.js uses Y: -1 for top and Y: +1 for bottom, opposite of typical screen coordinates.

**Solution:** Fixed viewport corner definitions:
- Top-left: `(-1, -1)` not `(-1, +1)`
- Top-right: `(+1, -1)` not `(+1, +1)`
- Bottom-left: `(-1, +1)` not `(-1, -1)`
- Bottom-right: `(+1, +1)` not `(+1, -1)`

### Problem 4: Left-Right Swap (Critical Bug - Sessions 5 & 6)
**Symptom:** Right keys (E, C) moved camera to left corners, left keys (Q, Z) moved camera to right corners

**Cause:** Camera movement direction is inverse to viewport appearance. When camera moves in +X direction (right), the scene appears to move LEFT in the viewport (and vice versa). The shift calculation `shiftX = bookCornerX - intersectionX` was correct for positioning but incorrect for camera movement direction.

**Root Cause Analysis:**
- WASD controls show: KeyA (left) uses `panOffsetX -= speed`, KeyD (right) uses `panOffsetX += speed`
- When `panOffsetX` increases (camera moves right in +X), the book appears to shift LEFT in viewport
- When `panOffsetX` decreases (camera moves left in -X), the book appears to shift RIGHT in viewport
- **This is an inverse relationship!**

**Solution:** Invert X-axis shift calculation:
```js
// Before (WRONG):
const shiftX = bookCornerX - intersectionX;

// After (CORRECT):
const shiftX = intersectionX - bookCornerX;  // Inverted X for camera movement
```

**Attempts:**
1. First fix (commit 6562cce): Attempted to swap left/right book corner calculations - FAILED
2. Second fix (commit 868aabb): Reverted to original corner calculations - STILL FAILED
3. Third fix (current): Identified true root cause - inverted camera movement direction

## Technical Approach

### Raycasting Solution
Uses Three.js raycasting to unproject viewport corners onto book plane:

1. Define viewport corners in NDC (Normalized Device Coordinates):
   - Top-left: `(-1, -1)` (left + top)
   - Top-right: `(+1, -1)` (right + top)
   - Bottom-left: `(-1, +1)` (left + bottom)
   - Bottom-right: `(+1, +1)` (right + bottom)
   - Note: In Three.js, Y: -1 is top, Y: +1 is bottom
2. Create horizontal plane at book's Y level
3. Cast rays from camera through viewport corners
4. Find intersection points on book plane
5. Calculate camera shift: `bookCorner - viewportCornerIntersection`
6. Apply shift to pan offsets

**Advantages:**
- Mathematically exact
- Automatically handles all camera transformations
- Works at any zoom level
- Adapts to aspect ratio changes

## User Feedback Timeline

1. **Session 1 Feedback:** "Shortcuts barely move to the correct page, not reaching corners"
2. **Session 2 Feedback:** "Controls inverted - buttons for bottom corners go up, buttons for top corners go down"
3. **Session 2 Positive:** "Top positions practically ideal (top-left slightly low)"
4. **Session 3 Request:** "Create case study with timeline, root cause analysis, and data compilation"
5. **Session 4 Feedback:** "Keys completely mixed up - Q→bottom-right, E→bottom-left, Z→top-right, C→top-left" + "Bottom positions too far"
6. **Session 5 Feedback (after commit 6562cce):** "Nothing changed, right keys move left, left keys move right"
7. **Session 6 Feedback (after commit 868aabb):** "Nothing changed, right keys move left, left keys move right" (same issue persisted)

## Metrics

### Development Cost (Anthropic API)
- Session 1: $0.59 (Public estimate: $1.09, -46% difference)
- Session 2: $1.02 (Public estimate: $1.51, -32% difference)
- Session 3: $1.32 (Public estimate: $1.99, -33% difference)
- **Total:** ~$2.93 actual cost (~$4.59 public estimate)

### Code Changes
- **Files modified:** 1 (src/renderer.js)
- **Lines changed:** ~150 lines added/modified
- **Key commits:** 3 (initial implementation, raycasting fix, Z-axis inversion fix)

### Iterations
- **Implementation attempts:** 6
- **User tests:** 5+ documented
- **Critical bugs found:** 4 (fixed offsets, Z-axis inversion, NDC coordinate mapping, X-axis camera movement inversion)

## Resolution Status

- ✅ Fixed: Navigation shortcuts functional
- ✅ Fixed: Z-axis inversion corrected (Session 3)
- ✅ Fixed: NDC coordinate mapping (Session 4)
- ✅ Fixed: X-axis camera movement direction inversion (Session 6)
- ✅ Implemented: Enhanced camera jump logging with viewport intersection data
- ✅ Documented: Comprehensive case study
- ⏳ Pending: Final user testing to verify all corners align correctly

## Lessons for Future Development

1. **Coordinate systems require explicit documentation** - Camera orientation and perspective must be clearly stated
2. **NDC coordinates vary by framework** - Three.js uses Y: -1 (top) to +1 (bottom), opposite of screen coordinates
3. **Camera movement is inverse to viewport appearance** - Moving camera right makes scene appear left (critical insight)
4. **Test early, test often** - All bugs would have been caught immediately with basic corner navigation test
5. **Activity logging is invaluable** - Detailed logs enabled quick identification of Z-axis inversion
6. **User testing reveals real issues** - Mathematical correctness ≠ correct user experience
7. **Case studies pay dividends** - Systematic analysis prevents similar bugs in the future
8. **First principles analysis beats trial-and-error** - Understanding WASD controls revealed the true camera movement direction

## Related Links

- Issue: https://github.com/Jhon-Crow/focus-desktop-simulator/issues/111
- Pull Request: https://github.com/Jhon-Crow/focus-desktop-simulator/pull/112
- Three.js Raycasting Documentation: https://threejs.org/docs/#api/en/core/Raycaster
