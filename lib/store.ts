import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Asset,
  AnimationWithFrames,
  AnimationWithCharacterAsset,
  CharacterWithAssets,
  ProjectWithRelations,
} from "@/lib/types";

// Tab types for the workspace
export type TabType =
  | "project"
  | "character"
  | "animation"
  | "asset"
  | "spritesheet"
  | "reference-assets";

export interface Tab {
  id: string;
  type: TabType;
  entityId: string;
  label: string;
}

// Right sidebar context types
export type ActionContext =
  | { type: "none" }
  | { type: "new-character"; projectId: string }
  | { type: "new-animation"; projectId: string; characterId?: string }
  | { type: "new-spritesheet"; projectId: string; characterId?: string }
  | { type: "edit-character"; character: CharacterWithAssets }
  | { type: "edit-animation"; animation: AnimationWithFrames }
  | { type: "new-frame"; animation: AnimationWithCharacterAsset }
  | { type: "generate-variation"; character: CharacterWithAssets }
  | { type: "view-asset"; asset: Asset };

interface AppState {
  // Current project
  currentProjectId: string | null;
  currentProject: ProjectWithRelations | null;

  // Open tabs
  tabs: Tab[];
  activeTabId: string | null;

  // Sidebar states
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;

  // Right sidebar context
  actionContext: ActionContext;

  // Loading states
  isLoadingProject: boolean;

  // Actions
  setCurrentProject: (project: ProjectWithRelations | null) => void;
  setCurrentProjectId: (id: string | null) => void;
  switchProject: (projectId: string, projectName: string) => void;
  refreshCurrentProject: () => Promise<void>;

  openTab: (type: TabType, entityId: string, label: string) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;

  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  setLeftSidebarOpen: (open: boolean) => void;
  setRightSidebarOpen: (open: boolean) => void;

  setActionContext: (context: ActionContext) => void;
  clearActionContext: () => void;

  setIsLoadingProject: (loading: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentProjectId: null,
      currentProject: null,
      tabs: [],
      activeTabId: null,
      leftSidebarOpen: true,
      rightSidebarOpen: false,
      actionContext: { type: "none" },
      isLoadingProject: false,

      // Project actions
      setCurrentProject: (project) =>
        set({ currentProject: project, currentProjectId: project?.id ?? null }),
      setCurrentProjectId: (id) => set({ currentProjectId: id }),
      switchProject: (projectId, projectName) => {
        const projectTab: Tab = {
          id: `project-${projectId}`,
          type: "project",
          entityId: projectId,
          label: projectName,
        };
        set({
          currentProjectId: projectId,
          tabs: [projectTab],
          activeTabId: projectTab.id,
          actionContext: { type: "none" },
        });
      },
      refreshCurrentProject: async () => {
        const { currentProjectId } = get();
        if (!currentProjectId) return;

        set({ isLoadingProject: true });
        try {
          const res = await fetch(`/api/projects/${currentProjectId}`);
          if (res.ok) {
            const data = await res.json();
            set({ currentProject: data });
          }
        } catch (error) {
          console.error("Failed to refresh project:", error);
        } finally {
          set({ isLoadingProject: false });
        }
      },

      // Tab actions
      openTab: (type, entityId, label) => {
        const { tabs } = get();
        const existingTab = tabs.find(
          (t) => t.type === type && t.entityId === entityId,
        );

        if (existingTab) {
          set({ activeTabId: existingTab.id });
        } else {
          const newTab: Tab = {
            id: `${type}-${entityId}`,
            type,
            entityId,
            label,
          };
          set({
            tabs: [...tabs, newTab],
            activeTabId: newTab.id,
          });
        }
      },

      closeTab: (tabId) => {
        const { tabs, activeTabId, currentProjectId } = get();
        const tabToClose = tabs.find((t) => t.id === tabId);

        // Prevent closing current project tab
        if (
          tabToClose?.type === "project" &&
          tabToClose.entityId === currentProjectId
        ) {
          return;
        }

        const newTabs = tabs.filter((t) => t.id !== tabId);
        const closingActiveTab = activeTabId === tabId;

        set({
          tabs: newTabs,
          activeTabId: closingActiveTab
            ? (newTabs[newTabs.length - 1]?.id ?? null)
            : activeTabId,
        });
      },

      setActiveTab: (tabId) => set({ activeTabId: tabId }),

      // Sidebar actions
      toggleLeftSidebar: () =>
        set((state) => ({ leftSidebarOpen: !state.leftSidebarOpen })),
      toggleRightSidebar: () =>
        set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen })),
      setLeftSidebarOpen: (open) => set({ leftSidebarOpen: open }),
      setRightSidebarOpen: (open) => set({ rightSidebarOpen: open }),

      // Action context
      setActionContext: (context) =>
        set({ actionContext: context, rightSidebarOpen: true }),
      clearActionContext: () =>
        set({ actionContext: { type: "none" }, rightSidebarOpen: false }),

      setIsLoadingProject: (loading) => set({ isLoadingProject: loading }),
    }),
    {
      name: "megabananas-app-state",
      partialize: (state) => ({
        currentProjectId: state.currentProjectId,
        tabs: state.tabs,
        activeTabId: state.activeTabId,
        leftSidebarOpen: state.leftSidebarOpen,
      }),
    },
  ),
);

// Re-export types from central types module for backwards compatibility
export type {
  Asset,
  Project,
  Character,
  Animation,
  Frame,
  SpriteSheet,
  FrameWithAsset,
  AnimationWithFrames,
  CharacterWithAssets,
  SpriteSheetWithAsset,
  ProjectWithRelations,
  AnimationWithCharacterAsset,
  AnimationGenerationSettings,
  SpriteSheetGenerationSettings,
} from "@/lib/types";
export { AssetType } from "@/lib/types";
