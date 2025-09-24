# Migration Strategy: Ink → Twine+SugarCube

## Overview

This document outlines the step-by-step migration from the current complex Ink system to the simplified Twine+SugarCube approach.

## Current System Analysis

### What Works Well (Keep)
- ✅ **FastAPI Backend** - Session tracking, AI interpretations, enhanced cards API
- ✅ **React App Structure** - Dashboard, modes, component architecture
- ✅ **Card Images & Data** - Existing `/static/cards_wikipedia/` and tarot-images.json
- ✅ **UI Components** - CardCallout, existing styling system

### What's Overly Complex (Replace)
- ❌ **600+ lines of Ink LIST definitions** → 78 JavaScript objects
- ❌ **Complex external function binding** → PostMessage API
- ❌ **String parsing for orientations** → Boolean properties
- ❌ **Multi-layer constraint system** → Simple JavaScript filters

## Migration Phases

### Phase 1: Proof of Concept ✅ COMPLETE
- [x] Research Twine+SugarCube React integration
- [x] Create simplified tarot card system design
- [x] Build proof-of-concept Twine story (`tarot-story.twee`)
- [x] Create React integration components (`TwineStoryPlayer.tsx`)
- [x] Test basic functionality

### Phase 2: Foundation (Next)
1. **Install Twine 2 locally** or use web version
2. **Compile POC story to HTML** from `.twee` file
3. **Test React integration** with compiled HTML
4. **Verify card images work** with existing backend
5. **Test PostMessage communication**

### Phase 3: Core Features
1. **Complete tarot deck** - All 78 cards in JavaScript
2. **Advanced constraints** - All position types from current system
3. **Card display integration** - Ensure CardCallout works with new format
4. **Session tracking** - Integrate with existing FastAPI client system

### Phase 4: Story Migration
1. **Convert Jane Doe test scenarios** from Ink to Twine
2. **Migrate Sarah Chen story** with proper narrative structure
3. **Update dashboard integration** to use TwineStoryMode
4. **Test all existing features** work with new system

### Phase 5: Production Ready
1. **Performance optimization** - Bundle size, loading speed
2. **Error handling** - Robust fallbacks and user feedback
3. **Documentation** - Update for new system
4. **Cleanup** - Remove old Ink files and dependencies

## File Structure Changes

### New Files
```
frontend/src/components/
├── TwineStoryPlayer.tsx      ✅ Created
├── TwineStoryMode.tsx        ✅ Created
└── twine/                    (Future: Twine-specific components)

twine-stories/                (New directory)
├── poc/
│   ├── tarot-story.twee      ✅ Created
│   └── tarot-story.html      (Compiled from .twee)
├── jane-doe/
│   └── test-scenarios.twee   (Future)
└── sarah-chen/
    └── story.twee            (Future)

docs/
├── twine-migration-plan.md   ✅ Created
└── migration-strategy.md     ✅ Created (this file)
```

### Files to Eventually Remove
```
ink/                          (After migration complete)
├── tarot_deck.ink           ❌ Remove (600+ lines → ~100 JS lines)
├── test_client.ink          ❌ Convert to Twine
├── sarah.ink                ❌ Convert to Twine
└── main.ink                 ❌ Remove

frontend/src/components/
└── StoryPlayer.tsx          ❌ Replace with TwineStoryPlayer
```

## Story Conversion Examples

### Ink Constraint Example (Complex)
```ink
// Ink - Multiple LIST definitions needed
LIST MajorArcanaUpright = TheFool, TheMagician, ...
LIST MajorArcanaReversed = TheFool_reversed, TheMagician_reversed, ...

~ temp card = LIST_RANDOM(MajorArcanaReversed)
~ displayReading(cardToString(card) + ":reversed", "single", "Test")
```

### SugarCube Equivalent (Simple)
```javascript
// SugarCube - One function call
<<set $card = setup.drawCards({majorOnly: true, forceReversed: true})[0]>>
<<= setup.displayCard($card)>>
```

### Ink Tag System → SugarCube Widgets
```ink
The Hermit guides your path. # card:The Hermit:reversed
```

Becomes:
```sugarcube
The Hermit guides your path. <<cardDisplay "The Hermit" true>>
```

## Integration with Existing Backend

### Session Tracking
```typescript
// TwineStoryPlayer sends session events to FastAPI
const trackSession = (event: string, data: any) => {
  fetch('/api/sessions/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: clientId,
      event: event,
      data: data,
      timestamp: Date.now()
    })
  });
};
```

### AI Interpretations
```javascript
// SugarCube can still call FastAPI for AI interpretations
setup.getAIInterpretation = async function(cards, spread) {
  const response = await fetch('/api/interpretation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cards, spread })
  });
  return await response.json();
};
```

## Testing Strategy

### Phase 2 Testing
- [ ] Compile POC Twine story to HTML
- [ ] Load in TwineStoryPlayer component
- [ ] Verify PostMessage communication works
- [ ] Test card drawing and display
- [ ] Confirm image loading from existing backend

### Integration Testing
- [ ] Test with existing card enhancement data
- [ ] Verify session tracking works
- [ ] Test dashboard navigation
- [ ] Confirm all modes still work

### Performance Testing
- [ ] Compare bundle sizes (Ink vs Twine)
- [ ] Test loading speeds
- [ ] Memory usage comparison
- [ ] Mobile responsiveness

## Rollback Plan

If migration encounters issues:

1. **Keep existing Ink system** running in parallel
2. **Feature flag** to switch between systems
3. **Gradual migration** - one story at a time
4. **Fallback option** - StoryPlayer component remains available

## Success Metrics

Migration is successful when:
- [ ] **Code reduction**: <200 lines instead of 600+
- [ ] **Maintenance simplicity**: Single object per card
- [ ] **Feature parity**: All existing functionality works
- [ ] **Performance improvement**: Faster loading, smaller bundles
- [ ] **Developer experience**: Easier debugging and development

## Next Steps

1. **Install Twine 2** and compile POC story
2. **Test basic React integration** with compiled HTML
3. **Verify existing backend compatibility**
4. **Begin Phase 3** if Phase 2 tests pass

The migration promises significant simplification while maintaining all existing functionality and improving the development experience.