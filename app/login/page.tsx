'use client';

import { useAuth } from '@/contexts/AuthContext';
import { UserRole, ROLE_LABELS, ROLE_PERMISSIONS, DUMMY_USERS } from '@/lib/auth';
import { Button } from '@/components/ui/button';

const ROLES: UserRole[] = ['planner', 'window', 'creator', 'admin'];

const ROLE_BORDER: Record<UserRole, string> = {
  planner: 'border-blue-300',
  window: 'border-green-300',
  creator: 'border-yellow-400',
  admin: 'border-purple-300',
};

export default function LoginPage() {
  const { login } = useAuth();

  return (
    <main className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
      <div className="mx-auto max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">品質文書リクエストシステム</h1>
          <p className="text-sm text-muted-foreground mt-1">ダミーログイン画面 ― 役割を選択してください</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {ROLES.map((role) => (
            <div key={role} className={`bg-card border-2 ${ROLE_BORDER[role]} rounded-lg p-4`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-foreground">{ROLE_LABELS[role]}</p>
                  <p className="text-xs text-muted-foreground">{DUMMY_USERS[role].name}</p>
                </div>
                <Button size="sm" onClick={() => login(role)} className="h-7 text-xs shrink-0 ml-2">
                  ログイン
                </Button>
              </div>
              <ul className="space-y-0.5">
                {ROLE_PERMISSIONS[role].map((perm, i) => (
                  <li key={i} className="text-xs text-muted-foreground leading-relaxed">・{perm}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
