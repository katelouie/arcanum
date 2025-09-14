import React, { useState } from 'react';
import { ArrowLeft, Book, BarChart3, Sparkles, Users, Layout, Code } from 'lucide-react';
import { StoryDashboardSimple } from './StoryDashboardSimple';
import { StoryPlayer } from './StoryPlayer';

type AppMode = 'reading' | 'practice' | 'layout' | 'dev' | 'story';

interface StoryModeProps {
  className?: string;
  onModeChange?: (mode: AppMode) => void;
}

type StoryModeView = 'dashboard' | 'story';

interface ActiveStory {
  storyName: string;
  clientId: string;
  storyPath: string;
}

export const StoryMode: React.FC<StoryModeProps> = ({ className = '', onModeChange }) => {
  const [currentView, setCurrentView] = useState<StoryModeView>('dashboard');
  const [activeStory, setActiveStory] = useState<ActiveStory | null>(null);

  const handleStartStory = (storyName: string, clientId: string) => {
    setActiveStory({
      storyName,
      clientId,
      storyPath: `/stories/${storyName}.json`
    });
    setCurrentView('story');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setActiveStory(null);
  };

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
                <Book size={16} />
                Story
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Story Mode Navigation Header */}
      <div className="flex items-center justify-between p-4 bg-gray-900 border-b border-gray-700">
        <div className="flex items-center gap-4">
          {currentView === 'story' && (
            <button
              onClick={handleBackToDashboard}
              className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </button>
          )}

          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Book size={20} />
            Story Mode
            {activeStory && (
              <span className="text-gray-400 text-base ml-2">
                - {activeStory.storyName}
              </span>
            )}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              currentView === 'dashboard'
                ? 'bg-violet-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <BarChart3 size={16} />
            Dashboard
          </button>

          {activeStory && (
            <button
              onClick={() => setCurrentView('story')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                currentView === 'story'
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Book size={16} />
              Story
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {currentView === 'dashboard' ? (
          <div className="h-full p-6 overflow-y-auto bg-gray-950">
            <StoryDashboardSimple
              onStartStory={handleStartStory}
              className="max-w-7xl mx-auto"
            />
          </div>
        ) : (
          activeStory && (
            <div className="h-full bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950">
              <StoryPlayer
                storyPath={activeStory.storyPath}
                clientId={activeStory.clientId}
                storyName={activeStory.storyName}
                className="h-full"
              />
            </div>
          )
        )}
      </div>
    </div>
  );
};