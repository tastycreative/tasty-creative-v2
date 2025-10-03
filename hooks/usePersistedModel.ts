import { useEffect } from 'react';
import useSelectedModelStore from '@/store/useSelectedModelStore';

/**
 * Hook to access the persisted selected model data
 * This data will persist across page refreshes
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { selectedModel, isHydrated } = usePersistedModel();
 *   
 *   if (!isHydrated) {
 *     return <div>Loading...</div>;
 *   }
 *   
 *   if (!selectedModel) {
 *     return <div>No model selected</div>;
 *   }
 *   
 *   return (
 *     <div>
 *       <h1>{selectedModel.name}</h1>
 *       <p>Status: {selectedModel.status}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function usePersistedModel() {
  const selectedModel = useSelectedModelStore((state) => state.selectedModel);
  const clearSelectedModel = useSelectedModelStore((state) => state.clearSelectedModel);
  
  // Check if the store has been hydrated from localStorage
  const isHydrated = useSelectedModelStore((state) => state._hasHydrated);
  
  useEffect(() => {
    // You can add any side effects here when the selected model changes
    if (selectedModel) {
      console.log('Selected model loaded:', selectedModel.name);
    }
  }, [selectedModel]);
  
  return {
    selectedModel,
    clearSelectedModel,
    isHydrated: isHydrated !== false, // Will be true after hydration
  };
}