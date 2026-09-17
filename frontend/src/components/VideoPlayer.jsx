import React, { useState, useEffect, useRef } from 'react';

const VideoPlayer = ({ url, segments = [] }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const intervalRef = useRef(null);

  // Extract video ID from url
  const videoIdMatch = url ? url.match(/[?&]v=([^&]+)/) : null;
  const videoId = videoIdMatch ? videoIdMatch[1] : null;

  useEffect(() => {
    if (!videoId) return;

    const initPlayer = () => {
      if (playerRef.current) return;
      if (!containerRef.current) return;
      
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 0,
          controls: 1,
          rel: 0,
          modestbranding: 1,
          origin: window.location.origin
        },
        events: {
          onReady: () => setIsReady(true),
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              intervalRef.current = setInterval(() => {
                if (playerRef.current && playerRef.current.getCurrentTime) {
                  setCurrentTime(playerRef.current.getCurrentTime());
                }
              }, 100);
            } else {
              clearInterval(intervalRef.current);
            }
          }
        }
      });
    };

    // Load YouTube Iframe API if not loaded
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
      
      // Setup callback
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        initPlayer();
      };
    } else if (window.YT && window.YT.Player) {
      initPlayer();
    }

    return () => {
      clearInterval(intervalRef.current);
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoId]);

  const activeSegment = segments.find(
    (s) => currentTime >= s.start && currentTime <= s.end
  );

  return (
    <div className="relative w-full rounded-lg overflow-hidden bg-black pt-[56.25%] group shadow-inner">
      <div className="absolute top-0 left-0 text-white z-50 text-xs p-1 bg-black/50 break-all hidden">
        DEBUG URL: {url || 'UNDEFINED'}
      </div>
      <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center bg-gray-900">
        {!isReady && (
          <div className="text-gray-400 animate-pulse flex flex-col items-center">
            <svg className="w-12 h-12 mb-3 text-amber-500 opacity-80" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
            </svg>
            <span>Loading YouTube Player...</span>
          </div>
        )}
        <div ref={containerRef} className="w-full h-full absolute top-0 left-0"></div>
      </div>
      
      {/* Subtitle Overlay */}
      {activeSegment && isReady && (
        <div className="absolute bottom-16 left-0 right-0 flex justify-center px-4 pointer-events-none animate-fade-in-up" style={{ animationDuration: '0.2s' }}>
          <div className="bg-black/80 text-white px-5 py-2 rounded-lg shadow-2xl text-center max-w-[90%] text-base sm:text-lg md:text-xl font-semibold tracking-wide border border-white/10 backdrop-blur-sm">
            {activeSegment.text}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
