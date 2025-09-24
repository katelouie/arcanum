import React from 'react';
import { Clock, User, FileText, Star, Calendar, BookOpen, Sparkles, Play } from 'lucide-react';

interface Choice {
  text: string;
  index: number;
}

interface DashboardViewProps {
  choices: Choice[];
  storyContent: string[] | Array<{text: string; tags: string[]}>;
  onChoiceClick: (index: number) => void;
  className?: string;
}

interface ClientChoice {
  isClient: boolean;
  clientName?: string;
  sessionInfo?: string;
  notes?: string;
  status?: 'not_started' | 'in_progress' | 'complete';
}

function parseChoiceText(text: string): ClientChoice {
  // Parse client choices like "Continue with Sarah Chen (Session 2/3)"
  const clientMatch = text.match(/Continue with (.+?) \(Session (\d+)\/(\d+)\)/);

  if (clientMatch) {
    const [, clientName, currentSession, totalSessions] = clientMatch;
    return {
      isClient: true,
      clientName,
      sessionInfo: `Session ${currentSession}/${totalSessions}`,
      status: parseInt(currentSession) === 0 ? 'not_started' : 'in_progress'
    };
  }

  // Parse test/development clients like "Continue with Jane Doe (Development Testing)"
  const testClientMatch = text.match(/Continue with (.+?) \(Development Testing\)/);
  if (testClientMatch) {
    const [, clientName] = testClientMatch;
    return {
      isClient: true,
      clientName,
      sessionInfo: 'Test Client',
      status: 'not_started'
    };
  }

  // Check for completed clients
  const completeMatch = text.match(/(.+?) - All sessions complete/);
  if (completeMatch) {
    const [, clientName] = completeMatch;
    return {
      isClient: true,
      clientName,
      sessionInfo: 'Complete',
      status: 'complete'
    };
  }

  return { isClient: false };
}

function getStatusBadge(status: ClientChoice['status']) {
  switch (status) {
    case 'not_started':
      return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    case 'in_progress':
      return 'bg-violet-500/20 text-violet-300 border-violet-500/30';
    case 'complete':
      return 'bg-green-500/20 text-green-300 border-green-500/30';
    default:
      return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  }
}

function getStatusText(status: ClientChoice['status']) {
  switch (status) {
    case 'not_started':
      return 'Ready to Begin';
    case 'in_progress':
      return 'In Progress';
    case 'complete':
      return 'Complete';
    default:
      return 'Unknown';
  }
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  choices,
  storyContent,
  onChoiceClick,
  className = ''
}) => {
  // Separate client choices from other actions
  const clientChoices = choices.filter(choice => {
    const parsed = parseChoiceText(choice.text);
    return parsed.isClient;
  });

  const otherChoices = choices.filter(choice => {
    const parsed = parseChoiceText(choice.text);
    return !parsed.isClient;
  });

  return (
    <div className={`bg-gradient-to-br from-slate-900/95 via-violet-950/30 to-slate-900/95 rounded-lg border border-gray-700/50 backdrop-blur-sm ${className}`}>
      {/* Professional Header */}
      <div className="border-b border-gray-700/50 p-6 bg-gradient-to-r from-slate-800/60 to-violet-900/40">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-violet-600/20 rounded-lg border border-violet-500/30">
            <BookOpen className="h-6 w-6 text-violet-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Your Reading Room</h1>
            <p className="text-violet-200/80">Professional tarot practice and client guidance</p>
          </div>
        </div>

        {/* Workspace atmosphere text */}
        {storyContent.length > 0 && (
          <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/30">
            {storyContent.map((paragraph, index) => {
              // Handle both string and tagged paragraph formats
              const text = typeof paragraph === 'string' ? paragraph : paragraph.text;
              return (
                <p key={index} className="text-gray-300 leading-relaxed text-sm italic">
                  {text}
                </p>
              );
            })}
          </div>
        )}
      </div>

      {/* Client Book Section */}
      <div className="p-6">
        {clientChoices.length > 0 && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="h-5 w-5 text-violet-400" />
              <h2 className="text-xl font-semibold text-white">Appointment Book</h2>
              <div className="text-sm text-gray-400">({clientChoices.length} clients)</div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
              {clientChoices.map((choice) => {
                const clientInfo = parseChoiceText(choice.text);

                return (
                  <div
                    key={choice.index}
                    className="bg-gradient-to-br from-slate-800/80 to-violet-900/20 border border-gray-600/50 rounded-lg p-6 hover:border-violet-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-violet-500/10"
                  >
                    {/* Client Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {clientInfo.clientName}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${getStatusBadge(clientInfo.status)}`}>
                          {getStatusText(clientInfo.status)}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-400">Progress</div>
                        <div className="text-lg font-bold text-violet-300">
                          {clientInfo.sessionInfo}
                        </div>
                      </div>
                    </div>

                    {/* Session Progress (if applicable) */}
                    {clientInfo.status !== 'complete' && clientInfo.sessionInfo?.includes('/') && (
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>Journey Progress</span>
                          {(() => {
                            const match = clientInfo.sessionInfo.match(/(\d+)\/(\d+)/);
                            if (match) {
                              const current = parseInt(match[1]);
                              const total = parseInt(match[2]);
                              const percent = Math.round((current / total) * 100);
                              return <span>{percent}%</span>;
                            }
                            return null;
                          })()}
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          {(() => {
                            const match = clientInfo.sessionInfo.match(/(\d+)\/(\d+)/);
                            if (match) {
                              const current = parseInt(match[1]);
                              const total = parseInt(match[2]);
                              const percent = (current / total) * 100;
                              return (
                                <div
                                  className="bg-gradient-to-r from-violet-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${percent}%` }}
                                ></div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Client insights - only show if client has had sessions */}
                    {clientInfo.status !== 'not_started' && (
                      <div className="mb-4">
                        <div className="text-sm text-gray-400 mb-1">Session Notes</div>
                        <p className="text-sm text-gray-300 line-clamp-3 leading-relaxed">
                          {clientInfo.clientName === 'Sarah Chen'
                            ? "Environmental policy graduate navigating career uncertainty and relationship decisions. Growing confidence in her authentic path."
                            : "Insights from previous readings and growth observations."
                          }
                        </p>
                      </div>
                    )}

                    {/* First-time client welcome */}
                    {clientInfo.status === 'not_started' && (
                      <div className="mb-4">
                        <div className="text-sm text-gray-400 mb-1">New Client</div>
                        <p className="text-sm text-gray-300 line-clamp-3 leading-relaxed">
                          Ready to begin their first tarot reading session. No prior notes available.
                        </p>
                      </div>
                    )}

                    {/* Action Button */}
                    <button
                      onClick={() => onChoiceClick(choice.index)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:shadow-violet-500/25"
                    >
                      {clientInfo.status === 'complete' ? (
                        <>
                          <FileText size={16} />
                          Review Journey
                        </>
                      ) : (
                        <>
                          <Play size={16} />
                          {clientInfo.status === 'not_started' ? 'Begin Reading' : 'Continue Session'}
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Other Actions */}
        {otherChoices.length > 0 && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <Star className="h-5 w-5 text-indigo-400" />
              <h2 className="text-lg font-semibold text-white">Practice Actions</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {otherChoices.map((choice) => (
                <button
                  key={choice.index}
                  onClick={() => onChoiceClick(choice.index)}
                  className="flex items-center gap-3 p-4 bg-slate-800/60 border border-slate-700/50 rounded-lg hover:border-indigo-500/50 transition-all duration-200 text-left hover:bg-slate-800/80"
                >
                  {choice.text.includes('Review') && <FileText size={20} className="text-indigo-400 flex-shrink-0" />}
                  {choice.text.includes('Close') && <Clock size={20} className="text-amber-400 flex-shrink-0" />}
                  <div>
                    <div className="font-medium text-white">{choice.text}</div>
                    <div className="text-sm text-gray-400">
                      {choice.text.includes('Review') && 'Reflect on your practice and client insights'}
                      {choice.text.includes('Close') && 'End your reading session for today'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Empty state */}
        {choices.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-gray-600 rounded-lg">
            <BookOpen className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">Reading Room Complete</h3>
            <p className="text-gray-500">No more appointments for today.</p>
          </div>
        )}
      </div>
    </div>
  );
};