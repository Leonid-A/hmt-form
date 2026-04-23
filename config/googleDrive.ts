/**
 * Google Drive CSV prefill — միայն սերվերի env (քլիենտ չի տեսնում)։
 *
 * - `DRIVE_PREFILL_FILE_ID` + `GOOGLE_SERVICE_ACCOUNT_JSON` — միասին պարտադիր են prefill-ի համար
 * - Եթե երկուսն էլ բացակայում են՝ prefill-ը անջատված է (API-ն կվերադարձնի skipped)
 * - Եթե մեկը կա, մյուսը ոչ՝ սխալ կարգավորում (503)
 */
export type GoogleDrivePrefillConfig = {
  fileId: string;
  /** Սերվիս-հաշվի JSON key (օբյեկտ) */
  credentials: Record<string, unknown>;
  /** Google Sheets ֆայլի դեպքում՝ export text/csv */
  isGoogleSheet: boolean;
  /** Papa header-ից հետո տվյալների զանգվածի ինդեքս (0 = առաջին տողը) */
  dataRowIndex: number;
};

export type GoogleDrivePrefillEnvResult =
  | { enabled: false }
  | { enabled: true; config: GoogleDrivePrefillConfig };

function parseServiceAccountJson(raw: string): Record<string, unknown> {
  const trimmed = raw.trim();
  let jsonStr = trimmed;
  try {
    JSON.parse(trimmed);
  } catch {
    try {
      jsonStr = Buffer.from(trimmed, "base64").toString("utf8");
    } catch {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON — base64-ը անվավեր է");
    }
  }
  try {
    const obj = JSON.parse(jsonStr) as unknown;
    if (!obj || typeof obj !== "object") throw new Error("անվավեր");
    return obj as Record<string, unknown>;
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON — անվավեր JSON");
  }
}

export function getGoogleDrivePrefillEnv(): GoogleDrivePrefillEnvResult {
  const fileId = process.env.DRIVE_PREFILL_FILE_ID?.trim() ?? "";
  const rawCreds = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim() ?? "";

  if (!fileId && !rawCreds) {
    return { enabled: false };
  }

  if (!fileId || !rawCreds) {
    throw new Error(
      "Drive prefill-ի համար պետք են և DRIVE_PREFILL_FILE_ID, և GOOGLE_SERVICE_ACCOUNT_JSON",
    );
  }

  const credentials = parseServiceAccountJson(rawCreds);
  const isGoogleSheet =
    process.env.DRIVE_FILE_IS_GOOGLE_SHEET === "1" ||
    process.env.DRIVE_FILE_IS_GOOGLE_SHEET?.toLowerCase() === "true";

  const rowRaw = process.env.DRIVE_PREFILL_DATA_ROW?.trim() ?? "0";
  const dataRowIndex = Number.parseInt(rowRaw, 10);
  if (Number.isNaN(dataRowIndex) || dataRowIndex < 0) {
    throw new Error("DRIVE_PREFILL_DATA_ROW պետք է լինի ոչ-բացասական ամբողջ թիվ");
  }

  return {
    enabled: true,
    config: { fileId, credentials, isGoogleSheet, dataRowIndex },
  };
}
