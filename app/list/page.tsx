'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { getDummyRequests } from '@/utils/dummyData';
import { RequestData, RequestStatus } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const CATEGORIES = [
  'ビールテイスト',
  'RTD',
  'RTS',
  '和酒',
  'バカルディ社製品',
  '輸入ワイン・洋酒',
  '国内製造ワイン・洋酒',
  'その他',
];

const BUSINESS_TYPES = ['家庭用', '業務用', 'その他'];

type SortField = 'id' | 'createdDate' | 'status' | 'productName' | 'category' | 'businessType' | 'submissionDestination' | 'requesterName' | 'submissionDeadline';
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
  const [businessTypeFilter, setBusinessTypeFilter] = useState<string>('all');
  const [destinationFilter, setDestinationFilter] = useState<string>('');
  const [requesterFilter, setRequesterFilter] = useState<string>('');
  const [deadlineFilter, setDeadlineFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('createdDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // 提出先の選択肢を動的生成
  const uniqueDestinations = useMemo(() => {
    const destinations = new Set(allRequests.map((r) => r.submissionDestination));
    return Array.from(destinations).sort();
  }, [allRequests]);

  // アプリ内の現在日付（モック用固定値）
  const APP_TODAY = new Date('2026-01-25T00:00:00');

  const filteredAndSortedRequests = useMemo(() => {
    const today = APP_TODAY;

    let filtered = allRequests.filter((req) => {
      const statusMatch = statusFilter === 'all' || req.status === statusFilter;
      const categoryMatch = categoryFilter === 'all' || (req.categories && req.categories.includes(categoryFilter));
      const businessMatch = businessTypeFilter === 'all' || (req.businessTypes && req.businessTypes.includes(businessTypeFilter));
      const destMatch = !destinationFilter || req.submissionDestination.includes(destinationFilter);
      const requesterMatch = !requesterFilter || req.requesterName.includes(requesterFilter);
      const searchMatch = req.productName.toLowerCase().includes(searchTerm.toLowerCase());

      let deadlineMatch = true;
      if (deadlineFilter === 'approaching') {
        // 期日間近: 3日以内
        const dl = new Date(req.submissionDeadline + 'T00:00:00');
        const diff = (dl.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
        deadlineMatch = diff >= 0 && diff <= 3;
      } else if (deadlineFilter === 'overdue') {
        // 期日超過
        const dl = new Date(req.submissionDeadline + 'T00:00:00');
        deadlineMatch = dl.getTime() < today.getTime();
      }

      return statusMatch && categoryMatch && businessMatch && destMatch && requesterMatch && searchMatch && deadlineMatch;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

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
        case 'category':
          aValue = a.categories?.[0] || '';
          bValue = b.categories?.[0] || '';
          break;
        case 'businessType':
          aValue = a.businessTypes?.[0] || '';
          bValue = b.businessTypes?.[0] || '';
          break;
        case 'submissionDestination':
          aValue = a.submissionDestination;
          bValue = b.submissionDestination;
          break;
        case 'requesterName':
          aValue = a.requesterName;
          bValue = b.requesterName;
          break;
        case 'submissionDeadline':
          aValue = a.submissionDeadline;
          bValue = b.submissionDeadline;
          break;
        default:
          aValue = a.id;
          bValue = b.id;
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
  }, [statusFilter, categoryFilter, businessTypeFilter, destinationFilter, requesterFilter, deadlineFilter, searchTerm, sortField, sortOrder, allRequests]);

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

  const formatDeadline = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const getDeadlineColor = (dateStr: string) => {
    if (!dateStr) return '';
    const dl = new Date(dateStr + 'T00:00:00');
    const diff = (dl.getTime() - APP_TODAY.getTime()) / (1000 * 60 * 60 * 24);
    if (diff < 0) return 'text-red-600 font-bold'; // 超過
    if (diff <= 3) return 'text-orange-500 font-bold'; // 間近
    return '';
  };

  const handleReset = () => {
    setStatusFilter('all');
    setCategoryFilter('all');
    setBusinessTypeFilter('all');
    setDestinationFilter('');
    setRequesterFilter('');
    setDeadlineFilter('all');
    setSearchTerm('');
  };

  const sortIndicator = (field: SortField) => {
    if (sortField !== field) return '';
    return sortOrder === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <main className="bg-background py-3 px-4">
      <div className="max-w-full mx-auto">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-foreground mb-1">依頼一覧</h1>
          <p className="text-sm text-muted-foreground mb-2">品質文書の依頼状況を確認できます</p>
          <div className="text-xs text-muted-foreground space-y-0.5 bg-muted/30 rounded p-2">
            <p><span className="inline-block w-3 h-3 rounded-full mr-1.5 align-middle" style={{ backgroundColor: '#EA580C' }} />
              <strong>窓口待ち</strong>：本社窓口担当者にて確認中です。</p>
            <p><span className="inline-block w-3 h-3 rounded-full mr-1.5 align-middle" style={{ backgroundColor: '#EAB308' }} />
              <strong>作成中</strong>：本社窓口担当者より作成依頼がされ、作成に取り掛かっています。</p>
            <p><span className="inline-block w-3 h-3 rounded-full mr-1.5 align-middle" style={{ backgroundColor: '#4CAF50' }} />
              <strong>完了</strong>：作成資料が完成し、取得可能となっています。</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-3 mb-2">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">商品名検索</label>
              <Input
                placeholder="商品名を入力..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-8 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">ステータス</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-2 py-1.5 border border-input rounded-md bg-white text-sm text-foreground"
              >
                <option value="all">全て</option>
                <option value={RequestStatus.AWAITING_WINDOW}>窓口待ち</option>
                <option value={RequestStatus.IN_PROGRESS}>作成中</option>
                <option value={RequestStatus.COMPLETED}>完了</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">カテゴリ</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-2 py-1.5 border border-input rounded-md bg-white text-sm text-foreground"
              >
                <option value="all">全て</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">事業</label>
              <select
                value={businessTypeFilter}
                onChange={(e) => setBusinessTypeFilter(e.target.value)}
                className="w-full px-2 py-1.5 border border-input rounded-md bg-white text-sm text-foreground"
              >
                <option value="all">全て</option>
                {BUSINESS_TYPES.map((bt) => (
                  <option key={bt} value={bt}>{bt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">提出先</label>
              <Input
                placeholder="提出先..."
                value={destinationFilter}
                onChange={(e) => setDestinationFilter(e.target.value)}
                className="w-full h-8 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">依頼者</label>
              <Input
                placeholder="依頼者名..."
                value={requesterFilter}
                onChange={(e) => setRequesterFilter(e.target.value)}
                className="w-full h-8 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">期日</label>
              <select
                value={deadlineFilter}
                onChange={(e) => setDeadlineFilter(e.target.value)}
                className="w-full px-2 py-1.5 border border-input rounded-md bg-white text-sm text-foreground"
              >
                <option value="all">全て</option>
                <option value="approaching">期日間近（3日以内）</option>
                <option value="overdue">期日超過</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleReset} className="w-full h-8 text-sm" variant="outline">
                リセット
              </Button>
            </div>
          </div>
        </Card>

        {/* Results info */}
        <div className="mb-1 text-xs text-muted-foreground">
          {filteredAndSortedRequests.length}件の依頼が表示されています
        </div>

        {/* Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-2 py-1.5 text-left text-xs font-semibold text-foreground cursor-pointer hover:bg-accent whitespace-nowrap"
                    onClick={() => handleSort('id')}>
                    依頼ID{sortIndicator('id')}
                  </th>
                  <th className="px-2 py-1.5 text-left text-xs font-semibold text-foreground cursor-pointer hover:bg-accent whitespace-nowrap"
                    onClick={() => handleSort('createdDate')}>
                    作成日{sortIndicator('createdDate')}
                  </th>
                  <th className="px-2 py-1.5 text-left text-xs font-semibold text-foreground cursor-pointer hover:bg-accent whitespace-nowrap"
                    onClick={() => handleSort('productName')}>
                    商品名{sortIndicator('productName')}
                  </th>
                  <th className="px-2 py-1.5 text-left text-xs font-semibold text-foreground cursor-pointer hover:bg-accent whitespace-nowrap"
                    onClick={() => handleSort('category')}>
                    カテゴリ{sortIndicator('category')}
                  </th>
                  <th className="px-2 py-1.5 text-left text-xs font-semibold text-foreground cursor-pointer hover:bg-accent whitespace-nowrap"
                    onClick={() => handleSort('businessType')}>
                    事業{sortIndicator('businessType')}
                  </th>
                  <th className="px-2 py-1.5 text-left text-xs font-semibold text-foreground cursor-pointer hover:bg-accent whitespace-nowrap"
                    onClick={() => handleSort('submissionDestination')}>
                    提出先{sortIndicator('submissionDestination')}
                  </th>
                  <th className="px-2 py-1.5 text-left text-xs font-semibold text-foreground cursor-pointer hover:bg-accent whitespace-nowrap"
                    onClick={() => handleSort('submissionDeadline')}>
                    期日{sortIndicator('submissionDeadline')}
                  </th>
                  <th className="px-2 py-1.5 text-left text-xs font-semibold text-foreground cursor-pointer hover:bg-accent whitespace-nowrap"
                    onClick={() => handleSort('requesterName')}>
                    依頼者{sortIndicator('requesterName')}
                  </th>
                  <th className="px-2 py-1.5 text-left text-xs font-semibold text-foreground cursor-pointer hover:bg-accent whitespace-nowrap"
                    onClick={() => handleSort('status')}>
                    ステータス{sortIndicator('status')}
                  </th>
                  <th className="px-2 py-1.5 text-left text-xs font-semibold text-foreground whitespace-nowrap">
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
                      <td className="px-2 py-1.5 text-xs text-foreground font-mono">
                        {request.id}
                      </td>
                      <td className="px-2 py-1.5 text-xs text-foreground whitespace-nowrap">
                        {formatDate(request.createdDate)}
                      </td>
                      <td className="px-2 py-1.5 text-xs text-foreground">
                        {request.productName}
                      </td>
                      <td className="px-2 py-1.5 text-xs text-foreground">
                        {request.categories?.join(', ')}
                      </td>
                      <td className="px-2 py-1.5 text-xs text-foreground">
                        {request.businessTypes?.join(', ')}
                      </td>
                      <td className="px-2 py-1.5 text-xs text-foreground">
                        {request.submissionDestination}
                      </td>
                      <td className={`px-2 py-1.5 text-xs whitespace-nowrap ${getDeadlineColor(request.submissionDeadline) || 'text-foreground'}`}>
                        {formatDeadline(request.submissionDeadline)}
                      </td>
                      <td className="px-2 py-1.5 text-xs text-foreground">
                        {request.requesterName}
                      </td>
                      <td className="px-2 py-1.5 text-xs">
                        <span
                          className="px-2 py-0.5 rounded-full text-white text-xs font-semibold whitespace-nowrap"
                          style={{ backgroundColor: statusColors[request.status as RequestStatus] }}
                        >
                          {getStatusLabel(request.status)}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-xs">
                        <Link href={`/detail/${request.id}`}>
                          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs px-3">
                            確認・対応
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="px-3 py-6 text-center text-muted-foreground">
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
