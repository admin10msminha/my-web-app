import React from 'react';

interface SettingsControlsProps {
  language: string;
  setLanguage: (language: string) => void;
  sceneCount: number;
  setSceneCount: (count: number) => void;
  voices: SpeechSynthesisVoice[];
  selectedVoiceURI: string | null;
  setSelectedVoiceURI: (uri: string) => void;
  strings: {
    language: string;
    scenes: string;
    voice: string;
  };
  isDisabled: boolean;
}

export const SettingsControls: React.FC<SettingsControlsProps> = ({
  language,
  setLanguage,
  sceneCount,
  setSceneCount,
  voices,
  selectedVoiceURI,
  setSelectedVoiceURI,
  strings,
  isDisabled
}) => {
  return (
    <div className="flex flex-wrap gap-4 items-center justify-center bg-gray-100 p-4 rounded-lg">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">
          {strings.language}:
        </label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          disabled={isDisabled}
          className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <option value="en">English</option>
          <option value="bn">Bengali</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">
          {strings.scenes}:
        </label>
        <select
          value={sceneCount}
          onChange={(e) => setSceneCount(Number(e.target.value))}
          disabled={isDisabled}
          className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {[2, 3, 4, 5, 6].map(count => (
            <option key={count} value={count}>{count}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">
          {strings.voice}:
        </label>
        <select
          value={selectedVoiceURI || ''}
          onChange={(e) => setSelectedVoiceURI(e.target.value)}
          disabled={isDisabled || voices.length === 0}
          className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {voices.map(voice => (
            <option key={voice.voiceURI} value={voice.voiceURI}>
              {voice.name} ({voice.lang})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};