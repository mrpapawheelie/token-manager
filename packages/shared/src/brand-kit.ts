import {
  BRAND_ASSET_OWNERSHIP,
  BRAND_ASSET_SPECS,
  BRAND_ITERATION_NOTE,
  BRAND_PIXEL_SIZES,
  type BrandAssetKind,
} from "./naming.js";

export interface BrandRenderInput {
  name: string;
  background: "light" | "dark";
  variant?: number;
  subtitle?: string;
}

export interface BrandSvgAsset {
  kind: BrandAssetKind;
  name: string;
  filename: string;
  mime: "image/svg+xml";
  width: number;
  height: number;
  pixels: string;
  background: "light" | "dark";
  variant: number;
  svg: string;
  ownership: string;
  iteration: string;
  note: string;
}

const PALETTES = [
  { ink: "#141414", paper: "#F4F1EA", accent: "#D7263D" },
  { ink: "#0E1C36", paper: "#F6F3EE", accent: "#F0A202" },
  { ink: "#10241C", paper: "#F3F6F2", accent: "#1B7F6A" },
  { ink: "#1C1428", paper: "#F7F2EA", accent: "#E4572E" },
] as const;

const FILENAMES: Record<BrandAssetKind, string> = {
  logo: "logo.svg",
  app_icon: "app-icon.svg",
  avatar: "avatar.svg",
  x_header: "x-header.svg",
  og: "og.svg",
  favicon: "favicon.svg",
};

const SQUARE_KINDS = new Set<BrandAssetKind>(["logo", "app_icon", "avatar", "favicon"]);

const PROFIT_LANGUAGE = /\b(guaranteed|risk-free|risk free|100x)\b/i;

export function brandSlug(name: string): string {
  const letters = name.toLowerCase().replace(/[^a-z]/g, "");
  return letters.length > 0 ? letters.slice(0, 32) : "mark";
}

export function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function hashString(value: string): number {
  let hash = 0;
  for (const char of value) {
    hash = (Math.imul(hash, 33) + char.charCodeAt(0)) >>> 0;
  }
  return hash;
}

function paletteAt(index: number): (typeof PALETTES)[number] {
  const found = PALETTES[index % PALETTES.length];
  if (!found) throw new Error("Brand palette is missing.");
  return found;
}

export function safeBrandSubtitle(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || PROFIT_LANGUAGE.test(trimmed)) return null;
  return trimmed.slice(0, 48);
}

function markMarkup(shape: number, fg: string, accent: string, bg: string): string {
  if (shape === 1) {
    return `<rect x="12" y="12" width="76" height="76" rx="18" fill="${fg}"/><circle cx="68" cy="34" r="14" fill="${bg}"/>`;
  }
  if (shape === 2) {
    return `<polygon points="50,14 88,80 12,80" fill="${fg}"/><rect x="30" y="84" width="40" height="8" rx="2" fill="${accent}"/>`;
  }
  if (shape === 3) {
    return `<polygon points="50,10 90,50 50,90 10,50" fill="${fg}"/><circle cx="50" cy="50" r="12" fill="${accent}"/>`;
  }
  return `<circle cx="50" cy="50" r="38" fill="${fg}"/><rect x="62" y="62" width="20" height="20" rx="4" fill="${accent}"/>`;
}

function wordmarkSize(name: string, max: number): number {
  if (name.length <= 6) return max;
  if (name.length <= 10) return Math.round(max * 0.72);
  return Math.round(max * 0.52);
}

function svgDocument(input: {
  width: number;
  height: number;
  viewBox: string;
  label: string;
  body: string;
}): string {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${input.width}" height="${input.height}" viewBox="${input.viewBox}" role="img" aria-label="${input.label}">`,
    `<title>${input.label}</title>`,
    input.body,
    `</svg>`,
  ].join("");
}

export function renderBrandAsset(
  input: BrandRenderInput & { kind: BrandAssetKind },
): BrandSvgAsset {
  const name = input.name.trim();
  const variant = input.variant ?? 0;
  const spec = BRAND_ASSET_SPECS[input.kind];
  const hash = hashString(name.toLowerCase());
  const shape = (hash + variant) % 4;
  const palette = paletteAt(Math.floor(hash / 4) + variant);
  const bg = input.background === "dark" ? palette.ink : palette.paper;
  const fg = input.background === "dark" ? palette.paper : palette.ink;
  const accent = palette.accent;
  const inset = input.kind === "avatar" || input.kind === "favicon" ? 0.84 : 1;
  const mark =
    inset === 1
      ? markMarkup(shape, fg, accent, bg)
      : `<g transform="translate(50 50) scale(${inset}) translate(-50 -50)">${markMarkup(shape, fg, accent, bg)}</g>`;
  const label = escapeXml(`${name} mark`);
  const word = escapeXml(name);
  const subtitle = safeBrandSubtitle(input.subtitle);

  let body: string;
  let viewBox: string;
  if (input.kind === "x_header") {
    viewBox = "0 0 1500 500";
    const size = wordmarkSize(name, 112);
    body = `<rect width="1500" height="500" fill="${bg}"/><g transform="translate(70 70) scale(3.6)">${mark}</g><text x="500" y="280" fill="${fg}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="${size}" font-weight="700">${word}</text>`;
  } else if (input.kind === "og") {
    viewBox = "0 0 1200 630";
    const size = wordmarkSize(name, 96);
    const sub = subtitle
      ? `<text x="560" y="390" fill="${accent}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="32">${escapeXml(subtitle)}</text>`
      : "";
    body = `<rect width="1200" height="630" fill="${bg}"/><g transform="translate(80 105) scale(4.2)">${mark}</g><text x="560" y="320" fill="${fg}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="${size}" font-weight="700">${word}</text>${sub}`;
  } else {
    viewBox = "0 0 100 100";
    body = `<rect width="100" height="100" fill="${bg}"/>${mark}`;
  }

  const svg = svgDocument({
    width: spec.width,
    height: spec.height,
    viewBox,
    label,
    body,
  });

  return {
    kind: input.kind,
    name,
    filename: FILENAMES[input.kind],
    mime: "image/svg+xml",
    width: spec.width,
    height: spec.height,
    pixels: spec.pixels,
    background: input.background,
    variant,
    svg,
    ownership: BRAND_ASSET_OWNERSHIP,
    iteration: BRAND_ITERATION_NOTE,
    note: spec.note,
  };
}

const KIT_ORDER = Object.keys(BRAND_PIXEL_SIZES) as BrandAssetKind[];

export function renderBrandKit(input: BrandRenderInput): BrandSvgAsset[] {
  return KIT_ORDER.map((kind) => renderBrandAsset({ ...input, kind }));
}

export function brandMarkIsSquare(kind: BrandAssetKind): boolean {
  return SQUARE_KINDS.has(kind);
}
