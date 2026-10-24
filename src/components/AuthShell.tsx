import React from 'react';
import { Briefcase, ShieldCheck, Users, Clock, Sparkles } from 'lucide-react';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/** Institutional, high-trust split shell for authentication flows */
export const AuthShell: React.FC<AuthShellProps> = ({ title, subtitle, children, footer }) => (
  <div className="min-h-screen grid lg:grid-cols-12 bg-background text-slate-100">
    {/* Visual context hero (Desktop 5 cols) */}
    <aside className="hidden lg:flex lg:col-span-5 relative flex-col justify-between p-12 bg-[#0E1524] border-r border-white/5 select-none">
      <div className="relative">
        <div className="flex items-center gap-3 text-white">
          <div className="w-10 h-10 rounded-xl bg-brand-600 border border-brand-400/30 flex items-center justify-center shadow-lg shadow-brand-600/30">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight">HCM Lite</span>
            <span className="block text-[11px] font-mono text-slate-400">Human Capital Management</span>
          </div>
        </div>

        <div className="mt-14 space-y-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
            Intelligent personnel operations, driven by live data.
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Every metric emerges from active operations. No mock seeds, no hardcoded charts: pure role-based governance for Admins, HR officers, and Employees.
          </p>

          <div className="pt-4 space-y-3">
            {[
              { icon: ShieldCheck, text: 'Strict server-side role & data-scope guards' },
              { icon: Clock, text: 'Automated 09:15 grace, half-day & geofence rules' },
              { icon: Users, text: 'Three dedicated panels with tailored visibility' },
              { icon: Sparkles, text: 'AI assistant bound to real database state' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-xs text-slate-300 font-medium">
                <span className="w-6 h-6 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-10 border-t border-white/5 text-xs text-slate-500 font-mono">
        Saylani Hackathon &bull; HCM Lite Challenge
      </div>
    </aside>

    {/* Form Panel (Desktop 7 cols) */}
    <main className="lg:col-span-7 flex items-center justify-center px-6 py-12 sm:px-12">
      <div className="w-full max-w-md space-y-8">
        <div className="lg:hidden flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white">
            <Briefcase className="w-4 h-4" />
          </div>
          <span className="text-lg font-extrabold text-white">HCM Lite</span>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
        </div>

        <div className="surface-card rounded-2xl p-6 sm:p-8">
          {children}
        </div>

        {footer && <div className="text-center text-xs text-slate-500">{footer}</div>}
      </div>
    </main>
  </div>
);
