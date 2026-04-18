"use server";

import { getMongoClientPromise } from "@/lib/mongodb";
import { getServerConfig } from "@/config/server";
import {
  rawSubmissionSchema,
  type PropertySubmissionDocument,
} from "@/lib/validation/propertyForm";

export type SubmitPropertyFormState =
  | { ok: true; submittedAtLabel: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

const initialError = (message: string): SubmitPropertyFormState => ({
  ok: false,
  message,
});

export async function submitPropertyForm(
  _prev: SubmitPropertyFormState | null,
  formData: FormData,
): Promise<SubmitPropertyFormState> {
  const rawPayload = formData.get("payload");
  if (typeof rawPayload !== "string") {
    return initialError("Չստացվեց կարդալ ուղարկված տվյալները։");
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawPayload);
  } catch {
    return initialError("Ուղարկված տվյալների ձևաչափը անվավեր է։");
  }

  const parsed = rawSubmissionSchema.safeParse(parsedJson);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const fieldErrors = flat.fieldErrors as Record<string, string[] | undefined>;
    const firstForm =
      flat.formErrors[0] ??
      Object.values(fieldErrors)
        .flat()
        .filter(Boolean)[0] ??
      "Ստուգեք լրացված դաշտերը։";
    return { ok: false, message: firstForm, fieldErrors: fieldErrors as Record<string, string[]> };
  }

  const data = parsed.data;
  const doc: PropertySubmissionDocument = {
    flags: data.flags,
    common: data.flags.notOwnerAnymore ? null : data.common!,
    newOwner: data.flags.notOwnerAnymore ? data.newOwner! : null,
    renter:
      !data.flags.notOwnerAnymore && data.flags.forRent && data.renter
        ? data.renter
        : null,
    submittedAt: new Date(),
  };

  try {
    const client = await getMongoClientPromise();
    const { mongodb } = getServerConfig();
    const coll = client.db(mongodb.dbName).collection(mongodb.collectionName);
    await coll.insertOne(doc);
  } catch (e) {
    console.error(e);
    return initialError(
      "Չհաջողվեց պահպանել տվյալները։ Ստուգեք MongoDB կապը (.env.local)։",
    );
  }

  const submittedAtLabel = doc.submittedAt.toLocaleString("hy-AM", {
    timeZone: "Asia/Yerevan",
    dateStyle: "medium",
    timeStyle: "short",
  });

  return { ok: true, submittedAtLabel };
}
