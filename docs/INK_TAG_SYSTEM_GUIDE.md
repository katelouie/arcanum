# Ink Tag System Guide for Arcanum

## Overview

This guide explains how to use Ink's tagging system to create rich, styled content within your story narratives that integrates seamlessly with the React frontend and tarot backend services.

## Understanding Ink Tags

Ink supports two types of tags:
1. **Line tags** - Applied to individual lines of text using `#`
2. **Knot/stitch tags** - Applied to entire sections using `# tag1 # tag2`

In Arcanum, we primarily use line tags to mark content for special rendering.

## Tag Syntax Patterns

### Basic Pattern
```ink
This is normal text. # tagname
This has parameters. # tagname:param1:param2
```

### Arcanum Tag Types

#### 1. Card Callouts
Display card meanings in styled boxes:
```ink
The Hermit appears in your spread. # card:The Hermit
She draws the Three of Cups. # card:Three of Cups:reversed
```

#### 2. Emphasis & Styling
Highlight important text:
```ink
This moment feels significant. # emphasis
"Trust your intuition," you say. # quote
A breakthrough is coming. # insight
```

#### 3. Tooltips & Hints
Add hover information:
```ink
The querent seems anxious. # tooltip:Notice their body language
Check the Celtic Cross spread. # hint:Good for complex questions
```

#### 4. Session Notes
Mark important information for session tracking:
```ink
Client mentions relationship troubles. # note:relationship
Breakthrough moment about career. # insight:career:breakthrough
```

#### 5. Mood & Atmosphere
Set the scene:
```ink
The candles flicker ominously. # mood:mysterious
Sunlight streams through the window. # mood:hopeful
```

## Frontend Integration

### Step 1: Parse Tags in StoryPlayer.tsx

The story continueation provides tags via `story.currentTags`. Here's how to handle them:

```tsx
// In StoryPlayer.tsx
const continueStory = () => {
  while (story.canContinue) {
    const text = story.Continue();
    const tags = story.currentTags;

    // Process each paragraph with its tags
    paragraphs.push({
      text: text.trim(),
      tags: tags || []
    });
  }
};
```

### Step 2: Create Tag Parser

```tsx
// utils/storyTagParser.ts
export interface ParsedTag {
  type: string;
  params: string[];
  raw: string;
}

export const parseTag = (tag: string): ParsedTag => {
  const parts = tag.split(':');
  return {
    type: parts[0].trim(),
    params: parts.slice(1).map(p => p.trim()),
    raw: tag
  };
};

export const renderTaggedContent = (
  text: string,
  tags: string[],
  context: {
    getCardInterpretation: (card: string) => any,
    addSessionNote: (note: string) => void
  }
) => {
  const parsedTags = tags.map(parseTag);

  // Handle different tag types
  for (const tag of parsedTags) {
    switch (tag.type) {
      case 'card':
        return <CardCallout card={tag.params[0]} reversed={tag.params[1] === 'reversed'} />;
      case 'emphasis':
        return <span className="text-violet-400 font-semibold">{text}</span>;
      case 'tooltip':
        return <TooltipText text={text} tooltip={tag.params[0]} />;
      case 'note':
        context.addSessionNote(`${tag.params[0]}: ${text}`);
        return <p>{text}</p>;
      // ... more cases
    }
  }

  return <p>{text}</p>;
};
```

### Step 3: Component Examples

#### CardCallout Component
```tsx
// components/story/CardCallout.tsx
import { useCardData } from '../../hooks/useCardData';

export const CardCallout: React.FC<{ card: string; reversed?: boolean }> = ({
  card,
  reversed = false
}) => {
  const { getCardInterpretation } = useCardData();
  const interpretation = getCardInterpretation(card);

  return (
    <div className="my-4 p-4 bg-violet-900/20 border border-violet-500/30 rounded-lg">
      <div className="flex items-center mb-2">
        <img
          src={interpretation.image_url}
          alt={card}
          className="w-12 h-20 object-cover rounded mr-3"
        />
        <div>
          <h4 className="text-violet-300 font-semibold">
            {card} {reversed && '(Reversed)'}
          </h4>
          <p className="text-sm text-slate-400">{interpretation.keywords.join(', ')}</p>
        </div>
      </div>
      <p className="text-slate-200 text-sm leading-relaxed">
        {reversed ? interpretation.reversed_meaning : interpretation.upright_meaning}
      </p>
    </div>
  );
};
```

#### TooltipText Component
```tsx
// components/story/TooltipText.tsx
export const TooltipText: React.FC<{ text: string; tooltip: string }> = ({
  text,
  tooltip
}) => {
  return (
    <span className="relative group">
      <span className="border-b border-dotted border-violet-400 cursor-help">
        {text}
      </span>
      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2
                       mb-2 px-3 py-1 bg-slate-800 text-slate-200 text-sm
                       rounded-md opacity-0 group-hover:opacity-100
                       transition-opacity whitespace-nowrap z-10">
        {tooltip}
      </span>
    </span>
  );
};
```

## Practical Examples

### Example 1: Card Reading with Interpretation

```ink
=== reading_moment ===
You lay out three cards for Sarah's past-present-future reading.

The first card reveals itself. # card:The Hermit
"Your past shows a period of introspection and seeking," you explain. # emphasis

The present position holds the Three of Cups. # card:Three of Cups
"Now you're entering a time of celebration and friendship." # quote

The final card is drawn reversed. # card:The Sun:reversed
"The future suggests hidden joy waiting to be uncovered." # insight:reading
```

### Example 2: Interactive Learning

```ink
=== practice_feedback ===
The client seems uncomfortable with your interpretation. # tooltip:Consider their body language

* [Adjust your approach] # hint:Show more empathy
  "Let me rephrase that in a different way..." # note:technique:reframing
  -> gentle_interpretation

* [Ask for their perspective] # hint:Encourage participation
  "What does this card speak to you?" # note:technique:client-centered
  -> client_insight
```

### Example 3: Atmospheric Storytelling

```ink
=== session_start ===
The reading room is dim, lit only by candlelight. # mood:mysterious
Sarah enters, her energy anxious but hopeful. # note:client:anxious

She mentions her recent breakup. # note:relationship:breakup # insight
"I need guidance about moving forward," she says. # quote

You shuffle the deck thoughtfully. # emphasis
The cards seem to pulse with meaning. # mood:mystical
```

## Advanced Integration

### Combining with External Functions

```ink
=== enhanced_reading ===
~ drawCards("celtic-cross", 10, "Sarah's Life Path")

The Significator position reveals profound insight. # card:The Star # emphasis
~ temp cardMeaning = getCardInterpretation("The Star", "Significator")

// The external function result can inform the narrative
{cardMeaning == "hope":
  "This card brings a message of renewed hope." # insight:hopeful
- else:
  "The Star's light guides you through darkness." # insight:guidance
}
```

### Dynamic Tag Generation

```ink
=== adaptive_narrative ===
VAR client_mood = "anxious"

{client_mood == "anxious":
  The room feels charged with nervous energy. # mood:tense
- else:
  A sense of calm pervades the space. # mood:peaceful
}

// Tags can be conditional
{sarah_confidence > 5:
  Sarah seems ready for deeper truths. # note:ready # insight:breakthrough
- else:
  Sarah needs gentle encouragement. # note:nervous # hint:go-slow
}
```

## Best Practices

### 1. Semantic Tagging
Use tags that describe meaning, not just appearance:
- ✅ `# card:The Hermit`
- ❌ `# blue-box:The Hermit`

### 2. Consistent Parameters
Keep parameter order consistent:
- Card tags: `# card:name:orientation`
- Note tags: `# note:category:detail`
- Mood tags: `# mood:atmosphere`

### 3. Performance Considerations
- Parse tags once during story continuation
- Cache card interpretations
- Lazy load heavy components

### 4. Accessibility
- Ensure tagged content remains readable without styling
- Provide alt text for visual elements
- Keep tooltips keyboard-accessible

### 5. Session Integration
Use tags to enhance session tracking:
```ink
Client reveals fear of commitment. # note:insight # insight:commitment-fear
This will be important for future sessions. # note:follow-up
```

## Testing Your Tags

### In Development
1. Add tags to a test story section
2. Check browser console for tag parsing
3. Verify components render correctly
4. Test interaction (tooltips, clicks)

### Debug Mode
Add a debug view to see all tags:
```tsx
{debugMode && (
  <div className="mt-4 p-2 bg-slate-800 rounded text-xs">
    Tags: {paragraph.tags.join(', ')}
  </div>
)}
```

## Migration Strategy

### Phase 1: Basic Tags
Start with simple styling tags:
- `# emphasis`
- `# quote`
- `# mood:type`

### Phase 2: Interactive Elements
Add interactive components:
- `# card:name`
- `# tooltip:text`
- `# hint:text`

### Phase 3: Backend Integration
Connect to services:
- `# note:category` (save to session)
- `# insight:type` (track breakthroughs)
- `# follow-up:topic` (flag for next session)

## Troubleshooting

### Tags Not Appearing
- Check `story.currentTags` is being captured
- Verify tag syntax (space after #)
- Ensure tags are on same line as text

### Styling Not Applied
- Confirm tag parser is called
- Check component imports
- Verify CSS classes exist

### Performance Issues
- Limit heavy components per paragraph
- Use React.memo for tag components
- Consider virtualization for long stories

## Future Enhancements

### Planned Features
1. **Tag Combinations**: Multiple tags per line
2. **Tag Inheritance**: Section-level styling
3. **Custom Tag Types**: User-defined tags
4. **Tag Analytics**: Track which tags are most effective
5. **Export Tags**: Include in session summaries

### Integration Ideas
- Connect tags to practice mode scoring
- Use tags to trigger achievement unlocks
- Generate reading summaries from tagged insights
- Export tagged notes to client files

## Conclusion

The Ink tag system provides a powerful way to enhance your story narratives with rich, interactive content while maintaining clean separation between story logic and presentation. By following these patterns, you can create engaging, styled experiences that integrate seamlessly with Arcanum's tarot reading system.