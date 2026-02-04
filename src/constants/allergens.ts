/**
 * EU Regulation 1169/2011 - Annex II: The 14 Mandatory Food Allergens
 * These allergens must be declared on food labels when present.
 */

export type AllergenId = 
  | 'gluten'
  | 'crustaceans'
  | 'eggs'
  | 'fish'
  | 'peanuts'
  | 'soybeans'
  | 'milk'
  | 'tree_nuts'
  | 'celery'
  | 'mustard'
  | 'sesame'
  | 'sulphites'
  | 'lupin'
  | 'molluscs';

export interface Allergen {
  id: AllergenId;
  // English labels (Phase 1 - hardcoded EN; Phase 2 will add i18n keys)
  label: {
    en: string;
    // Reserved for Phase 2 i18n:
    // de: string;
    // fr: string;
    // es: string;
  };
}

/**
 * The 14 EU-mandated allergens with stable IDs and English labels.
 * Phase 2 will add multilingual support via i18next.
 */
export const EU_ALLERGENS: Allergen[] = [
  { id: 'gluten', label: { en: 'Cereals containing gluten (wheat, rye, barley, oats)' } },
  { id: 'crustaceans', label: { en: 'Crustaceans' } },
  { id: 'eggs', label: { en: 'Eggs' } },
  { id: 'fish', label: { en: 'Fish' } },
  { id: 'peanuts', label: { en: 'Peanuts' } },
  { id: 'soybeans', label: { en: 'Soybeans' } },
  { id: 'milk', label: { en: 'Milk and dairy products' } },
  { id: 'tree_nuts', label: { en: 'Tree nuts' } },
  { id: 'celery', label: { en: 'Celery' } },
  { id: 'mustard', label: { en: 'Mustard' } },
  { id: 'sesame', label: { en: 'Sesame seeds' } },
  { id: 'sulphites', label: { en: 'Sulphur dioxide and sulphites' } },
  { id: 'lupin', label: { en: 'Lupin' } },
  { id: 'molluscs', label: { en: 'Molluscs' } },
];

/**
 * Get allergen by ID
 */
export const getAllergenById = (id: AllergenId): Allergen | undefined => {
  return EU_ALLERGENS.find((allergen) => allergen.id === id);
};

/**
 * Get allergen label in English (Phase 1)
 * Phase 2: Will accept locale parameter and use i18next
 */
export const getAllergenLabel = (id: AllergenId): string => {
  const allergen = getAllergenById(id);
  return allergen?.label.en ?? id;
};
