import { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import api from './services/api';
import './index.css';
import VideoCard from './components/VideoCard';
import About from './components/About';

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [backendStatus, setBackendStatus] = useState('checking');
  const [videoUrl, setVideoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [videoData, setVideoData] = useState(null);
  const [error, setError] = useState('');
  const [transcribeState, setTranscribeState] = useState('idle');
  const [transcriptData, setTranscriptData] = useState(null);

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

  const handleTranscribe = async () => {
    if (!videoData?.video_id) return;
    setTranscribeState('transcribing');
    setError('');
    try {
      const response = await api.post('/api/video/transcribe', { video_id: videoData.video_id });
      if (response.data.success) {
        setTranscriptData(response.data);
        setTranscribeState('done');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Transcription failed. Please try again.');
      setTranscribeState('idle');
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
      } catch (error) {
        setBackendStatus('failed');
      }
    };
    checkBackend();
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* Header */}
      <header className="bg-transparent sticky top-0 z-40 py-4 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-1.5 rounded-lg mr-2 shadow-sm">
                 <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
              </div>
              <span className="font-extrabold text-xl text-gray-900 tracking-tight">
                AI Video Translator
              </span>
            </div>
            
            {/* Nav Toggle Pill */}
            <nav className="hidden sm:flex bg-white/60 backdrop-blur-md p-1 rounded-full shadow-sm border border-gray-200/50">
              <button 
                onClick={() => setCurrentView('home')} 
                className={`${currentView === 'home' ? 'bg-amber-500 text-white shadow-md' : 'text-gray-600 hover:text-gray-900'} px-6 py-1.5 rounded-full text-sm font-semibold transition-all duration-300`}
              >
                Home
              </button>
              <button 
                onClick={() => setCurrentView('about')} 
                className={`${currentView === 'about' ? 'bg-amber-500 text-white shadow-md' : 'text-gray-600 hover:text-gray-900'} px-6 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 ml-1`}
              >
                About
              </button>
            </nav>

            {/* Right Profile / Action icon placeholder */}
            <div className="flex items-center">
               <button className="p-2 bg-white rounded-full text-gray-500 hover:bg-gray-50 transition-colors shadow-sm border border-gray-200/50">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
               </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        
        {/* Animated Background Blobs */}
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-40 animate-blob pointer-events-none"></div>
        <div className="absolute top-40 right-1/4 w-72 h-72 bg-amber-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-40 animate-blob animation-delay-2000 pointer-events-none"></div>
        <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-40 animate-blob animation-delay-4000 pointer-events-none"></div>
        {currentView === 'about' ? (
          <About />
        ) : (
          <div className="max-w-5xl w-full mx-auto pt-8 md:pt-16">
            
            {/* Top Badge */}
            <div className="animate-fade-in-up mb-8" style={{ animationDelay: '0.05s' }}>
              <div className="inline-flex items-center justify-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-sm border border-gray-100 cursor-default animate-float">
                 <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
                 <span className="text-xs sm:text-sm font-semibold text-gray-600">Next-Gen AI Video Translation Pipeline</span>
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6 animate-fade-in-up relative z-10" style={{ animationDelay: '0.1s' }}>
              Translate Videos Into <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-orange-500 to-purple-600 animate-gradient">Any Language</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-500 mb-12 max-w-2xl mx-auto font-medium animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Convert spoken content from videos into text and make it available in the language you understand.
            </p>
            
            {!videoData && (
              <div className="mb-12 max-w-3xl mx-auto animate-fade-in-up relative z-20" style={{ animationDelay: '0.3s' }}>
                <div className="bg-white/90 backdrop-blur-md p-2 rounded-full shadow-[0_8px_30px_rgb(245,158,11,0.15)] border border-amber-100/50 flex flex-col sm:flex-row items-center focus-within:ring-4 focus-within:ring-amber-200 focus-within:border-amber-400 transition-all duration-300 relative hover:shadow-[0_8px_30px_rgb(245,158,11,0.3)] group">
                  <div className="flex-grow flex items-center w-full px-4 py-2 sm:py-0">
                    <svg className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                    <input 
                      type="text" 
                      placeholder="https://www.youtube.com/watch?v=..." 
                      className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-400 font-medium disabled:opacity-50"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="hidden sm:block w-px h-8 bg-gray-200 mx-2"></div>
                  <button 
                    onClick={handleAnalyze}
                    disabled={isLoading || !videoUrl}
                    className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-3.5 px-8 rounded-full shadow-lg shadow-orange-500/30 hover-lift transition-all duration-300 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[180px] mt-2 sm:mt-0"
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
                <div className="flex flex-wrap justify-center items-center gap-4 mt-8 relative z-0">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Supported Formats:</span>
                  <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gray-100 shadow-sm opacity-90 hover:opacity-100 transition-opacity animate-float" style={{ animationDelay: '0s' }}>
                    <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-[10px]">▶</div>
                    <span className="text-xs font-semibold text-gray-600">YouTube</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gray-100 shadow-sm opacity-90 hover:opacity-100 transition-opacity animate-float animation-delay-2000">
                    <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[10px]">♫</div>
                    <span className="text-xs font-semibold text-gray-600">MP4 Files</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gray-100 shadow-sm opacity-90 hover:opacity-100 transition-opacity animate-float animation-delay-4000">
                    <div className="w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-[10px]">v</div>
                    <span className="text-xs font-semibold text-gray-600">Vimeo Links</span>
                  </div>
                </div>
              </div>
            )}

            {videoData && (
              <VideoCard 
                videoUrl={videoUrl}
                video={videoData} 
                onReset={resetState} 
                onTranscribe={handleTranscribe}
                transcribeState={transcribeState}
                transcriptData={transcriptData}
              />
            )}
          </div>
        )}
          
      </main>

      {/* Footer */}
      <footer className="bg-transparent py-8 mt-auto px-4 sm:px-8 border-t border-gray-200/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center">
          <p className="text-xs font-semibold text-gray-500 mb-4 sm:mb-0">
            &copy; 2026 Vishnu. All rights reserved.
          </p>
          
          {/* Status Badge */}
          <div className="group cursor-help relative">
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border shadow-sm transition-all duration-300 ${
              backendStatus === 'connected' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 
              backendStatus === 'failed' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-yellow-50 border-yellow-100 text-yellow-700 animate-pulse'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                backendStatus === 'connected' ? 'bg-emerald-500' : 
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