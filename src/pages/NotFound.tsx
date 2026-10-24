import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="glass-card max-w-md w-full p-8 rounded-3xl border border-slate-800 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto mb-6">
          <FileQuestion className="w-8 h-8" />
        </div>

        <h1 className="text-3xl font-extrabold text-white mb-2">404</h1>
        <p className="text-lg font-semibold text-slate-200 mb-2">Page Not Found</p>
        <p className="text-slate-400 text-sm mb-6">
          The requested page could not be located.
        </p>

        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all"
        >
          <Home className="w-4 h-4" />
          <span>Back to dashboard</span>
        </Link>
      </div>
    </div>
  );
};
