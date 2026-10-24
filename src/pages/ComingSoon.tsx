import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Users, Clock, CalendarDays, Wallet, Sparkles, Building2,
  ShieldCheck, ArrowRight, LucideIcon, CheckCircle2, AlertTriangle, Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NAV_ITEMS, ROLE_LABEL, ROLE_BADGE_STYLE } from '../config/nav';
import { PageHeader, StatCard, Badge, Button, EmptyState } from '../components/ui';

export const ComingSoon: React.FC = () => {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const currentItem = NAV_ITEMS.find((i) => i.path === pathname);
  const Icon = currentItem?.icon ?? Layers;

  // If on Dashboard, render a role-specific high-impact overview
  if (pathname === '/dashboard' && user) {
    const roleStyle = ROLE_BADGE_STYLE[user.role];

    return (
      <div className="max-w-6xl space-y-8">
        <PageHeader
          title={`Welcome, ${user.name}`}
          subtitle={`You are currently signed into the ${ROLE_LABEL[user.role]} panel. Monitor personnel operations, review pending actions, or consult your AI Assistant.`}
          badge={
            <Badge variant={roleStyle.variant} pulse>
              {roleStyle.text} Active
            </Badge>
          }
          action={
            <Button
              variant="primary"
              icon={Sparkles}
              onClick={() => navigate('/assistant')}
            >
              Consult AI Assistant
            </Button>
          }
        />

        {/* Admin Dashboard Preview */}
        {user.role === 'admin' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard
                label="Attendance"
                value="Live Monitoring"
                subtext="Present / total & late arrival tracking"
                icon={Clock}
              />
              <StatCard
                label="total HR"
                value="Active Staff"
                subtext="Provisioned HR officers"
                icon={Users}
              />
              <StatCard
                label="on leave"
                value="Staff on Leave"
                subtext="Approved & pending review requests"
                icon={CalendarDays}
              />
            </div>

            <div className="surface-card rounded-2xl p-6 border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Next Operational Steps</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Recommended flow for judges & team setup</p>
                </div>
                <Badge variant="indigo">Admin Action Flow</Badge>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 pt-2">
                <div
                  onClick={() => navigate('/organization')}
                  className="surface-raised rounded-xl p-4 cursor-pointer hover:border-brand-500/50 border border-transparent transition-all group"
                >
                  <Building2 className="w-5 h-5 text-brand-400 mb-2 group-hover:scale-110 transition-transform" />
                  <h4 className="text-sm font-bold text-white flex items-center justify-between">
                    Review Organization <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">Configure grace period, weekends, and departments.</p>
                </div>

                <div
                  onClick={() => navigate('/users')}
                  className="surface-raised rounded-xl p-4 cursor-pointer hover:border-brand-500/50 border border-transparent transition-all group"
                >
                  <Users className="w-5 h-5 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
                  <h4 className="text-sm font-bold text-white flex items-center justify-between">
                    Provision HR Logins <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">Create HR officers and hand off credentials.</p>
                </div>

                <div
                  onClick={() => navigate('/audit')}
                  className="surface-raised rounded-xl p-4 cursor-pointer hover:border-brand-500/50 border border-transparent transition-all group"
                >
                  <ShieldCheck className="w-5 h-5 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                  <h4 className="text-sm font-bold text-white flex items-center justify-between">
                    System Audit Stream <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">Verify create, update, and approval audit records.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HR Dashboard Preview */}
        {user.role === 'hr' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="People Operations"
                value="HR Panel"
                subtext="Register & manage staff"
                icon={Users}
              />
              <StatCard
                label="Daily Attendance"
                value="Supervision"
                subtext="Approve check-in corrections"
                icon={Clock}
              />
              <StatCard
                label="Leave Inboxes"
                value="Pending Inbox"
                subtext="Approve with comment"
                icon={CalendarDays}
              />
              <StatCard
                label="Monthly Payroll"
                value="Draft Engine"
                subtext="Generate salary runs"
                icon={Wallet}
              />
            </div>

            <div className="surface-card rounded-2xl p-6 border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">HR Workstation Actions</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Daily personnel and employee lifecycle tasks</p>
                </div>
                <Badge variant="amber">HR Workflows</Badge>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 pt-2">
                <div
                  onClick={() => navigate('/employees')}
                  className="surface-raised rounded-xl p-4 cursor-pointer hover:border-amber-500/50 border border-transparent transition-all group"
                >
                  <Users className="w-5 h-5 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
                  <h4 className="text-sm font-bold text-white flex items-center justify-between">
                    Employee Directory <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">Register new hires &amp; manage profiles.</p>
                </div>

                <div
                  onClick={() => navigate('/leave')}
                  className="surface-raised rounded-xl p-4 cursor-pointer hover:border-amber-500/50 border border-transparent transition-all group"
                >
                  <CalendarDays className="w-5 h-5 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                  <h4 className="text-sm font-bold text-white flex items-center justify-between">
                    Leave Approvals <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">Process pending employee time-off requests.</p>
                </div>

                <div
                  onClick={() => navigate('/payroll')}
                  className="surface-raised rounded-xl p-4 cursor-pointer hover:border-amber-500/50 border border-transparent transition-all group"
                >
                  <Wallet className="w-5 h-5 text-brand-400 mb-2 group-hover:scale-110 transition-transform" />
                  <h4 className="text-sm font-bold text-white flex items-center justify-between">
                    Prepare Payroll Draft <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">Compute monthly attendance deductions &amp; tax.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Employee Dashboard Preview */}
        {user.role === 'employee' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Daily Check-in"
                value="Ready"
                subtext="Web or Camera location"
                icon={Clock}
              />
              <StatCard
                label="Weekly Log"
                value="Standard"
                subtext="40-hour target tracking"
                icon={Clock}
              />
              <StatCard
                label="Leave Quota"
                value="Balances"
                subtext="Annual, sick & casual"
                icon={CalendarDays}
              />
              <StatCard
                label="My Payslips"
                value="Latest Run"
                subtext="PDF download ready"
                icon={Wallet}
              />
            </div>

            <div className="surface-card rounded-2xl p-6 border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Employee Self-Service Desk</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Quick actions for your daily work</p>
                </div>
                <Badge variant="emerald">Employee Self-Service</Badge>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 pt-2">
                <div
                  onClick={() => navigate('/attendance')}
                  className="surface-raised rounded-xl p-4 cursor-pointer hover:border-emerald-500/50 border border-transparent transition-all group"
                >
                  <Clock className="w-5 h-5 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                  <h4 className="text-sm font-bold text-white flex items-center justify-between">
                    Attendance Calendar <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">Record check-in / check-out or request corrections.</p>
                </div>

                <div
                  onClick={() => navigate('/leave')}
                  className="surface-raised rounded-xl p-4 cursor-pointer hover:border-emerald-500/50 border border-transparent transition-all group"
                >
                  <CalendarDays className="w-5 h-5 text-brand-400 mb-2 group-hover:scale-110 transition-transform" />
                  <h4 className="text-sm font-bold text-white flex items-center justify-between">
                    Smart Leave Application <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">Apply in plain English with AI assistance.</p>
                </div>

                <div
                  onClick={() => navigate('/profile')}
                  className="surface-raised rounded-xl p-4 cursor-pointer hover:border-emerald-500/50 border border-transparent transition-all group"
                >
                  <Users className="w-5 h-5 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
                  <h4 className="text-sm font-bold text-white flex items-center justify-between">
                    My Personnel File <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">Review job details and update phone/address.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Generic placeholder for unbuilt screens
  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title={currentItem?.label ?? 'Feature in Progress'}
        subtitle={currentItem?.description}
        badge={<Badge variant="indigo">{currentItem?.phase ?? 'Upcoming'}</Badge>}
      />

      <EmptyState
        icon={Icon}
        title={`${currentItem?.label ?? 'Module'} Implementation Queued`}
        description={`This module delivers ${currentItem?.description.toLowerCase() ?? 'scheduled functionality'} in accordance with the hackathon implementation roadmap.`}
        action={
          <Button variant="secondary" onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        }
      />
    </div>
  );
};
