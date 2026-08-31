// client/scripts/build_part5_layouts_and_routes.js
import fs from 'fs';
import path from 'path';

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function write(file, content) {
  const p = path.resolve('c:/Users/Lenovo/Desktop/wrapAI/client', file);
  ensureDir(p);
  fs.writeFileSync(p, content.trim() + '\n', 'utf8');
  console.log(`[OK] ${file}`);
}

// 1. src/layouts/PublicLayout.jsx
write('src/layouts/PublicLayout.jsx', `
import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toggleRole } from '../store/slices/authSlice.js';
import { Button } from '../components/ui/Button.jsx';
import { Sparkles, ArrowRight, Shield } from 'lucide-react';

export function PublicLayout() {
  const role = useSelector((state) => state.auth.role);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-brand-light text-brand-navy">
      {/* Public Header */}
      <header className="sticky top-0 z-40 bg-brand-light/90 backdrop-blur-md border-b border-brand-charcoal/15">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <span className="font-display text-3xl tracking-wider text-brand-navy">WrapAI</span>
            <span className="hidden sm:inline-block text-[10px] font-mono uppercase bg-brand-navy text-brand-white px-2 py-0.5 tracking-widest">
              INTELLIGENCE
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8 text-xs font-bold uppercase tracking-widest text-brand-charcoal">
            <a href="#features" className="hover:text-brand-navy transition-colors">Features</a>
            <a href="#pipeline" className="hover:text-brand-navy transition-colors">How It Works</a>
            <a href="#meeting-intel" className="hover:text-brand-navy transition-colors">Meeting Intel</a>
            <a href="#ask-ai" className="hover:text-brand-navy transition-colors">Ask Your Content</a>
          </nav>

          <div className="flex items-center space-x-4">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="primary" size="sm" icon={ArrowRight} iconPosition="right">
                Start Wrapping
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Public Footer */}
      <footer className="bg-brand-navy text-brand-white border-t border-brand-charcoal pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <span className="font-display text-4xl tracking-wider text-brand-white">WrapAI</span>
              <p className="mt-3 text-sm text-brand-sage max-w-sm">
                From Content to Clarity. The AI-powered meeting and multi-modal intelligence platform built for modern knowledge teams.
              </p>
              <p className="mt-4 text-xs font-mono text-brand-taupe">
                &copy; {new Date().getFullYear()} WrapAI Inc. All rights reserved.
              </p>
            </div>
            <div>
              <h4 className="font-display text-sm uppercase tracking-widest text-brand-white mb-4">Platform</h4>
              <ul className="space-y-2.5 text-xs text-brand-sage font-medium">
                <li><Link to="/dashboard" className="hover:text-brand-white">User Dashboard</Link></li>
                <li><Link to="/upload" className="hover:text-brand-white">Upload Media</Link></li>
                <li><Link to="/content" className="hover:text-brand-white">Content Library</Link></li>
                <li><Link to="/admin" className="hover:text-brand-white">Admin Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display text-sm uppercase tracking-widest text-brand-white mb-4">Supported Input</h4>
              <ul className="space-y-2.5 text-xs text-brand-sage font-medium">
                <li>Audio (MP3, WAV, M4A)</li>
                <li>Video (MP4, MOV, MKV)</li>
                <li>Documents & Text (TXT)</li>
                <li>Remote Media Links</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
`);

// 2. src/layouts/UserLayout.jsx
write('src/layouts/UserLayout.jsx', `
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
`);

// 3. src/layouts/AdminLayout.jsx
write('src/layouts/AdminLayout.jsx', `
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
`);

// 4. src/routes/ProtectedRoute.jsx
write('src/routes/ProtectedRoute.jsx', `
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

export function ProtectedRoute({ allowedRoles = ['USER', 'ADMIN'] }) {
  const { isAuthenticated, role } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
`);

// 5. src/routes/AppRoutes.jsx
write('src/routes/AppRoutes.jsx', `
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from '../layouts/PublicLayout.jsx';
import { UserLayout } from '../layouts/UserLayout.jsx';
import { AdminLayout } from '../layouts/AdminLayout.jsx';
import { ProtectedRoute } from './ProtectedRoute.jsx';

// Public Pages
import { LandingPage } from '../pages/public/LandingPage.jsx';
import { LoginPage } from '../pages/auth/LoginPage.jsx';
import { RegisterPage } from '../pages/auth/RegisterPage.jsx';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage.jsx';
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage.jsx';

// User Dashboard Pages
import { UserDashboardPage } from '../pages/user/UserDashboardPage.jsx';
import { UploadPage } from '../pages/user/UploadPage.jsx';
import { ProcessingPage } from '../pages/user/ProcessingPage.jsx';
import { MyContentPage } from '../pages/user/MyContentPage.jsx';
import { ReportsListPage } from '../pages/user/ReportsListPage.jsx';
import { SettingsPage } from '../pages/user/SettingsPage.jsx';

// Workspace & Intelligence Tabs
import { ContentWorkspaceLayout } from '../pages/user/workspace/ContentWorkspaceLayout.jsx';
import { TranscriptTab } from '../pages/user/workspace/tabs/TranscriptTab.jsx';
import { SummaryTab } from '../pages/user/workspace/tabs/SummaryTab.jsx';
import { TopicsTab } from '../pages/user/workspace/tabs/TopicsTab.jsx';
import { KeyPointsTab } from '../pages/user/workspace/tabs/KeyPointsTab.jsx';
import { HighlightsTab } from '../pages/user/workspace/tabs/HighlightsTab.jsx';
import { DecisionsTab } from '../pages/user/workspace/tabs/DecisionsTab.jsx';
import { ActionItemsTab } from '../pages/user/workspace/tabs/ActionItemsTab.jsx';
import { ReportTab } from '../pages/user/workspace/tabs/ReportTab.jsx';
import { AskAITab } from '../pages/user/workspace/tabs/AskAITab.jsx';

// Admin Dashboard Pages
import { AdminOverviewPage } from '../pages/admin/AdminOverviewPage.jsx';
import { AdminUsersPage } from '../pages/admin/AdminUsersPage.jsx';
import { AdminContentPage } from '../pages/admin/AdminContentPage.jsx';
import { AdminProcessingPage } from '../pages/admin/AdminProcessingPage.jsx';
import { AdminAnalyticsPage } from '../pages/admin/AdminAnalyticsPage.jsx';
import { AdminSystemPage } from '../pages/admin/AdminSystemPage.jsx';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* User Dashboard Routes (Protected) */}
      <Route element={<ProtectedRoute allowedRoles={['USER', 'ADMIN']} />}>
        <Route element={<UserLayout />}>
          <Route path="/dashboard" element={<UserDashboardPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/processing/:id" element={<ProcessingPage />} />
          <Route path="/content" element={<MyContentPage />} />
          <Route path="/reports" element={<ReportsListPage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Content Workspace Tab Routes */}
          <Route path="/content/:id" element={<ContentWorkspaceLayout />}>
            <Route index element={<Navigate to="transcript" replace />} />
            <Route path="transcript" element={<TranscriptTab />} />
            <Route path="summary" element={<SummaryTab />} />
            <Route path="topics" element={<TopicsTab />} />
            <Route path="key-points" element={<KeyPointsTab />} />
            <Route path="highlights" element={<HighlightsTab />} />
            <Route path="decisions" element={<DecisionsTab />} />
            <Route path="actions" element={<ActionItemsTab />} />
            <Route path="report" element={<ReportTab />} />
            <Route path="chat" element={<AskAITab />} />
          </Route>
        </Route>
      </Route>

      {/* Admin Dashboard Routes (Protected, ADMIN role only) */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminOverviewPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/content" element={<AdminContentPage />} />
          <Route path="/admin/processing" element={<AdminProcessingPage />} />
          <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
          <Route path="/admin/system" element={<AdminSystemPage />} />
        </Route>
      </Route>

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
`);

// 6. src/App.jsx
write('src/App.jsx', `
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store.js';
import { AppRoutes } from './routes/AppRoutes.jsx';

export function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </Provider>
  );
}
export default App;
`);

// 7. src/main.jsx
write('src/main.jsx', `
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`);

console.log('Part 5 layouts and routes generated successfully.');
