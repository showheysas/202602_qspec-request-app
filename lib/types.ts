import { z } from 'zod';

// Alcohol category enum
export enum AlcoholCategory {
  BEER = 'beer',
  RTDRTL = 'rtd-rtl',
  SAKE = 'sake',
  WINE = 'wine',
  OTHER = 'other',
}

// Department types
export interface Department {
  window: string;
  owner: string;
}

// Request status enum
export enum RequestStatus {
  AWAITING_WINDOW = 'window-contact-pending',
  IN_PROGRESS = 'creator-processing',
  COMPLETED = 'completed',
}

// Document type enum
export enum DocumentType {
  EBASE = 'ebase',
  CERTIFICATE = 'certificate',
  PRODUCT_SPEC = 'specification',
  OTHER = 'other',
}

// Comment interface
export interface Comment {
  id: string;
  author: string;
  timestamp: Date;
  content: string;
}

// Document registration interface
export interface CompletedDocument {
  id: string;
  documentType: DocumentType;
  registrationDate: Date;
  filePath: string;
}

// Status history interface
export interface StatusHistory {
  id: string;
  status: string;
  changedBy: string;
  changedDate: Date;
  note?: string;
}

// Product entry interface
export interface ProductEntry {
  name: string;
  code: string;
}

// Request data interface
export interface RequestData {
  id: string;                           // requestsStore のキー
  requestId: string;                    // 画面表示用ID
  requestDate: string;
  requestDepartment: string;
  requesterName: string;
  requesterEmail: string;
  desiredDate?: string;
  products: ProductEntry[];
  alcoholCategory?: string;
  documentType: string;
  submissionDestination: string;
  requestDetails: string;
  windowDepartment: string;
  windowContacts: string[];
  businessTypes: string[];
  categories: string[];
  documentsToCreate: string[];
  creatorDepartment: string;
  creators: string[];
  submissionDeadline: string;
  status: string;
  createdDate: Date;
  statusHistory: StatusHistory[];
  comments: Comment[];
  completedDocuments: CompletedDocument[];
}

// Request form schema
export const requestFormSchema = z.object({
  requesterName: z
    .string()
    .min(1, '依頼者名は必須です')
    .max(50, '依頼者名は50文字以下にしてください'),
  requesterEmail: z
    .string()
    .min(1, 'メールアドレスは必須です')
    .email('有効なメールアドレスを入力してください'),
  requestDate: z.string().optional(),
  documentType: z.string().min(1, '文書種別は必須です'),
  submissionDestination: z.string().min(1, '提出先は必須です'),
  submissionDeadline: z.string().min(1, '作成完了希望日は必須です'),
  requestDetails: z
    .string()
    .min(1, '依頼内容詳細は必須です')
    .max(500, '依頼内容詳細は500文字以下にしてください'),
});

export type RequestFormData = z.infer<typeof requestFormSchema>;
