import { useState } from 'react'
import { toast } from 'sonner'

interface MarkAsFinalOptions {
  teamId: string
  teamName: string
  session: any
  onSuccess?: () => void
}

export function useMarkAsFinal({ teamId, teamName, session, onSuccess }: MarkAsFinalOptions) {
  const [isLoading, setIsLoading] = useState(false)

  const markAsFinal = async (task: any) => {
    if (!task?.ModularWorkflow) {
      toast.error('No workflow data found')
      return
    }

    setIsLoading(true)

    try {
      // Step 1: Update isFinal = true in ModularWorkflow
      const workflowResponse = await fetch(`/api/modular-workflows/${task.ModularWorkflow.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFinal: true }),
      })

      if (!workflowResponse.ok) {
        throw new Error('Failed to mark workflow as final')
      }

      // Step 2: Sync content to GalleryMasterList (Caption Bank)
      const galleryResponse = await fetch('/api/gallery-db/add-from-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId: task.ModularWorkflow.id,
          taskId: task.id,
        }),
      })

      if (!galleryResponse.ok) {
        const galleryError = await galleryResponse.json()

        // ROLLBACK: Revert isFinal back to false
        await fetch(`/api/modular-workflows/${task.ModularWorkflow.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isFinal: false }),
        })

        throw new Error(galleryError.error || 'Failed to sync to gallery')
      }

      // Step 3: Change task status to CUSTOM_POSTED_1761147430212 (Posted)
      const statusResponse = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: task.id,
          status: 'CUSTOM_POSTED_1761147430212',
        }),
      })

      if (!statusResponse.ok) {
        // ROLLBACK: Revert isFinal back to false
        await fetch(`/api/modular-workflows/${task.ModularWorkflow.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isFinal: false }),
        })

        throw new Error('Failed to update task status')
      }

      // Step 4: Send team notification (don't fail if this errors)
      try {
        await fetch('/api/notifications/column-movement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId: task.id,
            taskTitle: task.title,
            taskDescription: task.description || '',
            assignedTo: task.assignedTo || 'Unassigned',
            priority: task.priority,
            oldColumn: 'Ready to Deploy',
            newColumn: 'Posted',
            teamId: teamId,
            teamName: teamName,
            movedBy: session?.user?.name || 'System',
            movedById: session?.user?.id || '',
            assignedMembers: [],
            notifyAllMembers: true,
          }),
        })
      } catch (notifError) {
        console.error('Failed to send notification (non-critical):', notifError)
      }

      // Success!
      toast.success('Content marked as final and added to gallery!')

      // Call onSuccess callback to refresh tasks
      if (onSuccess) {
        onSuccess()
      }

    } catch (error) {
      console.error('Error marking as final:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to mark as final')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    markAsFinal,
    isLoading,
  }
}
