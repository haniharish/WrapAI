import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toggleRole } from '../store/slices/authSlice.js';
import { Button } from '../components/ui/Button.jsx';
import { Sparkles, ArrowRight, Shield } from 'lucide-react';

export function PublicLayout() {
  const role = useSelector((state) => state.auth.role);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-brand-light text-brand-navy">
      {/* Public Header */}
      <header className="sticky top-0 z-40 bg-brand-light/90 backdrop-blur-md border-b border-brand-charcoal/15">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <span className="font-display text-3xl tracking-wider text-brand-navy">WrapAI</span>
            <span className="hidden sm:inline-block text-[10px] font-mono uppercase bg-brand-navy text-brand-white px-2 py-0.5 tracking-widest">
              INTELLIGENCE
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8 text-xs font-bold uppercase tracking-widest text-brand-charcoal">
            <a href="#features" className="hover:text-brand-navy transition-colors">Features</a>
            <a href="#pipeline" className="hover:text-brand-navy transition-colors">How It Works</a>
            <a href="#meeting-intel" className="hover:text-brand-navy transition-colors">Meeting Intel</a>
            <a href="#ask-ai" className="hover:text-brand-navy transition-colors">Ask Your Content</a>
          </nav>

          <div className="flex items-center space-x-4">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="primary" size="sm" icon={ArrowRight} iconPosition="right">
                Start Wrapping
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Public Footer */}
      <footer className="bg-brand-navy text-brand-white border-t border-brand-charcoal pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <span className="font-display text-4xl tracking-wider text-brand-white">WrapAI</span>
              <p className="mt-3 text-sm text-brand-sage max-w-sm">
                From Content to Clarity. The AI-powered meeting and multi-modal intelligence platform built for modern knowledge teams.
              </p>
              <p className="mt-4 text-xs font-mono text-brand-taupe">
                &copy; {new Date().getFullYear()} WrapAI Inc. All rights reserved.
              </p>
            </div>
            <div>
              <h4 className="font-display text-sm uppercase tracking-widest text-brand-white mb-4">Platform</h4>
              <ul className="space-y-2.5 text-xs text-brand-sage font-medium">
                <li><Link to="/dashboard" className="hover:text-brand-white">User Dashboard</Link></li>
                <li><Link to="/upload" className="hover:text-brand-white">Upload Media</Link></li>
                <li><Link to="/content" className="hover:text-brand-white">Content Library</Link></li>
                <li><Link to="/admin" className="hover:text-brand-white">Admin Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display text-sm uppercase tracking-widest text-brand-white mb-4">Supported Input</h4>
              <ul className="space-y-2.5 text-xs text-brand-sage font-medium">
                <li>Audio (MP3, WAV, M4A)</li>
                <li>Video (MP4, MOV, MKV)</li>
                <li>Documents & Text (TXT)</li>
                <li>Remote Media Links</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
