import React from 'react';

const About = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 animate-fade-in-up">
      
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center space-x-2 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100 mb-6 cursor-default hover-lift">
           <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path></svg>
           <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Project Information</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold mb-6 text-gray-900 tracking-tight">About AI Video Translator</h1>
        <p className="text-gray-500 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed font-medium">
          Breaking language barriers in educational and entertainment content by providing highly accurate, AI-powered transcriptions and translations for any YouTube video.
        </p>
      </div>

      <div className="space-y-20">
        
        {/* How it Works Section */}
        <section className="text-center">
          <div className="inline-flex items-center justify-center px-3 py-1 bg-amber-50 rounded-full mb-4">
             <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Process in 3 Steps</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-10">How It Works</h2>
          
          <div className="grid md:grid-cols-3 gap-6 text-left">
            {/* Step 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover-lift transition-all duration-300 flex flex-col">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-xl flex items-center justify-center font-bold text-lg mb-6 shadow-sm">01</div>
              <h3 className="font-bold text-xl text-gray-900 mb-3">Provide Link</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-6 flex-grow">Paste any public YouTube video link into the analyzer to fetch video details.</p>
              <div className="flex items-center text-xs font-semibold text-amber-600 uppercase tracking-wider mt-auto pt-4 border-t border-gray-50">
                 <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                 Instant Fetching
              </div>
            </div>
            
            {/* Step 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover-lift transition-all duration-300 flex flex-col">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-xl flex items-center justify-center font-bold text-lg mb-6 shadow-sm">02</div>
              <h3 className="font-bold text-xl text-gray-900 mb-3">Transcribe</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-6 flex-grow">Our AI engine accurately extracts the spoken audio and converts it into text.</p>
              <div className="flex items-center text-xs font-semibold text-amber-600 uppercase tracking-wider mt-auto pt-4 border-t border-gray-50">
                 <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg>
                 Audio Extraction
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover-lift transition-all duration-300 flex flex-col">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-xl flex items-center justify-center font-bold text-lg mb-6 shadow-sm">03</div>
              <h3 className="font-bold text-xl text-gray-900 mb-3">Translate & Listen</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-6 flex-grow">Translate the text into your preferred regional language and generate natural AI voiceovers.</p>
              <div className="flex items-center text-xs font-semibold text-amber-600 uppercase tracking-wider mt-auto pt-4 border-t border-gray-50">
                 <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path></svg>
                 Multi-Language
              </div>
            </div>
          </div>
        </section>

        {/* Key Features Section */}
        <section className="bg-white rounded-3xl p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center px-3 py-1 bg-gray-100 rounded-full mb-4">
               <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Capabilities</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Key Features</h2>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-6 md:gap-8">
            <div className="flex items-start space-x-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors">
              <div className="flex-shrink-0 w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 text-xl border border-amber-100">
                📝
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-lg mb-1">Smart Transcription</h4>
                <p className="text-sm text-gray-500 leading-relaxed">High-accuracy audio extraction powered by industry-leading AI models.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors">
              <div className="flex-shrink-0 w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 text-xl border border-amber-100">
                🌍
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-lg mb-1">Multi-Language Support</h4>
                <p className="text-sm text-gray-500 leading-relaxed">Seamless translations into regional languages like Malayalam, Hindi, Tamil, and more.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors">
              <div className="flex-shrink-0 w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 text-xl border border-amber-100">
                🗣️
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-lg mb-1 flex items-center flex-wrap gap-2">
                  AI Voice Generation
                  <span className="px-2 py-0.5 text-[9px] uppercase font-bold tracking-wider bg-amber-100 text-amber-700 rounded-full">Coming Soon</span>
                </h4>
                <p className="text-sm text-gray-500 leading-relaxed">Listen to translations with natural-sounding TTS (Text-to-Speech) voices. (Currently under development)</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors">
              <div className="flex-shrink-0 w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 text-xl border border-amber-100">
                ⚡
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-lg mb-1">Fast & Robust</h4>
                <p className="text-sm text-gray-500 leading-relaxed">Built with an intelligent retry system to ensure large videos process smoothly without breaking.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Developer Info */}
        <section className="flex justify-center pb-8">
          <div className="bg-white rounded-3xl p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 text-center max-w-lg w-full hover-lift transition-all duration-300">
            <div className="w-16 h-16 bg-gray-900 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-5 shadow-md">
              V
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Created by Vishnu</h2>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed px-4">
              This project was built to demonstrate the power of AI in breaking down educational barriers, making global content accessible to everyone in their native languages.
            </p>
            <a href="#" className="inline-flex items-center px-6 py-3 border border-transparent rounded-full shadow-sm text-sm font-bold text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all duration-200 w-full sm:w-auto justify-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              GitHub Repository
            </a>
          </div>
        </section>

      </div>
    </div>
  );
};

export default About;
