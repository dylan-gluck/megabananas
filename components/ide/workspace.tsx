"use client";

import { X, FolderOpen, Sparkles, Film, PanelLeft, PanelRight, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useAppStore, type Tab } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ProjectView } from "./views/project-view";
import { CharacterView } from "./views/character-view";
import { AnimationView } from "./views/animation-view";
import { AssetView } from "./views/asset-view";

const tabIcons = {
	project: FolderOpen,
	character: Sparkles,
	animation: Film,
	asset: ImageIcon,
};

export function Workspace() {
	const {
		tabs,
		activeTabId,
		currentProjectId,
		setActiveTab,
		closeTab,
		leftSidebarOpen,
		rightSidebarOpen,
		toggleLeftSidebar,
		toggleRightSidebar,
	} = useAppStore();

	const activeTab = tabs.find((t) => t.id === activeTabId);

	return (
		<div className="h-full flex flex-col bg-background">
			{/* Tab Bar */}
			<div className="h-14 border-b border-border flex items-center gap-1 pt-1 px-2 bg-muted/30">
				{/* Left sidebar toggle */}
				{!leftSidebarOpen && (
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8 flex-shrink-0"
						onClick={toggleLeftSidebar}
					>
						<PanelLeft className="h-4 w-4" />
					</Button>
				)}

				{/* Tabs */}
				<ScrollArea className="flex-1">
					<div className="flex items-center gap-1 py-1">
						{tabs.map((tab) => {
							const Icon = tabIcons[tab.type];
							const isActive = tab.id === activeTabId;
							const isCurrentProjectTab =
								tab.type === "project" && tab.entityId === currentProjectId;

							return (
								<div
									key={tab.id}
									className={cn(
										"group flex items-center gap-2 h-9 px-3 rounded-md text-sm transition-colors cursor-pointer",
										isActive
											? "bg-background border border-border shadow-sm"
											: "hover:bg-muted/50 text-muted-foreground hover:text-foreground",
									)}
									onClick={() => setActiveTab(tab.id)}
									onKeyDown={(e) => {
										if (e.key === "Enter" || e.key === " ") {
											setActiveTab(tab.id);
										}
									}}
								>
									<Icon className="h-4 w-4 flex-shrink-0" />
									<span className="truncate max-w-[120px]">{tab.label}</span>
									{!isCurrentProjectTab && (
										<Button
											variant="ghost"
											size="icon"
											className={cn(
												"h-5 w-5 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity",
												isActive && "opacity-60",
											)}
											onClick={(e) => {
												e.stopPropagation();
												closeTab(tab.id);
											}}
										>
											<X className="h-3 w-3" />
										</Button>
									)}
								</div>
							);
						})}
					</div>
					<ScrollBar orientation="horizontal" />
				</ScrollArea>

				{/* Right sidebar toggle */}
				{!rightSidebarOpen && (
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8 flex-shrink-0"
						onClick={toggleRightSidebar}
					>
						<PanelRight className="h-4 w-4" />
					</Button>
				)}
			</div>

			{/* Content Area */}
			<div className="flex-1 overflow-hidden">
				{activeTab ? (
					<TabContent tab={activeTab} />
				) : (
					<EmptyState />
				)}
			</div>
		</div>
	);
}

function TabContent({ tab }: { tab: Tab }) {
	switch (tab.type) {
		case "project":
			return <ProjectView projectId={tab.entityId} />;
		case "character":
			return <CharacterView characterId={tab.entityId} />;
		case "animation":
			return <AnimationView animationId={tab.entityId} />;
		case "asset":
			return <AssetView assetId={tab.entityId} />;
		default:
			return <EmptyState />;
	}
}

function EmptyState() {
	const { currentProject, openTab } = useAppStore();

	return (
		<div className="h-full flex flex-col items-center justify-center text-center p-8">
			<div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
				<FolderOpen className="h-8 w-8 text-muted-foreground" />
			</div>
			<h3 className="text-lg font-medium text-foreground mb-1">
				No tabs open
			</h3>
			<p className="text-sm text-muted-foreground mb-4 max-w-sm">
				Select a character or animation from the sidebar, or open the project
				view to get started.
			</p>
			{currentProject && (
				<Button
					variant="outline"
					onClick={() =>
						openTab("project", currentProject.id, currentProject.name)
					}
				>
					<FolderOpen className="h-4 w-4 mr-2" />
					Open {currentProject.name}
				</Button>
			)}
		</div>
	);
}
