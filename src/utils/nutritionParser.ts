/**
 * Indian Household Serving-Unit & Nutrition NLP Parser (ICMR-NIN calibrated)
 * Converts natural language meal entries (e.g. "1 katori dal, 2 rotis")
 * into accurate gram equivalents and macro estimates.
 */

import { RecipeIngredient } from '../types';

export interface ParsedFoodEntry {
  id: string;
  name: string;
  servingLabel: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  ingredient: RecipeIngredient;
}

export interface IndianFoodReference {
  key: string;
  name: string;
  aliases: string[];
  defaultUnit: string;
  defaultUnitGrams: number;
  /** Nutrition per 100g cooked/edible portion (ICMR-NIN / IFCT 2017 benchmarks) */
  per100g: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sodium: number;
  };
}

/** Standard Indian household measure weights in grams */
export const HOUSEHOLD_UNIT_GRAMS: Record<string, number> = {
  katori: 150,
  katoris: 150,
  bowl: 150,
  bowls: 150,
  roti: 35,
  rotis: 35,
  chapati: 35,
  chapatis: 35,
  chapatti: 35,
  chapattis: 35,
  phulka: 35,
  phulkas: 35,
  paratha: 75,
  parathas: 75,
  parantha: 75,
  paranthas: 75,
  idli: 40,
  idlis: 40,
  dosa: 100,
  dosas: 100,
  cup: 240,
  cups: 240,
  glass: 240,
  glasses: 240,
  tbsp: 15,
  tablespoon: 15,
  tablespoons: 15,
  tsp: 5,
  teaspoon: 5,
  teaspoons: 5,
  slice: 30,
  slices: 30,
  plate: 200,
  plates: 200,
  scoop: 30,
  scoops: 30,
  piece: 50,
  pieces: 50,
  pc: 50,
  pcs: 50,
  g: 1,
  gm: 1,
  gms: 1,
  gram: 1,
  grams: 1,
  ml: 1
};

/**
 * Calibrated Indian cooked & staple foods (ICMR-NIN IFCT benchmarks per 100g)
 */
export const INDIAN_FOOD_DATABASE: IndianFoodReference[] = [
  {
    key: 'dal',
    name: 'Cooked Toor / Yellow Dal',
    aliases: ['dal', 'daal', 'dhal', 'toor dal', 'moong dal', 'masoor dal', 'chana dal', 'lentil', 'sambar', 'sambhar', 'rajma', 'chole'],
    defaultUnit: 'katori',
    defaultUnitGrams: 150,
    per100g: { calories: 95, protein: 5.5, carbs: 14.5, fat: 1.6, fiber: 3.8, sodium: 210 }
  },
  {
    key: 'roti',
    name: 'Whole Wheat Roti / Phulka',
    aliases: ['roti', 'rotis', 'chapati', 'chapatis', 'chapatti', 'chapattis', 'phulka', 'phulkas', 'atta'],
    defaultUnit: 'roti',
    defaultUnitGrams: 35,
    per100g: { calories: 285, protein: 9.2, carbs: 56.5, fat: 2.2, fiber: 8.5, sodium: 180 }
  },
  {
    key: 'paratha',
    name: 'Whole Wheat Paratha',
    aliases: ['paratha', 'parathas', 'parantha', 'paranthas', 'aloo paratha', 'gobi paratha'],
    defaultUnit: 'paratha',
    defaultUnitGrams: 75,
    per100g: { calories: 315, protein: 7.4, carbs: 46.0, fat: 11.2, fiber: 5.8, sodium: 290 }
  },
  {
    key: 'rice',
    name: 'Steamed Rice (Cooked)',
    aliases: ['rice', 'chawal', 'basmati', 'pulao', 'khichdi', 'jeera rice'],
    defaultUnit: 'katori',
    defaultUnitGrams: 150,
    per100g: { calories: 130, protein: 2.7, carbs: 28.2, fat: 0.3, fiber: 0.6, sodium: 15 }
  },
  {
    key: 'idli',
    name: 'Steamed Idli',
    aliases: ['idli', 'idlis', 'idly'],
    defaultUnit: 'idli',
    defaultUnitGrams: 40,
    per100g: { calories: 145, protein: 4.5, carbs: 29.0, fat: 0.8, fiber: 1.8, sodium: 220 }
  },
  {
    key: 'dosa',
    name: 'Plain Dosa',
    aliases: ['dosa', 'dosas', 'masala dosa', 'uttapam'],
    defaultUnit: 'dosa',
    defaultUnitGrams: 100,
    per100g: { calories: 175, protein: 4.2, carbs: 28.5, fat: 4.8, fiber: 2.0, sodium: 280 }
  },
  {
    key: 'poha',
    name: 'Vegetable Poha',
    aliases: ['poha', 'upma', 'dalia'],
    defaultUnit: 'katori',
    defaultUnitGrams: 150,
    per100g: { calories: 135, protein: 3.1, carbs: 24.5, fat: 2.8, fiber: 2.2, sodium: 240 }
  },
  {
    key: 'paneer',
    name: 'Fresh Paneer (Cottage Cheese)',
    aliases: ['paneer', 'cottage cheese', 'palak paneer', 'matar paneer'],
    defaultUnit: 'g',
    defaultUnitGrams: 100,
    per100g: { calories: 265, protein: 18.3, carbs: 3.2, fat: 20.5, fiber: 0.0, sodium: 22 }
  },
  {
    key: 'sabzi',
    name: 'Mixed Vegetable Sabzi / Palak',
    aliases: ['sabzi', 'sabji', 'subzi', 'palak', 'spinach', 'bhindi', 'gobhi', 'lauki', 'veggies', 'vegetables', 'curry', 'salad', 'greens'],
    defaultUnit: 'katori',
    defaultUnitGrams: 150,
    per100g: { calories: 72, protein: 2.6, carbs: 8.5, fat: 3.1, fiber: 3.4, sodium: 230 }
  },
  {
    key: 'curd',
    name: 'Plain Curd / Dahi',
    aliases: ['curd', 'dahi', 'yogurt', 'yoghurt', 'raita', 'buttermilk', 'chaas'],
    defaultUnit: 'katori',
    defaultUnitGrams: 150,
    per100g: { calories: 62, protein: 3.5, carbs: 4.8, fat: 3.2, fiber: 0.0, sodium: 45 }
  },
  {
    key: 'milk',
    name: 'Toned Cow Milk',
    aliases: ['milk', 'doodh', 'chai', 'tea'],
    defaultUnit: 'cup',
    defaultUnitGrams: 240,
    per100g: { calories: 60, protein: 3.2, carbs: 4.8, fat: 3.0, fiber: 0.0, sodium: 48 }
  },
  {
    key: 'egg',
    name: 'Whole Egg (Boiled / Omelette)',
    aliases: ['egg', 'eggs', 'anda', 'omelette', 'bhurji'],
    defaultUnit: 'piece',
    defaultUnitGrams: 55,
    per100g: { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5, fiber: 0.0, sodium: 140 }
  },
  {
    key: 'banana',
    name: 'Fresh Banana',
    aliases: ['banana', 'bananas', 'kela'],
    defaultUnit: 'piece',
    defaultUnitGrams: 100,
    per100g: { calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3, fiber: 2.6, sodium: 1 }
  },
  {
    key: 'oats',
    name: 'Rolled Oats (Cooked Porridge)',
    aliases: ['oats', 'oatmeal', 'porridge'],
    defaultUnit: 'bowl',
    defaultUnitGrams: 150,
    per100g: { calories: 71, protein: 2.5, carbs: 12.0, fat: 1.5, fiber: 1.7, sodium: 49 }
  },
  {
    key: 'ghee',
    name: 'Ghee / Cooking Oil',
    aliases: ['ghee', 'oil', 'butter', 'olive oil', 'mustard oil'],
    defaultUnit: 'tsp',
    defaultUnitGrams: 5,
    per100g: { calories: 900, protein: 0.0, carbs: 0.0, fat: 100.0, fiber: 0.0, sodium: 0 }
  },
  {
    key: 'chicken',
    name: 'Grilled / Curry Chicken',
    aliases: ['chicken', 'murgh'],
    defaultUnit: 'g',
    defaultUnitGrams: 100,
    per100g: { calories: 165, protein: 26.0, carbs: 0.0, fat: 6.2, fiber: 0.0, sodium: 75 }
  },
  {
    key: 'bread',
    name: 'Whole Wheat Bread Slice',
    aliases: ['bread', 'toast', 'slice'],
    defaultUnit: 'slice',
    defaultUnitGrams: 30,
    per100g: { calories: 250, protein: 9.0, carbs: 46.0, fat: 3.2, fiber: 6.0, sodium: 420 }
  }
];

const NUMBER_WORDS: Record<string, number> = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  half: 0.5,
  quarter: 0.25
};

/**
 * Converts a quantity + optional unit string + matched food reference into exact grams
 */
export function convertServingToGrams(
  quantity: number,
  unitToken: string | null,
  food: IndianFoodReference
): { grams: number; servingLabel: string } {
  const safeQty = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
  const normalizedUnit = unitToken ? unitToken.toLowerCase().trim() : null;

  // Explicit gram / ml measurement
  if (normalizedUnit && ['g', 'gm', 'gms', 'gram', 'grams', 'ml'].includes(normalizedUnit)) {
    return {
      grams: Math.round(safeQty),
      servingLabel: `${Math.round(safeQty)}${normalizedUnit === 'ml' ? 'ml' : 'g'}`
    };
  }

  // Known household unit explicitly mentioned (e.g. "1 katori", "2 tbsp", "1 cup")
  if (normalizedUnit && HOUSEHOLD_UNIT_GRAMS[normalizedUnit] !== undefined) {
    // Special case: "piece" uses the food's standard item weight (e.g. banana=100g, egg=55g, roti=35g)
    const unitGrams =
      normalizedUnit === 'piece' || normalizedUnit === 'pieces' || normalizedUnit === 'pc' || normalizedUnit === 'pcs'
        ? food.defaultUnitGrams
        : HOUSEHOLD_UNIT_GRAMS[normalizedUnit];
    const grams = Math.round(safeQty * unitGrams);
    const labelUnit = normalizedUnit;
    return {
      grams,
      servingLabel: `${safeQty} ${labelUnit} (${grams}g)`
    };
  }

  // No explicit unit -> infer from food's natural serving unit (e.g., "2 rotis" -> 2 * 35g = 70g)
  const grams = Math.round(safeQty * food.defaultUnitGrams);
  const pluralSuffix = safeQty === 1 ? '' : food.defaultUnit.endsWith('s') ? '' : 's';
  const unitDisplay = food.defaultUnit === 'g' ? 'g' : ` ${food.defaultUnit}${pluralSuffix}`;
  return {
    grams,
    servingLabel: food.defaultUnit === 'g' ? `${grams}g` : `${safeQty}${unitDisplay} (${grams}g)`
  };
}

/**
 * Parse a free-form Indian meal description like "1 katori dal, 2 rotis, 1 bowl curd"
 * into accurate RecipeIngredient items calibrated to grams.
 */
export function parseMealDescription(rawInput: string): ParsedFoodEntry[] {
  if (!rawInput || !rawInput.trim()) return [];

  // Split by commas, plus, "and", "&", semicolons, or newlines
  const segments = rawInput
    .split(/,|\+|;|\n|\band\b|&/i)
    .map((s) => s.trim())
    .filter(Boolean);

  const results: ParsedFoodEntry[] = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const lowerSeg = seg.toLowerCase();

    // Find best matching food (longest alias match wins so "aloo paratha" beats "paratha" or "toor dal" beats "dal")
    let bestFood: IndianFoodReference | null = null;
    let bestAliasLen = 0;

    for (const food of INDIAN_FOOD_DATABASE) {
      for (const alias of food.aliases) {
        const aliasRegex = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (aliasRegex.test(lowerSeg) && alias.length > bestAliasLen) {
          bestFood = food;
          bestAliasLen = alias.length;
        }
      }
    }

    if (!bestFood) continue;

    // Parse quantity (decimal, fraction like 1/2, or English word like "two")
    let quantity = 1;
    const fractionMatch = lowerSeg.match(/\b(\d+)\s*\/\s*(\d+)\b/);
    const numMatch = lowerSeg.match(/(\d+(?:\.\d+)?)/);
    if (fractionMatch) {
      const denom = parseFloat(fractionMatch[2]);
      quantity = denom > 0 ? parseFloat(fractionMatch[1]) / denom : 1;
    } else if (numMatch) {
      quantity = parseFloat(numMatch[1]);
    } else {
      for (const [word, val] of Object.entries(NUMBER_WORDS)) {
        if (new RegExp(`\\b${word}\\b`, 'i').test(lowerSeg)) {
          quantity = val;
          break;
        }
      }
    }

    // Parse explicit unit token
    const unitPattern = new RegExp(
      `\\b(${Object.keys(HOUSEHOLD_UNIT_GRAMS).join('|')})\\b`,
      'i'
    );
    const unitMatch = lowerSeg.match(unitPattern);
    // Also detect attached grams/ml like "150g" or "200ml"
    const attachedUnitMatch = lowerSeg.match(/\d+(?:\.\d+)?\s*(gms?|grams?|g|ml)\b/i);
    const unitToken = attachedUnitMatch ? attachedUnitMatch[1] : unitMatch ? unitMatch[1] : null;

    const { grams, servingLabel } = convertServingToGrams(quantity, unitToken, bestFood);
    const factor = grams / 100;

    const calories = Math.round(bestFood.per100g.calories * factor);
    const protein = Number((bestFood.per100g.protein * factor).toFixed(1));
    const carbs = Number((bestFood.per100g.carbs * factor).toFixed(1));
    const fat = Number((bestFood.per100g.fat * factor).toFixed(1));
    const fiber = Number((bestFood.per100g.fiber * factor).toFixed(1));
    const sodium = Math.round(bestFood.per100g.sodium * factor);

    const ingredient: RecipeIngredient = {
      id: `parsed-${bestFood.key}-${Date.now()}-${i}`,
      name: `${bestFood.name} [${servingLabel}]`,
      quantity: grams,
      unit: 'g',
      caloriesPerUnit: bestFood.per100g.calories / 100,
      proteinPerUnit: bestFood.per100g.protein / 100,
      carbsPerUnit: bestFood.per100g.carbs / 100,
      fatPerUnit: bestFood.per100g.fat / 100,
      fiberPerUnit: bestFood.per100g.fiber / 100,
      sodiumPerUnit: bestFood.per100g.sodium / 100
    };

    results.push({
      id: ingredient.id,
      name: bestFood.name,
      servingLabel,
      grams,
      calories,
      protein,
      carbs,
      fat,
      fiber,
      sodium,
      ingredient
    });
  }

  return results;
}
