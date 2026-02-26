export interface WindowContact {
  id: string;
  businessType: 'business' | 'household' | 'other';
  category: string;
  department: string;
  name: string;
  email: string;
}

export interface CreatorContact {
  id: string;
  category: string;
  documentType: 'specification' | 'ebase' | 'certificate';
  department: string;
  name: string;
  email: string;
}
