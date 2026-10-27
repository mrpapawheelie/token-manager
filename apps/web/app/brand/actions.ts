"use server";

import path from "node:path";

import {
  lookupComAvailability,
  planDomain,
  renderBrandKit,
  shortlistNames,
  targetMarketSchema,
} from "@token-manager/shared";
import { writeBrandAssets } from "@token-manager/shared/brand-files";
import { ZodError } from "zod";

export interface MarketFields {
  audience: string;
  problem: string;
  category: string;
  tone: string;
  geography?: string;
}

export type MarketState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "ready"; market: MarketFields };

export interface NameRow {
  name: string;
  ticker: string;
  cashtag: string;
  score: number;
  preferred: boolean;
  syllableEstimate: number;
  letterCount: number;
  spellable: boolean;
  recognizable: boolean;
  heuristicRisk: "low" | "medium" | "high";
  notes: string[];
}

export type NameState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      gap: string;
      liveXSearch: false;
      bestName: string | null;
      rows: NameRow[];
    };

export type DomainState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      label: string;
      hostname: string | null;
      acceptable: boolean;
      privacy: "whois_redaction";
      purchased: false;
      storesSecrets: false;
      ownership: string;
      notes: string[];
      steps: string[];
      checked: boolean;
      available: boolean | null;
      source: string;
      gap: string;
    };

export interface BrandAssetView {
  kind: string;
  filename: string;
  width: number;
  height: number;
  pixels: string;
  note: string;
  svg: string;
  relativePath: string | null;
}

export type BrandState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      written: boolean;
      directory: string | null;
      ownership: string;
      iteration: string;
      assets: BrandAssetView[];
    };

function marketFromForm(formData: FormData): MarketState {
  const geography = String(formData.get("geography") ?? "").trim();
  const parsed = targetMarketSchema.safeParse({
    audience: String(formData.get("audience") ?? ""),
    problem: String(formData.get("problem") ?? ""),
    category: String(formData.get("category") ?? ""),
    tone: String(formData.get("tone") ?? ""),
    ...(geography ? { geography } : {}),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Check the market fields.",
    };
  }
  return { status: "ready", market: parsed.data };
}

function zodMessage(error: unknown): string {
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? "Check the form.";
  }
  return "That step could not finish.";
}

export async function recordMarketAction(
  _previous: MarketState,
  formData: FormData,
): Promise<MarketState> {
  return marketFromForm(formData);
}

export async function scoreNamesAction(
  _previous: NameState,
  formData: FormData,
): Promise<NameState> {
  const marketState = marketFromForm(formData);
  if (marketState.status !== "ready") return marketState;
  const candidates: Array<{ name: string; ticker: string; cashtagTaken: boolean }> = [];
  for (let index = 0; index < 4; index += 1) {
    const name = String(formData.get(`name-${index}`) ?? "").trim();
    const ticker = String(formData.get(`ticker-${index}`) ?? "").trim();
    if (!name && !ticker) continue;
    candidates.push({
      name,
      ticker,
      cashtagTaken: formData.get(`taken-${index}`) === "on",
    });
  }
  if (candidates.length === 0) {
    return { status: "error", message: "Add at least one name and ticker." };
  }
  try {
    const list = shortlistNames({ market: marketState.market, candidates });
    return {
      status: "ready",
      gap: list.gap,
      liveXSearch: false,
      bestName: list.best?.name ?? null,
      rows: list.ranked.map((row) => ({
        name: row.name,
        ticker: row.ticker,
        cashtag: row.cashtag,
        score: row.score,
        preferred: row.preferred,
        syllableEstimate: row.syllableEstimate,
        letterCount: row.letterCount,
        spellable: row.spellable,
        recognizable: row.recognizable,
        heuristicRisk: row.collision.heuristicRisk,
        notes: row.notes,
      })),
    };
  } catch (error) {
    return { status: "error", message: zodMessage(error) };
  }
}

export async function planDomainAction(
  _previous: DomainState,
  formData: FormData,
): Promise<DomainState> {
  const label = String(formData.get("label") ?? "").trim();
  if (!label) return { status: "error", message: "Write the name you want as a .com." };
  const availability = await lookupComAvailability(label);
  const plan = planDomain(label, availability);
  return {
    status: "ready",
    label: plan.label,
    hostname: plan.hostname,
    acceptable: plan.acceptable,
    privacy: plan.privacy,
    purchased: false,
    storesSecrets: false,
    ownership: plan.ownership,
    notes: plan.notes,
    steps: plan.connectSteps,
    checked: plan.availability.checked,
    available: plan.availability.available,
    source: plan.availability.source,
    gap: plan.availability.gap,
  };
}

export async function generateBrandAction(
  _previous: BrandState,
  formData: FormData,
): Promise<BrandState> {
  const name = String(formData.get("name") ?? "").trim();
  const background = formData.get("background") === "dark" ? "dark" : "light";
  const variant = Number(formData.get("variant") ?? "0");
  const subtitle = String(formData.get("subtitle") ?? "").trim();
  if (!name)
    return { status: "error", message: "Write the name that goes with the mark." };
  if (!Number.isInteger(variant) || variant < 0 || variant > 11) {
    return { status: "error", message: "Variant is a number from 0 to 11." };
  }
  const input = {
    name,
    background,
    variant,
    ...(subtitle ? { subtitle } : {}),
  } as const;
  const rendered = renderBrandKit(input);
  try {
    const files = writeBrandAssets(input);
    const first = files[0];
    return {
      status: "ready",
      written: true,
      directory: first ? path.dirname(first.relativePath) : null,
      ownership: first?.ownership ?? rendered[0]?.ownership ?? "",
      iteration: first?.iteration ?? "",
      assets: files.map(toView),
    };
  } catch {
    const first = rendered[0];
    return {
      status: "ready",
      written: false,
      directory: null,
      ownership: first?.ownership ?? "",
      iteration: first?.iteration ?? "",
      assets: rendered.map((asset) => ({
        kind: asset.kind,
        filename: asset.filename,
        width: asset.width,
        height: asset.height,
        pixels: asset.pixels,
        note: asset.note,
        svg: asset.svg,
        relativePath: null,
      })),
    };
  }
}

function toView(asset: {
  kind: string;
  filename: string;
  width: number;
  height: number;
  pixels: string;
  note: string;
  svg: string;
  relativePath: string;
}): BrandAssetView {
  return {
    kind: asset.kind,
    filename: asset.filename,
    width: asset.width,
    height: asset.height,
    pixels: asset.pixels,
    note: asset.note,
    svg: asset.svg,
    relativePath: asset.relativePath,
  };
}
