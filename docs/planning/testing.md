# Testing

What TO test in this project:

- Shuffle reproducibility (same question + count = same result)
- Deck completeness (78 cards, no duplicates)
- Drawing logic (cards get removed properly)
- Spread layouts (right number of positions)

What to SKIP testing:

- Dataclass auto-generated methods
- Simple property access
- Basic enum behavior

**Practical approach:**

After we build the Card class and create a full deck, we'll write a quick test to verify we have 78 unique cards. That catches real bugs without slowing us down.
