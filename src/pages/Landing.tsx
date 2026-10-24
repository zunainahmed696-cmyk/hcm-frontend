import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Building2, Clock, Wallet, Sparkles, ShieldCheck,
  ArrowRight, LogIn, CheckCircle2, ChevronRight, Compass,
  FileSpreadsheet, Award, Lock, Laptop, BarChart3, Check
} from 'lucide-react';
import { Button, Badge } from '../components/ui';

export const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#080B11] text-slate-100 flex flex-col selection:bg-brand-500 selection:text-white relative overflow-hidden">
      {/* Background Radial Glow Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-brand-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[600px] right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[500px] bg-brand-500/10 rounded-full blur-[160px] pointer-events-none" />

      {/* ========================================================================= */}
      {/* 1. TOP NAVIGATION BAR                                                    */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#080B11]/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform duration-200">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-white tracking-tight">HCM Lite</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-brand-500/20 border border-brand-500/30 text-indigo-300 font-bold">
                  v1.0
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Workforce Management Cloud</span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#architecture" className="hover:text-white transition-colors">
              Platform Architecture
            </a>
            <a href="#governance" className="hover:text-white transition-colors">
              Governance &amp; Geofence
            </a>
            <a href="#payroll" className="hover:text-white transition-colors">
              1.5× Payroll Engine
            </a>
          </nav>

          {/* Action Buttons: Sign In and Sign Up */}
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="outline" size="sm" icon={LogIn}>
                Sign In
              </Button>
            </Link>

            <Link to="/setup">
              <Button variant="primary" size="sm" icon={ArrowRight}>
                Sign Up / Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION                                                          */}
      {/* ========================================================================= */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
        {/* Hackathon Badge Pill */}
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-brand-300 shadow-inner">
          <Sparkles className="w-4 h-4 text-brand-400" />
          <span>Saylani Hackathon HCM Lite • Institutional Workforce Management Platform</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1]">
          The Intelligent Operating System for Your{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-indigo-300 to-emerald-400">
            Enterprise Workforce
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="text-base sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
          Consolidate organization policies, GPS geofenced biometric attendance, automated 1.5× payroll computation,
          Employee 360 profiles, and AI-powered HR assistance into a single unified platform.
        </p>

        {/* Hero CTAs: Sign Up & Sign In */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link to="/setup" className="w-full sm:w-auto">
            <Button size="lg" icon={ArrowRight} className="w-full sm:w-auto text-base px-8 py-4 shadow-xl shadow-brand-600/30">
              Sign Up &amp; Setup Company
            </Button>
          </Link>

          <Link to="/login" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" icon={LogIn} className="w-full sm:w-auto text-base px-7 py-4">
              Sign In to Workspace
            </Button>
          </Link>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 border-t border-white/5">
          <div className="surface-card rounded-2xl p-4 text-center border border-white/5">
            <div className="text-2xl sm:text-3xl font-black text-white num-tabular">100%</div>
            <div className="text-xs text-slate-400 mt-1">Automated 1.5× Payroll</div>
          </div>
          <div className="surface-card rounded-2xl p-4 text-center border border-white/5">
            <div className="text-2xl sm:text-3xl font-black text-brand-400 num-tabular">0.00m</div>
            <div className="text-xs text-slate-400 mt-1">GPS Geofence Boundary</div>
          </div>
          <div className="surface-card rounded-2xl p-4 text-center border border-white/5">
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 num-tabular">360°</div>
            <div className="text-xs text-slate-400 mt-1">Employee Profiles &amp; CSV</div>
          </div>
          <div className="surface-card rounded-2xl p-4 text-center border border-white/5">
            <div className="text-2xl sm:text-3xl font-black text-amber-400 num-tabular">Zero-Trust</div>
            <div className="text-xs text-slate-400 mt-1">Role-Based Governance</div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. PLATFORM PREVIEW MOCKUP                                                */}
      {/* ========================================================================= */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="surface-card rounded-3xl p-3 sm:p-5 border-2 border-brand-500/30 shadow-2xl shadow-brand-950/60 bg-[#0B0F17]/90 relative">
          {/* Window Chrome Header */}
          <div className="flex items-center justify-between pb-3 px-3 border-b border-white/5 text-xs text-slate-500 font-mono">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
              <span className="ml-2 text-slate-400 hidden sm:inline">https://hcmlite.acme.com/employees</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-emerald-400 font-semibold">Live Institutional Session</span>
            </div>
          </div>

          {/* Interactive Mock Dashboard Shell */}
          <div className="p-4 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-brand-400" />
                  Acme Corporation • Enterprise Workspace
                </h3>
                <p className="text-xs text-slate-400">
                  Headquarters Location: 24.8607° N, 67.0011° E | Office Hours: 09:00 AM | Grace Period: 15 min
                </p>
              </div>
              <div className="flex gap-2">
                <Link to="/setup">
                  <Button size="sm" variant="primary" icon={ArrowRight}>
                    Get Started Now
                  </Button>
                </Link>
              </div>
            </div>

            {/* Mock Table */}
            <div className="rounded-xl border border-white/10 overflow-hidden bg-[#080B11]">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-surface-raised/60 text-slate-400 border-b border-white/10">
                    <th className="p-3">ID</th>
                    <th className="p-3">Employee Name</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Basic Pay</th>
                    <th className="p-3">Gross Salary (1.5x)</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr>
                    <td className="p-3 font-bold text-indigo-300">EMP-001</td>
                    <td className="p-3 text-white font-sans font-bold">Ahmed Raza (S/O Muhammad Raza)</td>
                    <td className="p-3 text-slate-300">Engineering</td>
                    <td className="p-3"><Badge variant="emerald">Employee</Badge></td>
                    <td className="p-3 text-slate-200">Rs. 100,000</td>
                    <td className="p-3 font-bold text-emerald-400">Rs. 150,000</td>
                    <td className="p-3"><Badge variant="emerald" pulse>Active</Badge></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-indigo-300">EMP-002</td>
                    <td className="p-3 text-white font-sans font-bold">Fatima Noor (D/O Noor Muhammad)</td>
                    <td className="p-3 text-slate-300">Engineering</td>
                    <td className="p-3"><Badge variant="emerald">Employee</Badge></td>
                    <td className="p-3 text-slate-200">Rs. 90,000</td>
                    <td className="p-3 font-bold text-emerald-400">Rs. 135,000</td>
                    <td className="p-3"><Badge variant="emerald" pulse>Active</Badge></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-indigo-300">EMP-003</td>
                    <td className="p-3 text-white font-sans font-bold">Sarah Jenkins (D/O Mark Jenkins)</td>
                    <td className="p-3 text-slate-300">Human Resources</td>
                    <td className="p-3"><Badge variant="amber">HR Officer</Badge></td>
                    <td className="p-3 text-slate-200">Rs. 85,000</td>
                    <td className="p-3 font-bold text-emerald-400">Rs. 127,500</td>
                    <td className="p-3"><Badge variant="emerald" pulse>Active</Badge></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. CORE FEATURES (BENTO GRID)                                             */}
      {/* ========================================================================= */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="indigo">Enterprise Modules</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Engineered for Precision, Compliance &amp; Speed
          </h2>
          <p className="text-slate-400 text-sm">
            Everything your company needs to operate human resources smoothly from company setup to payroll disbursement.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Card 1: Setup & Governance */}
          <div id="governance" className="surface-card rounded-2xl p-6 border border-white/5 space-y-4 hover:border-brand-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">1. Company Setup &amp; Geofencing</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Define your enterprise name, office start time, grace arrival minutes, custom weekend schedules, and GPS
              office geofence coordinates with configurable radius boundaries.
            </p>
            <ul className="text-xs text-slate-300 space-y-2 pt-2">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Office hours &amp; grace tolerance</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Custom weekend days (Sat, Sun, or custom)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>GPS radius-based geofence check</span>
              </li>
            </ul>
          </div>

          {/* Card 2: Employee 360 & Bulk CSV */}
          <div className="surface-card rounded-2xl p-6 border border-white/5 space-y-4 hover:border-brand-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">2. Employee 360 &amp; Bulk CSV</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Register employees with unique IDs, Father's Name, department, designation, and basic pay. Import entire
              organizations via CSV with pre-commit Dry-Run error validation.
            </p>
            <ul className="text-xs text-slate-300 space-y-2 pt-2">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Unique corporate ID &amp; Father's name</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Automated portal login provisioning</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Dry-run CSV collision detection</span>
              </li>
            </ul>
          </div>

          {/* Card 3: 1.5x Payroll Formula */}
          <div id="payroll" className="surface-card rounded-2xl p-6 border border-white/5 space-y-4 hover:border-brand-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">3. Compliant 1.5× Payroll Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automatically calculate compensation using the institutional formula: 100% Basic Salary + 40% House Rent
              Allowance (HRA) + 10% Medical Allowance = 150% Gross Pay.
            </p>
            <ul className="text-xs text-slate-300 space-y-2 pt-2">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Gross = 1.5 × Basic Salary formula</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Allowances breakdown (HRA &amp; Medical)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Monthly payroll lock &amp; payslips</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. CALL TO ACTION SECTION                                                 */}
      {/* ========================================================================= */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="surface-card rounded-3xl p-8 sm:p-12 border-2 border-brand-500/40 bg-gradient-to-b from-[#111827] to-[#0B0F17] relative overflow-hidden space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/20 border border-brand-500/30 text-brand-300 flex items-center justify-center mx-auto">
            <Building2 className="w-7 h-7" />
          </div>

          <div className="space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Ready to Launch Your Enterprise Workspace?
            </h2>
            <p className="text-sm text-slate-400">
              Set up your company parameters, configure your office geofence, and provision your administrator account in under 60 seconds.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link to="/setup" className="w-full sm:w-auto">
              <Button size="lg" icon={ArrowRight} className="w-full sm:w-auto text-base px-8 py-3.5">
                Sign Up &amp; Setup Company
              </Button>
            </Link>

            <Link to="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" icon={LogIn} className="w-full sm:w-auto text-base px-7 py-3.5">
                Sign In to Existing Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. FOOTER                                                                 */}
      {/* ========================================================================= */}
      <footer className="mt-auto border-t border-white/5 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">HCM Lite</span>
            <span>• Saylani Hackathon Human Capital Management Cloud</span>
          </div>
          <div className="flex items-center gap-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-slate-400">MongoDB Atlas Connected &amp; Operational</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
