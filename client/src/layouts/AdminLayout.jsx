import React from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toggleRole, logout } from '../store/slices/authSlice.js';
import {
  Activity,
  Users,
  Database,
  Cpu,
  BarChart3,
  Terminal,
  ArrowLeft,
  ShieldAlert,
  Radio
} from 'lucide-react';
import { clsx } from 'clsx';
import { ToastContainer } from '../components/ui/Toast.jsx';

export function AdminLayout() {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const adminNav = [
    { to: '/admin', label: 'Overview', icon: Activity, end: true },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/content', label: 'Content', icon: Database },
    { to: '/admin/processing', label: 'Processing', icon: Cpu },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/admin/system', label: 'System', icon: Terminal }
  ];

  return (
    <div className="min-h-screen flex bg-brand-charcoal text-brand-light font-sans">
      {/* Dark/Brutalist Admin Sidebar */}
      <aside className="w-64 bg-brand-navy border-r border-brand-charcoal flex flex-col justify-between flex-shrink-0 z-30">
        <div>
          {/* Admin Header */}
          <div className="h-20 px-6 flex items-center justify-between border-b border-brand-charcoal">
            <div className="flex items-center space-x-2">
              <span className="font-display text-2xl tracking-wider text-brand-white">WrapAI</span>
              <span className="text-[9px] font-mono uppercase bg-red-600 text-white px-1.5 py-0.5 tracking-widest font-bold">
                ADMIN
              </span>
            </div>
            <div className="flex items-center text-emerald-400" title="System Operational">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
          </div>

          <div className="p-4 border-b border-brand-charcoal">
            <Link
              to="/dashboard"
              className="flex items-center text-xs font-bold text-brand-sage hover:text-brand-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-2" />
              Return to User Dashboard
            </Link>
          </div>

          {/* Nav Items */}
          <nav className="p-4 space-y-1.5">
            {adminNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all duration-200 border',
                      isActive
                        ? 'bg-brand-white text-brand-navy border-brand-white font-extrabold shadow-sm'
                        : 'bg-transparent text-brand-sage border-transparent hover:bg-brand-charcoal/80 hover:text-brand-white'
                    )
                  }
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer Admin info */}
        <div className="p-4 border-t border-brand-charcoal bg-black/20">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs font-bold text-brand-white">{user?.fullName || 'Admin User'}</p>
              <p className="text-[10px] font-mono text-emerald-400">ROLE: ADMINISTRATOR</p>
            </div>
            <button
              onClick={() => dispatch(toggleRole())}
              className="text-[10px] font-mono text-brand-sage hover:text-brand-white border border-brand-charcoal px-1.5 py-0.5"
            >
              Toggle Role
            </button>
          </div>
        </div>
      </aside>

      {/* Main Admin Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-brand-navy/95">
        <header className="h-16 bg-brand-navy border-b border-brand-charcoal px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center space-x-3">
            <ShieldAlert className="w-4 h-4 text-brand-cyan" />
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-brand-sage">
              Platform Administration & Telemetry
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-1">
              STATUS: HEALTHY
            </span>
          </div>
        </header>

        <main className="flex-1 p-6 sm:p-8">
          <Outlet />
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
