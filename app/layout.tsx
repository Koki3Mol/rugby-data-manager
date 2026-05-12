import type { ReactNode } from 'react';
import { Chivo } from 'next/font/google';
import { DataProvider } from '@/context/DataContext';
import './globals.css';

const chivo = Chivo({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-chivo',
  weight: ['300', '400', '700', '800', '900'],
});

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={chivo.variable}>
      <body>
        <DataProvider>
          {children}
        </DataProvider>
      </body>
    </html>
  );
}
