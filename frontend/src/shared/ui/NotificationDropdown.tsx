import { useEffect, useState, useRef } from "react"
import {
  getNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
} from "@/core/api/grievanceApi"
import type { NotificationItem } from "@/shared/types/grievance"

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let isMounted = true

    const fetchNotifications = () => {
      getNotificationsApi()
        .then((res) => {
          if (isMounted && res.success) {
            setNotifications(res.data || [])
            setUnreadCount(res.unreadCount || 0)
          }
        })
        .catch(() => {
          // Silent polling error catch
        })
    }

    fetchNotifications()
    const intervalId = setInterval(fetchNotifications, 25000)

    return () => {
      isMounted = false
      clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleMarkRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const res = await markNotificationReadApi(id)
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch {
      // Silent error
    }
  }

  const handleMarkAllRead = async () => {
    try {
      const res = await markAllNotificationsReadApi()
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
        setUnreadCount(0)
      }
    } catch {
      // Silent error
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-muted text-foreground transition-colors focus:outline-none"
        title="Notifications"
        aria-label="View Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.75}
          stroke="currentColor"
          className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 px-1.5 py-0.5 text-[10px] font-extrabold rounded-full bg-rose-600 text-white leading-none shadow-sm animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-card border rounded-xl shadow-xl z-50 overflow-hidden text-foreground">
          <div className="p-3 border-b bg-muted/40 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-primary/10 text-primary">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-primary hover:underline font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y text-xs">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground font-medium">
                No notifications yet.
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 space-y-1.5 transition-colors ${
                    item.is_read ? "bg-card opacity-75" : "bg-muted/20 font-medium"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-xs font-bold ${item.is_read ? "text-muted-foreground" : "text-primary"}`}>
                      {item.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap">
                      {new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">{item.message}</p>

                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    {item.grievance?.grievance_number && (
                      <span className="font-mono text-primary font-semibold">
                        Ref: {item.grievance.grievance_number}
                      </span>
                    )}

                    {!item.is_read && (
                      <button
                        onClick={(e) => handleMarkRead(item.id, e)}
                        className="text-xs text-primary font-semibold hover:underline ml-auto"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
