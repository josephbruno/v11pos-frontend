# Conditional Image Submission Fix

## Issue
The user requested that the product edit form should only send the `image` field when a new image file has been selected. If no new image is selected, the `image` field should be omitted from the submission to allow the backend to retain the existing image.

## Previous Implementation
The conditional logic was already partially implemented (lines 1258-1261), but there was a bug:

```typescript
// Only include image if a new image file was selected
if (imageFile) {
  apiData.image = updatedData.image;  // ❌ WRONG: passing string instead of File
}
```

This was passing `updatedData.image` (a string from form data) instead of the actual `imageFile` (File object).

## Solution
Changed line 1260 to pass the actual File object:

```typescript
// Only include image if a new image file was selected
if (imageFile) {
  apiData.image = imageFile;  // ✅ CORRECT: passing the File object
}
```

## How It Works

### When Editing a Product WITHOUT Selecting a New Image:
1. User opens the "Edit Product" dialog
2. Existing product image is displayed (if any) via the preview
3. User makes other changes (name, price, etc.)
4. User clicks "Save Product"
5. `imageFile` state is `null` (no new file selected)
6. The `if (imageFile)` condition is false
7. **The `image` field is NOT included in `apiData`**
8. Backend receives the update without an image field
9. Backend retains the existing image

### When Editing a Product WITH a New Image:
1. User opens the "Edit Product" dialog
2. User clicks the file input and selects a new image
3. `handleImageChange` is triggered:
   - Validates the file
   - Sets `imageFile` to the selected File object
   - Sets `imagePreview` to a blob URL for preview
4. User clicks "Save Product"
5. `imageFile` state contains the File object
6. The `if (imageFile)` condition is true
7. **The `image` field is included in `apiData` with the File object**
8. Backend receives the update with the new image file
9. Backend processes and saves the new image

## Consistency with Add Product
This implementation now matches the "Add Product" handler (line 902):

```typescript
const apiData = {
  name: productData.name!,
  slug: productData.slug!,
  category_id: productData.category!,
  price: dollarsToCents(productData.price || 0),
  description: productData.description || undefined,
  sku: productData.sku || undefined,
  stock: productData.stock || 0,
  is_available: productData.available ?? true,
  image: imageFile || null,  // ✅ Passing File object
};
```

## Files Modified
- **File:** `client/pages/ProductManagement.tsx`
- **Line:** 1260
- **Change:** `apiData.image = updatedData.image;` → `apiData.image = imageFile;`

## Testing Recommendations

### Test Case 1: Edit Product Without Changing Image
1. Navigate to Product Management
2. Click "Edit" on an existing product with an image
3. Change the product name or price
4. Click "Save Product"
5. **Expected:** Product updates successfully, existing image is retained

### Test Case 2: Edit Product With New Image
1. Navigate to Product Management
2. Click "Edit" on an existing product
3. Select a new image file
4. Click "Save Product"
5. **Expected:** Product updates successfully, new image is uploaded and displayed

### Test Case 3: Edit Product - Remove Image (Future Enhancement)
Currently, there's no way to explicitly remove an image. A future enhancement could add a "Remove Image" button that sets a flag to explicitly delete the image.

## Related Code
- **Image Preview Fix:** The image preview for existing products was previously fixed to concatenate `BACKEND_URL` with the image path (line 1209)
- **Image State Management:** Image state (`imagePreview`, `imageFile`) is managed at the parent component level to persist across dialog re-renders (lines 127-128)
- **Image Validation:** Uses `validateImageFile` from `@/lib/imageCropConfig` to validate file size and type (line 375)

## Status
✅ **COMPLETED** - The conditional image submission logic is now properly implemented and matches the Add Product functionality.
