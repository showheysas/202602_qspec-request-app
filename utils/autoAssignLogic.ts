import { getWindowContacts, getCreatorContacts } from './contactDummyData';

interface WindowAssignment {
  windowDepartment: string;
  windowContacts: string[];
}

interface CreatorAssignment {
  creatorDepartment: string;
  creators: string[];
}

/**
 * 事業分類（businessTypes）× カテゴリ分類（categories）から窓口担当者を自動判定
 */
export function assignWindowContact(
  businessTypes: string[],
  categories: string[]
): WindowAssignment {
  const windowContacts = getWindowContacts();
  const selectedContacts = new Set<string>();
  let department = '';

  // businessTypesループ
  for (const businessType of businessTypes) {
    let businessTypeKey = '';

    // businessTypeを識別子に変換
    if (businessType === '業務用') {
      businessTypeKey = 'business';
    } else if (businessType === '家庭用') {
      businessTypeKey = 'household';
    } else if (businessType === 'その他') {
      businessTypeKey = 'other';
    }

    // categoriesループ
    for (const category of categories) {
      const matching = windowContacts.filter((contact) => {
        // businessTypeが'other'の場合のみ比較が異なる
        if (businessTypeKey === 'other') {
          return contact.category === category;
        }
        return contact.businessType === businessTypeKey && contact.category === category;
      });

      if (matching.length > 0 && !department) {
        department = matching[0].department;
      }

      matching.forEach((contact) => {
        selectedContacts.add(contact.name);
      });
    }
  }

  return {
    windowDepartment: department,
    windowContacts: Array.from(selectedContacts),
  };
}

/**
 * カテゴリ分類（categories）× 作成文書種別（documentTypes）から作成担当者を自動判定
 */
export function assignCreator(
  categories: string[],
  documentTypes: string[]
): CreatorAssignment {
  const creatorContacts = getCreatorContacts();
  const selectedContacts = new Set<string>();
  let department = '';

  // documentTypesループ
  for (const docType of documentTypes) {
    let docTypeKey = '';

    // documentTypeを識別子に変換
    if (docType === '商品規格書／商品カルテ') {
      docTypeKey = 'specification';
    } else if (docType === 'eBASE' || docType === '各種証明書') {
      docTypeKey = 'ebase_cert';
    }

    // categoriesループ
    for (const category of categories) {
      let matching: typeof creatorContacts = [];

      if (docTypeKey === 'specification') {
        matching = creatorContacts.filter(
          (contact) => contact.documentType === 'specification' && contact.category === category
        );
      } else if (docTypeKey === 'ebase_cert') {
        matching = creatorContacts.filter(
          (contact) =>
            (contact.documentType === 'ebase' || contact.documentType === 'certificate') &&
            contact.category === category
        );
      }

      if (matching.length > 0 && !department) {
        department = matching[0].department;
      }

      matching.forEach((contact) => {
        selectedContacts.add(contact.name);
      });
    }
  }

  return {
    creatorDepartment: department,
    creators: Array.from(selectedContacts),
  };
}
