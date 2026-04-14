"use client";

import React from 'react';
import Navbar from './Navbar';
import { MadeWithDyad } from './made-with-dyad';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 w-full overflow-x-hidden">
      <Navbar />
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-in fade-in duration-500">
        {children}
      </main>
      <footer className="border-t py-8 mt-auto bg-white dark:bg-slate-900 w-full">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-muted-foreground">
            © 2024 InfoHub. CIEP 165 Brigadeiro Sérgio Carvalho.
          </p>
          <MadeWithDyad />
        </div>
      </footer>
    </div>
  );
};

export default Layout;