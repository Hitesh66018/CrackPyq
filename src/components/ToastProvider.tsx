'use client';

import { Toaster } from 'react-hot-toast';

export function ToastProvider() {
  return (
    <Toaster 
      position="bottom-right"
      toastOptions={{
        style: {
          background: '#111624',
          color: '#fff',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        success: {
          iconTheme: {
            primary: '#10B981',
            secondary: '#111624',
          },
        },
        error: {
          iconTheme: {
            primary: '#EF4444',
            secondary: '#111624',
          },
        },
      }}
    />
  );
}
