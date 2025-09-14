import React from 'react';

// Simple test component without external imports
interface StoryDashboardSimpleProps {
  onStartStory: (storyName: string, clientId: string) => void;
  className?: string;
}

export const StoryDashboardSimple: React.FC<StoryDashboardSimpleProps> = ({
  onStartStory,
  className = ''
}) => {
  return (
    <div className={`bg-gray-900 rounded-lg border border-gray-700 p-6 ${className}`}>
      <h1 className="text-2xl font-bold text-white mb-4">Story Dashboard</h1>
      <p className="text-gray-400 mb-4">Dashboard is loading...</p>

      <div className="space-y-3">
        <button
          onClick={() => onStartStory('sarah', 'sarah_001')}
          className="w-full p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-violet-500 transition-colors text-left"
        >
          <div className="font-medium text-white">Sarah Chen</div>
          <div className="text-sm text-gray-400">Career transition client</div>
        </button>

        <button
          onClick={() => onStartStory('position_constraint_test', 'demo_001')}
          className="w-full p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-violet-500 transition-colors text-left"
        >
          <div className="font-medium text-white">Demo Client</div>
          <div className="text-sm text-gray-400">Position constraint demonstration</div>
        </button>
      </div>
    </div>
  );
};