# Image Crop Feature Documentation

## Overview
The image crop feature allows users to crop and resize uploaded images to specific dimensions before saving them. This ensures consistent image sizes across the application and optimizes storage.

## Configuration

### Environment Variables
Image crop dimensions are configured in the `.env` file:

```env
# Image Crop Settings (in pixels)
VITE_PRODUCT_IMAGE_WIDTH=800
VITE_PRODUCT_IMAGE_HEIGHT=800
VITE_CATEGORY_IMAGE_WIDTH=600
VITE_CATEGORY_IMAGE_HEIGHT=400
```

### Supported Image Types

1. **Product Images**
   - Default: 800x800px (1:1 aspect ratio)
   - Max file size: 10MB
   - Use: Product photos in catalog

2. **Category Images**
   - Default: 600x400px (3:2 aspect ratio)
   - Max file size: 10MB
   - Use: Category banners and thumbnails

3. **Avatar Images**
   - Fixed: 200x200px (1:1 aspect ratio)
   - Max file size: 5MB
   - Use: User profile pictures

## Components

### ImageCropDialog
A reusable dialog component for cropping images with zoom and rotation controls.

**Props:**
```typescript
interface ImageCropDialogProps {
  open: boolean;              // Dialog visibility
  imageUrl: string;           // Image to crop (data URL)
  onCropComplete: (blob: Blob) => void;  // Callback with cropped image
  onClose: () => void;        // Close dialog callback
  aspectRatio?: number;       // Aspect ratio (e.g., 1 for square)
  cropWidth?: number;         // Target width in pixels
  cropHeight?: number;        // Target height in pixels
}
```

**Features:**
- Visual crop area with adjustable boundaries
- Zoom control (1x - 3x)
- Rotation control (0° - 360° in 90° steps)
- High-quality image processing
- Preview of final dimensions
- Loading state during processing

**Usage Example:**
```tsx
import ImageCropDialog from "@/components/ImageCropDialog";

const [showCropDialog, setShowCropDialog] = useState(false);
const [originalImage, setOriginalImage] = useState("");

const handleCropComplete = (croppedBlob: Blob) => {
  // Convert blob to file or upload
  const file = new File([croppedBlob], 'cropped.jpg', { type: 'image/jpeg' });
  uploadImage(file);
};

<ImageCropDialog
  open={showCropDialog}
  imageUrl={originalImage}
  onCropComplete={handleCropComplete}
  onClose={() => setShowCropDialog(false)}
  aspectRatio={1}
  cropWidth={800}
  cropHeight={800}
/>
```

### Image Crop Configuration
Centralized configuration in `client/lib/imageCropConfig.ts`

**Functions:**

1. **getImageCropConfig(type)**
   ```typescript
   const config = getImageCropConfig('product');
   // Returns: { width: 800, height: 800, aspectRatio: 1, maxFileSize: 10485760 }
   ```

2. **validateImageFile(file, type)**
   ```typescript
   const validation = validateImageFile(file, 'product');
   if (!validation.valid) {
     console.error(validation.error);
   }
   ```

3. **formatFileSize(bytes)**
   ```typescript
   formatFileSize(5242880); // Returns: "5 MB"
   ```

## Integration Flow

### 1. File Selection
```typescript
const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Validate file
  const validation = validateImageFile(file, 'product');
  if (!validation.valid) {
    setError(validation.error);
    return;
  }

  // Convert to data URL
  const reader = new FileReader();
  reader.onloadend = () => {
    setOriginalImage(reader.result as string);
    setShowCropDialog(true);
  };
  reader.readAsDataURL(file);
};
```

### 2. Crop & Process
```typescript
const handleCropComplete = (croppedBlob: Blob) => {
  // Create preview
  const reader = new FileReader();
  reader.onloadend = () => {
    setImagePreview(reader.result as string);
  };
  reader.readAsDataURL(croppedBlob);

  // Create file for upload
  const croppedFile = new File([croppedBlob], 'product-image.jpg', {
    type: 'image/jpeg',
  });
  setImageFile(croppedFile);
};
```

### 3. Upload to Server
```typescript
const handleSubmit = async () => {
  if (imageFile) {
    const { uploadImage } = await import('@/lib/apiServices');
    const uploadResult = await uploadImage(imageFile, 'products');
    productData.image = uploadResult.url;
  }
  
  // Save product with image URL
  createProduct(productData);
};
```

## Technical Details

### Image Processing
The crop implementation uses canvas API for high-quality image processing:

1. **Rotation Handling**: Uses canvas transformation matrix
2. **Scaling**: High-quality bicubic interpolation (`imageSmoothingQuality: 'high'`)
3. **Output Format**: JPEG with 95% quality for optimal size/quality balance
4. **Memory Efficient**: Cleans up canvas elements after processing

### Performance Considerations
- Cropping is client-side (no server load)
- Compressed JPEG output reduces upload size
- Preview is instant (no server round-trip)
- Original image stays local (not sent to server)

### Browser Compatibility
- Modern browsers (Chrome 88+, Firefox 78+, Safari 14+, Edge 88+)
- Requires FileReader API support
- Requires Canvas API support
- Falls back gracefully if crop library fails

## Customization

### Change Image Dimensions
Update `.env` file:
```env
VITE_PRODUCT_IMAGE_WIDTH=1200
VITE_PRODUCT_IMAGE_HEIGHT=1200
```

Restart dev server for changes to take effect:
```bash
npm run dev
```

### Add New Image Type
1. Add environment variables:
   ```env
   VITE_BANNER_IMAGE_WIDTH=1920
   VITE_BANNER_IMAGE_HEIGHT=400
   ```

2. Update `imageCropConfig.ts`:
   ```typescript
   export const IMAGE_CROP_CONFIG = {
     // ... existing types
     banner: {
       width: parseInt(import.meta.env.VITE_BANNER_IMAGE_WIDTH || "1920"),
       height: parseInt(import.meta.env.VITE_BANNER_IMAGE_HEIGHT || "400"),
       get aspectRatio() {
         return this.width / this.height;
       },
       maxFileSize: 10 * 1024 * 1024,
     },
   };
   ```

3. Use in component:
   ```typescript
   const config = getImageCropConfig('banner');
   ```

### Customize Crop UI
Modify `ImageCropDialog.tsx`:
- Change zoom range: `min={1} max={5}`
- Adjust rotation steps: `step={45}`
- Modify output quality: `toBlob(blob, "image/jpeg", 0.90)`
- Add filters or effects before output

## API Integration

### Upload Endpoint
The cropped image is uploaded to:
```
POST /api/v1/upload/image
Content-Type: multipart/form-data

Form Data:
- file: <File>
- folder: "products" | "categories" | "avatars"
```

**Response:**
```json
{
  "url": "https://cdn.example.com/products/abc123.jpg",
  "filename": "abc123.jpg",
  "size": 245680,
  "content_type": "image/jpeg"
}
```

### Error Handling
```typescript
try {
  const uploadResult = await uploadImage(file, 'products');
  setImageUrl(uploadResult.url);
} catch (error) {
  console.error('Upload failed:', error);
  setError('Failed to upload image. Please try again.');
}
```

## Troubleshooting

### Common Issues

1. **Image not cropping**
   - Check browser console for errors
   - Verify file is valid image format
   - Ensure file size is under limit

2. **Crop dialog not opening**
   - Verify ImageCropDialog is imported
   - Check `showCropDialog` state
   - Ensure `originalImage` has data URL

3. **Upload failing**
   - Check network tab for API errors
   - Verify authentication token
   - Check server upload endpoint

4. **Blurry output**
   - Increase `cropWidth` and `cropHeight`
   - Adjust JPEG quality in `getCroppedImg`
   - Use PNG format for transparency

### Debug Mode
Enable console logging:
```typescript
console.log('Crop config:', getImageCropConfig('product'));
console.log('File validation:', validateImageFile(file, 'product'));
console.log('Cropped blob size:', croppedBlob.size);
```

## Dependencies

- **react-easy-crop** (^5.0.8): Core cropping functionality
- **@radix-ui/react-dialog**: Dialog component
- **@radix-ui/react-slider**: Zoom/rotation sliders
- **lucide-react**: Icons

## Best Practices

1. **Always validate files** before opening crop dialog
2. **Show loading states** during crop processing
3. **Provide preview** of cropped image before upload
4. **Clear file input** after successful crop
5. **Handle errors gracefully** with user-friendly messages
6. **Optimize dimensions** based on actual display size
7. **Use appropriate formats**: JPEG for photos, PNG for graphics with transparency

## Future Enhancements

- [ ] Multiple aspect ratio presets
- [ ] Filters and adjustments (brightness, contrast)
- [ ] Batch image cropping
- [ ] Drag & drop support
- [ ] Mobile-optimized touch controls
- [ ] Image compression quality selector
- [ ] Compare before/after preview
- [ ] Undo/redo functionality
