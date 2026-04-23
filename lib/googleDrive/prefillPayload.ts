/**
 * Drive CSV-ից prefill-ի JSON ձևաչափ (սերվեր + քլիենտ)։
 *
 * CSV գլխագրեր (snake_case, case-insensitive after normalize):
 * property_unique_id, owner_name,
 * phone_1 … phone_5, email_1 … email_5,
 * car_brand, car_model, car_color, car_number,
 * car2_brand, car2_model, car2_color, car2_number,
 * submission_mode = owner | not_owner | for_rent,
 * new_owner_name, new_owner_phone,
 * renter_name, renter_phone, renter_email
 */

export type PrefillCommonPayload = {
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

export type PrefillNewOwnerPayload = {
  name: string;
  phone1: string;
};

export type PrefillRenterPayload = {
  name: string;
  phone1: string;
  email1: string;
};

export type PrefillFormPayload = {
  notOwnerAnymore: boolean;
  forRent: boolean;
  hasSecondCar: boolean;
  common: PrefillCommonPayload;
  newOwner: PrefillNewOwnerPayload;
  renter: PrefillRenterPayload;
};

export type PrefillApiSuccess = { ok: true; data: PrefillFormPayload };
export type PrefillApiFailure = { ok: false; skipped?: boolean; message: string };
export type PrefillApiResponse = PrefillApiSuccess | PrefillApiFailure;
