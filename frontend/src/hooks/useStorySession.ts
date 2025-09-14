import { useCallback, useEffect, useRef } from 'react';
import { DashboardManager } from '../types/storyDashboard';

interface UseStorySessionProps {
  clientId?: string;
  storyName?: string;
}

export const useStorySession = ({ clientId, storyName }: UseStorySessionProps) => {
  const sessionStartTime = useRef<Date>(new Date());
  const lastSectionRef = useRef<string>('');

  // Track when a story section changes
  const trackStoryProgress = useCallback((sectionName: string, storyText?: string) => {
    if (!clientId || !sectionName || sectionName === lastSectionRef.current) return;

    lastSectionRef.current = sectionName;

    // Add automatic note for story progress
    DashboardManager.addSessionNote(clientId, {
      type: 'conversation',
      content: `Reached story section: ${sectionName}`,
      storySection: sectionName,
      automaticNote: true
    });

    // Update client status to in-progress
    DashboardManager.updateClientStatus(clientId, 'in-progress');
  }, [clientId]);

  // Track when cards are drawn in the story
  const trackCardDrawing = useCallback((
    cards: string[],
    spreadType: string,
    title: string,
    constraints?: string
  ) => {
    if (!clientId) return;

    let noteContent = `Drew ${cards.length} cards for "${title}" using ${spreadType} spread`;
    if (constraints) {
      noteContent += ' with position constraints';
    }

    DashboardManager.addSessionNote(clientId, {
      type: 'reading',
      content: noteContent,
      cards: cards,
      automaticNote: true
    });
  }, [clientId]);

  // Track story variables changes (e.g., confidence level updates)
  const trackVariableChange = useCallback((
    variableName: string,
    newValue: any,
    oldValue?: any
  ) => {
    if (!clientId) return;

    // Update the client's variables
    DashboardManager.updateClientVariables(clientId, {
      [variableName]: newValue
    });

    // Add note about the change
    const changeDesc = oldValue !== undefined
      ? `${variableName} changed from ${oldValue} to ${newValue}`
      : `${variableName} set to ${newValue}`;

    DashboardManager.addSessionNote(clientId, {
      type: 'insight',
      content: `Variable update: ${changeDesc}`,
      automaticNote: true
    });
  }, [clientId]);

  // Track when user makes a choice in the story
  const trackChoice = useCallback((choiceText: string, sectionName?: string) => {
    if (!clientId) return;

    DashboardManager.addSessionNote(clientId, {
      type: 'conversation',
      content: `Made choice: "${choiceText}"`,
      storySection: sectionName,
      automaticNote: true
    });
  }, [clientId]);

  // Track story completion
  const trackStoryCompletion = useCallback(() => {
    if (!clientId) return;

    const sessionDuration = Math.round((Date.now() - sessionStartTime.current.getTime()) / 1000 / 60);

    DashboardManager.addSessionNote(clientId, {
      type: 'conversation',
      content: `Completed story session (${sessionDuration} minutes)`,
      automaticNote: true
    });

    DashboardManager.updateClientStatus(clientId, 'completed');
  }, [clientId]);

  // Track important story moments or insights
  const addInsight = useCallback((insight: string) => {
    if (!clientId) return;

    DashboardManager.addSessionNote(clientId, {
      type: 'insight',
      content: insight,
      automaticNote: false
    });
  }, [clientId]);

  // Track when follow-up is needed
  const markForFollowUp = useCallback((reason: string) => {
    if (!clientId) return;

    DashboardManager.addSessionNote(clientId, {
      type: 'follow-up',
      content: `Follow-up needed: ${reason}`,
      automaticNote: false
    });

    DashboardManager.updateClientStatus(clientId, 'follow-up-needed');
  }, [clientId]);

  // Initialize session tracking
  useEffect(() => {
    if (clientId && storyName) {
      sessionStartTime.current = new Date();

      DashboardManager.addSessionNote(clientId, {
        type: 'conversation',
        content: `Started new session with story: ${storyName}`,
        automaticNote: true
      });

      // Update last session time
      const dashboard = DashboardManager.loadDashboard();
      const client = dashboard.clients.find(c => c.id === clientId);
      if (client) {
        client.lastSession = new Date();
        client.totalSessions += 1;
        DashboardManager.saveDashboard(dashboard);
      }
    }

    // Cleanup on unmount
    return () => {
      if (clientId) {
        const sessionDuration = Math.round((Date.now() - sessionStartTime.current.getTime()) / 1000 / 60);
        if (sessionDuration > 1) { // Only track if session was longer than 1 minute
          DashboardManager.addSessionNote(clientId, {
            type: 'conversation',
            content: `Session ended (${sessionDuration} minutes)`,
            automaticNote: true
          });
        }
      }
    };
  }, [clientId, storyName]);

  return {
    trackStoryProgress,
    trackCardDrawing,
    trackVariableChange,
    trackChoice,
    trackStoryCompletion,
    addInsight,
    markForFollowUp
  };
};