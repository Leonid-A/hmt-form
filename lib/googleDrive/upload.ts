import { google } from "googleapis";
import { Readable } from "stream";

function getParentFolderId(): string {
  const id = process.env.DRIVE_UPLOAD_PARENT_FOLDER_ID?.trim() ?? "";
  if (!id) throw new Error("DRIVE_UPLOAD_PARENT_FOLDER_ID is not set");
  return id;
}

function buildDriveClient() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN?.trim();

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET and GOOGLE_OAUTH_REFRESH_TOKEN must all be set",
    );
  }

  const auth = new google.auth.OAuth2(clientId, clientSecret);
  auth.setCredentials({ refresh_token: refreshToken });
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
