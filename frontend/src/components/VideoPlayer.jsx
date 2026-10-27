import React, { useState, useEffect, useRef, useCallback } from 'react';

const VideoPlayer = ({ url, segments = [], autoPlay = true }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef(null);
  const wrapperRef = useRef(null);
  const intervalRef = useRef(null);
  const subtitleListRef = useRef(null);
  // Unique ID for YouTube iframe element
  const uniqueId = React.useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const playerDivId = useRef(`yt-player-${uniqueId}`);

  // Extract video ID from url - support multiple YouTube URL formats
  const extractVideoId = (inputUrl) => {
    if (!inputUrl) return null;
    // Standard watch URL
    const watchMatch = inputUrl.match(/[?&]v=([^&]+)/);
    if (watchMatch) return watchMatch[1];
    // Short URL (youtu.be)
    const shortMatch = inputUrl.match(/youtu\.be\/([^?&]+)/);
    if (shortMatch) return shortMatch[1];
    // Shorts URL
    const shortsMatch = inputUrl.match(/shorts\/([^?&/]+)/);
    if (shortsMatch) return shortsMatch[1];
    // Embed URL
    const embedMatch = inputUrl.match(/embed\/([^?&]+)/);
    if (embedMatch) return embedMatch[1];
    return null;
  };

  const videoId = extractVideoId(url);

  // Start time tracking interval
  const startTracking = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        setCurrentTime(playerRef.current.getCurrentTime());
      }
    }, 100);
  }, []);

  // Stop time tracking interval
  const stopTracking = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  // Update time once (for seek while paused)
  const updateTimeOnce = useCallback(() => {
    if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
      setCurrentTime(playerRef.current.getCurrentTime());
    }
  }, []);

  // Seek to a specific time when user clicks a subtitle
  const seekTo = useCallback((time) => {
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(time, true);
      // If not playing, still update displayed subtitle
      setTimeout(updateTimeOnce, 200);
    }
  }, [updateTimeOnce]);

  useEffect(() => {
    if (!videoId) return;

    // Create a fresh div element for the YT player to target
    // This prevents React DOM conflicts when the iframe replaces the div
    const playerContainer = document.createElement('div');
    playerContainer.id = playerDivId.current;
    playerContainer.style.width = '100%';
    playerContainer.style.height = '100%';
    playerContainer.style.position = 'absolute';
    playerContainer.style.top = '0';
    playerContainer.style.left = '0';

    const wrapper = wrapperRef.current;
    if (wrapper) {
      wrapper.appendChild(playerContainer);
    }

    const initPlayer = () => {
      // Don't re-init if already created
      if (playerRef.current) return;
      if (!document.getElementById(playerDivId.current)) return;

      try {
        playerRef.current = new window.YT.Player(playerDivId.current, {
          videoId: videoId,
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: autoPlay ? 1 : 0,
            controls: 1,
            rel: 0,
            modestbranding: 1,
            enablejsapi: 1,
            origin: window.location.origin
          },
          events: {
            onReady: (event) => {
              setIsReady(true);
              if (autoPlay) {
                event.target.playVideo();
              }
            },
            onStateChange: (event) => {
              switch (event.data) {
                case window.YT.PlayerState.PLAYING:
                  setIsPlaying(true);
                  startTracking();
                  break;
                case window.YT.PlayerState.PAUSED:
                  setIsPlaying(false);
                  stopTracking();
                  // Update time once so subtitle stays visible at paused position
                  updateTimeOnce();
                  break;
                case window.YT.PlayerState.ENDED:
                  setIsPlaying(false);
                  stopTracking();
                  break;
                case window.YT.PlayerState.BUFFERING:
                  // Keep tracking during buffering for smoother experience
                  updateTimeOnce();
                  break;
                default:
                  break;
              }
            }
          }
        });
      } catch (e) {
        console.error('Failed to initialize YouTube player:', e);
      }
    };

    // Load YouTube Iframe API if not loaded
    if (!window.YT || !window.YT.Player) {
      // Check if script tag already exists
      const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        if (firstScriptTag && firstScriptTag.parentNode) {
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        } else {
          document.head.appendChild(tag);
        }
      }

      // Setup or chain the callback
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        initPlayer();
      };

      // If YT API is already loading but not ready, also try after a delay
      if (existingScript) {
        const checkInterval = setInterval(() => {
          if (window.YT && window.YT.Player) {
            clearInterval(checkInterval);
            initPlayer();
          }
        }, 200);
        // Safety: stop checking after 10 seconds
        setTimeout(() => clearInterval(checkInterval), 10000);
      }
    } else {
      initPlayer();
    }

    // Cleanup function - safely destroy player
    return () => {
      stopTracking();
      try {
        if (playerRef.current && typeof playerRef.current.destroy === 'function') {
          playerRef.current.destroy();
        }
      } catch {
        // Ignore destroy errors - the iframe may already be gone
      }
      playerRef.current = null;
      setIsReady(false);
      setIsPlaying(false);
      setCurrentTime(0);

      // Remove the player container div safely
      try {
        if (wrapper && playerContainer.parentNode === wrapper) {
          wrapper.removeChild(playerContainer);
        }
      } catch {
        // Ignore if already removed
      }
    };
  }, [videoId, autoPlay, startTracking, stopTracking, updateTimeOnce]);

  // Auto-scroll the active subtitle into view in the list
  useEffect(() => {
    if (subtitleListRef.current) {
      const activeEl = subtitleListRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [currentTime]);

  const activeSegment = segments.find(
    (s) => currentTime >= s.start && currentTime <= s.end
  );

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-3">
      {/* Video Player Container */}
      <div className="relative w-full rounded-lg overflow-hidden bg-black pt-[56.25%] group shadow-inner">
        <div
          ref={wrapperRef}
          className="absolute top-0 left-0 w-full h-full flex justify-center items-center bg-gray-900"
        >
          {!isReady && (
            <div className="text-gray-400 animate-pulse flex flex-col items-center z-10">
              <svg className="w-12 h-12 mb-3 text-amber-500 opacity-80" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
              </svg>
              <span>Loading YouTube Player...</span>
            </div>
          )}
        </div>

        {/* Subtitle Overlay */}
        {activeSegment && isReady && (
          <div
            className="absolute bottom-16 left-0 right-0 flex justify-center px-4 pointer-events-none z-20"
            style={{ animationDuration: '0.2s' }}
          >
            <div className="bg-black/80 text-white px-5 py-2 rounded-lg shadow-2xl text-center max-w-[90%] text-base sm:text-lg md:text-xl font-semibold tracking-wide border border-white/10 backdrop-blur-sm animate-fade-in-up">
              {activeSegment.text}
            </div>
          </div>
        )}

        {/* Playback State Badge */}
        {isReady && (
          <div className="absolute top-3 right-3 z-20">
            <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm transition-all duration-300 ${
              isPlaying
                ? 'bg-emerald-500/80 text-white'
                : 'bg-gray-800/70 text-gray-300'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-white animate-pulse' : 'bg-gray-400'}`}></div>
              <span>{isPlaying ? 'Playing' : 'Paused'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Subtitle List */}
      {segments.length > 0 && isReady && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex justify-between items-center px-4 py-2.5 bg-gray-100 border-b border-gray-200">
            <h5 className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
              <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              <span>Subtitles ({segments.length} segments)</span>
            </h5>
            <span className="text-xs text-gray-500 font-mono bg-white px-2 py-0.5 rounded border border-gray-200">
              {formatTime(currentTime)}
            </span>
          </div>
          <div
            ref={subtitleListRef}
            className="max-h-48 overflow-y-auto divide-y divide-gray-100 scroll-smooth"
          >
            {segments.map((seg, idx) => {
              const isActive = currentTime >= seg.start && currentTime <= seg.end;
              return (
                <button
                  key={idx}
                  data-active={isActive}
                  onClick={() => seekTo(seg.start)}
                  className={`w-full text-left px-4 py-2.5 flex items-start space-x-3 transition-all duration-200 hover:bg-amber-50 group/item cursor-pointer ${
                    isActive
                      ? 'bg-amber-50 border-l-4 border-amber-500'
                      : 'border-l-4 border-transparent'
                  }`}
                >
                  <span className={`text-xs font-mono whitespace-nowrap mt-0.5 flex-shrink-0 ${
                    isActive ? 'text-amber-600 font-bold' : 'text-gray-400 group-hover/item:text-amber-500'
                  }`}>
                    {formatTime(seg.start)}
                  </span>
                  <span className={`text-sm leading-relaxed ${
                    isActive ? 'text-gray-900 font-medium' : 'text-gray-600'
                  }`}>
                    {seg.text}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
