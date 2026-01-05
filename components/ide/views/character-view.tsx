"use client";

import { useEffect, useState } from "react";
import {
	Sparkles,
	Film,
	Plus,
	Calendar,
	Edit,
	Loader2,
	Image as ImageIcon,
	Trash2,
	Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AssetThumbnail } from "@/components/ui/asset-thumbnail";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
	useAppStore,
	type CharacterWithAssets,
	type AnimationWithFrames,
	type SpriteSheetWithAsset,
	type Project,
} from "@/lib/store";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface CharacterWithProject extends CharacterWithAssets {
	project: Project;
}

interface CharacterViewProps {
	characterId: string;
}

export function CharacterView({ characterId }: CharacterViewProps) {
	const { openTab, setActionContext, refreshCurrentProject, closeTab, currentProject } = useAppStore();
	const [character, setCharacter] = useState<CharacterWithProject | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [settingPrimary, setSettingPrimary] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const fetchCharacter = async (showLoading = true) => {
		if (showLoading) setIsLoading(true);
		try {
			const res = await fetch(`/api/characters/${characterId}`);
			if (res.ok) {
				const data = await res.json();
				setCharacter(data);
			}
		} catch (error) {
			console.error("Failed to fetch character:", error);
		} finally {
			setIsLoading(false);
		}
	};

	// Initial fetch
	useEffect(() => {
		fetchCharacter(true);
	}, [characterId]);

	// Refetch without loading spinner when project updates (e.g., after generating variation)
	useEffect(() => {
		if (character) {
			fetchCharacter(false);
		}
	}, [currentProject]);

	const handleSetPrimary = async (assetId: string) => {
		setSettingPrimary(assetId);
		try {
			const res = await fetch(`/api/characters/${characterId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ primaryAssetId: assetId }),
			});

			if (res.ok) {
				toast.success("Primary asset updated");
				await fetchCharacter();
				await refreshCurrentProject();
			} else {
				toast.error("Failed to update primary asset");
			}
		} catch {
			toast.error("Failed to update primary asset");
		} finally {
			setSettingPrimary(null);
		}
	};

	const handleDelete = async () => {
		setIsDeleting(true);
		try {
			const res = await fetch(`/api/characters/${characterId}`, {
				method: "DELETE",
			});

			if (res.ok) {
				toast.success(`Character "${character?.name}" deleted`);
				closeTab(`character-${characterId}`);
				await refreshCurrentProject();
			} else {
				const data = await res.json();
				toast.error(data.error || "Failed to delete character");
			}
		} catch {
			toast.error("Failed to delete character");
		} finally {
			setIsDeleting(false);
		}
	};

	if (isLoading) {
		return (
			<div className="h-full flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!character) {
		return (
			<div className="h-full flex items-center justify-center">
				<p className="text-muted-foreground">Character not found</p>
			</div>
		);
	}

	const primaryAsset = character.primaryAsset;

	return (
		<ScrollArea className="h-full">
			<div className="p-6 max-w-5xl mx-auto space-y-8">
				{/* Header */}
				<div className="flex gap-6">
					{/* Primary Image */}
					<div className="w-48 h-48 rounded-lg bg-muted border border-border overflow-hidden flex-shrink-0">
						{primaryAsset ? (
							<img
								src={primaryAsset.filePath}
								alt={character.name}
								className="w-full h-full object-cover"
							/>
						) : (
							<div className="w-full h-full flex items-center justify-center">
								<Sparkles className="h-12 w-12 text-muted-foreground" />
							</div>
						)}
					</div>

					{/* Info */}
					<div className="flex-1 space-y-3">
						<div className="flex items-start justify-between">
							<div>
								<h1 className="text-2xl font-bold text-foreground">
									{character.name}
								</h1>
								<p className="text-sm text-muted-foreground">
									{character.project.name}
								</p>
							</div>
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() =>
										setActionContext({
											type: "edit-character",
											character: character,
										})
									}
								>
									<Edit className="h-4 w-4 mr-1" />
									Edit
								</Button>
								<AlertDialog>
									<AlertDialogTrigger asChild>
										<Button
											variant="outline"
											size="sm"
											className="text-destructive hover:text-destructive"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</AlertDialogTrigger>
									<AlertDialogContent>
										<AlertDialogHeader>
											<AlertDialogTitle>Delete Character</AlertDialogTitle>
											<AlertDialogDescription>
												Are you sure you want to delete "{character.name}"? This
												will also delete all associated variations and animations.
												This action cannot be undone.
											</AlertDialogDescription>
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogCancel>Cancel</AlertDialogCancel>
											<AlertDialogAction
												onClick={handleDelete}
												disabled={isDeleting}
												className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
											>
												{isDeleting ? (
													<>
														<Loader2 className="h-4 w-4 mr-2 animate-spin" />
														Deleting...
													</>
												) : (
													"Delete"
												)}
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							</div>
						</div>

						{character.userPrompt && (
							<p className="text-sm text-muted-foreground">
								{character.userPrompt}
							</p>
						)}

						<div className="flex items-center gap-4 text-sm text-muted-foreground">
							<span className="flex items-center gap-1">
								<Calendar className="h-4 w-4" />
								Created{" "}
								{formatDistanceToNow(new Date(character.createdAt), {
									addSuffix: true,
								})}
							</span>
							<span>{character.assets.length} variations</span>
							<span>{character.animations.length} animations</span>
							<span>{character.spriteSheets.length} sprite sheets</span>
						</div>
					</div>
				</div>

				{/* Variations Gallery */}
				<section className="space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="text-lg font-semibold flex items-center gap-2">
							<ImageIcon className="h-5 w-5 text-primary" />
							Variations
						</h2>
						<Button
							size="sm"
							variant="outline"
							onClick={() =>
								setActionContext({
									type: "generate-variation",
									character: character,
								})
							}
						>
							<Plus className="h-4 w-4 mr-1" />
							Generate Variation
						</Button>
					</div>

					{character.assets.length === 0 && !primaryAsset ? (
						<div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
							<div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
								<ImageIcon className="h-6 w-6 text-muted-foreground" />
							</div>
							<h3 className="text-sm font-medium text-foreground mb-1">
								No variations yet
							</h3>
							<p className="text-sm text-muted-foreground mb-4">
								Generate variations of this character
							</p>
						</div>
					) : (
						<div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
							{/* Primary asset first */}
							{primaryAsset && (
								<AssetThumbnail
									asset={primaryAsset}
									isPrimary
									isSettingPrimary={settingPrimary === primaryAsset.id}
									onSetPrimary={() => handleSetPrimary(primaryAsset.id)}
								/>
							)}
							{/* Other variations */}
							{character.assets
								.filter((a) => a.id !== primaryAsset?.id)
								.map((asset) => (
									<AssetThumbnail
										key={asset.id}
										asset={asset}
										isPrimary={false}
										isSettingPrimary={settingPrimary === asset.id}
										onSetPrimary={() => handleSetPrimary(asset.id)}
									/>
								))}
						</div>
					)}
				</section>

				{/* Animations */}
				<section className="space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="text-lg font-semibold flex items-center gap-2">
							<Film className="h-5 w-5 text-primary" />
							Animations
						</h2>
						<Button
							size="sm"
							onClick={() =>
								setActionContext({
									type: "new-animation",
									projectId: character.projectId,
									characterId: character.id,
								})
							}
						>
							<Plus className="h-4 w-4 mr-1" />
							New Animation
						</Button>
					</div>

					{character.animations.length === 0 ? (
						<div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
							<div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
								<Film className="h-6 w-6 text-muted-foreground" />
							</div>
							<h3 className="text-sm font-medium text-foreground mb-1">
								No animations yet
							</h3>
							<p className="text-sm text-muted-foreground mb-4">
								Create an animation sequence for this character
							</p>
							<Button
								size="sm"
								variant="outline"
								onClick={() =>
									setActionContext({
										type: "new-animation",
										projectId: character.projectId,
										characterId: character.id,
									})
								}
							>
								<Plus className="h-4 w-4 mr-1" />
								Create Animation
							</Button>
						</div>
					) : (
						<div className="space-y-2">
							{character.animations.map((animation) => (
								<AnimationRow
									key={animation.id}
									animation={animation}
									onClick={() =>
										openTab("animation", animation.id, animation.name)
									}
								/>
							))}
						</div>
					)}
				</section>

				{/* Sprite Sheets */}
				<section className="space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="text-lg font-semibold flex items-center gap-2">
							<Layers className="h-5 w-5 text-primary" />
							Sprite Sheets
						</h2>
						<Button
							size="sm"
							onClick={() =>
								setActionContext({
									type: "new-spritesheet",
									projectId: character.projectId,
									characterId: character.id,
								})
							}
						>
							<Plus className="h-4 w-4 mr-1" />
							New Sprite Sheet
						</Button>
					</div>

					{(!character.spriteSheets || character.spriteSheets.length === 0) ? (
						<div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
							<div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
								<Layers className="h-6 w-6 text-muted-foreground" />
							</div>
							<h3 className="text-sm font-medium text-foreground mb-1">
								No sprite sheets yet
							</h3>
							<p className="text-sm text-muted-foreground mb-4">
								Generate a sprite sheet grid for this character
							</p>
							<Button
								size="sm"
								variant="outline"
								onClick={() =>
									setActionContext({
										type: "new-spritesheet",
										projectId: character.projectId,
										characterId: character.id,
									})
								}
							>
								<Plus className="h-4 w-4 mr-1" />
								Create Sprite Sheet
							</Button>
						</div>
					) : (
						<div className="space-y-2">
							{character.spriteSheets.map((spriteSheet) => (
								<SpriteSheetRow
									key={spriteSheet.id}
									spriteSheet={spriteSheet}
									onClick={() =>
										openTab("spritesheet", spriteSheet.id, spriteSheet.name)
									}
								/>
							))}
						</div>
					)}
				</section>
			</div>
		</ScrollArea>
	);
}

function AnimationRow({
	animation,
	onClick,
}: {
	animation: AnimationWithFrames;
	onClick: () => void;
}) {
	const firstFrame = animation.frames[0]?.asset?.filePath;

	return (
		<div
			className={cn(
				"flex items-center gap-4 p-3 rounded-lg border border-border bg-card cursor-pointer",
				"hover:border-primary/50 hover:shadow-sm transition-all",
			)}
			onClick={onClick}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") onClick();
			}}
		>
			<div className="w-12 h-12 rounded bg-muted flex-shrink-0 overflow-hidden">
				{firstFrame ? (
					<img
						src={firstFrame}
						alt={animation.name}
						className="w-full h-full object-cover"
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center">
						<Film className="h-5 w-5 text-muted-foreground" />
					</div>
				)}
			</div>
			<div className="flex-1 min-w-0">
				<h3 className="font-medium text-sm">{animation.name}</h3>
				{animation.description && (
					<p className="text-xs text-muted-foreground truncate">
						{animation.description}
					</p>
				)}
			</div>
			<div className="text-sm text-muted-foreground">
				{animation.frames.length} frames
			</div>
		</div>
	);
}

function SpriteSheetRow({
	spriteSheet,
	onClick,
}: {
	spriteSheet: SpriteSheetWithAsset;
	onClick: () => void;
}) {
	const thumbnailPath = spriteSheet.asset?.filePath;
	const frameCount = spriteSheet.generationSettings?.frameCount ?? 0;

	return (
		<div
			className={cn(
				"flex items-center gap-4 p-3 rounded-lg border border-border bg-card cursor-pointer",
				"hover:border-primary/50 hover:shadow-sm transition-all",
			)}
			onClick={onClick}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") onClick();
			}}
		>
			<div className="w-24 aspect-[21/9] rounded bg-muted flex-shrink-0 overflow-hidden">
				{thumbnailPath ? (
					<img
						src={thumbnailPath}
						alt={spriteSheet.name}
						className="w-full h-full object-cover"
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center">
						<Layers className="h-6 w-6 text-muted-foreground" />
					</div>
				)}
			</div>
			<div className="flex-1 min-w-0">
				<h3 className="font-medium text-sm">{spriteSheet.name}</h3>
				{spriteSheet.description && (
					<p className="text-xs text-muted-foreground truncate">
						{spriteSheet.description}
					</p>
				)}
			</div>
			<div className="text-sm text-muted-foreground">
				{frameCount} frames
			</div>
		</div>
	);
}
