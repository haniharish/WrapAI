import React, { useState, useEffect } from 'react';
import { collaborationService } from '../../services/collaborationService.js';
import { Bell, Check } from 'lucide-react';
import { formatDate } from '../../utils/formatters.js';

export function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadNotifications();
    const timer = setInterval(loadNotifications, 30000);
    return () => clearInterval(timer);
  }, []);

  async function loadNotifications() {
    try {
      const res = await collaborationService.getNotifications({ limit: 10 });
      setNotifications(res.data?.notifications || []);
      setUnreadCount(res.data?.unreadCount || 0);
    } catch {
      // Ignore background error
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
        className="relative p-2 text-[#141414] hover:text-[#1351AA] transition-colors cursor-pointer"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-[#1351AA] text-[#E3E2DE] font-mono text-[9px] flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-[#141414] z-50 divide-y divide-[#C7C7C7] text-xs">
          <div className="p-3 flex items-center justify-between bg-[#E3E2DE]">
            <span className="font-mono uppercase tracking-wider font-bold text-xs text-[#141414]">
              NOTIFICATIONS ({unreadCount})
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] font-mono text-[#1351AA] hover:underline flex items-center space-x-1 uppercase font-bold cursor-pointer"
              >
                <Check className="w-3 h-3" />
                <span>MARK ALL READ</span>
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-[#C7C7C7]">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-[#7A7A7A] text-xs font-mono">
                NO NOTIFICATIONS RIGHT NOW
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id || n._id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3 cursor-pointer hover:bg-[#E3E2DE]/50 transition-colors ${
                    !n.read ? 'bg-[#1351AA]/5 font-bold' : 'bg-white text-[#444343]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold uppercase text-[#141414] text-[11px] truncate">{n.title}</span>
                    <span className="text-[9px] font-mono text-[#7A7A7A] shrink-0">
                      {formatDate(n.createdAt)}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#444343] line-clamp-2 leading-tight">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
