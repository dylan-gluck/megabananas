"use client";

import { PanelRightClose, X, Sparkles, Film, Layers, Copy, Image as ImageIcon, Mountain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { NewCharacterForm } from "./forms/new-character-form";
import { NewAnimationForm } from "./forms/new-animation-form";
import { NewSpriteSheetForm } from "./forms/new-spritesheet-form";
import { EditCharacterForm } from "./forms/edit-character-form";
import { GenerateVariationForm } from "./forms/generate-variation-form";
import { NewFrameForm } from "./forms/new-frame-form";
import { AssetMetadataPanel } from "./forms/asset-metadata-panel";
import { NewSceneForm } from "./forms/new-scene-form";
import { EditSceneForm } from "./forms/edit-scene-form";

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
		case "new-spritesheet":
			return <Layers className={iconClass} />;
		case "view-asset":
			return <ImageIcon className={iconClass} />;
		case "new-scene":
		case "edit-scene":
			return <Mountain className={iconClass} />;
		default:
			return null;
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
		case "new-spritesheet":
			return "New Sprite Sheet";
		case "edit-animation":
			return `Edit ${actionContext.animation.name}`;
		case "new-frame":
			return `New Frame: ${actionContext.animation.name}`;
		case "view-asset":
			return "Asset Details";
		case "new-scene":
			return "New Scene";
		case "edit-scene":
			return `Edit ${actionContext.scene.name}`;
		default:
			return "";
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
		case "new-spritesheet":
			return (
				<NewSpriteSheetForm
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
		case "new-scene":
			return <NewSceneForm projectId={actionContext.projectId} />;
		case "edit-scene":
			return <EditSceneForm scene={actionContext.scene} />;
		default:
			return null;
	}
}
