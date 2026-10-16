import { useState, useEffect, Suspense, lazy } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { motion, AnimatePresence } from 'framer-motion';
import api from './services/api';
import './index.css';

const VideoCard = lazy(() => import('./components/VideoCard'));
const About = lazy(() => import('./components/About'));

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [backendStatus, setBackendStatus] = useState('checking');
  const [videoUrl, setVideoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [videoData, setVideoData] = useState(null);
  const [error, setError] = useState('');
  const [transcribeState, setTranscribeState] = useState('idle');
  const [transcriptData, setTranscriptData] = useState(null);
  const [progressData, setProgressData] = useState({ status: '', progress: 0, message: '' });

  const handleAnalyze = async () => {
    if (!videoUrl) return;
    setIsLoading(true);
    setError('');
    setVideoData(null);
    try {
      const response = await api.post('/api/video/analyze', { url: videoUrl });
      if (response.data.success) {
        setVideoData(response.data.video);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong while analyzing the video. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranscribe = async (forceRefresh = false) => {
    if (!videoData?.video_id) return;
    setTranscribeState('transcribing');
    setError('');
    setProgressData({ status: 'connecting', progress: 0, message: 'Connecting to server...' });

    // Setup WebSocket for progress
    const cleanBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');
    const wsBaseUrl = cleanBase.replace(/^http(s?):/, 'ws$1:');
    let ws = null;
    try {
      ws = new WebSocket(`${wsBaseUrl}/ws/progress/${videoData.video_id}`);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setProgressData(data);
          if (data.status === 'error') {
            setError(data.message || 'Transcription failed.');
            setTranscribeState('idle');
          }
        } catch { }
      };

      ws.onerror = () => {
        // Fall back gracefully without interrupting transcription
      };
    } catch { }

    try {
      const response = await api.post('/api/video/transcribe', {
        video_id: videoData.video_id,
        force_refresh: forceRefresh
      });
      if (response.data.success) {
        setTranscriptData(response.data);
        setTranscribeState('done');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Transcription failed. Please try again.');
      setTranscribeState('idle');
    } finally {
      if (ws) {
        try { ws.close(); } catch { }
      }
    }
  };

  const resetState = () => {
    setVideoUrl('');
    setVideoData(null);
    setError('');
    setTranscribeState('idle');
    setTranscriptData(null);
  };

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await api.get('/api/health/');
        if (response.data.status === 'ok') {
          setBackendStatus('connected');
        } else {
          setBackendStatus('failed');
        }
      } catch {
        setBackendStatus('failed');
      }
    };
    checkBackend();
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col font-sans selection:bg-[#0071E3]/20 selection:text-[#1D1D1F]">
      {/* Header */}
      <header className="bg-white/70 sticky top-0 z-40 py-3 backdrop-blur-xl border-b border-gray-200/30 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <div className="bg-[#0071E3] p-1.5 rounded-lg mr-2 shadow-sm">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
              </div>
              <span className="font-semibold text-xl text-[#1D1D1F] tracking-tight">
                VideoTranslator
              </span>
            </div>

            {/* Nav Toggle Pill */}
            <nav className="hidden sm:flex bg-gray-100/80 backdrop-blur-md p-1 rounded-full border border-gray-200/50">
              <button
                onClick={() => setCurrentView('home')}
                className={`${currentView === 'home' ? 'bg-white text-[#1D1D1F] shadow-sm' : 'text-gray-500 hover:text-[#1D1D1F]'} px-5 py-1 rounded-full text-sm font-medium transition-all duration-300`}
              >
                Home
              </button>
              <button
                onClick={() => setCurrentView('about')}
                className={`${currentView === 'about' ? 'bg-white text-[#1D1D1F] shadow-sm' : 'text-gray-500 hover:text-[#1D1D1F]'} px-5 py-1 rounded-full text-sm font-medium transition-all duration-300 ml-1`}
              >
                About
              </button>
            </nav>

            {/* Right Action / Social Links */}
            <div className="flex items-center space-x-2">
              <a
                href="https://github.com/Vishnuvsh/ai-video-translator"
                target="_blank"
                rel="noopener noreferrer"
                title="View GitHub Repository"
                aria-label="GitHub Repository"
                className="p-2 bg-gray-100/80 rounded-full text-gray-600 hover:text-[#1D1D1F] hover:bg-gray-200/80 transition-colors border border-gray-200/50 flex items-center justify-center"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/in/vishnu444/"
                target="_blank"
                rel="noopener noreferrer"
                title="Connect on LinkedIn"
                aria-label="LinkedIn Profile"
                className="p-2 bg-[#0077B5]/10 text-[#0077B5] hover:bg-[#0077B5] hover:text-white rounded-full transition-all duration-200 border border-[#0077B5]/20 flex items-center justify-center"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center p-6 text-center relative overflow-x-clip">

        {/* Subtle macOS-style blurred background hints */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-200/40 rounded-full mix-blend-multiply filter blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-200/40 rounded-full mix-blend-multiply filter blur-[100px] pointer-events-none"></div>
        <AnimatePresence mode="wait">
          {currentView === 'about' ? (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <Suspense fallback={<div className="p-12 text-center text-[#86868B] animate-pulse">Loading About...</div>}>
                <About onStart={() => setCurrentView('home')} />
              </Suspense>
            </motion.div>
          ) : (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-5xl w-full mx-auto pt-8 md:pt-16"
            >

              {/* Top Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mb-6"
              >
                <div className="inline-flex items-center justify-center space-x-2 bg-gray-200/50 backdrop-blur-md px-4 py-1.5 rounded-full border border-gray-300/50 cursor-default">
                  <svg className="w-3.5 h-3.5 text-[#0071E3]" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
                  <span className="text-xs font-medium text-[#1D1D1F]">AI Translation Pipeline</span>
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-4xl md:text-6xl font-semibold text-[#1D1D1F] tracking-tight mb-5 relative z-10"
              >
                Translate Videos Into <br className="hidden sm:block" />
                <span className="text-[#0071E3]">Any Language.</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-lg sm:text-xl text-[#86868B] mb-12 max-w-2xl mx-auto font-normal"
              >
                Convert spoken content from videos into text and make it available in the language you understand.
              </motion.p>

              {!videoData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="mb-12 max-w-3xl mx-auto relative z-20"
                >
                  <div className="bg-white/80 backdrop-blur-2xl p-1.5 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-200 flex flex-col sm:flex-row items-center focus-within:ring-4 focus-within:ring-[#0071E3]/20 focus-within:border-[#0071E3]/50 transition-all duration-300 relative">
                    <div className="flex-grow flex items-center w-full px-4 py-2 sm:py-0">
                      <svg className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                      <input
                        type="text"
                        placeholder="Paste YouTube URL..."
                        className="w-full bg-transparent outline-none text-[#1D1D1F] placeholder-gray-400 font-medium disabled:opacity-50 text-base"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !isLoading && videoUrl) {
                            handleAnalyze();
                          }
                        }}
                        disabled={isLoading}
                      />
                    </div>
                    <button
                      onClick={handleAnalyze}
                      disabled={isLoading || !videoUrl}
                      className="w-full sm:w-auto bg-[#0071E3] hover:bg-[#0077ED] text-white font-medium py-3 px-8 rounded-full transition-all duration-300 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[160px] mt-2 sm:mt-0 shadow-sm"
                    >
                      {isLoading ? (
                        <span className="flex items-center space-x-2">
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" style={{ animationDuration: '0.5s' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="animate-pulse">Analyzing...</span>
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
                          Analyze Video
                        </span>
                      )}
                    </button>
                  </div>
                  {error && <p className="text-red-500 text-sm mt-4 font-medium relative z-10">{error}</p>}

                  {/* Supported Formats Chips */}
                  <div className="flex flex-wrap justify-center items-center gap-3 mt-8 relative z-0">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Supported:</span>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
                      className="flex items-center space-x-1.5 bg-gray-100 px-3 py-1 rounded-full border border-gray-200"
                    >
                      <div className="w-3 h-3 rounded-full bg-red-500 flex items-center justify-center text-white text-[8px]">▶</div>
                      <span className="text-xs font-medium text-[#1D1D1F]">YouTube</span>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {videoData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <Suspense fallback={<div className="p-12 text-center text-[#86868B] animate-pulse">Loading Video Information...</div>}>
                    <VideoCard
                      videoUrl={videoUrl}
                      video={videoData}
                      onReset={resetState}
                      onTranscribe={handleTranscribe}
                      transcribeState={transcribeState}
                      transcriptData={transcriptData}
                      progressData={progressData}
                    />
                  </Suspense>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Footer */}
      <footer className="bg-transparent py-8 mt-auto px-4 sm:px-8 border-t border-gray-200/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center">
          <p className="text-xs font-semibold text-gray-500 mb-4 sm:mb-0">
            &copy; {new Date().getFullYear()} Vishnu. All rights reserved.
          </p>

          {/* Status Badge */}
          <div className="group cursor-help relative">
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border shadow-sm transition-all duration-300 ${backendStatus === 'connected' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                backendStatus === 'failed' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-yellow-50 border-yellow-100 text-yellow-700 animate-pulse'
              }`}>
              <div className={`w-2 h-2 rounded-full ${backendStatus === 'connected' ? 'bg-emerald-500' :
                  backendStatus === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                }`}></div>
              <span className="text-xs font-bold tracking-wide">
                {backendStatus === 'connected' ? 'All Systems Operational' : backendStatus === 'failed' ? 'Systems Offline' : 'Connecting...'}
              </span>
            </div>

            <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap bg-gray-800 text-white text-xs px-2 py-1 rounded pointer-events-none">
              Backend Status
            </div>
          </div>
        </div>
      </footer>
      <Analytics />
    </div>
  );
}

export default App;               