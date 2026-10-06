import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useNotice } from '#/notice/notice'
import { SNAPSHOT_KEY, unwrap } from './options'
import type { Result } from '#/journeys/types'

type Action = () => Promise<Result<unknown>>

const MUTATION_KEY = ['journey-action']
const REFETCH_FAILED = 'Saved, but the latest records could not be loaded. Please try again.'
const REQUEST_FAILED = 'The request could not be completed.'

/**
 * Returns a runner that performs one server action, reloads the records, and reports the outcome as the notice.
 * It resolves to whether the action and the reload both succeeded, and ignores calls while another action runs.
 */
function useRunMutation() {
  const queryClient = useQueryClient()
  const { showNotice } = useNotice()
  const mutation = useMutation({
    mutationKey: MUTATION_KEY,
    mutationFn: async (action: Action) => {
      unwrap(await action())

      await queryClient
        .refetchQueries({ queryKey: SNAPSHOT_KEY }, { throwOnError: true })
        .catch(() => {
          throw new Error(REFETCH_FAILED)
        })
    },
  })

  return useCallback(
    async (action: Action, success: string) => {
      if (queryClient.isMutating({ mutationKey: MUTATION_KEY }) > 0) {
        return false
      }

      try {
        await mutation.mutateAsync(action)
        showNotice(success, 'success')

        return true
      } catch (error) {
        showNotice(error instanceof Error ? error.message : REQUEST_FAILED, 'error')

        return false
      }
    },
    [mutation, queryClient, showNotice],
  )
}

export { useRunMutation }
