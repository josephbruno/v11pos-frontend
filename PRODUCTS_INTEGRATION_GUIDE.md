# Products API Integration - Usage Examples

This document shows how to integrate the Products API into the existing ProductManagement.tsx component without changing the existing code structure.

## Quick Integration Steps

### 1. Import the Hooks

Add these imports at the top of `ProductManagement.tsx`:

```tsx
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  formatPrice,
  dollarsToCents,
  centsToDollars,
} from "@/hooks/useProducts";

import { useCategories } from "@/hooks/useCategories";
```

### 2. Replace Mock Data with API Calls

Replace the existing mock data declarations with API hooks:

```tsx
export default function ProductManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  
  // Fetch categories from API
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();
  const categories = categoriesData || [];

  // Build filters based on UI state
  const filters = {
    page: currentPage,
    page_size: 12,
    search: searchQuery || undefined,
    category_id: selectedCategory !== "all" ? selectedCategory : undefined,
    available: selectedStatus === "available" ? true : 
               selectedStatus === "unavailable" ? false : undefined,
  };

  // Fetch products from API
  const { data: productsResponse, isLoading: productsLoading } = useProducts(filters);
  const products = productsResponse?.data || [];
  const pagination = productsResponse?.pagination;

  // Mutations
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  // ... rest of component
}
```

### 3. Handle Product Creation

Update the ProductForm onSave handler:

```tsx
<Dialog open={isAddingProduct} onOpenChange={setIsAddingProduct}>
  <DialogTrigger asChild>
    <Button className="bg-primary hover:bg-primary/90">
      <Plus className="mr-2 h-4 w-4" />
      Add Product
    </Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Add New Product</DialogTitle>
    </DialogHeader>
    <ProductForm
      onSave={(productData) => {
        // Convert price from dollars to cents
        const apiData = {
          name: productData.name!,
          description: productData.description || "",
          price: dollarsToCents(productData.price || 0),
          cost: dollarsToCents(productData.cost || 0),
          category_id: productData.category,
          stock: productData.stock || 0,
          min_stock: productData.minStock || 5,
          available: productData.available ?? true,
          featured: productData.featured ?? false,
        };

        createMutation.mutate(apiData, {
          onSuccess: () => {
            setIsAddingProduct(false);
          },
        });
      }}
      onCancel={() => setIsAddingProduct(false)}
    />
  </DialogContent>
</Dialog>
```

### 4. Handle Product Updates

Update the Edit dialog:

```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline" size="sm" className="flex-1">
      <Edit className="mr-2 h-4 w-4" />
      Edit
    </Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Product</DialogTitle>
    </DialogHeader>
    <ProductForm
      product={{
        ...product,
        price: centsToDollars(product.price), // Convert cents to dollars for display
        cost: centsToDollars(product.cost || 0),
        category: product.category_id || "",
        minStock: product.min_stock || 5,
      }}
      onSave={(updatedData) => {
        const apiData = {
          name: updatedData.name,
          description: updatedData.description,
          price: dollarsToCents(updatedData.price || 0),
          cost: dollarsToCents(updatedData.cost || 0),
          category_id: updatedData.category,
          stock: updatedData.stock,
          min_stock: updatedData.minStock,
          available: updatedData.available,
          featured: updatedData.featured,
        };

        updateMutation.mutate(
          { id: product.id, data: apiData },
          {
            onSuccess: () => {
              // Dialog will close automatically
            },
          }
        );
      }}
      onCancel={() => {}}
    />
  </DialogContent>
</Dialog>
```

### 5. Handle Product Deletion

Update the Delete button:

```tsx
<Button
  variant="outline"
  size="sm"
  className="border-pos-secondary text-pos-error hover:text-pos-error"
  onClick={() => {
    if (window.confirm(`Are you sure you want to delete ${product.name}?`)) {
      deleteMutation.mutate(product.id);
    }
  }}
  disabled={deleteMutation.isPending}
>
  <Trash2 className="h-4 w-4" />
</Button>
```

### 6. Display Loading States

Add loading indicators:

```tsx
{productsLoading || categoriesLoading ? (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pos-accent"></div>
  </div>
) : (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {products.map((product) => (
      // ... product card
    ))}
  </div>
)}
```

### 7. Add Pagination Controls

Add pagination UI at the bottom:

```tsx
{pagination && pagination.total_pages > 1 && (
  <div className="flex items-center justify-between mt-6">
    <div className="text-sm text-pos-text-muted">
      Showing {((pagination.page - 1) * pagination.page_size) + 1} to{" "}
      {Math.min(pagination.page * pagination.page_size, pagination.total_items)} of{" "}
      {pagination.total_items} products
    </div>
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
        disabled={!pagination.has_previous || productsLoading}
      >
        Previous
      </Button>
      <span className="text-sm text-pos-text">
        Page {pagination.page} of {pagination.total_pages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(p => p + 1)}
        disabled={!pagination.has_next || productsLoading}
      >
        Next
      </Button>
    </div>
  </div>
)}
```

### 8. Format Prices for Display

Update price display in product cards:

```tsx
<div className="flex items-center justify-between">
  <span className="text-pos-text-muted text-sm">Price</span>
  <span className="text-pos-text font-bold text-lg">
    {formatPrice(product.price)}
  </span>
</div>
<div className="flex items-center justify-between">
  <span className="text-pos-text-muted text-sm">Cost</span>
  <span className="text-pos-text">
    {formatPrice(product.cost || 0)}
  </span>
</div>
```

### 9. Update Category Display

Map category_id to category name:

```tsx
<Badge variant="secondary" className="text-xs">
  {categories.find((c) => c.id === product.category_id)?.name || "Uncategorized"}
</Badge>
```

### 10. Handle Search Debouncing

Add debounced search for better UX:

```tsx
import { useState, useEffect } from "react";

export default function ProductManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on new search
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filters = {
    page: currentPage,
    page_size: 12,
    search: debouncedSearch || undefined,
    // ... other filters
  };

  // ... rest of component
}
```

## Complete Integration Example

Here's a minimal example showing the key changes:

```tsx
import { useState, useEffect } from "react";
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  formatPrice,
  dollarsToCents,
  centsToDollars,
} from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";

export default function ProductManagement() {
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // API Hooks
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();
  const categories = categoriesData || [];

  const filters = {
    page: currentPage,
    page_size: 12,
    search: debouncedSearch || undefined,
    category_id: selectedCategory !== "all" ? selectedCategory : undefined,
    available: selectedStatus === "available" ? true : 
               selectedStatus === "unavailable" ? false : undefined,
  };

  const { data: productsResponse, isLoading: productsLoading } = useProducts(filters);
  const products = productsResponse?.data || [];
  const pagination = productsResponse?.pagination;

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  // Handlers
  const handleCreateProduct = (productData: any) => {
    const apiData = {
      name: productData.name!,
      description: productData.description || "",
      price: dollarsToCents(productData.price || 0),
      cost: dollarsToCents(productData.cost || 0),
      category_id: productData.category,
      stock: productData.stock || 0,
      min_stock: productData.minStock || 5,
      available: productData.available ?? true,
      featured: productData.featured ?? false,
    };

    createMutation.mutate(apiData, {
      onSuccess: () => setIsAddingProduct(false),
    });
  };

  const handleUpdateProduct = (productId: string, productData: any) => {
    const apiData = {
      name: productData.name,
      description: productData.description,
      price: dollarsToCents(productData.price || 0),
      cost: dollarsToCents(productData.cost || 0),
      category_id: productData.category,
      stock: productData.stock,
      min_stock: productData.minStock,
      available: productData.available,
      featured: productData.featured,
    };

    updateMutation.mutate({ id: productId, data: apiData });
  };

  const handleDeleteProduct = (productId: string, productName: string) => {
    if (window.confirm(`Are you sure you want to delete ${productName}?`)) {
      deleteMutation.mutate(productId);
    }
  };

  // ... rest of component JSX
}
```

## API Response Structure

### Products List Response

```typescript
{
  status: "success",
  message: "Products retrieved successfully",
  data: [
    {
      id: "uuid",
      name: "Buffalo Wings",
      slug: "buffalo-wings",
      description: "Spicy chicken wings",
      price: 1250, // in cents ($12.50)
      cost: 750,   // in cents ($7.50)
      category_id: "category-uuid",
      stock: 100,
      min_stock: 5,
      available: true,
      featured: false,
      image: null,
      images: [],
      tags: [],
      department: "kitchen",
      printer_tag: null,
      preparation_time: 15,
      nutritional_info: null,
      created_at: "2025-11-23T08:29:58",
      updated_at: "2025-11-23T08:29:58"
    }
  ],
  pagination: {
    page: 1,
    page_size: 12,
    total_items: 29,
    total_pages: 3,
    has_next: true,
    has_previous: false
  }
}
```

## Important Notes

1. **Price Conversion**: API uses cents, UI uses dollars
   - Use `dollarsToCents()` when sending to API
   - Use `centsToDollars()` when displaying
   - Use `formatPrice()` for formatted display ($12.50)

2. **Field Mapping**: API fields differ from UI fields
   - API: `category_id` → UI: `category`
   - API: `min_stock` → UI: `minStock`
   - API: `price` (cents) → UI: `price` (dollars)

3. **Loading States**: Always check `isLoading` before rendering

4. **Error Handling**: Mutations automatically show toast notifications

5. **Cache Invalidation**: React Query automatically refetches data after mutations

6. **Pagination**: Reset to page 1 when filters change

## Testing the Integration

1. Start the dev server: `npm run dev`
2. Login with test credentials
3. Navigate to Products page
4. Test:
   - ✅ List products (should load from API)
   - ✅ Search products
   - ✅ Filter by category
   - ✅ Filter by availability
   - ✅ Create new product
   - ✅ Update existing product
   - ✅ Delete product
   - ✅ Pagination navigation

## Quick Reference

```tsx
// Fetch products
const { data, isLoading } = useProducts({ page: 1, page_size: 10 });

// Create product
const create = useCreateProduct();
create.mutate({ name: "Product", price: 1999, ... });

// Update product
const update = useUpdateProduct();
update.mutate({ id: "123", data: { price: 2499 } });

// Delete product
const del = useDeleteProduct();
del.mutate("product-id");

// Price conversion
const dollars = centsToDollars(1250); // 12.50
const cents = dollarsToCents(12.50);  // 1250
const formatted = formatPrice(1250);   // "$12.50"
```
