"use client"

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface NavigationItem {
  title: string
  url: string
  icon: any
}

interface NavigationSection {
  title: string
  items: NavigationItem[]
}

/**
 * Hook for managing keyboard navigation in the sidebar
 * Implements WAI-ARIA navigation patterns from React Spectrum
 */
export function useSidebarNavigation(sections: NavigationSection[]) {
  const router = useRouter()
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const navRef = useRef<HTMLDivElement>(null)
  
  // Flatten all items for easier navigation
  const allItems = sections.flatMap(section => section.items)
  
  // Get current focused element
  const focusedItem = focusedIndex >= 0 ? allItems[focusedIndex] : null

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!navRef.current?.contains(document.activeElement)) return

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setFocusedIndex(prev => {
          const next = prev + 1
          return next >= allItems.length ? 0 : next
        })
        break
        
      case 'ArrowUp':
        event.preventDefault()
        setFocusedIndex(prev => {
          const next = prev - 1
          return next < 0 ? allItems.length - 1 : next
        })
        break
        
      case 'Home':
        event.preventDefault()
        setFocusedIndex(0)
        break
        
      case 'End':
        event.preventDefault()
        setFocusedIndex(allItems.length - 1)
        break
        
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (focusedItem) {
          router.push(focusedItem.url)
        }
        break
        
      case 'Escape':
        // Clear focus and return to main content
        ;(document.activeElement as HTMLElement)?.blur()
        setFocusedIndex(-1)
        break
        
      default:
        // Type-to-select functionality
        if (event.key.length === 1 && !event.metaKey && !event.ctrlKey) {
          const char = event.key.toLowerCase()
          const currentTime = Date.now()
          
          // Find next item starting with typed character
          const startIndex = focusedIndex + 1
          for (let i = 0; i < allItems.length; i++) {
            const index = (startIndex + i) % allItems.length
            const item = allItems[index]
            if (item.title.toLowerCase().startsWith(char)) {
              setFocusedIndex(index)
              event.preventDefault()
              break
            }
          }
        }
    }
  }

  // Focus management effect
  useEffect(() => {
    const nav = navRef.current
    if (!nav) return

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [focusedIndex, focusedItem])

  // Auto-focus the focused item
  useEffect(() => {
    if (focusedIndex >= 0 && navRef.current) {
      const links = navRef.current.querySelectorAll('[data-nav-item]')
      const targetLink = links[focusedIndex] as HTMLElement
      targetLink?.focus()
    }
  }, [focusedIndex])

  return {
    navRef,
    focusedIndex,
    setFocusedIndex,
    allItems,
  }
}