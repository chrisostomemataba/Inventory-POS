// app/layout.js
 'use client'
import { Inter, Playfair_Display } from 'next/font/google';
import ThemeProvider from '@/app/components/providers/ThemeProvider';
import './globals.css';
import { LoadingProvider } from './context/LoadingContext';
import Navigation from './components/layout/Navigation';
import { usePathname } from 'next/navigation';
import SnackbarProvider from '@/app/components/shared/SnackbarProvider';


const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ 
  subsets: ['latin'], 
  variable: '--font-playfair' 
});

// Create a wrapper component that checks the route
function RootLayoutContent({ children }) {
 
  const pathname = usePathname();
  const isLoginPage = pathname === '/';

  return (
    <ThemeProvider>
      <SnackbarProvider>
      <LoadingProvider>
        {isLoginPage ? children : <Navigation>{children}</Navigation>}
      </LoadingProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        <RootLayoutContent>{children}</RootLayoutContent>
      </body>
    </html>
  );
}