'use client';

import { BookOpen, FileText, Play, Settings, Upload } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';
import { Separator } from '@/components/ui/separator';
import { Toaster } from '@/components/ui/sonner';

interface LayoutProps {
  children: ReactNode;
  currentView?: 'upload' | 'files' | 'player' | 'settings' | 'terminology';
  onViewChange?: (view: 'upload' | 'files' | 'player' | 'settings' | 'terminology') => void;
}

export default function Layout({ children, currentView = 'upload', onViewChange }: LayoutProps) {
  const navigation = [
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'files', label: 'Files', icon: FileText },
    { id: 'player', label: 'Player', icon: Play },
    { id: 'terminology', label: 'Terminology', icon: BookOpen },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="font-bold text-2xl text-foreground">Shadowing Learning</h1>
              <Separator orientation="vertical" className="h-6" />
            </div>

            {/* Navigation */}
            <NavigationMenu>
              <NavigationMenuList className="space-x-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavigationMenuItem key={item.id}>
                      <Button
                        variant={currentView === item.id ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() =>
                          onViewChange?.(
                            item.id as 'upload' | 'files' | 'player' | 'settings' | 'terminology'
                          )
                        }
                        className="flex items-center gap-2"
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Button>
                    </NavigationMenuItem>
                  );
                })}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>

      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}
