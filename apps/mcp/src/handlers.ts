import {
  ALWAYS_TOOLS,
  IDENTITY_METHODS,
  JOURNEY_STAGES,
  STAGE_INDEX,
  STAGE_LABELS,
  IDENTITY_SCORE_FORMULA,
  SITE_PAGES,
  API_BUILDER_OPENAPI,
  adsPreview,
  amaPlan,
  describeEndpoints,
  locateProjectData,
  prelaunchChecklist,
  readonlyBalanceSpec,
  tokenGatedSpec,
  x402EndpointSpec,
  buildBadges,
  buildFairLaunchAnnouncement,
  cavemanScript,
  checkTokenDesign,
  codexChecklist,
  MEMBERSHIP_ADAPTERS,
  assessCredentials,
  buildWalletProof,
  creationEventSchema,
  credentialTags,
  reviewXHeuristics,
  devApiChecklist,
  environmentChecks,
  graduateChecklist,
  listBadgeCatalog,
  listCavemanTopics,
  lockProofSchema,
  nextStage,
  planTeamLock,
  prepChecklist,
  previewAdminSession,
  BRAND_PRINCIPLES,
  CLOUDFLARE_DOMAIN_STEPS,
  WEEKLY_MILESTONES,
  brandAssetBrief,
  buildScannerToken,
  compareOriginality,
  coachOriginality,
  mockXAnalytics,
  placeholderScanNotification,
  planDomain,
  planFounderGithubRepo,
  previewMeteora,
  quoteDevBuy,
  radarGuide,
  scoreTokenName,
  quoteTokenPrice,
  reviewGuardianGate,
  schedulePrep,
  scoreIdentity,
  scoreProfile,
  socialLinksSchema,
  stagesBefore,
  telegramPlan,
  toolByName,
  toolInputSchemas,
  toolsForStage,
  xCommunityPlan,
  yearOneChecklist,
  type ImplementedToolName,
  type SensitiveAction,
  type ToolName,
} from "@token-manager/shared";

import { DEFAULT_SESSION_ID, ensureSession, updateSession } from "./session.js";

export interface ToolPayload {
  phase: 1;
  status: "ok" | "not_implemented";
  implemented: boolean;
  tool: ToolName;
  stage: string;
  next: string;
  data?: unknown;
  input?: unknown;
}

function ok(tool: ImplementedToolName, data: unknown, next?: string): ToolPayload {
  const meta = toolByName(tool);
  return {
    phase: 1,
    status: "ok",
    implemented: true,
    tool,
    stage: meta.stage,
    next: next ?? meta.next,
    data,
  };
}

function sessionIdOf(input: { sessionId?: string }): string {
  return input.sessionId ?? DEFAULT_SESSION_ID;
}

function pendingAcknowledgements(flags: Record<string, boolean>): string[] {
  return Object.entries(flags)
    .filter(([, value]) => !value)
    .map(([key]) => key);
}

function sensitiveAction(name: ToolName): SensitiveAction {
  if (name === "admin_add_co_admin") return "add_admin";
  if (name === "admin_remove_co_admin") return "remove_admin";
  if (name === "admin_x_credentials_change") return "x_api_credentials";
  return "large_liquidity";
}

function stub(name: ToolName, input: unknown): ToolPayload {
  const meta = toolByName(name);
  const parsed = toolInputSchemas[name].parse(input) as {
    guardianAcknowledged?: true;
    guardianMethod?: "wallet" | "passkey" | "totp";
  };
  const guardian = meta.guardian
    ? reviewGuardianGate(
        null,
        sensitiveAction(name),
        parsed.guardianAcknowledged === true && parsed.guardianMethod
          ? { acknowledged: true, method: parsed.guardianMethod }
          : undefined,
      )
    : undefined;
  return {
    phase: 1,
    status: "not_implemented",
    implemented: false,
    tool: name,
    stage: meta.stage,
    next: meta.next,
    input: parsed,
    data: {
      ...(guardian ? { guardian } : {}),
      stored: false,
      network: false,
      ...(name === "cred_resolve_membership"
        ? { pastedUrl: "rejected" as const, adapters: MEMBERSHIP_ADAPTERS }
        : {}),
    },
  };
}

const implementedHandlers: {
  [Name in ImplementedToolName]: (input: unknown) => Promise<ToolPayload>;
} = {
  async get_progress(input) {
    const args = toolInputSchemas.get_progress.parse(input);
    const state = await ensureSession(sessionIdOf(args));
    const stageTools = toolsForStage(state.currentStage);
    const pending = pendingAcknowledgements(state.acknowledgements);
    return ok("get_progress", {
      stageIndex: STAGE_INDEX[state.currentStage],
      stageCount: JOURNEY_STAGES.length,
      stageLabel: STAGE_LABELS[state.currentStage],
      nextTools: [...new Set([...stageTools, ...ALWAYS_TOOLS])],
      pendingAcknowledgements: pending,
      reminder:
        pending.length > 0
          ? "Name the launch time, the dump risk, and that the dev buy is liquidity."
          : "Acknowledgements are on record for this local session.",
      storage: "local-json",
      state,
    });
  },

  async resume(input) {
    const args = toolInputSchemas.resume.parse(input);
    const id = sessionIdOf(args);
    let jumped = false;
    const state = await updateSession(id, (current) => {
      const next = {
        ...current,
        projectSlug: args.projectSlug ?? current.projectSlug,
        acknowledgements: args.acknowledgements
          ? { ...current.acknowledgements, ...args.acknowledgements }
          : current.acknowledgements,
        notes: args.note ? [...current.notes, args.note].slice(-100) : current.notes,
        completedStages: [...current.completedStages],
      };
      if (
        args.markCurrentComplete &&
        !next.completedStages.includes(current.currentStage)
      ) {
        next.completedStages.push(current.currentStage);
      }
      if (args.stage) {
        jumped = stagesBefore(args.stage).some(
          (stage) => !next.completedStages.includes(stage),
        );
        next.currentStage = args.stage;
      } else if (args.markCurrentComplete) {
        const following = nextStage(current.currentStage);
        if (following) next.currentStage = following;
      }
      return next;
    });
    return ok("resume", {
      jumped,
      nextTools: [...new Set([...toolsForStage(state.currentStage), ...ALWAYS_TOOLS])],
      state,
    });
  },

  async prelaunch_checklist(input) {
    const args = toolInputSchemas.prelaunch_checklist.parse(input);
    return ok("prelaunch_checklist", prelaunchChecklist(args));
  },

  async prep_x_checklist(input) {
    const args = toolInputSchemas.prep_x_checklist.parse(input);
    return ok("prep_x_checklist", { items: prepChecklist(args) });
  },

  async prep_x_schedule(input) {
    const args = toolInputSchemas.prep_x_schedule.parse(input);
    return ok("prep_x_schedule", { items: schedulePrep(args.launchAt) });
  },

  async name_intake(input) {
    const market = toolInputSchemas.name_intake.parse(input);
    return ok("name_intake", {
      market,
      creationFee: "free",
      rule: "Name the audience before the ticker. Creation of the curve has no platform fee.",
    });
  },

  async social_telegram_plan(input) {
    const args = toolInputSchemas.social_telegram_plan.parse(input);
    return ok("social_telegram_plan", { lines: telegramPlan(args) });
  },

  async social_x_community_plan(input) {
    const args = toolInputSchemas.social_x_community_plan.parse(input);
    return ok("social_x_community_plan", { lines: xCommunityPlan(args) });
  },

  async caveman_list_topics() {
    return ok("caveman_list_topics", { topics: listCavemanTopics() });
  },

  async caveman_explain(input) {
    const args = toolInputSchemas.caveman_explain.parse(input);
    return ok("caveman_explain", {
      topic: args.topic,
      script: cavemanScript(args.topic),
    });
  },

  async setup_check_environment(input) {
    const args = toolInputSchemas.setup_check_environment.parse(input);
    return ok("setup_check_environment", { checks: environmentChecks(args) });
  },

  async setup_codex(input) {
    const args = toolInputSchemas.setup_codex.parse(input);
    return ok("setup_codex", { lines: codexChecklist(args.activationPaid, args.tier) });
  },

  async launch_curve_validate_design(input) {
    return ok("launch_curve_validate_design", checkTokenDesign(input));
  },

  async social_validate_links(input) {
    const parsed = socialLinksSchema.safeParse(input);
    if (!parsed.success) {
      return ok("social_validate_links", {
        valid: false,
        errors: parsed.error.issues.map((issue) => issue.message),
      });
    }
    return ok("social_validate_links", { valid: true, socials: parsed.data });
  },

  async badge_list() {
    return ok("badge_list", {
      labels: listBadgeCatalog(),
      rule: "Labels start grey and turn on when the check is true. They are not rank badges.",
    });
  },

  async badge_preview(input) {
    const args = toolInputSchemas.badge_preview.parse(input);
    return ok("badge_preview", { badges: buildBadges(args.signals, args.lockTier) });
  },

  async score_profile(input) {
    const signals = toolInputSchemas.score_profile.parse(input);
    return ok("score_profile", scoreProfile(signals));
  },

  async name_score(input) {
    const args = toolInputSchemas.name_score.parse(input);
    return ok("name_score", scoreTokenName(args));
  },

  async domain_plan(input) {
    const args = toolInputSchemas.domain_plan.parse(input);
    return ok("domain_plan", planDomain(args.label));
  },

  async domain_connect(input) {
    const args = toolInputSchemas.domain_connect.parse(input);
    return ok("domain_connect", {
      hostname: args.hostname ?? null,
      registered: false,
      steps: CLOUDFLARE_DOMAIN_STEPS,
    });
  },

  async brand_principles() {
    return ok("brand_principles", { principles: BRAND_PRINCIPLES });
  },

  async brand_generate(input) {
    const args = toolInputSchemas.brand_generate.parse(input);
    return ok("brand_generate", {
      ...brandAssetBrief(args),
      todo: "TODO(phase-2): generate the image from this brief. Phase 1 returns the spec only.",
    });
  },

  async badge_milestones() {
    return ok("badge_milestones", {
      creationFee: "free",
      perks: "tbd",
      milestones: WEEKLY_MILESTONES,
    });
  },

  async score_benefits() {
    const example = scoreProfile({
      hasListingMeta: true,
      launchTimeNamed: true,
      dumpHonestyAcknowledged: true,
      hasX: true,
      hasTelegram: true,
      hasGithub: true,
      devBuyNearRule: true,
      liquidityLocked: false,
      autoCompounding: false,
      teamLockPublished: false,
    });
    return ok("score_benefits", {
      benefit: example.benefit,
      examplePercent: example.percent,
      checklistSize: example.completed.length + example.missing.length,
    });
  },

  async launch_curve_quote_dev_buy(input) {
    const args = toolInputSchemas.launch_curve_quote_dev_buy.parse(input);
    return ok(
      "launch_curve_quote_dev_buy",
      quoteDevBuy(args.supplyUi, args.devBuySupplyBps),
    );
  },

  async launch_curve_build_announcement(input) {
    const args = toolInputSchemas.launch_curve_build_announcement.parse(input);
    return ok("launch_curve_build_announcement", {
      markdown: buildFairLaunchAnnouncement(args),
    });
  },

  async directory_build_event(input) {
    const parsed = creationEventSchema.safeParse(input);
    if (!parsed.success) {
      return ok("directory_build_event", {
        valid: false,
        errors: parsed.error.issues.map(
          (issue) => `${issue.path.join(".")}: ${issue.message}`,
        ),
      });
    }
    return ok("directory_build_event", {
      valid: true,
      event: parsed.data,
      persisted: false,
    });
  },

  async directory_log_create(input) {
    const args = toolInputSchemas.directory_log_create.parse(input);
    const state = await updateSession(sessionIdOf(args), (current) => ({
      ...current,
      creationEvent: args.event,
      lockProofs: args.event.locks,
      notes: [...current.notes, `Local directory log for ${args.event.id}`].slice(-100),
    }));
    return ok("directory_log_create", {
      persisted: "local-session-only",
      eventId: args.event.id,
      state,
      scanNotification: placeholderScanNotification(),
    });
  },

  async scanner_preview(input) {
    const args = toolInputSchemas.scanner_preview.parse(input);
    return ok(
      "scanner_preview",
      buildScannerToken({
        id: args.id,
        name: args.name,
        symbol: args.symbol,
        category: args.category,
        shortDescription: args.shortDescription,
        contract: args.contract ?? null,
        mock: args.mock,
        identityMode: args.identityMode ?? null,
        socials: { x: args.x ?? null, github: args.github ?? null },
        flags: {
          connectedX: args.connectedX,
          connectedGithub: args.connectedGithub,
          verificationStatus: args.verificationStatus,
          lockTier: args.lockTier,
          lockAssessed: args.lockAssessed,
          autoCompound: args.autoCompound,
          profileCompletion: args.profileCompletion,
          claims: args.claims,
        },
      }),
    );
  },

  async claims_intake(input) {
    const args = toolInputSchemas.claims_intake.parse(input);
    return ok("claims_intake", {
      ...args,
      optional: true,
      blocksDiy: false,
      stored: false,
    });
  },

  async originality_compare(input) {
    const args = toolInputSchemas.originality_compare.parse(input);
    return ok("originality_compare", compareOriginality(args));
  },

  async originality_coach(input) {
    const args = toolInputSchemas.originality_coach.parse(input);
    return ok("originality_coach", coachOriginality(args));
  },

  async github_repo_plan(input) {
    const args = toolInputSchemas.github_repo_plan.parse(input);
    return ok("github_repo_plan", planFounderGithubRepo(args));
  },

  async graduate_checklist(input) {
    const args = toolInputSchemas.graduate_checklist.parse(input);
    return ok("graduate_checklist", {
      contract: args.contract,
      ...graduateChecklist({ devBuySupplyBps: args.devBuySupplyBps }),
    });
  },

  async meteora_preview_damm_v2(input) {
    const args = toolInputSchemas.meteora_preview_damm_v2.parse(input);
    return ok(
      "meteora_preview_damm_v2",
      previewMeteora({
        contract: args.contract,
        quoteSymbol: args.quoteSymbol,
        priceSource: args.priceSource,
        ...(args.lpSupplyBps !== undefined ? { lpSupplyBps: args.lpSupplyBps } : {}),
      }),
    );
  },

  async meteora_quote_pool(input) {
    const args = toolInputSchemas.meteora_quote_pool.parse(input);
    const quote = quoteTokenPrice(args);
    return ok("meteora_quote_pool", { quote }, quote.next);
  },

  async vest_plan_lock(input) {
    const args = toolInputSchemas.vest_plan_lock.parse(input);
    return ok("vest_plan_lock", planTeamLock(args));
  },

  async vest_build_proof(input) {
    const parsed = lockProofSchema.safeParse(input);
    if (!parsed.success) {
      return ok("vest_build_proof", {
        valid: false,
        errors: parsed.error.issues.map(
          (issue) => `${issue.path.join(".")}: ${issue.message}`,
        ),
      });
    }
    return ok("vest_build_proof", { valid: true, proof: parsed.data });
  },

  async site_preview_pages(input) {
    const args = toolInputSchemas.site_preview_pages.parse(input);
    return ok("site_preview_pages", { ...args, pages: SITE_PAGES });
  },

  async identity_explain_methods() {
    return ok("identity_explain_methods", {
      methods: IDENTITY_METHODS,
      formula: IDENTITY_SCORE_FORMULA,
      modeAddsPoints: false,
      rankBadges: false,
    });
  },

  async identity_score_from_inputs(input) {
    const args = toolInputSchemas.identity_score_from_inputs.parse(input);
    return ok("identity_score_from_inputs", {
      score: scoreIdentity(args),
      caveat: "Phase 1 trusts the statuses you sent. It does not check evidence.",
    });
  },

  async identity_list_tags() {
    return ok("identity_list_tags", {
      gradesPeople: false,
      tags: credentialTags(),
      rule: "Grey means not recorded. Color means the action was recorded. Tags are not ratings. Buyers decide. A shady history withholds benefits.",
    });
  },

  async cred_wallet_proof(input) {
    const args = toolInputSchemas.cred_wallet_proof.parse(input);
    return ok("cred_wallet_proof", buildWalletProof(args.walletAddress));
  },

  async cred_assess(input) {
    const args = toolInputSchemas.cred_assess.parse(input);
    return ok("cred_assess", assessCredentials(args));
  },

  async cred_x_heuristics(input) {
    const args = toolInputSchemas.cred_x_heuristics.parse(input);
    return ok("cred_x_heuristics", reviewXHeuristics(args));
  },

  async identity_add_claim(input) {
    const args = toolInputSchemas.identity_add_claim.parse(input);
    const state = await updateSession(sessionIdOf(args), (current) => ({
      ...current,
      claims: [...current.claims, args.claim].slice(-20),
    }));
    return ok("identity_add_claim", {
      stored: true,
      aiCheckRan: false,
      claim: args.claim,
      claimCount: state.claims.length,
    });
  },

  async admin_session_preview(input) {
    const args = toolInputSchemas.admin_session_preview.parse(input);
    return ok("admin_session_preview", previewAdminSession(args));
  },

  async admin_list_co_admins(input) {
    const args = toolInputSchemas.admin_list_co_admins.parse(input);
    const state = await ensureSession(sessionIdOf(args));
    return ok("admin_list_co_admins", {
      creatorWallet: state.creatorWallet,
      coAdmins: state.coAdmins,
      note: "Phase 1 does not add co-admins. admin_add_co_admin is a stub.",
    });
  },

  async admin_guardian_policy(input) {
    const args = toolInputSchemas.admin_guardian_policy.parse(input);
    const state = await updateSession(sessionIdOf(args), (current) => ({
      ...current,
      guardianPolicy: args.policy,
    }));
    return ok("admin_guardian_policy", {
      saved: "local-session-only",
      enforced: false,
      policy: state.guardianPolicy,
      todo: "TODO(phase-2): enforce this policy with a guardian wallet signature, passkey assertion, or TOTP. Never store the TOTP secret.",
    });
  },

  async admin_dashboard_snapshot(input) {
    const args = toolInputSchemas.admin_dashboard_snapshot.parse(input);
    const state = await ensureSession(sessionIdOf(args));
    return ok("admin_dashboard_snapshot", {
      projectSlug: state.projectSlug,
      currentStage: state.currentStage,
      creatorWallet: state.creatorWallet,
      coAdminCount: state.coAdmins.length,
      guardianSaved: state.guardianPolicy !== null,
      guardianEnforced: false,
      creationEventId: state.creationEvent?.id ?? null,
      lockCount: state.lockProofs.length,
      claimCount: state.claims.length,
      panels: [
        { id: "overview", status: "local" },
        { id: "co_admins", status: "stub" },
        { id: "guardian", status: state.guardianPolicy ? "saved_not_enforced" : "unset" },
        { id: "ai_chat", status: "stub" },
        { id: "x_posts", status: "stub" },
        { id: "x_analytics", status: "mock" },
        { id: "radar", status: "guide_only" },
        { id: "ads", status: "stub" },
        { id: "api_builder", status: "spec_only" },
        { id: "meteora", status: "stub" },
      ],
    });
  },

  async grow_x_ama_plan(input) {
    const args = toolInputSchemas.grow_x_ama_plan.parse(input);
    return ok("grow_x_ama_plan", { lines: amaPlan(args) });
  },

  async admin_x_analytics(input) {
    const args = toolInputSchemas.admin_x_analytics.parse(input);
    return ok("admin_x_analytics", mockXAnalytics(args.handle));
  },

  async admin_x_radar_guide(input) {
    const args = toolInputSchemas.admin_x_radar_guide.parse(input);
    return ok("admin_x_radar_guide", radarGuide(args));
  },

  async grow_x_dev_api_checklist(input) {
    const args = toolInputSchemas.grow_x_dev_api_checklist.parse(input);
    return ok("grow_x_dev_api_checklist", { items: devApiChecklist(args) });
  },

  async ads_preview(input) {
    const args = toolInputSchemas.ads_preview.parse(input);
    return ok("ads_preview", { lines: adsPreview(args) });
  },

  async api_builder_locate(input) {
    const args = toolInputSchemas.api_builder_locate.parse(input);
    return ok("api_builder_locate", locateProjectData(args.source));
  },

  async api_builder_describe(input) {
    const args = toolInputSchemas.api_builder_describe.parse(input);
    return ok("api_builder_describe", describeEndpoints(args.wish));
  },

  async api_builder_readonly() {
    return ok("api_builder_readonly", {
      endpoint: readonlyBalanceSpec(),
      balance: null,
      network: false,
    });
  },

  async api_builder_token_gate(input) {
    const args = toolInputSchemas.api_builder_token_gate.parse(input);
    return ok("api_builder_token_gate", { endpoint: tokenGatedSpec(args.enabled) });
  },

  async api_builder_x402() {
    return ok("api_builder_x402", {
      ...x402EndpointSpec(),
      openapi: API_BUILDER_OPENAPI,
    });
  },

  async ops_year_checklist(input) {
    const args = toolInputSchemas.ops_year_checklist.parse(input);
    return ok("ops_year_checklist", { items: yearOneChecklist(args.monthsLive) });
  },

  async ops_year_log_week(input) {
    const args = toolInputSchemas.ops_year_log_week.parse(input);
    const line = [
      `Week ${args.weekOf}`,
      args.didPublishUpdate ? "update posted" : "update missed",
      args.didCheckLocks ? "locks checked" : "locks not checked",
      args.buybackRequested
        ? "Buyback requested. Discouraged. Fees compound into quote token B. No buyback plan was created."
        : "No buyback requested.",
    ].join(". ");
    const state = await updateSession(sessionIdOf(args), (current) => ({
      ...current,
      notes: [...current.notes, line].slice(-100),
    }));
    return ok("ops_year_log_week", {
      recorded: line,
      buybackPlanned: false,
      noteCount: state.notes.length,
    });
  },
};

export async function handleTool(name: ToolName, input: unknown): Promise<ToolPayload> {
  const meta = toolByName(name);
  if (!meta.implemented) return stub(name, input);
  return implementedHandlers[name as ImplementedToolName](input);
}
