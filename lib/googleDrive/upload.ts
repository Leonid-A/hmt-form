import { google } from "googleapis";
import { Readable } from "stream";

function getCredentials(): Record<string, unknown> {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim() ?? "";
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not set");
  let jsonStr = raw;
  try {
    JSON.parse(raw);
  } catch {
    jsonStr = Buffer.from(raw, "base64").toString("utf8");
  }
  return JSON.parse(jsonStr) as Record<string, unknown>;
}

function getParentFolderId(): string {
  const id = process.env.DRIVE_UPLOAD_PARENT_FOLDER_ID?.trim() ?? "";
  if (!id) throw new Error("DRIVE_UPLOAD_PARENT_FOLDER_ID is not set");
  return id;
}

function buildDriveClient() {
  const credentials = getCredentials();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
  return google.drive({ version: "v3", auth });
}

/** Find or create a subfolder by name under parentId. Returns the folder ID. */
async function ensureSubfolder(
  drive: ReturnType<typeof google.drive>,
  parentId: string,
  name: string,
): Promise<string> {
  const safeName = name.trim() || "unnamed";

  const existing = await drive.files.list({
    q: `'${parentId}' in parents and name = '${safeName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id)",
    spaces: "drive",
  });

  if (existing.data.files && existing.data.files.length > 0) {
    return existing.data.files[0]!.id!;
  }

  const created = await drive.files.create({
    requestBody: {
      name: safeName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: "id",
  });

  return created.data.id!;
}

export type UploadResult = {
  fileId: string;
  webViewLink: string;
};

export async function uploadCarPhoto(
  propertyId: string,
  fileName: string,
  mimeType: string,
  buffer: Buffer,
): Promise<UploadResult> {
  const drive = buildDriveClient();
  const parentFolderId = getParentFolderId();
  const subFolderId = await ensureSubfolder(drive, parentFolderId, propertyId);

  const stream = Readable.from(buffer);

  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [subFolderId],
    },
    media: {
      mimeType,
      body: stream,
    },
    fields: "id, webViewLink",
  });

  await drive.permissions.create({
    fileId: res.data.id!,
    requestBody: { role: "reader", type: "anyone" },
  });

  return {
    fileId: res.data.id!,
    webViewLink: res.data.webViewLink!,
  };
}
