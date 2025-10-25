'use client';

import Link from 'next/link';
import { Bot } from 'lucide-react';

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <Bot className="w-6 h-6" />
          <span>AgentTest</span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-6">
          <Link 
            href="/" 
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Home
          </Link>
          <Link 
            href="/#pricing" 
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Pricing
          </Link>
        </div>

        {/* Dashboard Button */}
        <Link
          href="/dashboard"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          Dashboard
        </Link>
      </div>
    </nav>
  );
}
