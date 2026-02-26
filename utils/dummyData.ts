import {
  RequestData,
  RequestStatus,
  DocumentType,
  Comment,
  CompletedDocument,
  StatusHistory,
} from '@/lib/types';
import { assignWindowContact, assignCreator } from './autoAssignLogic';

function createInProgressComments(
  id: string,
  documentType: string,
  productName: string,
  submissionDestination: string,
  submissionDeadline: string,
  windowContactName: string,
  creatorName: string,
): Comment[] {
  return [
    // 窓口担当者→作成担当者への引き継ぎコメント（窓口待ち→作成中の遷移時）
    {
      id: `${id}-c0`,
      author: windowContactName,
      timestamp: new Date('2025-01-17T09:00:00'),
      content: `${productName}の${documentType}の作成依頼です。提出先は${submissionDestination}、提出期限は${submissionDeadline}となっております。ご対応よろしくお願いします。`,
    },
    {
      id: `${id}-c1`,
      author: windowContactName,
      timestamp: new Date('2025-01-17T10:00:00'),
      content: `${documentType}の作成をお願いします。提出期限が近いため、お早めに対応いただけますと幸いです。`,
    },
    {
      id: `${id}-c2`,
      author: creatorName,
      timestamp: new Date('2025-01-17T11:30:00'),
      content: `承りました。${documentType}の作成を開始します。内容を確認次第、ご連絡します。`,
    },
    {
      id: `${id}-c3`,
      author: creatorName,
      timestamp: new Date('2025-01-18T11:15:00'),
      content: '作成中に気になる点がございます。原材料の記載について詳細を教えていただけますか？',
    },
    {
      id: `${id}-c4`,
      author: windowContactName,
      timestamp: new Date('2025-01-18T14:45:00'),
      content: 'ご確認ありがとうございます。原材料の詳細は別途メールでお送りします。',
    },
  ];
}

export function getWindowContactRequests(): RequestData[] {
  const requests: RequestData[] = [];

  const windowContactRequests = [
    {
      productName: '黒ラベル350ml',
      categories: ['ビールテイスト'],
      businessTypes: ['家庭用'],
      submissionDestination: '〇〇商社',
      submissionDeadline: '2025-01-22',
    },
    {
      productName: 'ヱビスビール（2026年リニューアル）',
      categories: ['ビールテイスト'],
      businessTypes: ['家庭用', '業務用'],
      submissionDestination: '△△流通',
      submissionDeadline: '2025-01-25',
    },
    {
      productName: 'サッポロラガービール',
      categories: ['ビールテイスト'],
      businessTypes: ['業務用'],
      submissionDestination: '□□外食',
      submissionDeadline: '2025-01-28',
    },
    {
      productName: '男梅サワー',
      categories: ['RTD'],
      businessTypes: ['家庭用'],
      submissionDestination: '〇〇商社',
      submissionDeadline: '2025-01-20',
    },
    {
      productName: '濃いめのレモンサワーの素',
      categories: ['RTS'],
      businessTypes: ['家庭用'],
      submissionDestination: '◇◇商社',
      submissionDeadline: '2025-01-23',
    },
    {
      productName: 'こいむぎ',
      categories: ['和酒'],
      businessTypes: ['業務用'],
      submissionDestination: '■■外食',
      submissionDeadline: '2025-01-26',
    },
    {
      productName: 'バカルディラム',
      categories: ['バカルディ社製品'],
      businessTypes: ['家庭用'],
      submissionDestination: '▲▲商社',
      submissionDeadline: '2025-01-21',
    },
    {
      productName: 'デュワーズホワイトラベル',
      categories: ['輸入ワイン・洋酒'],
      businessTypes: ['業務用'],
      submissionDestination: '★★外食',
      submissionDeadline: '2025-01-27',
    },
    {
      productName: 'サンタ・リタ　スリー・メダルズ　メルロー',
      categories: ['輸入ワイン・洋酒'],
      businessTypes: ['家庭用'],
      submissionDestination: '◆◆商社',
      submissionDeadline: '2025-01-24',
    },
    {
      productName: 'グランポレール　余市ケルナー２０２５',
      categories: ['国内製造ワイン・洋酒'],
      businessTypes: ['業務用'],
      submissionDestination: '●●外食',
      submissionDeadline: '2025-01-29',
    },
  ];

  const createdDate = new Date('2025-01-15');

  windowContactRequests.forEach((req, index) => {
    const uniqueId = `REQ-WC-${String(index + 1).padStart(3, '0')}`;

    requests.push({
      id: uniqueId,
      requestId: uniqueId,
      requestDate: '2025-01-15',
      requestDepartment: '営業企画部',
      requesterName: '田中太郎',
      requesterEmail: 'tanaka@example.com',
      desiredDate: '2025-01-15',
      productName: req.productName,
      alcoholCategory: 'ビール',
      productCode: `CODE-${index + 1}`,
      documentType: '商品規格書',
      submissionDestination: req.submissionDestination,
      requestDetails: '新商品のため、規格書を作成お願いします',
      windowDepartment: '営業統括部',
      assignedDepartment: '品質管理部',
      status: 'window-contact-pending',
      businessTypes: req.businessTypes,
      categories: req.categories,
      documentsToCreate: [],
      windowContacts: [],
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
    });
  });

  return requests;
}

export function getDummyRequests(): RequestData[] {
  const requests: RequestData[] = [];

  // 窓口担当者確認画面用の10件を追加
  requests.push(...getWindowContactRequests());

  // REQ-WC-001/002/003をベースにした「作成中」データ3件
  const wcCreatedDate = new Date('2025-01-15');
  const wcInProgressDate = new Date('2025-01-17');

  const inProgressEntries = [
    {
      id: 'REQ-WC-001-IP',
      productName: '黒ラベル350ml',
      categories: ['ビールテイスト'],
      businessTypes: ['家庭用'],
      submissionDestination: '〇〇商社',
      submissionDeadline: '2025-01-22',
      documentType: '商品規格書／商品カルテ',
    },
    {
      id: 'REQ-WC-002-IP',
      productName: 'ヱビスビール（2026年リニューアル）',
      categories: ['ビールテイスト'],
      businessTypes: ['家庭用', '業務用'],
      submissionDestination: '△△流通',
      submissionDeadline: '2025-01-25',
      documentType: 'eBASE',
    },
    {
      id: 'REQ-WC-003-IP',
      productName: 'サッポロラガービール',
      categories: ['ビールテイスト'],
      businessTypes: ['業務用'],
      submissionDestination: '□□外食',
      submissionDeadline: '2025-01-28',
      documentType: '各種証明書',
    },
  ];

  inProgressEntries.forEach((entry) => {
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

    requests.push({
      id: entry.id,
      requestId: entry.id,
      requestDate: '2025-01-15',
      requestDepartment: '営業企画部',
      requesterName: '田中太郎',
      requesterEmail: 'tanaka@example.com',
      desiredDate: '2025-01-15',
      productName: entry.productName,
      alcoholCategory: 'ビール',
      productCode: `CODE-IP-${entry.id.slice(-1)}`,
      documentType: entry.documentType,
      submissionDestination: entry.submissionDestination,
      requestDetails: '新商品のため、規格書を作成お願いします',
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
        entry.productName,
        entry.submissionDestination,
        entry.submissionDeadline,
        windowContactName,
        creatorName,
      ),
      completedDocuments: [],
    });
  });

  // REQ-WC-006とREQ-WC-009の「完了」コピー
  const wcCompletedBaseDate = new Date('2025-01-15');
  const wcCompletedInProgressDate = new Date('2025-01-17');
  const wcFinalDate = new Date('2025-01-23');

  const completedEntries = [
    {
      id: 'REQ-WC-006-CP',
      productName: 'こいむぎ',
      categories: ['和酒'],
      businessTypes: ['業務用'],
      submissionDestination: '■■外食',
      submissionDeadline: '2025-01-26',
      documentType: '商品規格書／商品カルテ',
    },
    {
      id: 'REQ-WC-009-CP',
      productName: 'サンタ・リタ　スリー・メダルズ　メルロー',
      categories: ['輸入ワイン・洋酒'],
      businessTypes: ['家庭用'],
      submissionDestination: '◆◆商社',
      submissionDeadline: '2025-01-24',
      documentType: 'eBASE',
    },
  ];

  completedEntries.forEach((entry) => {
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

    const inProgressComments = createInProgressComments(
      entry.id,
      entry.documentType,
      entry.productName,
      entry.submissionDestination,
      entry.submissionDeadline,
      windowContactName,
      creatorName,
    );

    requests.push({
      id: entry.id,
      requestId: entry.id,
      requestDate: '2025-01-15',
      requestDepartment: '営業企画部',
      requesterName: '田中太郎',
      requesterEmail: 'tanaka@example.com',
      desiredDate: '2025-01-15',
      productName: entry.productName,
      alcoholCategory: 'ビール',
      productCode: `CODE-CP-${entry.id.slice(-2)}`,
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
          timestamp: new Date('2025-01-23T10:00:00'),
          content: `${entry.documentType}の作成が完了しました。ご確認ください。`,
        },
      ],
      completedDocuments: [
        {
          id: `${entry.id}-doc-1`,
          documentType: DocumentType.EBASE,
          registrationDate: new Date('2025-01-23'),
          filePath: '/documents/sample-ebase.pdf',
        },
      ],
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
      requestsStore.set(req.id, JSON.parse(JSON.stringify(req)));
    });
    initialized = true;
  }
}

export function getRequestById(id: string): RequestData | null {
  initializeStore();
  const request = requestsStore.get(id);
  return request || null;
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
