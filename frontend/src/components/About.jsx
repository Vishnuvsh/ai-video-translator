import React from 'react';
import { motion } from 'framer-motion';

const SUPPORTED_LANGUAGES_INFO = [
  { code: 'en', name: 'English', native: 'English', region: 'Global' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', region: 'India (Kerala)' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', region: 'India (National)' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', region: 'India & Sri Lanka' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', region: 'India (AP/Telangana)' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', region: 'India (Karnataka)' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', region: 'India & Bangladesh' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', region: 'India (Maharashtra)' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', region: 'India (Gujarat)' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', region: 'India & Pakistan' },
  { code: 'es', name: 'Spanish', native: 'Español', region: 'Spain & Americas' },
  { code: 'fr', name: 'French', native: 'Français', region: 'France & Global' },
  { code: 'de', name: 'German', native: 'Deutsch', region: 'Germany & Europe' },
  { code: 'ar', name: 'Arabic', native: 'العربية', region: 'Middle East & NA' },
];

const TECH_STACK = [
  { category: 'Frontend', items: ['React 19', 'Vite', 'Tailwind CSS', 'Framer Motion', 'Axios'], color: 'border-blue-200 bg-blue-50/60 text-blue-700' },
  { category: 'UI / UX Design', items: ['Stitch AI', 'Apple-inspired Minimalist UI', 'Glassmorphism'], color: 'border-pink-200 bg-pink-50/60 text-pink-700' },
  { category: 'Backend', items: ['FastAPI', 'Python 3.12', 'WebSockets', 'Uvicorn', 'Pydantic v2'], color: 'border-emerald-200 bg-emerald-50/60 text-emerald-700' },
  { category: 'AI & Pipeline', items: ['Whisper Large v3', 'Groq LPU Inference', 'FFmpeg Chunking', 'InnerTube API', 'yt-dlp'], color: 'border-purple-200 bg-purple-50/60 text-purple-700' },
  { category: 'Deployment', items: ['Render (API)', 'Vercel (Frontend)', 'Vercel Analytics'], color: 'border-amber-200 bg-amber-50/60 text-amber-700' },
];

const HIGHLIGHTS = [
  {
    title: 'Ultra-Fast Metadata (<0.3s)',
    desc: 'Direct integration with YouTube’s official InnerTube API bypasses datacenter IP restrictions and fetches metadata up to 20x faster than traditional scrapers.',
    icon: '⚡'
  },
  {
    title: 'State-of-the-Art Transcription',
    desc: 'Audio is processed using Whisper Large v3 on ultra-fast Groq LPU hardware, generating accurate transcriptions with precise timestamped segments.',
    icon: '🎙️'
  },
  {
    title: 'Real-Time WebSocket Progress',
    desc: 'Live bi-directional WebSocket connection streams real-time percentage progress during audio downloading and AI processing stages.',
    icon: '📡'
  },
  {
    title: 'Synchronized Subtitle Player',
    desc: 'Integrated interactive video player with live subtitle overlay that syncs seamlessly with YouTube playback and enables one-click seeking.',
    icon: '🎬'
  },
  {
    title: 'Multi-Tier Smart Caching',
    desc: 'Both metadata, transcriptions, and generated translations are cached locally for instant (<10ms) responses on repeated queries.',
    icon: '💾'
  },
  {
    title: 'Export in Multiple Formats',
    desc: 'Export transcripts directly as text files (.txt) or industry-standard SubRip subtitle files (.srt) ready to upload back to YouTube or video editors.',
    icon: '📑'
  }
];

const About = ({ onStart }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }} 
      transition={{ duration: 0.5 }} 
      className="max-w-5xl mx-auto px-4 py-8 md:py-12"
    >
      
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center space-x-2 bg-gray-200/50 backdrop-blur-md px-4 py-1.5 rounded-full border border-gray-300/50 mb-6 cursor-default">
           <svg className="w-3.5 h-3.5 text-[#0071E3]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path></svg>
           <span className="text-xs font-medium text-[#1D1D1F]">AI Video Translation Platform</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-semibold mb-6 text-[#1D1D1F] tracking-tight">About VideoTranslator</h1>
        <p className="text-[#86868B] text-lg md:text-xl max-w-3xl mx-auto leading-relaxed font-normal">
          An end-to-end AI platform engineered to break down global language barriers by turning YouTube video speech into accurate, translated subtitles and interactive regional content in seconds.
        </p>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10 max-w-3xl mx-auto">
          <div className="bg-white/80 backdrop-blur-xl p-4 rounded-2xl border border-gray-200/50 shadow-sm text-center">
            <div className="text-2xl md:text-3xl font-bold text-[#0071E3]">14+</div>
            <div className="text-xs text-[#86868B] font-medium mt-1">Supported Languages</div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl p-4 rounded-2xl border border-gray-200/50 shadow-sm text-center">
            <div className="text-2xl md:text-3xl font-bold text-[#1D1D1F]">~0.2s</div>
            <div className="text-xs text-[#86868B] font-medium mt-1">Metadata Lookup</div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl p-4 rounded-2xl border border-gray-200/50 shadow-sm text-center">
            <div className="text-2xl md:text-3xl font-bold text-[#1D1D1F]">Whisper v3</div>
            <div className="text-xs text-[#86868B] font-medium mt-1">Speech Recognition</div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl p-4 rounded-2xl border border-gray-200/50 shadow-sm text-center">
            <div className="text-2xl md:text-3xl font-bold text-emerald-600">100%</div>
            <div className="text-xs text-[#86868B] font-medium mt-1">Free & Open Source</div>
          </div>
        </div>
      </div>

      <div className="space-y-20">
        
        {/* How it Works Section */}
        <section className="text-center">
          <div className="inline-flex items-center justify-center px-4 py-1 bg-[#0071E3]/10 rounded-full mb-4">
             <span className="text-[10px] font-semibold text-[#0071E3] uppercase tracking-widest">Pipeline Architecture</span>
          </div>
          <h2 className="text-3xl font-semibold text-[#1D1D1F] mb-10 tracking-tight">How It Works</h2>
          
          <div className="grid md:grid-cols-3 gap-6 text-left">
            {/* Step 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-200/50 flex flex-col"
            >
              <div className="w-10 h-10 bg-[#0071E3] text-white rounded-2xl flex items-center justify-center font-semibold text-lg mb-6 shadow-sm">1</div>
              <h3 className="font-semibold text-xl text-[#1D1D1F] mb-3">Instant Metadata Retrieval</h3>
              <p className="text-[#86868B] text-sm leading-relaxed mb-6 flex-grow">Paste any YouTube URL (standard, Shorts, or youtu.be). InnerTube player endpoints fetch metadata, thumbnail, duration, and channel info in under 300ms.</p>
              <div className="flex items-center text-xs font-medium text-[#0071E3] uppercase tracking-wider mt-auto pt-4 border-t border-gray-100/50">
                 <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                 Fast URL Parsing
              </div>
            </motion.div>
            
            {/* Step 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
              className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-200/50 flex flex-col"
            >
              <div className="w-10 h-10 bg-[#0071E3] text-white rounded-2xl flex items-center justify-center font-semibold text-lg mb-6 shadow-sm">2</div>
              <h3 className="font-semibold text-xl text-[#1D1D1F] mb-3">AI Audio Transcription</h3>
              <p className="text-[#86868B] text-sm leading-relaxed mb-6 flex-grow">Audio is extracted and converted into text using Whisper Large v3 with millisecond-accurate timestamps. Progress is streamed in real-time via WebSockets.</p>
              <div className="flex items-center text-xs font-medium text-[#0071E3] uppercase tracking-wider mt-auto pt-4 border-t border-gray-100/50">
                 <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg>
                 Whisper Speech-to-Text
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
              className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-200/50 flex flex-col"
            >
              <div className="w-10 h-10 bg-[#0071E3] text-white rounded-2xl flex items-center justify-center font-semibold text-lg mb-6 shadow-sm">3</div>
              <h3 className="font-semibold text-xl text-[#1D1D1F] mb-3">Translate & Sync Subtitles</h3>
              <p className="text-[#86868B] text-sm leading-relaxed mb-6 flex-grow">Select target regional languages for parallel translation. Watch the video with synchronized subtitles, or download SRT subtitle files immediately.</p>
              <div className="flex items-center text-xs font-medium text-[#0071E3] uppercase tracking-wider mt-auto pt-4 border-t border-gray-100/50">
                 <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path></svg>
                 Multi-Language Sync
              </div>
            </motion.div>
          </div>
        </section>

        {/* Supported Languages Showcase Section */}
        <section className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-200/50">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center px-4 py-1 bg-gray-100 rounded-full mb-3">
               <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Global & Regional</span>
            </div>
            <h2 className="text-3xl font-semibold text-[#1D1D1F] tracking-tight">14 Supported Languages</h2>
            <p className="text-[#86868B] text-sm md:text-base max-w-2xl mx-auto mt-2">
              High-accuracy translations preserving context and nuances across major Indian regional languages and international languages.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {SUPPORTED_LANGUAGES_INFO.map((lang) => (
              <div 
                key={lang.code}
                className="bg-gray-50/80 hover:bg-white p-3.5 rounded-2xl border border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col items-center text-center group cursor-default"
              >
                <span className="text-base font-bold text-[#1D1D1F] group-hover:text-[#0071E3] transition-colors">{lang.native}</span>
                <span className="text-xs font-semibold text-gray-700 mt-0.5">{lang.name}</span>
                <span className="text-[10px] text-gray-400 mt-1 uppercase font-mono">{lang.code}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Technical Architecture & Tech Stack */}
        <section className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-200/50">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center px-4 py-1 bg-[#0071E3]/10 rounded-full mb-3">
               <span className="text-[10px] font-semibold text-[#0071E3] uppercase tracking-widest">Engineering</span>
            </div>
            <h2 className="text-3xl font-semibold text-[#1D1D1F] tracking-tight">Technology Stack & Architecture</h2>
            <p className="text-[#86868B] text-sm md:text-base max-w-2xl mx-auto mt-2">
              Built using a modern, scalable full-stack architecture optimized for low-latency AI inference and high-performance client rendering.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {TECH_STACK.map((group) => (
              <div key={group.category} className="p-5 rounded-2xl border border-gray-200/50 bg-gray-50/50">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">{group.category}</h4>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((tech) => (
                    <span 
                      key={tech} 
                      className={`text-xs font-medium px-3 py-1.5 rounded-full border shadow-sm ${group.color}`}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Key Engineering Highlights Grid */}
        <section className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-200/50">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center px-4 py-1 bg-gray-100 rounded-full mb-3">
               <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Capabilities</span>
            </div>
            <h2 className="text-3xl font-semibold text-[#1D1D1F] tracking-tight">Key Engineering Highlights</h2>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {HIGHLIGHTS.map((item, idx) => (
              <div key={idx} className="flex flex-col p-5 rounded-2xl bg-gray-50/50 border border-gray-200/40 hover:bg-white hover:shadow-sm transition-all duration-200">
                <div className="text-2xl mb-3">{item.icon}</div>
                <h4 className="font-semibold text-[#1D1D1F] text-base mb-1.5">{item.title}</h4>
                <p className="text-xs text-[#86868B] leading-relaxed flex-grow">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Call to Action Banner */}
        {onStart && (
          <section className="bg-gradient-to-r from-[#0071E3] to-[#0077ED] text-white rounded-3xl p-8 md:p-12 text-center shadow-lg relative overflow-hidden">
            <div className="relative z-10 max-w-2xl mx-auto">
              <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">Ready to Translate a Video?</h3>
              <p className="text-blue-100 text-sm md:text-base mb-6 leading-relaxed">
                Paste any YouTube video link to experience instant AI audio transcription and regional subtitle translations in real-time.
              </p>
              <button
                onClick={onStart}
                className="inline-flex items-center px-8 py-3.5 bg-white text-[#0071E3] hover:bg-gray-100 font-semibold text-sm rounded-full shadow-md transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <span>Translate a Video Now</span>
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </button>
            </div>
          </section>
        )}

        {/* Developer Info & Connect Section */}
        <section className="flex justify-center pb-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-200/50 text-center max-w-xl w-full">
            <div className="w-16 h-16 bg-[#1D1D1F] text-white rounded-full flex items-center justify-center text-2xl font-semibold mx-auto mb-5 shadow-sm">
              V
            </div>
            <h2 className="text-2xl font-semibold text-[#1D1D1F] mb-1">Created by Vishnu V</h2>
            <p className="text-xs font-medium text-[#0071E3] uppercase tracking-wider mb-4">Full-Stack & AI Developer</p>
            <p className="text-[#86868B] text-sm mb-8 leading-relaxed px-4">
              This application was engineered to demonstrate the real-world power of AI in breaking down educational barriers, making global media accessible to everyone in their native languages.
            </p>
            
            {/* Design Credit */}
            <div className="inline-flex items-center justify-center space-x-2 bg-pink-50/80 border border-pink-200/60 text-pink-700 px-4 py-1.5 rounded-full text-xs font-medium mb-6 shadow-sm">
              <span className="text-sm">✨</span>
              <span>UI / UX Interface designed with <strong>Stitch AI</strong></span>
            </div>

            <div className="flex flex-wrap gap-3 justify-center items-center">
              <a 
                href="https://github.com/Vishnuvsh" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center px-5 py-2.5 border border-gray-200/80 rounded-full shadow-sm text-xs font-semibold text-[#1D1D1F] bg-white hover:bg-gray-50 transition-all duration-200 w-full sm:w-auto justify-center"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                GitHub Profile
              </a>
              <a 
                href="https://github.com/Vishnuvsh/ai-video-translator" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center px-5 py-2.5 border border-gray-200/80 rounded-full shadow-sm text-xs font-semibold text-[#1D1D1F] bg-white hover:bg-gray-50 transition-all duration-200 w-full sm:w-auto justify-center"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                Project Repo
              </a>
              <a 
                href="https://www.linkedin.com/in/vishnu444/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center px-5 py-2.5 bg-[#0077B5] hover:bg-[#006396] text-white rounded-full shadow-sm text-xs font-semibold transition-all duration-200 w-full sm:w-auto justify-center"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
                Connect on LinkedIn
              </a>
            </div>
          </div>
        </section>

      </div>
    </motion.div>
  );
};

export default About;
