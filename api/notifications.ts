import type { VercelRequest, VercelResponse } from '@vercel/node';
import redis from './_lib/redis.js';
import type { AppNotification } from '../types';

const REDIS_PREFIX = 'levelup_notifications_';
const MAX_NOTIFICATIONS = 50;

const keyFor = (username: string) => `${REDIS_PREFIX}${username}`;

const loadNotifications = async (username: string): Promise<AppNotification[]> => {
  const raw = await redis.get(keyFor(username));
  return raw ? JSON.parse(raw) : [];
};

const saveNotifications = async (username: string, notifications: AppNotification[]) => {
  await redis.set(keyFor(username), JSON.stringify(notifications));
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method } = req;

  // GET /api/notifications?username=Lucca
  if (method === 'GET') {
    const { username } = req.query as Record<string, string>;
    if (!username) return res.status(400).json({ error: 'username required' });

    try {
      const notifications = await loadNotifications(username);
      const unreadCount = notifications.filter(n => !n.read).length;
      return res.status(200).json({ success: true, notifications, unreadCount });
    } catch (err: any) {
      console.error('notifications GET error:', err.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // POST /api/notifications — create one or more notifications
  if (method === 'POST') {
    const { notifications } = req.body as { notifications: Omit<AppNotification, 'id' | 'read' | 'createdAt'>[] };
    if (!notifications || !Array.isArray(notifications) || notifications.length === 0) {
      return res.status(400).json({ error: 'notifications array required' });
    }

    try {
      const grouped: Record<string, typeof notifications> = {};
      for (const n of notifications) {
        if (!grouped[n.recipientUsername]) grouped[n.recipientUsername] = [];
        grouped[n.recipientUsername].push(n);
      }

      const created: AppNotification[] = [];

      for (const [recipient, items] of Object.entries(grouped)) {
        const existing = await loadNotifications(recipient);
        const newItems: AppNotification[] = items.map(n => ({
          ...n,
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          read: false,
          createdAt: new Date().toISOString(),
        }));
        const merged = [...newItems, ...existing].slice(0, MAX_NOTIFICATIONS);
        await saveNotifications(recipient, merged);
        created.push(...newItems);
      }

      return res.status(201).json({ success: true, notifications: created });
    } catch (err: any) {
      console.error('notifications POST error:', err.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // PUT /api/notifications — mark as read
  if (method === 'PUT') {
    const { username, notificationId, markAllRead } = req.body;
    if (!username) return res.status(400).json({ error: 'username required' });

    try {
      const notifications = await loadNotifications(username);

      if (markAllRead) {
        notifications.forEach(n => { n.read = true; });
      } else if (notificationId) {
        const idx = notifications.findIndex(n => n.id === notificationId);
        if (idx !== -1) notifications[idx].read = true;
      }

      await saveNotifications(username, notifications);
      const unreadCount = notifications.filter(n => !n.read).length;
      return res.status(200).json({ success: true, notifications, unreadCount });
    } catch (err: any) {
      console.error('notifications PUT error:', err.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // DELETE /api/notifications — delete one or all
  if (method === 'DELETE') {
    const { username, notificationId, clearAll } = req.body;
    if (!username) return res.status(400).json({ error: 'username required' });

    try {
      let notifications = await loadNotifications(username);

      if (clearAll) {
        notifications = [];
      } else if (notificationId) {
        notifications = notifications.filter(n => n.id !== notificationId);
      }

      await saveNotifications(username, notifications);
      return res.status(200).json({ success: true });
    } catch (err: any) {
      console.error('notifications DELETE error:', err.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
