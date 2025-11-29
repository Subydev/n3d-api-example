# N3D API Example

Example app demonstrating the [N3D Designs API](https://n3dmelbourne.com/resources/docs/designs-api). Shows a use case for showcasing a design libary and how to calculate filaments.

## Features

**Design Library** - Browse desings with search and category filters. Client-side pagination

**Filament Calculator** - Track filament inventory, add designs to a wishlist, and get low-stock warnings with n3d Affiliate purchase links.

## Tech Stack

- React 19 + Vite
- Tailwind
- IndexedDB for image 

## Image Caching

Design images are cached in IndexedDBto reduce network requests. Cache expires after 7 days. See `src/hooks/useImageCache.js`.

## Setup

1. Clone and install:
```bash
npm install
```

2. Create `.env` with your API key:
```
VITE_N3D_API_KEY=your_api_key_here
```

3. Run dev server:
```bash
npm run dev
```

The Vite dev server proxies `/api` requests to handle CORS.

## Deployment

Configured for GitHub Pages. 

For other hosts, run `npm run build` and serve the `dist` folder. Set `VITE_N3D_API_KEY` as an environment variable during build.

## Project Structure

```
src/
  api/n3d.js           - API client
  hooks/
    useImageCache.js   - IndexedDB image caching
    useFilamentInventory.js - Inventory state + localStorage
  pages/               - Route components
  data/filaments.json  - Filament color/stock data
```
