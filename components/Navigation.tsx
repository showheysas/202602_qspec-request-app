'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: '１．新規依頼' },
    { href: '/list', label: '２．依頼一覧' },
    { href: '/completed', label: '３．完成文書' },
    { href: '/window-contact-setting', label: '４．窓口担当者設定' },
    { href: '/creator-setting', label: '５．作成担当者設定' },
  ];

  return (
    <nav className="flex-shrink-0 z-50 bg-white border-b border-border">
      <div className="max-w-full mx-auto px-4">
        <div className="flex gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                  isActive
                    ? 'text-primary border-primary'
                    : 'text-muted-foreground border-transparent hover:bg-secondary'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
