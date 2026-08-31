import React, { useState, useEffect } from 'react';
import { collaborationService } from '../../services/collaborationService.js';
import { Bell, Check, Clock, ExternalLink } from 'lucide-react';
import { formatDate } from '../../utils/formatters.js';

export function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadNotifications();
    const timer = setInterval(loadNotifications, 30000); // Polling every 30s
    return () => clearInterval(timer);
  }, []);

  async function loadNotifications() {
    try {
      const res = await collaborationService.getNotifications({ limit: 10 });
      setNotifications(res.data?.notifications || []);
      setUnreadCount(res.data?.unreadCount || 0);
    } catch {
      // Ignore background errors
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await collaborationService.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn('Failed to mark notifications read:', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      await collaborationService.markNotificationRead(notif.id || notif._id);
      setNotifications((prev) =>
        prev.map((n) => ((n.id || n._id) === (notif.id || notif._id) ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-brand-charcoal hover:text-brand-navy transition-colors"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white font-mono text-[9px] flex items-center justify-center rounded-full font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-brand-white border border-brand-charcoal/20 shadow-2xl z-50 divide-y divide-brand-charcoal/10 text-xs">
          <div className="p-3 flex items-center justify-between bg-brand-light/50">
            <span className="font-display uppercase tracking-wider text-xs text-brand-navy">
              Notifications ({unreadCount})
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] font-mono text-brand-navy hover:underline flex items-center space-x-1"
              >
                <Check className="w-3 h-3" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-brand-charcoal/5">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-brand-taupe text-xs">
                No notifications right now
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id || n._id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3 cursor-pointer hover:bg-brand-light transition-colors ${
                    !n.read ? 'bg-brand-sage/10 font-medium' : 'bg-transparent text-brand-charcoal'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-brand-navy text-[11px] truncate">{n.title}</span>
                    <span className="text-[9px] font-mono text-brand-taupe flex-shrink-0">
                      {formatDate(n.createdAt)}
                    </span>
                  </div>
                  <p className="text-[11px] text-brand-charcoal line-clamp-2 leading-tight">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
