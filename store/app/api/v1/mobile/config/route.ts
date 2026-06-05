import { NextResponse } from "next/server";

// GET — App configuration / feature flags for mobile client.
// Called on app launch to configure feature gating, min app version, etc.
export async function GET() {
  const minAndroidVersion = process.env.MIN_ANDROID_VERSION ?? "1.0.0";
  const minIosVersion     = process.env.MIN_IOS_VERSION     ?? "1.0.0";
  const forceUpdateBelow  = process.env.FORCE_UPDATE_BELOW   ?? null;

  return NextResponse.json({
    api: {
      version:     "v1",
      baseUrl:     process.env.NEXT_PUBLIC_STORE_URL ?? "",
    },
    maintenance: {
      enabled: false,
      message: null,
    },
    versions: {
      minAndroid:   minAndroidVersion,
      minIos:       minIosVersion,
      forceUpdateBelow,
    },
    features: {
      biometricLogin:   true,
      guestCheckout:    false,
      codPayment:       true,
      upiPayment:       true,
      razorpay:         true,
      loyaltyPoints:    true,
      referralProgram:  true,
      reviewsWithMedia: true,
      returnRequests:   true,
      wishlist:         true,
      pushNotifications: true,
    },
    shipping: {
      freeAbove:     499,
      standardFee:   49,
      currency:      "INR",
    },
    support: {
      email:    "support@tryby.in",
      whatsapp: null,
    },
  }, {
    headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=60" },
  });
}
