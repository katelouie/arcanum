# Arcanum Ink Story System - External Functions Reference

## Overview

The Arcanum tarot application uses the Ink interactive fiction language to create immersive, narrative-driven tarot reading experiences. This system integrates live tarot card drawing, position-specific interpretations, and dynamic story progression with a comprehensive external function API.

This document provides complete reference documentation for all external functions available in Ink stories, their parameters, return values, and practical usage examples.

## Quick Start

```ink
// Basic card drawing
~ temp card = GetCard("major arcana")
"You drew {card}." # card:{card}

// Display a complete reading
~ temp cardList = "The Fool,The Magician,The High Priestess"
~ displayReading(cardList, "past-present-future", "Your Journey Reading")
```

## External Functions Reference

### GetCard(constraint)

**Purpose**: Draw a single tarot card based on specified constraints.

**Parameters**:
- `constraint` (string): Defines what type of card to draw

**Returns**: String containing the card name, potentially with orientation marker

**Usage**:
```ink
~ temp card = GetCard("major arcana")
~ temp challengingCard = GetCard("challenging")
~ temp reversedCard = GetCard("reversed only")
```

#### Available Constraint Types

##### Named Constraints

| Constraint | Description | Examples |
|------------|-------------|----------|
| `"any"` | Any card from the deck | The Fool, Seven of Swords (R), King of Pentacles |
| `"major arcana"` or `"major"` | Major Arcana cards only | The Fool, The Magician, Death |
| `"cups only"` or `"cups"` | Cups suit cards | Ace of Cups, Three of Cups, Queen of Cups |
| `"wands only"` or `"wands"` | Wands suit cards | Ace of Wands, Seven of Wands, King of Wands |
| `"swords only"` or `"swords"` | Swords suit cards | Ace of Swords, Three of Swords, Queen of Swords |
| `"pentacles only"` or `"pentacles"` | Pentacles suit cards | Ace of Pentacles, Ten of Pentacles, King of Pentacles |
| `"court cards"` | Pages, Knights, Queens, Kings | Page of Cups, Knight of Wands, Queen of Swords |
| `"challenging"` | Cards representing difficulties | The Tower (R), Death (R), Three of Swords |
| `"positive"` | Uplifting, beneficial cards | The Sun, The Star, Ten of Cups |
| `"upright only"` | Only upright orientations | Cards without (R) marker |
| `"reversed only"` | Only reversed orientations | Cards with (R) marker |

##### Explicit Card Lists

Specify exact cards to choose from, separated by commas:

```ink
// Simple list
~ temp lightCard = GetCard("The Sun,The Star,The World")

// Mixed orientations
~ temp mixedCard = GetCard("The Fool,The Magician (R),The High Priestess")

// Only reversed cards
~ temp darkCard = GetCard("The Tower (R),Death (R),The Devil (R)")
```

**Card Orientation Format**:
- Upright cards: `"The Fool"` (no marker)
- Reversed cards: `"The Tower (R)"` (space + (R) marker)

##### Constraint Examples

```ink
// Draw cards for a complete reading
~ temp pastCard = GetCard("any")
~ temp presentCard = GetCard("major arcana")
~ temp futureCard = GetCard("positive")

// Suit-specific draws
~ temp emotional = GetCard("cups only")
~ temp action = GetCard("wands only")
~ temp mental = GetCard("swords only")
~ temp material = GetCard("pentacles only")

// Thematic selections
~ temp challenge = GetCard("challenging")
~ temp resource = GetCard("positive")
~ temp guide = GetCard("court cards")

// Orientation-specific
~ temp blockage = GetCard("reversed only")
~ temp clarity = GetCard("upright only")

// Mixed explicit selection
~ temp lifeLesson = GetCard("The Hermit,Wheel of Fortune (R),The Hanged Man")
```

---

### displayReading(cardList, spreadType, title)

**Purpose**: Display a complete tarot reading with proper spread layout and position meanings.

**Parameters**:
- `cardList` (string): Comma-separated list of card names
- `spreadType` (string): Spread ID from spreads-config.json
- `title` (string): Display title for the reading

**Returns**: Number of cards displayed

**Usage**:
```ink
// Build card list dynamically
~ temp card1 = GetCard("major arcana")
~ temp card2 = GetCard("cups only")
~ temp card3 = GetCard("positive")

~ temp cardList = card1 + "," + card2 + "," + card3
~ displayReading(cardList, "past-present-future", "Your Personal Journey")
```

#### Available Spread Types

| Spread ID | Name | Cards | Description |
|-----------|------|-------|-------------|
| `"single-focus"` | Single Card | 1 | Daily guidance and focus |
| `"past-present-future"` | Past-Present-Future | 3 | Timeline energy flow |
| `"mind-body-spirit"` | Mind-Body-Spirit | 3 | Holistic wellness view |
| `"situation-action-outcome"` | Situation-Action-Outcome | 3 | Problem-solving spread |
| `"four-card-decision"` | 4-Card Decision | 4 | Weighing two options |
| `"five-card-cross"` | 5-Card Cross | 5 | Comprehensive guidance |
| `"relationship-spread"` | 6-Card Relationship | 6 | Relationship dynamics |
| `"horseshoe-traditional"` | 7-Card Horseshoe | 7 | Traditional fortune telling |
| `"horseshoe-apex"` | 7-Card Horseshoe (Apex) | 7 | Key focus variation |
| `"celtic-cross"` | Celtic Cross | 10 | Most comprehensive reading |
| `"year-ahead"` | Year Ahead | 12 | Annual guidance by month |

#### Position Mapping

The `displayReading` function automatically:
1. Fetches the spread configuration from the backend
2. Maps each card to its corresponding position name (e.g., "Past", "Present", "Future")
3. Provides rich position context and meanings
4. Handles card count mismatches gracefully

```ink
// This creates a 3-card reading with positions:
// Card 1: "Past" position
// Card 2: "Present" position
// Card 3: "Future" position
~ displayReading("The Fool,The Star,Ten of Cups", "past-present-future", "Timeline Reading")
```

---

### drawCards(spread, count, title, constraints)

**Purpose**: Legacy function for drawing multiple cards at once (primarily for backward compatibility).

**Parameters**:
- `spread` (string): Spread type
- `count` (number): Number of cards to draw
- `title` (string): Reading title
- `constraints` (optional): Position-specific constraints

**Returns**: Number of cards requested

**Usage**:
```ink
// Basic usage
~ drawCards("past-present-future", 3, "Journey Reading")

// With position constraints (advanced)
~ drawCards("celtic-cross", 10, "Full Celtic Cross", "0:major arcana|1:cups only")
```

**Note**: For most story applications, `GetCard()` + `displayReading()` provides more control and flexibility.

---

### getCardInterpretation(cardName, position)

**Purpose**: Retrieve detailed interpretation for a specific card in a specific position.

**Parameters**:
- `cardName` (string): Name of the card
- `position` (string): Position name or context

**Returns**: String confirmation ("interpretation_retrieved")

**Usage**:
```ink
// Get interpretation for a card
~ getCardInterpretation("The Fool", "Past")
~ getCardInterpretation("{dynamicCard}", "Present Situation")
```

**Note**: This function triggers background interpretation retrieval. The actual interpretation appears in the UI, not in the story text.

---

### shuffleDeck()

**Purpose**: Shuffle the tarot deck (atmospheric/ritual function).

**Parameters**: None

**Returns**: Number (1)

**Usage**:
```ink
// Add ritual atmosphere
"You carefully shuffle the deck, feeling the energy of the cards."
~ shuffleDeck()
"The deck feels ready for your reading."
```

## Tag System Reference

The story system supports rich formatting through tags that enhance the reading experience:

### Card Tags
Display card information and enable interactive features:

```ink
"The Fool represents new beginnings." # card:The Fool
"Look at {cardVariable} for guidance." # card:{cardVariable}
"The Tower reversed warns of upheaval." # card:The Tower:reversed
```

### Note Tags
Add session notes and observations:

```ink
"Client seems nervous about the question." # note:emotional:anxiety
"Important breakthrough about career path." # note:breakthrough:career
"Follow up on family issues next session." # note:follow-up:family
"Client shows good receptivity." # note:body-language:receptive
```

### Insight Tags
Mark important realizations and interpretive moments:

```ink
"This reveals your true calling." # insight:critical
"A major life breakthrough is coming." # insight:breakthrough
"Trust your intuition here." # insight:meaningful-constraints
```

### Mood Tags
Set atmospheric tone:

```ink
"The room fills with mystical energy." # mood:mystical
"Tension builds around the question." # mood:tense
"A sense of hope emerges." # mood:hopeful
"The atmosphere feels mysterious." # mood:mysterious
```

### Interactive Tags
Add tooltips and user interaction:

```ink
"Consider this carefully." # tooltip:Think about what this card means to you personally
"This card often indicates..." # tooltip:Detailed explanation appears on hover
```

## Advanced Usage Patterns

### Dynamic Reading Construction

```ink
=== create_personalized_reading ===
// Assess client's needs
What area needs focus today?
+ [Emotional/Relationships] -> emotional_reading
+ [Career/Goals] -> practical_reading
+ [Spiritual Growth] -> spiritual_reading

= emotional_reading
~ temp heart = GetCard("cups only")
~ temp challenge = GetCard("challenging")
~ temp guidance = GetCard("positive")
~ temp cardList = heart + "," + challenge + "," + guidance
~ displayReading(cardList, "situation-action-outcome", "Emotional Guidance Reading")
-> interpret_emotional

= practical_reading
~ temp current = GetCard("pentacles only")
~ temp action = GetCard("wands only")
~ temp outcome = GetCard("major arcana")
~ temp cardList = current + "," + action + "," + outcome
~ displayReading(cardList, "situation-action-outcome", "Career Focus Reading")
-> interpret_practical
```

### Constraint-Based Storytelling

```ink
=== adaptive_card_selection ===
// Cards adapt to story progression
{story_tension > 5:
    ~ temp card = GetCard("challenging")
    "The cards sense your inner turmoil." # mood:tense
- else:
    ~ temp card = GetCard("positive")
    "The energy feels light and hopeful." # mood:hopeful
}

"You draw {card}." # card:{card}
-> continue_with_card(card)

= function continue_with_card(drawnCard)
// Card-specific story branches
{drawnCard == "The Tower" or drawnCard == "The Tower (R)":
    "Dramatic change approaches..."
    -> tower_interpretation
- drawnCard == "The Star":
    "Hope shines through the darkness..."
    -> star_interpretation
- else:
    "The card speaks of {drawnCard}'s energy..."
    -> general_interpretation
}
```

### Error Handling and Fallbacks

```ink
=== robust_card_drawing ===
// Always have fallback options
~ temp primaryCard = GetCard("major arcana")
{primaryCard == "":
    // Fallback if constraint fails
    ~ primaryCard = GetCard("any")
    {primaryCard == "":
        // Final fallback
        ~ primaryCard = "The Fool"
        "The deck offers its wisdom..." # note:system:fallback-used
    }
}

"Your card is {primaryCard}." # card:{primaryCard}
```

## Best Practices

### 1. **Meaningful Constraints**
Use constraints that serve the narrative:
```ink
// Good: Thematic relevance
~ temp obstacleCard = GetCard("challenging")
~ temp resourceCard = GetCard("positive")

// Avoid: Random constraints without story purpose
~ temp randomCard = GetCard("pentacles only") // Why pentacles specifically?
```

### 2. **Balanced Randomness**
Mix constrained and open draws:
```ink
// Structured start, open possibilities
~ temp foundation = GetCard("major arcana")  // Meaningful base
~ temp influence = GetCard("any")            // Open to all possibilities
~ temp guidance = GetCard("court cards")     // Wise counsel
```

### 3. **Tag Usage**
Enhance the experience with appropriate tags:
```ink
"This card holds deep significance." # insight:critical
"Notice how {card} relates to your question." # tooltip:Consider the symbolism
"Client reflects thoughtfully." # note:body-language:contemplative
```

### 4. **Reading Flow**
Structure readings for natural progression:
```ink
=== complete_reading_flow ===
// 1. Setup and intention
"Let's explore your question together."

// 2. Card drawing with ceremony
~ shuffleDeck()
"The cards are ready to speak."

// 3. Dynamic selection
~ temp cardList = build_card_list()

// 4. Display reading
~ displayReading(cardList, "past-present-future", "Your Personal Reading")

// 5. Interpretation and interaction
"What resonates most strongly with you?"
+ [The past influences] -> explore_past
+ [The present moment] -> explore_present
+ [The future possibilities] -> explore_future
```

## Technical Notes

### Asynchronous Behavior
- External functions execute asynchronously in the background
- Return values are synchronous for Ink story flow
- UI updates happen separately from story progression
- Use return values for story logic, not for actual card data

### Performance Considerations
- `GetCard()` returns placeholder cards immediately for story flow
- Real card drawing happens in the background for future calls
- `displayReading()` fetches spread configurations on-demand
- Consider pre-drawing cards for intensive scenarios

### Debugging
- All external function calls are logged to browser console
- Use browser dev tools to monitor function execution
- Story variables can be inspected through Ink's variable system

### Backend Integration
- External functions connect to FastAPI backend
- Spread configurations loaded from `spreads-config.json`
- Card interpretations use the RAG system for position-specific meanings
- All card data sourced from comprehensive tarot database

---

## Examples Repository

The `test_client.ink` file contains extensive examples of all external functions and constraint types. Refer to it for comprehensive usage patterns and advanced techniques.

For questions about specific implementations or advanced use cases, consult the backend API documentation and frontend component code in the respective `backend/` and `frontend/` directories.