import React from 'react';

interface StoryInsightProps {
  text: string;
  type?: 'insight' | 'note' | 'breakthrough' | 'warning';
  category?: string;
  className?: string;
}

export const StoryInsight: React.FC<StoryInsightProps> = ({
  text,
  type = 'insight',
  category,
  className = ''
}) => {
  const getStyleByType = () => {
    switch (type) {
      case 'insight':
        return 'bg-gradient-to-r from-violet-900/30 to-purple-900/30 border-violet-500/40 text-violet-100';
      case 'note':
        return 'bg-slate-800/50 border-slate-600/40 text-slate-200';
      case 'breakthrough':
        return 'bg-gradient-to-r from-amber-900/30 to-orange-900/30 border-amber-500/40 text-amber-100';
      case 'warning':
        return 'bg-red-900/30 border-red-500/40 text-red-100';
      default:
        return 'bg-indigo-900/30 border-indigo-500/40 text-indigo-100';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'insight':
        return '✨';
      case 'note':
        return '📝';
      case 'breakthrough':
        return '💡';
      case 'warning':
        return '⚠️';
      default:
        return '💭';
    }
  };

  return (
    <div className={`my-4 p-4 rounded-lg border ${getStyleByType()} ${className}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0" aria-hidden="true">
          {getIcon()}
        </span>
        <div className="flex-1">
          {category && (
            <span className="inline-block px-2 py-0.5 mb-2 text-xs rounded
                           bg-white/10 uppercase tracking-wide">
              {category}
            </span>
          )}
          <p className="leading-relaxed">{text}</p>
        </div>
      </div>
    </div>
  );
};

export const SessionNote: React.FC<{
  text: string;
  category: string;
  detail?: string;
  onSave?: (note: { category: string; detail?: string; text: string }) => void;
}> = ({ text, category, detail, onSave }) => {
  React.useEffect(() => {
    if (onSave) {
      onSave({ category, detail, text });
    }
  }, [category, detail, text, onSave]);

  return (
    <div className="my-2 p-3 bg-slate-800/30 border-l-4 border-violet-500/50 rounded">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-violet-400 uppercase tracking-wide">
              Session Note
            </span>
            {category && (
              <span className="px-2 py-0.5 text-xs bg-violet-900/50 text-violet-200 rounded">
                {category}
              </span>
            )}
            {detail && (
              <span className="px-2 py-0.5 text-xs bg-indigo-900/50 text-indigo-200 rounded">
                {detail}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-300">{text}</p>
        </div>
        <span className="text-xs text-slate-500 ml-4">
          {new Date().toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};

export default StoryInsight;