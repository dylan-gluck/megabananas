"use client";

import { PanelRightClose, X, Sparkles, Film, Wand2, Copy, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { NewCharacterForm } from "./forms/new-character-form";
import { NewAnimationForm } from "./forms/new-animation-form";
import { EditCharacterForm } from "./forms/edit-character-form";
import { GenerateVariationForm } from "./forms/generate-variation-form";
import { NewFrameForm } from "./forms/new-frame-form";
import { AssetMetadataPanel } from "./forms/asset-metadata-panel";

export function RightSidebar() {
	const { actionContext, clearActionContext, toggleRightSidebar } =
		useAppStore();

	return (
		<div className="h-full flex flex-col bg-sidebar border-l border-sidebar-border">
			{/* Header */}
			<div className="h-14 flex items-center justify-between px-4 border-b border-sidebar-border">
				<div className="flex items-center gap-2">
					<ActionContextIcon />
					<span className="text-sm font-medium text-sidebar-foreground">
						<ActionContextTitle />
					</span>
				</div>
				<div className="flex items-center gap-1">
					{actionContext.type !== "none" && (
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 text-muted-foreground"
							onClick={clearActionContext}
						>
							<X className="h-4 w-4" />
						</Button>
					)}
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8 text-muted-foreground"
						onClick={toggleRightSidebar}
					>
						<PanelRightClose className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{/* Content */}
			<div className="flex-1 min-h-0 overflow-hidden">
				<ActionContextContent />
			</div>
		</div>
	);
}

function ActionContextIcon() {
	const { actionContext } = useAppStore();

	const iconClass = "h-4 w-4 text-primary";

	switch (actionContext.type) {
		case "new-character":
		case "edit-character":
			return <Sparkles className={iconClass} />;
		case "generate-variation":
			return <Copy className={iconClass} />;
		case "new-animation":
		case "edit-animation":
		case "new-frame":
			return <Film className={iconClass} />;
		case "view-asset":
			return <ImageIcon className={iconClass} />;
		default:
			return <Wand2 className={iconClass} />;
	}
}

function ActionContextTitle() {
	const { actionContext } = useAppStore();

	switch (actionContext.type) {
		case "new-character":
			return "New Character";
		case "edit-character":
			return `Edit ${actionContext.character.name}`;
		case "generate-variation":
			return `Variation: ${actionContext.character.name}`;
		case "new-animation":
			return "New Animation";
		case "edit-animation":
			return `Edit ${actionContext.animation.name}`;
		case "new-frame":
			return `New Frame: ${actionContext.animation.name}`;
		case "view-asset":
			return "Asset Details";
		default:
			return "Actions";
	}
}

function ActionContextContent() {
	const { actionContext, currentProject } = useAppStore();

	switch (actionContext.type) {
		case "new-character":
			return <NewCharacterForm projectId={actionContext.projectId} />;
		case "new-animation":
			return (
				<NewAnimationForm
					projectId={actionContext.projectId}
					characterId={actionContext.characterId}
				/>
			);
		case "edit-character":
			return <EditCharacterForm character={actionContext.character} />;
		case "generate-variation":
			return <GenerateVariationForm character={actionContext.character} />;
		case "view-asset":
			return <AssetMetadataPanel asset={actionContext.asset} />;
		case "edit-animation":
			return (
				<div className="p-4 text-sm text-muted-foreground">
					<p>Animation editing form will be here.</p>
					<p className="mt-2">Animation: {actionContext.animation.name}</p>
				</div>
			);
		case "new-frame":
			return <NewFrameForm animation={actionContext.animation} />;
		default:
			return <EmptyActionState hasProject={!!currentProject} />;
	}
}

function EmptyActionState({ hasProject }: { hasProject: boolean }) {
	const { setActionContext, currentProject } = useAppStore();

	if (!hasProject) {
		return (
			<div className="text-center py-8 px-4">
				<div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
					<Wand2 className="h-6 w-6 text-muted-foreground" />
				</div>
				<p className="text-sm text-muted-foreground">
					Select a project to get started
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-3 p-4">
			<p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
				Quick Actions
			</p>
			<div className="space-y-2">
				<Button
					variant="outline"
					className="w-full justify-start h-12"
					onClick={() =>
						currentProject &&
						setActionContext({
							type: "new-character",
							projectId: currentProject.id,
						})
					}
				>
					<div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center mr-3">
						<Sparkles className="h-4 w-4 text-primary" />
					</div>
					<div className="text-left">
						<div className="text-sm font-medium">New Character</div>
						<div className="text-xs text-muted-foreground">
							Generate a character
						</div>
					</div>
				</Button>

				<Button
					variant="outline"
					className="w-full justify-start h-12"
					onClick={() =>
						currentProject &&
						setActionContext({
							type: "new-animation",
							projectId: currentProject.id,
						})
					}
				>
					<div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center mr-3">
						<Film className="h-4 w-4 text-primary" />
					</div>
					<div className="text-left">
						<div className="text-sm font-medium">New Animation</div>
						<div className="text-xs text-muted-foreground">
							Create animation sequence
						</div>
					</div>
				</Button>
			</div>
		</div>
	);
}
