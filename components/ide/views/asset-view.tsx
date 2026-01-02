"use client";

import { useEffect, useState } from "react";
import { Loader2, Image as ImageIcon } from "lucide-react";
import { useAppStore, type Asset } from "@/lib/store";

interface AssetViewProps {
  assetId: string;
}

export function AssetView({ assetId }: AssetViewProps) {
  const { setActionContext } = useAppStore();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAsset = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/assets/${assetId}`);
        if (res.ok) {
          const data = await res.json();
          setAsset(data);
          setActionContext({ type: "view-asset", asset: data });
        }
      } catch (error) {
        console.error("Failed to fetch asset:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAsset();
  }, [assetId, setActionContext]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Asset not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center p-8 bg-muted/20">
      <img
        src={asset.filePath}
        alt="Asset"
        className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
      />
    </div>
  );
}
