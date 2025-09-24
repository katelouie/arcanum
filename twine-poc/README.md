# Twine+SugarCube Tarot Proof of Concept

This demonstrates how much simpler your tarot system becomes with Twine+SugarCube instead of Ink.

## Key Improvements

### Code Reduction
- **Ink**: 600+ lines of LIST definitions + complex functions
- **SugarCube**: ~100 lines of simple JavaScript objects

### Constraint System
```javascript
// Ink (complex)
LIST MajorArcanaReversed = TheFool_reversed, TheMagician_reversed, ...
~ temp card = LIST_RANDOM(MajorArcanaReversed)

// SugarCube (simple)
setup.drawCards({majorOnly: true, forceReversed: true})
```

### No External Function Complexity
- **Ink**: Complex binding, string parsing, async issues
- **SugarCube**: Direct JavaScript, native React communication

## Files

- `tarot-story.twee` - Complete proof-of-concept story
- Demonstrates all core functionality:
  - Random card drawing
  - Position constraints
  - Card displays with images
  - React parent communication

## To Test

1. Import `tarot-story.twee` into Twine 2
2. Set story format to SugarCube 2
3. Publish to HTML
4. Open in browser or embed in React component

## Comparison

| Feature | Current Ink System | SugarCube System |
|---------|-------------------|------------------|
| Card definitions | 156 LIST items | 78 objects |
| Random drawing | `LIST_RANDOM(MajorArcanaReversed)` | `drawCards({majorOnly: true, forceReversed: true})` |
| Constraints | String parsing + external functions | Simple JavaScript options |
| Maintenance | Update 3+ places per card | Update 1 object |
| Debugging | Multi-layer stack traces | Standard JavaScript |
| React integration | Complex external functions | Clean postMessage API |

The SugarCube approach delivers the same functionality with dramatically less complexity.