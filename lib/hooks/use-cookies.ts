"use client"

import Cookies from 'js-cookie'

// Cookie types grouped by consent category
const COOKIE_TYPES = {
  // Necessary cookies - always enabled
  necessary: [
    'next-auth.session-token',
    'next-auth.csrf-token',
    'next-auth.callback-url',
    '__Secure-next-auth.callback-url',
    '__Host-next-auth.csrf-token',
  ],
  
  // Analytics cookies
  analytics: [
    '_ga',
    '_gid',
    '_gat',
    '_fbp',
  ],
  
  // Marketing cookies
  marketing: [
    'user_tracking',
    'remarketing',
    'advertisement',
  ],
  
  // Preferences cookies
  preferences: [
    'theme',
    'language',
    'player_volume',
    'audio_quality',
  ],
}

// Cookie options
const COOKIE_OPTIONS = {
  // Default options
  default: {
    expires: 365, // 1 year
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
  },
  
  // Session cookies
  session: {
    expires: undefined, // Session cookie
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
  }
}

/**
 * Hook to manage cookies
 */
export function useCookies() {
  // Check if running in browser environment
  const isBrowser = typeof window !== 'undefined'
  
  // Set a cookie
  const setCookie = (name: string, value: string, options = COOKIE_OPTIONS.default) => {
    if (!isBrowser) return null
    return Cookies.set(name, value, options)
  }
  
  // Get a cookie value
  const getCookie = (name: string) => {
    if (!isBrowser) return undefined
    return Cookies.get(name)
  }
  
  // Remove a cookie
  const removeCookie = (name: string) => {
    if (!isBrowser) return undefined
    return Cookies.remove(name)
  }
  
  return {
    setCookie,
    getCookie,
    removeCookie,
    COOKIE_TYPES,
    COOKIE_OPTIONS,
  }
} 