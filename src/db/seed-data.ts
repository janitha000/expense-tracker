import { DEFAULT_CATEGORIES } from "@/lib/constants";
import { Category, Expense } from "@/lib/types";

// Clean expense store with no dummy data
export function generateSeedExpenses(_categories: Category[] = DEFAULT_CATEGORIES): Expense[] {
  return [];
}
