import React, { useState } from 'react';

interface StoryTooltipProps {
  text: string;
  tooltip: string;
  className?: string;
}

export const StoryTooltip: React.FC<StoryTooltipProps> = ({
  text,
  tooltip,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
      tabIndex={0}
      role="button"
      aria-label={`${text}. Tooltip: ${tooltip}`}
    >
      <span className="border-b border-dotted border-violet-400 cursor-help">
        {text}
      </span>
      {isVisible && (
        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2
                       mb-2 px-3 py-2 bg-slate-800 text-slate-200 text-sm
                       rounded-md shadow-lg z-20 whitespace-normal
                       min-w-[200px] max-w-[300px]
                       before:content-[''] before:absolute before:top-full
                       before:left-1/2 before:-translate-x-1/2
                       before:border-4 before:border-transparent
                       before:border-t-slate-800
                       animate-fadeIn">
          {tooltip}
        </span>
      )}
    </span>
  );
};

export const StoryHint: React.FC<{ text: string; hint: string }> = ({
  text,
  hint
}) => {
  return (
    <span className="relative group">
      <span className="text-slate-200">{text}</span>
      <span className="ml-1 inline-flex items-center justify-center
                       w-4 h-4 text-xs text-violet-300 bg-violet-900/50
                       rounded-full border border-violet-500/50
                       cursor-help group-hover:bg-violet-800/50
                       transition-colors">
        ?
      </span>
      <span className="absolute left-0 bottom-full mb-2 px-3 py-2
                       bg-violet-900/90 text-violet-100 text-sm
                       rounded-md shadow-lg opacity-0 group-hover:opacity-100
                       transition-opacity whitespace-normal
                       min-w-[200px] max-w-[300px] z-20
                       pointer-events-none">
        💡 {hint}
      </span>
    </span>
  );
};

export default StoryTooltip;