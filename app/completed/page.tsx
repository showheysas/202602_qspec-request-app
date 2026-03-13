'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { getDummyRequests } from '@/utils/dummyData';
import { RequestStatus } from '@/lib/types';
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

type SortField = 'id' | 'createdDate' | 'productName' | 'documentType' | 'category' | 'businessType' | 'submissionDestination' | 'requesterName' | 'completedDate';
type SortOrder = 'asc' | 'desc';

export default function CompletedPage() {
  const allCompleted = useMemo(() => {
    return getDummyRequests().filter((req) => req.status === RequestStatus.COMPLETED);
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [documentTypeFilter, setDocumentTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [businessTypeFilter, setBusinessTypeFilter] = useState('all');
  const [destinationFilter, setDestinationFilter] = useState('');
  const [requesterFilter, setRequesterFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('completedDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const getCompletedDate = (req: typeof allCompleted[0]): Date => {
    const h = req.statusHistory?.find((s) => s.status === RequestStatus.COMPLETED);
    return h ? new Date(h.changedDate) : new Date(req.createdDate);
  };

  const filteredAndSorted = useMemo(() => {
    let filtered = allCompleted.filter((req) => {
      const productNameStr = req.products?.map((p) => p.name).join(' ') || '';
      const searchMatch = productNameStr.toLowerCase().includes(searchTerm.toLowerCase());
      const docTypeMatch = documentTypeFilter === 'all' || req.documentType === documentTypeFilter;
      const categoryMatch = categoryFilter === 'all' || (req.categories && req.categories.includes(categoryFilter));
      const businessMatch = businessTypeFilter === 'all' || (req.businessTypes && req.businessTypes.includes(businessTypeFilter));
      const destMatch = !destinationFilter || req.submissionDestination.includes(destinationFilter);
      const requesterMatch = !requesterFilter || req.requesterName.includes(requesterFilter);
      return searchMatch && docTypeMatch && categoryMatch && businessMatch && destMatch && requesterMatch;
    });

    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'id':
          aValue = a.id; bValue = b.id; break;
        case 'createdDate':
          aValue = new Date(a.createdDate).getTime(); bValue = new Date(b.createdDate).getTime(); break;
        case 'productName':
          aValue = a.products?.map((p) => p.name).join(', ') || '';
          bValue = b.products?.map((p) => p.name).join(', ') || '';
          break;
        case 'documentType':
          aValue = a.documentType || ''; bValue = b.documentType || ''; break;
        case 'category':
          aValue = a.categories?.[0] || ''; bValue = b.categories?.[0] || ''; break;
        case 'businessType':
          aValue = a.businessTypes?.[0] || ''; bValue = b.businessTypes?.[0] || ''; break;
        case 'submissionDestination':
          aValue = a.submissionDestination; bValue = b.submissionDestination; break;
        case 'requesterName':
          aValue = a.requesterName; bValue = b.requesterName; break;
        case 'completedDate':
          aValue = getCompletedDate(a).getTime(); bValue = getCompletedDate(b).getTime(); break;
        default:
          aValue = a.id; bValue = b.id;
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
  }, [allCompleted, searchTerm, documentTypeFilter, categoryFilter, businessTypeFilter, destinationFilter, requesterFilter, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortIndicator = (field: SortField) => {
    if (sortField !== field) return '';
    return sortOrder === 'asc' ? ' ↑' : ' ↓';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const handleReset = () => {
    setSearchTerm('');
    setDocumentTypeFilter('all');
    setCategoryFilter('all');
    setBusinessTypeFilter('all');
    setDestinationFilter('');
    setRequesterFilter('');
  };

  return (
    <main className="bg-background py-3 px-4">
      <div className="max-w-full mx-auto">
        <div className="mb-3">
          <h1 className="text-2xl font-bold text-foreground mb-1">完成文書</h1>
          <p className="text-sm text-muted-foreground">作成が完了した文書を確認・取得できます</p>
        </div>

        {/* Filters */}
        <Card className="p-3 mb-2">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
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
              <label className="block text-xs font-medium text-foreground mb-1">文書種別</label>
              <select
                value={documentTypeFilter}
                onChange={(e) => setDocumentTypeFilter(e.target.value)}
                className="w-full px-2 py-1.5 border border-input rounded-md bg-white text-sm text-foreground"
              >
                <option value="all">全て</option>
                <option value="商品規格書／商品カルテ">商品規格書／商品カルテ</option>
                <option value="eBASE">eBASE</option>
                <option value="各種証明書">各種証明書</option>
                <option value="その他">その他</option>
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
            <div className="flex items-end">
              <Button onClick={handleReset} className="w-full h-8 text-sm" variant="outline">
                リセット
              </Button>
            </div>
          </div>
        </Card>

        {/* Results info */}
        <div className="mb-1 text-xs text-muted-foreground">
          {filteredAndSorted.length}件の完了済み依頼
        </div>

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
                    onClick={() => handleSort('documentType')}>
                    文書種別{sortIndicator('documentType')}
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
                    onClick={() => handleSort('requesterName')}>
                    依頼者{sortIndicator('requesterName')}
                  </th>
                  <th className="px-2 py-1.5 text-left text-xs font-semibold text-foreground cursor-pointer hover:bg-accent whitespace-nowrap"
                    onClick={() => handleSort('completedDate')}>
                    完了日{sortIndicator('completedDate')}
                  </th>
                  <th className="px-2 py-1.5 text-left text-xs font-semibold text-foreground whitespace-nowrap">
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSorted.length > 0 ? (
                  filteredAndSorted.map((request, idx) => {
                    const completedDate = getCompletedDate(request);
                    return (
                      <tr
                        key={request.id}
                        className={`border-b border-border hover:bg-muted transition ${
                          idx % 2 === 0 ? 'bg-background' : 'bg-card'
                        }`}
                      >
                        <td className="px-2 py-1.5 text-xs text-foreground font-mono">{request.id}</td>
                        <td className="px-2 py-1.5 text-xs text-foreground whitespace-nowrap">
                          {formatDate(request.createdDate)}
                        </td>
                        <td className="px-2 py-1.5 text-xs text-foreground">
                          {request.products?.length > 0
                            ? request.products.map((p) => p.name).join(', ')
                            : '－'}
                        </td>
                        <td className="px-2 py-1.5 text-xs text-foreground">{request.documentType}</td>
                        <td className="px-2 py-1.5 text-xs text-foreground">{request.categories?.join(', ')}</td>
                        <td className="px-2 py-1.5 text-xs text-foreground">{request.businessTypes?.join(', ')}</td>
                        <td className="px-2 py-1.5 text-xs text-foreground">{request.submissionDestination}</td>
                        <td className="px-2 py-1.5 text-xs text-foreground">{request.requesterName}</td>
                        <td className="px-2 py-1.5 text-xs text-foreground whitespace-nowrap">
                          {formatDate(completedDate)}
                        </td>
                        <td className="px-2 py-1.5 text-xs">
                          <Link href={`/completed/${request.id}`}>
                            <Button size="sm" className="bg-green-600 text-white hover:bg-green-700 font-semibold text-xs px-3">
                              文書確認
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="px-3 py-6 text-center text-muted-foreground">
                      完了済みの依頼はありません
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
