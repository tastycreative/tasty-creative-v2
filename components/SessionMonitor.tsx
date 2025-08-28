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

        // Wait a moment for the toast to show
        setTimeout(async () => {
          try {
            console.log('Attempting to force refresh session...')
            
            // First try our force refresh endpoint
            const response = await fetch('/api/auth/force-refresh', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            })
            
            if (response.ok) {
              const data = await response.json()
              console.log('Force refresh response:', data)
              
              if (data.roleChanged) {
                // Role has changed, we need to force a complete session refresh
                console.log('Role change detected, forcing session refresh...')
                
                // Try to update the session first
                await update()
                
                // Wait a bit then check if the session actually updated
                setTimeout(async () => {
                  const currentSession = await fetch('/api/auth/session').then(r => r.json())
                  console.log('Current session after update:', currentSession?.user?.role)
                  
                  if (currentSession?.user?.role === notification.oldRole) {
                    // Session didn't update, we need to force a sign out and back in
                    console.log('Session update failed, forcing re-authentication...')
                    toast.info(
                      "Refreshing your session...", 
                      {
                        description: "Please wait while we update your permissions.",
                        duration: 3000,
                      }
                    )
                    
                    // Store current page to redirect back
                    const currentPath = window.location.pathname
                    localStorage.setItem('redirectAfterAuth', currentPath)
                    
                    // Force re-authentication
                    await signOut({ redirect: false })
                    await signIn(undefined, { callbackUrl: currentPath })
                  } else {
                    // Session updated successfully
                    toast.success(
                      "Session updated successfully!", 
                      {
                        description: "You can now access your new permissions.",
                        duration: 3000,
                      }
                    )
                    // Force a page refresh to ensure all components see the new role
                    setTimeout(() => {
                      window.location.reload()
                    }, 1000)
                  }
                }, 2000)
              } else {
                // No role change detected, just update normally
                await update()
                toast.success(
                  "Session updated successfully!", 
                  {
                    description: "You can now access your new permissions.",
                    duration: 3000,
                  }
                )
              }
            } else {
              throw new Error('Force refresh failed')
            }
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
    
    // Also set up a periodic check for role changes (every 30 seconds)
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
    
    return () => {
      cleanup()
      clearInterval(intervalCheck)
    }
  }, [session?.user?.id, session?.user?.role, update, router])

  // This component doesn't render anything visible
  return null
}