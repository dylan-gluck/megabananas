"use client";

import { useEffect, useState } from "react";
import {
	Sparkles,
	Film,
	Plus,
	Calendar,
	MoreVertical,
	Loader2,
	X,
	Check,
	ImagePlus,
	Trash2,
	Upload,
	Palette,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
	useAppStore,
	type ProjectWithRelations,
	type CharacterWithAssets,
	type AnimationWithFrames,
	type Asset,
} from "@/lib/store";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface ProjectViewProps {
	projectId: string;
}

export function ProjectView({ projectId }: ProjectViewProps) {
	const { currentProject, openTab, setActionContext, refreshCurrentProject } = useAppStore();
	const [project, setProject] = useState<ProjectWithRelations | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [references, setReferences] = useState<Asset[]>([]);
	const [isUploadingRef, setIsUploadingRef] = useState(false);

	useEffect(() => {
		// Use current project if it matches, otherwise fetch
		if (currentProject?.id === projectId) {
			setProject(currentProject);
			setIsLoading(false);
		} else {
			fetchProject();
		}
	}, [projectId, currentProject]);

	const fetchProject = async () => {
		setIsLoading(true);
		try {
			const res = await fetch(`/api/projects/${projectId}`);
			if (res.ok) {
				const data = await res.json();
				setProject(data);
			}
		} catch (error) {
			console.error("Failed to fetch project:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const fetchReferences = async () => {
		try {
			const res = await fetch(`/api/projects/${projectId}/assets?type=reference`);
			if (res.ok) {
				const data = await res.json();
				setReferences(data.assets || []);
			}
		} catch (error) {
			console.error("Failed to fetch references:", error);
		}
	};

	useEffect(() => {
		fetchReferences();
	}, [projectId]);

	const handleReferenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files?.length) return;

		setIsUploadingRef(true);
		try {
			for (const file of Array.from(files)) {
				const reader = new FileReader();
				const base64 = await new Promise<string>((resolve, reject) => {
					reader.onload = () => resolve(reader.result as string);
					reader.onerror = reject;
					reader.readAsDataURL(file);
				});

				const res = await fetch(`/api/projects/${projectId}/references`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ image: base64, filename: file.name }),
				});

				if (!res.ok) throw new Error("Upload failed");
			}
			toast.success(`Uploaded ${files.length} reference${files.length > 1 ? "s" : ""}`);
			fetchReferences();
		} catch (error) {
			console.error("Failed to upload reference:", error);
			toast.error("Failed to upload reference");
		} finally {
			setIsUploadingRef(false);
			e.target.value = "";
		}
	};

	const handleDeleteReference = async (assetId: string) => {
		try {
			const res = await fetch(`/api/projects/${projectId}/references?assetId=${assetId}`, {
				method: "DELETE",
			});
			if (res.ok) {
				toast.success("Reference deleted");
				setReferences((prev) => prev.filter((r) => r.id !== assetId));
			} else {
				toast.error("Failed to delete reference");
			}
		} catch (error) {
			console.error("Failed to delete reference:", error);
			toast.error("Failed to delete reference");
		}
	};

	if (isLoading) {
		return (
			<div className="h-full flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!project) {
		return (
			<div className="h-full flex items-center justify-center">
				<p className="text-muted-foreground">Project not found</p>
			</div>
		);
	}

	return (
		<ScrollArea className="h-full">
			<div className="p-6 max-w-5xl mx-auto space-y-8">
				{/* Header */}
				<div className="space-y-2">
					<h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
					{project.description && (
						<p className="text-muted-foreground">{project.description}</p>
					)}
					<div className="flex items-center gap-4 text-sm text-muted-foreground">
						<span className="flex items-center gap-1">
							<Calendar className="h-4 w-4" />
							Created{" "}
							{formatDistanceToNow(new Date(project.createdAt), {
								addSuffix: true,
							})}
						</span>
						<span>{project.characters.length} characters</span>
						<span>{project.animations.length} animations</span>
					</div>
				</div>

				{/* Project Style Section */}
				{(project.artStyle || project.theme || project.colorPalette?.length > 0 || project.styleNotes) && (
					<section className="rounded-lg border border-border bg-card p-4 space-y-3">
						<h2 className="text-sm font-semibold flex items-center gap-2">
							<Palette className="h-4 w-4 text-primary" />
							Project Style
						</h2>
						<div className="flex flex-wrap gap-2">
							{project.artStyle && (
								<Badge variant="secondary">{project.artStyle}</Badge>
							)}
							{project.theme && (
								<Badge variant="outline">{project.theme}</Badge>
							)}
						</div>
						{project.colorPalette && project.colorPalette.length > 0 && (
							<div className="flex items-center gap-2">
								<span className="text-xs text-muted-foreground">Palette:</span>
								<div className="flex gap-1">
									{project.colorPalette.map((color, idx) => (
										<div
											key={idx}
											className="w-5 h-5 rounded border border-border"
											style={{ backgroundColor: color }}
											title={color}
										/>
									))}
								</div>
							</div>
						)}
						{project.styleNotes && (
							<p className="text-sm text-muted-foreground">{project.styleNotes}</p>
						)}
					</section>
				)}

				{/* Characters Grid */}
				<section className="space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="text-lg font-semibold flex items-center gap-2">
							<Sparkles className="h-5 w-5 text-primary" />
							Characters
						</h2>
						<Button
							size="sm"
							onClick={() =>
								setActionContext({ type: "new-character", projectId })
							}
						>
							<Plus className="h-4 w-4 mr-1" />
							New Character
						</Button>
					</div>

					{project.characters.length === 0 ? (
						<EmptySection
							icon={Sparkles}
							title="No characters yet"
							description="Create your first character to get started"
							action={() =>
								setActionContext({ type: "new-character", projectId })
							}
							actionLabel="Create Character"
						/>
					) : (
						<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
							{project.characters.map((character) => (
								<CharacterCard
									key={character.id}
									character={character}
									onClick={() =>
										openTab("character", character.id, character.name)
									}
									onEdit={() =>
										setActionContext({ type: "edit-character", character })
									}
									onDelete={async () => {
										const res = await fetch(`/api/characters/${character.id}`, { method: "DELETE" });
										if (res.ok) {
											toast.success(`Character "${character.name}" deleted`);
											await refreshCurrentProject();
										} else {
											toast.error("Failed to delete character");
										}
									}}
								/>
							))}
						</div>
					)}
				</section>

				{/* References Section */}
				<section className="space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="text-lg font-semibold flex items-center gap-2">
							<ImagePlus className="h-5 w-5 text-primary" />
							References
						</h2>
						<label>
							<input
								type="file"
								accept="image/*"
								multiple
								className="hidden"
								onChange={handleReferenceUpload}
								disabled={isUploadingRef}
							/>
							<Button size="sm" asChild disabled={isUploadingRef}>
								<span>
									{isUploadingRef ? (
										<Loader2 className="h-4 w-4 mr-1 animate-spin" />
									) : (
										<Upload className="h-4 w-4 mr-1" />
									)}
									Upload
								</span>
							</Button>
						</label>
					</div>

					{references.length === 0 ? (
						<div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
							<div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
								<ImagePlus className="h-6 w-6 text-muted-foreground" />
							</div>
							<h3 className="text-sm font-medium text-foreground mb-1">No reference images</h3>
							<p className="text-sm text-muted-foreground mb-4">
								Upload images to use as style references for character generation
							</p>
							<label>
								<input
									type="file"
									accept="image/*"
									multiple
									className="hidden"
									onChange={handleReferenceUpload}
									disabled={isUploadingRef}
								/>
								<Button size="sm" variant="outline" asChild disabled={isUploadingRef}>
									<span>
										<Upload className="h-4 w-4 mr-1" />
										Upload References
									</span>
								</Button>
							</label>
						</div>
					) : (
						<div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
							{references.map((ref) => (
								<div
									key={ref.id}
									className="group relative aspect-square rounded-lg overflow-hidden border border-border bg-muted"
								>
									<img
										src={ref.filePath}
										alt="Reference"
										className="w-full h-full object-cover"
									/>
									<button
										type="button"
										onClick={() => handleDeleteReference(ref.id)}
										className="absolute top-1 right-1 p-1 rounded bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
									>
										<Trash2 className="h-3 w-3" />
									</button>
								</div>
							))}
						</div>
					)}
				</section>

				{/* Animations Grid */}
				<section className="space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="text-lg font-semibold flex items-center gap-2">
							<Film className="h-5 w-5 text-primary" />
							Animations
						</h2>
						<Button
							size="sm"
							onClick={() =>
								setActionContext({ type: "new-animation", projectId })
							}
							disabled={project.characters.length === 0}
						>
							<Plus className="h-4 w-4 mr-1" />
							New Animation
						</Button>
					</div>

					{project.animations.length === 0 ? (
						<EmptySection
							icon={Film}
							title="No animations yet"
							description={
								project.characters.length === 0
									? "Create a character first, then add animations"
									: "Create an animation for one of your characters"
							}
							action={
								project.characters.length > 0
									? () =>
											setActionContext({ type: "new-animation", projectId })
									: undefined
							}
							actionLabel="Create Animation"
						/>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{project.animations.map((animation) => (
								<AnimationCard
									key={animation.id}
									animation={animation}
									onClick={() =>
										openTab("animation", animation.id, animation.name)
									}
									onEdit={() =>
										setActionContext({ type: "edit-animation", animation })
									}
									onDelete={async () => {
										const res = await fetch(`/api/animations/${animation.id}`, { method: "DELETE" });
										if (res.ok) {
											toast.success(`Animation "${animation.name}" deleted`);
											await refreshCurrentProject();
										} else {
											toast.error("Failed to delete animation");
										}
									}}
								/>
							))}
						</div>
					)}
				</section>
			</div>
		</ScrollArea>
	);
}

function CharacterCard({
	character,
	onClick,
	onEdit,
	onDelete,
}: {
	character: CharacterWithAssets;
	onClick: () => void;
	onEdit: () => void;
	onDelete: () => Promise<void>;
}) {
	const thumbnail = character.primaryAsset?.filePath;
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDelete = async () => {
		setIsDeleting(true);
		await onDelete();
		setIsDeleting(false);
		setConfirmDelete(false);
	};

	return (
		<div
			className={cn(
				"group relative rounded-lg border border-border bg-card overflow-hidden cursor-pointer",
				"hover:border-primary/50 hover:shadow-md transition-all",
			)}
			onClick={onClick}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") onClick();
			}}
		>
			<div className="aspect-square bg-muted relative">
				{thumbnail ? (
					<img
						src={thumbnail}
						alt={character.name}
						className="w-full h-full object-cover"
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center">
						<Sparkles className="h-8 w-8 text-muted-foreground" />
					</div>
				)}
				<div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
					{confirmDelete ? (
						<div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
							<Button
								variant="destructive"
								size="icon"
								className="h-7 w-7"
								onClick={handleDelete}
								disabled={isDeleting}
							>
								{isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
							</Button>
							<Button
								variant="secondary"
								size="icon"
								className="h-7 w-7"
								onClick={() => setConfirmDelete(false)}
								disabled={isDeleting}
							>
								<X className="h-3 w-3" />
							</Button>
						</div>
					) : (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="secondary"
									size="icon"
									className="h-7 w-7"
									onClick={(e) => e.stopPropagation()}
								>
									<MoreVertical className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem onSelect={onEdit}>Edit</DropdownMenuItem>
								<DropdownMenuItem
									className="text-destructive"
									onSelect={() => setConfirmDelete(true)}
								>
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div>
			</div>
			<div className="p-3">
				<h3 className="font-medium text-sm truncate">{character.name}</h3>
				<p className="text-xs text-muted-foreground">
					{character.assets.length} variation
					{character.assets.length !== 1 ? "s" : ""}
				</p>
			</div>
		</div>
	);
}

function AnimationCard({
	animation,
	onClick,
	onEdit,
	onDelete,
}: {
	animation: AnimationWithFrames;
	onClick: () => void;
	onEdit: () => void;
	onDelete: () => Promise<void>;
}) {
	const firstFrame = animation.frames[0]?.asset?.filePath;
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDelete = async () => {
		setIsDeleting(true);
		await onDelete();
		setIsDeleting(false);
		setConfirmDelete(false);
	};

	return (
		<div
			className={cn(
				"group relative rounded-lg border border-border bg-card overflow-hidden cursor-pointer",
				"hover:border-primary/50 hover:shadow-md transition-all",
			)}
			onClick={onClick}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") onClick();
			}}
		>
			<div className="flex">
				<div className="w-20 h-20 bg-muted flex-shrink-0">
					{firstFrame ? (
						<img
							src={firstFrame}
							alt={animation.name}
							className="w-full h-full object-cover"
						/>
					) : (
						<div className="w-full h-full flex items-center justify-center">
							<Film className="h-6 w-6 text-muted-foreground" />
						</div>
					)}
				</div>
				<div className="flex-1 p-3 min-w-0">
					<h3 className="font-medium text-sm truncate">{animation.name}</h3>
					<p className="text-xs text-muted-foreground truncate">
						{animation.character.name}
					</p>
					<p className="text-xs text-muted-foreground mt-1">
						{animation.frames.length} frame
						{animation.frames.length !== 1 ? "s" : ""}
					</p>
				</div>
				<div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
					{confirmDelete ? (
						<div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
							<Button
								variant="destructive"
								size="icon"
								className="h-7 w-7"
								onClick={handleDelete}
								disabled={isDeleting}
							>
								{isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
							</Button>
							<Button
								variant="secondary"
								size="icon"
								className="h-7 w-7"
								onClick={() => setConfirmDelete(false)}
								disabled={isDeleting}
							>
								<X className="h-3 w-3" />
							</Button>
						</div>
					) : (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="secondary"
									size="icon"
									className="h-7 w-7"
									onClick={(e) => e.stopPropagation()}
								>
									<MoreVertical className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem onSelect={onEdit}>Edit</DropdownMenuItem>
								<DropdownMenuItem
									className="text-destructive"
									onSelect={() => setConfirmDelete(true)}
								>
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div>
			</div>
		</div>
	);
}

function EmptySection({
	icon: Icon,
	title,
	description,
	action,
	actionLabel,
}: {
	icon: React.ComponentType<{ className?: string }>;
	title: string;
	description: string;
	action?: () => void;
	actionLabel?: string;
}) {
	return (
		<div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
			<div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
				<Icon className="h-6 w-6 text-muted-foreground" />
			</div>
			<h3 className="text-sm font-medium text-foreground mb-1">{title}</h3>
			<p className="text-sm text-muted-foreground mb-4">{description}</p>
			{action && actionLabel && (
				<Button size="sm" variant="outline" onClick={action}>
					<Plus className="h-4 w-4 mr-1" />
					{actionLabel}
				</Button>
			)}
		</div>
	);
}
