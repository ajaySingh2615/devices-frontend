"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  HiUpload,
  HiPhotograph,
  HiTrash,
  HiEye,
  HiSearch,
  HiPlus,
} from "react-icons/hi";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import MediaUpload from "@/components/admin/MediaUpload";
import {
  mediaApi,
  MediaUploadResponse,
  MediaOwnerType,
  adminApi,
  Product,
} from "@/lib/api";

export default function AdminMediaPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productMedia, setProductMedia] = useState<MediaUploadResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      loadProductMedia();
    }
  }, [selectedProduct]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAllProducts();

      // Fetch full details for each product to get brand, category, and image count
      const productsWithDetails = await Promise.all(
        data.map(async (product) => {
          try {
            const fullDetails = await adminApi.getProductById(product.id);
            return fullDetails;
          } catch (error) {
            console.error(
              `Failed to load details for product ${product.id}:`,
              error
            );
            return product; // Fallback to basic product data
          }
        })
      );

      setProducts(productsWithDetails);

      // Auto-select first product if available
      if (productsWithDetails.length > 0 && !selectedProduct) {
        setSelectedProduct(productsWithDetails[0]);
      }
    } catch (error) {
      console.error("Failed to load products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const loadProductMedia = async () => {
    if (!selectedProduct) return;

    try {
      setMediaLoading(true);

      // Load media for the product
      const data = await mediaApi.getMediaByOwner(
        "PRODUCT",
        selectedProduct.id
      );
      setProductMedia(data);
    } catch (error) {
      console.error("Failed to load product media:", error);
      toast.error("Failed to load product media");
    } finally {
      setMediaLoading(false);
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return;

    try {
      await mediaApi.deleteMedia(mediaId);
      setProductMedia((prev) => prev.filter((m) => m.id !== mediaId));
      toast.success("Image deleted successfully");
    } catch (error) {
      console.error("Failed to delete media:", error);
      toast.error("Failed to delete media");
    }
  };

  const handleUploadComplete = (media: MediaUploadResponse[]) => {
    setProductMedia((prev) => [...prev, ...media]);
    setShowUpload(false);
    toast.success(`${media.length} image(s) uploaded successfully`);
  };

  const filteredProducts = products.filter(
    (product) =>
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            Product Images
          </h1>
          <p className="text-foreground-secondary">
            Manage product images and media files
          </p>
        </div>
        {selectedProduct && (
          <Button onClick={() => setShowUpload(!showUpload)}>
            <HiPlus className="w-5 h-5 mr-2" />
            {showUpload ? "Cancel Upload" : "Add Images"}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Selector */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Select Product</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-muted w-4 h-4" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Product List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedProduct?.id === product.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-background-secondary"
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Product Image */}
                      <div className="w-12 h-12 bg-background-secondary rounded-lg overflow-hidden flex-shrink-0">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0].url}
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <HiPhotograph className="w-6 h-6 text-foreground-muted" />
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground truncate">
                          {product.title}
                        </h3>
                        <p className="text-sm text-foreground-secondary">
                          {product.brand?.name}
                        </p>
                        <p className="text-xs text-foreground-muted">
                          {product.images?.length || 0} images
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-8">
                  <HiPhotograph className="w-12 h-12 text-foreground-muted mx-auto mb-2" />
                  <p className="text-foreground-secondary">No products found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Media Management */}
        <div className="lg:col-span-2">
          {selectedProduct ? (
            <div className="space-y-6">
              {/* Product Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{selectedProduct.title}</span>
                    <span className="text-sm font-normal text-foreground-secondary">
                      {productMedia.length} images
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-background-secondary rounded-lg overflow-hidden">
                      {selectedProduct.images?.[0] ? (
                        <img
                          src={selectedProduct.images[0].url}
                          alt={selectedProduct.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <HiPhotograph className="w-8 h-8 text-foreground-muted" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-foreground-secondary">
                        <strong>Brand:</strong>{" "}
                        {selectedProduct.brand?.name || "N/A"}
                      </p>
                      <p className="text-foreground-secondary">
                        <strong>Category:</strong>{" "}
                        {selectedProduct.category?.name || "N/A"}
                      </p>
                      <p className="text-foreground-secondary">
                        <strong>Condition:</strong> Grade{" "}
                        {selectedProduct.conditionGrade}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Upload Section */}
              {showUpload && (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Upload Images for {selectedProduct.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
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

              {/* Media Gallery */}
              <Card>
                <CardHeader>
                  <CardTitle>Product Images</CardTitle>
                </CardHeader>
                <CardContent>
                  {mediaLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                    </div>
                  ) : productMedia.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {productMedia.map((media) => (
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
                        No images uploaded
                      </h3>
                      <p className="text-foreground-secondary mb-4">
                        Upload images for this product to get started
                      </p>
                      <Button onClick={() => setShowUpload(true)}>
                        <HiUpload className="w-5 h-5 mr-2" />
                        Upload Images
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <HiPhotograph className="w-16 h-16 text-foreground-muted mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Select a Product
                  </h3>
                  <p className="text-foreground-secondary">
                    Choose a product from the list to manage its images
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
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
              alt={media.alt || "Product image"}
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
            {media.alt || "Product image"}
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
                alt={media.alt || "Product image"}
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
