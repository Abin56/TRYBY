// ============================================================
// PHASE 3 MOCK DATA — Inventory, Returns, Support, Marketing,
//                      Suppliers, Profit
// ============================================================

import { products } from "./mock";

// ─── Types ───────────────────────────────────────────────────

export type MovementType = "restock" | "sale" | "return" | "adjustment" | "damage";
export type ReturnStatus = "requested" | "approved" | "received" | "refunded" | "rejected";
export type ReturnReason = "damaged" | "wrong_item" | "not_as_described" | "changed_mind" | "defective" | "other";
export type TicketStatus  = "open" | "in_progress" | "waiting" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type CampaignStatus = "draft" | "scheduled" | "active" | "paused" | "completed";
export type SupplierStatus = "active" | "inactive" | "on_hold";

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  type: MovementType;
  quantity: number;         // positive = in, negative = out
  balanceBefore: number;
  balanceAfter: number;
  note?: string;
  orderId?: string;
  supplierId?: string;
  createdAt: string;
  createdBy: string;
}

export interface ReturnRequest {
  id: string;
  returnNumber: string;
  orderId: string;
  orderNumber: string;
  status: ReturnStatus;
  reason: ReturnReason;
  reasonNote?: string;
  refundAmount: number;
  refundMethod: "original" | "store_credit" | "bank";
  refundStatus: "pending" | "processing" | "completed" | "failed";
  customer: { id: string; name: string; email: string; avatar: string };
  items: { productId: string; name: string; image: string; price: number; quantity: number }[];
  images: string[];
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  body: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: "order" | "product" | "payment" | "delivery" | "return" | "other";
  customer: { id: string; name: string; email: string; avatar: string };
  orderId?: string;
  orderNumber?: string;
  messages: { from: "customer" | "agent"; body: string; createdAt: string }[];
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  firstResponseAt?: string;
  resolvedAt?: string;
  satisfactionScore?: 1 | 2 | 3 | 4 | 5;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  views: number;
  helpful: number;
  isPublished: boolean;
  sortOrder: number;
}

export interface Campaign {
  id: string;
  name: string;
  type: "email" | "push" | "banner" | "discount";
  status: CampaignStatus;
  subject?: string;
  body?: string;
  targetSegment: "all" | "new" | "vip" | "inactive" | "cart_abandoned";
  scheduledAt?: string;
  sentAt?: string;
  recipients: number;
  opens?: number;
  clicks?: number;
  conversions?: number;
  revenue?: number;
  discountCode?: string;
  bannerText?: string;
  bannerColor?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  country: string;
  status: SupplierStatus;
  reliabilityScore: number;   // 0–100
  avgShippingDays: number;
  totalProducts: number;
  totalOrders: number;
  totalPurchaseValue: number;
  onTimeDeliveryRate: number; // %
  defectRate: number;         // %
  paymentTerms: string;
  currency: string;
  notes?: string;
  joinedDate: string;
  lastOrderDate: string;
  productIds: string[];
  tags: string[];
}

// ─── Stock Movements ─────────────────────────────────────────

export const stockMovements: StockMovement[] = [
  { id:"sm1",  productId:"p1",  productName:"Magnetic Cable Organizer",  productImage:"https://images.unsplash.com/photo-1583394838336-acd977736f90?w=60&h=60&fit=crop",  type:"restock",    quantity:200,  balanceBefore:84,  balanceAfter:284, note:"Received from Supplier A",          supplierId:"sup1", createdAt:"2025-05-30T09:00:00Z", createdBy:"Admin" },
  { id:"sm2",  productId:"p6",  productName:"Electric Milk Frother",     productImage:"https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=60&h=60&fit=crop",  type:"sale",       quantity:-12,  balanceBefore:15,  balanceAfter:3,   note:"Orders #00840–00851",              orderId:"batch",   createdAt:"2025-05-30T08:30:00Z", createdBy:"System" },
  { id:"sm3",  productId:"p4",  productName:"Travel Compression Bags",   productImage:"https://images.unsplash.com/photo-1553531384-411a247ccd73?w=60&h=60&fit=crop",     type:"sale",       quantity:-4,   balanceBefore:12,  balanceAfter:8,   note:"Orders #00842–00845",              orderId:"batch",   createdAt:"2025-05-29T18:00:00Z", createdBy:"System" },
  { id:"sm4",  productId:"p9",  productName:"Mini Portable Blender",     productImage:"https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=60&h=60&fit=crop",  type:"damage",     quantity:-5,   balanceBefore:5,   balanceAfter:0,   note:"Damaged during transit",                              createdAt:"2025-05-29T14:00:00Z", createdBy:"Admin" },
  { id:"sm5",  productId:"p3",  productName:"Smart Posture Corrector",   productImage:"https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=60&h=60&fit=crop",  type:"return",     quantity:1,    balanceBefore:66,  balanceAfter:67,  note:"Return RET-2025-00312",            orderId:"o6",      createdAt:"2025-05-29T11:00:00Z", createdBy:"System" },
  { id:"sm6",  productId:"p2",  productName:"Portable LED Desk Lamp",    productImage:"https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=60&h=60&fit=crop",  type:"restock",    quantity:100,  balanceBefore:42,  balanceAfter:142, note:"Received from Supplier B",         supplierId:"sup2", createdAt:"2025-05-28T10:00:00Z", createdBy:"Admin" },
  { id:"sm7",  productId:"p10", productName:"Sunset Lamp Projector",     productImage:"https://images.unsplash.com/photo-1578898887932-dce23a595ad4?w=60&h=60&fit=crop",  type:"adjustment", quantity:-6,   balanceBefore:50,  balanceAfter:44,  note:"Inventory count discrepancy",                         createdAt:"2025-05-28T09:00:00Z", createdBy:"Admin" },
  { id:"sm8",  productId:"p12", productName:"Silicone Food Covers",      productImage:"https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=60&h=60&fit=crop",     type:"restock",    quantity:300,  balanceBefore:212, balanceAfter:512, note:"Bulk order from Supplier C",       supplierId:"sup3", createdAt:"2025-05-27T08:00:00Z", createdBy:"Admin" },
  { id:"sm9",  productId:"p7",  productName:"Noise-Cancelling Earplugs", productImage:"https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=60&h=60&fit=crop",  type:"sale",       quantity:-8,   balanceBefore:164, balanceAfter:156, note:"Daily sales batch",                orderId:"batch",   createdAt:"2025-05-27T07:00:00Z", createdBy:"System" },
  { id:"sm10", productId:"p8",  productName:"Minimalist Leather Wallet", productImage:"https://images.unsplash.com/photo-1627123424574-724758594e93?w=60&h=60&fit=crop",  type:"restock",    quantity:50,   balanceBefore:39,  balanceAfter:89,  note:"Received from Supplier D",         supplierId:"sup4", createdAt:"2025-05-26T10:00:00Z", createdBy:"Admin" },
];

// ─── Returns ─────────────────────────────────────────────────

export const returnRequests: ReturnRequest[] = [
  {
    id:"ret1", returnNumber:"RET-2025-00318", orderId:"o1", orderNumber:"ORD-2025-00847",
    status:"requested", reason:"damaged", reasonNote:"Arrived with a cracked casing. Photos attached.",
    refundAmount:1198, refundMethod:"original", refundStatus:"pending",
    customer:{id:"c1",name:"Priya Sharma",email:"priya@example.com",avatar:"PS"},
    items:[{productId:"p1",name:"Magnetic Cable Organizer",image:"https://images.unsplash.com/photo-1583394838336-acd977736f90?w=60&h=60&fit=crop",price:599,quantity:2}],
    images:[], createdAt:"2025-05-30T11:00:00Z", updatedAt:"2025-05-30T11:00:00Z",
  },
  {
    id:"ret2", returnNumber:"RET-2025-00317", orderId:"o5", orderNumber:"ORD-2025-00843",
    status:"approved", reason:"not_as_described", reasonNote:"Color is different from the product page.",
    refundAmount:999, refundMethod:"store_credit", refundStatus:"processing",
    customer:{id:"c5",name:"Divya Nair",email:"divya@example.com",avatar:"DN"},
    items:[{productId:"p2",name:"Portable LED Desk Lamp",image:"https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=60&h=60&fit=crop",price:999,quantity:1}],
    images:[], adminNote:"Approved — product listing updated to fix color description.", createdAt:"2025-05-28T09:00:00Z", updatedAt:"2025-05-29T10:00:00Z",
  },
  {
    id:"ret3", returnNumber:"RET-2025-00316", orderId:"o6", orderNumber:"ORD-2025-00842",
    status:"refunded", reason:"changed_mind", reasonNote:"Ordered by mistake.",
    refundAmount:1499, refundMethod:"original", refundStatus:"completed",
    customer:{id:"c6",name:"Arjun Patel",email:"arjun@example.com",avatar:"AP"},
    items:[{productId:"p9",name:"Mini Portable Blender",image:"https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=60&h=60&fit=crop",price:1499,quantity:1}],
    images:[], createdAt:"2025-05-23T10:00:00Z", updatedAt:"2025-05-25T12:00:00Z", resolvedAt:"2025-05-25T12:00:00Z",
  },
  {
    id:"ret4", returnNumber:"RET-2025-00315", orderId:"o8", orderNumber:"ORD-2025-00840",
    status:"rejected", reason:"changed_mind", reasonNote:"No longer want it.",
    refundAmount:0, refundMethod:"original", refundStatus:"failed",
    customer:{id:"c8",name:"Vivek Kumar",email:"vivek@example.com",avatar:"VK"},
    items:[{productId:"p7",name:"Noise-Cancelling Earplugs",image:"https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=60&h=60&fit=crop",price:1299,quantity:1}],
    images:[], adminNote:"Rejected — return window expired (>30 days).", createdAt:"2025-05-21T08:00:00Z", updatedAt:"2025-05-22T09:00:00Z",
  },
  {
    id:"ret5", returnNumber:"RET-2025-00314", orderId:"o7", orderNumber:"ORD-2025-00841",
    status:"received", reason:"defective", reasonNote:"Zipper broke after first use.",
    refundAmount:1699, refundMethod:"original", refundStatus:"processing",
    customer:{id:"c7",name:"Sneha Gupta",email:"sneha@example.com",avatar:"SG"},
    items:[{productId:"p8",name:"Minimalist Leather Wallet",image:"https://images.unsplash.com/photo-1627123424574-724758594e93?w=60&h=60&fit=crop",price:1699,quantity:1}],
    images:[], adminNote:"Item received. Refund being processed.", createdAt:"2025-05-27T14:00:00Z", updatedAt:"2025-05-30T10:00:00Z",
  },
];

// ─── Support Tickets ─────────────────────────────────────────

export const supportTickets: SupportTicket[] = [
  {
    id:"t1", ticketNumber:"TKT-2025-00892", subject:"Order not delivered — 3 days late",
    body:"My order ORD-2025-00847 was supposed to arrive by May 30th but still hasn't. I need it urgently.",
    status:"open", priority:"urgent", category:"delivery",
    customer:{id:"c1",name:"Priya Sharma",email:"priya@example.com",avatar:"PS"},
    orderId:"o1", orderNumber:"ORD-2025-00847",
    messages:[
      {from:"customer",body:"My order ORD-2025-00847 was supposed to arrive by May 30th but still hasn't. I need it urgently.",createdAt:"2025-05-30T10:00:00Z"},
    ],
    createdAt:"2025-05-30T10:00:00Z", updatedAt:"2025-05-30T10:00:00Z",
  },
  {
    id:"t2", ticketNumber:"TKT-2025-00891", subject:"Wrong product received",
    body:"I ordered the Travel Compression Bags but received Silicone Food Covers instead.",
    status:"in_progress", priority:"high", category:"product",
    customer:{id:"c4",name:"Karan Mehta",email:"karan@example.com",avatar:"KM"},
    orderId:"o4", orderNumber:"ORD-2025-00844",
    messages:[
      {from:"customer",body:"I ordered the Travel Compression Bags but received Silicone Food Covers instead.",createdAt:"2025-05-29T14:00:00Z"},
      {from:"agent",body:"We sincerely apologize for this error, Karan. We've raised an urgent priority replacement order and will ship the correct item within 24 hours at no extra cost.",createdAt:"2025-05-29T15:30:00Z"},
      {from:"customer",body:"Thank you, waiting for the replacement.",createdAt:"2025-05-29T16:00:00Z"},
    ],
    assignedTo:"Support Agent", createdAt:"2025-05-29T14:00:00Z", updatedAt:"2025-05-29T16:00:00Z", firstResponseAt:"2025-05-29T15:30:00Z",
  },
  {
    id:"t3", ticketNumber:"TKT-2025-00890", subject:"Refund not credited after 5 days",
    body:"My refund for RET-2025-00316 was approved 5 days ago but not yet in my account.",
    status:"waiting", priority:"high", category:"return",
    customer:{id:"c6",name:"Arjun Patel",email:"arjun@example.com",avatar:"AP"},
    messages:[
      {from:"customer",body:"My refund was approved 5 days ago but not yet credited.",createdAt:"2025-05-28T09:00:00Z"},
      {from:"agent",body:"Hi Arjun, we've escalated this to our payments team. Refunds can take 5–7 banking days. If not received by June 2nd, please reply and we will investigate further.",createdAt:"2025-05-28T10:00:00Z"},
    ],
    assignedTo:"Support Agent", createdAt:"2025-05-28T09:00:00Z", updatedAt:"2025-05-28T10:00:00Z", firstResponseAt:"2025-05-28T10:00:00Z",
  },
  {
    id:"t4", ticketNumber:"TKT-2025-00889", subject:"How do I use the coupon code?",
    body:"I have coupon TREND10 but it's not applying at checkout.",
    status:"resolved", priority:"low", category:"payment",
    customer:{id:"c9",name:"Meera Pillai",email:"meera@example.com",avatar:"MP"},
    messages:[
      {from:"customer",body:"I have coupon TREND10 but it's not applying at checkout.",createdAt:"2025-05-27T11:00:00Z"},
      {from:"agent",body:"Hi Meera! The coupon TREND10 requires a minimum order of ₹500. Please ensure your cart total meets this threshold and try again. Let us know if it still doesn't work!",createdAt:"2025-05-27T11:20:00Z"},
      {from:"customer",body:"That worked, thank you!",createdAt:"2025-05-27T11:45:00Z"},
    ],
    assignedTo:"Support Agent", createdAt:"2025-05-27T11:00:00Z", updatedAt:"2025-05-27T11:45:00Z", firstResponseAt:"2025-05-27T11:20:00Z", resolvedAt:"2025-05-27T11:45:00Z", satisfactionScore:5,
  },
  {
    id:"t5", ticketNumber:"TKT-2025-00888", subject:"Can I change my delivery address?",
    body:"Order ORD-2025-00846 — need to change the delivery address before it ships.",
    status:"resolved", priority:"medium", category:"order",
    customer:{id:"c2",name:"Rahul Verma",email:"rahul@example.com",avatar:"RV"},
    orderId:"o2", orderNumber:"ORD-2025-00846",
    messages:[
      {from:"customer",body:"Need to change delivery address before it ships.",createdAt:"2025-05-29T07:00:00Z"},
      {from:"agent",body:"Done! Address updated to your new location. Your order will ship to the new address.",createdAt:"2025-05-29T07:30:00Z"},
    ],
    assignedTo:"Support Agent", createdAt:"2025-05-29T07:00:00Z", updatedAt:"2025-05-29T07:30:00Z", firstResponseAt:"2025-05-29T07:30:00Z", resolvedAt:"2025-05-29T07:30:00Z", satisfactionScore:4,
  },
];

export const faqItems: FaqItem[] = [
  { id:"f1", question:"How long does delivery take?", answer:"Standard delivery takes 3–5 business days. Express (1–2 days) is available at checkout.", category:"Shipping", views:4821, helpful:412, isPublished:true, sortOrder:1 },
  { id:"f2", question:"What is your return policy?", answer:"We offer a hassle-free 30-day return policy. Contact support to initiate a return.", category:"Returns", views:3201, helpful:298, isPublished:true, sortOrder:2 },
  { id:"f3", question:"How do I track my order?", answer:"Once your order ships, you'll receive a tracking number via email and SMS.", category:"Orders", views:2944, helpful:267, isPublished:true, sortOrder:3 },
  { id:"f4", question:"Are the products genuine?", answer:"Yes, 100%. Every product is quality-checked before listing.", category:"Products", views:1823, helpful:189, isPublished:true, sortOrder:4 },
  { id:"f5", question:"Is Cash on Delivery available?", answer:"COD is available for orders up to ₹5,000 in most PIN codes.", category:"Payment", views:1654, helpful:145, isPublished:true, sortOrder:5 },
  { id:"f6", question:"How do I apply a coupon?", answer:"Enter your coupon code in the cart page before proceeding to checkout.", category:"Payment", views:987, helpful:88, isPublished:true, sortOrder:6 },
];

// ─── Campaigns ───────────────────────────────────────────────

export const campaigns: Campaign[] = [
  { id:"camp1", name:"June Monsoon Sale", type:"email", status:"scheduled", subject:"☔ Big Monsoon Deals — Up to 30% Off!", body:"Exclusive discounts on top products this monsoon...", targetSegment:"all", scheduledAt:"2025-06-05T09:00:00Z", recipients:4200, createdAt:"2025-05-28T00:00:00Z", discountCode:"MONSOON30" },
  { id:"camp2", name:"Win-Back Inactive Users", type:"email", status:"active", subject:"We miss you! Here's 15% off", body:"It's been a while. Come back and shop with this exclusive offer...", targetSegment:"inactive", scheduledAt:"2025-05-25T10:00:00Z", sentAt:"2025-05-25T10:00:00Z", recipients:890, opens:312, clicks:89, conversions:23, revenue:41240, createdAt:"2025-05-20T00:00:00Z", discountCode:"COMEBACK15" },
  { id:"camp3", name:"VIP Early Access", type:"email", status:"completed", subject:"[VIP Only] Early access to new arrivals", body:"As one of our valued customers, enjoy early access...", targetSegment:"vip", sentAt:"2025-05-15T10:00:00Z", recipients:127, opens:98, clicks:71, conversions:34, revenue:89340, createdAt:"2025-05-10T00:00:00Z" },
  { id:"camp4", name:"Abandoned Cart Recovery", type:"push", status:"active", subject:"You left something behind!", body:"Your cart is waiting. Complete your order and get free shipping.", targetSegment:"cart_abandoned", recipients:340, opens:201, clicks:89, conversions:41, revenue:73800, createdAt:"2025-05-01T00:00:00Z" },
  { id:"camp5", name:"Monsoon Banner", type:"banner", status:"scheduled", bannerText:"☔ Monsoon Sale — Flat 20% Off Sitewide | Use: MONSOON20", bannerColor:"#1D4ED8", targetSegment:"all", scheduledAt:"2025-06-01T00:00:00Z", recipients:0, createdAt:"2025-05-29T00:00:00Z", discountCode:"MONSOON20" },
  { id:"camp6", name:"New User Welcome", type:"discount", status:"active", targetSegment:"new", discountCode:"NEWUSER", recipients:891, conversions:891, revenue:312870, createdAt:"2024-11-01T00:00:00Z" },
];

// ─── Suppliers ───────────────────────────────────────────────

export const suppliers: Supplier[] = [
  {
    id:"sup1", name:"ShenzhenTech Exports", contactName:"David Chen", email:"david@shenzhentech.cn", phone:"+86 135 8901 2345",
    country:"China", status:"active", reliabilityScore:94, avgShippingDays:12, totalProducts:6, totalOrders:47, totalPurchaseValue:1823400,
    onTimeDeliveryRate:94, defectRate:1.2, paymentTerms:"Net 30", currency:"USD",
    notes:"Primary supplier for electronics and desk accessories. Very responsive.", joinedDate:"2024-01-15T00:00:00Z", lastOrderDate:"2025-05-28T00:00:00Z",
    productIds:["p1","p2","p5","p7","p14"], tags:["electronics","desk","reliable"],
  },
  {
    id:"sup2", name:"MumbaiKitchen Wholesale", contactName:"Ramesh Patel", email:"ramesh@mkwholesale.in", phone:"+91 98210 34567",
    country:"India", status:"active", reliabilityScore:88, avgShippingDays:4, totalProducts:4, totalOrders:63, totalPurchaseValue:987200,
    onTimeDeliveryRate:88, defectRate:2.1, paymentTerms:"Advance", currency:"INR",
    notes:"Domestic supplier — fast shipping. Kitchen and food products.", joinedDate:"2024-03-01T00:00:00Z", lastOrderDate:"2025-05-27T00:00:00Z",
    productIds:["p6","p9","p12"], tags:["kitchen","domestic","fast-shipping"],
  },
  {
    id:"sup3", name:"GreenLife Products", contactName:"Priya Singh", email:"priya@greenlife.in", phone:"+91 87654 09876",
    country:"India", status:"active", reliabilityScore:91, avgShippingDays:5, totalProducts:3, totalOrders:38, totalPurchaseValue:542300,
    onTimeDeliveryRate:92, defectRate:0.8, paymentTerms:"Net 15", currency:"INR",
    notes:"Eco-friendly products. Excellent quality control.", joinedDate:"2024-04-10T00:00:00Z", lastOrderDate:"2025-05-20T00:00:00Z",
    productIds:["p5","p12"], tags:["eco","sustainable","domestic"],
  },
  {
    id:"sup4", name:"Guangzhou Leather Co.", contactName:"Li Wei", email:"liwei@gzleather.cn", phone:"+86 159 2345 6789",
    country:"China", status:"active", reliabilityScore:82, avgShippingDays:18, totalProducts:2, totalOrders:21, totalPurchaseValue:634100,
    onTimeDeliveryRate:81, defectRate:3.4, paymentTerms:"50% advance", currency:"USD",
    notes:"Good product quality but slower shipping. Consider buffer stock.", joinedDate:"2024-06-01T00:00:00Z", lastOrderDate:"2025-05-26T00:00:00Z",
    productIds:["p8"], tags:["leather","fashion","slow-shipping"],
  },
  {
    id:"sup5", name:"Yiwu Wellness Hub", contactName:"Chen Ming", email:"chenming@yiwuwellness.cn", phone:"+86 137 4567 8901",
    country:"China", status:"on_hold", reliabilityScore:67, avgShippingDays:21, totalProducts:3, totalOrders:14, totalPurchaseValue:234100,
    onTimeDeliveryRate:65, defectRate:6.8, paymentTerms:"Net 45", currency:"USD",
    notes:"On hold — high defect rate in last batch. Reviewing quality issues.", joinedDate:"2024-08-01T00:00:00Z", lastOrderDate:"2025-04-10T00:00:00Z",
    productIds:["p3","p7"], tags:["health","wellness","quality-issues"],
  },
];

// ─── Profit & COGS Data ───────────────────────────────────────

export interface ProfitEntry {
  date: string;
  revenue: number;
  cogs: number;        // cost of goods
  shipping: number;    // shipping paid to courier
  gatewayFee: number;  // 2% of revenue
  adSpend: number;
  returns: number;
  grossProfit: number;
  netProfit: number;
}

export const profitData: ProfitEntry[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date("2025-05-02");
  date.setDate(date.getDate() + i);
  const revenue    = Math.round(45000 + Math.sin(i * 0.7) * 15000 + Math.random() * 12000);
  const cogs       = Math.round(revenue * 0.38);        // ~38% product cost
  const shipping   = Math.round(revenue * 0.04);        // ~4% shipping cost
  const gatewayFee = Math.round(revenue * 0.02);        // 2% gateway fee
  const adSpend    = Math.round(revenue * 0.08);        // ~8% ad spend
  const returns    = Math.round(revenue * 0.015);       // 1.5% returns
  const grossProfit = revenue - cogs - shipping - gatewayFee - returns;
  const netProfit   = grossProfit - adSpend;
  return { date: date.toISOString().split("T")[0], revenue, cogs, shipping, gatewayFee, adSpend, returns, grossProfit, netProfit };
});

export const profitByProduct = products.slice(0, 8).map(p => ({
  id: p.id,
  name: p.name,
  image: p.images[0],
  revenue: p.revenue,
  cogs: Math.round(p.revenue * 0.36),
  unitsSold: p.salesCount,
  margin: Math.round(((p.price - p.price * 0.36) / p.price) * 100),
  netProfit: Math.round(p.revenue * 0.24),
}));
