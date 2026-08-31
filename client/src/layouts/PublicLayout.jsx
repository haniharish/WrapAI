import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { PosterButton } from '../components/ui/PosterButton.jsx';

export function PublicLayout() {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  return (
    <div className="min-h-screen flex flex-col bg-[#E3E2DE] text-[#141414]">
      {/* 80px Sticky Modernist Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#E3E2DE]/95 backdrop-blur-xs border-b border-[#C7C7C7] h-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 h-full">
          <div className="grid grid-cols-12 h-full items-center">
            {/* Columns 1-3: WRAPAI Logo + Square */}
            <div className="col-span-6 sm:col-span-3 flex items-center space-x-3">
              <div className="w-4 h-4 bg-[#141414] flex-shrink-0" />
              <Link to="/" className="text-xl sm:text-2xl font-black tracking-tight text-[#141414] uppercase hover:text-[#1351AA] transition-colors duration-300">
                WRAPAI
              </Link>
            </div>

            {/* Columns 4-8: Editorial Navigation Links */}
            <nav className="hidden lg:flex col-span-5 items-center space-x-8 text-xs font-bold uppercase tracking-[0.2em] text-[#141414]">
              <a href="#system" className="hover:text-[#1351AA] transition-colors duration-300">SYSTEM</a>
              <a href="#process" className="hover:text-[#1351AA] transition-colors duration-300">PROCESS</a>
              <a href="#intelligence" className="hover:text-[#1351AA] transition-colors duration-300">INTELLIGENCE</a>
              <a href="#rag" className="hover:text-[#1351AA] transition-colors duration-300">RAG</a>
              <a href="#reports" className="hover:text-[#1351AA] transition-colors duration-300">REPORTS</a>
            </nav>

            {/* Columns 9-12: Actions */}
            <div className="col-span-6 sm:col-span-9 lg:col-span-4 flex items-center justify-end space-x-3 sm:space-x-4">
              {isAuthenticated ? (
                <Link to="/dashboard">
                  <PosterButton variant="primary" size="sm">
                    DASHBOARD
                  </PosterButton>
                </Link>
              ) : (
                <>
                  <Link to="/login">
                    <PosterButton variant="outline" size="sm">
                      SIGN IN
                    </PosterButton>
                  </Link>
                  <Link to="/register">
                    <PosterButton variant="primary" size="sm">
                      START EXPLORING
                    </PosterButton>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Modernist Editorial Footer */}
      <footer className="bg-[#E3E2DE] border-t border-[#C7C7C7] pt-16 sm:pt-24 pb-12">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-12 gap-8 sm:gap-12 pb-16 border-b border-[#C7C7C7]">
            <div className="col-span-12 lg:col-span-6 space-y-4">
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-[#141414]">
                MAKE CONTENT <span className="text-[#1351AA]">USEFUL.</span>
              </h2>
              <p className="text-sm text-[#444343] max-w-md leading-relaxed">
                Transform multi-modal meetings, conversations, lectures and files into structured transcripts, verifiable insights, and professional reports.
              </p>
            </div>

            <div className="col-span-6 sm:col-span-3 lg:col-span-3 space-y-3">
              <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#7A7A7A] block">
                PLATFORM
              </span>
              <ul className="space-y-2 text-xs font-bold uppercase tracking-wider text-[#141414]">
                <li><Link to="/dashboard" className="hover:text-[#1351AA] transition-colors">DASHBOARD</Link></li>
                <li><Link to="/upload" className="hover:text-[#1351AA] transition-colors">UPLOAD MEDIA</Link></li>
                <li><Link to="/content" className="hover:text-[#1351AA] transition-colors">CONTENT LIBRARY</Link></li>
                <li><Link to="/reports" className="hover:text-[#1351AA] transition-colors">REPORTS</Link></li>
              </ul>
            </div>

            <div className="col-span-6 sm:col-span-3 lg:col-span-3 space-y-3">
              <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#7A7A7A] block">
                SYSTEM
              </span>
              <ul className="space-y-2 text-xs font-mono text-[#444343]">
                <li>SPEECH-TO-TEXT (WHISPER)</li>
                <li>SPEAKER DIARIZATION</li>
                <li>RAG VECTOR SEARCH</li>
                <li>DOCUMENT EXPORTS</li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-[#7A7A7A] space-y-4 sm:space-y-0">
            <span>&copy; {new Date().getFullYear()} WRAPAI PLATFORM. ALL RIGHTS RESERVED.</span>
            <span>SYSTEM VERSION 12.0 / POSTER MODERNIST</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default PublicLayout;
