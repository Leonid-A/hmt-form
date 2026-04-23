import { NextResponse } from "next/server";

import { getGoogleDrivePrefillEnv } from "@/config/googleDrive";
import { loadPrefillPayloadFromDrive } from "@/lib/googleDrive/prefill";
import type { PrefillApiResponse } from "@/lib/googleDrive/prefillPayload";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse<PrefillApiResponse>> {
  try {
    const env = getGoogleDrivePrefillEnv();
    if (!env.enabled) {
      return NextResponse.json(
        { ok: false, skipped: true, message: "Drive prefill not configured" },
        { status: 200 },
      );
    }

    const data = await loadPrefillPayloadFromDrive(env.config);
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[prefill]", e);
    return NextResponse.json({ ok: false, message }, { status: 503 });
  }
}
