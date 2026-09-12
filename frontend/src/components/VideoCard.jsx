import React from 'react';
import TranslationSection from './TranslationSection';

const VideoCard = ({ video, onReset, onTranscribe, transcribeState, transcriptData }) => {
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
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 max-w-2xl mx-auto mb-8">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/2 flex-shrink-0">
          <img 
            src={video.thumbnail} 
            alt={video.title} 
            className="w-full h-auto rounded-lg object-cover shadow-sm"
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
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg shadow transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isTranscribing ? 'Transcribing...' : transcribeState === 'done' ? 'Transcription Complete' : 'Transcribe Video'}
        </button>
        <button 
          onClick={onReset}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2.5 px-4 rounded-lg transition duration-200"
        >
          Analyze Another Video
        </button>
      </div>

      {transcriptData && (
        <div className="mt-6 border-t pt-6 border-gray-100 text-left animate-fade-in-up">
          <h3 className="text-xl font-bold text-gray-900 mb-1">Transcript</h3>
          <p className="text-sm text-indigo-600 font-semibold mb-4">
            Detected Language: <span className="uppercase">{transcriptData.language}</span>
          </p>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-60 overflow-y-auto mb-4 whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
            {transcriptData.transcript}
          </div>
          <div className="flex gap-3">
            <button 
              onClick={copyToClipboard}
              className="text-sm bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded transition shadow-sm"
            >
              Copy Transcript
            </button>
            <button 
              onClick={downloadTranscript}
              className="text-sm bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded transition shadow-sm"
            >
              Download Transcript
            </button>
          </div>
        </div>
      )}

      {transcriptData && (
        <TranslationSection transcriptData={transcriptData} />
      )}
    </div>
  );
};

export default VideoCard;
