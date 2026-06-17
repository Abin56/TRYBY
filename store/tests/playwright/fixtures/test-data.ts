/**
 * Static test data used across specs. Pincodes/coupons here must match what
 * prisma/seed-test.ts and the shipping config expect on the QA environment.
 */

export const PINCODES = {
  serviceable: "560001",      // Bangalore — serviceable + COD-eligible
  codBlocked: "190001",       // remote — expected COD-blocked / prepaid only
  nonServiceable: "000000",   // invalid — expected non-serviceable
};

export const COUPONS = {
  percentage: "TEST10",       // 10% off (seed-test)
  flat: "FLAT100",            // ₹100 off
  freeShipping: "FREESHIP",   // free shipping
  expired: "EXPIRED",         // expired → must be rejected
  usageCapped: "ONEUSE",      // usage cap reached → must be rejected
};

// Razorpay TEST-MODE values (only valid when RAZORPAY keys are test keys).
export const RAZORPAY_TEST = {
  successCard: "4111 1111 1111 1111",
  cvv: "123",
  // Razorpay test checkout uses a "success"/"failure" choice on the test page
  // rather than a real bank OTP.
};

export const RETURN_WINDOW_DAYS = 7;
