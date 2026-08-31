import React, { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice.js';
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  Settings,
  UploadCloud,
  LogOut,
  Users,
  Search
} from 'lucide-react';
import { clsx } from 'clsx';
import { PosterButton } from '../components/ui/PosterButton.jsx';
import { ToastContainer } from '../components/ui/Toast.jsx';
import { WorkspaceSwitcher } from '../components/workspace/WorkspaceSwitcher.jsx';
import { NotificationBell } from '../components/notifications/NotificationBell.jsx';
import { GlobalSearchModal } from '../components/search/GlobalSearchModal.jsx';

export function UserLayout() {
  const user = useSelector((state) => state.auth.user);
  const role = useSelector((state) => state.auth.role);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const navItems = [
    { to: '/dashboard', label: 'OVERVIEW', icon: LayoutDashboard },
    { to: '/content', label: 'CONTENT', icon: FolderOpen },
    { to: '/reports', label: 'REPORTS', icon: FileText },
    { to: '/workspace/settings', label: 'WORKSPACE', icon: Users },
    { to: '/settings', label: 'SETTINGS', icon: Settings }
  ];

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#E3E2DE] text-[#141414]">
      {/* Editorial Left Sidebar (Desktop) */}
      <aside className="w-full md:w-64 bg-[#E3E2DE] border-b md:border-b-0 md:border-r border-[#C7C7C7] flex flex-col justify-between flex-shrink-0 z-30">
        <div>
          {/* Logo Brand Header */}
          <div className="h-20 px-6 flex items-center justify-between border-b border-[#C7C7C7]">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-3.5 h-3.5 bg-[#141414]" />
              <span className="text-xl font-black tracking-tight text-[#141414] uppercase hover:text-[#1351AA] transition-colors">
                WRAPAI
              </span>
            </Link>
          </div>

          {/* Workspace Switcher */}
          <div className="p-3 border-b border-[#C7C7C7]">
            <WorkspaceSwitcher />
          </div>

          {/* Primary Action Button */}
          <div className="p-3 border-b border-[#C7C7C7]">
            <Link to="/upload" className="block">
              <PosterButton variant="primary" size="sm" className="w-full justify-center" icon={UploadCloud}>
                UPLOAD CONTENT
              </PosterButton>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center px-4 py-3 text-xs font-bold uppercase tracking-[0.15em] transition-colors duration-300 ease-linear border',
                      isActive
                        ? 'bg-[#141414] text-[#E3E2DE] border-[#141414]'
                        : 'bg-transparent text-[#141414] border-transparent hover:bg-white/60 hover:text-[#1351AA]'
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

        {/* User Account / Role Widget */}
        <div className="p-4 border-t border-[#C7C7C7] bg-white/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="truncate">
              <p className="text-xs font-bold uppercase tracking-wider text-[#141414] truncate">{user?.fullName || 'USER'}</p>
              <p className="text-[10px] text-[#7A7A7A] font-mono truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-[#7A7A7A] hover:text-[#9e1c1c] p-1.5 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {role === 'ADMIN' && (
            <Link to="/admin" className="block pt-1">
              <PosterButton variant="outline" size="sm" className="w-full text-[10px] py-1.5">
                ADMIN SYSTEM
              </PosterButton>
            </Link>
          )}
        </div>
      </aside>

      {/* Main Workspace Canvas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-20 bg-[#E3E2DE]/95 backdrop-blur-xs border-b border-[#C7C7C7] px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20">
          {/* Global Search Bar Trigger */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center space-x-3 px-4 py-2.5 bg-white/70 border border-[#C7C7C7] text-xs text-[#7A7A7A] hover:border-[#1351AA] hover:text-[#141414] transition-colors duration-300 font-mono cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-[#1351AA]" />
            <span>SEARCH WRAPAI (CTRL+K)...</span>
          </button>

          {/* Action Tools & Notifications */}
          <div className="flex items-center space-x-4">
            <NotificationBell />
            <Link to="/upload" className="hidden sm:block">
              <PosterButton variant="secondary" size="sm">
                + INGEST
              </PosterButton>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6 sm:p-8 lg:p-10 max-w-[1400px] w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Semantic Search Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      <ToastContainer />
    </div>
  );
}

export default UserLayout;
