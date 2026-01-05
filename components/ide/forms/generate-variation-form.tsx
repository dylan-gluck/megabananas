"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useAppStore, type Asset, type CharacterWithAssets } from "@/lib/store";
import {
	characterPresets,
	buildSystemPrompt,
} from "@/lib/config/character-presets";

interface GenerateVariationFormProps {
	character: CharacterWithAssets;
}

type GenerationStatus = "idle" | "generating" | "saving" | "complete" | "failed";

export function GenerateVariationForm({
	character,
}: GenerateVariationFormProps) {
	const { clearActionContext, refreshCurrentProject } = useAppStore();

	// Form state - pre-fill with character's existing prompt if available
	const [prompt, setPrompt] = useState(character.userPrompt || "");

	// Preset state
	const [backgroundPreset, setBackgroundPreset] = useState("white");
	const [stylePreset, setStylePreset] = useState("pixel-art");
	const [anglePreset, setAnglePreset] = useState("front");

	// Reference assets - include character's existing assets as potential references
	const [selectedReferenceIds, setSelectedReferenceIds] = useState<string[]>(
		character.primaryAsset ? [character.primaryAsset.id] : []
	);
	const [projectAssets, setProjectAssets] = useState<Asset[]>([]);

	// Generation status
	const [status, setStatus] = useState<GenerationStatus>("idle");

	const isLoading = status !== "idle" && status !== "complete" && status !== "failed";

	// Fetch project assets for base64 conversion
	useEffect(() => {
		const fetchAssets = async () => {
			try {
				const res = await fetch(`/api/projects/${character.projectId}/assets`);
				const data = await res.json();
				setProjectAssets(data.assets || []);
			} catch (error) {
				console.error("Failed to fetch assets:", error);
			}
		};
		fetchAssets();
	}, [character.projectId]);

	const getStatusMessage = () => {
		switch (status) {
			case "generating":
				return "Generating variation...";
			case "saving":
				return "Saving asset...";
			default:
				return "";
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			// Step 1: Generate image
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
					prompt: prompt.trim() || character.name,
					systemPrompt,
					referenceImages,
					aspectRatio: "1:1",
				}),
			});

			if (!genRes.ok) {
				const data = await genRes.json();
				throw new Error(data.error || "Failed to generate image");
			}

			const genResult = await genRes.json();

			// Step 2: Create asset record
			setStatus("saving");

			const assetRes = await fetch("/api/assets", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					projectId: character.projectId,
					filePath: genResult.filePath,
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

			setStatus("complete");
			toast.success(`Variation generated for "${character.name}"`);
			clearActionContext();
			await refreshCurrentProject();
		} catch (err) {
			setStatus("failed");
			toast.error(
				err instanceof Error ? err.message : "Failed to generate variation"
			);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="h-full flex flex-col">
			{/* Scrollable content */}
			<div className="flex-1 overflow-y-auto p-4 space-y-4">
				{/* Character info */}
				<div className="p-3 rounded-lg bg-muted/50 border border-border">
					<p className="text-sm font-medium">{character.name}</p>
					{character.userPrompt && (
						<p className="text-xs text-muted-foreground mt-1 line-clamp-2">
							{character.userPrompt}
						</p>
					)}
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

				{/* Description override */}
				<div className="space-y-2">
					<Label htmlFor="prompt">Description Override</Label>
					<Textarea
						id="prompt"
						placeholder="Modify the character description for this variation..."
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
						projectId={character.projectId}
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
								Generating...
							</>
						) : (
							"Generate Variation"
						)}
					</Button>
				</div>
			</div>
		</form>
	);
}
