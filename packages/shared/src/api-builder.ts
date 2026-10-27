import { z } from "zod";

/**
 * Admin API builder. Phase 1 describes endpoints. It does not call a model,
 * read a balance, or collect a payment.
 * x402 is the HTTP 402 payment flow other agents can use to micropay the founder.
 */

export const apiAuthSchema = z.enum(["none", "token", "x402"]);

export type ApiAuth = z.infer<typeof apiAuthSchema>;

export const apiEndpointSpecSchema = z
  .object({
    id: z.string().min(1).max(80),
    method: z.enum(["GET", "POST"]),
    path: z.string().min(1).max(120),
    summary: z.string().min(1).max(240),
    auth: apiAuthSchema,
    readOnly: z.boolean(),
    tokenGated: z.boolean(),
    payable: z.boolean(),
    live: z.literal(false),
  })
  .strict();

export type ApiEndpointSpec = z.infer<typeof apiEndpointSpecSchema>;

export const x402ConfigSchema = z
  .object({
    protocol: z.literal("x402"),
    httpStatus: z.literal(402),
    implemented: z.literal(false),
    payTo: z.literal("founder"),
    platformReceivesFunds: z.literal(false),
    flow: z.array(z.string()).min(1),
  })
  .strict();

export type X402Config = z.infer<typeof x402ConfigSchema>;

export const dataLocationSchema = z.enum([
  "unknown",
  "none",
  "founder_api",
  "codex",
  "onchain",
  "github",
]);

export type DataLocation = z.infer<typeof dataLocationSchema>;

export const X402_FLOW = [
  "The agent calls the endpoint with no payment.",
  "The server answers HTTP 402 Payment Required and names the price.",
  "The agent pays the founder, not Token Manager, and retries with proof of that payment.",
  "The server returns the read-only body. Phase 1 does not run this flow.",
] as const;

export function x402Config(): X402Config {
  return x402ConfigSchema.parse({
    protocol: "x402",
    httpStatus: 402,
    implemented: false,
    payTo: "founder",
    platformReceivesFunds: false,
    flow: [...X402_FLOW],
  });
}

export function locateProjectData(source: DataLocation): {
  source: DataLocation;
  found: boolean;
  live: false;
  next: string;
} {
  const found = source !== "none" && source !== "unknown";
  return {
    source,
    found,
    live: false,
    next: found
      ? "Describe read-only endpoints with api_builder_describe. Phase 1 still does not call that source."
      : "No data location is on record. Use api_builder_describe to write the endpoints you want. Do not invent a balance.",
  };
}

export function describeEndpoints(wish: string): {
  aiCalled: false;
  endpoints: ApiEndpointSpec[];
} {
  const lines = wish
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(0, 8);
  return {
    aiCalled: false,
    endpoints: lines.map((line, index) =>
      apiEndpointSpecSchema.parse({
        id: `wish-${index + 1}`,
        method: "GET",
        path: `/v1/custom/${index + 1}`,
        summary: line,
        auth: "none",
        readOnly: true,
        tokenGated: false,
        payable: false,
        live: false,
      }),
    ),
  };
}

export function readonlyBalanceSpec(): ApiEndpointSpec {
  return apiEndpointSpecSchema.parse({
    id: "balance",
    method: "GET",
    path: "/v1/balance",
    summary: "Read-only balance and address check. No transfer.",
    auth: "none",
    readOnly: true,
    tokenGated: false,
    payable: false,
    live: false,
  });
}

export function tokenGatedSpec(enabled: boolean): ApiEndpointSpec {
  return apiEndpointSpecSchema.parse({
    id: "holders",
    method: "GET",
    path: "/v1/holders/check",
    summary: enabled
      ? "Optional token gate. A later phase can require the coin. Phase 1 does not check a balance."
      : "Token gate is off. The endpoint stays public and read-only.",
    auth: enabled ? "token" : "none",
    readOnly: true,
    tokenGated: enabled,
    payable: false,
    live: false,
  });
}

export function x402EndpointSpec(): {
  endpoint: ApiEndpointSpec;
  x402: X402Config;
} {
  return {
    endpoint: apiEndpointSpecSchema.parse({
      id: "summary",
      method: "GET",
      path: "/v1/project/summary",
      summary: "Payable read of the public project summary for another agent.",
      auth: "x402",
      readOnly: true,
      tokenGated: false,
      payable: true,
      live: false,
    }),
    x402: x402Config(),
  };
}

export const API_BUILDER_OPENAPI = {
  openapi: "3.1.0",
  info: {
    title: "Project data API (mock)",
    version: "0.1.0",
    description:
      "Sketch for agent consumers. Phase 1 does not serve these routes and does not collect payment. x402 means HTTP 402: the agent pays the founder, then retries. Token Manager does not receive the funds.",
  },
  paths: {
    "/v1/balance": {
      get: {
        summary: "Read-only balance and address check",
        responses: {
          "200": {
            description:
              "Not served in Phase 1. Would return a balance or an explicit null.",
          },
        },
      },
    },
    "/v1/project/summary": {
      get: {
        summary: "x402-compatible payable project summary",
        responses: {
          "402": {
            description:
              "Payment Required. Mock only. The body would name the price. No payment is requested by this repo.",
          },
          "200": {
            description:
              "Not served in Phase 1. Would return the public summary after payment.",
          },
        },
      },
    },
  },
} as const;
