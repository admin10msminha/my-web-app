
export interface StoryboardPanelData {
  id: number;
  sceneDescription: string;
  narratorScript: string;
  imageUrl: string | null;
  imagePrompt: string;
  imageText: string;
}

export type MusicTheme = 'epic' | 'calm' | 'mysterious' | 'upbeat' | 'none';

export interface StoryData {
    scenes: StoryboardPanelData[];
    musicTheme: MusicTheme;
}
