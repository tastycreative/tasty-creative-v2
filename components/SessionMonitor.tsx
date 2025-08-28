"use client"

import { useSession } from "next-auth/react"
import { useEffect } from "react"
import { setupRoleChangeListener, type RoleChangeNotification } from "@/lib/session-sync"
import { toast } from "sonner"

export function SessionMonitor() {
  const { data: session, update } = useSession()

  useEffect(() => {
    if (!session?.user?.id) return

    const handleRoleChange = async (notification: RoleChangeNotification) => {
      console.log('Role change notification received:', notification)
      
      try {
        // Show a toast notification
        toast.success(
          `Your role has been updated to ${notification.newRole}!`, 
          {
            description: "Your session is being refreshed to apply the changes.",
            duration: 4000,
          }
        )

        // Wait a moment for the toast to show
        setTimeout(async () => {
          try {
            // Update the session to get fresh data from the database
            await update()
            console.log('Session refreshed after role change')
            
            // Show confirmation
            setTimeout(() => {
              toast.success(
                "Session updated successfully!", 
                {
                  description: "You can now access your new permissions.",
                  duration: 3000,
                }
              )
            }, 500)
          } catch (error) {
            console.error('Failed to refresh session:', error)
            toast.error(
              "Failed to refresh session", 
              {
                description: "Please refresh the page to see your new role.",
                duration: 5000,
              }
            )
          }
        }, 1000)
      } catch (error) {
        console.error('Error handling role change:', error)
      }
    }

    const cleanup = setupRoleChangeListener(session.user.id, handleRoleChange)
    
    return cleanup
  }, [session?.user?.id, update])

  // This component doesn't render anything visible
  return null
}