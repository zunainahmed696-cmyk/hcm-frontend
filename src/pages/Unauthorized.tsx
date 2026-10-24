import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Unauthorized: React.FC = () => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-3xl border border-rose-500/20 bg-slate-900/60 p-8 text-center">
        <span className="mx-auto mb-5 w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
          <ShieldX className="w-7 h-7" />
        </span>
        <h1 className="text-2xl font-extrabold text-white">Access denied</h1>
        <p className="mt-3 text-sm text-slate-400">
          Your role{user ? <> (<span className="font-semibold text-indigo-300 uppercase">{user.role}</span>)</> : ''} does not have permission to open this page.
        </p>
        <Link to="/dashboard" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white">
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </Link>
      </div>
    </div>
  );
};
