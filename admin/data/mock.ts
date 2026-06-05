// ============================================================
// USEFULFINDS ADMIN — COMPLETE MOCK DATA
// ============================================================

// ─── Types ───────────────────────────────────────────────────

export type ProductStatus = "active" | "draft" | "out_of_stock" | "archived";
export type OrderStatus   = "pending" | "processing" | "packed" | "shipped" | "delivered" | "cancelled" | "refunded";
export type PaymentMethod = "upi" | "card" | "netbanking" | "wallet" | "cod";
export type ReviewStatus  = "pending" | "approved" | "rejected";
export type CustomerStatus = "active" | "inactive" | "blocked";
export type CouponType    = "percentage" | "fixed" | "free_shipping";

export interface Product {
  id: string; name: string; slug: string; status: ProductStatus;
  category: string; price: number; salePrice?: number;
  inventory: number; lowStockThreshold: number;
  images: string[]; rating: number; reviewCount: number;
  salesCount: number; revenue: number; sku: string;
  tags: string[]; description: string; createdAt: string; updatedAt: string;
}

export interface OrderItem {
  productId: string; name: string; image: string; price: number; quantity: number;
}

export interface Order {
  id: string; orderNumber: string;
  customer: { id: string; name: string; email: string; phone: string; avatar: string };
  items: OrderItem[]; status: OrderStatus; paymentMethod: PaymentMethod;
  paymentStatus: "paid" | "pending" | "failed" | "refunded";
  subtotal: number; shipping: number; discount: number; total: number;
  couponCode?: string; trackingNumber?: string; shippingCarrier?: string;
  address: { name: string; line1: string; line2?: string; city: string; state: string; postcode: string };
  notes?: string; createdAt: string; updatedAt: string;
  timeline: { status: string; time: string; note?: string }[];
}

export interface Customer {
  id: string; name: string; email: string; phone: string;
  avatar: string; status: CustomerStatus;
  totalOrders: number; totalSpent: number; avgOrderValue: number;
  lastOrderDate: string; joinedDate: string;
  city: string; state: string; tags: string[];
}

export interface Review {
  id: string; rating: number; title: string; body: string;
  status: ReviewStatus; isVerified: boolean; helpfulCount: number;
  images: string[];
  customer: { id: string; name: string; avatar: string; email: string };
  product: { id: string; name: string; image: string; slug: string };
  createdAt: string;
}

export interface Coupon {
  id: string; code: string; type: CouponType;
  value: number; minOrderAmount?: number; maxDiscount?: number;
  usageLimit?: number; usageCount: number; perUserLimit: number;
  isActive: boolean; expiresAt?: string; createdAt: string;
  revenue: number; orders: number;
}

export interface DailyRevenue { date: string; revenue: number; orders: number; }
export interface CategoryPerf  { category: string; revenue: number; orders: number; color: string; }

// ─── Products ────────────────────────────────────────────────

export const products: Product[] = [
  { id:"p1", name:"Magnetic Cable Organizer", slug:"magnetic-cable-organizer", status:"active", category:"Desk & Productivity", price:799, salePrice:599, inventory:284, lowStockThreshold:20, images:["https://images.unsplash.com/photo-1583394838336-acd977736f90?w=200&h=200&fit=crop"], rating:4.8, reviewCount:2341, salesCount:4812, revenue:2883888, sku:"MCO-001", tags:["cable","desk","organizer"], description:"Premium magnetic cable management system.", createdAt:"2024-10-01T00:00:00Z", updatedAt:"2025-05-20T00:00:00Z" },
  { id:"p2", name:"Portable LED Desk Lamp", slug:"portable-led-desk-lamp", status:"active", category:"Home & Living", price:1499, salePrice:999, inventory:142, lowStockThreshold:15, images:["https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=200&h=200&fit=crop"], rating:4.9, reviewCount:1876, salesCount:3241, revenue:3237759, sku:"PLL-002", tags:["lamp","led","desk"], description:"Portable LED lamp with 3 brightness levels.", createdAt:"2024-09-15T00:00:00Z", updatedAt:"2025-05-18T00:00:00Z" },
  { id:"p3", name:"Smart Posture Corrector", slug:"smart-posture-corrector", status:"active", category:"Health & Wellness", price:2299, inventory:67, lowStockThreshold:20, images:["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop"], rating:4.7, reviewCount:3102, salesCount:6732, revenue:15474468, sku:"SPC-003", tags:["posture","health","back"], description:"Smart posture corrector with vibration alerts.", createdAt:"2024-08-01T00:00:00Z", updatedAt:"2025-05-25T00:00:00Z" },
  { id:"p4", name:"Travel Compression Bags", slug:"travel-compression-bags", status:"active", category:"Travel", price:999, salePrice:749, inventory:8, lowStockThreshold:15, images:["https://images.unsplash.com/photo-1553531384-411a247ccd73?w=200&h=200&fit=crop"], rating:4.6, reviewCount:4521, salesCount:9234, revenue:6914616, sku:"TCB-004", tags:["travel","packing","bags"], description:"Space-saving vacuum compression bags.", createdAt:"2024-07-20T00:00:00Z", updatedAt:"2025-05-29T00:00:00Z" },
  { id:"p5", name:"Bamboo Phone Stand", slug:"bamboo-phone-stand", status:"active", category:"Desk & Productivity", price:649, inventory:201, lowStockThreshold:25, images:["https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=200&h=200&fit=crop"], rating:4.8, reviewCount:987, salesCount:2134, revenue:1385066, sku:"BPS-005", tags:["bamboo","phone","eco"], description:"Eco-friendly bamboo phone stand.", createdAt:"2024-11-01T00:00:00Z", updatedAt:"2025-05-10T00:00:00Z" },
  { id:"p6", name:"Electric Milk Frother", slug:"electric-milk-frother", status:"active", category:"Kitchen", price:899, salePrice:699, inventory:3, lowStockThreshold:10, images:["https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&h=200&fit=crop"], rating:4.9, reviewCount:6234, salesCount:12041, revenue:8413659, sku:"EMF-006", tags:["coffee","kitchen","frother"], description:"Electric milk frother for café-quality drinks.", createdAt:"2024-06-01T00:00:00Z", updatedAt:"2025-05-28T00:00:00Z" },
  { id:"p7", name:"Noise-Cancelling Earplugs", slug:"noise-cancelling-earplugs", status:"active", category:"Health & Wellness", price:1299, inventory:156, lowStockThreshold:20, images:["https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=200&h=200&fit=crop"], rating:4.7, reviewCount:2109, salesCount:5421, revenue:7042079, sku:"NCE-007", tags:["earplugs","noise","focus"], description:"Premium noise-cancelling silicone earplugs.", createdAt:"2024-09-01T00:00:00Z", updatedAt:"2025-05-15T00:00:00Z" },
  { id:"p8", name:"Minimalist Leather Wallet", slug:"minimalist-leather-wallet", status:"active", category:"Lifestyle", price:1699, inventory:89, lowStockThreshold:15, images:["https://images.unsplash.com/photo-1627123424574-724758594e93?w=200&h=200&fit=crop"], rating:4.8, reviewCount:3445, salesCount:7241, revenue:12302759, sku:"MLW-008", tags:["wallet","leather","slim"], description:"Slim genuine leather RFID wallet.", createdAt:"2024-08-15T00:00:00Z", updatedAt:"2025-05-22T00:00:00Z" },
  { id:"p9", name:"Mini Portable Blender", slug:"mini-portable-blender", status:"active", category:"Kitchen", price:1899, salePrice:1499, inventory:0, lowStockThreshold:10, images:["https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=200&h=200&fit=crop"], rating:4.9, reviewCount:12043, salesCount:41234, revenue:61726566, sku:"MPB-009", tags:["blender","portable","smoothie"], description:"USB rechargeable portable blender.", createdAt:"2024-05-01T00:00:00Z", updatedAt:"2025-05-30T00:00:00Z" },
  { id:"p10", name:"Sunset Lamp Projector", slug:"sunset-lamp-projector", status:"active", category:"Home & Living", price:2999, salePrice:2499, inventory:44, lowStockThreshold:10, images:["https://images.unsplash.com/photo-1578898887932-dce23a595ad4?w=200&h=200&fit=crop"], rating:4.9, reviewCount:7845, salesCount:28341, revenue:70765659, sku:"SLP-010", tags:["lamp","aesthetic","room"], description:"Stunning sunset gradient lamp projector.", createdAt:"2024-07-01T00:00:00Z", updatedAt:"2025-05-27T00:00:00Z" },
  { id:"p11", name:"Resistance Band Set", slug:"resistance-band-set", status:"draft", category:"Fitness", price:1299, inventory:320, lowStockThreshold:30, images:["https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=200&h=200&fit=crop"], rating:4.6, reviewCount:9234, salesCount:35000, revenue:45494000, sku:"RBS-011", tags:["fitness","resistance","workout"], description:"5-level resistance band set.", createdAt:"2025-01-15T00:00:00Z", updatedAt:"2025-05-29T00:00:00Z" },
  { id:"p12", name:"Silicone Food Covers", slug:"silicone-food-covers", status:"active", category:"Kitchen", price:599, inventory:512, lowStockThreshold:30, images:["https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop"], rating:4.8, reviewCount:15321, salesCount:52000, revenue:31148000, sku:"SFC-012", tags:["silicone","eco","kitchen"], description:"Reusable silicone stretch food covers.", createdAt:"2024-04-01T00:00:00Z", updatedAt:"2025-05-20T00:00:00Z" },
  { id:"p13", name:"LED Mirror Ring Light", slug:"led-mirror-ring-light", status:"out_of_stock", category:"Home & Living", price:3499, inventory:0, lowStockThreshold:5, images:["https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=200&h=200&fit=crop"], rating:4.8, reviewCount:5678, salesCount:18000, revenue:62982000, sku:"LMR-013", tags:["ring","light","mirror"], description:"Professional LED ring light with mirror.", createdAt:"2024-06-15T00:00:00Z", updatedAt:"2025-05-15T00:00:00Z" },
  { id:"p14", name:"Foldable Laptop Stand", slug:"foldable-laptop-stand", status:"active", category:"Desk & Productivity", price:1799, inventory:134, lowStockThreshold:20, images:["https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=200&h=200&fit=crop"], rating:4.7, reviewCount:3241, salesCount:8934, revenue:16072566, sku:"FLS-014", tags:["laptop","stand","ergonomic"], description:"Adjustable aluminum laptop stand.", createdAt:"2024-10-15T00:00:00Z", updatedAt:"2025-05-25T00:00:00Z" },
  { id:"p15", name:"Aromatherapy Diffuser", slug:"aromatherapy-diffuser", status:"archived", category:"Health & Wellness", price:1199, inventory:23, lowStockThreshold:10, images:["https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=200&h=200&fit=crop"], rating:4.5, reviewCount:1234, salesCount:4521, revenue:5420679, sku:"ARD-015", tags:["diffuser","aromatherapy","wellness"], description:"Ultrasonic aromatherapy essential oil diffuser.", createdAt:"2024-03-01T00:00:00Z", updatedAt:"2025-04-01T00:00:00Z" },
];

// ─── Orders ──────────────────────────────────────────────────

export const orders: Order[] = [
  { id:"o1", orderNumber:"ORD-2025-00847", customer:{id:"c1",name:"Priya Sharma",email:"priya@example.com",phone:"+91 98765 43210",avatar:"PS"}, items:[{productId:"p1",name:"Magnetic Cable Organizer",image:"https://images.unsplash.com/photo-1583394838336-acd977736f90?w=60&h=60&fit=crop",price:599,quantity:2},{productId:"p5",name:"Bamboo Phone Stand",image:"https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=60&h=60&fit=crop",price:649,quantity:1}], status:"delivered", paymentMethod:"upi", paymentStatus:"paid", subtotal:1847, shipping:0, discount:0, total:1847, trackingNumber:"DTDC123456789IN", shippingCarrier:"DTDC", address:{name:"Priya Sharma",line1:"42, Koramangala 4th Block",line2:"Near BDA Complex",city:"Bengaluru",state:"Karnataka",postcode:"560034"}, createdAt:"2025-05-28T10:30:00Z", updatedAt:"2025-05-30T14:00:00Z", timeline:[{status:"Order placed",time:"2025-05-28T10:30:00Z"},{status:"Payment confirmed",time:"2025-05-28T10:31:00Z"},{status:"Processing",time:"2025-05-28T14:00:00Z"},{status:"Packed & shipped",time:"2025-05-29T09:00:00Z",note:"Tracking: DTDC123456789IN"},{status:"Delivered",time:"2025-05-30T14:00:00Z"}] },
  { id:"o2", orderNumber:"ORD-2025-00846", customer:{id:"c2",name:"Rahul Verma",email:"rahul@example.com",phone:"+91 87654 32109",avatar:"RV"}, items:[{productId:"p3",name:"Smart Posture Corrector",image:"https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=60&h=60&fit=crop",price:2299,quantity:1}], status:"shipped", paymentMethod:"card", paymentStatus:"paid", subtotal:2299, shipping:49, discount:230, total:2118, couponCode:"TREND10", trackingNumber:"BLUEDART987654321", shippingCarrier:"Blue Dart", address:{name:"Rahul Verma",line1:"15, HSR Layout Sector 2",city:"Bengaluru",state:"Karnataka",postcode:"560102"}, createdAt:"2025-05-29T08:15:00Z", updatedAt:"2025-05-30T11:00:00Z", timeline:[{status:"Order placed",time:"2025-05-29T08:15:00Z"},{status:"Payment confirmed",time:"2025-05-29T08:16:00Z"},{status:"Processing",time:"2025-05-29T10:00:00Z"},{status:"Shipped",time:"2025-05-30T11:00:00Z",note:"Tracking: BLUEDART987654321"}] },
  { id:"o3", orderNumber:"ORD-2025-00845", customer:{id:"c3",name:"Ananya Iyer",email:"ananya@example.com",phone:"+91 76543 21098",avatar:"AI"}, items:[{productId:"p6",name:"Electric Milk Frother",image:"https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=60&h=60&fit=crop",price:699,quantity:2},{productId:"p12",name:"Silicone Food Covers",image:"https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=60&h=60&fit=crop",price:599,quantity:1}], status:"processing", paymentMethod:"upi", paymentStatus:"paid", subtotal:1997, shipping:0, discount:0, total:1997, address:{name:"Ananya Iyer",line1:"8-B, Mylapore",city:"Chennai",state:"Tamil Nadu",postcode:"600004"}, createdAt:"2025-05-30T06:45:00Z", updatedAt:"2025-05-30T09:00:00Z", timeline:[{status:"Order placed",time:"2025-05-30T06:45:00Z"},{status:"Payment confirmed",time:"2025-05-30T06:46:00Z"},{status:"Processing",time:"2025-05-30T09:00:00Z"}] },
  { id:"o4", orderNumber:"ORD-2025-00844", customer:{id:"c4",name:"Karan Mehta",email:"karan@example.com",phone:"+91 65432 10987",avatar:"KM"}, items:[{productId:"p4",name:"Travel Compression Bags",image:"https://images.unsplash.com/photo-1553531384-411a247ccd73?w=60&h=60&fit=crop",price:749,quantity:3}], status:"pending", paymentMethod:"cod", paymentStatus:"pending", subtotal:2247, shipping:49, discount:0, total:2296, address:{name:"Karan Mehta",line1:"202, Hiranandani Gardens",city:"Mumbai",state:"Maharashtra",postcode:"400076"}, createdAt:"2025-05-30T14:22:00Z", updatedAt:"2025-05-30T14:22:00Z", timeline:[{status:"Order placed",time:"2025-05-30T14:22:00Z"}] },
  { id:"o5", orderNumber:"ORD-2025-00843", customer:{id:"c5",name:"Divya Nair",email:"divya@example.com",phone:"+91 54321 09876",avatar:"DN"}, items:[{productId:"p10",name:"Sunset Lamp Projector",image:"https://images.unsplash.com/photo-1578898887932-dce23a595ad4?w=60&h=60&fit=crop",price:2499,quantity:1},{productId:"p2",name:"Portable LED Desk Lamp",image:"https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=60&h=60&fit=crop",price:999,quantity:1}], status:"delivered", paymentMethod:"netbanking", paymentStatus:"paid", subtotal:3498, shipping:0, discount:0, total:3498, address:{name:"Divya Nair",line1:"34, Viman Nagar",city:"Pune",state:"Maharashtra",postcode:"411014"}, createdAt:"2025-05-25T11:00:00Z", updatedAt:"2025-05-29T16:00:00Z", timeline:[{status:"Order placed",time:"2025-05-25T11:00:00Z"},{status:"Payment confirmed",time:"2025-05-25T11:02:00Z"},{status:"Processing",time:"2025-05-26T09:00:00Z"},{status:"Packed & shipped",time:"2025-05-27T10:00:00Z"},{status:"Out for delivery",time:"2025-05-29T10:00:00Z"},{status:"Delivered",time:"2025-05-29T16:00:00Z"}] },
  { id:"o6", orderNumber:"ORD-2025-00842", customer:{id:"c6",name:"Arjun Patel",email:"arjun@example.com",phone:"+91 43210 98765",avatar:"AP"}, items:[{productId:"p9",name:"Mini Portable Blender",image:"https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=60&h=60&fit=crop",price:1499,quantity:1}], status:"cancelled", paymentMethod:"upi", paymentStatus:"refunded", subtotal:1499, shipping:49, discount:0, total:1548, address:{name:"Arjun Patel",line1:"12, CG Road",city:"Ahmedabad",state:"Gujarat",postcode:"380009"}, createdAt:"2025-05-22T09:30:00Z", updatedAt:"2025-05-23T10:00:00Z", timeline:[{status:"Order placed",time:"2025-05-22T09:30:00Z"},{status:"Payment confirmed",time:"2025-05-22T09:31:00Z"},{status:"Cancelled by customer",time:"2025-05-23T10:00:00Z"},{status:"Refund initiated",time:"2025-05-23T10:05:00Z"}], notes:"Customer requested cancellation — changed mind." },
  { id:"o7", orderNumber:"ORD-2025-00841", customer:{id:"c7",name:"Sneha Gupta",email:"sneha@example.com",phone:"+91 32109 87654",avatar:"SG"}, items:[{productId:"p8",name:"Minimalist Leather Wallet",image:"https://images.unsplash.com/photo-1627123424574-724758594e93?w=60&h=60&fit=crop",price:1699,quantity:2}], status:"packed", paymentMethod:"card", paymentStatus:"paid", subtotal:3398, shipping:0, discount:340, total:3058, couponCode:"FLAT200", address:{name:"Sneha Gupta",line1:"7, Saket Block D",city:"New Delhi",state:"Delhi",postcode:"110017"}, createdAt:"2025-05-29T16:00:00Z", updatedAt:"2025-05-30T10:00:00Z", timeline:[{status:"Order placed",time:"2025-05-29T16:00:00Z"},{status:"Payment confirmed",time:"2025-05-29T16:01:00Z"},{status:"Processing",time:"2025-05-29T18:00:00Z"},{status:"Packed",time:"2025-05-30T10:00:00Z"}] },
  { id:"o8", orderNumber:"ORD-2025-00840", customer:{id:"c8",name:"Vivek Kumar",email:"vivek@example.com",phone:"+91 21098 76543",avatar:"VK"}, items:[{productId:"p7",name:"Noise-Cancelling Earplugs",image:"https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=60&h=60&fit=crop",price:1299,quantity:1},{productId:"p14",name:"Foldable Laptop Stand",image:"https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=60&h=60&fit=crop",price:1799,quantity:1}], status:"delivered", paymentMethod:"wallet", paymentStatus:"paid", subtotal:3098, shipping:0, discount:0, total:3098, address:{name:"Vivek Kumar",line1:"45, Jubilee Hills",city:"Hyderabad",state:"Telangana",postcode:"500033"}, createdAt:"2025-05-20T08:00:00Z", updatedAt:"2025-05-24T15:00:00Z", timeline:[{status:"Order placed",time:"2025-05-20T08:00:00Z"},{status:"Delivered",time:"2025-05-24T15:00:00Z"}] },
];

// ─── Customers ───────────────────────────────────────────────

export const customers: Customer[] = [
  { id:"c1", name:"Priya Sharma", email:"priya@example.com", phone:"+91 98765 43210", avatar:"PS", status:"active", totalOrders:14, totalSpent:24892, avgOrderValue:1778, lastOrderDate:"2025-05-28T10:30:00Z", joinedDate:"2024-03-15T00:00:00Z", city:"Bengaluru", state:"Karnataka", tags:["vip","repeat"] },
  { id:"c2", name:"Rahul Verma", email:"rahul@example.com", phone:"+91 87654 32109", avatar:"RV", status:"active", totalOrders:8, totalSpent:14231, avgOrderValue:1779, lastOrderDate:"2025-05-29T08:15:00Z", joinedDate:"2024-06-20T00:00:00Z", city:"Bengaluru", state:"Karnataka", tags:["repeat"] },
  { id:"c3", name:"Ananya Iyer", email:"ananya@example.com", phone:"+91 76543 21098", avatar:"AI", status:"active", totalOrders:5, totalSpent:8920, avgOrderValue:1784, lastOrderDate:"2025-05-30T06:45:00Z", joinedDate:"2024-09-01T00:00:00Z", city:"Chennai", state:"Tamil Nadu", tags:[] },
  { id:"c4", name:"Karan Mehta", email:"karan@example.com", phone:"+91 65432 10987", avatar:"KM", status:"active", totalOrders:2, totalSpent:3841, avgOrderValue:1921, lastOrderDate:"2025-05-30T14:22:00Z", joinedDate:"2025-04-10T00:00:00Z", city:"Mumbai", state:"Maharashtra", tags:["new"] },
  { id:"c5", name:"Divya Nair", email:"divya@example.com", phone:"+91 54321 09876", avatar:"DN", status:"active", totalOrders:11, totalSpent:19847, avgOrderValue:1804, lastOrderDate:"2025-05-25T11:00:00Z", joinedDate:"2024-01-08T00:00:00Z", city:"Pune", state:"Maharashtra", tags:["vip","repeat"] },
  { id:"c6", name:"Arjun Patel", email:"arjun@example.com", phone:"+91 43210 98765", avatar:"AP", status:"active", totalOrders:3, totalSpent:4897, avgOrderValue:1632, lastOrderDate:"2025-05-22T09:30:00Z", joinedDate:"2025-02-14T00:00:00Z", city:"Ahmedabad", state:"Gujarat", tags:[] },
  { id:"c7", name:"Sneha Gupta", email:"sneha@example.com", phone:"+91 32109 87654", avatar:"SG", status:"active", totalOrders:9, totalSpent:16234, avgOrderValue:1804, lastOrderDate:"2025-05-29T16:00:00Z", joinedDate:"2024-04-22T00:00:00Z", city:"New Delhi", state:"Delhi", tags:["repeat"] },
  { id:"c8", name:"Vivek Kumar", email:"vivek@example.com", phone:"+91 21098 76543", avatar:"VK", status:"active", totalOrders:6, totalSpent:11098, avgOrderValue:1850, lastOrderDate:"2025-05-20T08:00:00Z", joinedDate:"2024-07-30T00:00:00Z", city:"Hyderabad", state:"Telangana", tags:[] },
  { id:"c9", name:"Meera Pillai", email:"meera@example.com", phone:"+91 10987 65432", avatar:"MP", status:"inactive", totalOrders:1, totalSpent:1899, avgOrderValue:1899, lastOrderDate:"2025-01-10T00:00:00Z", joinedDate:"2025-01-05T00:00:00Z", city:"Kochi", state:"Kerala", tags:[] },
  { id:"c10", name:"Rohit Joshi", email:"rohit@example.com", phone:"+91 09876 54321", avatar:"RJ", status:"active", totalOrders:18, totalSpent:31240, avgOrderValue:1736, lastOrderDate:"2025-05-30T12:00:00Z", joinedDate:"2023-11-01T00:00:00Z", city:"Jaipur", state:"Rajasthan", tags:["vip","repeat","influencer"] },
];

// ─── Reviews ─────────────────────────────────────────────────

export const reviews: Review[] = [
  { id:"r1", rating:5, title:"Game changer for my desk setup!", body:"Bought the cable organizer and it completely transformed my workspace. Everything is so clean now. Fast delivery too!", status:"approved", isVerified:true, helpfulCount:47, images:[], customer:{id:"c1",name:"Priya Sharma",avatar:"PS",email:"priya@example.com"}, product:{id:"p1",name:"Magnetic Cable Organizer",image:"https://images.unsplash.com/photo-1583394838336-acd977736f90?w=60&h=60&fit=crop",slug:"magnetic-cable-organizer"}, createdAt:"2025-05-29T15:00:00Z" },
  { id:"r2", rating:5, title:"My back pain is gone after 2 weeks", body:"I was skeptical but after using the posture corrector for just 2 weeks I can feel a real difference. Worth every rupee.", status:"pending", isVerified:true, helpfulCount:23, images:[], customer:{id:"c2",name:"Rahul Verma",avatar:"RV",email:"rahul@example.com"}, product:{id:"p3",name:"Smart Posture Corrector",image:"https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=60&h=60&fit=crop",slug:"smart-posture-corrector"}, createdAt:"2025-05-30T08:00:00Z" },
  { id:"r3", rating:2, title:"Lamp stopped working after 3 days", body:"Really disappointed. The lamp worked perfectly for 3 days then just died. Waiting for replacement.", status:"pending", isVerified:true, helpfulCount:12, images:[], customer:{id:"c3",name:"Ananya Iyer",avatar:"AI",email:"ananya@example.com"}, product:{id:"p2",name:"Portable LED Desk Lamp",image:"https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=60&h=60&fit=crop",slug:"portable-led-desk-lamp"}, createdAt:"2025-05-30T10:00:00Z" },
  { id:"r4", rating:5, title:"Perfect for travel", body:"These compression bags are incredible. I fit a full week of clothes into a carry-on bag. Absolutely love them.", status:"approved", isVerified:true, helpfulCount:89, images:[], customer:{id:"c5",name:"Divya Nair",avatar:"DN",email:"divya@example.com"}, product:{id:"p4",name:"Travel Compression Bags",image:"https://images.unsplash.com/photo-1553531384-411a247ccd73?w=60&h=60&fit=crop",slug:"travel-compression-bags"}, createdAt:"2025-05-27T14:00:00Z" },
  { id:"r5", rating:1, title:"Fake product, not as described", body:"This is clearly a knockoff. Nothing like the photos. Requesting a full refund immediately.", status:"pending", isVerified:false, helpfulCount:3, images:[], customer:{id:"c9",name:"Meera Pillai",avatar:"MP",email:"meera@example.com"}, product:{id:"p8",name:"Minimalist Leather Wallet",image:"https://images.unsplash.com/photo-1627123424574-724758594e93?w=60&h=60&fit=crop",slug:"minimalist-leather-wallet"}, createdAt:"2025-05-30T12:00:00Z" },
  { id:"r6", rating:5, title:"Best purchase of 2025", body:"The sunset lamp projector is absolutely stunning. Every single guest who visits comments on it. The quality is premium.", status:"approved", isVerified:true, helpfulCount:134, images:[], customer:{id:"c7",name:"Sneha Gupta",avatar:"SG",email:"sneha@example.com"}, product:{id:"p10",name:"Sunset Lamp Projector",image:"https://images.unsplash.com/photo-1578898887932-dce23a595ad4?w=60&h=60&fit=crop",slug:"sunset-lamp-projector"}, createdAt:"2025-05-26T09:00:00Z" },
  { id:"r7", rating:4, title:"Great but instructions could be clearer", body:"The frother works amazingly. Would give 5 stars but the instruction booklet is not very clear. Once you figure it out though, it's incredible.", status:"approved", isVerified:true, helpfulCount:28, images:[], customer:{id:"c8",name:"Vivek Kumar",avatar:"VK",email:"vivek@example.com"}, product:{id:"p6",name:"Electric Milk Frother",image:"https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=60&h=60&fit=crop",slug:"electric-milk-frother"}, createdAt:"2025-05-24T11:00:00Z" },
  { id:"r8", rating:3, title:"Decent but not amazing", body:"It's okay. Does what it says but build quality feels a bit cheap for the price. Expected better.", status:"rejected", isVerified:true, helpfulCount:5, images:[], customer:{id:"c4",name:"Karan Mehta",avatar:"KM",email:"karan@example.com"}, product:{id:"p5",name:"Bamboo Phone Stand",image:"https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=60&h=60&fit=crop",slug:"bamboo-phone-stand"}, createdAt:"2025-05-18T16:00:00Z" },
];

// ─── Coupons ─────────────────────────────────────────────────

export const coupons: Coupon[] = [
  { id:"coup1", code:"TREND10", type:"percentage", value:10, minOrderAmount:500, maxDiscount:500, usageLimit:1000, usageCount:347, perUserLimit:1, isActive:true, expiresAt:"2025-12-31T23:59:59Z", createdAt:"2025-01-01T00:00:00Z", revenue:124500, orders:347 },
  { id:"coup2", code:"FLAT200", type:"fixed", value:200, minOrderAmount:1000, usageLimit:500, usageCount:219, perUserLimit:1, isActive:true, expiresAt:"2025-06-30T23:59:59Z", createdAt:"2025-02-01T00:00:00Z", revenue:87600, orders:219 },
  { id:"coup3", code:"NEWUSER", type:"percentage", value:15, minOrderAmount:300, maxDiscount:300, usageLimit:undefined, usageCount:891, perUserLimit:1, isActive:true, createdAt:"2024-11-01T00:00:00Z", revenue:312870, orders:891 },
  { id:"coup4", code:"FREESHIP", type:"free_shipping", value:0, minOrderAmount:299, usageLimit:200, usageCount:200, perUserLimit:2, isActive:false, expiresAt:"2025-04-30T23:59:59Z", createdAt:"2025-04-01T00:00:00Z", revenue:19800, orders:200 },
  { id:"coup5", code:"SUMMER25", type:"percentage", value:25, minOrderAmount:2000, maxDiscount:1000, usageLimit:100, usageCount:12, perUserLimit:1, isActive:true, expiresAt:"2025-07-15T23:59:59Z", createdAt:"2025-05-15T00:00:00Z", revenue:48000, orders:12 },
];

// ─── Analytics ───────────────────────────────────────────────

export const dailyRevenue: DailyRevenue[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date("2025-05-02");
  date.setDate(date.getDate() + i);
  const base = 45000 + Math.sin(i * 0.7) * 15000 + Math.random() * 12000;
  const orders = Math.floor(base / 1400);
  return { date: date.toISOString().split("T")[0], revenue: Math.round(base), orders };
});

export const categoryPerformance: CategoryPerf[] = [
  { category:"Kitchen",           revenue:101287659, orders:65275, color:"#2563EB" },
  { category:"Home & Living",     revenue:133747659, orders:47341, color:"#7C3AED" },
  { category:"Desk & Productivity",revenue:20271520, orders:14946, color:"#0891B2" },
  { category:"Health & Wellness", revenue:27937226, orders:16353, color:"#059669" },
  { category:"Travel",            revenue:6914616, orders:9234,  color:"#D97706" },
  { category:"Fitness",           revenue:45494000, orders:35000, color:"#DC2626" },
  { category:"Lifestyle",         revenue:12302759, orders:7241,  color:"#7C3AED" },
];

export const trafficSources = [
  { source:"Organic Search", visitors:12400, pct:38, color:"#2563EB" },
  { source:"Instagram",      visitors:8900,  pct:27, color:"#7C3AED" },
  { source:"Direct",         visitors:4800,  pct:15, color:"#059669" },
  { source:"WhatsApp",       visitors:3200,  pct:10, color:"#16A34A" },
  { source:"Google Ads",     visitors:2100,  pct:6,  color:"#D97706" },
  { source:"Others",         visitors:1200,  pct:4,  color:"#6B7280" },
];

// ─── Dashboard KPIs ──────────────────────────────────────────

export const kpis = {
  revenueToday:      { value:47892, prev:41230, label:"Revenue Today" },
  revenueMonth:      { value:1284720, prev:1102340, label:"Revenue This Month" },
  ordersToday:       { value:34, prev:29, label:"Orders Today" },
  conversionRate:    { value:3.24, prev:2.91, label:"Conversion Rate" },
  avgOrderValue:     { value:1812, prev:1743, label:"Avg Order Value" },
  totalCustomers:    { value:10, prev:8, label:"Total Customers" },
  pendingOrders:     { value:4, label:"Pending Orders" },
  lowStockProducts:  { value:3, label:"Low Stock" },
};
