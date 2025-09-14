import React from 'react';
import { StoryPlayer } from './StoryPlayer';

export const StoryExample: React.FC = () => {
  return (
    <div className="py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent mb-4">
            Interactive Story Player
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Experience interactive tarot reading stories with branching narratives and choices.
            This example loads the Sarah story from the compiled Ink JSON.
          </p>
        </div>

        <div className="bg-slate-900 rounded-lg shadow-lg overflow-hidden border border-slate-800">
          <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-violet-900/30 to-indigo-900/30">
            <h2 className="text-xl font-semibold text-slate-100">
              Sarah's First Reading Session
            </h2>
            <p className="text-slate-300 mt-2">
              A practice scenario about post-graduation uncertainty and life transitions.
            </p>
          </div>
          
          <StoryPlayer
            storyPath="/stories/sarah.json"
            className="border-0 shadow-none rounded-none"
          />
        </div>

        <div className="mt-8 p-6 bg-slate-800 rounded-lg border border-slate-700">
          <h3 className="text-lg font-semibold text-violet-300 mb-3">
            Live Backend Integration
          </h3>
          <ul className="space-y-2 text-slate-300">
            <li className="flex items-start">
              <span className="text-violet-400 mr-2">✓</span>
              Stories now call your <strong>live FastAPI backend</strong> to draw real tarot cards
            </li>
            <li className="flex items-start">
              <span className="text-violet-400 mr-2">✓</span>
              <strong>Full spread rendering</strong> with your existing spread configurations and card layouts
            </li>
            <li className="flex items-start">
              <span className="text-violet-400 mr-2">✓</span>
              <strong>Card interpretations</strong> using your enhanced cards database and position meanings
            </li>
            <li className="flex items-start">
              <span className="text-violet-400 mr-2">✓</span>
              <strong>InterpretationPanel integration</strong> - click any card to see detailed interpretations
            </li>
            <li className="flex items-start">
              <span className="text-violet-400 mr-2">✓</span>
              <strong>Narrative control</strong> - stories can constrain card draws or force specific cards
            </li>
            <li className="flex items-start">
              <span className="text-violet-400 mr-2">•</span>
              Try the story above to see real cards drawn from your backend!
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default StoryExample;