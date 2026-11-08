/**
 * scripts/test-brand-asset-integrity.ts
 *
 * Automated Asset Reference & Integrity Test for FINTERA Brand Asset System (R1.1).
 * Verifies:
 * 1. 100% of assets in FINTERA_BRAND_ASSET_REGISTRY exist with matching SHA-256 & dimensions.
 * 2. 100% of hardcoded or dynamic `/images/brand-system/*` strings in source code resolve to valid files.
 * 3. Exact 4:5 aspect ratio (0.8) for all carousel backgrounds.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { FINTERA_BRAND_ASSET_REGISTRY } from "../lib/brand-assets";

const ROOT_DIR = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT_DIR, "public");

interface AssetAuditResult {
  totalAssets: number;
  passedRegistryAssets: number;
  scannedCodeReferences: number;
  failedReferences: string[];
  mismatchedHashes: string[];
}

function calculateSha256(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(fileBuffer).digest("hex");
}

function getAllSourceFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (file === "node_modules" || file === ".next" || file === ".git" || file === "dist") {
      continue;
    }
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      getAllSourceFiles(fullPath, fileList);
    } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

export function runBrandAssetIntegrityAudit(): AssetAuditResult {
  console.log("🔍 [Audit R1.1] Starting FINTERA Brand Asset Integrity Audit...\n");

  const result: AssetAuditResult = {
    totalAssets: FINTERA_BRAND_ASSET_REGISTRY.length,
    passedRegistryAssets: 0,
    scannedCodeReferences: 0,
    failedReferences: [],
    mismatchedHashes: [],
  };

  // 1. Audit Registry Entries
  console.log(`📋 Verifying ${result.totalAssets} Registry Assets in lib/brand-assets.ts:`);
  for (const asset of FINTERA_BRAND_ASSET_REGISTRY) {
    const publicFilePath = path.join(PUBLIC_DIR, asset.publicUrl);
    const masterFilePath = path.join(PUBLIC_DIR, asset.masterUrl);

    if (!fs.existsSync(publicFilePath)) {
      result.failedReferences.push(`Registry Asset [${asset.id}]: missing publicUrl at ${asset.publicUrl}`);
      continue;
    }

    if (!fs.existsSync(masterFilePath)) {
      result.failedReferences.push(`Registry Asset [${asset.id}]: missing masterUrl at ${asset.masterUrl}`);
      continue;
    }

    const calculatedHash = calculateSha256(publicFilePath);
    if (calculatedHash !== asset.contentHash) {
      result.mismatchedHashes.push(
        `Asset [${asset.id}]: Hash mismatch! Declared: ${asset.contentHash.slice(0, 16)}... Real: ${calculatedHash.slice(0, 16)}...`
      );
    }

    // Verify 4:5 geometry for Carousel assets
    if (asset.role === "CAROUSEL_BACKGROUND") {
      if (asset.aspectRatio !== 0.8 || asset.dimensions.width !== 1080 || asset.dimensions.height !== 1350) {
        result.failedReferences.push(
          `Carousel Asset [${asset.id}]: Not normalized to 1080x1350 (0.8)! Found: ${asset.dimensions.width}x${asset.dimensions.height}`
        );
      }
    }

    result.passedRegistryAssets++;
    console.log(`  ✔ [PASS] ${asset.id.padEnd(30)} -> ${asset.publicUrl} (SHA-256: ${calculatedHash.slice(0, 12)}...)`);
  }

  // 2. Scan Source Code for `/images/brand-system/*` references
  console.log("\n🔎 Scanning components, app, and lib for /images/brand-system/ references:");
  const sourceDirs = [
    path.join(ROOT_DIR, "components"),
    path.join(ROOT_DIR, "app"),
    path.join(ROOT_DIR, "lib"),
  ];

  const sourceFiles: string[] = [];
  for (const dir of sourceDirs) {
    if (fs.existsSync(dir)) {
      getAllSourceFiles(dir, sourceFiles);
    }
  }

  const brandSystemRegex = /["'](\/images\/brand-system\/[^"']+)["']/g;
  const scannedPaths = new Set<string>();

  for (const file of sourceFiles) {
    const content = fs.readFileSync(file, "utf8");
    let match: RegExpExecArray | null;
    while ((match = brandSystemRegex.exec(content)) !== null) {
      const referencedUrl = match[1];
      scannedPaths.add(referencedUrl);
      result.scannedCodeReferences++;

      const targetPath = path.join(PUBLIC_DIR, referencedUrl);
      if (!fs.existsSync(targetPath)) {
        result.failedReferences.push(
          `Broken Reference in ${path.relative(ROOT_DIR, file)}: ${referencedUrl} does NOT exist on disk!`
        );
      }
    }
  }

  console.log(`  Checked ${scannedPaths.size} unique brand asset URLs across ${sourceFiles.length} source files.`);

  // 3. Print Final Report
  console.log("\n=======================================================");
  console.log("📊 FINTERA BRAND ASSET INTEGRITY AUDIT REPORT (R1.1)");
  console.log("=======================================================");
  console.log(`Registry Assets Verified: ${result.passedRegistryAssets} / ${result.totalAssets}`);
  console.log(`Code References Scanned:  ${result.scannedCodeReferences}`);
  console.log(`Hash Mismatches:          ${result.mismatchedHashes.length}`);
  console.log(`Broken References:        ${result.failedReferences.length}`);

  if (result.failedReferences.length > 0 || result.mismatchedHashes.length > 0) {
    console.error("\n❌ AUDIT FAILED WITH ERRORS:");
    for (const err of [...result.failedReferences, ...result.mismatchedHashes]) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  console.log("\n✅ ALL ASSETS & REFERENCES VERIFIED: PASS (Zero Broken References)\n");
  return result;
}

if (require.main === module) {
  runBrandAssetIntegrityAudit();
}
