import { requireAdminSession } from "@/lib/admin/auth";
import { getMongoClientPromise } from "@/lib/mongodb";
import { getServerConfig } from "@/config/server";
import type { WithId, Document } from "mongodb";
import { SubmissionsTable, type SubmissionRow } from "./SubmissionsTable";

type RawDoc = WithId<Document> & {
  submittedAt?: Date;
  flags?: { notOwnerAnymore?: boolean; forRent?: boolean };
  common?: {
    propertyUniqueId?: string;
    ownerName?: string;
    phone1?: string; phone2?: string; phone3?: string; phone4?: string; phone5?: string;
    email1?: string; email2?: string; email3?: string; email4?: string; email5?: string;
    carBrand?: string; carModel?: string; carColor?: string; carNumber?: string;
    car2Brand?: string; car2Model?: string; car2Color?: string; car2Number?: string;
    car1PhotoUrls?: string[];
    car2PhotoUrls?: string[];
  } | null;
  newOwner?: { propertyUniqueId?: string; name?: string; phone1?: string } | null;
  renter?: { name?: string; phone1?: string; email1?: string } | null;
};

function slot(arr: string[] | undefined, i: number): string {
  return arr?.[i] ?? "";
}

function toRow(doc: RawDoc): SubmissionRow {
  const isNotOwner = !!doc.flags?.notOwnerAnymore;
  const isRent = !!doc.flags?.forRent;
  const mode = isNotOwner ? "notOwner" : isRent ? "forRent" : "owner";
  const c = doc.common;
  const no = doc.newOwner;
  const r = doc.renter;

  return {
    _id: String(doc._id),
    submittedAt: doc.submittedAt
      ? new Date(doc.submittedAt).toLocaleString("en-GB", {
          day: "2-digit", month: "2-digit", year: "numeric",
          hour: "2-digit", minute: "2-digit",
        })
      : "",
    mode,
    propertyUniqueId: (isNotOwner ? no?.propertyUniqueId : c?.propertyUniqueId) ?? "",
    ownerName: c?.ownerName ?? "",
    phone1: c?.phone1 ?? "",
    phone2: c?.phone2 ?? "",
    phone3: c?.phone3 ?? "",
    phone4: c?.phone4 ?? "",
    phone5: c?.phone5 ?? "",
    email1: c?.email1 ?? "",
    email2: c?.email2 ?? "",
    email3: c?.email3 ?? "",
    email4: c?.email4 ?? "",
    email5: c?.email5 ?? "",
    newOwnerName: no?.name ?? "",
    newOwnerPhone: no?.phone1 ?? "",
    renterName: r?.name ?? "",
    renterPhone: r?.phone1 ?? "",
    renterEmail: r?.email1 ?? "",
    carBrand: c?.carBrand ?? "",
    carModel: c?.carModel ?? "",
    carColor: c?.carColor ?? "",
    carNumber: c?.carNumber ?? "",
    car1Photo1: slot(c?.car1PhotoUrls, 0),
    car1Photo2: slot(c?.car1PhotoUrls, 1),
    car1Photo3: slot(c?.car1PhotoUrls, 2),
    car1Photo4: slot(c?.car1PhotoUrls, 3),
    car1Photo5: slot(c?.car1PhotoUrls, 4),
    car2Brand: c?.car2Brand ?? "",
    car2Model: c?.car2Model ?? "",
    car2Color: c?.car2Color ?? "",
    car2Number: c?.car2Number ?? "",
    car2Photo1: slot(c?.car2PhotoUrls, 0),
    car2Photo2: slot(c?.car2PhotoUrls, 1),
    car2Photo3: slot(c?.car2PhotoUrls, 2),
    car2Photo4: slot(c?.car2PhotoUrls, 3),
    car2Photo5: slot(c?.car2PhotoUrls, 4),
  };
}

async function getSubmissions(): Promise<SubmissionRow[]> {
  const client = await getMongoClientPromise();
  const { mongodb } = getServerConfig();
  const coll = client.db(mongodb.dbName).collection(mongodb.collectionName);
  const docs = await coll.find({}).sort({ submittedAt: -1 }).limit(500).toArray();
  return (docs as RawDoc[]).map(toRow);
}

export default async function AdminPanelPage() {
  await requireAdminSession();
  const rows = await getSubmissions();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between px-6 py-4">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Admin Panel
          </h1>
          <form action="/adminPanel/logout" method="POST">
            <button
              type="submit"
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="px-6 py-6">
        {rows.length === 0 ? (
          <p className="text-center text-zinc-400">No submissions yet.</p>
        ) : (
          <SubmissionsTable rows={rows} />
        )}
      </main>
    </div>
  );
}
