# FloodTrace

Interactive Sentinel-1 SAR flood monitoring platform built with Next.js, React, TypeScript, and Node.js.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **React** — UI components
- **Leaflet** + **georaster-layer-for-leaflet** — interactive map with COG rendering
- **AWS S3** — COG storage via Next.js API routes with pre-signed URLs
- **Tailwind CSS** — styling
- **Vercel** — deployment

## Setup

1. Clone the repo
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env.local` and fill in your AWS credentials:
   ```bash
   cp .env.example .env.local
   ```
4. Run the dev server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

1. Push to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Add environment variables in Vercel dashboard (Settings → Environment Variables):
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION`
   - `S3_BUCKET`
4. Deploy

## Architecture

```
Browser
  ↓ fetch /api/manifest       → Next.js API route → S3 (manifest.json)
  ↓ fetch /api/presign?key=…  → Next.js API route → AWS pre-signed URL
  ↓ fetch presigned URL       → S3 COG file (direct, time-limited)
  ↓ render                    → Leaflet + GeoRasterLayer
```

AWS credentials never leave the server — the browser only ever sees temporary pre-signed URLs.
