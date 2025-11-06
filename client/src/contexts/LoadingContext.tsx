"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface LoadingContextType {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useAppLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useAppLoading must be used within LoadingProvider");
  }
  return context;
};

export const LoadingProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if this is the first visit or a refresh
    const hasLoadedBefore = sessionStorage.getItem("app-loaded");
    
    if (hasLoadedBefore) {
      // If already loaded in this session, show brief loading
      setTimeout(() => setIsLoading(false), 500);
    } else {
      // First load - show full animation
      setTimeout(() => {
        setIsLoading(false);
        sessionStorage.setItem("app-loaded", "true");
      }, 3000);
    }
  }, []);

  return (
    <LoadingContext.Provider value={{ isLoading, setIsLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};