# Case Study: Issue #96 - Laptop Lid Open/Close Functionality

## Overview

This case study documents the implementation of laptop lid open/close functionality via drag in the Focus Desktop Simulator, including the investigation of multiple bugs that occurred during the development process.

## Original Issue

**Issue #96**: "Добавить возможность закрыть/открыть Laptop потянув за верхнюю часть крышки (избегай конфликта с перемещением с помощью драгндропа)"

Translation: "Add the ability to close/open the Laptop by pulling the upper part of the lid (avoid conflict with drag-and-drop movement)"

## Timeline of Events

### Phase 1: Initial Implementation (Session 1)
- Initial implementation of laptop lid drag functionality
- Created basic detection of lid click vs body click
- Added rotation constraints

### Phase 2: First Bug - No Visual Change (Session 2)
**User Feedback**: "драгндроп регистрируется, но визуально ничего не меняется" (drag-and-drop is registered, but nothing changes visually)

**Evidence from logs** (`console-log-1767707122107.log`):
```
[LAPTOP] Lid drag started: {objectId: 6, currentRotation: '-30.0°'}
[LAPTOP] Lid drag ended: {objectId: 6, finalRotation: '-30.0°'}
```
The rotation stayed at exactly -30.0° throughout multiple drag attempts.

**Root Cause**: The code was using `mouse.y` (absolute normalized mouse position) to calculate rotation changes. However, in pointer-locked FPS mode (the default mode), `mouse.y` is always 0, resulting in zero rotation change.

**Fix**: Changed to use accumulated mouse movement deltas (`deltaY`) instead of absolute position.

### Phase 3: Second Bug - Wrong Initial Position (Session 3)
**User Feedback**: "Сейчас Laptop добавляется открытым на 200% и даёт возможность закрыть себя до состояния 100% открыт. Сделай стартовое положение Laptop 0% открыт (закрыт) и добавь возможность всё так же открывать его на 200%."

Translation: "Currently the Laptop is added opened at 200% and allows closing to 100% open state. Make the starting position of Laptop 0% open (closed) and add the ability to still open it to 200%."

**Evidence from logs** (`activity-log-user-feedback.txt`):
```
[OBJECT] Object added to desk - type: "laptop", id: 16
[LAPTOP] Lid drag started - currentRotation: "-90.0°" (this is "200% open")
...user dragging...
[LAPTOP] Lid position changed - newRotation: "0.0°" (this is "100% open/closed")
[LAPTOP] Lid drag started (from closed) - currentRotation: "-0.0°"
[LAPTOP] Lid drag ended - finalRotation: "0.0°" (cannot go past 0°)
```

**Root Cause Analysis**:
1. Laptop was initialized with `lidRotation: -Math.PI / 2` (-90°)
2. The rotation was clamped between `-Math.PI` (-180°) and `0`
3. User terminology mapping:
   - "200% open" = -90° (initialized state, very open)
   - "100% open" = 0° (closed/flat on base)
   - "0% open" = should be starting position (closed)
   - "200% open" target = -180° (fully open, screen behind base)

The confusion arose from the initial state being in the middle of the rotation range, not at an extreme.

**Fix**: Changed initialization to:
- `lidRotation: 0` (closed)
- `targetLidRotation: 0` (closed)
- `screenGroup.rotation.x = 0` (closed)
- `isLidOpen: false` (correctly reflecting closed state)

## Technical Details

### Rotation System
The laptop lid uses X-axis rotation:
- `0` = closed (lid flat on keyboard base)
- `-Math.PI / 2` (-90°) = standard open position
- `-Math.PI` (-180°) = fully open (convertible mode, screen behind base)

### Detection Logic
When clicking on a laptop:
1. Check if click intersects with `screenGroup` (the lid)
2. If lid is nearly closed (< 8.5°):
   - Click on front edge (far from hinge) = start opening lid
   - Click on back edge (near hinge) = move whole laptop
3. If lid is open: any click on lid starts lid dragging

### Orientation-Aware Drag Direction
The drag direction adapts based on laptop Y rotation:
- Screen facing camera: pull down = open lid (more negative rotation)
- Screen facing away: pull down = close lid (toward 0)

## Files Modified

- `src/renderer.js`:
  - Lines 3649-3651: Changed initial lid state from open (-90°) to closed (0°)
  - Line 3695: Changed initial screen group rotation from -90° to 0°

## Lessons Learned

1. **Pointer Lock Mode**: When implementing mouse-based interactions, always consider both pointer-locked and unlocked modes. Using absolute position (`mouse.y`) fails in pointer-locked mode; use movement deltas instead.

2. **State Initialization**: Initial state should match user expectations. Users expect a laptop to start closed, not half-open.

3. **Terminology Mapping**: User terminology may differ from technical representation. "200% open" meant "very open" not literally 200% of something. Understanding the user's mental model is crucial.

4. **Logging**: Comprehensive logging (both activity log and console DevTools) was essential for debugging. The logs clearly showed:
   - Events were firing correctly (registration was working)
   - Rotation values were not changing (visual bug)
   - Initial values and constraints (initialization bug)

## Data Files

- `logs/activity-log-user-feedback.txt` - Activity log showing the wrong initial position bug
- `logs/activity-log-2026-01-06T13-44-43-773Z.txt` - Activity log from first visual bug report
- `logs/console-log-1767707122107.log` - Console log showing drag events without rotation changes
- `data/issue-96.json` - Original issue data
- `data/pr-104.json` - Pull request data
- `data/pr-104-conversation-comments.json` - All PR conversation comments

## Commits

1. Initial implementation (various commits for basic functionality)
2. Bug fix: Used accumulated delta for rotation calculation
3. Bug fix: Changed laptop initial position to start closed (0°)
