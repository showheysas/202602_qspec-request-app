export interface Request {
  id: string;
  requestDate: string;
  requestDepartment: string;
  requesterName: string;
  requesterEmail: string;
  desiredDate: string;
  productName: string;
  alcoholCategory: string;
  productCode?: string;
  documentType: string;
  submissionDestination: string;
  requestDetails: string;
  windowDepartment: string;
  assignedDepartment: string;
  status: 'window-contact-pending' | 'creator-processing' | 'completed';
  
  // 複数選択対応フィールド
  businessTypes: string[];
  categories: string[];
  documentsToCreate: string[];
  windowContacts: string[];
  creatorDepartment: string;
  creators: string[];
}

export interface StatusHistory {
  status: string;
  dateTime: string;
  personName: string;
}

export interface CompletedDocument {
  fileName: string;
  registrationDate: string;
  registeredBy: string;
}

export interface Comment {
  id: string;
  posterName: string;
  dateTime: string;
  content: string;
}

export interface RequestDetail extends Request {
  statusHistory: StatusHistory[];
  completedDocuments: CompletedDocument[];
  comments: Comment[];
}
