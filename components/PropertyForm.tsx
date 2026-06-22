"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { submitPropertyForm } from "@/app/actions";

type CommonState = {
  propertyUniqueId: string;
  ownerName: string;
  phones: string[];
  emails: string[];
  carBrand: string;
  carModel: string;
  carColor: string;
  carNumber: string;
  car2Brand: string;
  car2Model: string;
  car2Color: string;
  car2Number: string;
};

type PersonContactState = {
  name: string;
  phone1: string;
  email1: string;
};

type NewOwnerState = {
  name: string;
  phone1: string;
};

const emptyCommon = (): CommonState => ({
  propertyUniqueId: "",
  ownerName: "",
  phones: [""],
  emails: [""],
  carBrand: "",
  carModel: "",
  carColor: "",
  carNumber: "",
  car2Brand: "",
  car2Model: "",
  car2Color: "",
  car2Number: "",
});

const emptyPerson = (): PersonContactState => ({
  name: "",
  phone1: "",
  email1: "",
});

const emptyNewOwner = (): NewOwnerState => ({
  name: "",
  phone1: "",
});

const CONTACT_SLOTS_MAX = 5;
/** Վարձակալի հեռախոս/էլ. փոստ՝ մեկական տող (ընդհանուր 5-ից մեկը) */
const RENTER_SINGLE_CONTACT_SLOTS = 1;

/** UI ցուցակից՝ առանց բացերի, phone1…phone5 / email1…email5 */
function compactToFiveSlots(values: string[]): [string, string, string, string, string] {
  const filled = values.map((s) => s.trim()).filter((s) => s.length > 0).slice(0, 5);
  return [
    filled[0] ?? "",
    filled[1] ?? "",
    filled[2] ?? "",
    filled[3] ?? "",
    filled[4] ?? "",
  ];
}

type SubmissionModeRadio = "owner" | "forRent";

const RADIO_GROUP_NAME = "submission-mode";

const RADIO_INPUT_CLASS =
  "mt-0.5 size-4 shrink-0 cursor-pointer accent-sky-600 dark:accent-sky-400";

function submissionModeRowClass(active: boolean): string {
  return [
    "flex cursor-pointer items-start gap-3 rounded-lg border-2 px-3 py-2.5 transition-colors",
    active
      ? "border-sky-600 bg-sky-50 shadow-sm dark:border-sky-400 dark:bg-sky-950/55 dark:shadow-none"
      : "border-zinc-200/90 bg-white/80 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950/40 dark:hover:border-zinc-600 dark:hover:bg-zinc-900/60",
  ].join(" ");
}

/** Սեփականատիրոջ և վարձակալի մուտքերի ընդհանուր երկարությունը չգերազանցի `max`-ը, ամեն կողմում առնվազն 1 տող */
function trimContactRowsToMax(
  owner: string[],
  renter: string[],
  max: number,
): [string[], string[]] {
  let o = [...owner];
  let r = [...renter];
  while (o.length + r.length > max) {
    if (o.length > r.length && o.length > 1) o = o.slice(0, -1);
    else if (r.length > 1) r = r.slice(0, -1);
    else if (o.length > 1) o = o.slice(0, -1);
    else break;
  }
  if (o.length === 0) o = [""];
  if (r.length === 0) r = [""];
  return [o, r];
}

/** Միայն սեփականատիրոջ ցուցակ՝ առանց վարձակալի տողի */
function trimOwnerListToMax(owner: string[], max: number): string[] {
  let o = [...owner];
  while (o.length > max && o.length > 1) o = o.slice(0, -1);
  if (o.length === 0) o = [""];
  return o;
}

function RequiredMark() {
  return (
    <span className="ml-0.5 font-semibold text-red-600 dark:text-red-400" aria-hidden="true">
      *
    </span>
  );
}

function FieldLabel({
  htmlFor,
  children,
  required = false,
}: {
  htmlFor: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1 block text-sm font-medium text-zinc-800 dark:text-zinc-100"
    >
      {children}
      {required ? <RequiredMark /> : null}
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none ring-zinc-400 focus:border-zinc-500 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-400"
    />
  );
}

function StringListEditor({
  idPrefix,
  label,
  type,
  values,
  onChange,
  onAdd,
  onRemove,
  canAdd,
  canRemove,
  combinedSlotCount,
  combinedSlotMax = 5,
  required = false,
  /** Միայն սեփականատիրոջ հեռախոս/էլ. փոստի առաջին տողի համար */
  showPrimaryLabel = false,
}: {
  idPrefix: string;
  label: string;
  type: "tel" | "email";
  values: string[];
  onChange: (index: number, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  canAdd: boolean;
  canRemove: boolean;
  /** Երբ տրված է՝ «Ավելացնել»-ում ցուցադրվում է ընդհանուր (սեփականատեր+վարձակալ) հաշվարկը */
  combinedSlotCount?: number;
  combinedSlotMax?: number;
  required?: boolean;
  showPrimaryLabel?: boolean;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
        {label}
        {required ? <RequiredMark /> : null}
      </p>
      <ul className="space-y-2">
        {values.map((v, i) => (
          <li key={`${idPrefix}-${i}`} className="flex items-end gap-2">
            <div className="min-w-0 flex-1 space-y-1">
              {showPrimaryLabel && i === 0 ? (
                <span className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Հիմնական
                </span>
              ) : null}
              <TextInput
                id={`${idPrefix}-${i}`}
                type={type}
                inputMode={type === "tel" ? "tel" : "email"}
                autoComplete={type === "tel" ? "tel" : "email"}
                value={v}
                onChange={(e) => onChange(i, e.target.value)}
              />
            </div>
            {canRemove ? (
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="shrink-0 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                Հեռացնել
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      {canAdd ? (
        <button
          type="button"
          onClick={onAdd}
          className="text-sm font-medium text-zinc-900 underline underline-offset-2 hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-zinc-300"
        >
          Ավելացնել (
          {combinedSlotCount !== undefined
            ? `${combinedSlotCount}/${combinedSlotMax}`
            : `${values.length}/5`}
          )
        </button>
      ) : (
        <p className="text-xs text-zinc-500">
          {combinedSlotCount !== undefined
            ? `Առավելագույնը ${combinedSlotMax} մուտք ընդհանուր (սեփականատեր + վարձակալ)`
            : "Առավելագույնը 5 մուտք"}
        </p>
      )}
    </div>
  );
}

type UploadedPhoto = {
  fileId: string;
  webViewLink: string;
  name: string;
  previewUrl: string;
};

function CarPhotoUploader({
  carSlot,
  propertyId,
  photos,
  onChange,
}: {
  carSlot: "car1" | "car2";
  propertyId: string;
  photos: UploadedPhoto[];
  onChange: (photos: UploadedPhoto[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MAX_PHOTOS = 2;
  const atLimit = photos.length >= MAX_PHOTOS;

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      if (!propertyId.trim()) {
        setError("Նախ լրացրեք Գույքի նույնացուցիչը");
        return;
      }
      if (photos.length + files.length > MAX_PHOTOS) {
        setError(`Ընտրեք առավելագույնը ${MAX_PHOTOS} նկար`);
        return;
      }
      const slots = MAX_PHOTOS - photos.length;
      if (slots <= 0) return;
      setError(null);
      setUploading(true);
      const added: UploadedPhoto[] = [];
      for (const file of Array.from(files).slice(0, slots)) {
        try {
          const fd = new FormData();
          fd.append("file", file);
          fd.append("propertyId", propertyId.trim());
          const res = await fetch("/api/upload", { method: "POST", body: fd });
          if (!res.ok) {
            const body = (await res.json()) as { error?: string };
            throw new Error(body.error ?? "Upload failed");
          }
          const data = (await res.json()) as { fileId: string; webViewLink: string };
          added.push({
            fileId: data.fileId,
            webViewLink: data.webViewLink,
            name: file.name,
            previewUrl: URL.createObjectURL(file),
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : "Բեռնման սխալ");
        }
      }
      if (added.length > 0) onChange([...photos, ...added]);
      setUploading(false);
    },
    [photos, onChange, propertyId],
  );

  function removePhoto(fileId: string) {
    onChange(photos.filter((p) => p.fileId !== fileId));
  }

  const inputId = `car-photo-input-${carSlot}`;

  return (
    <div className="mt-2 space-y-2">
      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      {photos.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {photos.map((p) => (
            <div key={p.fileId} className="group relative h-16 w-16 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.previewUrl}
                alt={p.name}
                className="h-16 w-16 rounded-lg border border-zinc-200 object-cover dark:border-zinc-700"
              />
              <button
                type="button"
                onClick={() => removePhoto(p.fileId)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-white opacity-0 transition group-hover:opacity-100 dark:bg-zinc-100 dark:text-zinc-900"
                aria-label="Հեռացնել նկարը"
              >
                ×
              </button>
              <a
                href={p.webViewLink}
                target="_blank"
                rel="noreferrer"
                className="absolute inset-0 rounded-lg"
                aria-label="Բացել Drive-ում"
              />
            </div>
          ))}
        </div>
      ) : null}

      {atLimit ? (
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Առավելագույնը {MAX_PHOTOS} նկար
        </p>
      ) : (
        <>
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            multiple={MAX_PHOTOS - photos.length > 1}
            className="sr-only"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <label
            htmlFor={inputId}
            className={[
              "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition",
              uploading
                ? "cursor-not-allowed border-zinc-200 text-zinc-400 dark:border-zinc-700 dark:text-zinc-500"
                : "border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-900",
            ].join(" ")}
            aria-disabled={uploading}
          >
            {uploading ? (
              <>
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
                Բեռնվում է…
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12V4m0 0L8 8m4-4 4 4"
                  />
                </svg>
                Ավելացնել նկար ({photos.length}/{MAX_PHOTOS})
              </>
            )}
          </label>
        </>
      )}
    </div>
  );
}

export function PropertyForm() {
  const [forRent, setForRent] = useState(false);
  const [hasSecondCar, setHasSecondCar] = useState(false);

  const [common, setCommon] = useState<CommonState>(emptyCommon);
  const [renter, setRenter] = useState<PersonContactState>(emptyPerson);

  const [state, formAction, isPending] = useActionState(submitPropertyForm, null);
  const [car1Photos, setCar1Photos] = useState<UploadedPhoto[]>([]);
  const [car2Photos, setCar2Photos] = useState<UploadedPhoto[]>([]);
  const [propertyIdLocked, setPropertyIdLocked] = useState(false);
  const [propertyIdTouched, setPropertyIdTouched] = useState(false);

  function isValidPropertyId(v: string): boolean {
    return /^A-\d+-\d+$/.test(v.trim());
  }

  const commonRef = useRef(common);
  const renterRef = useRef(renter);
  const forRentRef = useRef(forRent);

  useLayoutEffect(() => {
    commonRef.current = common;
    renterRef.current = renter;
    forRentRef.current = forRent;
  });

  const renterPhoneReserved = forRent && renter.phone1.trim().length > 0;
  const renterEmailReserved = forRent && renter.email1.trim().length > 0;
  const totalPhoneSlots = renterPhoneReserved
    ? common.phones.length + RENTER_SINGLE_CONTACT_SLOTS
    : common.phones.length;
  const totalEmailSlots = renterEmailReserved
    ? common.emails.length + RENTER_SINGLE_CONTACT_SLOTS
    : common.emails.length;

  useEffect(() => {
    if (!forRent) return;
    const c = commonRef.current;
    const r = renterRef.current;

    let npO: string[];
    let nextRenterPhone: string;
    if (r.phone1.trim()) {
      const [o, renterPhones] = trimContactRowsToMax(c.phones, [r.phone1], CONTACT_SLOTS_MAX);
      npO = o;
      nextRenterPhone = renterPhones[0] ?? "";
    } else {
      npO = trimOwnerListToMax(c.phones, CONTACT_SLOTS_MAX);
      nextRenterPhone = r.phone1;
    }

    let neO: string[];
    let nextRenterEmail: string;
    if (r.email1.trim()) {
      const [o, renterEmails] = trimContactRowsToMax(c.emails, [r.email1], CONTACT_SLOTS_MAX);
      neO = o;
      nextRenterEmail = renterEmails[0] ?? "";
    } else {
      neO = trimOwnerListToMax(c.emails, CONTACT_SLOTS_MAX);
      nextRenterEmail = r.email1;
    }

    const changed =
      JSON.stringify(npO) !== JSON.stringify(c.phones) ||
      nextRenterPhone !== r.phone1 ||
      JSON.stringify(neO) !== JSON.stringify(c.emails) ||
      nextRenterEmail !== r.email1;
    if (!changed) return;
    setCommon((prev) => ({ ...prev, phones: npO, emails: neO }));
    setRenter((prev) => ({ ...prev, phone1: nextRenterPhone, email1: nextRenterEmail }));
  }, [
    forRent,
    common.phones.length,
    renter.phone1,
    common.emails.length,
    renter.email1,
  ]);


  function addOwnerPhone() {
    setCommon((c) => {
      const reservedForRenter =
        forRentRef.current && renterRef.current.phone1.trim().length > 0
          ? RENTER_SINGLE_CONTACT_SLOTS
          : 0;
      const cap = CONTACT_SLOTS_MAX - reservedForRenter;
      if (c.phones.length >= cap) return c;
      return { ...c, phones: [...c.phones, ""] };
    });
  }

  function addOwnerEmail() {
    setCommon((c) => {
      const reservedForRenter =
        forRentRef.current && renterRef.current.email1.trim().length > 0
          ? RENTER_SINGLE_CONTACT_SLOTS
          : 0;
      const cap = CONTACT_SLOTS_MAX - reservedForRenter;
      if (c.emails.length >= cap) return c;
      return { ...c, emails: [...c.emails, ""] };
    });
  }

  const payload = useMemo(() => {
    const [phone1, phone2, phone3, phone4, phone5] = compactToFiveSlots(common.phones);
    const [email1, email2, email3, email4, email5] = compactToFiveSlots(common.emails);
    const commonFlat = {
      propertyUniqueId: common.propertyUniqueId,
      ownerName: common.ownerName,
      phone1,
      phone2,
      phone3,
      phone4,
      phone5,
      email1,
      email2,
      email3,
      email4,
      email5,
      carBrand: common.carBrand,
      carModel: common.carModel,
      carColor: common.carColor,
      carNumber: common.carNumber,
      car2Brand: hasSecondCar ? common.car2Brand : "",
      car2Model: hasSecondCar ? common.car2Model : "",
      car2Color: hasSecondCar ? common.car2Color : "",
      car2Number: hasSecondCar ? common.car2Number : "",
      car1PhotoUrls: car1Photos.map((p) => p.webViewLink),
      car2PhotoUrls: hasSecondCar ? car2Photos.map((p) => p.webViewLink) : [],
    };
    return JSON.stringify({
      flags: { notOwnerAnymore: false, forRent },
      common: commonFlat,
      newOwner: null,
      renter:
        forRent
          ? renter.name.trim() === "" &&
              renter.phone1.trim() === "" &&
              renter.email1.trim() === ""
            ? null
            : { name: renter.name, phone1: renter.phone1, email1: renter.email1 }
          : null,
    });
  }, [car1Photos, car2Photos, common, forRent, hasSecondCar, renter]);

  function updateCommon<K extends keyof CommonState>(key: K, value: CommonState[K]) {
    setCommon((c) => ({ ...c, [key]: value }));
  }

  function updatePhones(
    setter: Dispatch<SetStateAction<CommonState>>,
    index: number,
    value: string,
  ) {
    setter((c) => ({
      ...c,
      phones: c.phones.map((p, i) => (i === index ? value : p)),
    }));
  }

  function removePhone(setter: Dispatch<SetStateAction<CommonState>>, index: number) {
    setter((c) =>
      c.phones.length <= 1 ? c : { ...c, phones: c.phones.filter((_, i) => i !== index) },
    );
  }

  function updateEmails(
    setter: Dispatch<SetStateAction<CommonState>>,
    index: number,
    value: string,
  ) {
    setter((c) => ({
      ...c,
      emails: c.emails.map((p, i) => (i === index ? value : p)),
    }));
  }

  function removeEmail(setter: Dispatch<SetStateAction<CommonState>>, index: number) {
    setter((c) =>
      c.emails.length <= 1 ? c : { ...c, emails: c.emails.filter((_, i) => i !== index) },
    );
  }

  const submissionMode: SubmissionModeRadio = forRent ? "forRent" : "owner";

  function applySubmissionMode(mode: SubmissionModeRadio) {
    if (mode === "owner") {
      setForRent(false);
      return;
    }
    setForRent(true);
    setRenter(emptyPerson());
  }

  if (state?.ok) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-8">
        <div className="py-10 text-center sm:py-14">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            Շնորհակալություն
          </h2>
          <p className="mx-auto mt-3 max-w-md text-base text-zinc-600 dark:text-zinc-400">
            Ձեր տվյալները հաջողությամբ գրանցվել են։
          </p>
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-500">{state.submittedAtLabel}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-8">
      <div className="mb-6 space-y-1 sm:mb-8">
        <FieldLabel htmlFor="property-id" required>
          Գույքի նույնացուցիչը համատիրությունում{" "}
          <span className="font-normal text-zinc-400 dark:text-zinc-500">
            (օր․՝ A-553-33)
          </span>
        </FieldLabel>
        <div className="flex gap-2">
          <TextInput
            id="property-id"
            value={common.propertyUniqueId}
            disabled={propertyIdLocked}
            onChange={(e) => updateCommon("propertyUniqueId", e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                setPropertyIdTouched(true);
                if (isValidPropertyId(common.propertyUniqueId)) setPropertyIdLocked(true);
              }
            }}
          />
          <button
            type="button"
            disabled={propertyIdLocked}
            onClick={() => {
              setPropertyIdTouched(true);
              if (isValidPropertyId(common.propertyUniqueId)) setPropertyIdLocked(true);
            }}
            className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Կիրառել
          </button>
        </div>
        {propertyIdTouched && !propertyIdLocked && !isValidPropertyId(common.propertyUniqueId) ? (
          <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
            Անվավեր բնակարանի նույնացուցիչ
          </p>
        ) : null}
      </div>

      {!propertyIdLocked ? null :<>
      <div
        className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40"
        role="radiogroup"
        aria-label="Ուղարկման ռեժիմ"
      >
        <label className={submissionModeRowClass(submissionMode === "owner")}>
          <input
            type="radio"
            name={RADIO_GROUP_NAME}
            value="owner"
            className={RADIO_INPUT_CLASS}
            checked={submissionMode === "owner"}
            onChange={() => applySubmissionMode("owner")}
          />
          <span
            className={
              submissionMode === "owner"
                ? "min-w-0 text-sm font-semibold text-sky-950 dark:text-sky-100"
                : "min-w-0 text-sm font-medium text-zinc-900 dark:text-zinc-50"
            }
          >
            Սեփականատեր
          </span>
        </label>

        <label className={submissionModeRowClass(submissionMode === "forRent")}>
          <input
            type="radio"
            name={RADIO_GROUP_NAME}
            value="forRent"
            className={RADIO_INPUT_CLASS}
            checked={submissionMode === "forRent"}
            onChange={() => applySubmissionMode("forRent")}
          />
          <span
            className={
              submissionMode === "forRent"
                ? "min-w-0 text-sm font-semibold text-sky-950 dark:text-sky-100"
                : "min-w-0 text-sm font-medium text-zinc-900 dark:text-zinc-50"
            }
          >
            Վարձակալ
          </span>
        </label>
      </div>

      <form action={formAction} className="mt-8 space-y-8">
        <input type="hidden" name="payload" value={payload} readOnly />
        <div className="space-y-6">
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
              Ընդհանուր տվյալներ
            </h3>

            {forRent ? (
              <div className="space-y-4 rounded-xl border border-dashed border-zinc-300 p-4 dark:border-zinc-700">
                <h4 className="text-base font-medium text-zinc-900 dark:text-zinc-50">
                  Վարձակալի տվյալներ
                </h4>
                <div>
                  <FieldLabel htmlFor="renter-name">
                    Վարձակալի անուն
                  </FieldLabel>
                  <TextInput
                    id="renter-name"
                    value={renter.name}
                    onChange={(e) => setRenter((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="renter-phone">
                    Վարձակալի հեռախոսահամար
                  </FieldLabel>
                  <TextInput
                    id="renter-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={renter.phone1}
                    onChange={(e) => setRenter((p) => ({ ...p, phone1: e.target.value }))}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="renter-email">
                    Վարձակալի էլ. փոստ
                  </FieldLabel>
                  <TextInput
                    id="renter-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={renter.email1}
                    onChange={(e) => setRenter((p) => ({ ...p, email1: e.target.value }))}
                  />
                </div>
              </div>
            ) : null}

            <div>
              <FieldLabel htmlFor="owner-name" required>
                Սեփականատիրոջ անուն
              </FieldLabel>
              <TextInput
                id="owner-name"
                value={common.ownerName}
                onChange={(e) => updateCommon("ownerName", e.target.value)}
              />
            </div>
            <StringListEditor
              idPrefix="common-phone"
              label={
                forRent
                  ? "Սեփականատիրոջ հեռախոսահամարներ (մինչև 5; վարձակալի հեռախոսը լրացված լինելու դեպքում՝ սեփականատիրոջը մինչև 4)"
                  : "Հեռախոսահամարներ (մինչև 5)"
              }
              type="tel"
              values={common.phones}
              onChange={(i, v) => updatePhones(setCommon, i, v)}
              onAdd={addOwnerPhone}
              onRemove={(i) => removePhone(setCommon, i)}
              canAdd={
                forRent ? totalPhoneSlots < CONTACT_SLOTS_MAX : common.phones.length < CONTACT_SLOTS_MAX
              }
              canRemove={common.phones.length > 1}
              combinedSlotCount={forRent ? totalPhoneSlots : undefined}
              combinedSlotMax={CONTACT_SLOTS_MAX}
              required
              showPrimaryLabel
            />
            <StringListEditor
              idPrefix="common-email"
              label={
                forRent
                  ? "Սեփականատիրոջ էլ. փոստեր (մինչև 5; վարձակալի էլ. փոստը լրացված լինելու դեպքում՝ սեփականատիրոջը մինչև 4)"
                  : "Էլ. փոստեր (մինչև 5)"
              }
              type="email"
              values={common.emails}
              onChange={(i, v) => updateEmails(setCommon, i, v)}
              onAdd={addOwnerEmail}
              onRemove={(i) => removeEmail(setCommon, i)}
              canAdd={forRent ? totalEmailSlots < CONTACT_SLOTS_MAX : common.emails.length < CONTACT_SLOTS_MAX}
              canRemove={common.emails.length > 1}
              combinedSlotCount={forRent ? totalEmailSlots : undefined}
              combinedSlotMax={CONTACT_SLOTS_MAX}
              required
              showPrimaryLabel
            />
            <div className="space-y-4">
              <h4 className="text-base font-medium text-zinc-900 dark:text-zinc-50">
                Մեքենա
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Ըստ ցանկության. եթե մեքենա չկա՝ դաշտերը թողեք դատարկ։
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="car-brand">
                    Մակնիշ
                  </FieldLabel>
                  <TextInput
                    id="car-brand"
                    value={common.carBrand}
                    onChange={(e) => updateCommon("carBrand", e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="car-model">
                    Մոդել
                  </FieldLabel>
                  <TextInput
                    id="car-model"
                    value={common.carModel}
                    onChange={(e) => updateCommon("carModel", e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="car-color">
                    Գույն
                  </FieldLabel>
                  <TextInput
                    id="car-color"
                    value={common.carColor}
                    onChange={(e) => updateCommon("carColor", e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="car-number">
                    Համարանիշ
                  </FieldLabel>
                  <TextInput
                    id="car-number"
                    value={common.carNumber}
                    onChange={(e) => updateCommon("carNumber", e.target.value)}
                  />
                  <CarPhotoUploader
                    carSlot="car1"
                    propertyId={common.propertyUniqueId}
                    photos={car1Photos}
                    onChange={setCar1Photos}
                  />
                </div>
              </div>
              {!hasSecondCar ? (
                <button
                  type="button"
                  onClick={() => setHasSecondCar(true)}
                  className="text-sm font-medium text-zinc-900 underline underline-offset-2 hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-zinc-300"
                >
                  Ավելացնել երկրորդ մեքենա
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-base font-medium text-zinc-900 dark:text-zinc-50">
                      Երկրորդ մեքենա
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setHasSecondCar(false);
                        setCommon((c) => ({
                          ...c,
                          car2Brand: "",
                          car2Model: "",
                          car2Color: "",
                          car2Number: "",
                        }));
                      }}
                      className="shrink-0 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-900"
                    >
                      Հեռացնել երկրորդ մեքենան
                    </button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <FieldLabel htmlFor="car2-brand">
                        Մակնիշ
                      </FieldLabel>
                      <TextInput
                        id="car2-brand"
                        value={common.car2Brand}
                        onChange={(e) => updateCommon("car2Brand", e.target.value)}
                      />
                    </div>
                    <div>
                      <FieldLabel htmlFor="car2-model">
                        Մոդել
                      </FieldLabel>
                      <TextInput
                        id="car2-model"
                        value={common.car2Model}
                        onChange={(e) => updateCommon("car2Model", e.target.value)}
                      />
                    </div>
                    <div>
                      <FieldLabel htmlFor="car2-color">
                        Գույն
                      </FieldLabel>
                      <TextInput
                        id="car2-color"
                        value={common.car2Color}
                        onChange={(e) => updateCommon("car2Color", e.target.value)}
                      />
                    </div>
                    <div>
                      <FieldLabel htmlFor="car2-number">
                        Համարանիշ
                      </FieldLabel>
                      <TextInput
                        id="car2-number"
                        value={common.car2Number}
                        onChange={(e) => updateCommon("car2Number", e.target.value)}
                      />
                      <CarPhotoUploader
                        carSlot="car2"
                        propertyId={common.propertyUniqueId}
                        photos={car2Photos}
                        onChange={setCar2Photos}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        {state?.ok === false ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {state.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 sm:w-auto"
        >
          {isPending ? "Ուղարկվում է…" : "Ուղարկել"}
        </button>
      </form>
      </>}
    </section>
  );
}
