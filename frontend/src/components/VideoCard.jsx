import React from 'react';
import { motion } from 'framer-motion';
import TranslationSection from './TranslationSection';

const VideoCard = ({ videoUrl, video, onReset, onTranscribe, transcribeState, transcriptData, progressData }) => {
  const isTranscribing = transcribeState === 'preparing' || transcribeState === 'transcribing';

  const copyToClipboard = () => {
    if (transcriptData?.transcript) {
      navigator.clipboard.writeText(transcriptData.transcript);
    }
  };

  const formatSrtTime = (seconds) => {
    const totalSecs = Math.floor(seconds || 0);
    const millis = Math.floor(((seconds || 0) - totalSecs) * 1000);
    const secs = totalSecs % 60;
    const mins = Math.floor(totalSecs / 60) % 60;
    const hours = Math.floor(totalSecs / 3600);
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
  };

  const downloadTranscript = () => {
    if (transcriptData?.transcript) {
      const blob = new Blob([transcriptData.transcript], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeTitle = (video.title || 'transcript').slice(0, 30).replace(/[^a-zA-Z0-9_-]/g, '_');
      a.download = `${safeTitle}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const downloadSrt = () => {
    if (transcriptData?.segments?.length) {
      const srtContent = transcriptData.segments
        .map((seg, idx) => `${idx + 1}\n${formatSrtTime(seg.start)} --> ${formatSrtTime(seg.end)}\n${seg.text.trim()}\n`)
        .join('\n');
      const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeTitle = (video.title || 'subtitles').slice(0, 30).replace(/[^a-zA-Z0-9_-]/g, '_');
      a.download = `${safeTitle}.srt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/90 backdrop-blur-2xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white w-full max-w-5xl mx-auto mb-12 group"
    >
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/2 flex-shrink-0 overflow-hidden rounded-2xl shadow-sm border border-gray-100/50">
          <img 
            src={video.thumbnail} 
            alt={video.title} 
            className="w-full h-auto object-cover shadow-sm transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="md:w-1/2 flex flex-col justify-center text-left">
          <h2 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{video.title}</h2>
          <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4 text-sm">
            {video.channel && (
              <p className="text-gray-600">
                <span className="font-semibold text-gray-800">Channel:</span> {video.channel}
              </p>
            )}
            <p className="text-gray-600">
              <span className="font-semibold text-gray-800">Duration:</span> {video.duration_formatted || `${video.duration}s`}
            </p>
            {video.upload_date && (
              <p className="text-gray-600">
                <span className="font-semibold text-gray-800">Published:</span> {video.upload_date}
              </p>
            )}
            {video.view_count !== undefined && video.view_count !== null && (
              <p className="text-gray-600">
                <span className="font-semibold text-gray-800">Views:</span> {video.view_count.toLocaleString()}
              </p>
            )}
            {video.like_count !== undefined && video.like_count !== null && (
              <p className="text-gray-600">
                <span className="font-semibold text-gray-800">Likes:</span> {video.like_count.toLocaleString()}
              </p>
            )}
          </div>
          
          {video.description && (
            <div className="mb-4 bg-gray-50/80 p-3 rounded-lg border border-gray-100 max-h-32 overflow-y-auto">
              <p className="text-gray-600 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                {video.description}
              </p>
            </div>
          )}
          <div className="mt-auto">
            {/* Kept empty, moved buttons below to span full width */}
          </div>
        </div>
      </div>

      {/* Progress Bar area */}
      {isTranscribing && progressData?.status && (
        <div className="mt-6 w-full animate-fade-in-up">
           <div className="flex justify-between text-sm font-medium text-[#1D1D1F] mb-2">
             <span>{progressData.message || 'Processing...'}</span>
             <span>{Math.round(progressData.progress)}%</span>
           </div>
           <div className="w-full bg-gray-200/50 rounded-full h-2.5 overflow-hidden border border-gray-300/30">
             <div 
               className="bg-[#0071E3] h-2.5 rounded-full transition-all duration-300 ease-out relative overflow-hidden" 
               style={{ width: `${Math.max(2, Math.min(100, progressData.progress))}%` }}
             >
               <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
             </div>
           </div>
        </div>
      )}

      <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full border-t pt-6 border-gray-200/50">
        <button 
          onClick={() => onTranscribe(false)}
          disabled={isTranscribing || transcribeState === 'done'}
          className="flex-1 bg-[#0071E3] hover:bg-[#0077ED] text-white font-medium py-3 px-4 rounded-2xl shadow-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[160px]"
        >
          {isTranscribing ? (
            <span className="flex items-center space-x-2">
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" style={{ animationDuration: '0.5s' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="animate-pulse">{progressData?.status === 'downloading' ? 'Downloading...' : 'Processing...'}</span>
            </span>
          ) : transcribeState === 'done' ? '✓ Transcription Complete' : 'Transcribe Video'}
        </button>
        {transcribeState === 'done' && (
          <button 
            onClick={() => onTranscribe(true)}
            disabled={isTranscribing}
            title="Force fresh transcription without loading from cache"
            className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-medium py-3 px-4 rounded-2xl transition-all duration-300 flex items-center justify-center space-x-1.5"
          >
            <span>↻ Re-transcribe (Fresh)</span>
          </button>
        )}
        <button 
          onClick={onReset}
          className="flex-1 bg-gray-100/80 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-2xl transition-all duration-300 border border-gray-200/50"
        >
          Analyze Another Video
        </button>
      </div>

      {transcriptData && (
        <div className="mt-6 border-t pt-6 border-gray-200/50 text-left animate-fade-in-up">
          <h3 className="text-xl font-bold text-[#1D1D1F] mb-1">Transcript</h3>
          <p className="text-sm text-[#0071E3] font-medium mb-4">
            Detected Language: <span className="uppercase">{transcriptData.language}</span>
          </p>
          <div className="bg-gray-100/50 p-5 rounded-2xl border border-gray-200/50 max-h-60 overflow-y-auto mb-4 whitespace-pre-wrap text-sm text-[#1D1D1F] font-sans leading-relaxed">
            {transcriptData.transcript}
          </div>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={copyToClipboard}
              className="text-sm bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-6 rounded-full shadow-sm transition-all duration-300 text-center"
            >
              Copy Transcript
            </button>
            <button 
              onClick={downloadTranscript}
              className="text-sm bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-6 rounded-full shadow-sm transition-all duration-300 text-center"
            >
              Download Text (.txt)
            </button>
            {transcriptData?.segments?.length > 0 && (
              <button 
                onClick={downloadSrt}
                className="text-sm bg-blue-50 border border-blue-200 hover:bg-blue-100 text-[#0071E3] font-medium py-2.5 px-6 rounded-full shadow-sm transition-all duration-300 text-center flex items-center space-x-1.5"
              >
                <span>Download Subtitles (.srt)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {transcriptData && (
        <TranslationSection 
          transcriptData={transcriptData} 
          videoUrl={videoUrl || `https://www.youtube.com/watch?v=${video.video_id}`}
          videoId={video.video_id}
        />
      )}
    </motion.div>
  );
};

export default VideoCard;
