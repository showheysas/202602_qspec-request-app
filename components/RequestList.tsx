'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getDummyRequests } from '@/utils/dummyData';
import { RequestData, RequestStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';

const STATUS_OPTIONS = [
  { value: '', label: 'すべて' },
  { value: 'window-contact-pending', label: '窓口担当者確認待ち' },
  { value: 'creator-processing', label: '作成担当者処理中' },
  { value: 'completed', label: '完了' },
];

const CATEGORY_OPTIONS = [
  'ビールテイスト',
  'RTD',
  'RTS',
  '和酒',
  'バカルディ社製品',
  '輸入ワイン・洋酒',
  '国内製造ワイン・洋酒',
  'その他',
];

const BUSINESS_TYPE_OPTIONS = ['家庭用', '業務用', 'その他'];

type SortField = 'requestDate' | 'productName' | 'status' | 'submissionDeadline' | 'requestId';

export function RequestList() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [businessTypeFilters, setBusinessTypeFilters] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [sortField, setSortField] = useState<SortField>('requestDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const requests = getDummyRequests();

  const filteredAndSortedRequests = useMemo(() => {
    let filtered = requests;

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    // Category filter
    if (categoryFilters.length > 0) {
      filtered = filtered.filter((r) =>
        r.categories.some((cat) => categoryFilters.includes(cat))
      );
    }

    // Business type filter
    if (businessTypeFilters.length > 0) {
      filtered = filtered.filter((r) =>
        r.businessTypes.some((bt) => businessTypeFilters.includes(bt))
      );
    }

    // Search filter
    if (searchText) {
      filtered = filtered.filter((r) =>
        r.productName.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDir === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [requests, statusFilter, categoryFilters, businessTypeFilters, searchText, sortField, sortDir]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'window-contact-pending':
        return 'bg-accent text-accent-foreground';
      case 'creator-processing':
        return 'bg-primary text-primary-foreground';
      case 'completed':
        return 'bg-green-500 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const toggleCategoryFilter = (cat: string) => {
    setCategoryFilters((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleBusinessTypeFilter = (bt: string) => {
    setBusinessTypeFilters((prev) =>
      prev.includes(bt) ? prev.filter((b) => b !== bt) : [...prev, bt]
    );
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortableHeader = ({ field, label }: { field: SortField; label: string }) => (
    <th
      onClick={() => handleSort(field)}
      className="px-4 py-2 text-left text-sm font-semibold text-foreground cursor-pointer hover:bg-muted/50"
    >
      <div className="flex items-center gap-2">
        {label}
        {sortField === field && (sortDir === 'asc' ? '▲' : '▼')}
      </div>
    </th>
  );

  return (
    <main className="min-h-screen bg-background py-12">
      <div className="mx-auto max-w-7xl px-4">
        <h1 className="text-3xl font-bold text-foreground mb-8">依頼一覧</h1>

        {/* Filters */}
        <div className="bg-card rounded-lg border border-border p-6 mb-8 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">フィルター</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">ステータス</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-md border border-border bg-input px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Box */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                商品名で検索
              </label>
              <input
                type="text"
                placeholder="商品名で検索..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full rounded-md border border-border bg-input px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              カテゴリ分類（複数選択可）
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((cat) => (
                <label key={cat} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={categoryFilters.includes(cat)}
                    onChange={() => toggleCategoryFilter(cat)}
                    className="w-4 h-4 rounded border-border text-primary"
                  />
                  <span className="ml-2 text-sm text-foreground">{cat}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Business Type Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              事業分類（複数選択可）
            </label>
            <div className="flex flex-wrap gap-2">
              {BUSINESS_TYPE_OPTIONS.map((bt) => (
                <label key={bt} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={businessTypeFilters.includes(bt)}
                    onChange={() => toggleBusinessTypeFilter(bt)}
                    className="w-4 h-4 rounded border-border text-primary"
                  />
                  <span className="ml-2 text-sm text-foreground">{bt}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => {
                setStatusFilter('');
                setCategoryFilters([]);
                setBusinessTypeFilters([]);
                setSearchText('');
              }}
              variant="outline"
              className="h-10"
            >
              リセット
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-muted">
                <tr>
                  <SortableHeader field="requestId" label="依頼ID" />
                  <SortableHeader field="requestDate" label="依頼日" />
                  <SortableHeader field="productName" label="商品名" />
                  <th className="px-4 py-2 text-left text-sm font-semibold text-foreground">
                    カテゴリ分類
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-foreground">
                    事業分類
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-foreground">
                    提出先
                  </th>
                  <SortableHeader field="submissionDeadline" label="提出希望日" />
                  <th className="px-4 py-2 text-left text-sm font-semibold text-foreground">
                    ステータス
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-foreground">
                    窓口部署
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-foreground">
                    窓口担当者
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-foreground">
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedRequests.map((request, idx) => (
                  <tr
                    key={request.requestId}
                    className={`border-t border-border cursor-pointer hover:bg-muted/30 ${
                      idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                    }`}
                    onClick={() => router.push(`/detail/${request.requestId}`)}
                  >
                    <td className="px-4 py-3 text-sm text-foreground">{request.requestId}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{request.requestDate}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{request.productName}</td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {request.categories.join(', ')}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {request.businessTypes.join(', ')}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {request.submissionDestination}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {request.submissionDeadline}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(
                          request.status
                        )}`}
                      >
                        {request.status === 'window-contact-pending'
                          ? '窓口待ち'
                          : request.status === 'creator-processing'
                          ? '作成中'
                          : '完了'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {request.department?.window || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {request.windowContacts?.join(', ') || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/detail/${request.requestId}`);
                        }}
                        variant="outline"
                        className="h-8 text-xs"
                      >
                        詳細
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredAndSortedRequests.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              検索条件に該当する依頼がありません
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
