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

const optionalPhoneSlot = z
  .string()
  .trim()
  .pipe(z.union([z.literal(""), phoneItem]));

const optionalEmailSlot = z
  .string()
  .trim()
  .pipe(z.union([z.literal(""), emailItem]));

const fivePhoneKeys = ["phone1", "phone2", "phone3", "phone4", "phone5"] as const;
const fiveEmailKeys = ["email1", "email2", "email3", "email4", "email5"] as const;

function compactNonEmptyPhones(
  o: Record<(typeof fivePhoneKeys)[number], string>,
): string[] {
  return fivePhoneKeys.map((k) => o[k].trim()).filter((s) => s.length > 0);
}

function compactNonEmptyEmails(
  o: Record<(typeof fiveEmailKeys)[number], string>,
): string[] {
  return fiveEmailKeys.map((k) => o[k].trim()).filter((s) => s.length > 0);
}

export const commonFieldsSchema = z
  .object({
    propertyUniqueId: z.string().trim().min(1, "Լրացրեք գույքի նույնացուցիչը").max(200),
    ownerName: z.string().trim().min(1, "Լրացրեք սեփականատիրոջ անունը").max(200),
    phone1: optionalPhoneSlot,
    phone2: optionalPhoneSlot,
    phone3: optionalPhoneSlot,
    phone4: optionalPhoneSlot,
    phone5: optionalPhoneSlot,
    email1: optionalEmailSlot,
    email2: optionalEmailSlot,
    email3: optionalEmailSlot,
    email4: optionalEmailSlot,
    email5: optionalEmailSlot,
    carBrand: z.string().trim().max(100).optional().default(""),
    carModel: z.string().trim().max(100).optional().default(""),
    carColor: z.string().trim().max(100).optional().default(""),
    carNumber: z.string().trim().max(50).optional().default(""),
    car2Brand: z.string().trim().max(100).optional().default(""),
    car2Model: z.string().trim().max(100).optional().default(""),
    car2Color: z.string().trim().max(100).optional().default(""),
    car2Number: z.string().trim().max(50).optional().default(""),
  })
  .superRefine((data, ctx) => {
    const phones = compactNonEmptyPhones(data);
    if (phones.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Ավելացրեք առնվազն մեկ հեռախոսահամար",
        path: ["phone1"],
      });
    }

    const emails = compactNonEmptyEmails(data);
    if (emails.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Ավելացրեք առնվազն մեկ էլ. փոստ",
        path: ["email1"],
      });
    }

    const c1 = [
      (data.carBrand ?? "").trim(),
      (data.carModel ?? "").trim(),
      (data.carColor ?? "").trim(),
      (data.carNumber ?? "").trim(),
    ];
    const anyC1 = c1.some((s) => s.length > 0);
    if (anyC1) {
      if (!c1[0]) {
        ctx.addIssue({ code: "custom", message: "Լրացրեք մեքենայի մակնիշը", path: ["carBrand"] });
      }
      if (!c1[1]) {
        ctx.addIssue({ code: "custom", message: "Լրացրեք մեքենայի մոդելը", path: ["carModel"] });
      }
      if (!c1[2]) {
        ctx.addIssue({ code: "custom", message: "Լրացրեք մեքենայի գույնը", path: ["carColor"] });
      }
      if (!c1[3]) {
        ctx.addIssue({ code: "custom", message: "Լրացրեք մեքենայի համարանիշը", path: ["carNumber"] });
      }
    }

    const c2 = [
      (data.car2Brand ?? "").trim(),
      (data.car2Model ?? "").trim(),
      (data.car2Color ?? "").trim(),
      (data.car2Number ?? "").trim(),
    ];
    const anyC2 = c2.some((s) => s.length > 0);
    if (anyC2 && !anyC1) {
      ctx.addIssue({
        code: "custom",
        message: "Երկրորդ մեքենան թույլատրվում է միայն առաջին մեքենայի տվյալները լրացնելուց հետո",
        path: ["car2Brand"],
      });
    }
    if (anyC2) {
      if (!c2[0]) {
        ctx.addIssue({ code: "custom", message: "Լրացրեք երկրորդ մեքենայի մակնիշը", path: ["car2Brand"] });
      }
      if (!c2[1]) {
        ctx.addIssue({ code: "custom", message: "Լրացրեք երկրորդ մեքենայի մոդելը", path: ["car2Model"] });
      }
      if (!c2[2]) {
        ctx.addIssue({ code: "custom", message: "Լրացրեք երկրորդ մեքենայի գույնը", path: ["car2Color"] });
      }
      if (!c2[3]) {
        ctx.addIssue({ code: "custom", message: "Լրացրեք երկրորդ մեքենայի համարանիշը", path: ["car2Number"] });
      }
    }
  })
  .transform((data) => {
    const phones = compactNonEmptyPhones(data);
    const emails = compactNonEmptyEmails(data);
    const c2 = [
      (data.car2Brand ?? "").trim(),
      (data.car2Model ?? "").trim(),
      (data.car2Color ?? "").trim(),
      (data.car2Number ?? "").trim(),
    ];
    const hasSecondCar = c2.some((s) => s.length > 0);
    return {
      propertyUniqueId: data.propertyUniqueId.trim(),
      ownerName: data.ownerName.trim(),
      phone1: phones[0] ?? "",
      phone2: phones[1] ?? "",
      phone3: phones[2] ?? "",
      phone4: phones[3] ?? "",
      phone5: phones[4] ?? "",
      email1: emails[0] ?? "",
      email2: emails[1] ?? "",
      email3: emails[2] ?? "",
      email4: emails[3] ?? "",
      email5: emails[4] ?? "",
      carBrand: data.carBrand.trim(),
      carModel: data.carModel.trim(),
      carColor: data.carColor.trim(),
      carNumber: data.carNumber.trim(),
      car2Brand: hasSecondCar ? c2[0]! : "",
      car2Model: hasSecondCar ? c2[1]! : "",
      car2Color: hasSecondCar ? c2[2]! : "",
      car2Number: hasSecondCar ? c2[3]! : "",
    };
  });

export const newOwnerSchema = z.object({
  propertyUniqueId: z.string().trim().min(1, "Լրացրեք գույքի նույնացուցիչը").max(200),
  name: z.string().trim().max(200),
  phone1: z
    .string()
    .trim()
    .pipe(z.union([z.literal(""), phoneItem])),
});

export const renterSchema = z.object({
  name: z.string().trim().max(200),
  phone1: z
    .string()
    .trim()
    .pipe(z.union([z.literal(""), phoneItem])),
  email1: z
    .string()
    .trim()
    .pipe(z.union([z.literal(""), emailItem])),
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
      if (val.common && val.renter) {
        const ownerPhoneCount = compactNonEmptyPhones(val.common).length;
        const renterPhoneCount = val.renter.phone1.trim().length > 0 ? 1 : 0;
        if (ownerPhoneCount + renterPhoneCount > 5) {
          ctx.addIssue({
            code: "custom",
            message:
              "Վարձակալն ունի մեկ հեռախոս; սեփականատիրոջ հեռախոսների թիվը այս ռեժիմում առավելագույնը 4 է, որ ընդհանուրը լինի 5։",
            path: ["common", "phone1"],
          });
        }
        const ownerEmailCount = compactNonEmptyEmails(val.common).length;
        const renterEmailCount = val.renter.email1.trim().length > 0 ? 1 : 0;
        if (ownerEmailCount + renterEmailCount > 5) {
          ctx.addIssue({
            code: "custom",
            message:
              "Վարձակալն ունի մեկ էլ. փոստ; սեփականատիրոջ էլ. փոստերի թիվը այս ռեժիմում առավելագույնը 4 է, որ ընդհանուրը լինի 5։",
            path: ["common", "email1"],
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
