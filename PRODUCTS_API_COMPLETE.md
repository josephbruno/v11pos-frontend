# ✅ Products API Integration - Complete!

## What Has Been Implemented

### 1. **API Client Layer** (`client/lib/apiClient.ts`)
Complete low-level HTTP client with:
- ✅ Automatic Bearer token injection
- ✅ Token expiration handling
- ✅ 401 auto-logout and redirect
- ✅ Error handling with custom `ApiError` class
- ✅ Support for GET, POST, PUT, PATCH, DELETE, File Upload
- ✅ Response parsing and validation

### 2. **API Services** (`client/lib/apiServices.ts`)
High-level API service functions:

#### Products Services
- ✅ `getProducts(filters?)` - Paginated product list with search/filters
- ✅ `getProductById(id)` - Single product details
- ✅ `createProduct(data)` - Create new product
- ✅ `updateProduct(id, data)` - Update product
- ✅ `deleteProduct(id)` - Delete product
- ✅ `searchProducts(query, limit)` - Search products
- ✅ `getFeaturedProducts(limit)` - Get featured items
- ✅ `getAvailableProducts(filters)` - Get available items

#### Categories Services
- ✅ `getCategories()` - List all categories
- ✅ `getCategoryById(id)` - Single category
- ✅ `createCategory(data)` - Create category
- ✅ `updateCategory(id, data)` - Update category
- ✅ `deleteCategory(id)` - Delete category

### 3. **React Hooks** (`client/hooks/useProducts.ts`)
Custom hooks for easy integration:
- ✅ `useProducts(filters)` - Fetch products with React Query
- ✅ `useProduct(id)` - Fetch single product
- ✅ `useProductSearch(query)` - Search products
- ✅ `useFeaturedProducts(limit)` - Featured products
- ✅ `useAvailableProducts(filters)` - Available products
- ✅ `useCreateProduct()` - Create mutation with auto-refetch
- ✅ `useUpdateProduct()` - Update mutation with auto-refetch
- ✅ `useDeleteProduct()` - Delete mutation with auto-refetch

**Helper Functions**:
- ✅ `centsToDollars(cents)` - Convert cents to dollars
- ✅ `dollarsToCents(dollars)` - Convert dollars to cents
- ✅ `formatPrice(cents)` - Format price as "$12.50"

### 4. **Category Hooks** (`client/hooks/useCategories.ts`)
- ✅ `useCategories()` - Fetch all categories
- ✅ `useCategory(id)` - Fetch single category
- ✅ `useCreateCategory()` - Create mutation
- ✅ `useUpdateCategory()` - Update mutation
- ✅ `useDeleteCategory()` - Delete mutation

### 5. **Documentation**
- ✅ `PRODUCTS_INTEGRATION_GUIDE.md` - Complete integration guide with code examples
- ✅ `API_INTEGRATION_GUIDE.md` - General API usage guide

---

## 🚀 How to Use

### Quick Example - Fetch and Display Products

```tsx
import { useProducts, formatPrice } from "@/hooks/useProducts";

function ProductList() {
  const { data, isLoading } = useProducts({
    page: 1,
    page_size: 10,
    available: true,
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {data?.data.map((product) => (
        <div key={product.id}>
          <h3>{product.name}</h3>
          <p>{formatPrice(product.price)}</p>
        </div>
      ))}
    </div>
  );
}
```

### Create Product

```tsx
import { useCreateProduct, dollarsToCents } from "@/hooks/useProducts";

function CreateProduct() {
  const createMutation = useCreateProduct();

  const handleSubmit = (formData) => {
    createMutation.mutate({
      name: formData.name,
      description: formData.description,
      price: dollarsToCents(formData.price), // Convert $12.50 → 1250
      cost: dollarsToCents(formData.cost),
      category_id: formData.categoryId,
      stock: formData.stock,
      min_stock: 5,
      available: true,
      featured: false,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={createMutation.isPending}>
        Create Product
      </button>
    </form>
  );
}
```

### Update Product

```tsx
import { useUpdateProduct, dollarsToCents } from "@/hooks/useProducts";

function EditProduct({ product }) {
  const updateMutation = useUpdateProduct();

  const handleUpdate = (formData) => {
    updateMutation.mutate({
      id: product.id,
      data: {
        name: formData.name,
        price: dollarsToCents(formData.price),
        available: formData.available,
      },
    });
  };

  return <form onSubmit={handleUpdate}>{/* Form fields */}</form>;
}
```

### Delete Product

```tsx
import { useDeleteProduct } from "@/hooks/useProducts";

function DeleteButton({ productId, productName }) {
  const deleteMutation = useDeleteProduct();

  const handleDelete = () => {
    if (confirm(`Delete ${productName}?`)) {
      deleteMutation.mutate(productId);
    }
  };

  return (
    <button onClick={handleDelete} disabled={deleteMutation.isPending}>
      Delete
    </button>
  );
}
```

### Search Products

```tsx
import { useProductSearch } from "@/hooks/useProducts";
import { useState } from "react";

function SearchProducts() {
  const [query, setQuery] = useState("");
  const { data, isLoading } = useProductSearch(query);

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products..."
      />
      {isLoading && <div>Searching...</div>}
      {data?.data.map((product) => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

---

## 📋 API Features

### Pagination
```tsx
const { data } = useProducts({ page: 2, page_size: 20 });

// Access pagination info
data?.pagination.total_items;  // Total count
data?.pagination.total_pages;  // Number of pages
data?.pagination.has_next;     // Can go to next page
data?.pagination.has_previous; // Can go to previous page
```

### Search & Filters
```tsx
const { data } = useProducts({
  search: "burger",           // Search name/description
  category_id: "cat-uuid",    // Filter by category
  available: true,            // Only available products
  featured: true,             // Only featured products
  min_price: 1000,            // Min price in cents ($10.00)
  max_price: 2000,            // Max price in cents ($20.00)
  page: 1,
  page_size: 20,
});
```

### Categories
```tsx
import { useCategories } from "@/hooks/useCategories";

function CategoryFilter() {
  const { data: categories } = useCategories();

  return (
    <select>
      {categories?.map((cat) => (
        <option key={cat.id} value={cat.id}>
          {cat.name}
        </option>
      ))}
    </select>
  );
}
```

---

## 🔄 Automatic Features

### 1. **Token Management**
- ✅ Automatically includes `Authorization: Bearer {token}` in all requests
- ✅ Auto-reads from `localStorage.getItem("restaurant-pos-token")`
- ✅ Handles token expiration (401 → logout → redirect to /login)

### 2. **Cache Management**
- ✅ React Query automatic caching (30-60 seconds)
- ✅ Auto-refetch after mutations (create/update/delete)
- ✅ Optimistic updates for better UX

### 3. **Toast Notifications**
- ✅ Success toasts on create/update/delete
- ✅ Error toasts with meaningful messages
- ✅ Automatic integration with ToastContext

### 4. **Loading States**
- ✅ `isLoading` - Initial data fetch
- ✅ `isPending` - Mutation in progress
- ✅ `isError` - Error occurred
- ✅ `isSuccess` - Operation succeeded

---

## ⚠️ Important: Price Conversion

**The API uses cents (integer) for prices to avoid floating-point errors.**

### Always Convert Prices

```tsx
// ❌ WRONG - Sending dollars to API
createProduct({ price: 12.50 }); // Will be treated as 12 cents!

// ✅ CORRECT - Convert to cents
import { dollarsToCents } from "@/hooks/useProducts";
createProduct({ price: dollarsToCents(12.50) }); // 1250 cents

// Display prices
import { formatPrice, centsToDollars } from "@/hooks/useProducts";

formatPrice(1250);        // "$12.50" (formatted string)
centsToDollars(1250);     // 12.5 (number)
```

### In Forms

```tsx
// When displaying in form (cents → dollars)
<input
  type="number"
  value={centsToDollars(product.price)}
  onChange={(e) => handleChange(e)}
/>

// When submitting (dollars → cents)
const handleSubmit = (formData) => {
  createMutation.mutate({
    ...formData,
    price: dollarsToCents(formData.price),
    cost: dollarsToCents(formData.cost),
  });
};
```

---

## 🔧 Integration with Existing Code

Your existing `ProductManagement.tsx` component can be updated by:

1. **Import hooks**:
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

2. **Replace mock data**:
```tsx
// OLD: Mock data
const products = [...mockData];
const categories = [...mockCategories];

// NEW: API data
const { data: productsResponse } = useProducts({ page: 1, page_size: 12 });
const products = productsResponse?.data || [];

const { data: categories } = useCategories();
```

3. **Use mutations**:
```tsx
const createMutation = useCreateProduct();
const updateMutation = useUpdateProduct();
const deleteMutation = useDeleteProduct();

// In handlers
createMutation.mutate(productData);
updateMutation.mutate({ id: productId, data: updatedData });
deleteMutation.mutate(productId);
```

See `PRODUCTS_INTEGRATION_GUIDE.md` for detailed step-by-step integration guide.

---

## ✅ What's Ready

- ✅ Complete API client with authentication
- ✅ All Products CRUD operations
- ✅ Categories management
- ✅ Search and filtering
- ✅ Pagination support
- ✅ React Query integration
- ✅ Automatic cache invalidation
- ✅ Toast notifications
- ✅ Error handling
- ✅ Loading states
- ✅ Price conversion helpers
- ✅ TypeScript types for all responses
- ✅ Comprehensive documentation
- ✅ **No changes to existing ProductManagement.tsx code**

---

## 📚 Documentation Files

1. **API_INTEGRATION_GUIDE.md** - General API usage with examples
2. **PRODUCTS_INTEGRATION_GUIDE.md** - Step-by-step Products API integration
3. **client/lib/apiClient.ts** - Low-level HTTP client
4. **client/lib/apiServices.ts** - High-level API functions
5. **client/hooks/useProducts.ts** - React hooks for products
6. **client/hooks/useCategories.ts** - React hooks for categories

---

## 🎯 Next Steps

### To integrate into ProductManagement.tsx:

1. Open `PRODUCTS_INTEGRATION_GUIDE.md`
2. Follow the step-by-step instructions
3. Copy/paste the code examples
4. Test each operation (create, read, update, delete)

### The integration:
- ✅ Doesn't change existing UI/UX
- ✅ Keeps all existing components
- ✅ Just swaps mock data for real API calls
- ✅ Adds loading states and error handling
- ✅ Automatically manages authentication

---

## 🚀 Ready to Use!

All Products API functionality is now available. The existing code structure remains unchanged - you just need to import and use the hooks instead of mock data.

**Start by reading `PRODUCTS_INTEGRATION_GUIDE.md` for detailed integration steps!**
