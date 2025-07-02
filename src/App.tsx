import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ApiKeyProvider } from "./contexts/ApiKeyContext";
import WeatherApp from "./components/WeatherApp";
import "./App.css";

// Import API test functions in development mode
if (process.env.NODE_ENV === 'development') {
  import('./test-api-response');
}

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
      placeholderData: (previousData: any) => previousData,
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
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </ApiKeyProvider>
    </QueryClientProvider>
  );
}

export default App;
