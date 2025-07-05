import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { ApiKeyProvider } from './contexts/ApiKeyContext';
import WeatherApp from './components/WeatherApp';
import { preloadIcons } from './utils/iconPreloader';
import './App.css';

// Preload all commonly used icons from bundled packages
// This ensures icons are available immediately without network requests
preloadIcons();

// Create a client instance with optimized settings to prevent flickering
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 15 * 60 * 1000, // 15 minutes (longer cache to reduce refetching)
      retry: 1, // Reduced retries to prevent delays
      retryDelay: 1000, // Faster retry delay
      refetchOnWindowFocus: false,
      refetchOnReconnect: false, // Prevent flickering on reconnect
      refetchOnMount: false, // Prevent unnecessary refetch on mount
      // Use network-first approach but allow stale data
      networkMode: 'offlineFirst',
      // Keep previous data while fetching new data
      // placeholderData: previousData => previousData,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
      // Optimistic updates where possible
      networkMode: 'offlineFirst',
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ApiKeyProvider>
        <div className="App">
          <WeatherApp />
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(0, 0, 0, 0.9)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              fontSize: '14px',
              maxWidth: '400px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: 'white',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: 'white',
              },
            },
          }}
        />
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </ApiKeyProvider>
    </QueryClientProvider>
  );
}

export default App;
