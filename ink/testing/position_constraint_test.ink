EXTERNAL drawCards(spread, count, title, positionConstraints)
EXTERNAL shuffleDeck()
EXTERNAL getCardInterpretation(cardName, position)

VAR player_name = "Alex"

= start
Welcome, {player_name}, to the Constrained Tarot Reading experience.

Today we'll explore how different cards can be limited to specific positions for more controlled narrative storytelling.

~ shuffleDeck()

* [Begin the demonstration] -> demonstrate_basic
* [Learn about position constraints] -> explain_constraints

= explain_constraints
Position constraints allow story writers to limit which cards can appear in specific positions of a spread.

For example, in a past-present-future reading:
- Position 0 (Past) might be limited to cards representing foundations like "The Fool" or "Ace of Cups"
- Position 1 (Present) might be constrained to cards showing current challenges like "The Tower" or "Five of Swords"
- Position 2 (Future) might only allow positive outcome cards like "The Sun" or "The World"

This gives story writers precise control over narrative flow while still maintaining the authentic randomness of tarot.

* [Try a basic reading first] -> demonstrate_basic
* [Jump to constrained reading] -> demonstrate_constraints

= demonstrate_basic
Let's start with a normal, unconstrained past-present-future reading to establish a baseline.

~ drawCards("past-present-future", 3, "Basic Reading", "")

The cards have been drawn! This is how a normal reading works - any card can appear in any position.

* [Now try constrained positions] -> demonstrate_constraints
* [Draw another basic reading] -> demonstrate_basic
* [End the session] -> ending

= demonstrate_constraints
Now let's try a reading where we constrain specific positions to demonstrate controlled narrative flow.

For this constrained reading:
- Past position will be limited to foundational cards: The Fool, Ace of Cups, Ace of Wands
- Present position will be limited to challenge cards: The Tower, Five of Swords, Seven of Cups
- Future position will be limited to positive outcome cards: The Sun, The World, The Star

Let me draw those cards now...

~ drawCards("past-present-future", 3, "Constrained Reading", "0:The Fool,Ace of Cups,Ace of Wands;1:The Tower,Five of Swords,Seven of Cups;2:The Sun,The World,The Star")

Amazing! Notice how the reading now follows a specific narrative arc - foundation cards in the past, challenge cards in the present, and positive resolution in the future.

This technique allows story writers to ensure their tarot readings support the intended narrative flow while maintaining authentic tarot symbolism.

* [Try another constrained reading] -> demonstrate_mixed_constraints
* [Try an impossible constraint] -> demonstrate_error
* [End the session] -> ending

= demonstrate_mixed_constraints
Let's try a more complex example where we only constrain some positions, leaving others completely random.

In this reading:
- Past position: completely random (no constraints)
- Present position: limited to major arcana cards representing transformation: Death, The Hanged Man, Temperance
- Future position: completely random (no constraints)

~ drawCards("past-present-future", 3, "Mixed Constraints Reading", "1:Death,The Hanged Man,Temperance")

Perfect! This shows how you can mix constrained and unconstrained positions for maximum flexibility.

* [Try the error demonstration] -> demonstrate_error
* [Do another mixed reading] -> demonstrate_mixed_constraints
* [End the session] -> ending

= demonstrate_error
Let's see what happens if we create an impossible constraint - like limiting a position to cards that don't exist or are too restrictive.

I'll try to constrain the past position to only non-existent cards:

~ drawCards("past-present-future", 3, "Error Test", "0:Fake Card,Another Fake Card")

If you see an error message, that's the system protecting against impossible constraints and providing helpful debugging information.

* [Return to working examples] -> demonstrate_constraints
* [End the session] -> ending

= ending
Thank you for exploring the position constraint system, {player_name}!

This feature enables:
✨ Precise narrative control in interactive stories
✨ Thematic consistency in tarot readings
✨ Educational demonstrations of card relationships
✨ Reliable story flow while preserving tarot authenticity

The enhanced drawCards function signature is:
`drawCards(spread, count, title, positionConstraints)`

Where positionConstraints is an optional object mapping position indices to arrays of allowed card names.

-> END