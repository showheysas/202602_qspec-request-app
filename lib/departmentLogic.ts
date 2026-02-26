import { AlcoholCategory, Department } from './types';

/**
 * Determines the appropriate department and owner based on alcohol category
 * Rules:
 * - eBASE → 窓口: 営業統括部 / 担当: 品質保証部
 * - 証明書（SB書式） → 窓口: 流通統括部 / 担当: 品質保証部
 * - 商品規格書（外食） → 窓口: 外食統括部 / 担当: 品質保証部
 * - 商品規格書（流通） → 窓口: 流通統括部 / 担当: 品質保証部
 * - その他 → 窓口: 営業統括部 / 担当: 品質保証部
 */
export function determineDepartment(category: AlcoholCategory): Department {
  switch (category) {
    case AlcoholCategory.EBASE:
      return {
        window: '営業統括部',
        owner: '品質保証部',
      };
    case AlcoholCategory.CERTIFICATE:
      return {
        window: '流通統括部',
        owner: '品質保証部',
      };
    case AlcoholCategory.PRODUCT_SPEC_EXTERNAL:
      return {
        window: '外食統括部',
        owner: '品質保証部',
      };
    case AlcoholCategory.PRODUCT_SPEC_DISTRIBUTION:
      return {
        window: '流通統括部',
        owner: '品質保証部',
      };
    case AlcoholCategory.OTHER:
    default:
      return {
        window: '営業統括部',
        owner: '品質保証部',
      };
  }
}
