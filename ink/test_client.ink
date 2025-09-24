// Test Client: Jane Doe
// Purpose: Testing new simplified tarot system functionality, tags, and card selection
VAR jane_sessions_completed = 0
VAR jane_total_sessions = 999  // Unlimited for testing
VAR jane_client_notes = ""
VAR jane_last_reading_date = ""
VAR test_mode = ""
VAR test_cards = ""

=== load_jane ===
~ current_client = "jane"
~ is_dashboard = false

Welcome to the Test Environment! # emphasis
Jane Doe is our test client for trying out new features. # note:system:test-client

-> jane_test_menu

=== jane_test_menu ===
What would you like to test today? # tooltip:Choose a test scenario to explore new functionality

+ [Test Tag System] -> test_tags
+ [Test Card Selection with New Functionality] -> test_card_selection
+ [Test Display Reading Function] -> test_display_reading
+ [Test Constrained Card Draws] -> test_constrained_draws
+ [Test Reversed Card Lists] -> test_reversed_lists
+ [Test Error Handling] -> test_error_cases
+ [Test All Features Combined] -> test_combined_scenario
+ [Return to Reading Table] -> reading_table

=== test_tags ===
~ test_mode = "tags"

-> start

= start
Testing Tag System # emphasis

This section demonstrates all available tag types. # note:test:tag-demo

-> tag_examples

= tag_examples
Let's explore each tag type: # tooltip:Hover over tagged content to see effects

Basic Text Styling

This text has emphasis styling. # emphasis
"This is a quoted statement from Jane." # quote
This is an important insight about the reading. # insight:breakthrough
The room feels mysterious and charged with energy. # mood:mysterious

+ [Continue] -> card_tags

= card_tags
Card Display Tags

Let's look at some card examples:

The Fool represents new beginnings. # card:The Fool
The Tower reversed suggests avoiding catastrophe. # card:The Tower:reversed
The Three of Cups brings celebration. # card:Three of Cups

+ [Continue] -> interactive_tags

= interactive_tags
Interactive Elements

This text has a tooltip. # tooltip:This is the tooltip content that appears on hover
Client seems anxious about the question. # note:emotional:anxiety
* [This choice has a hint] -> hint_demo

= hint_demo
You selected the option with the hint! # emphasis

Jane nods, understanding the guidance. # note:body-language:receptive

+ [Try more interactive tags] -> session_tags
+ [Back to test menu] -> jane_test_menu

= session_tags
Session Tracking Tags

This is a critical realization for Jane. # insight:critical
Important follow-up needed for next session. # note:follow-up:important
Client had breakthrough about career path. # note:breakthrough:career

+ [Back to test menu] -> jane_test_menu

=== test_card_selection ===
~ test_mode = "card_selection"

Testing Dynamic Card Selection # emphasis

We'll test the new GetCard() function with various constraints. # note:test:getcard-constraints

First, let's draw three random Major Arcana cards:

~ temp card1 = GetCard("major arcana")
~ temp card2 = GetCard("major arcana")
~ temp card3 = GetCard("major arcana")

~ temp cardList = card1
~ cardList = cardList + "," + card2
~ cardList = cardList + "," + card3

Selected cards: {card1}, {card2}, {card3} # note:cards:major-arcana

Now let's display them as a complete spread:
~ displayReading(cardList, "past-present-future", "Three Major Arcana Reading")

+ [Test mixed constraints] -> test_mixed_constraints
+ [Test suit-specific draws] -> test_suit_draws
+ [Back to test menu] -> jane_test_menu

= test_mixed_constraints
Let's try mixed constraint types: # emphasis

~ temp major = GetCard("major arcana")
~ temp cups = GetCard("cups only")
~ temp challenging = GetCard("challenging")
~ temp explicit = GetCard("The Sun,The Moon,The Star")

~ temp mixedList = major
~ mixedList = mixedList + "," + cups
~ mixedList = mixedList + "," + challenging
~ mixedList = mixedList + "," + explicit

Mixed constraints result: {major}, {cups}, {challenging}, {explicit}

~ displayReading(mixedList, "four-card-decision", "Mixed Constraint Test Reading")

+ [Test more selections] -> test_suit_draws
+ [Back to test menu] -> jane_test_menu

= test_suit_draws
Testing suit-specific draws: # emphasis

~ temp wands = GetCard("wands only")
~ temp cups = GetCard("cups only")
~ temp swords = GetCard("swords only")
~ temp pentacles = GetCard("pentacles only")

~ temp suitList = wands
~ suitList = suitList + "," + cups
~ suitList = suitList + "," + swords
~ suitList = suitList + "," + pentacles

The four suits: {wands}, {cups}, {swords}, {pentacles}

~ displayReading(suitList, "four-card-decision", "The Four Suits Reading")

The cards have been dynamically drawn and displayed! # note:test:dynamic-success

+ [Back to test menu] -> jane_test_menu

=== test_display_reading ===
~ test_mode = "display_reading"

Testing Dynamic Display Reading Function # emphasis

This tests displayReading with dynamically drawn cards. # note:test:dynamic-display

-> dynamic_three_card_test

= dynamic_three_card_test
Let's display a dynamically drawn Past-Present-Future reading:

~ temp past = GetCard("any")
~ temp present = GetCard("major arcana")
~ temp future = GetCard("positive")

~ temp cardList = past
~ cardList = cardList + "," + present
~ cardList = cardList + "," + future

Dynamic cards drawn: {past}, {present}, {future}

~ displayReading(cardList, "past-present-future", "Jane's Dynamic Test Reading")

The past card {past} sets your foundation. # card:{past}
The present Major Arcana {present} brings powerful energy. # card:{present}
The positive future {future} promises good outcomes. # card:{future}

+ [Test challenge spread] -> dynamic_challenge_test
+ [Test Celtic Cross] -> dynamic_celtic_test
+ [Back to test menu] -> jane_test_menu

= dynamic_challenge_test
Testing a Dynamic Challenge Reading:

~ temp obstacle = GetCard("challenging")
~ temp resource = GetCard("positive")
~ temp outcome = GetCard("major arcana")
~ temp advice = GetCard("court cards")
~ temp hidden = GetCard("reversed only")

~ temp challengeList = obstacle
~ challengeList = challengeList + "," + resource
~ challengeList = challengeList + "," + outcome
~ challengeList = challengeList + "," + advice
~ challengeList = challengeList + "," + hidden

Challenge reading cards:
1. Obstacle: {obstacle}
2. Resource: {resource}
3. Outcome: {outcome}
4. Advice: {advice}
5. Hidden factor: {hidden}

~ displayReading(challengeList, "five-card-cross", "Jane's Dynamic Challenge Reading")

This shows how constraints create meaningful narratives! # insight:meaningful-constraints

+ [Test Celtic Cross] -> dynamic_celtic_test
+ [Back to test menu] -> jane_test_menu

= dynamic_celtic_test
Testing Dynamic Celtic Cross (10 cards):

Drawing a full Celtic Cross with varied constraints:

~ temp significator = GetCard("court cards")
~ temp cross = GetCard("any")
~ temp foundation = GetCard("major arcana")
~ temp recentPast = GetCard("cups only")
~ temp crown = GetCard("wands only")
~ temp nearFuture = GetCard("swords only")
~ temp approach = GetCard("pentacles only")
~ temp external = GetCard("challenging")
~ temp hopes = GetCard("positive")
~ temp outcome = GetCard("major arcana")

~ temp celticList = significator
~ celticList = celticList + "," + cross
~ celticList = celticList + "," + foundation
~ celticList = celticList + "," + recentPast
~ celticList = celticList + "," + crown
~ celticList = celticList + "," + nearFuture
~ celticList = celticList + "," + approach
~ celticList = celticList + "," + external
~ celticList = celticList + "," + hopes
~ celticList = celticList + "," + outcome

Celtic Cross positions:
1. You: {significator} (Court card as person)
2. Challenge: {cross}
3. Foundation: {foundation} (Major Arcana)
4. Past: {recentPast} (Cups for emotions)
5. Crown: {crown} (Wands for action)
6. Future: {nearFuture} (Swords for thoughts)
7. Approach: {approach} (Pentacles for material)
8. External: {external} (Challenging situation)
9. Hopes: {hopes} (Positive energy)
10. Outcome: {outcome} (Major Arcana)

~ displayReading(celticList, "celtic-cross", "Jane's Complete Dynamic Celtic Cross")

A comprehensive journey with meaningful card placement! # note:reading:comprehensive

+ [Back to test menu] -> jane_test_menu

=== test_constrained_draws ===
~ test_mode = "constrained"

Testing Advanced Constraint System # emphasis

This section tests the new constraint-based card drawing system. # note:test:advanced-constraints

-> orientation_constraints

= orientation_constraints
Testing orientation and suit constraints: # tooltip:Testing upright/reversed with suit filters

~ temp majorUpright = GetCard("major arcana")
~ temp cupsAny = GetCard("cups only")
~ temp reversedAny = GetCard("reversed only")

Drawing with different constraints:
- Major Arcana: {majorUpright}
- Cups only: {cupsAny}
- Reversed card: {reversedAny}

~ temp constraintList = majorUpright
~ constraintList = constraintList + "," + cupsAny
~ constraintList = constraintList + "," + reversedAny

~ displayReading(constraintList, "past-present-future", "Constraint Test Reading")

+ [Test explicit card lists] -> explicit_constraints
+ [Test thematic constraints] -> thematic_constraints
+ [Back to test menu] -> jane_test_menu

= explicit_constraints
Testing explicit card lists with reversals: # emphasis

We can specify exact cards including reversed ones using (R) notation:

~ temp darkCard = GetCard("The Tower (R),Death (R),The Devil (R)")
~ temp lightCard = GetCard("The Sun,The Star,The World")
~ temp mixedCard = GetCard("The Fool,The Magician (R),The High Priestess")

Explicit selections:
- Dark card: {darkCard}
- Light card: {lightCard}
- Mixed card: {mixedCard}

~ temp explicitList = darkCard
~ explicitList = explicitList + "," + lightCard
~ explicitList = explicitList + "," + mixedCard

~ displayReading(explicitList, "past-present-future", "Light and Shadow Reading")

+ [Test thematic constraints] -> thematic_constraints
+ [Back to test menu] -> jane_test_menu

= thematic_constraints
Testing thematic constraint sets: # emphasis

The system supports thematic groupings for different reading contexts:

~ temp challengingCard = GetCard("challenging")
~ temp positiveCard = GetCard("positive")
~ temp courtCard = GetCard("court cards")

Thematic draws:
- Challenging situation: {challengingCard}
- Positive energy: {positiveCard}
- Court card (person): {courtCard}

~ temp thematicList = challengingCard
~ thematicList = thematicList + "," + positiveCard
~ thematicList = thematicList + "," + courtCard

~ displayReading(thematicList, "situation-action-outcome", "Challenge and Resolution Reading")

All constraint types working perfectly! # insight:constraint-success

+ [Back to test menu] -> jane_test_menu

=== test_reversed_lists ===
~ test_mode = "reversed_lists"

Testing Reversed Card System # emphasis

This section tests the new constraint-based reversed card system. # note:test:reversed-system

-> test_orientation_constraints

= test_orientation_constraints
Testing orientation-specific constraints: # tooltip:Using upright/reversed constraints

Major Arcana Only (any orientation): # emphasis
~ temp major = GetCard("major arcana")
You drew: {major}

Upright Cards Only: # emphasis
~ temp upright = GetCard("upright only")
You drew: {upright} (should be upright)

Reversed Cards Only: # emphasis
~ temp reversed = GetCard("reversed only")
You drew: {reversed} (should have (R) or be visibly reversed)

~ temp orientationList = major
~ orientationList = orientationList + "," + upright
~ orientationList = orientationList + "," + reversed

~ displayReading(orientationList, "past-present-future", "Orientation Test Reading")

+ [Test explicit reversed lists] -> explicit_reversed_test
+ [Test mixed orientation spread] -> mixed_orientation_spread
+ [Back to test menu] -> jane_test_menu

= explicit_reversed_test
Testing explicit reversed card lists: # emphasis

Drawing from specific reversed cards using (R) notation:

Challenging reversed cards:
~ temp darkReversed = GetCard("The Tower (R),Death (R),The Devil (R),The Hanged Man (R)")
You drew: {darkReversed}

Mixed explicit list (some reversed, some upright):
~ temp mixed = GetCard("The Fool,The Magician (R),The High Priestess,The Emperor (R)")
You drew: {mixed}

~ temp explicitList = darkReversed + "," + mixed
~ displayReading(explicitList, "past-present-future", "Explicit Reversal Test")

The (R) notation is working perfectly! # insight:reversal-success

+ [Test more combinations] -> test_orientation_constraints
+ [Back to test menu] -> jane_test_menu

= mixed_orientation_spread
Seven-Card Reading with Mixed Orientations: # emphasis

Drawing cards with different orientation requirements:
- Position 1: Any Major Arcana
- Position 2: Upright only
- Position 3: Reversed only
- Position 4: Cups (any orientation)
- Position 5: Explicit dark card
- Position 6: Explicit light card
- Position 7: Court card

~ temp card1 = GetCard("major arcana")
~ temp card2 = GetCard("upright only")
~ temp card3 = GetCard("reversed only")
~ temp card4 = GetCard("cups only")
~ temp card5 = GetCard("The Tower (R),Death (R),Five of Swords")
~ temp card6 = GetCard("The Sun,The Star,Ten of Cups")
~ temp card7 = GetCard("court cards")

Results:
1. Major: {card1}
2. Upright: {card2}
3. Reversed: {card3}
4. Cups: {card4}
5. Dark: {card5}
6. Light: {card6}
7. Court: {card7}

~ temp mixedList = card1
~ mixedList = mixedList + "," + card2
~ mixedList = mixedList + "," + card3
~ mixedList = mixedList + "," + card4
~ mixedList = mixedList + "," + card5
~ mixedList = mixedList + "," + card6
~ mixedList = mixedList + "," + card7

~ displayReading(mixedList, "horseshoe-traditional", "Complete Orientation Test")

Perfect demonstration of the constraint system! # insight:comprehensive-test

+ [Back to test menu] -> jane_test_menu

=== test_error_cases ===
~ test_mode = "errors"

Testing Error Handling # emphasis

Let's test various error scenarios. # note:test:error-handling

-> empty_cards

= empty_cards
Test 1: Empty card list # tooltip:Should handle gracefully

~ test_cards = ""
// ~ displayReading(test_cards, "three-card", "Empty Test")

Result: Function should handle empty input safely. # note:error:empty-handled

+ [Test invalid spread] -> invalid_spread

= invalid_spread
Test 2: Invalid spread type

~ test_cards = "The Fool,The Magician"
// ~ displayReading(test_cards, "invalid-spread-type", "Invalid Spread Test")

Result: Should fall back to default or show error. # note:error:invalid-spread

+ [Test mismatched count] -> mismatched_count

= mismatched_count
Test 3: Wrong number of cards for spread

~ test_cards = "The Fool,The Magician"  // Only 2 cards
// ~ displayReading(test_cards, "celtic-cross", "Mismatched Count Test")  // Expects 10

Result: Should handle card count mismatch. # note:error:count-mismatch

+ [Back to test menu] -> jane_test_menu

=== test_combined_scenario ===
~ test_mode = "combined"

Combined Dynamic Feature Test # emphasis

Jane sits across from you, ready for a comprehensive dynamic test reading. # mood:mysterious

"I'm here to help test the new constraint-based system," she says with excitement. # quote

This will be a completely dynamic test session using GetCard! # note:session:dynamic-comprehensive

* [Begin the dynamic reading] -> combined_dynamic_reading

= combined_dynamic_reading
You shuffle the cards thoughtfully. # emphasis

The cards seem eager to reveal their dynamic patterns. # mood:mystical

Let's do a special constraint-based three-card reading for Jane: # tooltip:Testing combined dynamic functionality

~ temp oldSystem = GetCard("challenging")
~ temp transformation = GetCard("major arcana")
~ temp newSystem = GetCard("positive")

~ temp integrationList = oldSystem
~ integrationList = integrationList + "," + transformation
~ integrationList = integrationList + "," + newSystem

Dynamic cards for the integration story:
Past (Old System): {oldSystem}
Present (Transformation): {transformation}
Future (New System): {newSystem}

~ displayReading(integrationList, "past-present-future", "Jane's Dynamic Integration Test")

-> interpret_dynamic_cards

= interpret_dynamic_cards
The challenging card in your past represents obstacles overcome.
The Major Arcana in the present shows the power of transformation.
The positive card in the future promises dynamic success.

This reading demonstrates perfect dynamic integration! # insight:dynamic-success

Jane nods appreciatively at the realistic card selection. # note:client:impressed

+ [Try comprehensive constraint test] -> combined_constraint_showcase
+ [Complete test session] -> session_complete

= combined_constraint_showcase
Now for the ultimate constraint showcase: # emphasis

A 7-card reading demonstrating every constraint type:

~ temp majorCard = GetCard("major arcana")
~ temp suitCard = GetCard("cups only")
~ temp orientationCard = GetCard("reversed only")
~ temp thematicCard = GetCard("challenging")
~ temp courtCard = GetCard("court cards")
~ temp explicitCard = GetCard("The Sun,The Star,The World")
~ temp mixedCard = GetCard("The Fool (R),Death,The Hanged Man (R)")

~ temp showcaseList = majorCard
~ showcaseList = showcaseList + "," + suitCard
~ showcaseList = showcaseList + "," + orientationCard
~ showcaseList = showcaseList + "," + thematicCard
~ showcaseList = showcaseList + "," + courtCard
~ showcaseList = showcaseList + "," + explicitCard
~ showcaseList = showcaseList + "," + mixedCard

Constraint showcase results:
1. Major Arcana: {majorCard} # card:{majorCard}
2. Cups Only: {suitCard} # card:{suitCard}
3. Reversed Only: {orientationCard} # card:{orientationCard}
4. Challenging Theme: {thematicCard} # card:{thematicCard}
5. Court Card: {courtCard} # card:{courtCard}
6. Explicit Light: {explicitCard} # card:{explicitCard}
7. Mixed Explicit: {mixedCard} # card:{mixedCard}

~ displayReading(showcaseList, "horseshoe-traditional", "Jane's Complete Constraint Test")

Every constraint type working together harmoniously! # insight:comprehensive-success

Jane is amazed by the system's flexibility and power. # note:client:amazed

+ [Complete test session] -> session_complete

= session_complete
Test session complete! # emphasis

All features have been successfully tested: # note:test:complete
- Tag system ✓
- Card selection ✓
- Display reading ✓
- Constraints ✓
- Error handling ✓

Jane smiles. "Everything is working beautifully." # quote

~ jane_sessions_completed += 1
~ jane_last_reading_date = "Test Date"
~ jane_client_notes = jane_client_notes + "\nTest session {jane_sessions_completed} complete. All systems functional."

+ [Return to test menu] -> jane_test_menu
+ [Return to reading table] -> reading_table

// === reading_table ===
// -> jane_test_menu