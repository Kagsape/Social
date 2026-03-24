"use client";

import React from 'react';
import Navbar from './Navbar';
import { MadeWithDyad } from './made-with-dyad';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950">
      <Navbar />
      <main className="container py-8 animate-in fade-in duration-500">
        {children}
      </main>
      <footer className="border-t py-8 mt-auto bg-white dark:bg-slate-900">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-muted-foreground">
            © 2024 InfoHub. A maior comunidade de TI do Brasil.
          </p>
          <MadeWithDyad />
        </div>
      </footer>
    </div>
  );
};

export default Layout;