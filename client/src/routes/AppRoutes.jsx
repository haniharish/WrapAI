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
