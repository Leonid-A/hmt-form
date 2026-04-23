import { google } from "googleapis";
import Papa from "papaparse";

import type { GoogleDrivePrefillConfig } from "@/config/googleDrive";
import type { PrefillFormPayload } from "@/lib/googleDrive/prefillPayload";

function normalizeCsvRow(row: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(row)) {
    const key = k
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/-/g, "_");
    out[key] = String(v ?? "").trim();
  }
  return out;
}

function cell(row: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== "") return v;
  }
  return "";
}

function phonesFromRow(row: Record<string, string>): string[] {
  const slots = [1, 2, 3, 4, 5].map((n) => cell(row, `phone_${n}`, `phone${n}`));
  const filled = slots.filter((s) => s.length > 0);
  return filled.length > 0 ? filled : [""];
}

function emailsFromRow(row: Record<string, string>): string[] {
  const slots = [1, 2, 3, 4, 5].map((n) => cell(row, `email_${n}`, `email${n}`));
  const filled = slots.filter((s) => s.length > 0);
  return filled.length > 0 ? filled : [""];
}

function rowToPayload(row: Record<string, string>): PrefillFormPayload {
  const modeRaw = cell(row, "submission_mode", "submissionmode").toLowerCase();
  let notOwnerAnymore = false;
  let forRent = false;
  if (modeRaw === "not_owner" || modeRaw === "notowner") {
    notOwnerAnymore = true;
    forRent = false;
  } else if (modeRaw === "for_rent" || modeRaw === "forrent") {
    notOwnerAnymore = false;
    forRent = true;
  } else {
    notOwnerAnymore = false;
    forRent = false;
  }

  const car2Brand = cell(row, "car2_brand", "car_2_brand");
  const car2Model = cell(row, "car2_model", "car_2_model");
  const car2Color = cell(row, "car2_color", "car_2_color");
  const car2Number = cell(row, "car2_number", "car_2_number");
  const hasSecondCar = [car2Brand, car2Model, car2Color, car2Number].some((s) => s.length > 0);

  return {
    notOwnerAnymore,
    forRent,
    hasSecondCar,
    common: {
      propertyUniqueId: cell(row, "property_unique_id", "propertyuniqueid"),
      ownerName: cell(row, "owner_name", "ownername"),
      phones: phonesFromRow(row),
      emails: emailsFromRow(row),
      carBrand: cell(row, "car_brand", "carbrand"),
      carModel: cell(row, "car_model", "carmodel"),
      carColor: cell(row, "car_color", "carcolor"),
      carNumber: cell(row, "car_number", "carnumber"),
      car2Brand,
      car2Model,
      car2Color,
      car2Number,
    },
    newOwner: {
      name: cell(row, "new_owner_name", "newownername"),
      phone1: cell(row, "new_owner_phone", "newownerphone"),
    },
    renter: {
      name: cell(row, "renter_name", "rentername"),
      phone1: cell(row, "renter_phone", "renterphone"),
      email1: cell(row, "renter_email", "renteremail"),
    },
  };
}

async function downloadCsvText(
  cfg: GoogleDrivePrefillConfig,
): Promise<string> {
  const auth = new google.auth.GoogleAuth({
    credentials: cfg.credentials,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });

  const drive = google.drive({ version: "v3", auth });

  if (cfg.isGoogleSheet) {
    const res = await drive.files.export(
      { fileId: cfg.fileId, mimeType: "text/csv" },
      { responseType: "arraybuffer" },
    );
    const buf = res.data as ArrayBuffer;
    return Buffer.from(buf).toString("utf8");
  }

  const res = await drive.files.get(
    { fileId: cfg.fileId, alt: "media" },
    { responseType: "arraybuffer" },
  );
  const buf = res.data as ArrayBuffer;
  return Buffer.from(buf).toString("utf8");
}

export async function loadPrefillPayloadFromDrive(
  cfg: GoogleDrivePrefillConfig,
): Promise<PrefillFormPayload> {
  const csvText = await downloadCsvText(cfg);

  const parsed = Papa.parse<Record<string, unknown>>(csvText, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) =>
      h
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/-/g, "_"),
  });

  if (parsed.errors.length > 0) {
    const msg = parsed.errors.map((e) => e.message).join("; ");
    throw new Error(`CSV parse: ${msg}`);
  }

  const rows = (parsed.data ?? []).filter(
    (r) => r && typeof r === "object" && Object.keys(r as object).length > 0,
  ) as Record<string, unknown>[];

  if (rows.length === 0) {
    throw new Error("CSV-ում տվյալների տող չկա");
  }

  if (cfg.dataRowIndex >= rows.length) {
    throw new Error(
      `DRIVE_PREFILL_DATA_ROW=${cfg.dataRowIndex} — CSV-ում կա միայն ${rows.length} տվյալների տող`,
    );
  }

  const rawRow = rows[cfg.dataRowIndex]!;
  const normalized = normalizeCsvRow(rawRow);
  return rowToPayload(normalized);
}
