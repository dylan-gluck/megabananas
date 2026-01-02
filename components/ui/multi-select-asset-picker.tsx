"use client";

import { Check, FolderOpen, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Asset } from "@/lib/store";

type MultiSelectAssetPickerProps = {
	projectId: string;
	value: string[];
	onChange: (assetIds: string[]) => void;
	className?: string;
	disabled?: boolean;
};

export function MultiSelectAssetPicker({
	projectId,
	value,
	onChange,
	className,
	disabled = false,
}: MultiSelectAssetPickerProps) {
	const [assets, setAssets] = useState<Asset[]>([]);
	const [loading, setLoading] = useState(true);

	const fetchAssets = async () => {
		setLoading(true);
		try {
			const res = await fetch(`/api/projects/${projectId}/assets`);
			const data = await res.json();
			setAssets(data.assets || []);
		} catch (error) {
			console.error("Failed to fetch project assets:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (projectId) {
			fetchAssets();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [projectId]);

	const handleToggle = (assetId: string) => {
		if (disabled) return;

		if (value.includes(assetId)) {
			onChange(value.filter((id) => id !== assetId));
		} else {
			onChange([...value, assetId]);
		}
	};

	if (loading) {
		return (
			<div
				className={cn(
					"flex flex-col items-center justify-center h-28 text-muted-foreground rounded-xl bg-muted/20 border border-border/30",
					className
				)}
			>
				<RefreshCw className="w-4 h-4 animate-spin mb-2" />
				<span className="text-xs">Loading assets...</span>
			</div>
		);
	}

	if (assets.length === 0) {
		return (
			<div
				className={cn(
					"flex flex-col items-center justify-center h-28 text-muted-foreground rounded-xl bg-muted/20 border border-dashed border-border/50",
					className
				)}
			>
				<div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center mb-2">
					<FolderOpen className="w-4 h-4" />
				</div>
				<p className="text-xs">No reference images available</p>
				<Button
					variant="ghost"
					size="sm"
					onClick={fetchAssets}
					className="mt-1 h-6 text-xs"
				>
					<RefreshCw className="w-3 h-3 mr-1" />
					Refresh
				</Button>
			</div>
		);
	}

	return (
		<div className={cn(disabled && "opacity-50 pointer-events-none", className)}>
			<div className="flex items-center justify-between mb-2">
				<span className="text-xs text-muted-foreground">
					{value.length > 0
						? `${value.length} selected`
						: `${assets.length} available`}
				</span>
				<Button
					variant="ghost"
					size="sm"
					onClick={fetchAssets}
					className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
					disabled={disabled}
				>
					<RefreshCw className="w-3 h-3" />
				</Button>
			</div>
			<ScrollArea className="h-32 rounded-lg">
				<div className="grid grid-cols-4 gap-1.5 pr-3">
					{assets.map((asset) => {
						const isSelected = value.includes(asset.id);
						return (
							<button
								type="button"
								key={asset.id}
								onClick={() => handleToggle(asset.id)}
								disabled={disabled}
								className={cn(
									"group relative aspect-square rounded-lg overflow-hidden transition-all duration-150",
									isSelected
										? "ring-2 ring-primary ring-offset-1 ring-offset-background"
										: "hover:ring-1 hover:ring-border"
								)}
							>
								<div className="absolute inset-0 checkerboard" />
								<img
									src={asset.filePath}
									alt={`Asset ${asset.id}`}
									className="relative w-full h-full object-contain"
								/>
								{/* Selection overlay */}
								{isSelected && (
									<div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
										<div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-lg">
											<Check className="w-3 h-3 text-primary-foreground" />
										</div>
									</div>
								)}
								{/* Hover overlay */}
								{!isSelected && (
									<div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
										<div className="w-5 h-5 rounded-full bg-muted border border-border flex items-center justify-center">
											<Check className="w-2.5 h-2.5 text-muted-foreground" />
										</div>
									</div>
								)}
							</button>
						);
					})}
				</div>
			</ScrollArea>
		</div>
	);
}

/**
 * Utility to get base64 data for selected assets
 */
export async function getAssetBase64Data(
	assets: Asset[],
	selectedIds: string[]
): Promise<string[]> {
	const selectedAssets = assets.filter((a) => selectedIds.includes(a.id));

	const base64Promises = selectedAssets.map(async (asset) => {
		try {
			const res = await fetch(asset.filePath);
			const blob = await res.blob();
			return new Promise<string>((resolve, reject) => {
				const reader = new FileReader();
				reader.onload = () => resolve(reader.result as string);
				reader.onerror = reject;
				reader.readAsDataURL(blob);
			});
		} catch {
			return null;
		}
	});

	const results = await Promise.all(base64Promises);
	return results.filter((r): r is string => r !== null);
}
