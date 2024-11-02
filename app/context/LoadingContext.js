// context/LoadingContext.js
'use client'
import { createContext, useContext, useState } from 'react';
import Loader from '@/app/components/shared/Loader';

const LoadingContext = createContext({
  isLoading: false,
  setIsLoading: () => {},
  startLoading: () => {},
  stopLoading: () => {},
});

export function LoadingProvider({ children }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingWords, setLoadingWords] = useState([
    'Loading',
    'System',
    'Components',
    'Data',
    'Loading'
  ]);

  const startLoading = (words = null) => {
    if (words) setLoadingWords(words);
    setIsLoading(true);
  };

  const stopLoading = () => {
    setIsLoading(false);
  };

  return (
    <LoadingContext.Provider 
      value={{ 
        isLoading, 
        setIsLoading, 
        startLoading, 
        stopLoading 
      }}
    >
      {isLoading && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
            backdropFilter: 'blur(5px)',
          }}
        >
          <Loader words={loadingWords} />
        </div>
      )}
      {children}
    </LoadingContext.Provider>
  );
}

export const useLoading = () => useContext(LoadingContext);