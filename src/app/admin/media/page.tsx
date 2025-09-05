"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { HiUpload, HiPhotograph, HiTrash, HiEye } from "react-icons/hi";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import MediaUpload from "@/components/admin/MediaUpload";
import { mediaApi, MediaUploadResponse, MediaOwnerType } from "@/lib/api";

export default function AdminMediaPage() {
  const [allMedia, setAllMedia] = useState<MediaUploadResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedOwnerType, setSelectedOwnerType] =
    useState<MediaOwnerType>("PRODUCT");
  const [ownerId, setOwnerId] = useState("prod-1"); // Default for testing

  useEffect(() => {
    loadMedia();
  }, [selectedOwnerType, ownerId]);

  const loadMedia = async () => {
    try {
      const data = await mediaApi.getMediaByOwner(selectedOwnerType, ownerId);
      setAllMedia(data);
    } catch (error) {
      console.error("Failed to load media:", error);
      toast.error("Failed to load media");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm("Are you sure you want to delete this media?")) return;

    try {
      await mediaApi.deleteMedia(mediaId);
      setAllMedia((prev) => prev.filter((m) => m.id !== mediaId));
      toast.success("Media deleted successfully");
    } catch (error) {
      console.error("Failed to delete media:", error);
      toast.error("Failed to delete media");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">
            Media Management
          </h1>
          <p className="text-foreground-secondary">
            Manage images, videos, and documents
          </p>
        </div>
        <Button onClick={() => setShowUpload(!showUpload)}>
          <HiUpload className="w-5 h-5 mr-2" />
          {showUpload ? "Hide Upload" : "Upload Media"}
        </Button>
      </div>

      {/* Owner Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter by Owner</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Owner Type
              </label>
              <select
                value={selectedOwnerType}
                onChange={(e) =>
                  setSelectedOwnerType(e.target.value as MediaOwnerType)
                }
                className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-surface"
              >
                <option value="PRODUCT">Product</option>
                <option value="VARIANT">Product Variant</option>
                <option value="BRAND">Brand</option>
                <option value="CATEGORY">Category</option>
                <option value="USER">User</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Owner ID</label>
              <input
                type="text"
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                placeholder="Enter owner ID (e.g., prod-1)"
                className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-surface"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Section */}
      {showUpload && (
        <Card>
          <CardHeader>
            <CardTitle>Upload New Media</CardTitle>
          </CardHeader>
          <CardContent>
            <MediaUpload
              ownerType={selectedOwnerType}
              ownerId={ownerId}
              mediaType="IMAGE"
              maxFiles={10}
              onUploadComplete={(media) => {
                setAllMedia((prev) => [...prev, ...media]);
                toast.success("Media uploaded successfully");
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Media Gallery */}
      <Card>
        <CardHeader>
          <CardTitle>
            Media Gallery ({allMedia.length})
            <span className="text-sm font-normal text-foreground-secondary ml-2">
              for {selectedOwnerType}: {ownerId}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allMedia.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {allMedia.map((media) => (
                <MediaItem
                  key={media.id}
                  media={media}
                  onDelete={handleDeleteMedia}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <HiPhotograph className="w-16 h-16 text-foreground-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No media found
              </h3>
              <p className="text-foreground-secondary mb-4">
                Upload some media files to get started
              </p>
              <Button onClick={() => setShowUpload(true)}>
                <HiUpload className="w-5 h-5 mr-2" />
                Upload Media
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Media Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground-secondary">
                  Total Media
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {allMedia.length}
                </p>
              </div>
              <HiPhotograph className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground-secondary">
                  Images
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {allMedia.filter((m) => m.type === "IMAGE").length}
                </p>
              </div>
              <HiPhotograph className="w-8 h-8 text-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground-secondary">
                  Other Files
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {allMedia.filter((m) => m.type !== "IMAGE").length}
                </p>
              </div>
              <HiPhotograph className="w-8 h-8 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface MediaItemProps {
  media: MediaUploadResponse;
  onDelete: (id: string) => void;
}

function MediaItem({ media, onDelete }: MediaItemProps) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <>
      <div className="relative group">
        <div className="aspect-square bg-background-secondary rounded-lg overflow-hidden">
          {media.type === "IMAGE" ? (
            <img
              src={media.url}
              alt={media.alt || "Media"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <HiPhotograph className="w-8 h-8 text-foreground-muted" />
            </div>
          )}
        </div>

        {/* Overlay actions */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100">
          <Button
            variant="ghost"
            size="sm"
            className="bg-white text-black hover:bg-gray-100"
            onClick={() => setShowPreview(true)}
          >
            <HiEye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="bg-red-500 text-white hover:bg-red-600"
            onClick={() => onDelete(media.id)}
          >
            <HiTrash className="w-4 h-4" />
          </Button>
        </div>

        {/* Media info */}
        <div className="mt-2">
          <p className="text-xs text-foreground-secondary truncate">
            {media.alt || "Untitled"}
          </p>
          <p className="text-xs text-foreground-muted">{media.type}</p>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4"
          onClick={() => setShowPreview(false)}
        >
          <div className="max-w-4xl max-h-full">
            {media.type === "IMAGE" ? (
              <img
                src={media.url}
                alt={media.alt || "Media"}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="bg-white p-8 rounded-lg">
                <p className="text-lg font-medium">{media.alt || "Document"}</p>
                <p className="text-foreground-secondary">Type: {media.type}</p>
                <a
                  href={media.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Open file
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
