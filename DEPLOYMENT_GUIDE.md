# 🚀 Cloudflare Pages Deployment Guide

## The Barber Shop - Waterloo | Cloudflare Pages Deployment

**Tarih:** 19 Ekim 2025  
**Platform:** Cloudflare Pages  
**Framework:** Next.js 15 (Static Export)

---

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Next.js Static Export Configuration](#nextjs-static-export)
3. [Build Process](#build-process)
4. [Cloudflare Pages Setup](#cloudflare-pages-setup)
5. [Domain Configuration](#domain-configuration)
6. [Post-Deployment](#post-deployment)

---

## ✅ Pre-Deployment Checklist

### 1. Content Ready

- [ ] All images uploaded to `/public/gallery`
- [x] Logo added to `/public` (logo.svg)
- [x] Favicon files generated (favicon.ico, favicon-16x16.png, favicon-32x32.png, apple-touch-icon.png)
- [ ] Video file added to `/public`
- [ ] Hero background image added
- [ ] All placeholder content replaced

### 2. Configuration Files

- [x] `next.config.ts` updated for static export
- [x] Environment variables set (if any)
- [x] `.gitignore` includes `/out` directory

### 3. Code Quality

- [ ] No console errors in browser
- [ ] All links tested
- [ ] Mobile responsive verified
- [ ] Cross-browser tested
- [x] Favicon visible in browser tab

---

## 🔧 Next.js Static Export Configuration

### Step 1: Update `next.config.ts`

Create or update your `next.config.ts` file:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
```

**Açıklama:**

- `output: 'export'` → Static HTML export aktivasyonu
- `images.unoptimized: true` → Cloudflare Pages için image optimization devre dışı
- `trailingSlash: true` → URL'lerde trailing slash kullan

---

## 🏗️ Build Process

### Step 1: Clean Build

```bash
# Clear cache and old builds
rm -rf .next out

# Install dependencies (if needed)
pnpm install
```

### Step 2: Build for Production

```bash
# Create static export
pnpm build
```

Bu komut:

1. Next.js production build yapar
2. Static HTML files oluşturur
3. `/out` klasörüne export eder

### Step 3: Verify Build

```bash
# Check out directory
ls -la out/

# Should contain:
# - index.html
# - _next/
# - images/
# - etc.
```

### Step 4: Test Locally (Optional)

```bash
# Serve static files locally
npx serve out

# Open http://localhost:3000
```

---

## ☁️ Cloudflare Pages Setup

### Method 1: Git Integration (Recommended)

#### 1. Push to GitHub

```bash
git add .
git commit -m "Ready for Cloudflare Pages deployment"
git push origin main
```

#### 2. Cloudflare Dashboard

1. Login to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to **Workers & Pages**
3. Click **Create application** → **Pages**
4. Click **Connect to Git**

#### 3. Configure Build Settings

```
Project name: the-barber-shop-waterloo
Production branch: main
Framework preset: Next.js (Static HTML Export)
Build command: pnpm build
Build output directory: out
```

#### 4. Environment Variables (if needed)

```
NODE_VERSION=18
```

#### 5. Deploy

- Click **Save and Deploy**
- Wait for build to complete (~2-5 minutes)
- Your site will be live at: `https://the-barber-shop-waterloo.pages.dev`

---

### Method 2: Direct Upload (Wrangler CLI)

#### 1. Install Wrangler

```bash
npm install -g wrangler
```

#### 2. Login to Cloudflare

```bash
wrangler login
```

#### 3. Create Pages Project

```bash
wrangler pages project create the-barber-shop-waterloo
```

#### 4. Deploy

```bash
# From project root
pnpm build
wrangler pages deploy out --project-name=the-barber-shop-waterloo
```

---

## 🌐 Domain Configuration

### Option 1: Custom Domain (Recommended)

#### 1. Add Custom Domain in Cloudflare

1. Go to your Pages project
2. Click **Custom domains**
3. Click **Set up a custom domain**
4. Enter: `thebarbershop.co.uk` (or your domain)

#### 2. DNS Configuration

Cloudflare will automatically:

- Add DNS records
- Issue SSL certificate
- Enable HTTPS redirect

**DNS Records Added:**

```
Type: CNAME
Name: @ (or www)
Target: the-barber-shop-waterloo.pages.dev
Proxy: ✅ Enabled
```

#### 3. Wait for DNS Propagation

- Usually 5-15 minutes
- Check: https://dnschecker.org

---

### Option 2: Subdomain

If using subdomain (e.g., `shop.yourdomain.com`):

```
Type: CNAME
Name: shop
Target: the-barber-shop-waterloo.pages.dev
Proxy: ✅ Enabled
```

---

## 📊 Post-Deployment

### 1. Verify Deployment

**Check these URLs:**

- ✅ Homepage: `https://yourdomain.com`
- ✅ Services scroll: `https://yourdomain.com#services`
- ✅ Location scroll: `https://yourdomain.com#location`
- ✅ All images loading
- ✅ Video playing (if added)
- ✅ Mobile menu working

### 2. Performance Test

**Run Lighthouse Audit:**

1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Run audit for:
   - Performance
   - Accessibility
   - Best Practices
   - SEO

**Target Scores:**

- Performance: 90+
- Accessibility: 95+
- Best Practices: 100
- SEO: 100

### 3. Analytics Setup (Optional)

#### Cloudflare Web Analytics (Free)

1. Go to **Analytics** → **Web Analytics**
2. Click **Add a site**
3. Enter your domain
4. Copy the tracking code
5. Add to `layout.tsx`:

```tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Cloudflare Web Analytics */}
        <script
          defer
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "YOUR_TOKEN_HERE"}'
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

---

## 🔄 Continuous Deployment

### Automatic Deployments

Cloudflare Pages automatically deploys when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Update services pricing"
git push origin main

# Cloudflare automatically:
# 1. Detects push
# 2. Runs build
# 3. Deploys new version
# 4. Updates live site
```

### Preview Deployments

Every branch/PR gets a preview URL:

```
https://abc123.the-barber-shop-waterloo.pages.dev
```

---

## 🛠️ Troubleshooting

### Build Fails

**Error: "Module not found"**

```bash
# Solution: Clear cache and reinstall
rm -rf node_modules .next out
pnpm install
pnpm build
```

**Error: "Image optimization not supported"**

```typescript
// next.config.ts - Add this:
images: {
  unoptimized: true,
}
```

### Images Not Loading

**Problem:** Images not found in `/out` directory

**Solution:** Ensure images are in `/public` folder:

```
/public
  /gallery
    image-1.jpg
    image-2.jpg
  logo.svg
  video.mp4
```

### 404 Errors

**Problem:** Routes not working

**Solution:** For static export, use hash routing or ensure `trailingSlash: true`

---

## 📈 Performance Optimization

### 1. Image Optimization

Use Next.js Image component with proper sizing:

```tsx
import Image from "next/image";

<Image
  src="/gallery/image-1.jpg"
  alt="Barber shop interior"
  width={800}
  height={600}
  quality={85}
/>;
```

### 2. Video Optimization

Compress video before upload:

```bash
# Using ffmpeg
ffmpeg -i input.mp4 -c:v libx264 -crf 28 -preset slow -c:a aac -b:a 128k output.mp4
```

### 3. Enable Cloudflare Features

In Cloudflare Dashboard:

- ✅ Enable **Auto Minify** (HTML, CSS, JS)
- ✅ Enable **Brotli** compression
- ✅ Enable **HTTP/3**
- ✅ Set **Browser Cache TTL** to 1 month

---

## 🔐 Security

### 1. SSL/TLS Settings

Recommended settings:

- SSL/TLS encryption mode: **Full (strict)**
- Always Use HTTPS: **Enabled**
- Automatic HTTPS Rewrites: **Enabled**

### 2. Security Headers

Add in Cloudflare Pages dashboard under **Settings** → **Functions**:

Create `_headers` file in `/public`:

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

---

## 📝 Deployment Checklist

### Before Deploy

- [ ] All content added (images, video, text)
- [x] `next.config.ts` configured for export
- [x] Logo and favicons generated
- [ ] Build tested locally
- [ ] Git repository up to date
- [ ] Environment variables set

### During Deploy

- [ ] Cloudflare project created
- [ ] Build settings configured
- [ ] Custom domain added
- [ ] SSL certificate issued

### After Deploy

- [ ] Site loading correctly
- [ ] All links working
- [ ] Images displaying
- [ ] Favicon showing in browser tab
- [ ] Mobile responsive
- [ ] Lighthouse score checked
- [ ] Analytics configured (optional)

---

## 🎯 Quick Commands Reference

```bash
# Development
pnpm dev

# Build for production
pnpm build

# Test production build locally
npx serve out

# Deploy with Wrangler
wrangler pages deploy out --project-name=the-barber-shop-waterloo

# Clear cache
rm -rf .next out node_modules
pnpm install
```

---

## 📞 Support

**Cloudflare Documentation:**

- [Pages Documentation](https://developers.cloudflare.com/pages/)
- [Next.js on Pages](https://developers.cloudflare.com/pages/framework-guides/nextjs/)

**Next.js Documentation:**

- [Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)

**Community:**

- [Cloudflare Community](https://community.cloudflare.com/)
- [Next.js Discord](https://nextjs.org/discord)

---

**Deployment Date:** TBD  
**Last Updated:** 19 Ekim 2025  
**Status:** Ready for Deployment 🚀
