export interface ParsedTag {
  type: string;
  params: string[];
  raw: string;
}

export const parseTag = (tag: string): ParsedTag => {
  const parts = tag.split(':').map(p => p.trim());
  return {
    type: parts[0],
    params: parts.slice(1),
    raw: tag
  };
};

export const getTaggedContentClass = (tags: ParsedTag[]): string => {
  const classes: string[] = [];

  for (const tag of tags) {
    switch (tag.type) {
      case 'emphasis':
        classes.push('text-violet-400 font-semibold');
        break;
      case 'quote':
        classes.push('italic text-slate-300 pl-4 border-l-2 border-violet-500/50');
        break;
      case 'insight':
        classes.push('bg-violet-900/20 p-3 rounded-lg border border-violet-500/30');
        break;
      case 'mood':
        if (tag.params[0] === 'mysterious') {
          classes.push('text-purple-300 opacity-90');
        } else if (tag.params[0] === 'hopeful') {
          classes.push('text-amber-300');
        } else if (tag.params[0] === 'tense') {
          classes.push('text-red-300 opacity-90');
        }
        break;
      default:
        break;
    }
  }

  return classes.join(' ');
};

export const hasCardTag = (tags: ParsedTag[]): boolean => {
  return tags.some(tag => tag.type === 'card');
};

export const getCardFromTag = (tags: ParsedTag[]): { name: string; reversed: boolean } | null => {
  const cardTag = tags.find(tag => tag.type === 'card');
  if (!cardTag || !cardTag.params[0]) return null;

  return {
    name: cardTag.params[0],
    reversed: cardTag.params[1] === 'reversed'
  };
};

export const hasTooltipTag = (tags: ParsedTag[]): boolean => {
  return tags.some(tag => tag.type === 'tooltip');
};

export const getTooltipFromTag = (tags: ParsedTag[]): string | null => {
  const tooltipTag = tags.find(tag => tag.type === 'tooltip');
  return tooltipTag?.params[0] || null;
};

export const hasNoteTag = (tags: ParsedTag[]): boolean => {
  return tags.some(tag => tag.type === 'note');
};

export const getNoteFromTag = (tags: ParsedTag[]): { category: string; detail?: string } | null => {
  const noteTag = tags.find(tag => tag.type === 'note');
  if (!noteTag) return null;

  return {
    category: noteTag.params[0] || 'general',
    detail: noteTag.params[1]
  };
};

export const hasHintTag = (tags: ParsedTag[]): boolean => {
  return tags.some(tag => tag.type === 'hint');
};

export const getHintFromTag = (tags: ParsedTag[]): string | null => {
  const hintTag = tags.find(tag => tag.type === 'hint');
  return hintTag?.params[0] || null;
};