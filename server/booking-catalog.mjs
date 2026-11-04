import { BRAZILIAN_EARLIEST_START_MINUTES, BRAZILIAN_SERVICE_ID, DAYTIME_CATEGORY_ID, VIP_CATEGORY_ID, VIP_STAFF_IDS } from '../src/lib/booking-policy.mjs';

export class CatalogError extends Error {
  constructor(message, status = 503) { super(message); this.status = status; }
}

export function atLocation(object, locationId) {
  return !!object && !object.is_deleted && !object.absent_at_location_ids?.includes(locationId) && (object.present_at_all_locations !== false || object.present_at_location_ids?.includes(locationId));
}

export function serviceCategoryId(item) {
  if (item?.item_data?.product_type !== 'APPOINTMENTS_SERVICE') return null;
  const categories = [DAYTIME_CATEGORY_ID, VIP_CATEGORY_ID].filter(id => item.item_data.categories?.some(category => category.id === id) || item.item_data.category_id === id);
  // A service in both time categories is ambiguous: do not guess which rule to use.
  return categories.length === 1 ? categories[0] : null;
}

export function serviceFromCatalog(variation, parent, team, locationId) {
  const details = variation?.item_variation_data;
  const categoryId = serviceCategoryId(parent);
  if (!atLocation(variation, locationId) || !atLocation(parent, locationId) || !categoryId || !details?.available_for_booking || !Number.isSafeInteger(details.service_duration) || details.service_duration <= 0 || details.service_duration % 60000) throw new CatalogError('This service is currently unavailable for online booking.', 400);
  const override = details.location_overrides?.find(value => value.location_id === locationId);
  const pricingType = override?.pricing_type ?? details.pricing_type;
  const base = override?.price_money ?? details.price_money;
  if (pricingType !== 'FIXED_PRICING' || base?.currency !== 'GBP' || !Number.isSafeInteger(base.amount) || base.amount < 0) throw new CatalogError('Square has no fixed price for this service. Please contact the shop.');

  // Square's numeric price is authoritative. Text is display-only: never parse
  // a currency amount or percentage from a description to change the price.
  const price = base.amount;
  const priceDescription = details.price_description || '';
  const staff = team.filter(member => member.is_bookable && details.team_member_ids?.includes(member.team_member_id) && (categoryId !== VIP_CATEGORY_ID || VIP_STAFF_IDS.includes(member.team_member_id))).map(member => ({ id: member.team_member_id, name: member.display_name }));
  return {
    id: variation.id, categoryId, name: parent.item_data.name,
    description: parent.item_data.description_plaintext || parent.item_data.description || '',
    durationMinutes: details.service_duration / 60000, price, basePrice: base.amount,
    currency: base.currency, priceDescription, priceSource: 'SQUARE_PRICE_MONEY',
    earliestStartMinutes: categoryId === DAYTIME_CATEGORY_ID && variation.id === BRAZILIAN_SERVICE_ID ? BRAZILIAN_EARLIEST_START_MINUTES : 0,
    taxIds: parent.item_data.tax_ids || [],
    totals: parent.item_data.tax_ids?.length ? null : { subtotal: price, tax: 0, total: price, dueToday: 0, dueAtAppointment: price },
    staff,
  };
}
