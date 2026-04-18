import { z } from "zod";

import { isValidArmenianPhone } from "@/lib/validation/armenianPhone";

const phoneItem = z
  .string()
  .trim()
  .min(5, "Հեռախոսը շատ կարճ է")
  .max(32)
  .regex(/^[0-9+\s()-]+$/, "Թույլատրվում են միայն թվեր, +, բացատ, -, ()")
  .refine(isValidArmenianPhone, "Մուտքագրեք վավեր հայկական հեռախոսահամար (+374 կամ 0…)");

const emailItem = z.string().trim().email("Անվավեր էլ. փոստ");

function contactList(item: z.ZodString, minMsg: string) {
  return z
    .array(z.string())
    .max(5)
    .transform((arr) => arr.map((s) => s.trim()).filter((s) => s.length > 0))
    .pipe(z.array(item).min(1, minMsg).max(5));
}

/** Նոր սեփականատիրոջ համար՝ միայն մեկ հեռախոս և մեկ էլ. փոստ */
function singleContact(item: z.ZodString, requiredMsg: string) {
  return z
    .array(z.string())
    .max(1, "Թույլատրվում է միայն մեկ մուտք")
    .transform((arr) => arr.map((s) => s.trim()).filter((s) => s.length > 0))
    .pipe(z.array(item).length(1, requiredMsg));
}

export const commonFieldsSchema = z.object({
  propertyUniqueId: z.string().trim().min(1, "Լրացրեք գույքի նույնացուցիչը").max(200),
  ownerName: z.string().trim().min(1, "Լրացրեք սեփականատիրոջ անունը").max(200),
  phones: contactList(phoneItem, "Ավելացրեք առնվազն մեկ հեռախոսահամար"),
  emails: contactList(emailItem, "Ավելացրեք առնվազն մեկ էլ. փոստ"),
  carBrand: z.string().trim().min(1, "Լրացրեք մակնիշը").max(100),
  carModel: z.string().trim().min(1, "Լրացրեք մոդելը").max(100),
  carColor: z.string().trim().min(1, "Լրացրեք գույնը").max(100),
  carNumber: z.string().trim().min(1, "Լրացրեք համարանիշը").max(50),
});

export const newOwnerSchema = z.object({
  name: z.string().trim().min(1, "Լրացրեք նոր սեփականատիրոջ անունը").max(200),
  phones: singleContact(phoneItem, "Լրացրեք նոր սեփականատիրոջ հեռախոսահամարը"),
  emails: singleContact(emailItem, "Լրացրեք նոր սեփականատիրոջ էլ. փոստը"),
});

export const renterSchema = z.object({
  name: z.string().trim().min(1, "Լրացրեք վարձակալի անունը").max(200),
  phones: singleContact(phoneItem, "Լրացրեք վարձակալի հեռախոսահամարը"),
  emails: singleContact(emailItem, "Լրացրեք վարձակալի էլ. փոստը"),
});

const flagsSchema = z.object({
  notOwnerAnymore: z.boolean(),
  forRent: z.boolean(),
});

export const rawSubmissionSchema = z
  .object({
    flags: flagsSchema,
    common: commonFieldsSchema.nullable(),
    newOwner: newOwnerSchema.nullable(),
    renter: renterSchema.nullable(),
  })
  .superRefine((val, ctx) => {
    const { notOwnerAnymore, forRent } = val.flags;

    if (notOwnerAnymore && forRent) {
      ctx.addIssue({
        code: "custom",
        message: "Անջատիչները չեն կարող միաժամանակ միացված լինել",
        path: ["flags"],
      });
    }

    if (notOwnerAnymore) {
      if (!val.newOwner) {
        ctx.addIssue({
          code: "custom",
          message: "Լրացրեք նոր սեփականատիրոջ տվյալները",
          path: ["newOwner"],
        });
      }
      if (val.common) {
        ctx.addIssue({
          code: "custom",
          message: "Այս ռեժիմում ընդհանուր դաշտերը չպետք է ուղարկվեն",
          path: ["common"],
        });
      }
      if (val.renter) {
        ctx.addIssue({
          code: "custom",
          message: "Այս ռեժիմում վարձակալի դաշտերը չպետք է ուղարկվեն",
          path: ["renter"],
        });
      }
      return;
    }

    if (!val.common) {
      ctx.addIssue({
        code: "custom",
        message: "Լրացրեք ընդհանուր դաշտերը",
        path: ["common"],
      });
    }

    if (val.newOwner) {
      ctx.addIssue({
        code: "custom",
        message: "Նոր սեփականատիրոջ դաշտերը թույլատրվում են միայն համապատասխան անջատիչով",
        path: ["newOwner"],
      });
    }

    if (forRent) {
      if (!val.renter) {
        ctx.addIssue({
          code: "custom",
          message: "Լրացրեք վարձակալի տվյալները",
          path: ["renter"],
        });
      } else if (val.common) {
        const phoneTotal = val.common.phones.length + val.renter.phones.length;
        if (phoneTotal > 5) {
          ctx.addIssue({
            code: "custom",
            message:
              "Վարձակալն ունի մեկ հեռախոս; սեփականատիրոջ հեռախոսների թիվը այս ռեժիմում առավելագույնը 4 է, որ ընդհանուրը լինի 5։",
            path: ["common", "phones"],
          });
        }
        const emailTotal = val.common.emails.length + val.renter.emails.length;
        if (emailTotal > 5) {
          ctx.addIssue({
            code: "custom",
            message:
              "Վարձակալն ունի մեկ էլ. փոստ; սեփականատիրոջ էլ. փոստերի թիվը այս ռեժիմում առավելագույնը 4 է, որ ընդհանուրը լինի 5։",
            path: ["common", "emails"],
          });
        }
      }
    } else if (val.renter) {
      ctx.addIssue({
        code: "custom",
        message: "Վարձակալի բլոկը չպետք է լինի, երբ անջատիչը անջատված է",
        path: ["renter"],
      });
    }
  });

export type CommonFields = z.infer<typeof commonFieldsSchema>;
export type NewOwnerFields = z.infer<typeof newOwnerSchema>;
export type RenterFields = z.infer<typeof renterSchema>;
export type SubmissionFlags = z.infer<typeof flagsSchema>;

export type PropertySubmissionDocument = {
  flags: SubmissionFlags;
  common: CommonFields | null;
  newOwner: NewOwnerFields | null;
  renter: RenterFields | null;
  submittedAt: Date;
};
