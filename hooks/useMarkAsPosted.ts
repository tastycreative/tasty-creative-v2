import { useState } from 'react'
import { toast } from 'sonner'

interface MarkAsPostedOptions {
  teamId: string
  teamName: string
  session: any
  onSuccess?: () => void
}

export function useMarkAsPosted({ teamId, teamName, session, onSuccess }: MarkAsPostedOptions) {
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null)

  const markAsPosted = async (task: any) => {
    if (!task?.wallPostSubmission) {
      toast.error('No wall post submission found')
      return
    }

    setLoadingTaskId(task.id)

    // Create a progress toast
    let progressToastId: string | number | undefined

    try {
      // Step 1: Update all photos to POSTED status
      const photos = task.wallPostSubmission.photos || []
      const totalPhotos = photos.length

      // Show initial progress toast
      progressToastId = toast.loading(`Updating ${totalPhotos} photo${totalPhotos !== 1 ? 's' : ''} to POSTED status...`, {
        description: 'Processing all photos',
      })

      // Process all photos in parallel for faster execution
      const photoUpdatePromises = photos.map((photo: any, index: number) =>
        fetch(`/api/wall-post-photos/${photo.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'POSTED' }),
        }).then(response => {
          if (!response.ok) {
            throw new Error(`Failed to update photo ${photo.id} status`)
          }
          return response
        })
      )

      // Wait for all photos to be updated
      await Promise.all(photoUpdatePromises)

      // Step 2: Find the "Posted Today" column status
      toast.loading('Moving to Posted Today column...', {
        id: progressToastId,
        description: 'Finalizing changes',
      })

      const columnsResponse = await fetch(`/api/board-columns?teamId=${encodeURIComponent(teamId)}`)
      if (!columnsResponse.ok) {
        throw new Error('Failed to fetch columns')
      }

      const columnsData = await columnsResponse.json()
      const postedColumn = columnsData.columns?.find((col: any) => col.label === 'Posted Today')

      if (!postedColumn) {
        throw new Error('Posted Today column not found')
      }

      // Step 3: Change task status to Posted Today column
      const statusResponse = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: task.id,
          status: postedColumn.status,
        }),
      })

      if (!statusResponse.ok) {
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
            oldColumn: 'Ready to Post',
            newColumn: 'Posted Today',
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

      // Call onSuccess callback to refresh tasks FIRST (before showing success toast)
      if (onSuccess) {
        // Keep the progress toast showing "Refreshing board..."
        toast.loading('Refreshing board...', {
          id: progressToastId,
          description: 'Updating task positions',
        })

        await onSuccess()
      }

      // Success! Dismiss progress toast and show success AFTER refresh
      if (progressToastId) {
        toast.dismiss(progressToastId)
      }
      toast.success('Wall post marked as posted!', {
        description: `Successfully updated ${totalPhotos} photo${totalPhotos !== 1 ? 's' : ''} and moved to Posted Today`,
      })

    } catch (error) {
      console.error('Error marking as posted:', error)

      // Dismiss progress toast and show error
      if (progressToastId) {
        toast.dismiss(progressToastId)
      }
      toast.error(error instanceof Error ? error.message : 'Failed to mark as posted')
    } finally {
      setLoadingTaskId(null)
    }
  }

  return {
    markAsPosted,
    loadingTaskId,
  }
}
