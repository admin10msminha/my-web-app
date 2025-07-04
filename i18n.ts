
export const uiStrings = {
  en: {
    title: "AI Text-to-Video",
    titleHighlight: "Generator",
    subtitle: "Turn your ideas into animated videos. Describe a scene or story, and our AI will generate a complete video with animations and music.",
    footer: "Powered by A4F & Google Models (Imagen 4). Video rendering is done in-browser.",
    downloadPdf: "Download Storyboard (PDF)",
    generateVideo: "Generate Video",
    videoNote: "Video includes animations and music. Narration is for storyboard preview only.",
    settings: {
        language: "Story Language",
        scenes: "Scenes",
        voice: "Voice Tone (for Preview)",
        selectVoice: "Select a voice..."
    },
    prompt: {
        placeholder: "e.g., A robot explorer discovering a glowing forest on an alien planet...",
        button: "Generate Storyboard",
        buttonLoading: "Generating...",
    },
    loader: {
        script: "Generating story script & music theme...",
        images: "Generating storyboard images...",
        pdf: "Preparing PDF download...",
        video: "Rendering video, this may take a moment...",
    },
    errors: {
        tts: "Text-to-speech failed.",
        unknown: "An unknown error occurred.",
        pdf: "Failed to create PDF.",
        script: "Failed to generate story script. The prompt might be too complex or the AI service is busy. Please simplify your prompt or try again.",
        image: "An error occurred while generating an image for a scene.",
        rateLimit: "Image generation limit reached. The process has been stopped. Please wait a few moments before trying again.",
        videoGen: "Video generation failed. Ensure all images were created successfully before trying again."
    }
  }
};