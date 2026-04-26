import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'AceOS — AP Exam Prep Powered by AI',
    template: '%s | AceOS',
  },
  description: 'Personalized AP exam preparation with AI-powered diagnostics, practice, and FRQ grading.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://aceos.app'),
  openGraph: {
    type: 'website',
    siteName: 'AceOS',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#3355ff',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

/**
 * Root layout — wraps every page in the app.
 * Font loading, global styles, and viewport meta live here.
 */
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
