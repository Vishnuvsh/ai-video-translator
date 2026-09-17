import React from 'react';
import TranslationSection from './TranslationSection';

const VideoCard = ({ videoUrl, video, onReset, onTranscribe, transcribeState, transcriptData }) => {
  const isTranscribing = transcribeState === 'preparing' || transcribeState === 'transcribing';

  const copyToClipboard = () => {
    if (transcriptData?.transcript) {
      navigator.clipboard.writeText(transcriptData.transcript);
    }
  };

  const downloadTranscript = () => {
    if (transcriptData?.transcript) {
      const blob = new Blob([transcriptData.transcript], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'transcript.txt';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 max-w-2xl mx-auto mb-8 animate-fade-in-up group">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/2 flex-shrink-0 overflow-hidden rounded-lg">
          <img 
            src={video.thumbnail} 
            alt={video.title} 
            className="w-full h-auto object-cover shadow-sm transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="md:w-1/2 flex flex-col justify-center text-left">
          <h2 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{video.title}</h2>
          {video.channel && (
            <p className="text-gray-600 mb-2">
              <span className="font-semibold text-gray-800">Channel:</span> {video.channel}
            </p>
          )}
          <p className="text-gray-600 mb-6">
            <span className="font-semibold text-gray-800">Duration:</span> {video.duration_formatted || `${video.duration}s`}
          </p>
          <div className="mt-auto">
            {/* Kept empty, moved buttons below to span full width */}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full border-t pt-6 border-gray-100">
        <button 
          onClick={onTranscribe}
          disabled={isTranscribing || transcribeState === 'done'}
          className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-medium py-2.5 px-4 rounded-lg shadow hover-lift transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover-lift-none disabled:transform-none flex items-center justify-center min-w-[160px]"
        >
          {isTranscribing ? (
            <span className="flex items-center space-x-2">
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" style={{ animationDuration: '0.5s' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="animate-pulse">Transcribing...</span>
            </span>
          ) : transcribeState === 'done' ? 'Transcription Complete' : 'Transcribe Video'}
        </button>
        <button 
          onClick={onReset}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2.5 px-4 rounded-lg hover-lift transition-all duration-300"
        >
          Analyze Another Video
        </button>
      </div>

      {transcriptData && (
        <div className="mt-6 border-t pt-6 border-gray-100 text-left animate-fade-in-up">
          <h3 className="text-xl font-bold text-gray-900 mb-1">Transcript</h3>
          <p className="text-sm text-amber-600 font-semibold mb-4">
            Detected Language: <span className="uppercase">{transcriptData.language}</span>
          </p>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-60 overflow-y-auto mb-4 whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
            {transcriptData.transcript}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={copyToClipboard}
              className="text-sm w-full sm:w-auto bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded hover-lift transition-all duration-300 shadow-sm text-center"
            >
              Copy Transcript
            </button>
            <button 
              onClick={downloadTranscript}
              className="text-sm w-full sm:w-auto bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded hover-lift transition-all duration-300 shadow-sm text-center"
            >
              Download Transcript
            </button>
          </div>
        </div>
      )}

      {transcriptData && (
        <TranslationSection transcriptData={transcriptData} videoUrl={`https://www.youtube.com/watch?v=${video.video_id}`} />
      )}
    </div>
  );
};

export default VideoCard;
