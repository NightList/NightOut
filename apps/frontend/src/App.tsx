import { ThemeProvider } from '@nightout/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { RouterProvider } from 'react-router';
import { queryConfig } from '@/configs/app';
import { router } from '@/router';
import { AuthProvider } from '@/services/auth';

/** Providers ทั้งหมดของแอป: ธีม (antd + Tailwind) → React Query → Auth → Router */
export function App() {
  const [queryClient] = useState(() => new QueryClient(queryConfig));
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
