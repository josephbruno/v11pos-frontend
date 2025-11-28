# Products API - Quick Reference

## Import Statements
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

## Fetch Products
```tsx
const { data, isLoading, error } = useProducts({
  page: 1,
  page_size: 10,
  search: "burger",
  category_id: "uuid",
  available: true,
  featured: true,
  min_price: 1000,  // $10.00 in cents
  max_price: 2000,  // $20.00 in cents
});

// Access data
const products = data?.data || [];
const pagination = data?.pagination;
```

## Create Product
```tsx
const create = useCreateProduct();

create.mutate({
  name: "Product Name",
  description: "Description",
  price: dollarsToCents(12.50),    // 1250 cents
  cost: dollarsToCents(7.50),      // 750 cents
  category_id: "category-uuid",
  stock: 100,
  min_stock: 5,
  available: true,
  featured: false,
});
```

## Update Product
```tsx
const update = useUpdateProduct();

update.mutate({
  id: "product-uuid",
  data: {
    name: "Updated Name",
    price: dollarsToCents(15.99),
    available: true,
  },
});
```

## Delete Product
```tsx
const del = useDeleteProduct();

del.mutate("product-uuid");
```

## Price Conversion
```tsx
// Display price (cents → dollars)
formatPrice(1250);        // "$12.50"
centsToDollars(1250);     // 12.5

// Submit price (dollars → cents)
dollarsToCents(12.50);    // 1250
```

## Categories
```tsx
const { data: categories } = useCategories();

categories?.map(cat => (
  <option key={cat.id} value={cat.id}>
    {cat.name}
  </option>
))
```

## Loading States
```tsx
if (isLoading) return <Spinner />;
if (error) return <Error message={error.message} />;

<Button disabled={create.isPending}>
  {create.isPending ? "Creating..." : "Create"}
</Button>
```

## API Response Structure
```tsx
{
  status: "success",
  message: "Products retrieved successfully",
  data: [
    {
      id: "uuid",
      name: "Buffalo Wings",
      slug: "buffalo-wings",
      description: "Spicy wings",
      price: 1250,           // cents
      cost: 750,             // cents
      category_id: "uuid",
      stock: 100,
      min_stock: 5,
      available: true,
      featured: false,
      image: null,
      images: [],
      tags: [],
      created_at: "2025-11-23T08:29:58",
      updated_at: "2025-11-23T08:29:58"
    }
  ],
  pagination: {
    page: 1,
    page_size: 10,
    total_items: 29,
    total_pages: 3,
    has_next: true,
    has_previous: false
  }
}
```

## Error Handling
```tsx
// Automatic toast notifications on error
create.mutate(data, {
  onError: (error) => {
    console.error("Failed:", error.message);
  },
  onSuccess: (result) => {
    console.log("Created:", result);
  },
});
```

## Complete Example
```tsx
function ProductManager() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  
  // Fetch products
  const { data, isLoading } = useProducts({
    page,
    page_size: 10,
    search,
    available: true,
  });
  
  // Mutations
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const del = useDeleteProduct();
  
  // Fetch categories
  const { data: categories } = useCategories();
  
  const handleCreate = (formData) => {
    create.mutate({
      name: formData.name,
      price: dollarsToCents(formData.price),
      category_id: formData.categoryId,
      stock: formData.stock,
      available: true,
    });
  };
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      
      {data?.data.map((product) => (
        <div key={product.id}>
          <h3>{product.name}</h3>
          <p>{formatPrice(product.price)}</p>
          <button onClick={() => del.mutate(product.id)}>
            Delete
          </button>
        </div>
      ))}
      
      <button
        onClick={() => setPage(p => p - 1)}
        disabled={!data?.pagination.has_previous}
      >
        Previous
      </button>
      
      <button
        onClick={() => setPage(p => p + 1)}
        disabled={!data?.pagination.has_next}
      >
        Next
      </button>
    </div>
  );
}
```

## Files Created
- ✅ `client/lib/apiClient.ts` - HTTP client
- ✅ `client/lib/apiServices.ts` - API functions
- ✅ `client/hooks/useProducts.ts` - Product hooks
- ✅ `client/hooks/useCategories.ts` - Category hooks
- ✅ `PRODUCTS_INTEGRATION_GUIDE.md` - Integration guide
- ✅ `PRODUCTS_API_COMPLETE.md` - Complete documentation
- ✅ `API_INTEGRATION_GUIDE.md` - General API guide
