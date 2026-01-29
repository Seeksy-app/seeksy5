import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'urgent';
  category?: string;
  link?: string;
  read: boolean;
  created_at: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  // Fetch notifications
  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    console.log('🔔 Fetching notifications for user:', user?.id);
    if (!user) return;

    const result = await (supabase as any)
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (result.error) {
      console.error('❌ Error fetching notifications:', result.error);
      return;
    }

    const data = result.data as any[];
    console.log('✅ Fetched notifications:', data?.length || 0, data);
    setNotifications((data || []) as Notification[]);
    setUnreadCount(data?.filter((n: any) => !n.read && !n.is_read).length || 0);
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    const result = await (supabase as any)
      .from('notifications')
      .update({ read: true, is_read: true })
      .eq('id', notificationId);

    if (result.error) {
      console.error('Error marking notification as read:', result.error);
      return;
    }

    // Update local state
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Mark all as read
  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const result = await (supabase as any)
      .from('notifications')
      .update({ read: true, is_read: true })
      .eq('user_id', user.id);

    if (result.error) {
      console.error('Error marking all as read:', result.error);
      return;
    }

    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    const result = await (supabase as any)
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (result.error) {
      console.error('Error deleting notification:', result.error);
      return;
    }

    const wasUnread = notifications.find(n => n.id === notificationId)?.read === false;
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    if (wasUnread) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  // Request browser notification permission
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.log('Browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  };

  // Show browser notification
  const showBrowserNotification = (notification: Notification) => {
    if (Notification.permission === 'granted') {
      const n = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
      });

      n.onclick = () => {
        window.focus();
        if (notification.link) {
          window.location.href = notification.link;
        }
        markAsRead(notification.id);
      };
    }
  };

  // Subscribe to real-time notifications
  useEffect(() => {
    fetchNotifications();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          fetchNotifications();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Set up realtime subscription
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('🔄 Setting up realtime subscription for user:', user?.id);
      if (!user) return;
      
      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('🆕 New notification received via realtime:', payload.new);
            const newNotification = payload.new as Notification;
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Show browser notification for urgent alerts
            if (newNotification.type === 'urgent') {
              showBrowserNotification(newNotification);
              
              // Also show toast
              toast({
                title: newNotification.title,
                description: newNotification.message,
                variant: 'destructive',
              });
            }
          }
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    };

    setupRealtimeSubscription();
  }, [toast]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    requestNotificationPermission,
    refetch: fetchNotifications,
  };
};
