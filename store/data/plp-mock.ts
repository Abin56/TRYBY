export type PLPProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number;
  rating: number;
  reviewCount: number;
  image: string;
  badge?: "new" | "sale" | "hot";
  category: string;
  sport: string;
  club?: string;
  country?: string;
};

/*
  IMAGE POLICY
  ─────────────────────────────────────────────────────────────
  All product images use /images/jerseys/<slug>.jpg
  Place clean white-background jersey catalogue photos in:
    public/images/jerseys/

  Fallback: if an image fails to load, <JerseyImage> component
  renders a branded SVG placeholder (see components/ui/jersey-image.tsx).

  DO NOT use Unsplash lifestyle/action/stadium photos for products.
  ─────────────────────────────────────────────────────────────
*/

const IMG = (slug: string) => `/images/jerseys/${slug}.jpg`;

export const PLP_PRODUCTS: PLPProduct[] = [
  {
    id: "j1",
    name: "Barcelona Home Jersey 2024/25",
    slug: "barcelona-home-jersey-2425",
    price: 799,
    comparePrice: 999,
    rating: 4.5,
    reviewCount: 128,
    image: IMG("barcelona-home-2425"),
    badge: "hot",
    category: "Club Jersey",
    sport: "Football",
    club: "Barcelona",
  },
  {
    id: "j2",
    name: "Real Madrid Away Jersey 2024/25",
    slug: "real-madrid-away-jersey-2425",
    price: 749,
    comparePrice: 999,
    rating: 4.7,
    reviewCount: 96,
    image: IMG("real-madrid-away-2425"),
    category: "Club Jersey",
    sport: "Football",
    club: "Real Madrid",
  },
  {
    id: "j3",
    name: "India Cricket ODI Jersey",
    slug: "india-cricket-odi-jersey",
    price: 699,
    comparePrice: 899,
    rating: 4.8,
    reviewCount: 214,
    image: IMG("india-odi-2024"),
    badge: "new",
    category: "National Jersey",
    sport: "Cricket",
    country: "India",
  },
  {
    id: "j4",
    name: "Manchester United Home Jersey",
    slug: "manchester-united-home-jersey",
    price: 849,
    comparePrice: 1099,
    rating: 4.6,
    reviewCount: 87,
    image: IMG("manchester-united-home-2425"),
    category: "Club Jersey",
    sport: "Football",
    club: "Man United",
  },
  {
    id: "j5",
    name: "Portugal Home Jersey 2024",
    slug: "portugal-home-jersey-2024",
    price: 899,
    comparePrice: 1199,
    rating: 4.9,
    reviewCount: 163,
    image: IMG("portugal-home-2024"),
    badge: "hot",
    category: "National Jersey",
    sport: "Football",
    country: "Portugal",
  },
  {
    id: "j6",
    name: "India Cricket T20 Jersey",
    slug: "india-cricket-t20-jersey",
    price: 649,
    comparePrice: 849,
    rating: 4.7,
    reviewCount: 189,
    image: IMG("india-t20-2024"),
    badge: "sale",
    category: "National Jersey",
    sport: "Cricket",
    country: "India",
  },
  {
    id: "j7",
    name: "Chelsea Home Jersey 2024/25",
    slug: "chelsea-home-jersey-2425",
    price: 799,
    comparePrice: 999,
    rating: 4.4,
    reviewCount: 72,
    image: IMG("chelsea-home-2425"),
    category: "Club Jersey",
    sport: "Football",
    club: "Chelsea",
  },
  {
    id: "j8",
    name: "Argentina World Cup Jersey",
    slug: "argentina-world-cup-jersey",
    price: 949,
    comparePrice: 1299,
    rating: 4.9,
    reviewCount: 341,
    image: IMG("argentina-home-2024"),
    badge: "hot",
    category: "National Jersey",
    sport: "Football",
    country: "Argentina",
  },
  {
    id: "j9",
    name: "CSK IPL Jersey 2024",
    slug: "csk-ipl-jersey-2024",
    price: 599,
    comparePrice: 799,
    rating: 4.6,
    reviewCount: 256,
    image: IMG("csk-2024"),
    badge: "new",
    category: "Club Jersey",
    sport: "Cricket",
    club: "CSK",
  },
  {
    id: "j10",
    name: "Brazil Home Jersey 2024",
    slug: "brazil-home-jersey-2024",
    price: 849,
    comparePrice: 1099,
    rating: 4.5,
    reviewCount: 108,
    image: IMG("brazil-home-2024"),
    category: "National Jersey",
    sport: "Football",
    country: "Brazil",
  },
  {
    id: "j11",
    name: "Retro AC Milan Jersey 1990",
    slug: "retro-ac-milan-1990",
    price: 899,
    comparePrice: 1199,
    rating: 4.8,
    reviewCount: 64,
    image: IMG("ac-milan-retro-1990"),
    badge: "new",
    category: "Retro Jersey",
    sport: "Football",
    club: "AC Milan",
  },
  {
    id: "j12",
    name: "Mumbai Indians IPL Jersey",
    slug: "mumbai-indians-ipl-jersey",
    price: 599,
    comparePrice: 799,
    rating: 4.5,
    reviewCount: 193,
    image: IMG("mumbai-indians-2024"),
    badge: "sale",
    category: "Club Jersey",
    sport: "Cricket",
    club: "Mumbai Indians",
  },
];

export const SPORTS = ["All", "Football", "Cricket"];
export const CATEGORIES = ["All", "Club Jersey", "National Jersey", "Retro Jersey"];
export const SORT_OPTIONS = [
  { label: "Trending",          value: "trending"   },
  { label: "Price: Low to High",value: "price_asc"  },
  { label: "Price: High to Low",value: "price_desc" },
  { label: "Best Rated",        value: "rating"     },
  { label: "Newest",            value: "newest"     },
];
export const PRICE_RANGES = [
  { label: "Under ₹500",  min: 0,    max: 500  },
  { label: "₹500 – ₹799", min: 500,  max: 799  },
  { label: "₹800 – ₹999", min: 800,  max: 999  },
  { label: "₹1000+",      min: 1000, max: 99999 },
];
