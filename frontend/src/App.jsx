import { useState, useEffect } from 'react';
import api from './services/api';
import './index.css';
import VideoCard from './components/VideoCard';

function App() {
  const [backendStatus, setBackendStatus] = useState('Checking...');
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
          setBackendStatus('Backend Connected ✓');
        } else {
          setBackendStatus('Backend Connection Failed');
        }
      } catch (error) {
        setBackendStatus('Backend Connection Failed');
      }
    };
    checkBackend();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0 flex items-center">
              <span className="font-bold text-xl text-amber-600">AI Video Translator</span>
            </div>
            <nav className="flex space-x-4">
              <a href="#" className="text-gray-700 hover:text-amber-600 px-3 py-2 rounded-md text-sm font-medium">Home</a>
              <a href="#" className="text-gray-700 hover:text-amber-600 px-3 py-2 rounded-md text-sm font-medium">About</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-3xl w-full">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
            Translate Videos Into <span className="text-amber-600">Any Language</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Convert spoken content from videos into text and make it available in the language you understand.
          </p>
          
          {!videoData && (
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-8 max-w-2xl mx-auto">
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
                  className="bg-amber-600 hover:bg-amber-700 text-white font-medium py-3 px-6 rounded-lg shadow transition duration-200 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Analyzing...' : 'Analyze Video'}
                </button>
              </div>
              {error && <p className="text-red-500 text-sm mt-3 text-left">{error}</p>}
            </div>
          )}

          {videoData && (
            <VideoCard 
              video={videoData} 
              onReset={resetState} 
              onTranscribe={handleTranscribe}
              transcribeState={transcribeState}
              transcriptData={transcriptData}
            />
          )}
          
          {/* Status Badge */}
          <div className="inline-flex items-center space-x-2 bg-white px-4 py-2 rounded-full border shadow-sm text-sm font-medium">
            <span className={`w-2.5 h-2.5 rounded-full ${backendStatus.includes('✓') ? 'bg-green-500' : backendStatus.includes('Failed') ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'}`}></span>
            <span className="text-gray-700">{backendStatus}</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} AI Video Translator. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default App;               