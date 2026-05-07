/**
 * Standalone variant generation logic extracted from Images.ts
 * Run with: node verify-variants.mjs
 * 
 * This verifies the logic matches instruction.md before uploading images
 */

const breakpoints = [
	{ name: 'xs', width: 480 },
	{ name: 'sm', width: 768 },
	{ name: 'md', width: 1024 },
	{ name: 'lg', width: 1440 },
	{ name: 'xl', width: 2048 },
]

/**
 * Simulate the variant cleanup logic from Images.ts afterOperation hook
 * Returns which variants would be DELETED (nulled) based on thresholds
 */
function getVariantsToDelete(originalWidth, originalHeight, allGeneratedSizes) {
	const nulledSizes = []
	// Use 1.0 as threshold: keep all variants < 100% of original (no upsampling)
	const dprThreshold = 1.2

	for (const [sizeName, size] of Object.entries(allGeneratedSizes)) {
		if (!size.filename) continue
		// Always keep the xs sizes
		if (sizeName === 'xs-webp' || sizeName === 'xs-avif') continue

		const variantWidth = size.width

		// Delete if:
		// 1. Exact match dimensions (duplicate)
		// 2. @1x variant exceeds original width (no upsampling)
		// 3. @2x variant exceeds 120% threshold
		const isExactMatch = variantWidth === originalWidth && size.height === originalHeight
		const is1xUpsample = !sizeName.includes('2x') && variantWidth > originalWidth
		const is2xExceedsThreshold = sizeName.includes('2x') && variantWidth >= originalWidth * dprThreshold

		if (isExactMatch || is1xUpsample || is2xExceedsThreshold) {
			nulledSizes.push({ sizeName, reason: isExactMatch ? 'exact-match' : is1xUpsample ? '1x-would-upsample' : '2x-exceeds-threshold', variantWidth })
		}
	}

	return nulledSizes
}

/**
 * Build the full imageSizes list that Payload generates
 */
function buildImageSizes() {
	const sizes = []
	
	// @1x variants
	for (const { name, width } of breakpoints) {
		for (const format of ['webp', 'avif']) {
			sizes.push({ name: `${name}-${format}`, width, format })
		}
	}

	// @2x variants
	for (const { name, width } of breakpoints) {
		for (const format of ['webp', 'avif']) {
			sizes.push({ name: `${name}-2x-${format}`, width: width * 2, format })
		}
	}

	return sizes
}

/**
 * Simulate what happens after uploading an image
 */
function simulateUpload(originalWidth, originalHeight) {
	const allSizes = buildImageSizes()
	
	// Simulate Payload generating all sizes
	const generated = {}
	for (const size of allSizes) {
		generated[size.name] = {
			filename: `image-${size.name}.${size.format}`,
			width: size.width,
			height: Math.round((originalHeight / originalWidth) * size.width),
		}
	}

	const toDelete = getVariantsToDelete(originalWidth, originalHeight, generated)
	const toKeep = Object.keys(generated).filter(
		name => !toDelete.map(d => d.sizeName).includes(name)
	)

	return { toKeep, toDelete, allGenerated: Object.keys(generated) }
}

// Test cases
console.log('=== Variant Generation Verification ===\n')

const testCases = [
	{ width: 800, height: 960, label: '800×960 (your current image)' },
	{ width: 1200, height: 900, label: '1200×900 (large content)' },
	{ width: 2000, height: 1500, label: '2000×1500 (very large)' },
	{ width: 250, height: 250, label: '250×250 (icon)' },
	{ width: 600, height: 400, label: '600×400 (small)' },
]

for (const test of testCases) {
	const result = simulateUpload(test.width, test.height)
	
	console.log(`\n${test.label}:`)
	console.log(`  Total variants generated: ${result.allGenerated.length}`)
	console.log(`  Variants KEPT: ${result.toKeep.length}`)
	result.toKeep.forEach(name => {
		const match = result.allGenerated.find(s => s === name)
		const size = buildImageSizes().find(s => s.name === name)
		console.log(`    - ${name} (${size?.width}px)`)
	})
	
	if (result.toDelete.length > 0) {
		console.log(`  Variants DELETED: ${result.toDelete.length}`)
		result.toDelete.forEach(del => {
			console.log(`    - ${del.sizeName} (${del.variantWidth}px) - reason: ${del.reason}`)
		})
	}
}

console.log('\n=== Expected Results (per instruction.md) ===')
console.log('\n800×960 image:')
console.log('  Keep: xs-webp, xs-avif, xs-2x-webp, xs-2x-avif, sm-webp, sm-avif')
console.log('  (480, 480×2=960, 768)')
console.log('  Delete: everything else (exceeds thresholds)')

console.log('\n1200×900 image:')
console.log('  Keep: xs, sm, md, and their @2x variants (if within thresholds)')
console.log('  Delete: lg, xl, and any @2x that exceed 1.2x threshold')

console.log('\n250×250 image (icon):')
console.log('  Keep: ONLY xs (admin thumbnail)')
console.log('  Delete: everything else (image too small)')
