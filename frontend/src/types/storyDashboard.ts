// Story Dashboard Types
export interface StoryClient {
  id: string;
  name: string;
  story: string; // Story file name (e.g., 'sarah')
  avatar?: string;
  background: string;
  currentStatus: 'new' | 'in-progress' | 'completed' | 'follow-up-needed';
  lastSession?: Date;
  totalSessions: number;
  variables: Record<string, any>; // Story-specific variables (e.g., confidence_level)
  notes: SessionNote[];
  tags: string[]; // For categorization (e.g., 'career', 'relationship', 'spiritual')
}

export interface SessionNote {
  id: string;
  timestamp: Date;
  type: 'reading' | 'conversation' | 'insight' | 'action-item' | 'follow-up';
  content: string;
  storySection?: string; // Which part of the story this came from
  cards?: string[]; // Cards drawn in this session
  automaticNote: boolean; // True if generated automatically, false if user-added
}

export interface StoryProgress {
  clientId: string;
  storyFile: string;
  currentSection: string;
  sectionsCompleted: string[];
  variableSnapshot: Record<string, any>;
  lastPlayedAt: Date;
  totalPlayTime: number; // in minutes
}

export interface DashboardData {
  clients: StoryClient[];
  recentActivity: SessionNote[];
  stats: {
    totalClients: number;
    activeClients: number;
    completedSessions: number;
    upcomingFollowUps: number;
  };
}

// Client templates for different stories
export const CLIENT_TEMPLATES: Record<string, Partial<StoryClient>> = {
  sarah: {
    name: "Sarah Chen",
    background: "Software developer seeking clarity about a major career transition. Recently offered a senior role at a startup but unsure about leaving her stable corporate job.",
    tags: ['career', 'decision-making', 'transition'],
    variables: {
      confidence_level: 3,
      decision_clarity: 2,
      risk_tolerance: 4,
      family_support: 5
    }
  },
  position_constraint_test: {
    name: "Demo Client",
    background: "Interactive demonstration of the tarot constraint system for educational purposes.",
    tags: ['demo', 'educational', 'constraints'],
    variables: {
      demo_progress: 0,
      understanding_level: 1
    }
  }
};

// Helper functions for dashboard operations
export class DashboardManager {
  private static STORAGE_KEY = 'arcanum_story_dashboard';

  static loadDashboard(): DashboardData {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        // Convert date strings back to Date objects
        if (data.clients) {
          data.clients.forEach((client: StoryClient) => {
            if (client.lastSession) {
              client.lastSession = new Date(client.lastSession);
            }
            if (client.notes) {
              client.notes.forEach((note: SessionNote) => {
                note.timestamp = new Date(note.timestamp);
              });
            }
          });
        }
        return data;
      } catch (error) {
        console.error('Error parsing stored dashboard data:', error);
        return this.createDefaultDashboard();
      }
    }

    // Initialize with default clients
    return this.createDefaultDashboard();
  }

  static saveDashboard(data: DashboardData): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving dashboard data:', error);
    }
  }

  static createDefaultDashboard(): DashboardData {
    const defaultClients: StoryClient[] = [
      {
        id: 'sarah_001',
        name: 'Sarah Chen',
        story: 'sarah',
        background: CLIENT_TEMPLATES.sarah.background!,
        currentStatus: 'new',
        totalSessions: 0,
        variables: { ...CLIENT_TEMPLATES.sarah.variables! },
        notes: [],
        tags: [...CLIENT_TEMPLATES.sarah.tags!]
      },
      {
        id: 'demo_001',
        name: 'Demo Client',
        story: 'position_constraint_test',
        background: CLIENT_TEMPLATES.position_constraint_test.background!,
        currentStatus: 'new',
        totalSessions: 0,
        variables: { ...CLIENT_TEMPLATES.position_constraint_test.variables! },
        notes: [],
        tags: [...CLIENT_TEMPLATES.position_constraint_test.tags!]
      }
    ];

    return {
      clients: defaultClients,
      recentActivity: [],
      stats: {
        totalClients: defaultClients.length,
        activeClients: 0,
        completedSessions: 0,
        upcomingFollowUps: 0
      }
    };
  }

  static addSessionNote(
    clientId: string,
    note: Omit<SessionNote, 'id' | 'timestamp'>
  ): void {
    const dashboard = this.loadDashboard();
    const client = dashboard.clients.find(c => c.id === clientId);

    if (client) {
      const sessionNote: SessionNote = {
        ...note,
        id: Date.now().toString(),
        timestamp: new Date()
      };

      client.notes.push(sessionNote);
      dashboard.recentActivity.unshift(sessionNote);

      // Keep only last 50 recent activities
      if (dashboard.recentActivity.length > 50) {
        dashboard.recentActivity = dashboard.recentActivity.slice(0, 50);
      }

      client.lastSession = new Date();
      this.saveDashboard(dashboard);
    }
  }

  static updateClientVariables(clientId: string, variables: Record<string, any>): void {
    const dashboard = this.loadDashboard();
    const client = dashboard.clients.find(c => c.id === clientId);

    if (client) {
      client.variables = { ...client.variables, ...variables };
      this.saveDashboard(dashboard);
    }
  }

  static updateClientStatus(clientId: string, status: StoryClient['currentStatus']): void {
    const dashboard = this.loadDashboard();
    const client = dashboard.clients.find(c => c.id === clientId);

    if (client) {
      client.currentStatus = status;
      this.saveDashboard(dashboard);
    }
  }

  static getClientByStory(storyName: string): StoryClient | undefined {
    const dashboard = this.loadDashboard();
    return dashboard.clients.find(c => c.story === storyName);
  }
}