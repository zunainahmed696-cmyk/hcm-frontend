import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Briefcase, LogOut, Menu, X, KeyRound, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { navForRole, ROLE_LABEL, ROLE_BADGE_STYLE, NavCategory } from '../config/nav';
import { Badge } from './ui';

export const AppLayout: React.FC = () => {
  const { user, companyName, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  const items = navForRole(user.role);
  const roleBadge = ROLE_BADGE_STYLE[user.role];

  // Group items by category
  const categories: NavCategory[] = ['General', 'Operations', 'Finance & Analytics', 'System'];
  const groupedItems = categories
    .map((cat) => ({
      category: cat,
      items: items.filter((item) => item.category === cat),
    }))
    .filter((group) => group.items.length > 0);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const currentNav = items.find((i) => i.path === location.pathname);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#09090B] border-r border-zinc-800 select-none">
      {/* Brand & Organization Title */}
      <div className="flex items-center gap-3.5 px-6 h-20 border-b border-zinc-800">
        <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-950 flex items-center justify-center shrink-0 border border-white font-bold">
          <Briefcase className="w-5 h-5 text-zinc-950" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-base font-extrabold text-zinc-100 tracking-tight leading-none">
              HCM Lite
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-medium truncate mt-1">
            {companyName ?? 'Organization'}
          </p>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav aria-label="Sidebar Navigation" className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        {groupedItems.map((group) => (
          <div key={group.category} className="space-y-1">
            <div className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
              {group.category}
            </div>
            {group.items.map(({ path, label, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${isActive
                    ? 'bg-zinc-100 text-zinc-950 shadow-sm font-bold'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-zinc-950' : 'text-zinc-400 group-hover:text-zinc-200'
                        }`}
                    />
                    <span className="truncate">{label}</span>
                    {path === '/assistant' && (
                      <span className={`ml-auto flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-full border ${isActive ? 'bg-zinc-200 text-zinc-950 border-zinc-300' : 'bg-zinc-850 text-zinc-300 border-zinc-700'
                        }`}>
                        <Sparkles className="w-2.5 h-2.5" /> AI
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User Profile & Actions Footer */}
      <div className="p-4 border-t border-zinc-800 bg-[#09090B]">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
          <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold flex items-center justify-center shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-zinc-100 truncate leading-tight">{user.name}</p>
            <div className="mt-1">
              <Badge variant={roleBadge.variant}>
                {roleBadge.text}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate('/change-password')}
              title="Change Password"
              aria-label="Change Password"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <KeyRound className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              title="Sign Out"
              aria-label="Sign Out"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col lg:flex-row">
      {/* Desktop Persistent Sidebar (260px) */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Top Navigation Bar */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-5 h-16 bg-[#09090B]/95 backdrop-blur border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-950 flex items-center justify-center font-bold">
            <Briefcase className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-zinc-100 tracking-tight">HCM Lite</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open Navigation Menu"
          className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Mobile Slide-over Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-72 max-w-[85vw] h-full relative z-10 shadow-2xl">
            <button
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
              className="absolute top-5 right-4 z-20 p-2 text-zinc-400 hover:text-white rounded-lg bg-zinc-900 border border-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>
            {sidebarContent}
          </div>
          <div
            className="flex-1 bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
        </div>
      )}

      {/* Main App Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top subtle utility banner */}
        <header className="hidden lg:flex items-center justify-between px-8 h-14 border-b border-zinc-800 bg-[#09090B] text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-300">{ROLE_LABEL[user.role]} Workspace</span>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-400 font-medium">{currentNav?.label ?? 'Dashboard'}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px] text-zinc-500">
              Session active &bull; {user.email}
            </span>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 p-6 sm:p-8 lg:p-10 max-w-7xl w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
