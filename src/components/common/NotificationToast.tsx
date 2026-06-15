// Toast 通知组件
import { useEffect } from 'react';
import { useUIStore } from '../../stores/useUIStore';
import './NotificationToast.css';

export default function NotificationToast() {
  const notifications = useUIStore(s => s.notifications);
  const removeNotification = useUIStore(s => s.removeNotification);

  // 错误通知自动超时
  useEffect(() => {
    const timers = notifications
      .filter(n => n.type === 'error')
      .map(n => setTimeout(() => removeNotification(n.id), 8000));

    return () => timers.forEach(clearTimeout);
  }, [notifications, removeNotification]);

  if (notifications.length === 0) return null;

  return (
    <div className="notification-area">
      {notifications.map(notif => (
        <div key={notif.id} className={`notification-item ${notif.type}`}>
          <span className="notification-icon">
            {notif.type === 'error' ? '✕' : notif.type === 'warning' ? '⚠' : 'ℹ'}
          </span>
          <span className="notification-message">{notif.message}</span>
          <button
            className="notification-close"
            onClick={() => removeNotification(notif.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
