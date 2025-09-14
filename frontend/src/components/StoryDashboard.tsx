import React, { useState, useEffect } from 'react';
import { Clock, User, FileText, Star, Calendar, AlertCircle, Play, CheckCircle } from 'lucide-react';
import { StoryClient, SessionNote, DashboardData, DashboardManager } from '../types/storyDashboard';

interface StoryDashboardProps {
  onStartStory: (storyName: string, clientId: string) => void;
  className?: string;
}

export const StoryDashboard: React.FC<StoryDashboardProps> = ({
  onStartStory,
  className = ''
}) => {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [selectedClient, setSelectedClient] = useState<StoryClient | null>(null);
  const [newNote, setNewNote] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'notes'>('overview');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = () => {
    const data = DashboardManager.loadDashboard();
    setDashboard(data);
    if (data.clients.length > 0 && !selectedClient) {
      setSelectedClient(data.clients[0]);
    }
  };

  const addSessionNote = () => {
    if (!selectedClient || !newNote.trim()) return;

    DashboardManager.addSessionNote(selectedClient.id, {
      type: 'insight',
      content: newNote.trim(),
      automaticNote: false
    });

    setNewNote('');
    loadDashboard(); // Refresh dashboard
  };

  const getStatusColor = (status: StoryClient['currentStatus']) => {
    switch (status) {
      case 'new': return 'text-blue-400 bg-blue-500/10';
      case 'in-progress': return 'text-yellow-400 bg-yellow-500/10';
      case 'completed': return 'text-green-400 bg-green-500/10';
      case 'follow-up-needed': return 'text-red-400 bg-red-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!dashboard) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-violet-300">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900 rounded-lg border border-gray-700 ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-white mb-2">Story Dashboard</h1>
        <p className="text-gray-400">Manage your client readings and track session progress</p>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="bg-violet-500/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-violet-300">{dashboard.stats.totalClients}</div>
            <div className="text-sm text-gray-400">Total Clients</div>
          </div>
          <div className="bg-blue-500/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-300">{dashboard.stats.activeClients}</div>
            <div className="text-sm text-gray-400">Active</div>
          </div>
          <div className="bg-green-500/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-300">{dashboard.stats.completedSessions}</div>
            <div className="text-sm text-gray-400">Completed</div>
          </div>
          <div className="bg-yellow-500/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-yellow-300">{dashboard.stats.upcomingFollowUps}</div>
            <div className="text-sm text-gray-400">Follow-ups</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700">
        <div className="flex px-6">
          {[
            { id: 'overview', label: 'Overview', icon: Star },
            { id: 'clients', label: 'Clients', icon: User },
            { id: 'notes', label: 'Session Notes', icon: FileText }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-violet-500 text-violet-300'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
              <div className="space-y-2">
                {dashboard.recentActivity.slice(0, 5).map(note => (
                  <div key={note.id} className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg">
                    <div className="w-2 h-2 bg-violet-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-300">{note.content}</div>
                      <div className="text-xs text-gray-500 mt-1">{formatDate(note.timestamp)}</div>
                    </div>
                  </div>
                ))}
                {dashboard.recentActivity.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    No recent activity. Start a story session to begin tracking.
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-4">
                {dashboard.clients.map(client => (
                  <button
                    key={client.id}
                    onClick={() => onStartStory(client.story, client.id)}
                    className="flex items-center gap-3 p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-violet-500 transition-colors text-left"
                  >
                    <Play size={20} className="text-violet-400 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-white">{client.name}</div>
                      <div className="text-sm text-gray-400">Continue session</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'clients' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Client List */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Client List</h3>
              <div className="space-y-3">
                {dashboard.clients.map(client => (
                  <div
                    key={client.id}
                    onClick={() => setSelectedClient(client)}
                    className={`p-4 bg-gray-800 rounded-lg border cursor-pointer transition-colors ${
                      selectedClient?.id === client.id
                        ? 'border-violet-500 bg-violet-500/5'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-white">{client.name}</div>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(client.currentStatus)}`}>
                        {client.currentStatus.replace('-', ' ')}
                      </span>
                    </div>

                    <div className="text-sm text-gray-400 mb-2 line-clamp-2">
                      {client.background}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {client.lastSession ? formatDate(client.lastSession) : 'No sessions yet'}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText size={12} />
                        {client.notes.length} notes
                      </span>
                    </div>

                    <div className="flex gap-1 mt-2">
                      {client.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Client Details */}
            <div>
              {selectedClient ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">{selectedClient.name}</h3>
                    <button
                      onClick={() => onStartStory(selectedClient.story, selectedClient.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
                    >
                      <Play size={16} />
                      Start Session
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-white mb-2">Background</h4>
                      <p className="text-gray-300 text-sm">{selectedClient.background}</p>
                    </div>

                    <div>
                      <h4 className="font-medium text-white mb-2">Current Variables</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(selectedClient.variables).map(([key, value]) => (
                          <div key={key} className="bg-gray-800 p-3 rounded-lg">
                            <div className="text-sm text-gray-400 capitalize">
                              {key.replace('_', ' ')}
                            </div>
                            <div className="text-lg font-semibold text-white">
                              {typeof value === 'number' ? `${value}/10` : String(value)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-white mb-2">Recent Notes</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {selectedClient.notes.slice(-5).reverse().map(note => (
                          <div key={note.id} className="bg-gray-800 p-3 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-violet-400 capitalize">{note.type}</span>
                              <span className="text-xs text-gray-500">
                                {formatDate(note.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-300">{note.content}</p>
                          </div>
                        ))}
                        {selectedClient.notes.length === 0 && (
                          <div className="text-center text-gray-500 py-4">
                            No notes yet. Start a session to begin tracking.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  Select a client to view details
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Session Notes</h3>
              {selectedClient && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <User size={16} />
                  {selectedClient.name}
                </div>
              )}
            </div>

            {/* Add Note */}
            {selectedClient && (
              <div className="bg-gray-800 p-4 rounded-lg mb-6">
                <h4 className="font-medium text-white mb-3">Add Session Note</h4>
                <div className="flex gap-3">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Enter your observations, insights, or follow-up actions..."
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 resize-none"
                    rows={3}
                  />
                  <button
                    onClick={addSessionNote}
                    disabled={!newNote.trim()}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors self-start"
                  >
                    Add Note
                  </button>
                </div>
              </div>
            )}

            {/* Notes List */}
            <div className="space-y-3">
              {selectedClient?.notes.slice().reverse().map(note => (
                <div key={note.id} className="bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        note.type === 'reading' ? 'bg-violet-500/10 text-violet-300' :
                        note.type === 'insight' ? 'bg-blue-500/10 text-blue-300' :
                        note.type === 'action-item' ? 'bg-yellow-500/10 text-yellow-300' :
                        note.type === 'follow-up' ? 'bg-red-500/10 text-red-300' :
                        'bg-gray-500/10 text-gray-300'
                      }`}>
                        {note.type.replace('-', ' ')}
                      </span>
                      {note.automaticNote && (
                        <span className="px-2 py-1 bg-green-500/10 text-green-300 rounded-full text-xs">
                          Auto
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDate(note.timestamp)}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm">{note.content}</p>
                  {note.cards && note.cards.length > 0 && (
                    <div className="mt-2 text-xs text-gray-400">
                      Cards: {note.cards.join(', ')}
                    </div>
                  )}
                  {note.storySection && (
                    <div className="mt-1 text-xs text-gray-500">
                      Section: {note.storySection}
                    </div>
                  )}
                </div>
              ))}
              {(!selectedClient || selectedClient.notes.length === 0) && (
                <div className="text-center text-gray-500 py-12">
                  {!selectedClient ? 'Select a client to view their session notes' : 'No session notes yet. Add notes during or after sessions to track progress.'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};