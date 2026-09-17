import React, { useState } from 'react';
import api from '../services/api';
import { SUPPORTED_LANGUAGES, getLanguageName } from '../config/languages';
import VideoPlayer from './VideoPlayer';

const TranslationSection = ({ transcriptData, videoUrl }) => {
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translations, setTranslations] = useState(null);
  const [error, setError] = useState('');

  // Phase 5 States
  const [audioFiles, setAudioFiles] = useState({});
  const [generatingVoices, setGeneratingVoices] = useState({});
  const [voiceErrors, setVoiceErrors] = useState({});
  const [activeSubtitleLang, setActiveSubtitleLang] = useState(null);

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
        segments: transcriptData.segments || [],
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
    Object.entries(translations).forEach(([langCode, transObj]) => {
      const textContent = typeof transObj === 'string' ? transObj : transObj?.text || '';
      if (!textContent.startsWith('Error:')) {
        handleGenerateVoice(langCode, textContent);
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
        className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-medium py-2.5 px-6 rounded-lg shadow hover-lift transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover-lift-none disabled:transform-none mb-4 flex items-center justify-center min-w-[200px]"
      >
        {isTranslating ? (
          <span className="flex items-center space-x-2">
            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" style={{ animationDuration: '0.5s' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="animate-pulse">Translating...</span>
          </span>
        ) : (
          'Translate Transcript'
        )}
      </button>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {translations && Object.keys(translations).length > 0 && (
        <div className="mt-8 space-y-6">
          
          {/* Subtitles Player */}
          {activeSubtitleLang && translations[activeSubtitleLang] && videoUrl && (
             <div className="mb-6 animate-fade-in-up">
               <div className="flex justify-between items-center mb-2">
                 <h4 className="font-bold text-gray-900">
                   Playing Subtitles: <span className="text-amber-600">{getLanguageName(activeSubtitleLang)}</span>
                 </h4>
                 <button onClick={() => setActiveSubtitleLang(null)} className="text-sm text-gray-500 hover:text-gray-700 transition">Close Player</button>
               </div>
               <VideoPlayer url={videoUrl} segments={translations[activeSubtitleLang]?.segments || []} />
             </div>
          )}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-2 gap-3 sm:gap-0">
            <h4 className="text-lg font-bold text-gray-900">Translated Versions</h4>
            <button
              onClick={handleGenerateAllVoices}
              className="w-full sm:w-auto text-sm bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 font-medium py-1.5 px-4 rounded hover-lift transition-all duration-300 text-center"
            >
              Generate All Voices
            </button>
          </div>
          
          {Object.entries(translations).map(([langCode, transObj], index) => {
            const textContent = typeof transObj === 'string' ? transObj : transObj?.text || '';
            const segments = typeof transObj === 'string' ? [] : transObj?.segments || [];
            const isErrorText = textContent.startsWith('Error:');
            const langName = getLanguageName(langCode);
            return (
              <div key={langCode} className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 animate-fade-in-up hover:shadow-md transition-shadow duration-300" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3 md:gap-0">
                  <h5 className="font-semibold text-gray-900 text-lg mb-1 md:mb-0">
                    {langName} {isErrorText ? '✕' : '✓'}
                  </h5>
                  <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    {!isErrorText && segments.length > 0 && videoUrl && (
                      <button
                        onClick={() => {
                          setActiveSubtitleLang(langCode);
                          window.scrollTo({ top: document.querySelector('.mt-8.space-y-6').offsetTop - 50, behavior: 'smooth' });
                        }}
                        className="flex-1 md:flex-none text-center text-xs bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 font-medium py-1.5 px-3 rounded hover-lift transition-all duration-200"
                      >
                        Play Subtitles
                      </button>
                    )}
                    <button
                      onClick={() => copyToClipboard(textContent)}
                      className="flex-1 md:flex-none text-center text-xs bg-gray-50 border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium py-1.5 px-3 rounded hover-lift transition-all duration-200"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => downloadTranslation(textContent, langCode)}
                      className="flex-1 md:flex-none text-center text-xs bg-gray-50 border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium py-1.5 px-3 rounded hover-lift transition-all duration-200"
                    >
                      Download
                    </button>
                    {!isErrorText && (
                      <button
                        onClick={() => handleGenerateVoice(langCode, textContent)}
                        disabled={generatingVoices[langCode]}
                        className="w-full sm:flex-1 md:flex-none text-center text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium py-1.5 px-3 rounded hover-lift transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover-lift-none disabled:transform-none flex items-center justify-center min-w-[120px]"
                      >
                        {generatingVoices[langCode] ? (
                          <span className="flex items-center space-x-1.5">
                            <svg className="animate-spin -ml-1 h-3.5 w-3.5 text-white" style={{ animationDuration: '0.5s' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="animate-pulse">Generating...</span>
                          </span>
                        ) : 'Generate Voice'}
                      </button>
                    )}
                  </div>
                </div>
                <div className={`p-4 rounded-lg bg-gray-50 max-h-60 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed mb-4 ${isErrorText ? 'text-red-600' : 'text-gray-800'}`}>
                  {textContent}
                </div>
                
                {/* Voice Message Display */}
                {voiceErrors[langCode] && (
                  <p className={`text-sm mb-3 ${voiceErrors[langCode].includes('future update') ? 'text-blue-600 bg-blue-50 p-2 rounded border border-blue-100' : 'text-red-500'}`}>
                    {voiceErrors[langCode].includes('future update') ? voiceErrors[langCode].replace('Voice generation failed: ', '') : voiceErrors[langCode]}
                  </p>
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
