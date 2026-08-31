import React from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toggleRole, logout } from '../store/slices/authSlice.js';
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  Settings,
  UploadCloud,
  LogOut,
  Shield,
  User,
  Sparkles
} from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../components/ui/Button.jsx';
import { ToastContainer } from '../components/ui/Toast.jsx';

export function UserLayout() {
  const user = useSelector((state) => state.auth.user);
  const role = useSelector((state) => state.auth.role);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const navItems = [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/content', label: 'My Content', icon: FolderOpen },
    { to: '/reports', label: 'Reports', icon: FileText },
    { to: '/settings', label: 'Settings', icon: Settings }
  ];

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-brand-light text-brand-navy">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-brand-white border-r border-brand-charcoal/15 flex flex-col justify-between flex-shrink-0 z-30">
        <div>
          {/* Logo Brand Header */}
          <div className="h-20 px-6 flex items-center justify-between border-b border-brand-charcoal/10">
            <Link to="/" className="flex items-center space-x-2.5">
              <span className="font-display text-2xl tracking-wider text-brand-navy">WrapAI</span>
              <span className="text-[9px] font-mono uppercase bg-brand-navy text-brand-white px-1.5 py-0.5">
                WORKSPACE
              </span>
            </Link>
          </div>

          {/* Primary Action Button */}
          <div className="p-4 border-b border-brand-charcoal/10">
            <Link to="/upload">
              <Button variant="primary" size="md" className="w-full" icon={UploadCloud}>
                Upload Content
              </Button>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all duration-200 border',
                      isActive
                        ? 'bg-brand-navy text-brand-white border-brand-navy shadow-sm'
                        : 'bg-transparent text-brand-charcoal border-transparent hover:bg-brand-sage/20 hover:text-brand-navy'
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

        {/* User Account / Role Switcher Widget */}
        <div className="p-4 border-t border-brand-charcoal/15 bg-brand-light/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2.5">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={user?.fullName}
                className="w-8 h-8 rounded-none border border-brand-navy object-cover"
              />
              <div className="truncate">
                <p className="text-xs font-bold text-brand-navy truncate">{user?.fullName || 'User'}</p>
                <p className="text-[10px] text-brand-taupe font-mono truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Quick User/Admin Role Toggle for easy Phase 1 evaluation */}
          <div className="flex items-center justify-between pt-2 border-t border-brand-charcoal/10">
            <button
              onClick={() => dispatch(toggleRole())}
              className="flex items-center text-[10px] font-mono text-brand-charcoal hover:text-brand-navy"
              title="Switch between User & Admin role demo states"
            >
              <Shield className="w-3 h-3 mr-1 text-brand-navy" />
              Role: <span className="font-bold ml-1">{role}</span>
            </button>
            <button
              onClick={handleLogout}
              className="text-brand-taupe hover:text-red-700 p-1"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

          {role === 'ADMIN' && (
            <Link to="/admin" className="block mt-2">
              <Button variant="outline" size="sm" className="w-full text-[10px] py-1">
                Go to Admin Dashboard
              </Button>
            </Link>
          )}
        </div>
      </aside>

      {/* Main Workspace Canvas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 bg-brand-white border-b border-brand-charcoal/15 px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-taupe">WrapAI Platform</span>
            <span className="text-brand-taupe">/</span>
            <span className="text-xs font-bold uppercase tracking-widest text-brand-navy">User Workspace</span>
          </div>
          <div className="flex items-center space-x-3">
            <Link to="/upload">
              <Button variant="secondary" size="sm" icon={Sparkles}>
                Quick Ingest
              </Button>
            </Link>
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
