# TRYBY Sports — Razorpay Testing Guide

## Prerequisites

1. Razorpay **Test Mode** keys must be set in `.env.local`:
   ```
   RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
   RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXXXXXX
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
   ```
2. Ensure the database is seeded and an admin user exists.
3. Run `npm run dev` in the `store/` directory.

---

## Razorpay Test Cards

All test cards use **any future expiry date** and **any CVV**.

### Success Cards

| Network     | Card Number          | Notes                         |
|-------------|----------------------|-------------------------------|
| Visa        | `4111 1111 1111 1111`| Standard success              |
| Mastercard  | `5267 3181 8797 5449`| Standard success              |
| RuPay       | `6073 8490 6066 0005`| Standard success              |
| Visa        | `4012 0010 3714 2338`| With 3D Secure / OTP          |

### Failure Cards

| Card Number          | Behaviour                              |
|----------------------|----------------------------------------|
| `4000 0000 0000 0002`| Card declined                          |
| `4000 0000 0000 9995`| Insufficient funds                     |
| `4000 0000 0000 0069`| Card expired                           |
| `4000 0000 0000 0127`| Incorrect CVV                          |
| `4000 0020 0000 3155`| 3DS required — then decline after OTP  |

### 3D Secure OTP (Test Mode)
- OTP to **pass**: `1234` or `123456`
- OTP to **fail**: any other value

---

## UPI Testing

In Razorpay test mode, use these test UPI IDs:

| UPI ID                  | Behaviour            |
|-------------------------|----------------------|
| `success@razorpay`      | Instant success      |
| `failure@razorpay`      | Payment failure      |
| `pendingtxn@razorpay`   | Pending → auto-capture after 60s |
| Any other valid UPI ID  | Prompts payment flow |

---

## Net Banking Testing

Select any bank in the Razorpay modal. In test mode, you will be redirected to a mock bank page:
- Click **Success** → payment succeeds
- Click **Failure** → payment fails

---

## Wallet Testing

Wallets (Mobikwik, FreeCharge, etc.) work in test mode with mock flow. Approve or decline on the redirect page.

---

## Success Scenarios

### Scenario 1 — UPI Payment Success
1. Add a product to cart, proceed to Checkout
2. Fill address, select Standard Delivery, click **Continue to Payment**
3. On `/checkout/payment`, click **Pay via UPI / Card / Bank**
4. In Razorpay modal → UPI tab → enter `success@razorpay`
5. Click **Pay**

**Expected:**
- Redirected to `/order-success?order=ORD-XXXXX`
- Order status in DB: `CONFIRMED`
- Payment status in DB: `CAPTURED`
- `razorpayPaymentId` and `razorpaySignature` stored
- Order confirmation email sent
- Admin `/admin/payments` shows new `Success` entry

---

### Scenario 2 — Card Payment with 3DS
1. Add to cart → Checkout → Continue to Payment
2. Click **Pay via UPI / Card / Bank**
3. Select Card tab → enter `4012 0010 3714 2338`, any future date, any CVV
4. Enter OTP `1234`

**Expected:** Same as Scenario 1.

---

### Scenario 3 — Cash on Delivery
1. Add to cart → Checkout → Continue to Payment
2. Click **Cash on Delivery**

**Expected:**
- Redirected to `/order-success?order=ORD-XXXXX`
- Order status: `CONFIRMED`
- Payment status: `PENDING` (awaiting physical collection)
- Payment method stored as `COD`

---

### Scenario 4 — Duplicate Payment Prevention
1. Complete Scenario 1 above
2. Navigate back to `/checkout/payment?orderId=<same-orderId>`
3. Click Pay again

**Expected:**
- `create-order` returns the **existing** Razorpay order ID (no new order created in Razorpay)
- No duplicate charge

---

## Failure Scenarios

### Scenario 5 — Card Declined
1. Add to cart → Checkout → Continue to Payment
2. Click **Pay via UPI / Card / Bank**
3. Enter card `4000 0000 0000 0002`

**Expected:**
- Razorpay modal shows failure message
- `payment.failed` event fires on frontend
- `POST /api/payments/razorpay/failure` is called → Payment status in DB set to `FAILED` with failure reason
- Redirected to `/order-failed?orderId=<id>&order=ORD-XXXXX`
- Admin `/admin/payments` shows `Failed` entry with reason

---

### Scenario 6 — Payment Modal Dismissed
1. Open Razorpay modal
2. Click the **✕ close** button (do not pay)

**Expected:**
- `ondismiss` fires
- Stays on `/checkout/payment` page (no redirect)
- `paying` spinner resets
- Payment status remains `PENDING` in DB

---

### Scenario 7 — Network Error During Verify
1. Complete payment successfully in Razorpay modal
2. Before `handler` fires, disconnect network (DevTools → Offline)

**Expected:**
- Frontend shows network error
- Redirected to `/order-failed`
- Payment was **captured** by Razorpay but signature verify failed — check manually in Razorpay dashboard and update DB if needed

> ⚠️ **Note:** In production, add a Razorpay webhook (`payment.captured`) as a secondary confirmation layer to handle this edge case.

---

### Scenario 8 — Signature Tampering
1. Use browser DevTools to intercept the verify call
2. Modify `razorpaySignature` to an invalid string

**Expected:**
- `POST /api/payments/razorpay/verify` returns `400 Invalid signature`
- Redirected to `/order-failed`
- Payment status stays `PENDING` in DB (not elevated to `CAPTURED`)

---

### Scenario 9 — COD on Non-COD Order
1. Manually `POST /api/payments/cod-confirm` with an orderId that has `method: RAZORPAY_UPI`

**Expected:** `400 Not a COD order`

---

## Admin Dashboard Verification

After running each success/failure scenario, verify in `/admin/payments`:

| Check                              | Where                     |
|------------------------------------|---------------------------|
| Revenue card updates               | Summary card (top-left)   |
| Correct status badge               | Payment row               |
| Razorpay Payment ID stored         | Click row → Drawer        |
| Failure reason shown               | Drawer → Failure Reason   |
| Customer name and email correct    | Drawer → Customer section |
| Order items listed                 | Drawer → Items            |
| Pagination works at 20+ records    | Bottom of table           |
| Search by order number works       | Search box                |
| Search by payment ID works         | Search box                |
| Status filter (Success/Failed/...) | Tab bar                   |

---

## Launch Checklist

### Before switching to Live (Production) Mode

- [ ] Replace `rzp_test_*` keys with live keys from Razorpay Dashboard → Settings → API Keys
- [ ] Update `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID` in production environment (Vercel → Environment Variables)
- [ ] Enable **Razorpay Webhook** in dashboard → point to `https://www.tryby.in/api/payments/razorpay/webhook` (implement webhook handler for `payment.captured` and `payment.failed` events as a safety net)
- [ ] Test with a real ₹1 transaction end-to-end in live mode before launch
- [ ] Verify order confirmation emails are received in production
- [ ] Confirm refund flow works from Razorpay dashboard
- [ ] Check Admin `/admin/payments` shows live payment records
- [ ] Ensure `RAZORPAY_KEY_SECRET` is **never** exposed in client-side code or browser
- [ ] Verify SSL certificate is active on `www.tryby.in`
- [ ] Confirm `NEXT_PUBLIC_RAZORPAY_KEY_ID` starts with `rzp_live_` in production

### Payment Failure Safeguards

- [ ] Webhook handler implemented (separate from signature verify — handles cases where user closes browser mid-payment)
- [ ] Razorpay automatic retry is disabled (to avoid double charges)
- [ ] COD order limit set to ₹5,000 maximum (already enforced in FAQ/Terms — confirm in code)
- [ ] Refund process documented for support team

---

## Useful Razorpay Test Mode Links

- Dashboard: https://dashboard.razorpay.com (ensure Test Mode toggle is ON — orange banner at top)
- Test payment details: Dashboard → Transactions → Payments
- Razorpay test docs: https://razorpay.com/docs/payments/payments/test-card-details/
