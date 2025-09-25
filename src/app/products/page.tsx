import ProductsClient from "./ProductsClient";
import { Suspense } from "react";

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] grid place-items-center">Loading…</div>
      }
    >
      <ProductsClient />
    </Suspense>
  );
}
