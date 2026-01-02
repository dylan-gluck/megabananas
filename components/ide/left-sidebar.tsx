"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import {
	ChevronDown,
	ChevronRight,
	FolderOpen,
	Plus,
	Settings,
	Sparkles,
	Film,
	PanelLeftClose,
	Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
	useAppStore,
	type CharacterWithAssets,
	type AnimationWithFrames,
} from "@/lib/store";
import { cn } from "@/lib/utils";

interface ProjectListItem {
	id: string;
	name: string;
	description: string | null;
	thumbnailId: string | null;
	_count: {
		characters: number;
		animations: number;
	};
}

export function LeftSidebar() {
	const {
		currentProject,
		currentProjectId,
		setCurrentProject,
		setCurrentProjectId,
		openTab,
		setActionContext,
		toggleLeftSidebar,
		setIsLoadingProject,
	} = useAppStore();

	const [projects, setProjects] = useState<ProjectListItem[]>([]);
	const [charactersOpen, setCharactersOpen] = useState(true);
	const [animationsOpen, setAnimationsOpen] = useState(true);
	const [isLoadingProjects, setIsLoadingProjects] = useState(true);
	const [newProjectOpen, setNewProjectOpen] = useState(false);
	const [newProjectName, setNewProjectName] = useState("");
	const [newProjectDesc, setNewProjectDesc] = useState("");
	const [isCreatingProject, setIsCreatingProject] = useState(false);

	// Fetch projects list
	useEffect(() => {
		async function fetchProjects() {
			try {
				const res = await fetch("/api/projects");
				if (res.ok) {
					const data = await res.json();
					setProjects(data);
					// Auto-select first project if none selected
					if (!currentProjectId && data.length > 0) {
						setCurrentProjectId(data[0].id);
					}
				}
			} catch (error) {
				console.error("Failed to fetch projects:", error);
			} finally {
				setIsLoadingProjects(false);
			}
		}
		fetchProjects();
	}, [currentProjectId, setCurrentProjectId]);

	// Fetch current project details
	const fetchProjectDetails = useCallback(async () => {
		if (!currentProjectId) {
			setCurrentProject(null);
			return;
		}

		setIsLoadingProject(true);
		try {
			const res = await fetch(`/api/projects/${currentProjectId}`);
			if (res.ok) {
				const data = await res.json();
				setCurrentProject(data);
			}
		} catch (error) {
			console.error("Failed to fetch project:", error);
		} finally {
			setIsLoadingProject(false);
		}
	}, [currentProjectId, setCurrentProject, setIsLoadingProject]);

	useEffect(() => {
		fetchProjectDetails();
	}, [fetchProjectDetails]);

	const handleProjectSelect = (projectId: string) => {
		setCurrentProjectId(projectId);
	};

	const handleCharacterClick = (character: CharacterWithAssets) => {
		openTab("character", character.id, character.name);
	};

	const handleAnimationClick = (animation: AnimationWithFrames) => {
		openTab("animation", animation.id, animation.name);
	};

	const handleNewCharacter = () => {
		if (currentProject) {
			setActionContext({ type: "new-character", projectId: currentProject.id });
		}
	};

	const handleNewAnimation = () => {
		if (currentProject) {
			setActionContext({ type: "new-animation", projectId: currentProject.id });
		}
	};

	const handleProjectClick = () => {
		if (currentProject) {
			openTab("project", currentProject.id, currentProject.name);
		}
	};

	const handleCreateProject = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newProjectName.trim()) {
			toast.error("Please enter a project name");
			return;
		}

		setIsCreatingProject(true);
		try {
			const res = await fetch("/api/projects", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: newProjectName.trim(),
					description: newProjectDesc.trim() || null,
				}),
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Failed to create project");
			}

			const newProject = await res.json();
			setProjects((prev) => [{ ...newProject, _count: { characters: 0, animations: 0 } }, ...prev]);
			setCurrentProjectId(newProject.id);
			setNewProjectOpen(false);
			setNewProjectName("");
			setNewProjectDesc("");
			toast.success(`Project "${newProject.name}" created`);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to create project");
		} finally {
			setIsCreatingProject(false);
		}
	};

	return (
		<div className="h-full flex flex-col bg-sidebar border-r border-sidebar-border">
			{/* Header */}
			<div className="h-14 flex items-center justify-between px-4 border-b border-sidebar-border">
				<div className="flex items-center gap-3">
					<Image
						src="/logo.png"
						alt="Megabananas"
						width={32}
						height={32}
						className="w-8 h-8 rounded-lg"
					/>
					<span className="text-sm font-semibold text-sidebar-foreground tracking-tight">
						megabananas
					</span>
				</div>
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8 text-muted-foreground"
					onClick={toggleLeftSidebar}
				>
					<PanelLeftClose className="h-4 w-4" />
				</Button>
			</div>

			{/* Project Picker */}
			<div className="p-3 border-b border-sidebar-border">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="outline"
							className="w-full justify-between h-10 bg-sidebar-accent/50 border-sidebar-border"
						>
							<div className="flex items-center gap-2 truncate">
								<FolderOpen className="h-4 w-4 text-primary flex-shrink-0" />
								<span className="truncate">
									{currentProject?.name || "Select Project"}
								</span>
							</div>
							<ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start" className="w-[240px]">
						{isLoadingProjects ? (
							<DropdownMenuItem disabled>Loading...</DropdownMenuItem>
						) : projects.length === 0 ? (
							<DropdownMenuItem disabled>No projects</DropdownMenuItem>
						) : (
							projects.map((project) => (
								<DropdownMenuItem
									key={project.id}
									onClick={() => handleProjectSelect(project.id)}
									className={cn(
										currentProjectId === project.id && "bg-accent",
									)}
								>
									<FolderOpen className="h-4 w-4 mr-2" />
									<span className="flex-1 truncate">{project.name}</span>
									<span className="text-xs text-muted-foreground">
										{project._count.characters}c / {project._count.animations}a
									</span>
								</DropdownMenuItem>
							))
						)}
						<DropdownMenuSeparator />
						<DropdownMenuItem onSelect={() => setNewProjectOpen(true)}>
							<Plus className="h-4 w-4 mr-2" />
							New Project
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>

				{/* New Project Dialog */}
				<Dialog open={newProjectOpen} onOpenChange={setNewProjectOpen}>
					<DialogContent className="sm:max-w-md">
						<DialogHeader>
							<DialogTitle>Create New Project</DialogTitle>
						</DialogHeader>
						<form onSubmit={handleCreateProject} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="projectName">Name</Label>
								<Input
									id="projectName"
									placeholder="My Game Assets"
									value={newProjectName}
									onChange={(e) => setNewProjectName(e.target.value)}
									disabled={isCreatingProject}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="projectDesc">Description</Label>
								<Textarea
									id="projectDesc"
									placeholder="A collection of characters and animations..."
									value={newProjectDesc}
									onChange={(e) => setNewProjectDesc(e.target.value)}
									rows={3}
									disabled={isCreatingProject}
								/>
							</div>
							<div className="flex gap-2 pt-2">
								<Button
									type="button"
									variant="outline"
									className="flex-1"
									onClick={() => setNewProjectOpen(false)}
									disabled={isCreatingProject}
								>
									Cancel
								</Button>
								<Button type="submit" className="flex-1" disabled={isCreatingProject}>
									{isCreatingProject ? (
										<>
											<Loader2 className="h-4 w-4 mr-2 animate-spin" />
											Creating...
										</>
									) : (
										"Create Project"
									)}
								</Button>
							</div>
						</form>
					</DialogContent>
				</Dialog>

				{/* Project quick action */}
				{currentProject && (
					<Button
						variant="ghost"
						size="sm"
						className="w-full mt-2 justify-start text-muted-foreground hover:text-foreground"
						onClick={handleProjectClick}
					>
						<FolderOpen className="h-4 w-4 mr-2" />
						View Project Details
					</Button>
				)}
			</div>

			{/* Entity Tree */}
			<ScrollArea className="flex-1">
				<div className="p-3 space-y-2">
					{/* Characters Section */}
					<Collapsible open={charactersOpen} onOpenChange={setCharactersOpen}>
						<div className="flex items-center justify-between">
							<CollapsibleTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									className="w-full justify-start gap-2 px-2"
								>
									{charactersOpen ? (
										<ChevronDown className="h-4 w-4" />
									) : (
										<ChevronRight className="h-4 w-4" />
									)}
									<Sparkles className="h-4 w-4 text-primary" />
									<span className="flex-1 text-left text-sm font-medium">
										Characters
									</span>
									<span className="text-xs text-muted-foreground">
										{currentProject?.characters.length || 0}
									</span>
								</Button>
							</CollapsibleTrigger>
						</div>
						<CollapsibleContent className="pt-1">
							<div className="ml-4 pl-2 border-l border-sidebar-border space-y-0.5">
								{currentProject?.characters.map((character) => (
									<Button
										key={character.id}
										variant="ghost"
										size="sm"
										className="w-full justify-start h-8 px-2 text-sm font-normal"
										onClick={() => handleCharacterClick(character)}
									>
										<div
											className="w-5 h-5 rounded bg-muted flex-shrink-0 mr-2 overflow-hidden"
											style={{
												backgroundImage: character.primaryAsset
													? `url(${character.primaryAsset.filePath})`
													: undefined,
												backgroundSize: "cover",
												backgroundPosition: "center",
											}}
										/>
										<span className="truncate">{character.name}</span>
									</Button>
								))}
								{(!currentProject ||
									currentProject.characters.length === 0) && (
									<p className="text-xs text-muted-foreground px-2 py-1">
										No characters yet
									</p>
								)}
								<Button
									variant="ghost"
									size="sm"
									className="w-full justify-start h-8 px-2 text-sm text-muted-foreground"
									onClick={handleNewCharacter}
								>
									<Plus className="h-3 w-3 mr-2" />
									Add Character
								</Button>
							</div>
						</CollapsibleContent>
					</Collapsible>

					{/* Animations Section */}
					<Collapsible open={animationsOpen} onOpenChange={setAnimationsOpen}>
						<div className="flex items-center justify-between">
							<CollapsibleTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									className="w-full justify-start gap-2 px-2"
								>
									{animationsOpen ? (
										<ChevronDown className="h-4 w-4" />
									) : (
										<ChevronRight className="h-4 w-4" />
									)}
									<Film className="h-4 w-4 text-primary" />
									<span className="flex-1 text-left text-sm font-medium">
										Animations
									</span>
									<span className="text-xs text-muted-foreground">
										{currentProject?.animations.length || 0}
									</span>
								</Button>
							</CollapsibleTrigger>
						</div>
						<CollapsibleContent className="pt-1">
							<div className="ml-4 pl-2 border-l border-sidebar-border space-y-0.5">
								{currentProject?.animations.map((animation) => (
									<Button
										key={animation.id}
										variant="ghost"
										size="sm"
										className="w-full justify-start h-8 px-2 text-sm font-normal"
										onClick={() => handleAnimationClick(animation)}
									>
										<Film className="h-4 w-4 mr-2 text-muted-foreground" />
										<span className="truncate flex-1 text-left">{animation.name}</span>
										<span className="text-xs text-muted-foreground">
											{animation.frames.length}f
										</span>
									</Button>
								))}
								{(!currentProject ||
									currentProject.animations.length === 0) && (
									<p className="text-xs text-muted-foreground px-2 py-1">
										No animations yet
									</p>
								)}
								<Button
									variant="ghost"
									size="sm"
									className="w-full justify-start h-8 px-2 text-sm text-muted-foreground"
									onClick={handleNewAnimation}
								>
									<Plus className="h-3 w-3 mr-2" />
									Add Animation
								</Button>
							</div>
						</CollapsibleContent>
					</Collapsible>
				</div>
			</ScrollArea>

			{/* Bottom Section */}
			<div className="p-3 border-t border-sidebar-border space-y-1">
				<Button
					variant="ghost"
					size="sm"
					className="w-full justify-start text-muted-foreground hover:text-foreground"
				>
					<Settings className="h-4 w-4 mr-2" />
					Settings
				</Button>
			</div>
		</div>
	);
}
