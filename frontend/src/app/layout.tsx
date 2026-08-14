import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'ACM Photo Booth · Society Event Experience',
  description:
    'ACM Society event photo booth application. Capture, crop, design and print premium photo strips.',
};

export const viewport: Viewport = {
  themeColor: '#07060B',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Loaded by name so the canvas renderer can reference the same families as the DOM. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&family=Dancing+Script:wght@500;700&family=Bebas+Neue&family=Caveat:wght@500;700&display=swap"
        />
      </head>
      <body>
        {children}
        {/* Print target — filled by the export manager, hidden on screen. */}
        <div id="print-area" aria-hidden="true" className="hidden print:block" />
      </body>
    </html>
  );
}
