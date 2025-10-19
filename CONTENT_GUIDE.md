# 📸 Content Guide - The Barber Shop Waterloo

## Complete Content Requirements & Specifications

**Project:** The Barber Shop - Waterloo Landing Page  
**Last Updated:** 19 Ekim 2025  
**Status:** Content Collection Phase

---

## 📋 Table of Contents

1. [Content Overview](#content-overview)
2. [Images Requirements](#images-requirements)
3. [Video Requirements](#video-requirements)
4. [Logo & Branding](#logo-branding)
5. [Text Content](#text-content)
6. [File Organization](#file-organization)
7. [Optimization Guide](#optimization-guide)

---

## 🎯 Content Overview

### Required Content (Mandatory)

| Type              | Quantity | Priority  | Status     |
| ----------------- | -------- | --------- | ---------- |
| Interior Photos   | 5-6      | 🔴 High   | ⬜ Pending |
| Promotional Video | 1        | 🔴 High   | ⬜ Pending |
| Logo (SVG)        | 1        | 🔴 High   | ⬜ Pending |
| Hero Background   | 1        | 🟡 Medium | ⬜ Pending |
| Favicon           | 1        | 🟡 Medium | ⬜ Pending |

### Optional Content (Nice to Have)

| Type                  | Quantity | Priority | Status     |
| --------------------- | -------- | -------- | ---------- |
| Team Photos           | 2-3      | 🟢 Low   | ⬜ Pending |
| Product Photos        | 3-4      | 🟢 Low   | ⬜ Pending |
| Customer Testimonials | 3-5      | 🟢 Low   | ⬜ Pending |

---

## 📷 Images Requirements

### 1. Interior Photos (Gallery Section)

**Purpose:** Showcase the barber shop atmosphere, quality, and premium feel

**Specifications:**

```
Quantity: 5-6 images
Format: JPG or WebP
Resolution: 1920x1280px (3:2 ratio)
File size: Max 500KB per image
Orientation: Horizontal (landscape)
Quality: High (professional photography)
```

**Recommended Shots:**

#### Image 1: Main Interior View

- **Subject:** Wide shot of the barber shop interior
- **Angle:** Eye-level, showing multiple barber chairs
- **Lighting:** Natural + warm artificial lighting
- **Elements:** Chairs, mirrors, vintage decor, gold accents
- **Filename:** `interior-main.jpg`

#### Image 2: Barber Chair Detail

- **Subject:** Close-up of classic barber chair
- **Angle:** 45-degree angle
- **Lighting:** Dramatic side lighting
- **Elements:** Leather chair, mirror, tools in background
- **Filename:** `barber-chair-detail.jpg`

#### Image 3: Premium Products Shelf

- **Subject:** Product display shelf
- **Angle:** Straight-on or slight angle
- **Lighting:** Well-lit, showing product labels
- **Elements:** Premium grooming products, organized display
- **Filename:** `products-shelf.jpg`

#### Image 4: Whisky/Coffee Service

- **Subject:** Complimentary drinks setup
- **Angle:** Top-down or 45-degree
- **Lighting:** Warm, inviting
- **Elements:** Whisky bottles, coffee machine, or serving tray
- **Filename:** `drinks-service.jpg`

#### Image 5: Grooming Detail Shot

- **Subject:** Barber performing service
- **Angle:** Close-up of hands working
- **Lighting:** Natural, focused
- **Elements:** Scissors, comb, shaving tools
- **Filename:** `grooming-detail.jpg`

#### Image 6: Atmosphere Shot

- **Subject:** Overall ambiance
- **Angle:** Wide or medium
- **Lighting:** Moody, elegant
- **Elements:** Ambient lighting, decor details
- **Filename:** `atmosphere.jpg`

---

### 2. Hero Background Image

**Purpose:** Main background for Hero section (London Eye vicinity)

**Specifications:**

```
Quantity: 1 image
Format: JPG
Resolution: 2560x1440px (16:9 ratio)
File size: Max 800KB
Orientation: Horizontal
Style: Blurred or subtle (won't distract from text)
```

**Recommended Shot:**

- London Eye silhouette at dusk/night
- Waterloo area street view
- Thames riverside view
- Abstract gold/black gradient (if no photo available)

**Filename:** `hero-background.jpg`

---

### 3. Logo Files

**Purpose:** Brand identity across website and favicon

**Specifications:**

#### Primary Logo (SVG)

```
Format: SVG (vector)
Colors: Gold (#D4AF37) + Black (#0E0E0E)
Background: Transparent
Elements: Scissors icon + text (optional)
Filename: logo.svg
```

#### Favicon Set

```
Format: ICO + PNG
Sizes needed:
- favicon.ico (16x16, 32x32)
- apple-touch-icon.png (180x180)
- favicon-32x32.png
- favicon-16x16.png

Filename structure:
/public/favicon.ico
/public/apple-touch-icon.png
/public/favicon-32x32.png
/public/favicon-16x16.png
```

**Logo Design Guidelines:**

- **Style:** Minimal, elegant, premium
- **Icon:** Scissors or barber pole silhouette
- **Typography:** Playfair Display (serif) for text
- **Colors:** Gold primary, black secondary
- **Scalability:** Must work at 16x16px to 512x512px

---

## 🎬 Video Requirements

### Promotional Video (Gallery Section)

**Purpose:** Showcase atmosphere and experience in motion

**Specifications:**

```
Duration: 10-15 seconds
Format: MP4 (H.264 codec)
Resolution: 1920x1080px (1080p)
Frame rate: 30fps
File size: Max 5MB (compressed)
Audio: Muted (no sound needed)
Aspect ratio: 16:9
Loop: Yes (seamless loop preferred)
```

**Content Ideas:**

#### Option 1: Interior Walk-through

- Smooth camera movement through the shop
- Show chairs, products, decor
- Focus on gold accents and lighting
- Transition between different areas

#### Option 2: Service Montage

- Quick cuts of grooming services
- Hand movements with tools
- Hot towel application
- Whisky pour or coffee preparation
- Final styling moment

#### Option 3: Atmosphere Focus

- Static or slow-motion shots
- Ambient lighting showcase
- Detail shots of vintage elements
- Black and gold color grading

**Technical Notes:**

- Shot in good lighting (natural + artificial)
- Stable footage (gimbal/tripod)
- Color graded (warm, elegant tones)
- Compressed for web (H.264, CRF 23-28)

**Filename:** `promo-video.mp4`

---

## 📝 Text Content

### Current Content Status

#### ✅ Completed Sections

- [x] Hero tagline
- [x] About section copy
- [x] Services descriptions (13 services)
- [x] Experience section copy
- [x] Footer contact info

#### ⬜ Optional Additions

1. **Customer Testimonials** (if available)

```markdown
Format:
"Quote from customer"
— Customer Name, Occupation (optional)
```

Example:

```
"Best barber in London. The attention to detail is incredible."
— James M., Business Executive
```

2. **Team Bios** (if wanted)

```markdown
Format:
Name
Title/Role
Brief description (2-3 sentences)
```

---

## 📁 File Organization

### Directory Structure

```
/public
  ├── logo.svg                    # Main logo
  ├── favicon.ico                 # Browser icon
  ├── apple-touch-icon.png        # iOS icon
  ├── favicon-32x32.png           # Desktop icon
  ├── favicon-16x16.png           # Small icon
  ├── hero-background.jpg         # Hero section background
  ├── promo-video.mp4             # Promotional video
  │
  └── /gallery                    # Gallery images
      ├── interior-main.jpg       # Main interior shot
      ├── barber-chair-detail.jpg # Chair close-up
      ├── products-shelf.jpg      # Products display
      ├── drinks-service.jpg      # Whisky/coffee setup
      ├── grooming-detail.jpg     # Service detail
      └── atmosphere.jpg          # Ambiance shot
```

### Naming Conventions

**Rules:**

- Use lowercase
- Use hyphens (not spaces or underscores)
- Be descriptive
- Include purpose in name

**Examples:**
✅ Good: `interior-main.jpg`, `drinks-service.jpg`
❌ Bad: `IMG_1234.jpg`, `photo 1.jpg`

---

## 🎨 Optimization Guide

### Image Optimization

#### Online Tools (Recommended)

1. **TinyPNG** - https://tinypng.com

   - Upload images
   - Automatic compression
   - Download optimized versions

2. **Squoosh** - https://squoosh.app
   - Browser-based
   - Fine-tune quality settings
   - Compare before/after

#### Command Line (Advanced)

```bash
# Install ImageMagick
brew install imagemagick

# Resize and compress
magick input.jpg -resize 1920x1280 -quality 85 output.jpg

# Batch process
for f in *.jpg; do magick "$f" -resize 1920x1280 -quality 85 "optimized-$f"; done
```

---

### Video Optimization

#### Online Tools

1. **CloudConvert** - https://cloudconvert.com

   - Convert to MP4
   - Reduce file size
   - Set quality level

2. **Clideo** - https://clideo.com/compress-video
   - Simple compression
   - No software needed

#### Command Line (FFmpeg)

```bash
# Install FFmpeg
brew install ffmpeg

# Compress video (balanced quality)
ffmpeg -i input.mp4 -c:v libx264 -crf 28 -preset slow -c:a aac -b:a 128k output.mp4

# Further compression (smaller file)
ffmpeg -i input.mp4 -c:v libx264 -crf 32 -preset slow -vf scale=1280:720 -an output.mp4

# Create seamless loop (trim and crossfade)
ffmpeg -i input.mp4 -filter_complex "[0]trim=0:10,setpts=PTS-STARTPTS[a];[a]loop=2:250:0,setpts=PTS-STARTPTS[out]" -map "[out]" output.mp4
```

---

### WebP Conversion (Modern Format)

```bash
# Install cwebp
brew install webp

# Convert JPG to WebP
cwebp -q 85 input.jpg -o output.webp

# Batch convert
for f in *.jpg; do cwebp -q 85 "$f" -o "${f%.jpg}.webp"; done
```

**Usage in Code:**

```tsx
<picture>
  <source srcSet="/gallery/image.webp" type="image/webp" />
  <img src="/gallery/image.jpg" alt="Description" />
</picture>
```

---

## 📊 Quality Checklist

### Images

- [ ] Resolution: 1920x1280px minimum
- [ ] File size: Under 500KB each
- [ ] Format: JPG or WebP
- [ ] Proper lighting and composition
- [ ] Professional quality
- [ ] Consistent color grading (warm, gold tones)
- [ ] No watermarks or logos (except yours)

### Video

- [ ] Duration: 10-15 seconds
- [ ] Resolution: 1080p
- [ ] File size: Under 5MB
- [ ] Format: MP4 (H.264)
- [ ] No audio needed
- [ ] Smooth, professional footage
- [ ] Color graded for consistency

### Logo

- [ ] SVG format (scalable)
- [ ] Transparent background
- [ ] Gold + black colors
- [ ] Clean, minimal design
- [ ] Works at small sizes (favicon)

---

## 🎯 Content Collection Timeline

### Week 1: Photography

- Day 1-2: Schedule professional photographer
- Day 3-4: Photo shoot (interior, details, products)
- Day 5: Photo selection and editing

### Week 2: Video & Design

- Day 1-2: Video shoot and editing
- Day 3: Logo design/finalization
- Day 4: Content optimization
- Day 5: Upload and integration

### Week 3: Review & Deploy

- Day 1-2: Content review on staging
- Day 3: Final adjustments
- Day 4: Performance testing
- Day 5: Production deployment

---

## 📞 Professional Services (Recommendations)

### Photography

**What to look for:**

- Portfolio with interior/commercial work
- Experience with low-light photography
- Understanding of brand aesthetics
- Equipment: Full-frame camera, prime lenses

**Budget:** £300-500 for half-day shoot

### Videography

**What to look for:**

- Experience with promotional videos
- Gimbal/stabilization equipment
- Color grading skills
- Fast turnaround

**Budget:** £400-600 for shoot + edit

### Logo Design (if needed)

**What to look for:**

- Vector design capability
- Brand identity experience
- Multiple revision rounds
- File formats: SVG, PNG, AI

**Budget:** £200-400 for full logo package

---

## 🚀 Integration Steps

Once content is ready:

1. **Add to Project:**

```bash
# Copy files to public folder
cp your-images/* /public/gallery/
cp your-logo.svg /public/logo.svg
cp your-video.mp4 /public/promo-video.mp4
```

2. **Update Components:**

- Replace placeholder images in `Gallery.tsx`
- Add logo to `Navbar.tsx` and `Hero.tsx`
- Update `Hero.tsx` background image
- Add favicon files

3. **Test:**

```bash
pnpm dev
# Check all images load
# Verify video plays
# Test mobile views
```

4. **Build & Deploy:**

```bash
pnpm build
# Follow DEPLOYMENT_GUIDE.md
```

---

## 📈 Success Metrics

### Image Performance

- Load time: < 2 seconds per image
- Cumulative Layout Shift: < 0.1
- Lazy loading working

### Video Performance

- First frame: < 1 second
- Auto-play working
- Loop seamless
- No audio issues

### Overall

- Lighthouse Score: 90+
- Visual consistency: 100%
- Brand alignment: ✅

---

## 💡 Tips & Best Practices

### Photography

1. **Golden Hour:** Shoot during magic hour for warm tones
2. **Consistency:** Use same camera settings for all shots
3. **Clean Space:** Tidy up before shooting
4. **Details Matter:** Focus on gold accents, premium products

### Video

1. **Stabilization:** Use gimbal or tripod (no shaky footage)
2. **Silence:** Mute video, no distracting sounds
3. **Length:** Keep it short, attention-grabbing
4. **Loop:** Ensure smooth loop point

### Editing

1. **Color Grading:** Warm, golden tones (match brand)
2. **Contrast:** Boost blacks, enhance golds
3. **Sharpness:** Crisp but not over-sharpened
4. **Consistency:** All images should feel cohesive

---

**Content Manager:** TBD  
**Last Review:** 19 Ekim 2025  
**Status:** Ready for Content Collection 📸
