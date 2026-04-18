"use client";

import {
  useActionState,
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
};

type PersonContactState = {
  name: string;
  phones: string[];
  emails: string[];
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
});

const emptyPerson = (): PersonContactState => ({
  name: "",
  phones: [""],
  emails: [""],
});

const CONTACT_SLOTS_MAX = 5;
/** Վարձակալի հեռախոս/էլ. փոստ՝ մեկական տող (ընդհանուր 5-ից մեկը) */
const RENTER_SINGLE_CONTACT_SLOTS = 1;

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

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1 block text-sm font-medium text-zinc-800 dark:text-zinc-100"
    >
      {children}
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
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{label}</p>
      <ul className="space-y-2">
        {values.map((v, i) => (
          <li key={`${idPrefix}-${i}`} className="flex gap-2">
            <TextInput
              id={`${idPrefix}-${i}`}
              type={type}
              inputMode={type === "tel" ? "tel" : "email"}
              autoComplete={type === "tel" ? "tel" : "email"}
              value={v}
              onChange={(e) => onChange(i, e.target.value)}
            />
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

export function PropertyForm() {
  const [notOwnerAnymore, setNotOwnerAnymore] = useState(false);
  const [forRent, setForRent] = useState(false);

  const [common, setCommon] = useState<CommonState>(emptyCommon);
  const [newOwner, setNewOwner] = useState<PersonContactState>(emptyPerson);
  const [renter, setRenter] = useState<PersonContactState>(emptyPerson);

  const [state, formAction, isPending] = useActionState(submitPropertyForm, null);

  const commonRef = useRef(common);
  const renterRef = useRef(renter);
  const forRentRef = useRef(forRent);

  useLayoutEffect(() => {
    commonRef.current = common;
    renterRef.current = renter;
    forRentRef.current = forRent;
  });

  const totalPhoneSlots = forRent
    ? common.phones.length + RENTER_SINGLE_CONTACT_SLOTS
    : common.phones.length;
  const totalEmailSlots = forRent
    ? common.emails.length + RENTER_SINGLE_CONTACT_SLOTS
    : common.emails.length;

  useEffect(() => {
    if (!forRent || notOwnerAnymore) return;
    const c = commonRef.current;
    const r = renterRef.current;
    let [npO, npR] = trimContactRowsToMax(c.phones, r.phones, CONTACT_SLOTS_MAX);
    let [neO, neR] = trimContactRowsToMax(c.emails, r.emails, CONTACT_SLOTS_MAX);
    npR = npR.length ? [npR[0] ?? ""] : [""];
    neR = neR.length ? [neR[0] ?? ""] : [""];
    while (npO.length + npR.length > CONTACT_SLOTS_MAX && npO.length > 1) {
      npO = npO.slice(0, -1);
    }
    while (neO.length + neR.length > CONTACT_SLOTS_MAX && neO.length > 1) {
      neO = neO.slice(0, -1);
    }
    const changed =
      JSON.stringify(npO) !== JSON.stringify(c.phones) ||
      JSON.stringify(npR) !== JSON.stringify(r.phones) ||
      JSON.stringify(neO) !== JSON.stringify(c.emails) ||
      JSON.stringify(neR) !== JSON.stringify(r.emails);
    if (!changed) return;
    setCommon((prev) => ({ ...prev, phones: npO, emails: neO }));
    setRenter((prev) => ({ ...prev, phones: npR, emails: neR }));
  }, [
    forRent,
    notOwnerAnymore,
    common.phones.length,
    renter.phones.length,
    common.emails.length,
    renter.emails.length,
  ]);

  function addOwnerPhone() {
    setCommon((c) => {
      const reservedForRenter = forRentRef.current ? RENTER_SINGLE_CONTACT_SLOTS : 0;
      const cap = CONTACT_SLOTS_MAX - reservedForRenter;
      if (c.phones.length >= cap) return c;
      return { ...c, phones: [...c.phones, ""] };
    });
  }

  function addOwnerEmail() {
    setCommon((c) => {
      const reservedForRenter = forRentRef.current ? RENTER_SINGLE_CONTACT_SLOTS : 0;
      const cap = CONTACT_SLOTS_MAX - reservedForRenter;
      if (c.emails.length >= cap) return c;
      return { ...c, emails: [...c.emails, ""] };
    });
  }

  const payload = useMemo(
    () =>
      JSON.stringify({
        flags: { notOwnerAnymore, forRent },
        common: notOwnerAnymore ? null : common,
        newOwner: notOwnerAnymore ? newOwner : null,
        renter: !notOwnerAnymore && forRent ? renter : null,
      }),
    [common, forRent, newOwner, notOwnerAnymore, renter],
  );

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

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-8">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Տվյալների ձև</h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Լրացրեք համապատասխան բաժինները։ Անջատիչները փոխադարձ բացառությամբ են աշխատում։
      </p>

      <div className="mt-6 space-y-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 size-4 rounded border-zinc-400"
            checked={notOwnerAnymore}
            disabled={forRent}
            onChange={(e) => {
              const on = e.target.checked;
              setNotOwnerAnymore(on);
              if (on) {
                setForRent(false);
                setNewOwner({ name: "", phones: [""], emails: [""] });
              }
            }}
          />
          <span>
            <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Այլևս սեփականատեր չեմ
            </span>
            <span className="mt-0.5 block text-xs text-zinc-600 dark:text-zinc-400">
              Միացնելու դեպքում ցուցադրվում են միայն նոր սեփականատիրոջ կոնտակտները։
            </span>
            {forRent ? (
              <span className="mt-1 block text-xs text-amber-700 dark:text-amber-300">
                Անջատեք «վարձակալության» անջատիչը՝ այս մեկը միացնելու համար։
              </span>
            ) : null}
          </span>
        </label>

        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 size-4 rounded border-zinc-400"
            checked={forRent}
            disabled={notOwnerAnymore}
            onChange={(e) => {
              const on = e.target.checked;
              setForRent(on);
              if (on) {
                setNotOwnerAnymore(false);
                setRenter(emptyPerson());
              }
            }}
          />
          <span>
            <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Սեփականատերը տալիս է վարձակալության
            </span>
            <span className="mt-0.5 block text-xs text-zinc-600 dark:text-zinc-400">
              Վարձակալը լրացնում է մեկ հեռախոս և մեկ էլ. փոստ։ Սեփականատիրոջ կոնտակտների
              մուտքերը (ծառայությունների համար)՝ մինչև 4 հեռախոս և 4 էլ. փոստ, որ ընդհանուրը
              լինի առավելագույնը 5։
            </span>
            {notOwnerAnymore ? (
              <span className="mt-1 block text-xs text-amber-700 dark:text-amber-300">
                Անջատեք «այլևս սեփականատեր չեմ» անջատիչը՝ այս մեկը միացնելու համար։
              </span>
            ) : null}
          </span>
        </label>
      </div>

      <form
        className="mt-8 space-y-8"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData();
          fd.set("payload", payload);
          formAction(fd);
        }}
      >
        {notOwnerAnymore ? (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
              Նոր սեփականատեր
            </h3>
            <div>
              <FieldLabel htmlFor="newOwner-name">Անուն</FieldLabel>
              <TextInput
                id="newOwner-name"
                value={newOwner.name}
                onChange={(e) => setNewOwner((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div>
              <FieldLabel htmlFor="newOwner-phone">Հեռախոսահամար</FieldLabel>
              <TextInput
                id="newOwner-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={newOwner.phones[0] ?? ""}
                onChange={(e) =>
                  setNewOwner((p) => ({ ...p, phones: [e.target.value] }))
                }
              />
              <p className="mt-1 text-xs text-zinc-500">
                Այս ռեժիմում թույլատրվում է միայն մեկ հեռախոսահամար։
              </p>
            </div>
            <div>
              <FieldLabel htmlFor="newOwner-email">Էլ. փոստ</FieldLabel>
              <TextInput
                id="newOwner-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={newOwner.emails[0] ?? ""}
                onChange={(e) =>
                  setNewOwner((p) => ({ ...p, emails: [e.target.value] }))
                }
              />
              <p className="mt-1 text-xs text-zinc-500">
                Այս ռեժիմում թույլատրվում է միայն մեկ էլ. փոստ։
              </p>
            </div>
          </div>
        ) : (
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
                  <FieldLabel htmlFor="renter-name">Վարձակալի անուն</FieldLabel>
                  <TextInput
                    id="renter-name"
                    value={renter.name}
                    onChange={(e) => setRenter((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="renter-phone">Վարձակալի հեռախոսահամար</FieldLabel>
                  <TextInput
                    id="renter-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={renter.phones[0] ?? ""}
                    onChange={(e) =>
                      setRenter((p) => ({ ...p, phones: [e.target.value] }))
                    }
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="renter-email">Վարձակալի էլ. փոստ</FieldLabel>
                  <TextInput
                    id="renter-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={renter.emails[0] ?? ""}
                    onChange={(e) =>
                      setRenter((p) => ({ ...p, emails: [e.target.value] }))
                    }
                  />
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FieldLabel htmlFor="property-id">Գույքի եզակի նույնացուցիչ</FieldLabel>
                <TextInput
                  id="property-id"
                  value={common.propertyUniqueId}
                  onChange={(e) => updateCommon("propertyUniqueId", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel htmlFor="owner-name">Սեփականատիրոջ անուն</FieldLabel>
                <TextInput
                  id="owner-name"
                  value={common.ownerName}
                  onChange={(e) => updateCommon("ownerName", e.target.value)}
                />
              </div>
            </div>
            <StringListEditor
              idPrefix="common-phone"
              label={
                forRent
                  ? "Սեփականատիրոջ հեռախոսահամարներ (մինչև 4 + վարձակալի 1 = ընդհանուր 5)"
                  : "Հեռախոսահամարներ (մինչև 5)"
              }
              type="tel"
              values={common.phones}
              onChange={(i, v) => updatePhones(setCommon, i, v)}
              onAdd={addOwnerPhone}
              onRemove={(i) => removePhone(setCommon, i)}
              canAdd={forRent ? totalPhoneSlots < CONTACT_SLOTS_MAX : common.phones.length < CONTACT_SLOTS_MAX}
              canRemove={common.phones.length > 1}
              combinedSlotCount={forRent ? totalPhoneSlots : undefined}
              combinedSlotMax={CONTACT_SLOTS_MAX}
            />
            <StringListEditor
              idPrefix="common-email"
              label={
                forRent
                  ? "Սեփականատիրոջ էլ. փոստեր (մինչև 4 + վարձակալի 1 = ընդհանուր 5)"
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
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="car-brand">Մեքենայի մակնիշ</FieldLabel>
                <TextInput
                  id="car-brand"
                  value={common.carBrand}
                  onChange={(e) => updateCommon("carBrand", e.target.value)}
                />
              </div>
              <div>
                <FieldLabel htmlFor="car-model">Մոդել</FieldLabel>
                <TextInput
                  id="car-model"
                  value={common.carModel}
                  onChange={(e) => updateCommon("carModel", e.target.value)}
                />
              </div>
              <div>
                <FieldLabel htmlFor="car-color">Գույն</FieldLabel>
                <TextInput
                  id="car-color"
                  value={common.carColor}
                  onChange={(e) => updateCommon("carColor", e.target.value)}
                />
              </div>
              <div>
                <FieldLabel htmlFor="car-number">Համարանիշ</FieldLabel>
                <TextInput
                  id="car-number"
                  value={common.carNumber}
                  onChange={(e) => updateCommon("carNumber", e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {state?.ok === false ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {state.message}
          </p>
        ) : null}

        {state?.ok ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
            Ձեր տվյալները հաջողությամբ գրանցվել են։ Ժամանակը (Երևան)՝{" "}
            <span className="font-medium">{state.submittedAtLabel}</span>
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
    </section>
  );
}
