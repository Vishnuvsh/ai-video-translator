import { useState, useEffect } from 'react';
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
    <div className="min-h-screen bg-[#FFF9F2] flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0 flex items-center">
              <span className="font-extrabold text-xl text-amber-600 flex items-center tracking-tight">
                <svg className="w-6 h-6 mr-2 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                AI Video Translator
              </span>
            </div>
            <nav className="flex space-x-2">
              <button 
                onClick={() => setCurrentView('home')} 
                className={`${currentView === 'home' ? 'bg-amber-50 text-amber-700 shadow-sm border border-amber-100' : 'text-gray-600 hover:text-amber-600 hover:bg-amber-50/50'} px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200`}
              >
                Home
              </button>
              <button 
                onClick={() => setCurrentView('about')} 
                className={`${currentView === 'about' ? 'bg-amber-50 text-amber-700 shadow-sm border border-amber-100' : 'text-gray-600 hover:text-amber-600 hover:bg-amber-50/50'} px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200`}
              >
                About
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center p-6 text-center">
        {currentView === 'about' ? (
          <About />
        ) : (
          <div className="max-w-3xl w-full">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4 animate-fade-in-up">
              Translate Videos Into <span className="text-amber-600">Any Language</span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Convert spoken content from videos into text and make it available in the language you understand.
            </p>
            
            {!videoData && (
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-8 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="text" 
                    placeholder="https://www.youtube.com/watch?v=..." 
                    className="flex-grow px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition text-gray-700 disabled:bg-gray-100"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    disabled={isLoading}
                  />
                  <button 
                    onClick={handleAnalyze}
                    disabled={isLoading || !videoUrl}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-medium py-3 px-6 rounded-lg shadow hover-lift transition-all duration-300 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[160px]"
                  >
                    {isLoading ? (
                      <span className="flex items-center space-x-2">
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" style={{ animationDuration: '0.5s' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="animate-pulse">Analyzing...</span>
                      </span>
                    ) : 'Analyze Video'}
                  </button>
                </div>
                {error && <p className="text-red-500 text-sm mt-3 text-left">{error}</p>}
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
          
        {/* Status Icon */}
          <div className="fixed bottom-4 right-4 group cursor-help z-50">
            <div className={`p-2 rounded-full shadow-md transition-all duration-300 ${
              backendStatus === 'connected' ? 'bg-green-100 text-green-600 hover:bg-green-200' : 
              backendStatus === 'failed' ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-yellow-100 text-yellow-600 animate-pulse'
            }`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"></path>
              </svg>
            </div>
            <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap bg-gray-800 text-white text-xs px-2 py-1 rounded pointer-events-none">
              Backend: {backendStatus}
            </div>
          </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-500">
            &copy; 2026 Vishnu. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;               