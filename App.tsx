import React, { useState, useEffect, useCallback } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { PromptInput } from './components/PromptInput';
import { StoryboardPanel } from './components/StoryboardPanel';
import { Loader } from './components/Loader';
import { ErrorMessage } from './components/ErrorMessage';
import { StoryData, StoryboardPanelData } from './types';
import { generateStoryScript, generateImage, AuthError } from './services/geminiService';
import { renderVideo } from './services/videoService.ts';
import { uiStrings } from './i18n';
import { SettingsControls } from './components/SettingsControls';
import { DownloadIcon } from './components/icons/DownloadIcon';
import { VideoIcon } from './components/icons/VideoIcon';
import { ConfigurationError } from './components/ConfigurationError';

export const App = (): React.ReactNode => {
  const [prompt, setPrompt] = useState<string>('');
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [authFailedMessage, setAuthFailedMessage] = useState<string | null>(null);
  const [speakingPanelId, setSpeakingPanelId] = useState<number | null>(null);
  
  const [language, setLanguage] = useState<string>('en');
  const [sceneCount, setSceneCount] = useState<number>(4);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | null>(null);
  
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const strings = uiStrings.en;

  if (authFailedMessage) {
    return <ConfigurationError message={authFailedMessage} />;
  }

  useEffect(() => {
    const synth = window.speechSynthesis;
    const loadVoices = () => {
      const availableVoices = synth.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
        const langCode = language === 'bn' ? 'bn' : 'en';
        const filteredVoices = availableVoices.filter(v => v.lang.startsWith(langCode));
        const defaultVoice = filteredVoices.find(v => v.default) || filteredVoices[0];
        
        if (defaultVoice && !selectedVoiceURI) {
          setSelectedVoiceURI(defaultVoice.voiceURI);
        } else if (availableVoices.length > 0 && !selectedVoiceURI) {
          setSelectedVoiceURI(availableVoices[0].voiceURI);
        }
      }
    };
    
    synth.onvoiceschanged = loadVoices;
    loadVoices();

    const handleBeforeUnload = () => synth.cancel();
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      synth.cancel();
      synth.onvoiceschanged = null;
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [language, selectedVoiceURI]);

  const handleToggleSpeech = useCallback((panelId: number, text: string) => {
    const synth = window.speechSynthesis;
    if (speakingPanelId === panelId) {
      synth.cancel();
      setSpeakingPanelId(null);
    } else {
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      const selectedVoice = voices.find(v => v.voiceURI === selectedVoiceURI);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
      } else {
        utterance.lang = language === 'bn' ? 'bn-BD' : 'en-US';
      }

      utterance.onend = () => setSpeakingPanelId(null);
      
      utterance.onerror = (e: SpeechSynthesisErrorEvent) => {
        // The 'interrupted' error is expected when the user cancels speech,
        // so we shouldn't treat it as an actual error to be displayed.
        if (e.error === 'interrupted') {
            console.log("Speech synthesis was intentionally interrupted.");
            setSpeakingPanelId(null); // Ensure state is cleaned up.
            return;
        }
        
        // For all other errors, log and display them.
        console.error("Speech synthesis error:", e.error);
        const reason = e.error || 'unknown issue';
        const specificError = `${strings.errors.tts} (Reason: ${reason})`;
        setError(specificError);
        setSpeakingPanelId(null);
      };

      synth.speak(utterance);
      setSpeakingPanelId(panelId);
    }
  }, [speakingPanelId, selectedVoiceURI, voices, language, strings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setStoryData(null);
    setVideoUrl(null);
    window.speechSynthesis.cancel();
    setSpeakingPanelId(null);

    try {
      setLoadingMessage(strings.loader.script);
      const newStoryData = await generateStoryScript(prompt, language, sceneCount);
      setStoryData(newStoryData);

      setLoadingMessage(strings.loader.images);
      
      const updatedPanels: StoryboardPanelData[] = [...newStoryData.scenes];
      for (const panel of newStoryData.scenes) {
        try {
            setLoadingMessage(`${strings.loader.images} (${panel.id + 1}/${sceneCount})`);
            const imageUrl = await generateImage(panel.imagePrompt, panel.imageText);
            updatedPanels[panel.id] = { ...panel, imageUrl };
            setStoryData(prev => prev ? { ...prev, scenes: [...updatedPanels] } : null);
        } catch(imgError) {
             console.error(`Failed to generate image for scene ${panel.id}:`, imgError);
             updatedPanels[panel.id] = { ...panel, imageUrl: 'error' };
             setStoryData(prev => prev ? { ...prev, scenes: [...updatedPanels] } : null);
             
             if ((imgError as any).name === 'AuthError') {
                setAuthFailedMessage((imgError as Error).message);
                return;
             }
             if (imgError instanceof Error && imgError.message.includes('rate limit')) {
                setError(strings.errors.rateLimit);
                break;
             } else {
                setError(prev => prev || strings.errors.image);
             }
        }
      }

    } catch (err) {
      console.error(err);
      if ((err as any).name === 'AuthError') {
        setAuthFailedMessage((err as Error).message);
      } else {
        setError((err instanceof Error) ? err.message : strings.errors.script);
      }
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };
  
  const handleGenerateVideo = async () => {
    if (!storyData || storyData.scenes.some(p => !p.imageUrl || p.imageUrl === 'error')) {
      setError(strings.errors.videoGen);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setVideoUrl(null);

    try {
      const videoBlob = await renderVideo(storyData, (progress) => {
        setLoadingMessage(`${strings.loader.video} (${Math.round(progress * 100)}%)`);
      });
      const url = URL.createObjectURL(videoBlob);
      setVideoUrl(url);
    } catch (err) {
      console.error("Video generation failed:", err);
      if (err instanceof Error && err.message.toLowerCase().includes('decode audio')) {
          setError('Video Generation Error: Could not decode background music. The audio file may be invalid.');
      } else {
          setError(err instanceof Error ? err.message : strings.errors.videoGen);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
      const storyboardElement = document.getElementById('storyboard-grid');
      if (!storyboardElement || isLoading) return;

      setIsLoading(true);
      setLoadingMessage(strings.loader.pdf);
      setError(null);

      try {
          storyboardElement.classList.add('no-hover-effects');
          const canvas = await html2canvas(storyboardElement, { scale: 2, backgroundColor: '#111827', useCORS: true });
          storyboardElement.classList.remove('no-hover-effects');

          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width, canvas.height] });

          pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
          pdf.save(`ai-storyboard-${prompt.substring(0, 15).replace(/\s+/g, '-')}.pdf`);
      } catch (err) {
          setError(err instanceof Error ? err.message : strings.errors.pdf);
      } finally {
          setIsLoading(false);
      }
  };

  const allImagesLoaded = storyData && storyData.scenes.every(p => p.imageUrl);

  return (
    <div className="min-h-screen bg-dark-100 text-dark-content font-sans">
      <main className="container mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            {strings.title} <span className="text-brand-primary">{strings.titleHighlight}</span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-dark-content/70">
            {strings.subtitle}
          </p>
        </header>

        <div className="sticky top-4 z-10 py-2 bg-dark-100/80 backdrop-blur-sm flex flex-col gap-4">
            <SettingsControls 
                language={language}
                setLanguage={setLanguage}
                sceneCount={sceneCount}
                setSceneCount={setSceneCount}
                voices={voices}
                selectedVoiceURI={selectedVoiceURI}
                setSelectedVoiceURI={setSelectedVoiceURI}
                strings={strings.settings}
                isDisabled={isLoading}
            />
            <PromptInput
              prompt={prompt}
              setPrompt={setPrompt}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              strings={strings.prompt}
            />
        </div>

        <div className="mt-8">
            <ErrorMessage message={error} />

            {allImagesLoaded && !isLoading && (
              <div className="text-center mb-6 flex flex-wrap justify-center gap-4">
                 <button
                  onClick={handleGenerateVideo}
                  className="bg-brand-primary hover:bg-brand-secondary text-white font-bold py-2 px-6 rounded-lg flex items-center justify-center transition-colors duration-300"
                >
                  <VideoIcon className="w-5 h-5 mr-2" />
                  {strings.generateVideo}
                </button>
                <button
                  onClick={handleDownloadPdf}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg flex items-center justify-center transition-colors duration-300"
                >
                  <DownloadIcon className="w-5 h-5 mr-2" />
                  {strings.downloadPdf}
                </button>
              </div>
            )}
            
            {isLoading && <Loader message={loadingMessage} />}
            
            {videoUrl && !isLoading && (
                <div className="my-8 max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold text-center mb-4">Your Generated Video</h2>
                    <div className="aspect-video bg-dark-200 rounded-xl overflow-hidden shadow-lg border border-dark-300">
                        <video src={videoUrl} controls autoPlay className="w-full h-full"></video>
                    </div>
                    <p className="text-center text-sm text-dark-content/60 mt-2">{strings.videoNote}</p>
                </div>
            )}

            {storyData && storyData.scenes.length > 0 && (
                <div id="storyboard-grid" className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                    {storyData.scenes.map((panel) => (
                        <StoryboardPanel
                            key={panel.id}
                            panel={panel}
                            isSpeaking={speakingPanelId === panel.id}
                            onToggleSpeech={(text) => handleToggleSpeech(panel.id, text)}
                        />
                    ))}
                </div>
            )}
        </div>
      </main>
      <footer className="text-center py-6 text-dark-content/50 text-sm">
        <p>{strings.footer}</p>
      </footer>
       <style>{`
        .no-hover-effects .hover\\:shadow-2xl:hover {
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05) !important;
        }
        .no-hover-effects .hover\\:border-brand-primary\\/50:hover {
            border-color: #374151 !important;
        }
      `}</style>
    </div>
  );
};