"use client";

import {
  Layers,
  Sparkles,
  Settings,
  FolderOpen,
  Wand2,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { CharacterWorkflow } from "@/components/character-workflow";
import { SpriteWorkflow } from "@/components/sprite-workflow";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

type View = "character" | "sprite";

const navigation = [
  {
    id: "character" as const,
    label: "Character",
    description: "Generate & edit characters",
    icon: Sparkles,
  },
  {
    id: "sprite" as const,
    label: "Sprite Sheet",
    description: "Create animation sprites",
    icon: Layers,
  },
];

export default function Home() {
  const [activeView, setActiveView] = useState<View>("character");

  const activeNav = navigation.find((n) => n.id === activeView);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col">
        {/* Logo */}
        <div className="h-14 flex items-center gap-3 px-4 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm">
            <Wand2 className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground tracking-tight">
              NanoBanana
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
              Sprite Studio
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          <div className="px-2 py-1.5 mb-2">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Workflows
            </span>
          </div>
          {navigation.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-md flex items-center justify-center transition-colors",
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "bg-muted/50 text-muted-foreground"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={cn(
                      "text-sm font-medium truncate",
                      isActive && "text-sidebar-accent-foreground"
                    )}
                  >
                    {item.label}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {item.description}
                  </div>
                </div>
                {isActive && (
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-3 border-t border-sidebar-border">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors">
            <FolderOpen className="w-4 h-4" />
            <span className="text-sm">Assets</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors">
            <Settings className="w-4 h-4" />
            <span className="text-sm">Settings</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-14 flex-shrink-0 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            {activeNav && (
              <>
                <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                  <activeNav.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h1 className="text-sm font-semibold text-foreground">
                    {activeNav.label}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    {activeNav.description}
                  </p>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 status-dot" />
              <span className="text-xs text-muted-foreground">
                Gemini Ready
              </span>
            </div>
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 overflow-auto p-6 scrollbar-thin">
          <div className="max-w-6xl mx-auto animate-fade-in">
            {activeView === "character" && <CharacterWorkflow />}
            {activeView === "sprite" && <SpriteWorkflow />}
          </div>
        </div>
      </main>

      <Toaster
        position="bottom-right"
        toastOptions={{
          classNames: {
            toast: "bg-card border-border shadow-lg",
            title: "text-foreground",
            description: "text-muted-foreground",
          },
        }}
      />
    </div>
  );
}
