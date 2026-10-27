import { JOURNEY_SYNC } from "@token-manager/shared";

import { Directory } from "@/components/directory";
import { mockProjects } from "@/lib/mock-events";

export default function HomePage() {
  return (
    <div className="space-y-4">
      <div className="max-w-3xl space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Creation directory</h1>
        <p className="text-sm text-stone-700">
          Filter the mock rows by category, verification, or text. Labels start grey and
          turn color when a check is true. North Curve is the 70% complete example:
          socials on, locks still off.
        </p>
        <p className="text-sm text-stone-700">
          The same stage order is shared with MCP. This shell uses session id{" "}
          {JOURNEY_SYNC.sessionId}. Live sync is off. Layout follows the shadcn breakpoint
          scale: cards on a phone, a table from the large breakpoint up.
        </p>
        <p className="text-sm text-stone-700">
          An agent-created row is labeled Agent created and No human so buyers and
          scanners can see there was no human on the create. Queue Note is that sample.
          Its mint, LP, and fee admin are immutable and non-retcon.
        </p>
        <p className="text-sm text-stone-700">
          Scanner authors can read the same rows as JSON. Flags that were not recorded
          stay false, null, or unverified.{" "}
          <a className="underline" href="/api/scanner/tokens">
            Token list
          </a>
          {" · "}
          <a className="underline" href="/api/scanner/openapi">
            OpenAPI sketch
          </a>
          {" · "}
          <a className="underline" href="/template">
            Pre-mint site template
          </a>
        </p>
      </div>
      <Directory
        sessionId={JOURNEY_SYNC.sessionId}
        projects={mockProjects.map((project) => ({ ...project, privateFlags: [] }))}
      />
    </div>
  );
}
