import { RecipeIngredient, SupplementInfo } from '../types';

/**
 * ICMR-NIN Reference Nutrition Ingredients (Educational Reference Constants Only — Not User Data)
 */
export const commonFoodIngredients: RecipeIngredient[] = [
  { id: 'ing-1', name: 'Whole Wheat Atta (Flour)', quantity: 100, unit: 'g', caloriesPerUnit: 3.4, proteinPerUnit: 0.12, carbsPerUnit: 0.71, fatPerUnit: 0.02, fiberPerUnit: 0.11, sodiumPerUnit: 0.05 },
  { id: 'ing-2', name: 'Toor Dal (Yellow Pigeon Peas)', quantity: 100, unit: 'g', caloriesPerUnit: 3.35, proteinPerUnit: 0.22, carbsPerUnit: 0.58, fatPerUnit: 0.015, fiberPerUnit: 0.15, sodiumPerUnit: 0.1 },
  { id: 'ing-3', name: 'White Basmati Rice (Raw)', quantity: 100, unit: 'g', caloriesPerUnit: 3.5, proteinPerUnit: 0.07, carbsPerUnit: 0.78, fatPerUnit: 0.005, fiberPerUnit: 0.015, sodiumPerUnit: 0.02 },
  { id: 'ing-4', name: 'Fresh Paneer (Cottage Cheese)', quantity: 100, unit: 'g', caloriesPerUnit: 2.65, proteinPerUnit: 0.18, carbsPerUnit: 0.03, fatPerUnit: 0.20, fiberPerUnit: 0.0, sodiumPerUnit: 0.22 },
  { id: 'ing-5', name: 'Cooking Oil / Ghee', quantity: 15, unit: 'g', caloriesPerUnit: 9.0, proteinPerUnit: 0.0, carbsPerUnit: 0.0, fatPerUnit: 1.0, fiberPerUnit: 0.0, sodiumPerUnit: 0.0 },
  { id: 'ing-6', name: 'Onion & Tomatoes', quantity: 150, unit: 'g', caloriesPerUnit: 0.35, proteinPerUnit: 0.012, carbsPerUnit: 0.075, fatPerUnit: 0.002, fiberPerUnit: 0.02, sodiumPerUnit: 0.05 },
  { id: 'ing-7', name: 'Spinach (Palak) / Green Veggies', quantity: 100, unit: 'g', caloriesPerUnit: 0.23, proteinPerUnit: 0.029, carbsPerUnit: 0.036, fatPerUnit: 0.004, fiberPerUnit: 0.022, sodiumPerUnit: 0.8 },
  { id: 'ing-8', name: 'Egg (Whole, Large)', quantity: 1, unit: 'piece', caloriesPerUnit: 74, proteinPerUnit: 6.3, carbsPerUnit: 0.4, fatPerUnit: 5.0, fiberPerUnit: 0.0, sodiumPerUnit: 70 },
  { id: 'ing-9', name: 'Toned Cow Milk', quantity: 200, unit: 'ml', caloriesPerUnit: 0.6, proteinPerUnit: 0.032, carbsPerUnit: 0.048, fatPerUnit: 0.03, fiberPerUnit: 0.0, sodiumPerUnit: 0.5 },
  { id: 'ing-10', name: 'Banana', quantity: 1, unit: 'piece', caloriesPerUnit: 89, proteinPerUnit: 1.1, carbsPerUnit: 23, fatPerUnit: 0.3, fiberPerUnit: 2.6, sodiumPerUnit: 1.0 }
];

/**
 * Peer-Reviewed Educational Supplement Reference Library (NIH / WHO / ICMR-NIN)
 */
export const educationalSupplements: SupplementInfo[] = [
  {
    id: 'sup-creatine',
    name: 'Creatine Monohydrate',
    category: 'muscle',
    commonUses: 'Muscular strength, high-intensity exercise recovery, and muscle mass support.',
    evidenceStrength: 'Strong',
    plainSummary: 'Creatine helps cells recycle adenosine triphosphate (ATP), the primary energy currency for quick bursts of movement. It is one of the most rigorously researched sports supplements.',
    potentialRisks: [
      'Temporary water weight gain during the initial week.',
      'Mild stomach discomfort or cramping if taken without sufficient water.'
    ],
    medicationInteractions: [
      'Caution with nephrotoxic medications (drugs that stress the kidneys) like high-dose NSAID painkillers (e.g., Ibuprofen).'
    ],
    verifiedSources: [
      { organization: 'International Society of Sports Nutrition (ISSN)', year: 2017, topic: 'Position stand on Creatine' },
      { organization: 'Cochrane Systematic Reviews', year: 2018, topic: 'Creatine supplementation in muscle strength' }
    ]
  },
  {
    id: 'sup-whey',
    name: 'Whey Protein Powder',
    category: 'muscle',
    commonUses: 'Convenient dietary protein intake, muscle protein synthesis, and workout recovery.',
    evidenceStrength: 'Strong',
    plainSummary: 'Derived from dairy during cheese making. It contains all essential amino acids, including leucine, which triggers muscle repair after physical exercise.',
    potentialRisks: [
      'Bloating, gas, or nausea in individuals with lactose intolerance (Whey Isolate contains much less lactose).',
      'Does not provide unique benefits over regular high-protein dietary foods like eggs, lentils, or paneer.'
    ],
    medicationInteractions: [
      'May reduce absorption of some antibiotics (e.g., Quinolones, Tetracyclines) or levodopa if taken simultaneously.'
    ],
    verifiedSources: [
      { organization: 'American College of Sports Medicine (ACSM)', year: 2022, topic: 'Protein intake guidelines for active individuals' },
      { organization: 'Indian Council of Medical Research (ICMR-NIN)', year: 2024, topic: 'Dietary Guidelines on protein powders' }
    ]
  },
  {
    id: 'sup-vitd3',
    name: 'Vitamin D3 (Cholecalciferol)',
    category: 'bones',
    commonUses: 'Bone density, calcium absorption, immune system balance, and mood regulation.',
    evidenceStrength: 'Strong',
    plainSummary: 'Synthesized in skin through sunlight exposure. Essential for preventing osteomalacia and osteoporosis in older adults. Highly prevalent deficiency in desk workers.',
    potentialRisks: [
      'Hypercalcemia (too much calcium in blood) if megadoses (e.g., 60,000 IU) are taken daily without medical supervision.',
      'Nausea, weakness, and kidney stone risk with prolonged extreme excess.'
    ],
    medicationInteractions: [
      'Interacts with Thiazide diuretics (can raise calcium dangerously) and Digoxin (heart rhythm medication).'
    ],
    verifiedSources: [
      { organization: 'National Institutes of Health (NIH) Office of Dietary Supplements', year: 2024, topic: 'Vitamin D Health Professional Fact Sheet' },
      { organization: 'Endocrine Society Guidelines', year: 2021, topic: 'Vitamin D deficiency treatment protocols' }
    ]
  },
  {
    id: 'sup-vitb12',
    name: 'Vitamin B12 (Cobalamin / Methylcobalamin)',
    category: 'general',
    commonUses: 'Nerve function, red blood cell synthesis, and cognitive clarity. Crucial for vegetarians and seniors.',
    evidenceStrength: 'Strong',
    plainSummary: 'Vitamin B12 is found naturally almost exclusively in animal foods. Pure vegetarian and vegan diets usually require fortified foods or supplements to avoid neuropathy and anemia.',
    potentialRisks: [
      'Water soluble and generally very safe; excess is filtered through urine.',
      'Mild skin rash or acne outbreaks in rare sensitive individuals.'
    ],
    medicationInteractions: [
      'Metformin (diabetes medicine) and Omeprazole/Pantoprazole (acid reflux medicines) decrease B12 absorption over time.'
    ],
    verifiedSources: [
      { organization: 'World Health Organization (WHO)', year: 2023, topic: 'Nutritional Anemias and Vitamin B12 recommendations' },
      { organization: 'National Health Service (NHS UK)', year: 2024, topic: 'Vitamin B12 deficiency guide' }
    ]
  },
  {
    id: 'sup-omega3',
    name: 'Omega-3 Fatty Acids (EPA & DHA)',
    category: 'general',
    commonUses: 'Cardiovascular triglyceride reduction, anti-inflammatory support, and joint comfort.',
    evidenceStrength: 'Moderate',
    plainSummary: 'Polyunsaturated fatty acids found in fatty fish, algae, and flaxseed. Helps reduce high blood triglycerides and supports cell membrane integrity.',
    potentialRisks: [
      'Fishy aftertaste, heartburn, or loose stools.',
      'May mildly increase bleeding time at doses exceeding 3 to 4 grams per day.'
    ],
    medicationInteractions: [
      'Blood thinners (Warfarin, Clopidogrel, Aspirin) – increases risk of bleeding or bruising; always consult your prescribing physician.'
    ],
    verifiedSources: [
      { organization: 'American Heart Association (AHA)', year: 2021, topic: 'Omega-3 fatty acids for cardiovascular risk reduction' },
      { organization: 'Cochrane Systematic Reviews', year: 2020, topic: 'Omega-3 intake and cardiovascular disease' }
    ]
  },
  {
    id: 'sup-biotin',
    name: 'Biotin (Vitamin B7)',
    category: 'hair-skin',
    commonUses: 'Marketed for brittle nails and thinning hair.',
    evidenceStrength: 'Limited',
    plainSummary: 'Biotin aids enzymes involved in fat, protein, and carb metabolism. Genuine deficiency is rare. There is limited high-quality evidence that it improves hair growth in people who are not clinically deficient.',
    potentialRisks: [
      'IMPORTANT: High-dose Biotin supplements can cause dangerously false laboratory results in thyroid tests (TSH) and cardiac troponin tests (used to detect heart attacks).'
    ],
    medicationInteractions: [
      'Interferes with diagnostic blood assay markers. Stop taking biotin at least 48-72 hours before laboratory blood draws.'
    ],
    verifiedSources: [
      { organization: 'U.S. Food and Drug Administration (FDA)', year: 2022, topic: 'Safety alert: Biotin interference with lab tests' },
      { organization: 'Journal of the American Academy of Dermatology', year: 2019, topic: 'Biotin for hair and nail growth review' }
    ]
  },
  {
    id: 'sup-ashwagandha',
    name: 'Ashwagandha (Withania Somnifera)',
    category: 'general',
    commonUses: 'Stress resilience, sleep quality, and cortisol modulation.',
    evidenceStrength: 'Moderate',
    plainSummary: 'A traditional Ayurvedic adaptogenic herb. Controlled clinical trials have shown modest reductions in perceived stress scores and morning cortisol levels in stressed adults.',
    potentialRisks: [
      'Mild gastrointestinal upset, drowsiness, or headache.',
      'Rare reports of liver sensitivity with contaminated or unregulated extract products.'
    ],
    medicationInteractions: [
      'Sedatives or anti-anxiety medications (additive sleepiness).',
      'Thyroid hormone replacement (may alter circulating thyroid hormone levels).'
    ],
    verifiedSources: [
      { organization: 'National Center for Complementary and Integrative Health (NCCIH)', year: 2023, topic: 'Ashwagandha research summary' },
      { organization: 'Ministry of Ayush (Govt. of India)', year: 2022, topic: 'Ayurvedic Pharmacopoeia safety guidelines' }
    ]
  }
];
