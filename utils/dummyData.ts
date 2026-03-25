import {
  RequestData,
  RequestStatus,
  DocumentType,
  Comment,
  CompletedDocument,
  StatusHistory,
  ProductEntry,
  EbaseDetails,
  CertificateDetails,
} from '@/lib/types';
import { assignWindowContact, assignCreator } from './autoAssignLogic';

const DUMMY_REQUESTERS = [
  { name: '田中太郎', email: 'tanaka@example.com' },
  { name: '佐藤花子', email: 'sato@example.com' },
  { name: '鈴木一郎', email: 'suzuki@example.com' },
  { name: '高橋美咲', email: 'takahashi@example.com' },
  { name: '渡辺健太', email: 'watanabe@example.com' },
];

function createInProgressComments(
  id: string,
  documentType: string,
  productNames: string,
  submissionDestination: string,
  submissionDeadline: string,
  windowContactName: string,
  creatorName: string,
): Comment[] {
  return [
    {
      id: `${id}-c0`,
      author: windowContactName,
      timestamp: new Date('2026-01-17T09:00:00'),
      content: `${productNames}の${documentType}の作成依頼です。提出先は${submissionDestination}、提出期限は${submissionDeadline}となっております。ご対応よろしくお願いします。`,
    },
    {
      id: `${id}-c1`,
      author: windowContactName,
      timestamp: new Date('2026-01-17T10:00:00'),
      content: `${documentType}の作成をお願いします。提出期限が近いため、お早めに対応いただけますと幸いです。`,
    },
    {
      id: `${id}-c2`,
      author: creatorName,
      timestamp: new Date('2026-01-17T11:30:00'),
      content: `承りました。${documentType}の作成を開始します。内容を確認次第、ご連絡します。`,
    },
    {
      id: `${id}-c3`,
      author: creatorName,
      timestamp: new Date('2026-01-18T11:15:00'),
      content: '作成中に気になる点がございます。原材料の記載について詳細を教えていただけますか？',
    },
    {
      id: `${id}-c4`,
      author: windowContactName,
      timestamp: new Date('2026-01-18T14:45:00'),
      content: 'ご確認ありがとうございます。原材料の詳細は別途メールでお送りします。',
    },
  ];
}

export function getWindowContactRequests(): RequestData[] {
  const requests: RequestData[] = [];

  const windowContactRequests: Array<{
    products: ProductEntry[];
    categories: string[];
    businessTypes: string[];
    submissionDestination: string;
    submissionDeadline: string;
    documentType: string;
    ebaseDetails?: EbaseDetails;
    certificateDetails?: CertificateDetails;
  }> = [
    {
      products: [{ name: '黒ラベル350ml', code: 'BL17' }],
      categories: ['ビールテイスト'],
      businessTypes: ['家庭用'],
      submissionDestination: '〇〇商社',
      submissionDeadline: '2026-01-22',
      documentType: '商品規格書／商品カルテ',
    },
    {
      products: [{ name: 'ヱビスビール（2026年リニューアル）', code: 'EB43' }],
      categories: ['ビールテイスト'],
      businessTypes: ['家庭用', '業務用'],
      submissionDestination: '△△流通',
      submissionDeadline: '2026-01-25',
      documentType: '商品規格書／商品カルテ',
    },
    {
      products: [{ name: 'サッポロ生ビール黒ラベル 樽20L', code: 'BD58' }],
      categories: ['ビールテイスト'],
      businessTypes: ['業務用'],
      submissionDestination: '□□外食',
      submissionDeadline: '2026-01-28',
      documentType: '各種証明書',
      certificateDetails: {
        destName: '株式会社□□外食サービス',
        certType: 'アレルゲン不使用証明書（特定原材料7品目）',
        copies: '2部',
        sealRequired: '要',
        originalNeeded: 'あり',
        shipTo: '大阪支社 業務営業部 中村健一',
      },
    },
    {
      products: [{ name: '男梅サワー', code: 'UM92' }],
      categories: ['RTD'],
      businessTypes: ['家庭用'],
      submissionDestination: '〇〇商社',
      submissionDeadline: '2026-01-20',
      documentType: '商品規格書／商品カルテ',
    },
    {
      products: [{ name: '濃いめのレモンサワーの素', code: 'KL36' }],
      categories: ['RTS'],
      businessTypes: ['家庭用'],
      submissionDestination: '◇◇商社',
      submissionDeadline: '2026-01-23',
      documentType: '商品規格書／商品カルテ',
    },
    {
      products: [{ name: 'こいむぎ', code: 'KM74' }],
      categories: ['和酒'],
      businessTypes: ['業務用'],
      submissionDestination: '■■外食',
      submissionDeadline: '2026-01-26',
      documentType: '商品規格書／商品カルテ',
    },
    {
      products: [{ name: 'バカルディ スペリオール', code: 'BS21' }],
      categories: ['バカルディ社製品'],
      businessTypes: ['家庭用'],
      submissionDestination: '▲▲商社',
      submissionDeadline: '2026-01-21',
      documentType: '各種証明書',
      certificateDetails: {
        destName: '株式会社▲▲商社',
        certType: '原産地証明書',
        copies: '1部',
        sealRequired: '否',
        originalNeeded: 'なし',
        shipTo: '',
      },
    },
    {
      products: [{ name: 'デュワーズホワイトラベル', code: 'DW85' }],
      categories: ['輸入ワイン・洋酒'],
      businessTypes: ['業務用'],
      submissionDestination: '★★外食',
      submissionDeadline: '2026-01-27',
      documentType: '商品規格書／商品カルテ',
    },
    {
      products: [{ name: 'サンタ・リタ　スリー・メダルズ　メルロー', code: 'SR49' }],
      categories: ['輸入ワイン・洋酒'],
      businessTypes: ['家庭用'],
      submissionDestination: '◆◆商社',
      submissionDeadline: '2026-01-24',
      documentType: 'eBASE',
      ebaseDetails: {
        productName: 'サンタ・リタ スリー・メダルズ メルロー 750ml',
        specLink: 'https://internal.example.com/specs/santa-rita-merlot',
        drawing: '本社掲示板「輸入ワイン2026」フォルダに格納済み',
        fileNames: ['サンタリタ_メルロー_ラベル展開図.pdf'],
        designNote: '',
        tempImage: '',
        packaging: '',
      },
    },
    {
      products: [{ name: 'グランポレール　余市ケルナー２０２５', code: 'GP63' }],
      categories: ['国内製造ワイン・洋酒'],
      businessTypes: ['業務用'],
      submissionDestination: '●●外食',
      submissionDeadline: '2026-01-29',
      documentType: '商品規格書／商品カルテ',
    },
    {
      products: [{ name: 'サッポロクラシック', code: 'SC27' }],
      categories: ['ビールテイスト'],
      businessTypes: ['家庭用'],
      submissionDestination: '北海道コープ',
      submissionDeadline: '2026-02-05',
      documentType: 'eBASE',
      ebaseDetails: {
        productName: 'サッポロクラシック 350ml缶・500ml缶',
        specLink: 'https://internal.example.com/specs/classic-2026',
        drawing: 'GAZO-WEB「クラシック2026」フォルダに格納済み',
        fileNames: ['クラシック_展開図.pdf'],
        designNote: '',
        tempImage: '',
        packaging: '',
      },
    },
  ];

  const createdDate = new Date('2026-01-15');

  windowContactRequests.forEach((req, index) => {
    const uniqueId = `REQ-WC-${String(index + 1).padStart(3, '0')}`;
    const windowAssign = assignWindowContact(req.businessTypes, req.categories);
    const requester = DUMMY_REQUESTERS[index % DUMMY_REQUESTERS.length];

    requests.push({
      id: uniqueId,
      requestId: uniqueId,
      requestDate: '2026-01-15',
      requestDepartment: '営業企画部',
      requesterName: requester.name,
      requesterEmail: requester.email,
      desiredDate: '2026-01-15',
      products: req.products,
      documentType: req.documentType,
      submissionDestination: req.submissionDestination,
      requestDetails: req.products.length > 0
        ? '新商品のため、規格書を作成お願いします'
        : '証明書の発行をお願いします',
      windowDepartment: windowAssign.windowDepartment,
      status: 'window-contact-pending',
      businessTypes: req.businessTypes,
      categories: req.categories,
      documentsToCreate: [],
      windowContacts: windowAssign.windowContacts,
      creatorDepartment: '',
      creators: [],
      createdDate,
      submissionDeadline: req.submissionDeadline,
      statusHistory: [
        {
          id: `sh-${index}-1`,
          status: 'window-contact-pending',
          changedBy: '営業部',
          changedDate: createdDate,
          note: '新規依頼を受け付けました',
        },
      ],
      comments: [],
      completedDocuments: [],
      ebaseDetails: req.ebaseDetails,
      certificateDetails: req.certificateDetails,
    });
  });

  return requests;
}

export function getDummyRequests(): RequestData[] {
  const requests: RequestData[] = [];

  // 窓口担当者確認画面用の10件を追加
  requests.push(...getWindowContactRequests());

  // REQ-WC-001/002/003をベースにした「作成中」データ3件
  const wcCreatedDate = new Date('2026-01-15');
  const wcInProgressDate = new Date('2026-01-17');

  const inProgressEntries: Array<{
    id: string;
    products: ProductEntry[];
    categories: string[];
    businessTypes: string[];
    submissionDestination: string;
    submissionDeadline: string;
    documentType: string;
    ebaseDetails?: EbaseDetails;
    certificateDetails?: CertificateDetails;
    windowCreateMode?: 'asIs' | 'modified';
    windowModificationNote?: string;
  }> = [
    {
      id: 'REQ-WC-001-IP',
      products: [{ name: '黒ラベル350ml', code: 'BL17' }],
      categories: ['ビールテイスト'],
      businessTypes: ['家庭用'],
      submissionDestination: '〇〇商社',
      submissionDeadline: '2026-01-22',
      documentType: '商品規格書／商品カルテ',
      windowCreateMode: 'asIs',
    },
    {
      id: 'REQ-WC-002-IP',
      products: [
        { name: 'ヱビスビール（2026年リニューアル）', code: 'EB43' },
        { name: 'ヱビスビール　マイスター', code: 'EM15' },
      ],
      categories: ['ビールテイスト'],
      businessTypes: ['家庭用', '業務用'],
      submissionDestination: '△△流通',
      submissionDeadline: '2026-01-25',
      documentType: 'eBASE',
      ebaseDetails: {
        productName: 'ヱビスビール（2026年リニューアル）350ml缶・500ml缶、ヱビスビール マイスター 350ml缶',
        specLink: 'https://internal.example.com/specs/ebisu-2026',
        drawing: 'GAZO-WEB「ヱビス2026」フォルダに格納済み',
        fileNames: ['ヱビス2026_展開図.pdf', 'マイスター_立体図.pdf'],
        designNote: '「NEW」マーク追加、リニューアルスリーブ使用',
        tempImage: '背面画像が仮、確定予定 2026/02/10',
        packaging: '',
      },
      windowCreateMode: 'modified',
      windowModificationNote: '500ml缶は今回対象外。350ml缶のみで作成してください。',
    },
    {
      id: 'REQ-WC-003-IP',
      products: [{ name: 'サッポロ生ビール黒ラベル 樽20L', code: 'BD58' }],
      categories: ['ビールテイスト'],
      businessTypes: ['業務用'],
      submissionDestination: '□□外食',
      submissionDeadline: '2026-01-28',
      documentType: '各種証明書',
      certificateDetails: {
        destName: '株式会社□□外食サービス',
        certType: 'アレルゲン不使用証明書（特定原材料7品目）',
        copies: '2部',
        sealRequired: '要',
        originalNeeded: 'あり',
        shipTo: '大阪支社 業務営業部 中村健一',
      },
      windowCreateMode: 'asIs',
    },
  ];

  inProgressEntries.forEach((entry, idx) => {
    const windowAssign = assignWindowContact(entry.businessTypes, entry.categories);
    const creatorAssign = assignCreator(entry.categories, [entry.documentType]);
    const nonGLWindowName =
      windowAssign.windowContacts.find((n) => !n.includes('GL')) ??
      windowAssign.windowContacts[0] ??
      '窓口担当者';
    const windowContactName = `${windowAssign.windowDepartment} ${nonGLWindowName}`;

    const nonGLCreatorName =
      creatorAssign.creators.find((n) => !n.includes('GL')) ??
      creatorAssign.creators[0] ??
      '作成担当者';
    const creatorName = `${creatorAssign.creatorDepartment} ${nonGLCreatorName}`;
    const requester = DUMMY_REQUESTERS[idx % DUMMY_REQUESTERS.length];
    const productNames = entry.products.map((p) => p.name).join('、') || '（証明書）';

    requests.push({
      id: entry.id,
      requestId: entry.id,
      requestDate: '2026-01-15',
      requestDepartment: '営業企画部',
      requesterName: requester.name,
      requesterEmail: requester.email,
      desiredDate: '2026-01-15',
      products: entry.products,
      documentType: entry.documentType,
      submissionDestination: entry.submissionDestination,
      requestDetails: entry.products.length > 0
        ? '新商品のため、規格書を作成お願いします'
        : '証明書の発行をお願いします',
      windowDepartment: windowAssign.windowDepartment,
      status: RequestStatus.IN_PROGRESS,
      businessTypes: entry.businessTypes,
      categories: entry.categories,
      documentsToCreate: [entry.documentType],
      windowContacts: windowAssign.windowContacts,
      creatorDepartment: creatorAssign.creatorDepartment,
      creators: creatorAssign.creators,
      createdDate: wcCreatedDate,
      submissionDeadline: entry.submissionDeadline,
      statusHistory: [
        {
          id: `${entry.id}-sh-1`,
          status: RequestStatus.AWAITING_WINDOW,
          changedBy: '営業部',
          changedDate: wcCreatedDate,
          note: '新規依頼を受け付けました',
        },
        {
          id: `${entry.id}-sh-2`,
          status: RequestStatus.IN_PROGRESS,
          changedBy: windowContactName,
          changedDate: wcInProgressDate,
          note: `作成依頼しました（作成文書：${entry.documentType}）`,
        },
      ],
      comments: createInProgressComments(
        entry.id,
        entry.documentType,
        productNames,
        entry.submissionDestination,
        entry.submissionDeadline,
        windowContactName,
        creatorName,
      ),
      completedDocuments: [],
      ebaseDetails: entry.ebaseDetails,
      certificateDetails: entry.certificateDetails,
      windowCreateMode: entry.windowCreateMode,
      windowModificationNote: entry.windowModificationNote,
    });
  });

  // REQ-WC-006とREQ-WC-009の「完了」コピー
  const wcCompletedBaseDate = new Date('2026-01-15');
  const wcCompletedInProgressDate = new Date('2026-01-17');
  const wcFinalDate = new Date('2026-01-23');

  const completedEntries: Array<{
    id: string;
    products: ProductEntry[];
    categories: string[];
    businessTypes: string[];
    submissionDestination: string;
    submissionDeadline: string;
    documentType: string;
    ebaseDetails?: EbaseDetails;
    certificateDetails?: CertificateDetails;
    windowCreateMode?: 'asIs' | 'modified';
    windowModificationNote?: string;
  }> = [
    {
      id: 'REQ-WC-006-CP',
      products: [{ name: 'こいむぎ', code: 'KM74' }],
      categories: ['和酒'],
      businessTypes: ['業務用'],
      submissionDestination: '■■外食',
      submissionDeadline: '2026-01-26',
      documentType: '商品規格書／商品カルテ',
      windowCreateMode: 'asIs',
    },
    {
      id: 'REQ-WC-009-CP',
      products: [{ name: 'サンタ・リタ　スリー・メダルズ　メルロー', code: 'SR49' }],
      categories: ['輸入ワイン・洋酒'],
      businessTypes: ['家庭用'],
      submissionDestination: '◆◆商社',
      submissionDeadline: '2026-01-24',
      documentType: 'eBASE',
      ebaseDetails: {
        productName: 'サンタ・リタ スリー・メダルズ メルロー 750ml',
        specLink: 'https://internal.example.com/specs/santa-rita-merlot',
        drawing: '本社掲示板「輸入ワイン2026」フォルダに格納済み',
        fileNames: ['サンタリタ_メルロー_ラベル展開図.pdf'],
        designNote: '',
        tempImage: '',
        packaging: '',
      },
      windowCreateMode: 'modified',
      windowModificationNote: 'ラベル裏面の輸入者表記を最新の情報に更新してください。',
    },
  ];

  completedEntries.forEach((entry, idx) => {
    const windowAssign = assignWindowContact(entry.businessTypes, entry.categories);
    const creatorAssign = assignCreator(entry.categories, [entry.documentType]);
    const nonGLWindowName =
      windowAssign.windowContacts.find((n) => !n.includes('GL')) ??
      windowAssign.windowContacts[0] ??
      '窓口担当者';
    const windowContactName = `${windowAssign.windowDepartment} ${nonGLWindowName}`;

    const nonGLCreatorName =
      creatorAssign.creators.find((n) => !n.includes('GL')) ??
      creatorAssign.creators[0] ??
      '作成担当者';
    const creatorName = `${creatorAssign.creatorDepartment} ${nonGLCreatorName}`;
    const requester = DUMMY_REQUESTERS[(idx + 3) % DUMMY_REQUESTERS.length];
    const productNames = entry.products.map((p) => p.name).join('、');

    const inProgressComments = createInProgressComments(
      entry.id,
      entry.documentType,
      productNames,
      entry.submissionDestination,
      entry.submissionDeadline,
      windowContactName,
      creatorName,
    );

    requests.push({
      id: entry.id,
      requestId: entry.id,
      requestDate: '2026-01-15',
      requestDepartment: '営業企画部',
      requesterName: requester.name,
      requesterEmail: requester.email,
      desiredDate: '2026-01-15',
      products: entry.products,
      documentType: entry.documentType,
      submissionDestination: entry.submissionDestination,
      requestDetails: '新商品のため、規格書を作成お願いします',
      windowDepartment: windowAssign.windowDepartment,
      status: RequestStatus.COMPLETED,
      businessTypes: entry.businessTypes,
      categories: entry.categories,
      documentsToCreate: [entry.documentType],
      windowContacts: windowAssign.windowContacts,
      creatorDepartment: creatorAssign.creatorDepartment,
      creators: creatorAssign.creators,
      createdDate: wcCompletedBaseDate,
      submissionDeadline: entry.submissionDeadline,
      statusHistory: [
        {
          id: `${entry.id}-sh-1`,
          status: RequestStatus.AWAITING_WINDOW,
          changedBy: '営業部',
          changedDate: wcCompletedBaseDate,
          note: '新規依頼を受け付けました',
        },
        {
          id: `${entry.id}-sh-2`,
          status: RequestStatus.IN_PROGRESS,
          changedBy: windowContactName,
          changedDate: wcCompletedInProgressDate,
          note: `作成依頼しました（作成文書：${entry.documentType}）`,
        },
        {
          id: `${entry.id}-sh-3`,
          status: RequestStatus.COMPLETED,
          changedBy: creatorName,
          changedDate: wcFinalDate,
          note: '文書作成が完了しました',
        },
      ],
      comments: [
        ...inProgressComments,
        {
          id: `${entry.id}-c5`,
          author: creatorName,
          timestamp: new Date('2026-01-23T10:00:00'),
          content: `${entry.documentType}の作成が完了しました。ご確認ください。`,
        },
      ],
      completedDocuments: [
        {
          id: `${entry.id}-doc-1`,
          documentType: DocumentType.EBASE,
          registrationDate: new Date('2026-01-23'),
          filePath: '/documents/sample-ebase.pdf',
        },
      ],
      ebaseDetails: entry.ebaseDetails,
      certificateDetails: entry.certificateDetails,
      windowCreateMode: entry.windowCreateMode,
      windowModificationNote: entry.windowModificationNote,
    });
  });

  return requests;
}

// In-memory storage for modifications (in a real app, this would be a database)
const requestsStore = new Map<string, RequestData>();
let initialized = false;

function initializeStore() {
  if (!initialized) {
    getDummyRequests().forEach((req) => {
      requestsStore.set(req.id, { ...req });
    });
    initialized = true;
  }
}

export function getAllRequests(): RequestData[] {
  initializeStore();
  return Array.from(requestsStore.values());
}

export function getRequestById(id: string): RequestData | null {
  initializeStore();
  const request = requestsStore.get(id);
  return request || null;
}

export function addRequest(request: RequestData): void {
  initializeStore();
  requestsStore.set(request.id, request);
}

export function addComment(requestId: string, author: string, content: string): Comment | null {
  initializeStore();
  const request = requestsStore.get(requestId);
  if (!request) return null;

  const newComment: Comment = {
    id: `comment-${Date.now()}`,
    author,
    timestamp: new Date(),
    content,
  };

  request.comments.push(newComment);
  return newComment;
}

export function addCompletedDocument(
  requestId: string,
  documentType: DocumentType,
  filePath: string
): CompletedDocument | null {
  initializeStore();
  const request = requestsStore.get(requestId);
  if (!request) return null;

  const newDocument: CompletedDocument = {
    id: `doc-${Date.now()}`,
    documentType,
    registrationDate: new Date(),
    filePath,
  };

  request.completedDocuments.push(newDocument);
  return newDocument;
}

export function updateRequestStatus(
  requestId: string,
  newStatus: RequestStatus,
  note?: string
): RequestData | null {
  initializeStore();
  const request = requestsStore.get(requestId);
  if (!request) return null;

  request.status = newStatus;

  const statusUpdate: StatusHistory = {
    id: `sh-${Date.now()}`,
    status: newStatus,
    changedBy: 'システムユーザー',
    changedDate: new Date(),
    note,
  };

  request.statusHistory.push(statusUpdate);
  return request;
}
