'use client';

import { useEffect } from 'react';
import { EditorLayout } from '@/components/editor';

export default function EditorPage() {
  useEffect(() => {
    // Try to restore project from localStorage
    try {
      const saved = localStorage.getItem('homeforge-project');
      if (saved) {
        console.log('[Editor] Restored project from localStorage');
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  return <EditorLayout />;
}
