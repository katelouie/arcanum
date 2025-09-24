import React from 'react';
import { Sparkles, Users, Layout, Code } from 'lucide-react';
import { StoryPlayer } from './StoryPlayer';

type AppMode = 'reading' | 'practice' | 'layout' | 'dev' | 'story';

interface StoryModeProps {
  className?: string;
  onModeChange?: (mode: AppMode) => void;
}

export const StoryMode: React.FC<StoryModeProps> = ({ className = '', onModeChange }) => {
  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Main App Navigation */}
      {onModeChange && (
        <div className="bg-slate-900 border-b border-gray-700 px-4 py-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-sm">
              <button
                onClick={() => onModeChange('reading')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <Sparkles size={16} />
                Reading
              </button>
              <button
                onClick={() => onModeChange('practice')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <Users size={16} />
                Practice
              </button>
              <button
                onClick={() => onModeChange('layout')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <Layout size={16} />
                Layout
              </button>
              <button
                onClick={() => onModeChange('dev')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <Code size={16} />
                Dev
              </button>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white">
                <Sparkles size={16} />
                Story
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content - Unified Story System */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950">
          <StoryPlayer
            storyPath="/stories/main.json"
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
};