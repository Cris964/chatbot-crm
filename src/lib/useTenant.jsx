import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'

const TenantContext = createContext(null)

// Super admin emails that can access the SuperAdmin panel
const SUPER_ADMIN_EMAILS = ['admin@nexusia.com']



export function TenantProvider({ session, children }) {
  const [tenantState, setTenantState] = useState({
    clientId: null,
    clientName: null,
    role: null,
    membership: null,
    isAdmin: false,
    isSuperAdmin: false,
    isLoading: true,
    error: null,
  })

  const loadTenant = useCallback(async () => {
    if (!session?.user?.id) {
      setTenantState(prev => ({ ...prev, isLoading: false }))
      return
    }

    try {
      const userEmail = session.user.email?.toLowerCase()
      const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(userEmail)

      // Try to get membership from team_members first (new SaaS flow)
      let { data: membership, error: memberError } = await supabase
        .from('team_members')
        .select('*, clients(*)')
        .eq('user_id', session.user.id)
        .eq('status', 'activo')
        .limit(1)
        .maybeSingle()

      if (membership) {
        setTenantState({
          clientId: membership.client_id,
          clientName: membership.clients?.name || 'Mi Empresa',
          role: membership.role,
          membership,
          isAdmin: membership.role?.toLowerCase() === 'admin',
          isSuperAdmin,
          isLoading: false,
          error: null,
        })
        return
      }

      // Fallback: Legacy flow — check clients table directly (for backward compatibility)
      const { data: legacyClient } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', session.user.id)
        .limit(1)
        .maybeSingle()

      if (legacyClient) {
        // Auto-migrate: create team_members entry for this legacy user
        const { error: migrateError } = await supabase
          .from('team_members')
          .insert({
            user_id: session.user.id,
            client_id: legacyClient.id,
            role: 'admin',
            full_name: userEmail?.split('@')[0] || 'Admin',
            email: userEmail,
            status: 'activo'
          })

        if (migrateError && migrateError.code !== '23505') {
          console.warn('[Tenant] Auto-migrate failed:', migrateError)
        }

        setTenantState({
          clientId: legacyClient.id,
          clientName: legacyClient.name || 'Mi Empresa',
          role: 'admin',
          membership: null,
          isAdmin: true,
          isSuperAdmin,
          isLoading: false,
          error: null,
        })
        return
      }

      // No company assigned - If super admin, give them a default context
      if (isSuperAdmin) {
        setTenantState({
          clientId: '00000000-0000-0000-0000-000000000000', // Default Global ID
          clientName: 'Nexus Global Admin',
          role: 'admin',
          membership: null,
          isAdmin: true,
          isSuperAdmin,
          isLoading: false,
          error: null,
        })
      } else {
        setTenantState({
          clientId: null,
          clientName: null,
          role: null,
          membership: null,
          isAdmin: false,
          isSuperAdmin,
          isLoading: false,
          error: 'NO_COMPANY',
        })
      }

    } catch (err) {
      console.error('[Tenant] Error loading tenant:', err)
      setTenantState(prev => ({
        ...prev,
        isLoading: false,
        error: err.message,
      }))
    }
  }, [session?.user?.id])

  useEffect(() => {
    loadTenant()
  }, [loadTenant])

  const value = {
    ...tenantState,
    reload: loadTenant,
    session,
  }

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  const ctx = useContext(TenantContext)
  if (!ctx) {
    throw new Error('useTenant must be used within a TenantProvider')
  }
  return ctx
}

export default useTenant
