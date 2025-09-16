'use client';

import { ReactNode } from 'react';
import { Upload, FileText, Play, Settings, BookOpen } from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
} from '@/components/ui/navigation-menu';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
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
      <header className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-foreground">Shadowing Learning</h1>
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
                        onClick={() => onViewChange?.(item.id as 'upload' | 'files' | 'player' | 'settings' | 'terminology')}
                        className="flex items-center gap-2"
                      >
                        <Icon className="w-4 h-4" />
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}