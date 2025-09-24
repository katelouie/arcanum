import { useState, useEffect } from 'react';

export interface Story {
  id: string;
  title: string;
  path: string;
  format: string;
  description: string;
  file_size: number;
  modified: number;
  category: string;
}

interface StoriesResponse {
  stories: Story[];
  error?: string;
}

export const useStories = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStories = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://127.0.0.1:8000/api/stories');
      if (!response.ok) {
        throw new Error(`Failed to fetch stories: ${response.statusText}`);
      }

      const data: StoriesResponse = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setStories(data.stories);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('[useStories] Error fetching stories:', err);

      // Fallback to empty array on error
      setStories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const refetch = () => {
    fetchStories();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatModifiedDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'Test': return 'bg-blue-600';
      case 'SugarCube': return 'bg-green-600';
      case 'Advanced': return 'bg-purple-600';
      case 'Tarot': return 'bg-violet-600';
      default: return 'bg-gray-600';
    }
  };

  return {
    stories,
    loading,
    error,
    refetch,
    formatFileSize,
    formatModifiedDate,
    getCategoryColor
  };
};