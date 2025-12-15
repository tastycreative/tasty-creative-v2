'use client';

import { useRef, useEffect, useCallback } from 'react';

interface UseDraggableScrollOptions {
  /**
   * Whether dragging is enabled
   * @default true
   */
  enabled?: boolean;
  /**
   * Scroll sensitivity (higher = more sensitive)
   * @default 1
   */
  sensitivity?: number;
  /**
   * Cursor style when dragging
   * @default 'grabbing'
   */
  draggingCursor?: string;
  /**
   * Cursor style when idle
   * @default 'grab'
   */
  idleCursor?: string;
}

/**
 * Custom hook to make a scrollable container draggable
 * Similar to Google Maps pan behavior
 */
export function useDraggableScroll<T extends HTMLElement = HTMLDivElement>(
  options: UseDraggableScrollOptions = {}
) {
  const {
    enabled = true,
    sensitivity = 1,
    draggingCursor = 'grabbing',
    idleCursor = 'grab',
  } = options;

  const ref = useRef<T>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (!enabled || !ref.current) return;

      // Only start drag on left mouse button
      if (e.button !== 0) return;

      // Don't interfere with text selection or other draggable elements
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'BUTTON' ||
        target.closest('button') ||
        target.closest('a') ||
        target.hasAttribute('draggable') ||
        target.closest('[draggable="true"]') // Check if inside a draggable element
      ) {
        return;
      }

      isDraggingRef.current = true;
      startXRef.current = e.pageX - ref.current.offsetLeft;
      scrollLeftRef.current = ref.current.scrollLeft;

      // Change cursor
      if (ref.current) {
        ref.current.style.cursor = draggingCursor;
        ref.current.style.userSelect = 'none';
      }

      // Prevent text selection
      e.preventDefault();
    },
    [enabled, draggingCursor]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingRef.current || !ref.current) return;

      e.preventDefault();

      const x = e.pageX - ref.current.offsetLeft;
      const walk = (x - startXRef.current) * sensitivity;
      ref.current.scrollLeft = scrollLeftRef.current - walk;
    },
    [sensitivity]
  );

  const handleMouseUp = useCallback(() => {
    if (!ref.current) return;

    isDraggingRef.current = false;

    // Restore cursor
    if (enabled) {
      ref.current.style.cursor = idleCursor;
    } else {
      ref.current.style.cursor = '';
    }
    ref.current.style.userSelect = '';
  }, [enabled, idleCursor]);

  const handleMouseLeave = useCallback(() => {
    if (!ref.current) return;

    // Stop dragging when mouse leaves the element
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      ref.current.style.cursor = enabled ? idleCursor : '';
      ref.current.style.userSelect = '';
    }
  }, [enabled, idleCursor]);

  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;

    // Set initial cursor
    element.style.cursor = idleCursor;

    // Add event listeners
    element.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      // Cleanup
      element.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      element.removeEventListener('mouseleave', handleMouseLeave);

      // Reset styles
      element.style.cursor = '';
      element.style.userSelect = '';
    };
  }, [enabled, handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave, idleCursor]);

  return ref;
}
