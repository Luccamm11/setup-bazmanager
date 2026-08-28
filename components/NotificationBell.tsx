import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, X, Target, ClipboardCheck, FileCheck2, Trophy, Award, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AppNotification, NotificationType } from '../types';

interface NotificationBellProps {
  notifications: AppNotification[];
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onNotificationClick: (notification: AppNotification) => void;
}

const typeConfig: Record<NotificationType, { icon: React.ReactNode; color: string; bg: string }> = {
  new_mission: { icon: <Target size={14} />, color: 'text-accent-primary', bg: 'bg-accent-primary/10' },
  '5w2h_submitted': { icon: <ClipboardCheck size={14} />, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  '5w2h_reviewed': { icon: <FileCheck2 size={14} />, color: 'text-accent-green', bg: 'bg-accent-green/10' },
  mission_completed: { icon: <Trophy size={14} />, color: 'text-accent-tertiary', bg: 'bg-accent-tertiary/10' },
  evaluation_pending: { icon: <Sparkles size={14} />, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  activity_evaluated: { icon: <Award size={14} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
};

const timeAgo = (isoDate: string): string => {
  const seconds = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (seconds < 60) return 'agora';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
};

const NotificationBell: React.FC<NotificationBellProps> = ({
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  onClearAll,
  onNotificationClick,
}) => {
  const { t } = useTranslation(['common']);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleNotificationClick = (notif: AppNotification) => {
    if (!notif.read) onMarkRead(notif.id);
    onNotificationClick(notif);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1 sm:p-2 rounded-lg text-text-secondary hover:text-white transition-all"
        title={t('common:notifications.title', 'Notificações')}
      >
        <Bell className="w-4 h-4 sm:w-5 sm:h-5 opacity-60 group-hover:opacity-100" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center text-[9px] font-black bg-accent-red text-white rounded-full px-1 border border-red-900/50 shadow-lg animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 max-h-[70vh] bg-primary/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <h3 className="text-sm font-black text-white tracking-wide uppercase">
              {t('common:notifications.title', 'Notificações')}
            </h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllRead}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-accent-green/80 hover:text-accent-green hover:bg-accent-green/10 rounded-md transition-all"
                  title={t('common:notifications.mark_all_read', 'Marcar todas como lidas')}
                >
                  <Check size={12} />
                  <span className="hidden sm:inline">{t('common:notifications.mark_all_read', 'Marcar todas')}</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={onClearAll}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-accent-red/60 hover:text-accent-red hover:bg-accent-red/10 rounded-md transition-all"
                  title={t('common:notifications.clear_all', 'Limpar tudo')}
                >
                  <Trash2 size={12} />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-text-muted hover:text-white rounded-md hover:bg-white/5 transition-all ml-1"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto custom-scrollbar flex-1">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <Bell className="w-10 h-10 text-text-muted/30 mb-3" />
                <p className="text-sm text-text-muted font-medium">
                  {t('common:notifications.empty', 'Nenhuma notificação')}
                </p>
              </div>
            ) : (
              notifications.map(notif => {
                const config = typeConfig[notif.type];
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-white/[0.03] cursor-pointer transition-all hover:bg-white/[0.03] ${
                      !notif.read ? 'bg-accent-primary/[0.03]' : ''
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${config.bg} ${config.color} shrink-0 mt-0.5`}>
                      {config.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs font-bold leading-tight ${!notif.read ? 'text-white' : 'text-text-secondary'}`}>
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-accent-primary shrink-0 mt-1"></span>
                        )}
                      </div>
                      <p className="text-[11px] text-text-muted mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-[10px] text-text-muted/60 mt-1 font-mono">{timeAgo(notif.createdAt)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
