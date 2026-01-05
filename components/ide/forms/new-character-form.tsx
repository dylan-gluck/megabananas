"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ReferenceImagePicker } from "@/components/ui/reference-image-picker";
import { toast } from "sonner";
import { useAppStore, type Asset } from "@/lib/store";
import {
	characterPresets,
	buildSystemPrompt,
} from "@/lib/config/character-presets";

interface NewCharacterFormProps {
	projectId: string;
}

type GenerationStatus =
	| "idle"
	| "creating"
	| "generating"
	| "saving"
	| "complete"
	| "failed";

export function NewCharacterForm({ projectId }: NewCharacterFormProps) {
	const { clearActionContext, refreshCurrentProject } = useAppStore();

	// Form state
	const [name, setName] = useState("");
	const [prompt, setPrompt] = useState("");

	// Preset state
	const [backgroundPreset, setBackgroundPreset] = useState("white");
	const [stylePreset, setStylePreset] = useState("pixel-art");
	const [anglePreset, setAnglePreset] = useState("front");

	// Reference assets
	const [selectedReferenceIds, setSelectedReferenceIds] = useState<string[]>(
		[]
	);
	const [projectAssets, setProjectAssets] = useState<Asset[]>([]);

	// Generation status
	const [status, setStatus] = useState<GenerationStatus>("idle");

	const isLoading = status !== "idle" && status !== "complete" && status !== "failed";

	// Fetch project assets for base64 conversion
	useEffect(() => {
		const fetchAssets = async () => {
			try {
				const res = await fetch(`/api/projects/${projectId}/assets`);
				const data = await res.json();
				setProjectAssets(data.assets || []);
			} catch (error) {
				console.error("Failed to fetch assets:", error);
			}
		};
		fetchAssets();
	}, [projectId]);

	const getStatusMessage = () => {
		switch (status) {
			case "creating":
				return "Creating character...";
			case "generating":
				return "Generating image...";
			case "saving":
				return "Saving asset...";
			default:
				return "";
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!name.trim()) {
			toast.error("Please enter a character name");
			return;
		}

		try {
			// Step 1: Create character in DB
			setStatus("creating");

			const characterRes = await fetch("/api/characters", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: name.trim(),
					projectId,
					userPrompt: prompt.trim() || null,
				}),
			});

			if (!characterRes.ok) {
				const data = await characterRes.json();
				throw new Error(data.error || "Failed to create character");
			}

			const character = await characterRes.json();

			// Step 2: Generate image
			setStatus("generating");

			const systemPrompt = buildSystemPrompt(
				backgroundPreset,
				stylePreset,
				anglePreset
			);

			// Get base64 data for selected reference assets
			const referenceImages: string[] = [];
			for (const assetId of selectedReferenceIds) {
				const asset = projectAssets.find((a) => a.id === assetId);
				if (asset) {
					try {
						const res = await fetch(asset.filePath);
						const blob = await res.blob();
						const base64 = await new Promise<string>((resolve, reject) => {
							const reader = new FileReader();
							reader.onload = () => resolve(reader.result as string);
							reader.onerror = reject;
							reader.readAsDataURL(blob);
						});
						referenceImages.push(base64);
					} catch {
						console.warn(`Failed to load reference asset: ${asset.filePath}`);
					}
				}
			}

			const genRes = await fetch("/api/gen-character", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					prompt: prompt.trim() || name.trim(),
					systemPrompt,
					referenceImages,
					aspectRatio: "1:1",
					projectId,
				}),
			});

			if (!genRes.ok) {
				const data = await genRes.json();
				throw new Error(data.error || "Failed to generate image");
			}

			const genResult = await genRes.json();

			// Step 3: Create asset record
			setStatus("saving");

			const assetRes = await fetch("/api/assets", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					projectId,
					filePath: `/assets/characters/${genResult.filename}`,
					systemPrompt,
					userPrompt: prompt.trim() || null,
					referenceAssetIds: selectedReferenceIds,
					generationSettings: {
						backgroundPreset,
						stylePreset,
						anglePreset,
						aspectRatio: "1:1",
					},
					characterId: character.id,
				}),
			});

			if (!assetRes.ok) {
				console.warn("Failed to create asset record, continuing...");
			}

			const asset = assetRes.ok ? await assetRes.json() : null;

			// Step 4: Update character with primary asset
			if (asset?.id) {
				await fetch(`/api/characters/${character.id}`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						primaryAssetId: asset.id,
					}),
				});
			}

			setStatus("complete");
			toast.success(`Character "${name}" created`);
			clearActionContext();
			await refreshCurrentProject();
		} catch (err) {
			setStatus("failed");
			toast.error(
				err instanceof Error ? err.message : "Failed to create character"
			);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="h-full flex flex-col">
			{/* Scrollable content */}
			<div className="flex-1 overflow-y-auto p-4 space-y-4">
				{/* Name */}
				<div className="space-y-2">
					<Label htmlFor="name">Name</Label>
					<Input
						id="name"
						placeholder="e.g., Knight, Wizard, Dragon"
						value={name}
						onChange={(e) => setName(e.target.value)}
						disabled={isLoading}
					/>
				</div>

				{/* Preset Dropdowns */}
				<div className="grid grid-cols-2 gap-2">
					<div className="space-y-1.5">
						<Label htmlFor="background" className="text-xs">
							Background
						</Label>
						<Select
							value={backgroundPreset}
							onValueChange={setBackgroundPreset}
							disabled={isLoading}
						>
							<SelectTrigger id="background" className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{characterPresets.backgroundColors.map((opt) => (
									<SelectItem key={opt.value} value={opt.value}>
										{opt.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="style" className="text-xs">
							Style
						</Label>
						<Select
							value={stylePreset}
							onValueChange={setStylePreset}
							disabled={isLoading}
						>
							<SelectTrigger id="style" className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{characterPresets.styles.map((opt) => (
									<SelectItem key={opt.value} value={opt.value}>
										{opt.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				<div className="space-y-1.5">
					<Label htmlFor="angle" className="text-xs">
						Angle
					</Label>
					<Select
						value={anglePreset}
						onValueChange={setAnglePreset}
						disabled={isLoading}
					>
						<SelectTrigger id="angle" className="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{characterPresets.angles.map((opt) => (
								<SelectItem key={opt.value} value={opt.value}>
									{opt.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Description */}
				<div className="space-y-2">
					<Label htmlFor="prompt">Description</Label>
					<Textarea
						id="prompt"
						placeholder="Describe your character's appearance, style, colors..."
						value={prompt}
						onChange={(e) => setPrompt(e.target.value)}
						rows={3}
						disabled={isLoading}
					/>
				</div>

				{/* Reference Images */}
				<div className="space-y-2 flex-1">
					<Label>Reference Images</Label>
					<ReferenceImagePicker
						projectId={projectId}
						value={selectedReferenceIds}
						onChange={setSelectedReferenceIds}
						disabled={isLoading}
					/>
				</div>
			</div>

			{/* Sticky footer */}
			<div className="shrink-0 border-t border-border bg-sidebar p-4 space-y-3">
				{/* Status indicator */}
				{isLoading && (
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<Loader2 className="h-4 w-4 animate-spin" />
						<span>{getStatusMessage()}</span>
					</div>
				)}

				{/* Actions */}
				<div className="flex gap-2">
					<Button
						type="button"
						variant="outline"
						className="flex-1"
						onClick={clearActionContext}
						disabled={isLoading}
					>
						Cancel
					</Button>
					<Button type="submit" className="flex-1" disabled={isLoading}>
						{isLoading ? (
							<>
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
								{status === "creating" && "Creating..."}
								{status === "generating" && "Generating..."}
								{status === "saving" && "Saving..."}
							</>
						) : (
							"Create Character"
						)}
					</Button>
				</div>
			</div>
		</form>
	);
}
