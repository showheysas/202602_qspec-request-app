'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessTab } from '@/lib/auth';

/**
 * ページレベルのアクセスガード。
 * TAB_PERMISSIONS に基づき、権限がなければ /list にリダイレクトする。
 */
export function useAccessGuard() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!user) return; // AuthProvider がリダイレクト処理を担う

    // /detail/[id] は /list の子ページとして扱う
    const tabPath = pathname.startsWith('/detail/') ? '/list'
      : pathname.startsWith('/completed/') ? '/completed'
      : pathname;

    if (!canAccessTab(user.role, tabPath)) {
      router.replace('/list');
    }
  }, [user, pathname, router]);
}
