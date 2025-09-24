# Twine+SugarCube Migration Plan

## Current System Complexity Analysis

### Ink System Issues
- **600+ lines** of repetitive card definitions in `tarot_deck.ink`
- **156 LIST items** (78 cards × 2 orientations)
- **Complex external function binding** with async string parsing
- **Multi-layer architecture**: Ink → JavaScript → FastAPI
- **Maintenance overhead**: 3+ places to update per new card
- **Debugging difficulty**: Multi-layer stack traces

### What We Actually Need
- Random card selection with constraints
- Rich card displays with images/meanings
- Position-specific requirements
- Story branching based on drawn cards

## Proposed SugarCube Architecture

### 1. Simplified Card System

```javascript
// Single source of truth - 78 cards, not 156
setup.tarotDeck = [
  // Major Arcana
  {name: "The Fool", suit: "major", number: 0, img: "m00.jpg", keywords: ["new beginnings", "innocence"]},
  {name: "The Magician", suit: "major", number: 1, img: "m01.jpg", keywords: ["willpower", "manifestation"]},

  // Minor Arcana
  {name: "Ace of Cups", suit: "cups", number: 1, img: "c01.jpg", keywords: ["new emotions", "love"]},
  {name: "Three of Cups", suit: "cups", number: 3, img: "c03.jpg", keywords: ["celebration", "friendship"]},
  // ... 78 total
];

// Constraint-based drawing
setup.drawCards = function(options = {}) {
  const {
    count = 1,
    suit = null,           // "major", "cups", "swords", "wands", "pentacles"
    majorOnly = false,
    forceReversed = null,  // true/false/null (random)
    exclude = []
  } = options;

  let availableCards = setup.tarotDeck.filter(card =>
    !exclude.includes(card.name) &&
    (!suit || card.suit === suit) &&
    (!majorOnly || card.suit === "major")
  );

  return availableCards.random(count).map(card => ({
    ...card,
    reversed: forceReversed ?? (Math.random() < 0.5)
  }));
};
```

### 2. Position Constraints Made Simple

```javascript
// Celtic Cross with constraints
setup.drawCelticCross = function() {
  return [
    setup.drawCards({count: 1, majorOnly: true})[0],        // Present (Major only)
    setup.drawCards({count: 1, suit: "swords"})[0],         // Cross (Swords only)
    setup.drawCards({count: 1, forceReversed: true})[0],    // Foundation (Reversed)
    ...setup.drawCards({count: 7})                          // Remaining positions
  ];
};
```

### 3. React Integration Component

```typescript
interface TwineStoryProps {
  storyPath: string;
  onCardDrawn?: (cards: TarotCard[]) => void;
  onChoiceMade?: (choice: string) => void;
}

export const TwineStoryPlayer: React.FC<TwineStoryProps> = ({
  storyPath,
  onCardDrawn,
  onChoiceMade
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Listen for messages from Twine story
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      switch (event.data.type) {
        case 'CARDS_DRAWN':
          onCardDrawn?.(event.data.cards);
          break;
        case 'CHOICE_MADE':
          onChoiceMade?.(event.data.choice);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onCardDrawn, onChoiceMade]);

  // Send commands to Twine story
  const sendToTwine = (message: any) => {
    iframeRef.current?.contentWindow?.postMessage(message, '*');
  };

  return (
    <iframe
      ref={iframeRef}
      src={storyPath}
      style={{ width: '100%', height: '600px', border: 'none' }}
      title="Interactive Story"
    />
  );
};
```

## Migration Benefits

### Code Reduction
- **From 600+ lines** of Ink definitions → **~100 lines** of JavaScript
- **From 3 definition places** per card → **1 object** per card
- **From complex string parsing** → **direct JavaScript objects**

### Improved Maintainability
- Standard web development patterns
- Direct JavaScript debugging
- No external function binding complexity
- Easier constraint logic

### Better Integration
- Native React component embedding
- Real-time communication with parent app
- Shared state management possibilities
- Consistent with existing React architecture

## Migration Strategy

### Phase 1: Proof of Concept
1. Create simple SugarCube story with tarot functionality
2. Build React-Twine integration component
3. Test basic card drawing and display

### Phase 2: Core Features
1. Implement all constraint types
2. Add card display components
3. Test with existing FastAPI backend

### Phase 3: Story Migration
1. Convert existing Jane Doe test scenarios
2. Migrate Sarah Chen story
3. Update dashboard integration

### Phase 4: Polish & Deploy
1. Performance optimization
2. Error handling improvements
3. Documentation updates

## Compatibility Matrix

| Feature | Current Ink | SugarCube Migration |
|---------|-------------|-------------------|
| Random card drawing | ✅ Complex | ✅ Simple |
| Position constraints | ✅ Verbose | ✅ Elegant |
| Card display | ✅ Working | ✅ Enhanced |
| FastAPI integration | ✅ External functions | ✅ PostMessage |
| React integration | ✅ Heavy | ✅ Lightweight |
| Debugging | ❌ Difficult | ✅ Standard |
| Maintenance | ❌ High overhead | ✅ Low overhead |

The migration would deliver the same functionality with significantly less complexity and better long-term maintainability.