"use client"

import { useSession, signOut, signIn } from "next-auth/react"
import { useEffect } from "react"
import { setupRoleChangeListener, type RoleChangeNotification } from "@/lib/session-sync"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function SessionMonitor() {
  const { data: session, update } = useSession()
  const router = useRouter()

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

        // Commented out force refresh logic - now handled by PermissionGoogle component
        // Wait a moment for the toast to show
        setTimeout(async () => {
          try {
            console.log('Role change detected, but skipping force refresh (handled by PermissionGoogle)')
            
            // Just try to update the session normally
            await update()
            
            toast.success(
              "Session updated successfully!", 
              {
                description: "You can now access your new permissions.",
                duration: 3000,
              }
            )
            
            // Optional: Force a page refresh to ensure all components see the new role
            // setTimeout(() => {
            //   window.location.reload()
            // }, 1000)
            
          } catch (error) {
            console.error('Failed to update session:', error)
            toast.error(
              "Session update failed", 
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
    
    // Periodic check for role changes disabled temporarily
    /*
    const intervalCheck = setInterval(async () => {
      try {
        const response = await fetch('/api/auth/force-refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.roleChanged) {
            console.log('Periodic check detected role change')
            handleRoleChange({
              userId: session.user.id,
              oldRole: session.user.role as string,
              newRole: data.user.role,
              timestamp: Date.now()
            })
          }
        }
      } catch (error) {
        console.error('Periodic role check failed:', error)
      }
    }, 30000) // Check every 30 seconds
    */
    
    return () => {
      cleanup()
      // clearInterval(intervalCheck)
    }
  }, [session?.user?.id, session?.user?.role, update, router])

  // This component doesn't render anything visible
  return null
}