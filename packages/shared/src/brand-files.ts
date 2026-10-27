import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  brandSlug,
  renderBrandAsset,
  renderBrandKit,
  type BrandRenderInput,
  type BrandSvgAsset,
} from "./brand-kit.js";
import type { BrandAssetKind } from "./naming.js";

export interface WrittenBrandAsset extends BrandSvgAsset {
  absolutePath: string;
  relativePath: string;
}

/** Walk parents for the workspace file. Falls back to the start directory. */
export function findRepoRoot(start = process.cwd()): string {
  let dir = path.resolve(/*turbopackIgnore: true*/ start);
  for (let i = 0; i < 8; i += 1) {
    if (existsSync(path.join(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(/*turbopackIgnore: true*/ start);
}

export function brandOutputDir(
  name: string,
  variant: number,
): { absolute: string; relative: string } {
  const override = process.env.TOKEN_MANAGER_BRAND_DIR?.trim();
  const slug = brandSlug(name);
  const folder = path.join(slug, `v${variant}`);
  if (override) {
    const absolute = path.join(path.resolve(override), folder);
    return { absolute, relative: absolute };
  }
  const absolute = path.join(findRepoRoot(), "artifacts", "brand", folder);
  return {
    absolute,
    relative: path.posix.join("artifacts", "brand", slug, `v${variant}`),
  };
}

export function writeBrandAssets(
  input: BrandRenderInput,
  directory?: string,
): WrittenBrandAsset[] {
  const located = outputLocation(input, directory);
  mkdirSync(located.absolute, { recursive: true });
  return renderBrandKit(input).map((asset) => writeOne(asset, located));
}

export function writeBrandAsset(
  input: BrandRenderInput & { kind: BrandAssetKind },
  directory?: string,
): WrittenBrandAsset {
  const located = outputLocation(input, directory);
  mkdirSync(located.absolute, { recursive: true });
  return writeOne(renderBrandAsset(input), located);
}

function outputLocation(
  input: BrandRenderInput,
  directory: string | undefined,
): { absolute: string; relative: string } {
  if (directory) {
    const absolute = path.resolve(directory);
    return { absolute, relative: absolute };
  }
  return brandOutputDir(input.name, input.variant ?? 0);
}

function writeOne(
  asset: BrandSvgAsset,
  located: { absolute: string; relative: string },
): WrittenBrandAsset {
  const absolutePath = path.join(located.absolute, asset.filename);
  writeFileSync(absolutePath, asset.svg, "utf8");
  const relativePath = located.relative.startsWith("artifacts/")
    ? path.posix.join(located.relative, asset.filename)
    : absolutePath;
  return { ...asset, absolutePath, relativePath };
}
