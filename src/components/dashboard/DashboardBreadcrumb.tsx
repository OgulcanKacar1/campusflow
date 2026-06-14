'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface DashboardBreadcrumbProps {
  items: BreadcrumbItem[];
}

export function DashboardBreadcrumb({ items }: DashboardBreadcrumbProps) {
  return (
    <nav className="flex items-center text-sm text-slate-400 mb-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
      <Link href="/dashboard" className="hover:text-indigo-400 transition-colors flex items-center gap-1">
        <Home className="h-4 w-4" />
      </Link>
      
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        return (
          <div key={index} className="flex items-center">
            <ChevronRight className="h-4 w-4 mx-2 text-slate-600 shrink-0" />
            {isLast || !item.href ? (
              <span className="text-slate-200 font-medium flex items-center gap-1.5">
                {item.icon && <span className="text-indigo-400">{item.icon}</span>}
                {item.label}
              </span>
            ) : (
              <Link 
                href={item.href}
                className="hover:text-indigo-400 transition-colors flex items-center gap-1.5"
              >
                {item.icon && <span className="text-slate-500">{item.icon}</span>}
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
