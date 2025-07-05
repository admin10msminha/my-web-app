import React from 'react';
import { StoryboardPanelData } from '../types';

interface StoryboardPanelProps {
  panel: StoryboardPanelData;
  isSpeaking: boolean;
  onToggleSpeech: (text: string) => void;
}

export const StoryboardPanel: React.FC<StoryboardPanelProps> = ({
  panel,
  isSpeaking,
  onToggleSpeech
}) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Scene {panel.id + 1}
        </h3>
        {panel.imageUrl && panel.imageUrl !== 'error' ? (
          <img
            src={panel.imageUrl}
            alt={`Scene ${panel.id + 1}`}
            className="w-full h-48 object-cover rounded-lg"
          />
        ) : panel.imageUrl === 'error' ? (
          <div className="w-full h-48 bg-red-100 rounded-lg flex items-center justify-center">
            <span className="text-red-600">Failed to load image</span>
          </div>
        ) : (
          <div className="w-full h-48 bg-gray-200 rounded-lg animate-pulse"></div>
        )}
      </div>
      
      <div className="space-y-3">
        <p className="text-gray-700 leading-relaxed">{panel.text}</p>
        
        <button
          onClick={() => onToggleSpeech(panel.text)}
          className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
            isSpeaking
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isSpeaking ? 'Stop' : 'Play'}
        </button>
      </div>
    </div>
  );
};