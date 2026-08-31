import React from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toggleRole } from '../store/slices/authSlice.js';
import {
  Activity,
  Users,
  Database,
  Cpu,
  BarChart3,
  Terminal,
  ArrowLeft
} from 'lucide-react';
import { clsx } from 'clsx';
import { ToastContainer } from '../components/ui/Toast.jsx';

export function AdminLayout() {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();

  const adminNav = [
    { to: '/admin', label: 'OVERVIEW', icon: Activity, end: true },
    { to: '/admin/users', label: 'USERS', icon: Users },
    { to: '/admin/content', label: 'CONTENT', icon: Database },
    { to: '/admin/processing', label: 'PROCESSING', icon: Cpu },
    { to: '/admin/analytics', label: 'ANALYTICS', icon: BarChart3 },
    { to: '/admin/system', label: 'SYSTEM', icon: Terminal }
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#E3E2DE] text-[#141414]">
      {/* Modernist Editorial Admin Sidebar */}
      <aside className="w-full md:w-64 bg-[#141414] text-[#E3E2DE] border-b md:border-b-0 md:border-r border-[#141414] flex flex-col justify-between flex-shrink-0 z-30">
        <div>
          {/* Admin Header */}
          <div className="h-20 px-6 flex items-center justify-between border-b border-[#444343]">
            <div className="flex items-center space-x-3">
              <div className="w-3.5 h-3.5 bg-[#1351AA]" />
              <span className="text-xl font-black tracking-tight text-[#E3E2DE] uppercase">
                WRAPAI
              </span>
              <span className="text-[9px] font-mono uppercase bg-[#1351AA] text-[#E3E2DE] px-1.5 py-0.5 font-bold">
                ADMIN
              </span>
            </div>
          </div>

          <div className="p-4 border-b border-[#444343]">
            <Link
              to="/dashboard"
              className="flex items-center text-xs font-bold uppercase tracking-wider text-[#E3E2DE]/70 hover:text-[#E3E2DE] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-2" />
              USER DASHBOARD
            </Link>
          </div>

          {/* Nav Items */}
          <nav className="p-3 space-y-1">
            {adminNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center px-4 py-3 text-xs font-bold uppercase tracking-[0.15em] transition-colors duration-300 ease-linear border',
                      isActive
                        ? 'bg-[#1351AA] text-[#E3E2DE] border-[#1351AA]'
                        : 'bg-transparent text-[#E3E2DE]/70 border-transparent hover:bg-white/10 hover:text-[#E3E2DE]'
                    )
                  }
                >
                  <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer Admin info */}
        <div className="p-4 border-t border-[#444343] bg-black/30 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-[#E3E2DE]">{user?.fullName || 'ADMIN'}</p>
              <p className="text-[10px] font-mono text-[#1351AA]">ROLE: ADMINISTRATOR</p>
            </div>
            <button
              onClick={() => dispatch(toggleRole())}
              className="text-[10px] font-mono text-[#E3E2DE]/70 hover:text-[#E3E2DE] border border-[#444343] px-2 py-1 cursor-pointer"
            >
              TOGGLE
            </button>
          </div>
        </div>
      </aside>

      {/* Main Admin Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-20 bg-[#E3E2DE]/95 backdrop-blur-xs border-b border-[#C7C7C7] px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#7A7A7A]">
              PLATFORM TELEMETRY & SYSTEM CONTROL
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono font-bold text-[#1b6b36] bg-[#1b6b36]/10 border border-[#1b6b36] px-2.5 py-1 uppercase">
              STATUS: OPERATIONAL
            </span>
          </div>
        </header>

        <main className="flex-1 p-6 sm:p-8 lg:p-10 max-w-[1400px] w-full mx-auto">
          <Outlet />
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}

export default AdminLayout;
