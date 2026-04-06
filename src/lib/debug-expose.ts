import { useEffect } from 'react';

/** Placeholder - debug expose removed for production */
export function useDebugExpose() {
  useEffect(() => {
    // Debug only - no-op in production
  }, []);
}
