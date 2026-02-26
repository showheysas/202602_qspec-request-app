import { WindowContact, CreatorContact } from '@/lib/types/contact';

let windowContactIdCounter = 1;
let creatorContactIdCounter = 1;

function generateWindowContact(
  name: string,
  department: string,
  businessType: 'business' | 'household' | 'other',
  category: string
): WindowContact {
  const id = windowContactIdCounter++;
  const nameWithoutSpaces = name.replace(/\s+/g, '');
  return {
    id: `wc-${id}`,
    name,
    department,
    businessType,
    category,
    email: `${nameWithoutSpaces.toLowerCase()}@example.com`,
  };
}

function generateCreatorContact(
  name: string,
  department: string,
  category: string,
  documentType: 'specification' | 'ebase' | 'certificate'
): CreatorContact {
  const id = creatorContactIdCounter++;
  const nameWithoutSpaces = name.replace(/\s+/g, '');
  return {
    id: `cc-${id}`,
    name,
    department,
    category,
    documentType,
    email: `${nameWithoutSpaces.toLowerCase()}@example.com`,
  };
}

export function getWindowContacts(): WindowContact[] {
  return [
    // 家庭用 × ビールテイスト
    generateWindowContact('保科GL', '流通統括部', 'household', 'ビールテイスト'),
    generateWindowContact('山内', '流通統括部', 'household', 'ビールテイスト'),
    generateWindowContact('大森', '流通統括部', 'household', 'ビールテイスト'),
    generateWindowContact('葛原', '流通統括部', 'household', 'ビールテイスト'),
    
    // 家庭用 × RTD
    generateWindowContact('保科GL', '流通統括部', 'household', 'RTD'),
    generateWindowContact('市川', '流通統括部', 'household', 'RTD'),
    generateWindowContact('堀内', '流通統括部', 'household', 'RTD'),
    
    // 家庭用 × RTS
    generateWindowContact('保科GL', '流通統括部', 'household', 'RTS'),
    generateWindowContact('市川', '流通統括部', 'household', 'RTS'),
    generateWindowContact('堀内', '流通統括部', 'household', 'RTS'),
    
    // 家庭用 × 和酒
    generateWindowContact('保科GL', '流通統括部', 'household', '和酒'),
    generateWindowContact('佐々木', '流通統括部', 'household', '和酒'),
    
    // 家庭用 × 輸入ワイン・洋酒
    generateWindowContact('保科GL', '流通統括部', 'household', '輸入ワイン・洋酒'),
    generateWindowContact('佐々木', '流通統括部', 'household', '輸入ワイン・洋酒'),
    
    // 家庭用 × 国内製造ワイン・洋酒
    generateWindowContact('保科GL', '流通統括部', 'household', '国内製造ワイン・洋酒'),
    generateWindowContact('佐々木', '流通統括部', 'household', '国内製造ワイン・洋酒'),
    
    // 家庭用 × バカルディ社製品
    generateWindowContact('保科GL', '流通統括部', 'household', 'バカルディ社製品'),
    generateWindowContact('藤田', '流通統括部', 'household', 'バカルディ社製品'),
    
    // 家庭用 × その他
    generateWindowContact('井上GL', '営業統括部', 'household', 'その他'),
    generateWindowContact('工藤', '営業統括部', 'household', 'その他'),
    
    // 業務用 × ビールテイスト
    generateWindowContact('松尾GL', '外食統括部', 'business', 'ビールテイスト'),
    generateWindowContact('萬谷GL', '外食統括部', 'business', 'ビールテイスト'),
    generateWindowContact('内藤', '外食統括部', 'business', 'ビールテイスト'),
    generateWindowContact('三池', '外食統括部', 'business', 'ビールテイスト'),
    generateWindowContact('塚原', '外食統括部', 'business', 'ビールテイスト'),
    generateWindowContact('尾形', '外食統括部', 'business', 'ビールテイスト'),
    
    // 業務用 × RTD
    generateWindowContact('萬谷GL', '外食統括部', 'business', 'RTD'),
    generateWindowContact('平山', '外食統括部', 'business', 'RTD'),
    
    // 業務用 × RTS
    generateWindowContact('萬谷GL', '外食統括部', 'business', 'RTS'),
    generateWindowContact('平山', '外食統括部', 'business', 'RTS'),
    
    // 業務用 × 和酒
    generateWindowContact('萬谷GL', '外食統括部', 'business', '和酒'),
    generateWindowContact('平山', '外食統括部', 'business', '和酒'),
    
    // 業務用 × 輸入ワイン・洋酒
    generateWindowContact('萬谷GL', '外食統括部', 'business', '輸入ワイン・洋酒'),
    generateWindowContact('光石', '外食統括部', 'business', '輸入ワイン・洋酒'),
    
    // 業務用 × 国内製造ワイン・洋酒
    generateWindowContact('萬谷GL', '外食統括部', 'business', '国内製造ワイン・洋酒'),
    generateWindowContact('光石', '外食統括部', 'business', '国内製造ワイン・洋酒'),
    
    // 業務用 × バカルディ社製品
    generateWindowContact('萬谷GL', '外食統括部', 'business', 'バカルディ社製品'),
    generateWindowContact('光石', '外食統括部', 'business', 'バカルディ社製品'),
    
    // 業務用 × その他
    generateWindowContact('井上GL', '営業統括部', 'business', 'その他'),
    generateWindowContact('工藤', '営業統括部', 'business', 'その他'),
  ];
}

export function getCreatorContacts(): CreatorContact[] {
  return [
    // 商品規格書 × ビールテイスト
    generateCreatorContact('桜井GL', '製造部', 'ビールテイスト', 'specification'),
    generateCreatorContact('渡邊', '製造部', 'ビールテイスト', 'specification'),
    generateCreatorContact('石橋', '製造部', 'ビールテイスト', 'specification'),
    generateCreatorContact('小泉', '製造部', 'ビールテイスト', 'specification'),
    
    // 商品規格書 × RTD
    generateCreatorContact('鬼村GL', '製造部', 'RTD', 'specification'),
    generateCreatorContact('宍道GL', '製造部', 'RTD', 'specification'),
    generateCreatorContact('新開', '製造部', 'RTD', 'specification'),
    generateCreatorContact('坂口', '製造部', 'RTD', 'specification'),
    generateCreatorContact('大上', '製造部', 'RTD', 'specification'),
    generateCreatorContact('青山', '製造部', 'RTD', 'specification'),
    
    // 商品規格書 × RTS
    generateCreatorContact('鬼村GL', '製造部', 'RTS', 'specification'),
    generateCreatorContact('宍道GL', '製造部', 'RTS', 'specification'),
    generateCreatorContact('新開', '製造部', 'RTS', 'specification'),
    generateCreatorContact('坂口', '製造部', 'RTS', 'specification'),
    generateCreatorContact('大上', '製造部', 'RTS', 'specification'),
    generateCreatorContact('青山', '製造部', 'RTS', 'specification'),
    
    // 商品規格書 × 和酒
    generateCreatorContact('鬼村GL', '製造部', '和酒', 'specification'),
    generateCreatorContact('宍道GL', '製造部', '和酒', 'specification'),
    generateCreatorContact('新開', '製造部', '和酒', 'specification'),
    generateCreatorContact('坂口', '製造部', '和酒', 'specification'),
    generateCreatorContact('大上', '製造部', '和酒', 'specification'),
    generateCreatorContact('青山', '製造部', '和酒', 'specification'),
    
    // 商品規格書 × 国内製造ワイン・洋酒
    generateCreatorContact('宍道GL', '製造部', '国内製造ワイン・洋酒', 'specification'),
    generateCreatorContact('青山', '製造部', '国内製造ワイン・洋酒', 'specification'),
    
    // 商品規格書 × バカルディ製品
    generateCreatorContact('森井GL', 'W&S事業部', 'バカルディ社製品', 'specification'),
    generateCreatorContact('早野', 'W&S事業部', 'バカルディ社製品', 'specification'),
    
    // 商品規格書 × 輸入ワイン・洋酒
    generateCreatorContact('飯牟禮GL', '品質保証部', '輸入ワイン・洋酒', 'specification'),
    generateCreatorContact('島瀬', '品質保証部', '輸入ワイン・洋酒', 'specification'),
    generateCreatorContact('倉園', '品質保証部', '輸入ワイン・洋酒', 'specification'),
    
    // eBASE × ビールテイスト
    generateCreatorContact('飯牟禮GL', '品質保証部', 'ビールテイスト', 'ebase'),
    generateCreatorContact('蜂須賀', '品質保証部', 'ビールテイスト', 'ebase'),
    generateCreatorContact('倉園', '品質保証部', 'ビールテイスト', 'ebase'),
    
    // eBASE × RTD
    generateCreatorContact('飯牟禮GL', '品質保証部', 'RTD', 'ebase'),
    generateCreatorContact('蜂須賀', '品質保証部', 'RTD', 'ebase'),
    generateCreatorContact('倉園', '品質保証部', 'RTD', 'ebase'),
    
    // eBASE × RTS
    generateCreatorContact('飯牟禮GL', '品質保証部', 'RTS', 'ebase'),
    generateCreatorContact('蜂須賀', '品質保証部', 'RTS', 'ebase'),
    generateCreatorContact('倉園', '品質保証部', 'RTS', 'ebase'),
    
    // eBASE × 和酒
    generateCreatorContact('飯牟禮GL', '品質保証部', '和酒', 'ebase'),
    generateCreatorContact('蜂須賀', '品質保証部', '和酒', 'ebase'),
    generateCreatorContact('倉園', '品質保証部', '和酒', 'ebase'),
    
    // 証明書 × バカルディ製品
    generateCreatorContact('森井GL', 'W&S事業部', 'バカルディ社製品', 'certificate'),
    generateCreatorContact('早野', 'W&S事業部', 'バカルディ社製品', 'certificate'),
    
    // 証明書 × 輸入ワイン・洋酒
    generateCreatorContact('飯牟禮GL', '品質保証部', '輸入ワイン・洋酒', 'certificate'),
    generateCreatorContact('島瀬', '品質保証部', '輸入ワイン・洋酒', 'certificate'),
    generateCreatorContact('倉園', '品質保証部', '輸入ワイン・洋酒', 'certificate'),
  ];
}
