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

  // Square's booking page displays price_description instead of price_money when set.
  // The shop explicitly uses its single GBP amount as the quoted booking price.
  // Never infer a percentage, select from several amounts or silently charge the base.
  const priceDescription = (details.price_description || '').trim();
  let price = base.amount;
  if (priceDescription) {
    const amounts = [...priceDescription.matchAll(/£\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)(?![\d.,])/g)];
    if (amounts.length !== 1 || /\b(from|starting|between|up\s+to|per|deposit)\b|\d\s*[-–]\s*£|£[^£]*[-–]\s*\d/i.test(priceDescription)) throw new CatalogError('The Square booking price needs clarification. Please contact the shop.');
    const [pounds, pennies = ''] = amounts[0][1].replaceAll(',', '').split('.');
    price = Number(pounds) * 100 + Number(pennies.padEnd(2, '0'));
    if (!Number.isSafeInteger(price) || price < 0) throw new CatalogError('The Square booking price could not be verified. Please contact the shop.');
  }
  const staff = team.filter(member => member.is_bookable && details.team_member_ids?.includes(member.team_member_id) && (categoryId !== VIP_CATEGORY_ID || VIP_STAFF_IDS.includes(member.team_member_id))).map(member => ({ id: member.team_member_id, name: member.display_name }));
  return {
    id: variation.id, categoryId, name: parent.item_data.name,
    description: parent.item_data.description_plaintext || parent.item_data.description || '',
    durationMinutes: details.service_duration / 60000, price, basePrice: base.amount,
    currency: base.currency, priceDescription, priceSource: priceDescription ? 'SQUARE_PRICE_DESCRIPTION' : 'SQUARE_PRICE_MONEY',
    earliestStartMinutes: categoryId === DAYTIME_CATEGORY_ID && variation.id === BRAZILIAN_SERVICE_ID ? BRAZILIAN_EARLIEST_START_MINUTES : 0,
    taxIds: parent.item_data.tax_ids || [],
    totals: parent.item_data.tax_ids?.length ? null : { subtotal: price, tax: 0, total: price, dueToday: 0, dueAtAppointment: price },
    staff,
  };
}
