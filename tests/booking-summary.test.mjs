import test from 'node:test';
import assert from 'node:assert/strict';
import { policyFromProfile, serviceTotals } from '../server/booking-summary.mjs';

test('Square policy fields are projected without inventing missing custom terms',async()=>{
 const profile={allow_user_cancel:true,business_appointment_settings:{cancellation_window_seconds:10800,cancellation_policy:'CUSTOM_POLICY',cancellation_fee_money:{amount:2000,currency:'GBP'}}};
 const a=await policyFromProfile(profile), b=await policyFromProfile(profile);
 assert.equal(a.windowSeconds,10800);assert.equal(a.noShowFee,2000);assert.equal(a.text,'');assert.equal(a.version,b.version);
 profile.business_appointment_settings.cancellation_window_seconds=7200;
 assert.notEqual((await policyFromProfile(profile)).version,a.version);
});

test('taxed service totals come from Square CalculateOrder without creating an order or charging',async()=>{
 const calls=[];
 const service={id:'service',price:3700,currency:'GBP',taxIds:['tax']};
 const result=await serviceTotals(service,async(path,body)=>{calls.push({path,body});return{order:{total_money:{amount:4440,currency:'GBP'},total_tax_money:{amount:740,currency:'GBP'}}};},'shop');
 assert.equal(calls[0].path,'/v2/orders/calculate');
 assert.equal(calls[0].body.order.line_items[0].base_price_money.amount,3700);
 assert.deepEqual(calls[0].body.order.pricing_options,{auto_apply_taxes:true,auto_apply_discounts:false});
 assert.deepEqual(result.totals,{subtotal:3700,tax:740,total:4440,dueToday:0,dueAtAppointment:4440});
 assert.equal(result.price,4440);
});

test('missing or invalid Square tax calculation never falls back to a guessed total',async()=>{
 await assert.rejects(serviceTotals({id:'service',taxIds:['tax'],price:1000,currency:'GBP'},async()=>({order:{}}),'shop'),/totals unavailable/);
 const service={price:1000,taxIds:[],totals:{subtotal:1000,tax:0,total:1000,dueToday:0,dueAtAppointment:1000}};
 assert.equal(await serviceTotals(service,()=>{throw Error('should not call Square')},'shop'),service);
});
