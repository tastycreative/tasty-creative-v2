import { useState } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { boardQueryKeys } from './useBoardQueries'

interface MarkAsPublishedOptions {
  teamId: string
  teamName: string
  session: any
  onSuccess?: () => void
}

export function useMarkAsPublished({ teamId, teamName, session, onSuccess }: MarkAsPublishedOptions) {
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const markAsPublished = async (task: any) => {
    if (!task?.oftvTask) {
      toast.error('No OFTV task data found')
      return
    }

    setLoadingTaskId(task.id)

    try {
      // Step 1: Move folder to published location in Google Drive
      const moveResponse = await fetch('/api/oftv-tasks/move-to-published', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
        }),
      })

      if (!moveResponse.ok) {
        const errorData = await moveResponse.json()
        
        // Handle specific error cases
        if (moveResponse.status === 401) {
          throw new Error(errorData.error || 'Authentication required. Please sign out and sign in again.')
        }
        
        throw new Error(errorData.error || 'Failed to move folder to published location')
      }

      const moveData = await moveResponse.json()
      console.log('✅ Folder moved to published:', moveData)

      // Step 2: Send webhook to n8n after folder move (don't fail if this errors)
      try {
        const webhookPayload = {
          taskId: task.id,
          taskTitle: task.title,
          taskDescription: task.description || '',
          taskNumber: task.taskNumber || null,
          priority: task.priority || 'MEDIUM',
          status: task.status,
          dueDate: task.dueDate || null,
          assignedTo: task.assignedTo || null,
          createdAt: task.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          teamId: teamId,
          teamName: teamName,
          projectPrefix: task.podTeam?.projectPrefix || null,
          // OFTV specific data
          oftvTask: {
            id: task.oftvTask.id,
            model: task.oftvTask.model,
            folderLink: task.oftvTask.folderLink || null,
            videoDescription: task.oftvTask.videoDescription || null,
            specialInstructions: task.oftvTask.specialInstructions || null,
            videoEditorStatus: 'PUBLISHED',
            thumbnailEditorStatus: 'PUBLISHED',
            videoEditor: task.oftvTask.videoEditorUser?.name || task.oftvTask.videoEditorUser?.email || null,
            thumbnailEditor: task.oftvTask.thumbnailEditorUser?.name || task.oftvTask.thumbnailEditorUser?.email || null,
            dateAssigned: task.oftvTask.dateAssigned || null,
            dateCompleted: new Date().toISOString(),
          },
          // Folder move information
          folderMoved: {
            sourceFolderId: moveData.sourceFolderId || null,
            destinationFolderId: moveData.destinationFolderId || null,
            movedAt: new Date().toISOString(),
          },
          markedBy: session?.user?.name || 'System',
          markedById: session?.user?.id || '',
          markedAt: new Date().toISOString(),
        }

        await fetch('https://n8n.tastycreative.xyz/webhook/6ddab818-6df5-4cd5-8f46-1569f67605db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookPayload),
        })

        console.log('✅ n8n webhook triggered successfully for task:', task.id)
      } catch (webhookError) {
        console.error('Failed to trigger n8n webhook (non-critical):', webhookError)
      }

      // Step 3: Optimistically update the cache FIRST
      console.log('🔵 Optimistically updating cache for published status...')
      queryClient.setQueryData(boardQueryKeys.tasks(teamId), (old: any) => {
        if (!old?.tasks) return old
        
        return {
          ...old,
          tasks: old.tasks.map((t: any) => {
            if (t.id === task.id && t.oftvTask) {
              return {
                ...t,
                oftvTask: {
                  ...t.oftvTask,
                  videoEditorStatus: 'PUBLISHED',
                  thumbnailEditorStatus: 'PUBLISHED',
                },
                updatedAt: new Date().toISOString(),
              }
            }
            return t
          }),
        }
      })

      // Step 4: Update both video and thumbnail editor statuses to PUBLISHED
      const updateResponse = await fetch('/api/oftv-tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: task.oftvTask.id,
          videoEditorStatus: 'PUBLISHED',
          thumbnailEditorStatus: 'PUBLISHED',
        }),
      })

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json()
        throw new Error(errorData.error || 'Failed to mark as published')
      }

      const updateData = await updateResponse.json()
      console.log('✅ Task status updated to PUBLISHED:', updateData)

      // Step 5: Send team notification (don't fail if this errors)
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
            oldColumn: 'Posted',
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
      toast.success('Folder moved to published location and task marked as published!')

      // Step 6: Refetch after a delay to sync with server
      setTimeout(async () => {
        console.log('🟣 Refetching tasks to sync with server...')
        await queryClient.invalidateQueries({ queryKey: boardQueryKeys.tasks(teamId) })
      }, 800)

      // Call onSuccess callback
      if (onSuccess) {
        onSuccess()
      }

    } catch (error) {
      console.error('Error marking as published:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to mark as published')
      
      // Rollback optimistic update on error
      await queryClient.invalidateQueries({ queryKey: boardQueryKeys.tasks(teamId) })
    } finally {
      setLoadingTaskId(null)
    }
  }

  return {
    markAsPublished,
    loadingTaskId,
  }
}
