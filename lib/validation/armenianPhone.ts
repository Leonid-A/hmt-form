import { parsePhoneNumberFromString } from "libphonenumber-js";

/**
 * Հայաստանի (+374) հեռախոսահամարների ստուգում՝ ITU մետատվյալներով
 * (բջջային, Երևանի և մարզային քաղաքային ձևաչափեր, 0… և +374…)։
 */
export function isValidArmenianPhone(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;

  const parsed = parsePhoneNumberFromString(trimmed, "AM");
  if (!parsed) return false;

  return parsed.isValid() && parsed.country === "AM";
}
