import { StoryData, StoryboardPanelData } from '../types';

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

if (!GEMINI_API_KEY || GEMINI_API_KEY === 'PLACEHOLDER_API_KEY') {
  console.warn('Gemini API key not configured. Please set VITE_GEMINI_API_KEY in your environment variables.');
}

export const generateStoryScript = async (prompt: string, language: string, sceneCount: number): Promise<StoryData> => {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'PLACEHOLDER_API_KEY') {
    throw new AuthError('Gemini API not configured. Please add your API key to the .env.local file as VITE_GEMINI_API_KEY=your_api_key_here');
  }

  const systemPrompt = `You are a creative storytelling AI that generates visual storyboards. Create a ${sceneCount}-scene story based on the user's prompt. Each scene should have:
1. A brief narrative description (2-3 sentences)
2. A detailed visual description for image generation
3. Any text that should appear in the scene

Respond with a JSON object in this exact format:
{
  "title": "Story Title",
  "scenes": [
    {
      "id": 0,
      "narrative": "Scene description...",
      "imagePrompt": "Detailed visual description for AI image generation...",
      "imageText": "Any text to display in the scene"
    }
  ]
}

Language: ${language === 'bn' ? 'Bengali' : 'English'}
Scene count: ${sceneCount}
User prompt: ${prompt}`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: systemPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new AuthError('Invalid API key. Please check your Gemini API key.');
      }
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response from Gemini API');
    }

    const content = data.candidates[0].content.parts[0].text;
    
    // Extract JSON from the response (remove any markdown formatting)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse story data from API response');
    }

    const storyData = JSON.parse(jsonMatch[0]);
    
    // Validate the structure
    if (!storyData.title || !Array.isArray(storyData.scenes)) {
      throw new Error('Invalid story data structure');
    }

    // Ensure scenes have proper IDs
    storyData.scenes = storyData.scenes.map((scene: any, index: number) => ({
      ...scene,
      id: index,
      imageUrl: null // Will be populated later
    }));

    return storyData as StoryData;
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    console.error('Error generating story script:', error);
    throw new Error(`Failed to generate story: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const generateImage = async (imagePrompt: string, imageText: string): Promise<string> => {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'PLACEHOLDER_API_KEY') {
    throw new AuthError('Gemini API not configured. Please add your API key to the .env.local file as VITE_GEMINI_API_KEY=your_api_key_here');
  }

  // For now, we'll use a placeholder image service since Gemini doesn't directly generate images
  // In a real implementation, you would use a service like DALL-E, Midjourney, or Stable Diffusion
  
  // Using a placeholder image service that generates images based on text
  const encodedPrompt = encodeURIComponent(imagePrompt);
  const imageUrl = `https://picsum.photos/800/600?random=${Math.random()}&text=${encodedPrompt}`;
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return imageUrl;
};