"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  HiUpload,
  HiPhotograph,
  HiTrash,
  HiEye,
  HiSearch,
  HiPlus,
  HiRefresh,
  HiCheck,
} from "react-icons/hi";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import MediaUpload from "@/components/admin/MediaUpload";
import { mediaApi, MediaUploadResponse, adminApi, Product } from "@/lib/api";

type SortKey = "newest" | "oldest";
type GridSize = "cozy" | "compact";

export default function AdminMediaPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productMedia, setProductMedia] = useState<MediaUploadResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  // product list search
  const [productQuery, setProductQuery] = useState("");

  // gallery tools
  const [mediaQuery, setMediaQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [gridSize, setGridSize] = useState<GridSize>("cozy");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedProduct) loadProductMedia();
    // reset selection on product switch
    setSelectedIds(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProduct?.id]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const base = await adminApi.getAllProducts();

      // Enrich to get brand/category/images count if needed
      const detailed = await Promise.all(
        base.map(async (p) => {
          try {
            return await adminApi.getProductById(p.id);
          } catch {
            return p;
          }
        })
      );

      setProducts(detailed);
      if (!selectedProduct && detailed.length > 0) {
        setSelectedProduct(detailed[0]);
      }
    } catch (err) {
      console.error("Failed to load products:", err);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const loadProductMedia = async () => {
    if (!selectedProduct) return;
    try {
      setMediaLoading(true);
      const data = await mediaApi.getMediaByOwner(
        "PRODUCT",
        selectedProduct.id
      );
      setProductMedia(data);
    } catch (err) {
      console.error("Failed to load product media:", err);
      toast.error("Failed to load product media");
    } finally {
      setMediaLoading(false);
    }
  };

  const onDeleteSingle = async (mediaId: string) => {
    if (!confirm("Delete this image?")) return;
    try {
      await mediaApi.deleteMedia(mediaId);
      setProductMedia((prev) => prev.filter((m) => m.id !== mediaId));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(mediaId);
        return next;
      });
      toast.success("Image deleted");
    } catch (err) {
      console.error("Failed to delete media:", err);
      toast.error("Failed to delete media");
    }
  };

  const onDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected item(s)?`)) return;
    try {
      const ids = Array.from(selectedIds);
      for (const id of ids) {
        try {
          await mediaApi.deleteMedia(id);
        } catch (e) {
          console.error("Delete failed for", id, e);
        }
      }
      setProductMedia((prev) => prev.filter((m) => !selectedIds.has(m.id)));
      setSelectedIds(new Set());
      toast.success("Selected images deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete selected images");
    }
  };

  const handleUploadComplete = (media: MediaUploadResponse[]) => {
    setProductMedia((prev) => [...media, ...prev]); // prepend newest
    setShowUpload(false);
    toast.success(`${media.length} image(s) uploaded`);
  };

  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.brand?.name?.toLowerCase().includes(q) ||
        p.category?.name?.toLowerCase().includes(q)
    );
  }, [products, productQuery]);

  const filteredMedia = useMemo(() => {
    const q = mediaQuery.trim().toLowerCase();
    let list = productMedia.filter((m) => {
      if (!q) return true;
      const hay = `${m.alt || ""} ${m.type || ""} ${m.url || ""}`.toLowerCase();
      return hay.includes(q);
    });

    const getTime = (m: MediaUploadResponse) => {
      // prefer createdAt if present; fallback to id as tie-breaker
      const t = (m as any).createdAt
        ? new Date((m as any).createdAt).getTime()
        : 0;
      return isNaN(t) ? 0 : t;
    };

    list.sort((a, b) =>
      sortKey === "newest" ? getTime(b) - getTime(a) : getTime(a) - getTime(b)
    );

    return list;
  }, [productMedia, mediaQuery, sortKey]);

  const allSelectedVisible =
    filteredMedia.length > 0 &&
    filteredMedia.every((m) => selectedIds.has(m.id));
  const someSelected = selectedIds.size > 0;

  const toggleSelectAllVisible = () => {
    if (allSelectedVisible) {
      const next = new Set(selectedIds);
      filteredMedia.forEach((m) => next.delete(m.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      filteredMedia.forEach((m) => next.add(m.id));
      setSelectedIds(next);
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
    <div className="w-full px-4 sm:px-6 lg:px-8 py-5 space-y-5 min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">
            Product Images
          </h1>
          <p className="text-sm text-foreground-muted">
            Manage product images and media files
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedProduct && (
            <Button onClick={() => setShowUpload((s) => !s)}>
              <HiPlus className="w-5 h-5 mr-2" />
              {showUpload ? "Cancel Upload" : "Add Images"}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={loadProductMedia}
            disabled={!selectedProduct}
          >
            <HiRefresh className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Selector */}
        <div className="lg:col-span-1 min-w-0">
          <Card className="shadow-sm">
            <CardHeader className="border-b border-border p-4 sm:p-5 sticky top-[var(--topbar,0px)] bg-surface z-10">
              <CardTitle className="text-lg">Select Product</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
              {/* Search */}
              <div className="relative mb-4">
                <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-light w-4 h-4" />
                <Input
                  placeholder="Search by title, brand, category…"
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Product List */}
              <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                {filteredProducts.map((p) => {
                  const isActive = selectedProduct?.id === p.id;
                  const count = p.images?.length ?? 0;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProduct(p)}
                      className={[
                        "w-full text-left p-3 rounded-lg border transition-colors",
                        isActive
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50 hover:bg-background-secondary",
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-md overflow-hidden bg-background-tertiary grid place-items-center shrink-0">
                          {p.images?.[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.images[0].url}
                              alt={p.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <HiPhotograph className="w-6 h-6 text-foreground-light" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium truncate">{p.title}</div>
                          <div className="text-[12px] text-foreground-light">
                            {p.brand?.name || "—"} · {p.category?.name || "—"}
                          </div>
                          <div className="text-[12px] text-foreground-muted">
                            {count} image{count === 1 ? "" : "s"}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}

                {filteredProducts.length === 0 && (
                  <div className="py-12 text-center">
                    <HiPhotograph className="w-10 h-10 text-foreground-light mx-auto mb-2" />
                    <div className="text-sm text-foreground-muted">
                      No products found
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Media Management */}
        <div className="lg:col-span-2 min-w-0">
          {selectedProduct ? (
            <div className="space-y-6">
              {/* Product summary */}
              <Card className="shadow-sm">
                <CardHeader className="p-4 sm:p-5 border-b border-border">
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{selectedProduct.title}</span>
                    <span className="text-sm font-normal text-foreground-light">
                      {productMedia.length} image
                      {productMedia.length === 1 ? "" : "s"}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-md overflow-hidden bg-background-tertiary grid place-items-center">
                      {selectedProduct.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={selectedProduct.images[0].url}
                          alt={selectedProduct.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <HiPhotograph className="w-8 h-8 text-foreground-light" />
                      )}
                    </div>
                    <div className="text-sm">
                      <div className="text-foreground-secondary">
                        <strong>Brand:</strong>{" "}
                        {selectedProduct.brand?.name || "N/A"}
                      </div>
                      <div className="text-foreground-secondary">
                        <strong>Category:</strong>{" "}
                        {selectedProduct.category?.name || "N/A"}
                      </div>
                      <div className="text-foreground-secondary">
                        <strong>Condition:</strong> Grade{" "}
                        {selectedProduct.conditionGrade}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Upload */}
              {showUpload && (
                <Card className="shadow-sm">
                  <CardHeader className="p-4 sm:p-5 border-b border-border">
                    <CardTitle>
                      Upload Images for {selectedProduct.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-5">
                    <MediaUpload
                      ownerType="PRODUCT"
                      ownerId={selectedProduct.id}
                      mediaType="IMAGE"
                      maxFiles={10}
                      onUploadComplete={handleUploadComplete}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Gallery */}
              <Card className="shadow-sm">
                <CardHeader className="p-4 sm:p-5 border-b border-border">
                  <CardTitle className="text-lg">Product Images</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-5">
                  {/* Toolbar */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-light w-4 h-4" />
                        <Input
                          placeholder="Search by filename, alt, URL…"
                          value={mediaQuery}
                          onChange={(e) => setMediaQuery(e.target.value)}
                          className="pl-9"
                        />
                      </div>

                      <select
                        value={sortKey}
                        onChange={(e) => setSortKey(e.target.value as SortKey)}
                        className="px-3 py-2 rounded-md border border-border bg-background"
                        title="Sort"
                      >
                        <option value="newest">Newest first</option>
                        <option value="oldest">Oldest first</option>
                      </select>

                      <select
                        value={gridSize}
                        onChange={(e) =>
                          setGridSize(e.target.value as GridSize)
                        }
                        className="px-3 py-2 rounded-md border border-border bg-background"
                        title="Grid density"
                      >
                        <option value="cozy">Cozy grid</option>
                        <option value="compact">Compact grid</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleSelectAllVisible}
                        disabled={filteredMedia.length === 0}
                      >
                        <HiCheck className="w-4 h-4 mr-2" />
                        {allSelectedVisible
                          ? "Unselect All"
                          : "Select All (Visible)"}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onDeleteSelected}
                        className={
                          someSelected ? "text-error hover:text-error" : ""
                        }
                        disabled={!someSelected}
                      >
                        <HiTrash className="w-4 h-4 mr-2" />
                        Delete Selected
                      </Button>
                    </div>
                  </div>

                  {mediaLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                    </div>
                  ) : filteredMedia.length > 0 ? (
                    <div
                      className={[
                        "grid gap-4",
                        gridSize === "compact"
                          ? "grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                          : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
                      ].join(" ")}
                    >
                      {filteredMedia.map((m) => (
                        <MediaItem
                          key={m.id}
                          media={m}
                          selected={selectedIds.has(m.id)}
                          toggleSelected={() => {
                            setSelectedIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(m.id)) next.delete(m.id);
                              else next.add(m.id);
                              return next;
                            });
                          }}
                          onDelete={onDeleteSingle}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <HiPhotograph className="w-12 h-12 text-foreground-light mx-auto mb-3" />
                      <div className="text-sm text-foreground-muted">
                        {mediaQuery
                          ? "No images match your search."
                          : "No images uploaded yet."}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="shadow-sm">
              <CardContent className="py-16 text-center">
                <HiPhotograph className="w-12 h-12 text-foreground-light mx-auto mb-3" />
                <h3 className="text-base font-semibold">Select a Product</h3>
                <p className="text-sm text-foreground-muted">
                  Choose a product from the list to manage its images
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

/* ----------------- Media Tile ----------------- */

function MediaItem({
  media,
  selected,
  toggleSelected,
  onDelete,
}: {
  media: MediaUploadResponse;
  selected: boolean;
  toggleSelected: () => void;
  onDelete: (id: string) => void;
}) {
  const [showPreview, setShowPreview] = useState(false);

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(media.url);
      toast.success("URL copied");
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <>
      <div className="relative group">
        {/* selection checkbox */}
        <button
          onClick={toggleSelected}
          className={[
            "absolute left-2 top-2 z-10 h-5 w-5 rounded border border-border bg-background grid place-items-center",
            selected ? "ring-2 ring-primary" : "",
          ].join(" ")}
          title={selected ? "Unselect" : "Select"}
        >
          {selected ? <HiCheck className="w-4 h-4 text-primary" /> : null}
        </button>

        <div className="aspect-square bg-background-tertiary rounded-lg overflow-hidden ring-1 ring-border">
          {media.type === "IMAGE" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={media.url}
              alt={media.alt || "Product image"}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full grid place-items-center">
              <HiPhotograph className="w-8 h-8 text-foreground-light" />
            </div>
          )}
        </div>

        {/* overlay actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors grid place-items-center opacity-0 group-hover:opacity-100">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="bg-white text-foreground hover:bg-gray-100"
              onClick={() => setShowPreview(true)}
              title="Preview"
            >
              <HiEye className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="bg-white text-foreground hover:bg-gray-100"
              onClick={copyUrl}
              title="Copy URL"
            >
              <HiUpload className="w-4 h-4 rotate-180" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="bg-red-500 text-white hover:bg-red-600"
              onClick={() => onDelete(media.id)}
              title="Delete"
            >
              <HiTrash className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* meta */}
        <div className="mt-2">
          <div className="text-[12px] text-foreground-secondary truncate">
            {media.alt || "Product image"}
          </div>
          <div className="text-[11px] text-foreground-light">
            {(media as any).createdAt
              ? new Date((media as any).createdAt).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "short",
                  day: "2-digit",
                })
              : media.type}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div
          className="fixed inset-0 z-50 bg-black/80 grid place-items-center p-4"
          onClick={() => setShowPreview(false)}
        >
          <div className="max-w-5xl max-h-full">
            {media.type === "IMAGE" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={media.url}
                alt={media.alt || "Product image"}
                className="max-w-full max-h-[85vh] object-contain"
              />
            ) : (
              <div className="bg-white p-8 rounded-lg">
                <p className="text-lg font-medium">{media.alt || "Document"}</p>
                <p className="text-foreground-secondary mb-2">
                  Type: {media.type}
                </p>
                <a
                  href={media.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Open file in new tab
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
