# Story Mode - Live Tarot Integration

Your Story Mode now has complete integration with your FastAPI backend! Here's what's been implemented:

## ✅ What's Working Now

### 1. **Live Backend Integration**
- Stories call your FastAPI `/api/reading/cards` endpoint
- Real card draws using your existing shuffle/draw algorithms
- Full access to your card database and image assets

### 2. **Complete Spread Rendering**
- Uses your existing `DynamicSpreadRenderer` component
- Supports all your configured spreads from `spreads-config.json`
- Cards display with proper positioning and layouts

### 3. **Enhanced Card Interactions**
- Click any card in a story to open the `InterpretationPanel`
- Full card interpretations using your enhanced cards database
- Position meanings from your spread configurations
- Same experience as the main Reading Mode

### 4. **Narrative Control Features**
- **Constrained card draws**: Force specific cards in certain positions
- **Allowed/excluded cards**: Limit card pool for story purposes
- **Custom spread selection**: Stories can choose any available spread
- **Dynamic titles and descriptions** for readings within stories

## 🎮 How to Use

### In Ink Stories (.ink files):

```ink
// Basic card draw - draws 3 cards in past-present-future spread
~ drawCards("past-present-future", 3, "Sarah's Life Transition Reading")

// Advanced card draw with constraints
~ drawCards("celtic-cross", 10, "Guided Reading", { 
    "constrainedCards": [
        {"position": 0, "cardName": "The Fool", "reversed": false}
    ],
    "excludedCards": ["Death", "The Tower"]
})

// Shuffle deck for narrative effect
~ shuffleDeck()

// Get specific card interpretation
~ getCardInterpretation("The High Priestess", "Present Situation")
```

### Story Integration Features:

1. **StoryTarotService** (`/frontend/src/services/storyTarotService.ts`)
   - Handles all backend communication
   - Supports card constraints and filtering
   - Manages spread configurations

2. **StoryTarotDisplay** (`/frontend/src/components/StoryTarotDisplay.tsx`)
   - Renders spreads within stories
   - Integrates with existing spread system
   - Supports card interactions

3. **Enhanced StoryPlayer** (`/frontend/src/components/StoryPlayer.tsx`)
   - Built-in tarot integration
   - InterpretationPanel support
   - Automatic state management

## 🔧 Advanced Features

### Card Constraints
Force specific cards to appear in certain positions:
```javascript
constrainedCards: [
    { position: 0, cardName: "The Fool", reversed: false },
    { position: 5, cardName: "The Star", reversed: true }
]
```

### Card Filtering
Control which cards can appear:
```javascript
allowedCards: ["The Fool", "The Magician", "The High Priestess"],
excludedCards: ["Death", "The Tower", "The Devil"]
```

### Dynamic Spread Selection
Stories can choose spreads programmatically:
```javascript
// Available spread IDs from your config:
// - "single-focus"
// - "past-present-future" 
// - "celtic-cross"
// - "relationship-spread"
// - etc.
```

## 🎨 UI Integration

- **Dark theme consistency** - matches your existing app design
- **Responsive layouts** - works on all screen sizes  
- **Smooth animations** - card interactions and loading states
- **Error handling** - graceful fallbacks for network issues

## 🚀 Next Steps

1. **Test the integration** - Navigate to Story Mode and try the Sarah story
2. **Create new stories** - Write Ink stories that use the tarot functions
3. **Expand card constraints** - Add more sophisticated narrative control
4. **Add story analytics** - Track reading outcomes and user choices

## 📝 Example Story Output

When a story calls `drawCards()`, users will see:
1. Story text continues normally
2. A tarot spread appears with real cards from your backend
3. Cards are clickable and open the InterpretationPanel
4. Full card details with interpretations and position meanings
5. Story can continue based on the cards drawn

Try it out in Story Mode to see the full integration in action!