import React from 'react';

const About = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in-up">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        
        {/* Hero Section */}
        <div className="bg-amber-600 px-8 py-12 text-center text-white">
          <h1 className="text-4xl font-extrabold mb-4 tracking-tight">About AI Video Translator</h1>
          <p className="text-amber-100 text-lg max-w-2xl mx-auto leading-relaxed">
            Breaking language barriers in educational and entertainment content by providing highly accurate, AI-powered transcriptions and translations for any YouTube video.
          </p>
        </div>

        <div className="p-8 md:p-12 space-y-12">
          
          {/* How it Works Section */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="bg-amber-100 text-amber-600 p-2 rounded-lg mr-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              </span>
              How It Works
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 relative group hover:border-amber-300 transition-colors">
                <div className="absolute -top-4 -left-4 w-10 h-10 bg-amber-600 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg">1</div>
                <h3 className="font-semibold text-lg text-gray-900 mt-2 mb-2">Provide Link</h3>
                <p className="text-gray-600 text-sm">Paste any public YouTube video link into the analyzer to fetch video details.</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 relative group hover:border-amber-300 transition-colors">
                <div className="absolute -top-4 -left-4 w-10 h-10 bg-amber-600 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg">2</div>
                <h3 className="font-semibold text-lg text-gray-900 mt-2 mb-2">Transcribe</h3>
                <p className="text-gray-600 text-sm">Our AI engine accurately extracts the spoken audio and converts it into text.</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 relative group hover:border-amber-300 transition-colors">
                <div className="absolute -top-4 -left-4 w-10 h-10 bg-amber-600 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg">3</div>
                <h3 className="font-semibold text-lg text-gray-900 mt-2 mb-2">Translate & Listen</h3>
                <p className="text-gray-600 text-sm">Translate the text into your preferred regional language and generate natural AI voiceovers.</p>
              </div>
            </div>
          </section>

          {/* Key Features Section */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="bg-amber-100 text-amber-600 p-2 rounded-lg mr-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
              </span>
              Key Features
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-2xl">📝</span>
                <div>
                  <h4 className="font-semibold text-gray-900">Smart Transcription</h4>
                  <p className="text-sm text-gray-600 mt-1">High-accuracy audio extraction powered by industry-leading AI models.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-2xl">🌍</span>
                <div>
                  <h4 className="font-semibold text-gray-900">Multi-Language Support</h4>
                  <p className="text-sm text-gray-600 mt-1">Seamless translations into regional languages like Malayalam, Hindi, Tamil, and more.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-4 rounded-lg hover:bg-gray-50 transition-colors relative">
                <span className="text-2xl">🗣️</span>
                <div>
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    AI Voice Generation
                    <span className="ml-2 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-amber-100 text-amber-700 rounded-full">Coming Soon</span>
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">Listen to translations with natural-sounding TTS (Text-to-Speech) voices. (Currently under development)</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-2xl">⚡</span>
                <div>
                  <h4 className="font-semibold text-gray-900">Fast & Robust</h4>
                  <p className="text-sm text-gray-600 mt-1">Built with an intelligent retry system to ensure large videos process smoothly without breaking.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Developer Info */}
          <section className="bg-gray-50 -mx-8 -md:mx-12 -mb-8 -md:mb-12 p-8 md:p-12 border-t border-gray-200 mt-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">Developer & Project Info</h2>
            <p className="text-gray-600 text-center max-w-xl mx-auto mb-6 text-sm">
              This project was built to demonstrate the power of AI in breaking down educational barriers, making global content accessible to everyone in their native languages.
            </p>
            <div className="flex justify-center space-x-4">
              <a href="#" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                GitHub Repo
              </a>
              <div className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500">
                Created by Vishnu
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default About;
