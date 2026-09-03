import { supabase } from './supabase'

/**
 * A wrapper around native fetch that automatically injects the Supabase user's
 * JWT access token into the Authorization header for secure API calls.
 */
export async function apiFetch(url, options = {}) {
  // Extract the current session securely
  const { data: { session } } = await supabase.auth.getSession()
  
  // Prepare headers
  const headers = new Headers(options.headers || {})
  
  // Inject Authorization Bearer token if session exists
  if (session && session.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`)
  }

  // Fallback to application/json if not specified
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  // Execute fetch with the enriched headers
  return fetch(url, {
    ...options,
    headers
  })
}
