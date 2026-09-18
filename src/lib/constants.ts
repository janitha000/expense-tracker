export const DEFAULT_CATEGORIES = [
  {
    id: "c1111111-1111-4111-8111-111111111111",
    name: "Housing / Rent",
    icon: "Home",
    color: "#3B82F6",
    isCustom: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "c2222222-2222-4222-8222-222222222222",
    name: "Groceries & Food",
    icon: "Utensils",
    color: "#10B981",
    isCustom: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "c3333333-3333-4333-8333-333333333333",
    name: "Utilities & Bills",
    icon: "Zap",
    color: "#F59E0B",
    isCustom: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "c4444444-4444-4444-8444-444444444444",
    name: "Transport & Fuel",
    icon: "Car",
    color: "#6366F1",
    isCustom: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "c5555555-5555-4555-8555-555555555555",
    name: "Healthcare",
    icon: "HeartPulse",
    color: "#EF4444",
    isCustom: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "c6666666-6666-4666-8666-666666666666",
    name: "Entertainment & Leisure",
    icon: "Film",
    color: "#EC4899",
    isCustom: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "c7777777-7777-4777-8777-777777777777",
    name: "Gadgets / Electronics",
    icon: "Laptop",
    color: "#8B5CF6",
    isCustom: false,
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_CATEGORY_BUDGET_MAP: Record<string, number> = {
  "Housing / Rent": 85000,
  "Groceries & Food": 65000,
  "Utilities & Bills": 30000,
  "Transport & Fuel": 35000,
  "Healthcare": 20000,
  "Entertainment & Leisure": 25000,
  "Gadgets / Electronics": 20000,
};

export const AVAILABLE_ICONS = [
  "Home",
  "Utensils",
  "Zap",
  "Car",
  "HeartPulse",
  "Film",
  "Laptop",
  "PiggyBank",
  "Coffee",
  "ShoppingBag",
  "Dumbbell",
  "Plane",
  "Book",
  "Music",
  "Gift",
  "Wifi",
  "Smartphone",
  "Briefcase",
  "Smile",
  "Shield",
  "GraduationCap",
  "Wrench",
  "Gamepad2",
  "Shirt",
  "Glasses",
  "Baby",
  "Dog",
  "Fuel",
  "Train",
  "Bus",
  "Sparkles",
  "CreditCard",
  "Receipt",
];

export const COLOR_PALETTE = [
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#6366F1", // Indigo
  "#EF4444", // Red
  "#EC4899", // Pink
  "#8B5CF6", // Purple
  "#14B8A6", // Teal
  "#06B6D4", // Cyan
  "#F97316", // Orange
  "#84CC16", // Lime
  "#A855F7", // Violet
  "#E11D48", // Rose
  "#64748B", // Slate
  "#0284C7", // Sky
  "#D97706", // Ochre
];

export const DEFAULT_BASELINE_BUDGET = 300000; // LKR 300,000
