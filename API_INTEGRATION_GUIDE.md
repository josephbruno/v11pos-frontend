# API Integration Guide

This guide explains how to use the API client in your components to make authenticated requests.

## Storage Details

After successful login, the following items are stored in localStorage:

```javascript
localStorage.setItem("restaurant-pos-user", JSON.stringify(user));
localStorage.setItem("restaurant-pos-token", "eyJhbGci...");
localStorage.setItem("restaurant-pos-token-type", "bearer");
localStorage.setItem("restaurant-pos-token-expires", "1732355712000");
```

## Quick Start

### 1. Using API Services (Recommended)

Import and use pre-built service functions:

```tsx
import { getProducts, createProduct, updateProduct } from "@/lib/apiServices";
import { useQuery, useMutation } from "@tanstack/react-query";

function ProductList() {
  // Fetch products
  const { data: products, isLoading, error } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  // Create product mutation
  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      // Refetch products after creation
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const handleCreate = () => {
    createMutation.mutate({
      name: "New Product",
      price: 29.99,
      status: "active",
    });
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <button onClick={handleCreate}>Create Product</button>
      {products?.map((product) => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

### 2. Using API Client Directly

For custom endpoints not in apiServices:

```tsx
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/apiClient";

// GET request
const data = await apiGet("/custom-endpoint");

// POST request
const newItem = await apiPost("/items", { name: "Item", price: 99 });

// PUT request
const updated = await apiPut("/items/123", { name: "Updated" });

// DELETE request
await apiDelete("/items/123");
```

### 3. Using with useEffect

```tsx
import { useEffect, useState } from "react";
import { getOrders } from "@/lib/apiServices";

function OrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const data = await getOrders();
        setOrders(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {orders.map((order) => (
        <div key={order.id}>{order.order_number}</div>
      ))}
    </div>
  );
}
```

## Available API Services

### Auth Services
- `loginUser(email, password)` - Login (handled by AuthContext)

### User Services
- `getCurrentUser()` - Get current logged-in user
- `getUsers()` - Get all users
- `getUserById(userId)` - Get user by ID
- `createUser(userData)` - Create new user
- `updateUser(userId, userData)` - Update user
- `deleteUser(userId)` - Delete user

### Product Services
- `getProducts()` - Get all products
- `getProductById(productId)` - Get product by ID
- `createProduct(productData)` - Create new product
- `updateProduct(productId, productData)` - Update product
- `deleteProduct(productId)` - Delete product

### Order Services
- `getOrders()` - Get all orders
- `getOrderById(orderId)` - Get order by ID
- `createOrder(orderData)` - Create new order
- `updateOrderStatus(orderId, status)` - Update order status

### Booking Services
- `getBookings()` - Get all table bookings
- `getBookingById(bookingId)` - Get booking by ID
- `createBooking(bookingData)` - Create new booking
- `updateBooking(bookingId, bookingData)` - Update booking
- `updateBookingStatus(bookingId, status)` - Update booking status
- `deleteBooking(bookingId)` - Delete booking

### Customer Services
- `getCustomers()` - Get all customers
- `getCustomerById(customerId)` - Get customer by ID
- `createCustomer(customerData)` - Create new customer
- `updateCustomer(customerId, customerData)` - Update customer
- `deleteCustomer(customerId)` - Delete customer

### Analytics Services
- `getAnalytics(startDate?, endDate?)` - Get analytics data

## Error Handling

The API client automatically handles:
- **401 Unauthorized**: Clears auth data and redirects to login
- **Network errors**: Throws ApiError with status and message
- **Response parsing**: Handles JSON and empty responses

```tsx
import { ApiError } from "@/lib/apiClient";

try {
  const data = await getProducts();
  // Success
} catch (error) {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      console.log("Not found");
    } else if (error.status === 403) {
      console.log("Forbidden");
    }
    console.log("Error:", error.message);
  }
}
```

## Token Management

### Check if token is expired
```tsx
import { isTokenExpired } from "@/lib/apiClient";

if (isTokenExpired()) {
  // Token is expired, redirect to login
}
```

### Get current token
```tsx
import { getAuthToken } from "@/lib/apiClient";

const token = getAuthToken();
```

### Using AuthContext helpers
```tsx
import { useAuth } from "@/contexts/AuthContext";

function Component() {
  const { getAuthToken, isTokenExpired } = useAuth();

  const token = getAuthToken();
  const expired = isTokenExpired();
}
```

## File Upload Example

```tsx
import { apiUpload } from "@/lib/apiClient";

async function handleFileUpload(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("name", "My File");

  try {
    const result = await apiUpload("/upload", formData);
    console.log("Uploaded:", result);
  } catch (error) {
    console.error("Upload failed:", error);
  }
}
```

## Best Practices

1. **Use React Query** for data fetching (automatic caching, refetching)
2. **Use apiServices** instead of apiClient directly when possible
3. **Handle errors gracefully** with try-catch or error boundaries
4. **Show loading states** while fetching data
5. **Invalidate queries** after mutations to refresh data
6. **Check token expiration** before making requests if needed

## Example: Complete CRUD Component

```tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProducts, createProduct, updateProduct, deleteProduct } from "@/lib/apiServices";
import { useToast } from "@/contexts/ToastContext";

function ProductManagement() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  // Fetch products
  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      addToast({ type: "success", title: "Product created!" });
    },
    onError: (error) => {
      addToast({ type: "error", title: "Failed to create product", description: error.message });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      addToast({ type: "success", title: "Product updated!" });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      addToast({ type: "success", title: "Product deleted!" });
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <button onClick={() => createMutation.mutate({ name: "New Product", price: 99 })}>
        Create Product
      </button>
      {products?.map((product) => (
        <div key={product.id}>
          <span>{product.name}</span>
          <button onClick={() => updateMutation.mutate({ id: product.id, data: { name: "Updated" } })}>
            Update
          </button>
          <button onClick={() => deleteMutation.mutate(product.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

## Token Storage Details

All authentication data is stored in localStorage with the prefix "restaurant-pos-":

| Key | Example Value | Description |
|-----|---------------|-------------|
| `restaurant-pos-user` | `{"id":"abc...","name":"Admin User",...}` | User profile data |
| `restaurant-pos-token` | `eyJhbGci...` | JWT access token |
| `restaurant-pos-token-type` | `bearer` | Token type (Bearer) |
| `restaurant-pos-token-expires` | `1732355712000` | Expiration timestamp in ms |

The token is automatically included in all API requests via the `Authorization` header as:
```
Authorization: bearer eyJhbGci...
```
