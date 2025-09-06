"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "react-hot-toast";
import { HiUpload, HiX, HiPhotograph, HiTrash } from "react-icons/hi";

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import {
  mediaApi,
  MediaUploadResponse,
  MediaOwnerType,
  MediaType,
} from "@/lib/api";

interface MediaUploadProps {
  ownerType: MediaOwnerType;
  ownerId: string;
  mediaType?: MediaType;
  maxFiles?: number;
  onUploadComplete?: (media: MediaUploadResponse[]) => void;
  existingMedia?: MediaUploadResponse[];
}

export default function MediaUpload({
  ownerType,
  ownerId,
  mediaType = "IMAGE" as MediaType,
  maxFiles = 5,
  onUploadComplete,
  existingMedia = [],
}: MediaUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedMedia, setUploadedMedia] =
    useState<MediaUploadResponse[]>(existingMedia);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (uploadedMedia.length + acceptedFiles.length > maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed`);
        return;
      }

      setUploading(true);

      try {
        // Get signed upload URL
        const signedUrlResponse = await mediaApi.generateUploadUrl({
          ownerType,
          ownerId,
          mediaType,
        });

        const uploadPromises = acceptedFiles.map(async (file, index) => {
          // Upload to Cloudinary using signed URL
          const formData = new FormData();
          console.log(
            "Upload parameters received:",
            signedUrlResponse.uploadParameters
          );
          Object.entries(signedUrlResponse.uploadParameters).forEach(
            ([key, value]) => {
              console.log(`Appending to FormData: ${key} = ${value}`);
              formData.append(key, value as string);
            }
          );

          // Debug: Log all FormData entries
          console.log("FormData entries:");
          for (let [key, value] of formData.entries()) {
            console.log(`  ${key}: ${value}`);
          }
          formData.append("file", file);

          const response = await fetch(signedUrlResponse.uploadUrl, {
            method: "POST",
            body: formData,
          });

          const cloudinaryResult = await response.json();

          if (!response.ok) {
            throw new Error(cloudinaryResult.error?.message || "Upload failed");
          }

          // Save metadata to our backend
          const mediaResponse = await mediaApi.saveMediaMetadata(
            {
              ownerType,
              ownerId,
              mediaType,
              alt: file.name,
              sortOrder: uploadedMedia.length + index,
            },
            cloudinaryResult.secure_url,
            cloudinaryResult.public_id
          );

          return mediaResponse;
        });

        const results = await Promise.all(uploadPromises);
        const newMedia = [...uploadedMedia, ...results];
        setUploadedMedia(newMedia);
        onUploadComplete?.(newMedia);
        toast.success(`${results.length} file(s) uploaded successfully`);
      } catch (error) {
        console.error("Upload failed:", error);
        toast.error("Upload failed. Please try again.");
      } finally {
        setUploading(false);
      }
    },
    [ownerType, ownerId, mediaType, uploadedMedia, maxFiles, onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: getAcceptedFileTypes(mediaType) as any, // Type assertion for compatibility
    disabled: uploading || uploadedMedia.length >= maxFiles,
    multiple: maxFiles > 1,
  });

  const handleDeleteMedia = async (mediaId: string) => {
    try {
      await mediaApi.deleteMedia(mediaId);
      const newMedia = uploadedMedia.filter((media) => media.id !== mediaId);
      setUploadedMedia(newMedia);
      onUploadComplete?.(newMedia);
      toast.success("Media deleted successfully");
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete media");
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {uploadedMedia.length < maxFiles && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
        >
          <input {...getInputProps()} />
          <HiUpload className="w-12 h-12 mx-auto mb-4 text-foreground-muted" />
          {uploading ? (
            <p className="text-foreground-secondary">Uploading...</p>
          ) : isDragActive ? (
            <p className="text-primary">Drop files here...</p>
          ) : (
            <div>
              <p className="text-foreground-secondary mb-2">
                Drag & drop {getMediaTypeLabel(mediaType).toLowerCase()} here,
                or click to select
              </p>
              <p className="text-sm text-foreground-muted">
                Max {maxFiles} files • {getFileSizeLimit(mediaType)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Uploaded Media Preview */}
      {uploadedMedia.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Uploaded Media</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadedMedia.map((media) => (
              <Card key={media.id} className="relative group">
                <CardContent className="p-2">
                  {media.type === "IMAGE" ? (
                    <div className="aspect-square relative">
                      <img
                        src={media.url}
                        alt={media.alt || "Uploaded image"}
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                  ) : (
                    <div className="aspect-square flex items-center justify-center bg-background-secondary rounded">
                      <HiPhotograph className="w-8 h-8 text-foreground-muted" />
                      <p className="text-xs text-center mt-2">{media.alt}</p>
                    </div>
                  )}

                  {/* Delete button */}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDeleteMedia(media.id)}
                  >
                    <HiTrash className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getAcceptedFileTypes(mediaType: MediaType) {
  switch (mediaType) {
    case "IMAGE":
      return {
        "image/*": [".jpeg", ".jpg", ".png", ".webp", ".gif"],
      };
    case "VIDEO":
      return {
        "video/*": [".mp4", ".webm", ".ogg"],
      };
    case "DOCUMENT":
      return {
        "application/pdf": [".pdf"],
        "application/msword": [".doc"],
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
          [".docx"],
      };
    default:
      return {};
  }
}

function getMediaTypeLabel(mediaType: MediaType): string {
  switch (mediaType) {
    case "IMAGE":
      return "Images";
    case "VIDEO":
      return "Videos";
    case "DOCUMENT":
      return "Documents";
    default:
      return "Files";
  }
}

function getFileSizeLimit(mediaType: MediaType): string {
  switch (mediaType) {
    case "IMAGE":
      return "Max 10MB per image";
    case "VIDEO":
      return "Max 100MB per video";
    case "DOCUMENT":
      return "Max 25MB per document";
    default:
      return "Max 10MB per file";
  }
}
