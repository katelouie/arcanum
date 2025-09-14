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

### External Function Reference

Stories can call these three external functions for tarot integration:

#### 1. `drawCards(spread, count, title, positionConstraints)`

**Purpose**: Draw a spread of tarot cards with live backend integration and optional position constraints

**Parameters**:
- `spread` (string): Spread ID from your spreads-config.json
- `count` (number): Number of cards to draw
- `title` (string): Display title for the reading
- `positionConstraints` (string, optional): Position-specific card constraints

**Available Spread IDs**:
- `"single-focus"` - Single card spread
- `"past-present-future"` - 3-card linear spread
- `"celtic-cross"` - 10-card Celtic Cross
- `"relationship-spread"` - 6-card relationship reading
- `"horseshoe"` - 7-card horseshoe spread
- `"decision-cross"` - 4-card decision making spread

**Position Constraints Format**:
Use the format: `"position:Card1,Card2;position2:Card3,Card4"`
- Position numbers start from 0
- Multiple positions separated by semicolons (`;`)
- Multiple cards for a position separated by commas (`,`)
- Leave empty string (`""`) for no constraints

**Ink Usage**:
```ink
EXTERNAL drawCards(spread, count, title, positionConstraints)

// Basic usage (no constraints)
~ drawCards("past-present-future", 3, "Sarah's Life Transition Reading", "")

// Constrained reading - control narrative flow
~ drawCards("past-present-future", 3, "Guided Reading",
    "0:The Fool,Ace of Cups;1:The Tower,Five of Swords;2:The Sun,The World")

// Mixed constraints - only constrain some positions
~ drawCards("past-present-future", 3, "Semi-Random Reading",
    "1:Death,The Hanged Man,Temperance")

// Celtic Cross with key cards in specific positions
~ drawCards("celtic-cross", 10, "Destiny Reading",
    "0:The Fool;4:The Star;9:The World")

// Single card with specific options
~ drawCards("single-focus", 1, "Today's Guidance",
    "0:The Magician,The High Priestess,The Empress")
```

**Advanced Position Constraint Examples**:
```ink
// Foundation cards for past position, challenge cards for present
~ drawCards("past-present-future", 3, "Story Arc Reading",
    "0:The Fool,Ace of Wands,Ace of Cups;1:The Tower,Five of Swords,Seven of Cups")

// Only major arcana for transformation reading
~ drawCards("mind-body-spirit", 3, "Major Arcana Journey",
    "0:The Fool,The Magician,The High Priestess;1:Death,The Hanged Man;2:The Sun,The World,The Star")

// Exclude negative cards for uplifting story moment
~ drawCards("relationship-spread", 6, "Positive Relationship Reading",
    "0:Two of Cups,Three of Cups,Ten of Cups;5:The Lovers,The Sun")
```

**Return Value**: Returns the count number (for Ink compatibility)
**Side Effect**: Displays tarot spread in the story interface with live backend cards

**Benefits of Position Constraints**:
- **Narrative Control**: Ensure readings support your story's intended emotional arc
- **Thematic Consistency**: Limit cards to fit the story's themes (e.g., only positive cards for hopeful moments)
- **Educational Flow**: Control which cards appear for teaching scenarios
- **Character Development**: Use specific cards to represent character growth stages

---

#### 2. `shuffleDeck()`

**Purpose**: Narrative shuffling effect (cosmetic/story atmosphere)

**Parameters**: None

**Ink Usage**:
```ink
EXTERNAL shuffleDeck()

// Use for atmospheric effect
"Let me shuffle the cards for you..."
~ shuffleDeck()
"The cards feel ready now."
```

**Return Value**: Returns 1 (for Ink compatibility)
**Side Effect**: Creates narrative shuffling effect (backend shuffles automatically)

---

#### 3. `getCardInterpretation(cardName, position)`

**Purpose**: Retrieve interpretation for a specific card and position

**Parameters**:
- `cardName` (string): Exact card name (e.g., "The Fool", "Two of Cups")
- `position` (string): Position context (e.g., "Present", "Past", "Outcome")

**Available Card Names**:
All 78 tarot cards are supported:
- Major Arcana: "The Fool", "The Magician", "The High Priestess", etc.
- Minor Arcana: "Ace of Cups", "Two of Wands", "King of Swords", etc.

**Ink Usage**:
```ink
EXTERNAL getCardInterpretation(cardName, position)

// Get specific card meaning
~ getCardInterpretation("The Hermit", "Present Situation")

// Use with story context
~ getCardInterpretation("Three of Cups", "Your Social Life")
```

**Return Value**: Returns "interpretation_retrieved" (for Ink compatibility)  
**Side Effect**: Retrieves card interpretation from enhanced cards database

### Complete Ink Story Example

```ink
VAR reading_complete = false

EXTERNAL drawCards(spread, count, title, positionConstraints)
EXTERNAL shuffleDeck()
EXTERNAL getCardInterpretation(cardName, position)

=== tarot_session ===
"Welcome to your tarot reading. Let me prepare the cards..."

~ shuffleDeck()

"I'm going to draw three cards for your past, present, and future."
"For this reading, I want to ensure we get foundation cards for your past and positive guidance for your future."

~ drawCards("past-present-future", 3, "Your Life Journey Reading",
    "0:The Fool,Ace of Cups,Ace of Wands;2:The Sun,The World,The Star")

The cards have been laid out before you.

"Let me tell you about your present situation card..."

~ getCardInterpretation("The Star", "Present")

~ reading_complete = true

{ reading_complete:
    The reading feels complete. You sit back, contemplating the insights.
- else:
    Something feels unfinished about this reading...
}

-> END
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

## 🔧 Advanced Features & Function Options

### Advanced `drawCards` Usage

The enhanced `drawCards` function now supports position constraints directly in Ink stories, plus advanced options through the backend service layer.

#### Available Advanced Options:
```typescript
interface StoryReadingOptions {
  spread: string;                    // Required: spread ID
  question?: string;                 // Optional: reading question
  cardCount?: number;                // Optional: number of cards
  positionConstraints?: Record<string, string[]>;  // NEW: position-specific constraints
  constrainedCards?: Array<{         // Optional: force specific cards (legacy)
    position: number;
    cardName: string;
    reversed?: boolean;
  }>;
  allowedCards?: string[];           // Optional: limit to specific cards
  excludedCards?: string[];          // Optional: exclude specific cards
  shuffleCount?: number;             // Optional: shuffle iterations
}
```

#### Position Constraints vs Legacy Constraints:
```typescript
// NEW: Position constraints (recommended for most use cases)
positionConstraints: {
  "0": ["The Fool", "Ace of Cups"],        // Position 0 can be any of these
  "1": ["The Tower", "Five of Swords"],    // Position 1 can be any of these
  "2": ["The Sun", "The World"]            // Position 2 can be any of these
}

// LEGACY: Constrained cards (forces exact cards)
constrainedCards: [
  { position: 0, cardName: "The Fool", reversed: false },     // Position 0 MUST be The Fool
  { position: 1, cardName: "The Tower", reversed: true },     // Position 1 MUST be reversed Tower
]
```

#### Ink Story Integration:
```ink
// Position constraints can now be used directly in Ink:
~ drawCards("past-present-future", 3, "Guided Reading",
    "0:The Fool,Ace of Cups;1:The Tower,Five of Swords;2:The Sun,The World")

// The above is equivalent to this TypeScript configuration:
// positionConstraints: {
//   "0": ["The Fool", "Ace of Cups"],
//   "1": ["The Tower", "Five of Swords"],
//   "2": ["The Sun", "The World"]
// }
```

### Card Constraint System

#### Force Specific Cards:
```typescript
constrainedCards: [
    { position: 0, cardName: "The Fool", reversed: false },      // First card
    { position: 5, cardName: "The Star", reversed: true },       // Sixth card  
    { position: 9, cardName: "Wheel of Fortune", reversed: false } // Last card
]
```

#### Card Filtering:
```typescript
// Only allow specific cards to appear
allowedCards: [
    "The Fool", "The Magician", "The High Priestess", 
    "The Empress", "The Emperor", "The Hierophant"
];

// Exclude specific cards from appearing
excludedCards: [
    "Death", "The Tower", "The Devil", 
    "Ten of Swords", "Five of Pentacles"
];
```

### Backend Integration Details

#### API Endpoints Used:
- `POST /api/reading/cards` - Card drawing without AI interpretation
- `GET /api/enhanced-cards` - Card interpretation database  
- `GET /api/spreads` - Available spread configurations
- `GET /static/tarot-images.json` - Card image metadata

#### Supported Spread Types:
All spreads from your `spreads-config.json`:
- **Single Card**: `"single-focus"`
- **Linear Spreads**: `"past-present-future"`, `"mind-body-spirit"`  
- **Cross Spreads**: `"celtic-cross"`, `"decision-cross"`
- **Relationship**: `"relationship-spread"`, `"compatibility"`
- **Complex**: `"horseshoe"`, `"tree-of-life"`

### External Function Implementation Notes

#### Ink Limitations:
- Ink can only pass basic types: strings, numbers, booleans
- Complex objects must be handled in the JavaScript layer
- External functions must return synchronous values
- Advanced options are applied in StoryTarotService

#### JavaScript Binding Pattern:
```typescript
// In StoryPlayer.tsx
newStory.BindExternalFunction('drawCards', (...args: any[]) => {
    const [spread, count, title] = args;
    
    // Asynchronous backend call as side effect
    (async () => {
        const result = await storyTarotService.drawCards({
            spread,
            cardCount: count,
            question: title,
            // Advanced options can be added here based on story context
        });
        
        setCurrentReading({
            cards: result.cards,
            spreadId: spread,
            title
        });
    })();
    
    // Return synchronous value for Ink
    return count;
});
```

### Position Constraint Test Story

A comprehensive test story (`position_constraint_test.ink`) has been created to demonstrate all constraint functionality:

#### Story Flow:
1. **Basic Reading Demo** - Shows normal unconstrained card drawing
2. **Constrained Reading Demo** - Demonstrates position-specific card limitations
3. **Mixed Constraints Demo** - Shows partial position constraints
4. **Error Handling Demo** - Tests impossible constraints with helpful error messages

#### To Try the Test Story:
```bash
# Compile the test story
inklecate -o frontend/public/stories/position_constraint_test.json ink/position_constraint_test.ink

# Then navigate to Story Mode and load the story
```

#### Error Handling Features:
The position constraint system includes comprehensive error handling:

- **Validation**: Checks that position indices are valid (0 to cardCount-1)
- **Non-empty constraints**: Ensures each position has at least one allowed card
- **Retry logic**: Attempts up to 50 redraws to find valid cards
- **Helpful messages**: Clear error descriptions with suggested fixes
- **Graceful fallbacks**: Stories continue even if constraints fail

#### Example Error Messages:
```
Position 3 constraint cannot be empty. Specify at least one card name.

Could not find a valid card for position 0 after 50 attempts.
Allowed cards: Fake Card, Another Fake Card.
Consider expanding the allowed cards list for this position.

Invalid position 5. Must be between 0 and 2.
```

## 🎨 UI Integration

- **Dark theme consistency** - matches your existing app design
- **Responsive layouts** - works on all screen sizes
- **Smooth animations** - card interactions and loading states
- **Error handling** - graceful fallbacks for network issues
- **Position constraint feedback** - Visual indication of constrained readings
- **Debug information** - Console logging for development and troubleshooting

## 🚀 Next Steps

1. **Test the integration** - Navigate to Story Mode and try the Sarah story
2. **Test position constraints** - Run the position constraint test story
3. **Create new stories** - Write Ink stories that use the enhanced tarot functions
4. **Experiment with constraints** - Use position constraints for narrative control
5. **Add story analytics** - Track reading outcomes and user choices

## 📝 Example Story Output

When a story calls `drawCards()`, users will see:
1. Story text continues normally
2. A tarot spread appears with real cards from your backend
3. Cards are clickable and open the InterpretationPanel
4. Full card details with interpretations and position meanings
5. Story can continue based on the cards drawn

## 🛠️ Troubleshooting & Development Notes

### Common Issues

#### 1. **"External function expected X arguments" Error**
- **Cause**: Argument count mismatch between Ink and JavaScript
- **Solution**: Ensure EXTERNAL declarations match function bindings exactly
- **Example**:
  ```ink
  EXTERNAL drawCards(spread, count, title, positionConstraints)  // 4 arguments
  ~ drawCards("past-present-future", 3, "Reading", "")  // Must pass exactly 4
  ```
- **Note**: The 4th parameter (positionConstraints) is optional but must be provided (use empty string `""` for no constraints)

#### 2. **Version Compatibility Warning**
- **Error**: "Version of ink 21 used to build story doesn't match current version"
- **Solution**: Recompile story with matching inklecate version
- **Command**: `inklecate -o frontend/public/stories/story.json ink/story.ink`

#### 3. **Cards Not Displaying**
- **Check**: Backend server running on port 8000
- **Check**: Frontend can reach `/api/reading/cards` endpoint
- **Debug**: Look for console logs with `[StoryPlayer]` prefix

#### 4. **Story Won't Load**
- **Check**: JSON file exists in `frontend/public/stories/`
- **Check**: Story compiled without Ink syntax errors
- **Debug**: Browser network tab for 404 errors

### Development Debugging

#### Enable Debug Logging:
All external function calls are logged with detailed information:
```
[StoryPlayer] External function called: drawCards
[StoryPlayer] drawCards binding called with args: ["past-present-future", 3, "Reading"]
[StoryPlayer] drawCards parsed args: {spread: "past-present-future", count: 3, title: "Reading"}
```

#### Testing External Functions:
1. Use browser console to inspect function calls
2. Check network tab for backend API requests
3. Verify card data in React Developer Tools

#### File Organization:
```
ink/
├── story.ink              # Source files (edit these)
└── ...

frontend/public/stories/
├── story.json            # Compiled files (generated)
└── ...
```

### Advanced Development Patterns

#### Context-Sensitive Card Drawing:
```typescript
// In StoryPlayer.tsx, you can add context-based logic:
newStory.BindExternalFunction('drawCards', (...args: any[]) => {
    const [spread, count, title] = args;
    
    // Get current story variables for context
    const storyVars = newStory.variablesState;
    const characterMood = storyVars.GetVariable("character_mood");
    
    (async () => {
        const options: StoryReadingOptions = {
            spread,
            cardCount: count,
            question: title,
        };
        
        // Modify options based on story context
        if (characterMood === "anxious") {
            options.excludedCards = ["The Tower", "Death", "Ten of Swords"];
        }
        
        const result = await storyTarotService.drawCards(options);
        // ... handle result
    })();
    
    return count;
});
```

#### Dynamic Spread Selection:
```ink
VAR preferred_spread = "past-present-future"
VAR card_count = 3

// Use variables in function calls
~ drawCards(preferred_spread, card_count, "Dynamic Reading")
```

### Performance Considerations

- **Card Images**: Loaded from backend `/static/` directory
- **API Calls**: Cached by browser for repeat requests  
- **Story Loading**: JSON files loaded once on story start
- **State Management**: Reading state persists during story session

### Integration Testing

1. **Test External Functions**: Each function should work independently
2. **Test Story Flow**: Ensure story continues after tarot calls
3. **Test UI Integration**: Cards display correctly within story interface
4. **Test Error Handling**: Network failures gracefully handled

Try it out in Story Mode to see the full integration in action!