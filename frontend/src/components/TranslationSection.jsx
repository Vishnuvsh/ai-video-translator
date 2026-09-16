import React, { useState } from 'react';
import api from '../services/api';
import { SUPPORTED_LANGUAGES, getLanguageName } from '../config/languages';

const TranslationSection = ({ transcriptData }) => {
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translations, setTranslations] = useState(null);
  const [error, setError] = useState('');

  // Phase 5 States
  const [audioFiles, setAudioFiles] = useState({});
  const [generatingVoices, setGeneratingVoices] = useState({});
  const [voiceErrors, setVoiceErrors] = useState({});

  const sourceLanguage = transcriptData?.language || 'en';

  const handleLanguageToggle = (code) => {
    setSelectedLanguages((prev) =>
      prev.includes(code) ? prev.filter((l) => l !== code) : [...prev, code]
    );
  };

  const handleTranslate = async () => {
    if (!transcriptData?.transcript) {
      setError('No transcript is available for translation.');
      return;
    }
    if (selectedLanguages.length === 0) {
      setError('Please select at least one target language.');
      return;
    }

    setIsTranslating(true);
    setError('');
    // Clear previous TTS data when re-translating
    setAudioFiles({});
    setVoiceErrors({});
    
    try {
      const response = await api.post('/api/video/translate', {
        transcript: transcriptData.transcript,
        source_language: sourceLanguage,
        target_languages: selectedLanguages
      });

      if (response.data.success) {
        setTranslations(response.data.translations);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Translation service is temporarily unavailable. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const downloadTranslation = (text, languageCode) => {
    const langName = getLanguageName(languageCode).toLowerCase();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${langName}_translation.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerateVoice = async (langCode, text) => {
    setGeneratingVoices((prev) => ({ ...prev, [langCode]: true }));
    setVoiceErrors((prev) => ({ ...prev, [langCode]: '' }));
    
    try {
      const response = await api.post('/api/video/tts', {
        text: text,
        language: langCode,
        voice: 'alloy' // Default voice, can be expanded later
      });

      if (response.data.success) {
        setAudioFiles((prev) => ({ ...prev, [langCode]: response.data.audio_url }));
      }
    } catch (err) {
      setVoiceErrors((prev) => ({
        ...prev, 
        [langCode]: err.response?.data?.detail || 'Voice generation failed. Please try again.'
      }));
    } finally {
      setGeneratingVoices((prev) => ({ ...prev, [langCode]: false }));
    }
  };

  const handleGenerateAllVoices = () => {
    if (!translations) return;
    Object.entries(translations).forEach(([langCode, text]) => {
      if (!text.startsWith('Error:')) {
        handleGenerateVoice(langCode, text);
      }
    });
  };

  const getFullAudioUrl = (path) => {
    if (!path) return '';
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    return `${baseUrl}${path}`;
  };

  if (!transcriptData) return null;

  return (
    <div className="mt-8 border-t pt-6 border-gray-100 text-left animate-fade-in-up">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Translate Transcript</h3>
      
      <div className="mb-6">
        <p className="text-sm text-gray-700 font-medium mb-3">Select target languages:</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <label key={lang.code} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                checked={selectedLanguages.includes(lang.code)}
                onChange={() => handleLanguageToggle(lang.code)}
                disabled={isTranslating}
              />
              <span className="text-sm text-gray-700">{lang.name}</span>
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={handleTranslate}
        disabled={isTranslating || selectedLanguages.length === 0}
        className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-medium py-2.5 px-6 rounded-lg shadow transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
      >
        {isTranslating ? 'Translating...' : 'Translate Transcript'}
      </button>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {translations && Object.keys(translations).length > 0 && (
        <div className="mt-8 space-y-6">
          <div className="flex justify-between items-center border-b pb-2">
            <h4 className="text-lg font-bold text-gray-900">Translated Versions</h4>
            <button
              onClick={handleGenerateAllVoices}
              className="text-sm bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 font-medium py-1.5 px-4 rounded transition"
            >
              Generate All Voices
            </button>
          </div>
          
          {Object.entries(translations).map(([langCode, text]) => {
            const isErrorText = text.startsWith('Error:');
            const langName = getLanguageName(langCode);
            return (
              <div key={langCode} className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                <div className="flex justify-between items-center mb-3">
                  <h5 className="font-semibold text-gray-900 text-lg">
                    {langName} {isErrorText ? '✕' : '✓'}
                  </h5>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => copyToClipboard(text)}
                      className="text-xs bg-gray-50 border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium py-1.5 px-3 rounded transition"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => downloadTranslation(text, langCode)}
                      className="text-xs bg-gray-50 border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium py-1.5 px-3 rounded transition"
                    >
                      Download Text
                    </button>
                    {!isErrorText && (
                      <button
                        onClick={() => handleGenerateVoice(langCode, text)}
                        disabled={generatingVoices[langCode]}
                        className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium py-1.5 px-3 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {generatingVoices[langCode] ? 'Generating voice...' : 'Generate Voice'}
                      </button>
                    )}
                  </div>
                </div>
                <div className={`p-4 rounded-lg bg-gray-50 max-h-60 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed mb-4 ${isErrorText ? 'text-red-600' : 'text-gray-800'}`}>
                  {text}
                </div>
                
                {/* Voice Error Display */}
                {voiceErrors[langCode] && (
                  <p className="text-red-500 text-sm mb-3">{voiceErrors[langCode]}</p>
                )}

                {/* Audio Player */}
                {audioFiles[langCode] && (
                  <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-100 flex flex-col sm:flex-row items-center gap-4">
                    <audio 
                      controls 
                      src={getFullAudioUrl(audioFiles[langCode])} 
                      className="w-full sm:flex-1"
                    />
                    <a
                      href={getFullAudioUrl(audioFiles[langCode])}
                      download={`ai-video-translator-${langName.toLowerCase()}.mp3`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-4 rounded shadow transition text-center whitespace-nowrap w-full sm:w-auto"
                    >
                      Download Audio
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TranslationSection;
