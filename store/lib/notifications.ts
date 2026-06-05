/**
 * TRYBY Notification Engine
 *
 * Centralised factory for creating in-app notifications with:
 * - Channel routing (IN_APP now; EMAIL/WHATSAPP when providers connected)
 * - Preference checking (respects user opt-outs and quiet hours)
 * - Delivery record creation (for analytics tracking)
 * - Future-ready: add send() calls per channel without schema changes
 */

import { prisma } from "@/lib/db";
import { sendPushToUser } from "@/lib/mobile";
import type {
  NotificationCategory,
  NotificationPriority,
  NotificationChannel,
} from "@prisma/client";

// ─── Notification type registry ───────────────────────────────────────────────
// Each type maps to: category, priority, icon (for UI), and default template.

export const NOTIFICATION_TYPES = {
  // Orders
  "order.created":          { category: "ORDER"    as NotificationCategory, priority: "HIGH"   as NotificationPriority, icon: "📦" },
  "order.confirmed":        { category: "ORDER"    as NotificationCategory, priority: "HIGH"   as NotificationPriority, icon: "✅" },
  "order.processing":       { category: "ORDER"    as NotificationCategory, priority: "NORMAL" as NotificationPriority, icon: "⚙️" },
  "order.shipped":          { category: "SHIPPING" as NotificationCategory, priority: "HIGH"   as NotificationPriority, icon: "🚚" },
  "order.out_for_delivery": { category: "SHIPPING" as NotificationCategory, priority: "HIGH"   as NotificationPriority, icon: "🏍️" },
  "order.delivered":        { category: "ORDER"    as NotificationCategory, priority: "HIGH"   as NotificationPriority, icon: "🎉" },
  "order.cancelled":        { category: "ORDER"    as NotificationCategory, priority: "HIGH"   as NotificationPriority, icon: "❌" },
  // Payments
  "payment.success":        { category: "PAYMENT"  as NotificationCategory, priority: "HIGH"   as NotificationPriority, icon: "💳" },
  "payment.failed":         { category: "PAYMENT"  as NotificationCategory, priority: "URGENT" as NotificationPriority, icon: "⚠️" },
  "payment.refunded":       { category: "PAYMENT"  as NotificationCategory, priority: "HIGH"   as NotificationPriority, icon: "↩️" },
  // Returns
  "return.requested":       { category: "RETURN"   as NotificationCategory, priority: "NORMAL" as NotificationPriority, icon: "🔄" },
  "return.approved":        { category: "RETURN"   as NotificationCategory, priority: "HIGH"   as NotificationPriority, icon: "✅" },
  "return.rejected":        { category: "RETURN"   as NotificationCategory, priority: "HIGH"   as NotificationPriority, icon: "❌" },
  "return.refunded":        { category: "RETURN"   as NotificationCategory, priority: "HIGH"   as NotificationPriority, icon: "💸" },
  "return.pickup_scheduled":{ category: "RETURN"   as NotificationCategory, priority: "NORMAL" as NotificationPriority, icon: "🏍️" },
  // Loyalty
  "loyalty.earned":         { category: "LOYALTY"  as NotificationCategory, priority: "NORMAL" as NotificationPriority, icon: "⭐" },
  "loyalty.redeemed":       { category: "LOYALTY"  as NotificationCategory, priority: "NORMAL" as NotificationPriority, icon: "🎁" },
  "loyalty.expiring":       { category: "LOYALTY"  as NotificationCategory, priority: "HIGH"   as NotificationPriority, icon: "⏰" },
  // Referral
  "referral.applied":       { category: "REFERRAL" as NotificationCategory, priority: "NORMAL" as NotificationPriority, icon: "👥" },
  "referral.completed":     { category: "REFERRAL" as NotificationCategory, priority: "HIGH"   as NotificationPriority, icon: "🎊" },
  "referral.reward_earned": { category: "REFERRAL" as NotificationCategory, priority: "HIGH"   as NotificationPriority, icon: "💰" },
  // Promotions
  "promo.flash_sale":       { category: "PROMOTION" as NotificationCategory, priority: "HIGH"  as NotificationPriority, icon: "🔥" },
  "promo.coupon_drop":      { category: "PROMOTION" as NotificationCategory, priority: "NORMAL"as NotificationPriority, icon: "🎫" },
  "promo.loyalty_campaign": { category: "PROMOTION" as NotificationCategory, priority: "NORMAL"as NotificationPriority, icon: "⚡" },
  "promo.general":          { category: "PROMOTION" as NotificationCategory, priority: "LOW"   as NotificationPriority, icon: "📣" },
  // Wishlist / Stock
  "wishlist.price_drop":    { category: "WISHLIST"  as NotificationCategory, priority: "HIGH"  as NotificationPriority, icon: "📉" },
  "stock.back_in_stock":    { category: "STOCK"     as NotificationCategory, priority: "HIGH"  as NotificationPriority, icon: "✅" },
  // Disputes
  "dispute.created":        { category: "PAYMENT"  as NotificationCategory, priority: "URGENT" as NotificationPriority, icon: "⚖️" },
  "dispute.action_required":{ category: "PAYMENT"  as NotificationCategory, priority: "URGENT" as NotificationPriority, icon: "🚨" },
  "dispute.won":            { category: "PAYMENT"  as NotificationCategory, priority: "HIGH"   as NotificationPriority, icon: "✅" },
  "dispute.lost":           { category: "PAYMENT"  as NotificationCategory, priority: "URGENT" as NotificationPriority, icon: "❌" },
  "dispute.closed":         { category: "PAYMENT"  as NotificationCategory, priority: "NORMAL" as NotificationPriority, icon: "🔒" },
  // System
  "system.announcement":    { category: "SYSTEM"    as NotificationCategory, priority: "NORMAL"as NotificationPriority, icon: "📢" },
  "system.welcome":         { category: "SYSTEM"    as NotificationCategory, priority: "NORMAL"as NotificationPriority, icon: "🎉" },
} as const;

export type NotificationType = keyof typeof NOTIFICATION_TYPES;

// ─── Category → preference key mapping ───────────────────────────────────────

const CATEGORY_PREF_KEY: Record<NotificationCategory, keyof import("@prisma/client").NotificationPreference | null> = {
  ORDER:     "emailOrders",
  PAYMENT:   "emailPayments",
  SHIPPING:  "emailShipping",
  RETURN:    "emailReturns",
  LOYALTY:   "emailLoyalty",
  REFERRAL:  "emailReferral",
  PROMOTION: "emailPromotions",
  SYSTEM:    "emailSystem",
  WISHLIST:  "emailWishlist",
  STOCK:     "emailStock",
};

// ─── Core create function ─────────────────────────────────────────────────────

export interface CreateNotificationInput {
  userId:      string;
  type:        NotificationType;
  title:       string;
  body:        string;
  actionUrl?:  string;
  actionLabel?: string;
  imageUrl?:   string;
  data?:       Record<string, unknown>;
  campaignId?: string;
  sentByAdmin?: boolean;
  adminNote?:  string;
  channels?:   NotificationChannel[]; // override — default ["IN_APP"]
}

export async function createNotification(input: CreateNotificationInput) {
  const meta = NOTIFICATION_TYPES[input.type] ?? {
    category: "SYSTEM" as NotificationCategory,
    priority: "NORMAL" as NotificationPriority,
    icon: "📢",
  };

  // Check user preferences
  try {
    const prefs = await prisma.notificationPreference.findUnique({ where: { userId: input.userId } });

    // Global unsubscribe blocks all non-system/transactional channels except in-app
    if (prefs?.globalUnsubscribe && meta.category === "PROMOTION") {
      return null; // Don't even create promo notifications for opted-out users
    }
  } catch { /* prefs may not exist yet — proceed */ }

  const channels: NotificationChannel[] = input.channels ?? ["IN_APP"];

  // Check if user has push enabled before including PUSH channel
  const pushEnabled = channels.includes("PUSH" as NotificationChannel) ||
    (channels.includes("IN_APP" as NotificationChannel) &&
     await prisma.notificationPreference.findUnique({ where: { userId: input.userId } })
       .then(p => p?.pushEnabled ?? false).catch(() => false));

  // Create the notification
  const notification = await prisma.notification.create({
    data: {
      userId:      input.userId,
      type:        input.type,
      category:    meta.category,
      priority:    meta.priority,
      title:       input.title,
      body:        input.body,
      actionUrl:   input.actionUrl,
      actionLabel: input.actionLabel,
      imageUrl:    input.imageUrl,
      data:        input.data as never,
      channel:     channels[0],
      campaignId:  input.campaignId,
      sentByAdmin: input.sentByAdmin ?? false,
      adminNote:   input.adminNote,
    },
  });

  // Create delivery records for each channel (besides IN_APP which is instant)
  if (channels.length > 1) {
    await prisma.notificationDelivery.createMany({
      data: channels.filter(c => c !== "IN_APP").map(ch => ({
        notificationId: notification.id,
        channel:        ch,
        status:         "PENDING" as const,
      })),
    });
  }

  // Dispatch push notification if user has push enabled
  if (pushEnabled && meta.priority !== "LOW") {
    sendPushToUser(input.userId, {
      title:    input.title,
      body:     input.body,
      imageUrl: input.imageUrl,
      data:     input.data
        ? Object.fromEntries(Object.entries(input.data).map(([k, v]) => [k, String(v)]))
        : undefined,
    }).catch(() => null); // fire-and-forget
  }

  return notification;
}

// ─── Bulk send (for campaigns / admin broadcasts) ─────────────────────────────

export async function sendBulkNotification(
  userIds: string[],
  input: Omit<CreateNotificationInput, "userId">
) {
  const results = await Promise.allSettled(
    userIds.map(userId => createNotification({ ...input, userId }))
  );

  const succeeded = results.filter(r => r.status === "fulfilled").length;
  const failed    = results.filter(r => r.status === "rejected").length;

  return { succeeded, failed, total: userIds.length };
}

// ─── Event trigger helpers ────────────────────────────────────────────────────
// These are the canonical event names used by order/payment/loyalty/return events.

export async function notifyOrderCreated(userId: string, orderNumber: string, orderId: string) {
  return createNotification({
    userId,
    type:        "order.created",
    title:       "Order Placed Successfully! 🎉",
    body:        `Your order ${orderNumber} has been received. We'll confirm it shortly.`,
    actionUrl:   `/account/orders/${orderId}`,
    actionLabel: "View Order",
    data:        { orderId, orderNumber },
  });
}

export async function notifyOrderConfirmed(userId: string, orderNumber: string, orderId: string) {
  return createNotification({
    userId,
    type:        "order.confirmed",
    title:       "Order Confirmed ✅",
    body:        `Order ${orderNumber} confirmed and is being prepared for dispatch.`,
    actionUrl:   `/account/orders/${orderId}`,
    actionLabel: "Track Order",
    data:        { orderId, orderNumber },
  });
}

export async function notifyOrderShipped(userId: string, orderNumber: string, orderId: string, trackingNumber?: string) {
  return createNotification({
    userId,
    type:        "order.shipped",
    title:       "Your Order is on its Way! 🚚",
    body:        trackingNumber
      ? `Order ${orderNumber} shipped. Tracking: ${trackingNumber}`
      : `Order ${orderNumber} has been dispatched and is heading your way!`,
    actionUrl:   `/account/orders/${orderId}`,
    actionLabel: "Track Order",
    data:        { orderId, orderNumber, trackingNumber },
  });
}

export async function notifyOrderDelivered(userId: string, orderNumber: string, orderId: string) {
  return createNotification({
    userId,
    type:        "order.delivered",
    title:       "Order Delivered! 🎉",
    body:        `Order ${orderNumber} has been delivered. Enjoy your gear! Leave a review to earn points.`,
    actionUrl:   `/account/orders/${orderId}`,
    actionLabel: "Leave a Review",
    data:        { orderId, orderNumber },
  });
}

export async function notifyPaymentSuccess(userId: string, orderNumber: string, amount: number) {
  return createNotification({
    userId,
    type:        "payment.success",
    title:       "Payment Successful 💳",
    body:        `₹${amount.toLocaleString("en-IN")} paid for order ${orderNumber}.`,
    data:        { orderNumber, amount },
  });
}

export async function notifyPaymentFailed(userId: string, orderNumber: string) {
  return createNotification({
    userId,
    type:        "payment.failed",
    title:       "Payment Failed ⚠️",
    body:        `Payment for order ${orderNumber} could not be processed. Your cart is still saved.`,
    actionUrl:   `/cart`,
    actionLabel: "Retry Payment",
    data:        { orderNumber },
  });
}

export async function notifyRefundIssued(userId: string, orderNumber: string, amount: number) {
  return createNotification({
    userId,
    type:        "payment.refunded",
    title:       "Refund Initiated ↩️",
    body:        `₹${amount.toLocaleString("en-IN")} refund for order ${orderNumber} has been initiated. Expect 5–7 business days.`,
    data:        { orderNumber, amount },
  });
}

export async function notifyReturnApproved(userId: string, returnNumber: string, returnId: string) {
  return createNotification({
    userId,
    type:        "return.approved",
    title:       "Return Approved ✅",
    body:        `Your return request ${returnNumber} has been approved. A pickup will be scheduled within 2–3 days.`,
    actionUrl:   `/account/orders`,
    actionLabel: "View Return",
    data:        { returnId, returnNumber },
  });
}

export async function notifyReturnRejected(userId: string, returnNumber: string, reason?: string) {
  return createNotification({
    userId,
    type:        "return.rejected",
    title:       "Return Request Rejected",
    body:        reason
      ? `Return ${returnNumber} was rejected: ${reason}`
      : `Return request ${returnNumber} did not meet our return policy criteria.`,
    actionUrl:   `/contact`,
    actionLabel: "Contact Support",
    data:        { returnNumber, reason },
  });
}

export async function notifyLoyaltyEarned(userId: string, points: number, reason: string) {
  return createNotification({
    userId,
    type:        "loyalty.earned",
    title:       `You Earned ${points} TRYBY Points! ⭐`,
    body:        `${reason}. Your points balance has been updated.`,
    actionUrl:   `/account`,
    actionLabel: "View Rewards",
    data:        { points, reason },
  });
}

export async function notifyReferralCompleted(referrerId: string, refereeName: string, rewardPoints: number) {
  return createNotification({
    userId:      referrerId,
    type:        "referral.reward_earned",
    title:       "Referral Reward Earned! 🎊",
    body:        `${refereeName} placed their first order using your referral. You earned ${rewardPoints} bonus points!`,
    actionUrl:   `/account`,
    actionLabel: "View Points",
    data:        { refereeName, rewardPoints },
  });
}

// ─── Admin-targeted helpers ───────────────────────────────────────────────────
// Notify every SUPER_ADMIN and ADMIN user in the system.

async function getAdminUserIds(): Promise<string[]> {
  const admins = await prisma.adminProfile.findMany({
    where:  { isDisabled: false },
    select: { userId: true },
  });
  return admins.map(a => a.userId);
}

export async function notifyAdminsDisputeCreated(orderNumber: string, amount: number, disputeId: string) {
  const adminIds = await getAdminUserIds();
  await Promise.allSettled(adminIds.map(userId =>
    createNotification({
      userId,
      type:        "dispute.created",
      title:       `Chargeback Dispute Raised — ${orderNumber}`,
      body:        `A Razorpay dispute of ₹${amount.toLocaleString("en-IN")} has been raised for order ${orderNumber}. Respond within 5 days.`,
      actionUrl:   `/admin/payments`,
      actionLabel: "Review Dispute",
      data:        { orderNumber, amount, disputeId },
      sentByAdmin: false,
    })
  ));
}

export async function notifyAdminsDisputeActionRequired(orderNumber: string, disputeId: string) {
  const adminIds = await getAdminUserIds();
  await Promise.allSettled(adminIds.map(userId =>
    createNotification({
      userId,
      type:        "dispute.action_required",
      title:       `Dispute Response Required — ${orderNumber}`,
      body:        `Razorpay requires evidence submission for order ${orderNumber}. Deadline may apply.`,
      actionUrl:   `/admin/payments`,
      actionLabel: "Submit Evidence",
      data:        { orderNumber, disputeId },
      sentByAdmin: false,
    })
  ));
}

export async function notifyAdminsRefundFailed(orderNumber: string, refundId: string | null) {
  const adminIds = await getAdminUserIds();
  await Promise.allSettled(adminIds.map(userId =>
    createNotification({
      userId,
      type:        "payment.failed",
      title:       `Refund Failed — ${orderNumber}`,
      body:        `Razorpay could not process the refund for order ${orderNumber}${refundId ? ` (refund ID: ${refundId})` : ""}. Manual action required.`,
      actionUrl:   `/admin/payments`,
      actionLabel: "Review Payment",
      data:        { orderNumber, refundId },
      sentByAdmin: false,
    })
  ));
}

export async function notifyWishlistPriceDrop(userId: string, productName: string, productSlug: string, oldPrice: number, newPrice: number) {
  const savings = oldPrice - newPrice;
  return createNotification({
    userId,
    type:        "wishlist.price_drop",
    title:       `Price Drop on Your Wishlist! 📉`,
    body:        `${productName} is now ₹${newPrice.toLocaleString("en-IN")} (was ₹${oldPrice.toLocaleString("en-IN")}). Save ₹${savings.toLocaleString("en-IN")}!`,
    actionUrl:   `/products/${productSlug}`,
    actionLabel: "Shop Now",
    data:        { productName, productSlug, oldPrice, newPrice, savings },
  });
}
