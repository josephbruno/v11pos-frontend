# Environment Setup

This project uses environment variables to configure different settings for development and production environments.

## Environment Files

- `.env` - Local development environment (used by default, not committed to git)
- `.env.development` - Development environment configuration (committed to git)
- `.env.production` - Production environment configuration (committed to git)
- `.env.example` - Example environment file (committed to git)

## Environment Variables

### API Configuration
- `VITE_API_BASE_URL` - Base URL for the API endpoints (includes `/api/v1`)
- `VITE_BACKEND_URL` - Base URL for the backend (used for image URLs)

### Image Crop Settings
- `VITE_PRODUCT_IMAGE_WIDTH` - Width for product images (default: 800px)
- `VITE_PRODUCT_IMAGE_HEIGHT` - Height for product images (default: 800px)
- `VITE_CATEGORY_IMAGE_WIDTH` - Width for category images (default: 600px)
- `VITE_CATEGORY_IMAGE_HEIGHT` - Height for category images (default: 400px)

## Development Setup

### Local Development (http://localhost:8000)
```bash
npm run dev
```
This uses `.env.development` which points to `http://localhost:8000`

### Build for Production (https://apipos.v11tech.com)
```bash
npm run build:production
```
This uses `.env.production` which points to `https://apipos.v11tech.com`

### Build for Development
```bash
npm run build:development
```

## Quick Start

1. Copy `.env.example` to `.env` (if not already present):
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your local configuration if needed

3. Run the development server:
   ```bash
   npm run dev
   ```

## Production Deployment

For production deployment, the build process will automatically use `.env.production`:

```bash
npm run build
```

The production build will use:
- API: `https://apipos.v11tech.com/api/v1`
- Backend: `https://apipos.v11tech.com`

## Environment Priority

Vite loads environment files in the following order (later files override earlier ones):
1. `.env` - Loaded in all cases
2. `.env.local` - Loaded in all cases, ignored by git
3. `.env.[mode]` - Only loaded in specified mode (development/production)
4. `.env.[mode].local` - Only loaded in specified mode, ignored by git

## Notes

- Never commit `.env` or `.env.local` files to git (they're in `.gitignore`)
- Always keep `.env.example`, `.env.development`, and `.env.production` updated
- All environment variables must be prefixed with `VITE_` to be exposed to the client-side code
