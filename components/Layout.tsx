
import React from 'react';
import { Settings, Shield, HardHat, Info } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  onNavigateToInfo?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onNavigateToInfo }) => {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <header className="border-b border-neutral-300 bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-neutral-900">IsoGuard <span className="text-blue-600">AI</span></h1>
              <p className="text-[10px] text-neutral-600 uppercase tracking-widest font-semibold">Piping Design Intelligence</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <nav className="flex gap-4 text-sm font-medium text-neutral-600">
              <button onClick={onNavigateToInfo} className="hover:text-neutral-900 transition-colors flex items-center gap-1.5">
                <Info className="w-4 h-4" />
                About
              </button>
              <a href="#" className="hover:text-neutral-900 transition-colors">Archive</a>
            </nav>
            <div className="h-6 w-px bg-neutral-300" />
            <div className="flex items-center gap-4">
              <button className="text-neutral-600 hover:text-neutral-900"><Settings className="w-5 h-5" /></button>
              <button className="bg-neutral-100 text-neutral-900 px-4 py-1.5 rounded-full text-sm font-medium hover:bg-neutral-200 transition-all border border-neutral-300">
                Project #XJ-102
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {children}
      </main>

      <footer className="border-t border-neutral-300 py-6 bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <HardHat className="w-4 h-4" />
            <span>Industrial Safety Compliant Tool</span>
          </div>
          <p>© 2026  Developed by ScikIQ.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-neutral-200">Terms</a>
            <a href="#" className="hover:text-neutral-200">Privacy</a>
            <a href="#" className="hover:text-neutral-200 flex items-center gap-1"><Info className="w-3 h-3" /> Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;

import { LucideIcon } from 'lucide-react';
