import React from 'react';
import { Outlet, Link } from 'react-router-dom';

/**
 * Auth layout — centered card on off-white ground.
 * Follows framed-sheet app-screen conventions:
 * - Clean ground (#f5f6f8 via --background)
 * - White card surface
 * - Product mark at top left
 */
export function AuthLayout() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex flex-col">
      {/* Minimal header */}
      <header className="px-6 py-4">
        <Link to="/" className="inline-flex items-center gap-2">
          <span className="w-7 h-7 rounded-[5px] bg-[hsl(var(--primary))] flex items-center justify-center text-white text-[11px] font-semibold tracking-tight">
            P
          </span>
          <span className="text-[14px] font-semibold text-[hsl(var(--foreground))] tracking-tight">
            PublisherOS
          </span>
        </Link>
      </header>

      {/* Centered card */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[400px]">
          <div className="bg-white border border-[hsl(var(--border))] rounded-[8px] p-8 shadow-[0_1px_3px_rgba(0,0,0,.06)]">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
