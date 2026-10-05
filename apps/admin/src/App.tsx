import { ThemeProvider } from '@nightout/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { RouterProvider } from 'react-router';
import { router } from '@/router';
import { AdminAuthProvider } from '@/services/adminAuth';

/** Providers ของ Backoffice: ธีม → React Query → Auth (Supabase + MFA) → Router */
export function App() {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AdminAuthProvider>
          <RouterProvider router={router} />
        </AdminAuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
