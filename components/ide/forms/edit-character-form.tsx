"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAppStore, type CharacterWithAssets } from "@/lib/store";

interface EditCharacterFormProps {
	character: CharacterWithAssets;
}

export function EditCharacterForm({ character }: EditCharacterFormProps) {
	const { clearActionContext, refreshCurrentProject } = useAppStore();

	const [name, setName] = useState(character.name);
	const [prompt, setPrompt] = useState(character.userPrompt || "");
	const [isLoading, setIsLoading] = useState(false);

	const hasChanges =
		name.trim() !== character.name ||
		(prompt.trim() || null) !== character.userPrompt;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!name.trim()) {
			toast.error("Please enter a character name");
			return;
		}

		setIsLoading(true);

		try {
			const res = await fetch(`/api/characters/${character.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: name.trim(),
					userPrompt: prompt.trim() || null,
				}),
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Failed to update character");
			}

			toast.success(`Character "${name}" updated`);
			clearActionContext();
			await refreshCurrentProject();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to update character"
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			{/* Preview */}
			{character.primaryAsset && (
				<div className="flex justify-center">
					<div className="w-24 h-24 rounded-lg bg-muted border border-border overflow-hidden">
						<img
							src={character.primaryAsset.filePath}
							alt={character.name}
							className="w-full h-full object-cover"
						/>
					</div>
				</div>
			)}

			{/* Name */}
			<div className="space-y-2">
				<Label htmlFor="name">Name</Label>
				<Input
					id="name"
					placeholder="Character name"
					value={name}
					onChange={(e) => setName(e.target.value)}
					disabled={isLoading}
				/>
			</div>

			{/* Description */}
			<div className="space-y-2">
				<Label htmlFor="prompt">Description</Label>
				<Textarea
					id="prompt"
					placeholder="Describe your character..."
					value={prompt}
					onChange={(e) => setPrompt(e.target.value)}
					rows={4}
					disabled={isLoading}
				/>
			</div>

			{/* Actions */}
			<div className="flex gap-2 pt-2">
				<Button
					type="button"
					variant="outline"
					className="flex-1"
					onClick={clearActionContext}
					disabled={isLoading}
				>
					Cancel
				</Button>
				<Button
					type="submit"
					className="flex-1"
					disabled={isLoading || !hasChanges}
				>
					{isLoading ? (
						<>
							<Loader2 className="h-4 w-4 mr-2 animate-spin" />
							Saving...
						</>
					) : (
						"Save Changes"
					)}
				</Button>
			</div>
		</form>
	);
}
