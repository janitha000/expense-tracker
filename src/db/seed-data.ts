import { DEFAULT_CATEGORIES } from "@/lib/constants";
import { Category, Expense, ParentType } from "@/lib/types";
import { format, subMonths } from "date-fns";

export function generateSeedExpenses(categories: Category[] = DEFAULT_CATEGORIES): Expense[] {
  const catMap: Record<string, string> = {};
  for (const c of categories) {
    catMap[c.name] = c.id;
  }

  const housingId = catMap["Housing / Rent"] || categories[0]?.id;
  const foodId = catMap["Groceries & Food"] || categories[1]?.id;
  const utilitiesId = catMap["Utilities & Bills"] || categories[2]?.id;
  const transportId = catMap["Transport & Fuel"] || categories[3]?.id;
  const healthId = catMap["Healthcare"] || categories[4]?.id;
  const entertainmentId = catMap["Entertainment & Leisure"] || categories[5]?.id;
  const gadgetsId = catMap["Gadgets / Electronics"] || categories[6]?.id;
  const savingsId = catMap["Investments / Savings"] || categories[7]?.id;

  const now = new Date();
  const expenses: Expense[] = [];

  // Generate 6 months of data in LKR
  for (let m = 5; m >= 0; m--) {
    const monthDate = subMonths(now, m);
    const yyyyMM = format(monthDate, "yyyy-MM");

    // Monthly Normal recurring baseline (in LKR)
    expenses.push({
      id: `seed-rent-${m}`,
      amount: "85000.00",
      date: `${yyyyMM}-01`,
      categoryId: housingId,
      parentType: "normal",
      note: "Monthly Apartment Lease",
      createdAt: new Date(`${yyyyMM}-01T08:00:00Z`).toISOString(),
    });

    expenses.push({
      id: `seed-util-${m}`,
      amount: "24500.00",
      date: `${yyyyMM}-05`,
      categoryId: utilitiesId,
      parentType: "normal",
      note: "Electricity & Fiber Broadband Bill",
      createdAt: new Date(`${yyyyMM}-05T10:30:00Z`).toISOString(),
    });

    expenses.push({
      id: `seed-groc1-${m}`,
      amount: "18200.00",
      date: `${yyyyMM}-07`,
      categoryId: foodId,
      parentType: "normal",
      note: "Keells Supermarket Groceries",
      createdAt: new Date(`${yyyyMM}-07T14:15:00Z`).toISOString(),
    });

    expenses.push({
      id: `seed-trans1-${m}`,
      amount: "9500.00",
      date: `${yyyyMM}-10`,
      categoryId: transportId,
      parentType: "normal",
      note: "Fuel Octane 95 Refill",
      createdAt: new Date(`${yyyyMM}-10T11:00:00Z`).toISOString(),
    });

    expenses.push({
      id: `seed-groc2-${m}`,
      amount: "19800.00",
      date: `${yyyyMM}-14`,
      categoryId: foodId,
      parentType: "normal",
      note: "Cargills Food City restocking",
      createdAt: new Date(`${yyyyMM}-14T16:45:00Z`).toISOString(),
    });

    expenses.push({
      id: `seed-savings-${m}`,
      amount: "40000.00",
      date: `${yyyyMM}-15`,
      categoryId: savingsId,
      parentType: "normal",
      note: "Treasury Bills & Mutual Fund Plan",
      createdAt: new Date(`${yyyyMM}-15T09:00:00Z`).toISOString(),
    });

    expenses.push({
      id: `seed-dining-${m}`,
      amount: "12400.00",
      date: `${yyyyMM}-18`,
      categoryId: foodId,
      parentType: "normal",
      note: "Family Weekend Dinner at Colombo City Centre",
      createdAt: new Date(`${yyyyMM}-18T19:30:00Z`).toISOString(),
    });

    expenses.push({
      id: `seed-trans2-${m}`,
      amount: "8500.00",
      date: `${yyyyMM}-22`,
      categoryId: transportId,
      parentType: "normal",
      note: "Highway Toll & Fuel",
      createdAt: new Date(`${yyyyMM}-22T08:30:00Z`).toISOString(),
    });

    expenses.push({
      id: `seed-groc3-${m}`,
      amount: "14600.00",
      date: `${yyyyMM}-25`,
      categoryId: foodId,
      parentType: "normal",
      note: "Local Fresh Market Produce",
      createdAt: new Date(`${yyyyMM}-25T11:20:00Z`).toISOString(),
    });

    // Specific One-Time Spike Expenses in various months in LKR
    if (m === 0) {
      // Current Month
      expenses.push({
        id: `seed-onetime-cur1`,
        amount: "38500.00",
        date: `${yyyyMM}-08`,
        categoryId: gadgetsId,
        parentType: "one_time",
        note: "ANC Wireless Headphones",
        createdAt: new Date(`${yyyyMM}-08T15:20:00Z`).toISOString(),
      });
      expenses.push({
        id: `seed-onetime-cur2`,
        amount: "18000.00",
        date: `${yyyyMM}-16`,
        categoryId: entertainmentId,
        parentType: "one_time",
        note: "Musical concert tickets & refreshments",
        createdAt: new Date(`${yyyyMM}-16T20:00:00Z`).toISOString(),
      });
    } else if (m === 1) {
      expenses.push({
        id: `seed-onetime-m1`,
        amount: "58000.00",
        date: `${yyyyMM}-12`,
        categoryId: transportId,
        parentType: "one_time",
        note: "Full Vehicle Service & Brake Pads",
        createdAt: new Date(`${yyyyMM}-12T13:00:00Z`).toISOString(),
      });
    } else if (m === 2) {
      expenses.push({
        id: `seed-onetime-m2`,
        amount: "42000.00",
        date: `${yyyyMM}-19`,
        categoryId: healthId,
        parentType: "one_time",
        note: "Dental Root Canal & Clinic Checkup",
        createdAt: new Date(`${yyyyMM}-19T10:00:00Z`).toISOString(),
      });
    } else if (m === 4) {
      expenses.push({
        id: `seed-onetime-m4`,
        amount: "92000.00",
        date: `${yyyyMM}-09`,
        categoryId: gadgetsId,
        parentType: "one_time",
        note: "Home Office Ergonomic Display & Chair",
        createdAt: new Date(`${yyyyMM}-09T18:00:00Z`).toISOString(),
      });
    }
  }

  return expenses;
}
