export async function policyFromProfile(profile) {
  const settings = profile?.business_appointment_settings || {};
  const fee = settings.cancellation_fee_money;
  const policy = {
    allowUserCancel: profile?.allow_user_cancel === true,
    windowSeconds: Number.isSafeInteger(settings.cancellation_window_seconds) && settings.cancellation_window_seconds >= 0 ? settings.cancellation_window_seconds : null,
    text: typeof settings.cancellation_policy_text === 'string' ? settings.cancellation_policy_text.slice(0, 8000) : '',
    type: settings.cancellation_policy || null,
    noShowFee: fee?.currency === 'GBP' && Number.isSafeInteger(fee.amount) && fee.amount >= 0 ? fee.amount : null,
  };
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(policy)));
  return { ...policy, version: [...new Uint8Array(hash)].map(value => value.toString(16).padStart(2, '0')).join('') };
}

export async function serviceTotals(service, square, locationId) {
  if (!service.taxIds?.length) return service;
  // CalculateOrder is read-only: no order, payment or customer record is created.
  const result = await square('/v2/orders/calculate', { order: { location_id: locationId, line_items: [{ quantity: '1', catalog_object_id: service.id, base_price_money: { amount: service.price, currency: service.currency } }], pricing_options: { auto_apply_taxes: true, auto_apply_discounts: false } } });
  const total = result.order?.total_money;
  const tax = result.order?.total_tax_money;
  if (total?.currency !== 'GBP' || tax?.currency !== 'GBP' || !Number.isSafeInteger(total.amount) || !Number.isSafeInteger(tax.amount) || total.amount < 0 || tax.amount < 0 || tax.amount > total.amount) throw new Error('Square totals unavailable');
  return { ...service, price: total.amount, totals: { subtotal: total.amount - tax.amount, tax: tax.amount, total: total.amount, dueToday: 0, dueAtAppointment: total.amount } };
}
