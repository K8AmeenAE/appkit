import { useState, useEffect, useCallback } from 'react'
import { SmartSessionController } from '../src/core/controller/SmartSessionController.js'
import type {
  SmartSessionGrantPermissionsRequest,
  SmartSessionGrantPermissionsResponse
} from '../src/core/utils/TypeUtils.js'
import { AppKitSmartSessionControllerClient } from '../src/client.js'

export { SmartSessionController } from '../src/core/controller/SmartSessionController.js'
export type {
  KeyType,
  KeySigner,
  SmartSessionGrantPermissionsRequest,
  SmartSessionGrantPermissionsResponse
} from '../src/core/utils/TypeUtils.js'
export type { AppKitSmartSessionControllerClient }

// -- Hooks -------------------------------------------------------------------
export function useSmartSession() {
  // Local state to store the latest smart session state
  const [permissions, setPermissions] = useState(SmartSessionController.state.permissions)
  const [permissionsContext, setPermissionsContext] = useState(
    SmartSessionController.state.permissionsContext
  )

  // Grant permissions method
  const grantPermissions = useCallback(
    async (
      smartSessionGrantPermissionsRequest: SmartSessionGrantPermissionsRequest
    ): Promise<SmartSessionGrantPermissionsResponse> => {
      const response = await SmartSessionController.grantPermissions(
        smartSessionGrantPermissionsRequest
      )

      return response
    },
    []
  )

  // Subscribe to the SmartSessionController state and update local state when it changes
  useEffect(() => {
    const unsubscribe = SmartSessionController.subscribe(newState => {
      setPermissions(newState.permissions)
      setPermissionsContext(newState.permissionsContext)
    })

    // Cleanup subscription on unmount
    return () => unsubscribe()
  }, [])

  // Return values and methods to use in components
  return {
    permissions,
    permissionsContext,
    grantPermissions
  }
}