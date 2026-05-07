# Image Variant Generation Strategy for Payload CMS

## Context
Building a SvelteKit + Payload CMS 3.0 monolith with static frontend and dynamic admin/API routes. Serving images via WebP/AVIF with responsive srcsets.

## Breakpoints
```typescript
const breakpoints = [
  { name: 'xs', width: 480 },  // small mobile
  { name: 'sm', width: 768 },  // mobile / large phone
  { name: 'md', width: 1024 }, // tablet / small desktop
  { name: 'lg', width: 1440 }, // desktop
  { name: 'xl', width: 2048 }, // 2K
] as const
```

## Core Rules for Variant Generation

### 1. Never Upsample
- Only generate variants smaller than the original image
- If original is 800px wide, don't generate 1024px or larger variants

### 2. Account for Device Pixel Ratio (DPR)
- Modern Apple devices and many others use 2x pixel density
- For each breakpoint CSS size, also generate @2x variant (size × 2)
- Example: 768px breakpoint needs both 768w and 1536w (768×2)

### 3. Smart Threshold (85% Rule)
- Only generate a variant if it's < 85% of the original width
- This avoids cluttering srcset with near-duplicate sizes
- Exception: Allow DPR variants up to 1.2× original if needed for 2x displays

### 4. Skip Small Images (Icon Rule)
- If image width < 300px, don't generate srcset at all
- Just store original + WebP/AVIF versions, no size variants

### 5. Format Conversion (Always)
- Accept JPEG/PNG on upload
- Auto-convert all variants to WebP and AVIF
- Store metadata: width, height, original URL

## Implementation Pattern

```typescript
const imageVariants = {
  xs: { css: 480, dpr2: 960 },  // 480 @1x, 480 @2x
  sm: { css: 768, dpr2: 1536 }, // 768 @1x, 768 @2x
  md: { css: 1024, dpr2: 2048 },
  lg: { css: 1440, dpr2: 2880 },
};

const generateVariantsFor = (originalWidth: number): number[] => {
  if (originalWidth < 300) return []; // No srcset for icons
  
  const result: number[] = [];
  const threshold = 0.85;
  const dprThreshold = 1.2;
  
  for (const [_, sizes] of Object.entries(imageVariants)) {
    // Add 1x variant if < original * threshold
    if (sizes.css < originalWidth * threshold) {
      result.push(sizes.css);
    }
    
    // Add 2x variant if < original * dprThreshold
    if (sizes.dpr2 < originalWidth * dprThreshold) {
      result.push(sizes.dpr2);
    }
  }
  
  return [...new Set(result)].sort((a, b) => a - b);
};

// Examples:
generateVariantsFor(800);   // [480, 768, 960]
generateVariantsFor(1200);  // [480, 768, 960, 1024]
generateVariantsFor(2000);  // [480, 768, 960, 1024, 1440, 1920]
generateVariantsFor(250);   // [] (skip, icon)
```

## Frontend Implementation

```svelte
{#if image.width < 300}
  <!-- Icon: no srcset -->
  <img src={image.url} width={image.width} height={image.height} alt="..." />
{:else}
  <!-- Content: responsive srcset -->
  <picture>
    <source type="image/avif" srcset={buildSrcset(image, 'avif')} sizes={buildSizes()} />
    <source type="image/webp" srcset={buildSrcset(image, 'webp')} sizes={buildSizes()} />
    <img src={image.url} alt="..." />
  </picture>
{/if}
```

```typescript
const buildSrcset = (image, format) => {
  const variants = generateVariantsFor(image.width);
  return variants
    .map(w => `${image.url}?w=${w}&f=${format} ${w}w`)
    .join(', ');
};

const buildSizes = () => {
  return `
    (max-width: 480px) 100vw,
    (max-width: 768px) 100vw,
    (max-width: 1024px) 90vw,
    (max-width: 1440px) 85vw,
    1200px
  `;
};
```

## Storage Optimization

1. **Format Conversion on Upload**
   - Accept: JPEG, PNG, WebP, AVIF
   - Store only: WebP + AVIF variants (for each size)
   - Savings: ~60% vs original JPEG/PNG

2. **Variant Count**
   - Most images: 2-4 variants max
   - Small images: 0 variants (just WebP/AVIF of original)
   - Large images (>2K): Full suite of variants

3. **Example Breakdown**
   - Original: 800×960 JPEG (250KB)
   - Variants generated: 480w, 768w, 960w (3 sizes)
   - Each format: WebP + AVIF (6 total files)
   - Compressed storage: ~60KB per size → ~360KB total
   - Savings: ~30% of original

## Integration with Payload CMS 3.0

Hook into Payload's image field to automatically generate and store variants:

```typescript
export const beforeChangeImage = async ({ data, doc }) => {
  const { width, height } = doc.file;
  
  if (width < 300) {
    doc.hasVariants = false;
    return;
  }
  
  const variants = generateVariantsFor(width);
  
  doc.variants = {
    sizes: variants,
    hasVariants: true,
    originalWidth: width,
    originalHeight: height,
  };
  
  // Generate WebP + AVIF for each variant
  // Store in file storage (S3, local, etc.)
};
```

## Key Decisions Made

- ✅ Accept JPEG/PNG on upload, auto-convert to WebP/AVIF
- ✅ Only downscale, never upsample
- ✅ Account for 2x DPR displays (common on mobile/tablets)
- ✅ Skip variants for small images (<300px)
- ✅ Use 85% threshold to avoid near-duplicate sizes
- ❌ Don't match variants exactly to CSS breakpoints
- ❌ Don't store original format after conversion

## Related Tasks

- [ ] Implement Payload hook for variant generation
- [ ] Set up WebP/AVIF conversion pipeline (sharp)
- [ ] Create frontend `<picture>` helper with srcset builder
- [ ] Test on real devices to verify DPR handling
- [ ] Monitor CDN cache hit rates by variant size