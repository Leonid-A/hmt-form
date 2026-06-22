# Google Drive Setup

## Step 1 — Get your Service Account JSON

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project (or pick an existing one)
3. Enable the **Google Drive API** for that project
4. Go to **IAM & Admin → Service Accounts → Create Service Account**
5. Give it any name, click through to finish
6. Click the service account → **Keys tab → Add Key → Create new key → JSON**
7. A `.json` file downloads — open it, copy the entire contents

Add to `.env.local`:
```
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...entire json here...}
```

## Step 2 — Get the parent folder ID

1. Go to [drive.google.com](https://drive.google.com)
2. Create a folder, e.g. `HMT Car Photos`
3. Open the folder — copy the ID from the URL:
   ```
   https://drive.google.com/drive/folders/1ABCxyz123456789
                                           ↑ this part
   ```
4. Share the folder with the **`client_email`** from your JSON file (looks like `something@project.iam.gserviceaccount.com`) — give it **Editor** access

Add to `.env.local`:
```
DRIVE_UPLOAD_PARENT_FOLDER_ID=1ABCxyz123456789
```

## Final `.env.local`

```
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
DRIVE_UPLOAD_PARENT_FOLDER_ID=1ABCxyz123456789
```

Once both vars are set, the app will automatically create a subfolder named after the apartment code inside your parent folder and upload car images there.
