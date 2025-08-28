// Session synchronization utilities for cross-tab and real-time updates

export interface RoleChangeNotification {
  userId: string
  oldRole: string
  newRole: string
  timestamp: number
}

export function notifyRoleChange(notification: RoleChangeNotification) {
  if (typeof window === 'undefined') return

  // Store in localStorage for persistence
  localStorage.setItem('roleChangeNotification', JSON.stringify(notification))
  localStorage.setItem('roleChangeTimestamp', notification.timestamp.toString())

  // Broadcast to all tabs
  window.postMessage({ 
    type: 'ROLE_CHANGED', 
    payload: notification 
  }, window.location.origin)

  // Use BroadcastChannel for modern browsers
  try {
    const channel = new BroadcastChannel('user-session')
    channel.postMessage({ 
      type: 'ROLE_CHANGED', 
      payload: notification 
    })
    channel.close()
  } catch (error) {
    console.warn('BroadcastChannel not available:', error)
  }
}

export function setupRoleChangeListener(userId: string, onRoleChange: (notification: RoleChangeNotification) => void) {
  if (typeof window === 'undefined') return () => {}

  // Check for existing notifications on mount
  const checkExistingNotification = () => {
    const stored = localStorage.getItem('roleChangeNotification')
    if (stored) {
      try {
        const notification: RoleChangeNotification = JSON.parse(stored)
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000)
        
        // If notification is for this user and less than 5 minutes old
        if (notification.userId === userId && notification.timestamp > fiveMinutesAgo) {
          onRoleChange(notification)
          // Clear the notification after processing
          localStorage.removeItem('roleChangeNotification')
          localStorage.removeItem('roleChangeTimestamp')
        }
      } catch (error) {
        console.error('Failed to parse role change notification:', error)
      }
    }
  }

  // Storage event listener for cross-tab updates
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'roleChangeNotification' && e.newValue) {
      try {
        const notification: RoleChangeNotification = JSON.parse(e.newValue)
        if (notification.userId === userId) {
          onRoleChange(notification)
        }
      } catch (error) {
        console.error('Failed to parse storage role change:', error)
      }
    }
  }

  // PostMessage listener for same-tab updates
  const handleMessage = (event: MessageEvent) => {
    if (event.data?.type === 'ROLE_CHANGED' && event.data?.payload) {
      const notification = event.data.payload as RoleChangeNotification
      if (notification.userId === userId) {
        onRoleChange(notification)
      }
    }
  }

  // BroadcastChannel listener
  let broadcastChannel: BroadcastChannel | null = null
  const handleBroadcast = (event: MessageEvent) => {
    if (event.data?.type === 'ROLE_CHANGED' && event.data?.payload) {
      const notification = event.data.payload as RoleChangeNotification
      if (notification.userId === userId) {
        onRoleChange(notification)
      }
    }
  }

  // Set up listeners
  checkExistingNotification()
  window.addEventListener('storage', handleStorageChange)
  window.addEventListener('message', handleMessage)

  try {
    broadcastChannel = new BroadcastChannel('user-session')
    broadcastChannel.addEventListener('message', handleBroadcast)
  } catch (error) {
    console.warn('BroadcastChannel not available:', error)
  }

  // Cleanup function
  return () => {
    window.removeEventListener('storage', handleStorageChange)
    window.removeEventListener('message', handleMessage)
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcast)
      broadcastChannel.close()
    }
  }
}