"use client";

type Submission = {
  _id: string;
  submittedAt?: string;
  mode: "owner" | "notOwner" | "forRent";
  propertyUniqueId: string;
  ownerName: string;
  phone1: string; phone2: string; phone3: string; phone4: string; phone5: string;
  email1: string; email2: string; email3: string; email4: string; email5: string;
  newOwnerName: string;
  newOwnerPhone: string;
  renterName: string;
  renterPhone: string;
  renterEmail: string;
  carBrand: string; carModel: string; carColor: string; carNumber: string;
  car1Photo1: string; car1Photo2: string; car1Photo3: string; car1Photo4: string; car1Photo5: string;
  car2Brand: string; car2Model: string; car2Color: string; car2Number: string;
  car2Photo1: string; car2Photo2: string; car2Photo3: string; car2Photo4: string; car2Photo5: string;
};

const COLUMNS: { key: keyof Submission; label: string }[] = [
  { key: "_id", label: "ID" },
  { key: "submittedAt", label: "Submitted" },
  { key: "mode", label: "Mode" },
  { key: "propertyUniqueId", label: "Property ID" },
  { key: "ownerName", label: "Owner Name" },
  { key: "phone1", label: "Phone 1" },
  { key: "phone2", label: "Phone 2" },
  { key: "phone3", label: "Phone 3" },
  { key: "phone4", label: "Phone 4" },
  { key: "phone5", label: "Phone 5" },
  { key: "email1", label: "Email 1" },
  { key: "email2", label: "Email 2" },
  { key: "email3", label: "Email 3" },
  { key: "email4", label: "Email 4" },
  { key: "email5", label: "Email 5" },
  { key: "newOwnerName", label: "New Owner Name" },
  { key: "newOwnerPhone", label: "New Owner Phone" },
  { key: "renterName", label: "Renter Name" },
  { key: "renterPhone", label: "Renter Phone" },
  { key: "renterEmail", label: "Renter Email" },
  { key: "carBrand", label: "Car 1 Brand" },
  { key: "carModel", label: "Car 1 Model" },
  { key: "carColor", label: "Car 1 Color" },
  { key: "carNumber", label: "Car 1 Number" },
  { key: "car1Photo1", label: "Car 1 Photo 1" },
  { key: "car1Photo2", label: "Car 1 Photo 2" },
  { key: "car1Photo3", label: "Car 1 Photo 3" },
  { key: "car1Photo4", label: "Car 1 Photo 4" },
  { key: "car1Photo5", label: "Car 1 Photo 5" },
  { key: "car2Brand", label: "Car 2 Brand" },
  { key: "car2Model", label: "Car 2 Model" },
  { key: "car2Color", label: "Car 2 Color" },
  { key: "car2Number", label: "Car 2 Number" },
  { key: "car2Photo1", label: "Car 2 Photo 1" },
  { key: "car2Photo2", label: "Car 2 Photo 2" },
  { key: "car2Photo3", label: "Car 2 Photo 3" },
  { key: "car2Photo4", label: "Car 2 Photo 4" },
  { key: "car2Photo5", label: "Car 2 Photo 5" },
];

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function exportCsv(rows: Submission[]) {
  const header = COLUMNS.map((c) => c.label).join(",");
  const body = rows.map((row) =>
    COLUMNS.map((c) => csvEscape(row[c.key] ?? "")).join(",")
  );
  const csv = [header, ...body].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `submissions_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const MODE_LABEL: Record<string, string> = {
  owner: "Owner",
  notOwner: "Not owner",
  forRent: "For rent",
};

const MODE_CLASS: Record<string, string> = {
  owner: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  notOwner: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  forRent: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
};

export function SubmissionsTable({ rows }: { rows: Submission[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {rows.length} submission{rows.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={() => exportCsv(rows)}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0 0l-4-4m4 4l4-4" />
          </svg>
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 dark:border-zinc-800">
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={row._id}
                className={`border-b border-zinc-50 last:border-0 dark:border-zinc-800/60 ${
                  idx % 2 !== 0 ? "bg-zinc-50/50 dark:bg-zinc-900/30" : ""
                }`}
              >
                {COLUMNS.map((c) => {
                  const val = row[c.key] ?? "";
                  if (c.key === "mode") {
                    return (
                      <td key={c.key} className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${MODE_CLASS[val] ?? ""}`}>
                          {MODE_LABEL[val] ?? val}
                        </span>
                      </td>
                    );
                  }
                  if (c.key.includes("Photo") && val) {
                    return (
                      <td key={c.key} className="whitespace-nowrap px-4 py-3">
                        <a
                          href={val}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sky-600 hover:underline dark:text-sky-400"
                        >
                          View
                        </a>
                      </td>
                    );
                  }
                  return (
                    <td key={c.key} className="whitespace-nowrap px-4 py-3 text-zinc-700 dark:text-zinc-200">
                      {val || <span className="text-zinc-300 dark:text-zinc-600">—</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export type { Submission as SubmissionRow };
