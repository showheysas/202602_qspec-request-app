'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { getDummyRequests } from '@/utils/dummyData';
import { RequestData, RequestStatus, AlcoholCategory } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type SortField = 'id' | 'createdDate' | 'status' | 'productName' | 'alcoholCategory';
type SortOrder = 'asc' | 'desc';

const statusColors = {
  [RequestStatus.AWAITING_WINDOW]: '#EA580C',
  [RequestStatus.IN_PROGRESS]: '#EAB308',
  [RequestStatus.COMPLETED]: '#4CAF50',
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case RequestStatus.AWAITING_WINDOW: return '窓口待ち';
    case RequestStatus.IN_PROGRESS: return '作成中';
    case RequestStatus.COMPLETED: return '完了';
    default: return status;
  }
};

export default function ListPage() {
  const allRequests = getDummyRequests();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('createdDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const filteredAndSortedRequests = useMemo(() => {
    let filtered = allRequests.filter((req) => {
      const statusMatch = statusFilter === 'all' || req.status === statusFilter;
      const categoryMatch = categoryFilter === 'all' || req.alcoholCategory === categoryFilter;
      const searchMatch = req.productName.toLowerCase().includes(searchTerm.toLowerCase());
      return statusMatch && categoryMatch && searchMatch;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: string | Date | number;
      let bValue: string | Date | number;

      switch (sortField) {
        case 'id':
          aValue = a.id;
          bValue = b.id;
          break;
        case 'createdDate':
          aValue = a.createdDate.getTime();
          bValue = b.createdDate.getTime();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'productName':
          aValue = a.productName;
          bValue = b.productName;
          break;
        case 'alcoholCategory':
          aValue = a.alcoholCategory;
          bValue = b.alcoholCategory;
          break;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const compare = aValue.localeCompare(bValue);
        return sortOrder === 'asc' ? compare : -compare;
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    return filtered;
  }, [statusFilter, categoryFilter, searchTerm, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <main className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">依頼一覧</h1>
          <p className="text-muted-foreground">品質文書の依頼状況を確認できます</p>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                商品名検索
              </label>
              <Input
                placeholder="商品名を入力..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                ステータス
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-white text-foreground"
              >
                <option value="all">全て</option>
                <option value={RequestStatus.AWAITING_WINDOW}>窓口待ち</option>
                <option value={RequestStatus.IN_PROGRESS}>作成中</option>
                <option value={RequestStatus.COMPLETED}>完了</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                カテゴリ
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-white text-foreground"
              >
                <option value="all">全て</option>
                <option value={AlcoholCategory.EBASE}>eBASE</option>
                <option value={AlcoholCategory.CERTIFICATE}>証明書（SB書式）</option>
                <option value={AlcoholCategory.PRODUCT_SPEC_EXTERNAL}>商品規格書（外食）</option>
                <option value={AlcoholCategory.PRODUCT_SPEC_DISTRIBUTION}>商品規格書（流通）</option>
                <option value={AlcoholCategory.OTHER}>その他</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={() => {
                  setStatusFilter('all');
                  setCategoryFilter('all');
                  setSearchTerm('');
                }}
                className="w-full"
              >
                リセット
              </Button>
            </div>
          </div>
        </Card>

        {/* Results info */}
        <div className="mb-4 text-sm text-muted-foreground">
          {filteredAndSortedRequests.length}件の依頼が表示されています
        </div>

        {/* Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground cursor-pointer hover:bg-accent"
                    onClick={() => handleSort('id')}>
                    依頼ID {sortField === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground cursor-pointer hover:bg-accent"
                    onClick={() => handleSort('createdDate')}>
                    作成日 {sortField === 'createdDate' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground cursor-pointer hover:bg-accent"
                    onClick={() => handleSort('productName')}>
                    商品名 {sortField === 'productName' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground cursor-pointer hover:bg-accent"
                    onClick={() => handleSort('alcoholCategory')}>
                    カテゴリ {sortField === 'alcoholCategory' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground cursor-pointer hover:bg-accent"
                    onClick={() => handleSort('status')}>
                    ステータス {sortField === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                    依頼者
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedRequests.length > 0 ? (
                  filteredAndSortedRequests.map((request, idx) => (
                    <tr
                      key={request.id}
                      className={`border-b border-border hover:bg-muted transition ${
                        idx % 2 === 0 ? 'bg-background' : 'bg-card'
                      }`}
                    >
                      <td className="px-6 py-4 text-sm text-foreground font-mono">
                        {request.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {formatDate(request.createdDate)}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {request.productName}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {request.alcoholCategory}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className="px-3 py-1 rounded-full text-white text-xs font-semibold"
                          style={{ backgroundColor: statusColors[request.status as RequestStatus] }}
                        >
                          {getStatusLabel(request.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {request.requesterName}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Link href={`/detail/${request.id}`}>
                          <Button variant="outline" size="sm">
                            詳細
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                      該当する依頼がありません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </main>
  );
}
