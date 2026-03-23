'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessTab, ROLE_LABELS } from '@/lib/auth';

export function Navigation() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (pathname === '/login') return null;

  const navItems = [
    { href: '/', label: '１．新規依頼' },
    { href: '/list', label: '２．依頼一覧' },
    { href: '/completed', label: '３．完成文書' },
    { href: '/window-contact-setting', label: '４．【管理者用】窓口担当者設定' },
    { href: '/creator-setting', label: '５．【管理者用】作成担当者設定' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href === '/list') return pathname === '/list' || pathname.startsWith('/detail/');
    if (href === '/completed') return pathname === '/completed' || (pathname.startsWith('/completed/') && pathname !== '/completed');
    return pathname === href;
  };

  return (
    <nav className="flex-shrink-0 z-50 bg-muted/20 border-b border-border">
      <div className="max-w-full mx-auto px-4 flex items-end justify-between">
        {/* タブバー */}
        <div className="flex gap-0.5 overflow-x-auto pt-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const accessible = user ? canAccessTab(user.role, item.href) : false;

            if (accessible) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 text-xs font-medium whitespace-nowrap border border-b-0 rounded-t-md transition-colors relative ${
                    active
                      ? 'bg-background text-primary border-border shadow-sm -mb-px z-10'
                      : 'bg-muted text-muted-foreground border-transparent hover:bg-muted/80 hover:text-foreground'
                  }`}
                >
                  {item.label}
                </Link>
              );
            } else {
              return (
                <span
                  key={item.href}
                  className="px-3 py-2 text-xs font-medium whitespace-nowrap border border-transparent rounded-t-md bg-muted/40 text-muted-foreground/40 cursor-not-allowed select-none"
                  title="このページへのアクセス権限がありません"
                >
                  {item.label}
                </span>
              );
            }
          })}
        </div>

        {/* ユーザー情報 + ログアウト */}
        {user && (
          <div className="flex items-center gap-2 pb-1.5 pl-4 flex-shrink-0">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {ROLE_LABELS[user.role]}：{user.name}
            </span>
            <button
              onClick={logout}
              className="text-xs text-muted-foreground hover:text-foreground underline whitespace-nowrap"
            >
              ログアウト
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
