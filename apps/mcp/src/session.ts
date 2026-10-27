import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  createProgressState,
  progressStateSchema,
  redactSecrets,
  type ProgressState,
} from "@token-manager/shared";
import { z } from "zod";

export const DEFAULT_SESSION_ID = "default";

const fileSchema = z
  .object({
    version: z.literal(1),
    sessions: z.record(z.string(), progressStateSchema),
  })
  .strict();

type SessionFile = z.infer<typeof fileSchema>;

let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => T): Promise<T> {
  const run = queue.then(task, task);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function sessionFilePath(): string {
  return (
    process.env.TOKEN_MANAGER_SESSION_PATH ??
    path.join(process.cwd(), ".token-manager", "session.json")
  );
}

function loadAll(): SessionFile {
  const file = sessionFilePath();
  if (!existsSync(file)) return { version: 1, sessions: {} };
  try {
    const parsed: unknown = JSON.parse(readFileSync(file, "utf8"));
    const result = fileSchema.safeParse(parsed);
    if (!result.success) throw new Error("invalid session file");
    return result.data;
  } catch {
    try {
      renameSync(file, `${file}.invalid`);
    } catch {
      /* already moved */
    }
    console.error("token-manager: ignored an invalid session file");
    return { version: 1, sessions: {} };
  }
}

function saveAll(data: SessionFile): void {
  const file = sessionFilePath();
  mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(data, null, 2)}\n`);
  renameSync(tmp, file);
}

export function ensureSession(sessionId = DEFAULT_SESSION_ID): Promise<ProgressState> {
  return enqueue(() => {
    const all = loadAll();
    const existing = all.sessions[sessionId];
    if (existing) return existing;
    const created = createProgressState(sessionId);
    all.sessions[sessionId] = created;
    saveAll(all);
    return created;
  });
}

export function updateSession(
  sessionId: string,
  mutate: (current: ProgressState) => ProgressState,
): Promise<ProgressState> {
  return enqueue(() => {
    const all = loadAll();
    const current = all.sessions[sessionId] ?? createProgressState(sessionId);
    const next = progressStateSchema.parse(
      redactSecrets({
        ...mutate(current),
        sessionId,
        updatedAt: new Date().toISOString(),
      }),
    );
    all.sessions[sessionId] = next;
    saveAll(all);
    return next;
  });
}
