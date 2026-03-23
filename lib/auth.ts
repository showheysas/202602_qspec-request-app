export type UserRole = 'planner' | 'window' | 'creator' | 'admin';

export interface AuthUser {
  name: string;
  role: UserRole;
  email: string;
}

export const DUMMY_USERS: Record<UserRole, AuthUser> = {
  planner: { name: '田中太郎', role: 'planner', email: 'tanaka@example.com' },
  window: { name: '佐藤花子', role: 'window', email: 'sato@example.com' },
  creator: { name: '鈴木一郎', role: 'creator', email: 'suzuki@example.com' },
  admin: { name: '管理者', role: 'admin', email: 'admin@example.com' },
};

export const ROLE_LABELS: Record<UserRole, string> = {
  planner: '企画者',
  window: '窓口担当者',
  creator: '作成担当者',
  admin: '管理者',
};

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  planner: [
    '編集：１．新規依頼、依頼詳細のコメント',
    '閲覧：２．依頼一覧（窓口待ちのみ）、３．完成文書',
  ],
  window: [
    '編集：２．依頼詳細',
    '閲覧：２．依頼一覧（窓口待ちのみ）、３．完成文書',
  ],
  creator: [
    '編集：２．依頼詳細',
    '閲覧：２．依頼一覧（窓口待ちのみ）、３．完成文書',
  ],
  admin: ['すべて編集・閲覧可能'],
};

/** タブごとにアクセス可能なロール */
export const TAB_PERMISSIONS: Record<string, UserRole[]> = {
  '/': ['planner', 'admin'],
  '/list': ['planner', 'window', 'creator', 'admin'],
  '/completed': ['planner', 'window', 'creator', 'admin'],
  '/window-contact-setting': ['admin'],
  '/creator-setting': ['admin'],
};

export function canAccessTab(role: UserRole, href: string): boolean {
  return TAB_PERMISSIONS[href]?.includes(role) ?? false;
}

/** 依頼詳細の作成文書選択・依頼ボタン・文書登録など全操作が可能 */
export function canEditDetail(role: UserRole): boolean {
  return role === 'window' || role === 'creator' || role === 'admin';
}

/** 企画者以外は全ステータスを見られる（企画者は窓口待ちのみ） */
export function canSeeAllStatuses(role: UserRole): boolean {
  return role === 'window' || role === 'creator' || role === 'admin';
}
