'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead, Notification } from '@/app/dashboard/shared/notification-actions';
import Link from 'next/link';
import NotificationItem from './NotificationItem';

interface NotificationBellProps {
  collapsed?: boolean;
}

export default function NotificationBell({ collapsed }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState<Notification | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Supabase istemcisi
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // İlk yüklemede verileri çek
  useEffect(() => {
    const fetchNotifications = async () => {
      const { data } = await getUserNotifications();
      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    };
    fetchNotifications();
  }, []);

  // Realtime Aboneliği
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const fetchUserAndSubscribe = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channelName = `realtime_notifications_${user.id}_${Date.now()}`;
      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newNotif = payload.new as Notification;
            setNotifications(prev => [newNotif, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            // Anlık Toast göster
            setToast(newNotif);
            setTimeout(() => setToast(null), 5000);
          }
        )
        .subscribe();
    };

    fetchUserAndSubscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [supabase]);

  // Popover dışına tıklanınca kapat
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Tekil Okuma İşlemi
  const handleMarkAsRead = async (id: string) => {
    const { success } = await markNotificationAsRead(id);
    if (success) {
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  // Tümünü Okuma İşlemi
  const handleMarkAllAsRead = async () => {
    const { success } = await markAllNotificationsAsRead();
    if (success) {
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    }
  };

  // Zaman formatlayıcı
  const timeAgo = (dateStr: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'Az önce';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} dk önce`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} saat önce`;
    return `${Math.floor(hours / 24)} gün önce`;
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Zil İkonu */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative flex items-center justify-center p-2 rounded-xl
          transition-all duration-200 ease-in-out
          hover:bg-white/10 text-gray-400 hover:text-white
          ${isOpen ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' : ''}
          ${collapsed ? 'w-10 h-10 mx-auto' : 'w-full gap-3 px-3 justify-start'}
        `}
      >
        <div className="relative flex items-center justify-center">
          <Bell size={collapsed ? 20 : 18} className={unreadCount > 0 ? 'animate-pulse text-purple-400' : ''} />
          {collapsed && unreadCount > 0 && (
            <span className={`
              absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-[#1a1f36]
            `}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        {!collapsed && <span className="text-sm font-medium">Bildirimler</span>}
        {!collapsed && unreadCount > 0 && (
          <span className="ml-auto bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full text-xs font-bold">
            {unreadCount} Yeni
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div 
          style={{ zIndex: 99999 }}
          className={`
          absolute 
          ${collapsed ? 'left-14 top-0 w-96' : 'left-[105%] -top-2 w-96'}
          bg-[#1a1f36] border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden backdrop-blur-xl
        `}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.02]">
            <h3 className="font-semibold text-white text-sm">Bildirimler</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
              >
                <Check size={12} /> Tümünü Okundu İşaretle
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <Bell size={24} className="mb-2 opacity-20" />
                <p className="text-sm">Henüz bildiriminiz yok.</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((notif) => (
                  <NotificationItem 
                    key={notif.id}
                    notif={notif}
                    onRead={handleMarkAsRead}
                    timeAgo={timeAgo}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Anlık Toast (Ekranın sağ altında sabit) */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] w-80 bg-[#1a1f36] border border-purple-500/30 rounded-xl shadow-[0_10px_40px_rgba(168,85,247,0.2)] p-4 transform transition-all animate-in slide-in-from-bottom-5">
          <div className="flex items-start justify-between">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 text-purple-400">
                <Bell size={16} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-0.5">{toast.title}</h4>
                <p className="text-xs text-gray-300">{toast.content}</p>
              </div>
            </div>
            <button onClick={() => setToast(null)} className="text-gray-500 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
