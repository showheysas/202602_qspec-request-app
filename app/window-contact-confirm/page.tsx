'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getWindowContactRequests, updateRequestStatus } from '@/utils/dummyData';
import { assignCreator } from '@/utils/autoAssignLogic';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function WindowContactConfirmPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<'all' | 'unconfirmed' | 'confirmed'>('all');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [showDialog, setShowDialog] = useState(false);

  const requests = getWindowContactRequests();

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      if (statusFilter === 'unconfirmed') return req.status === 'window-contact-pending';
      if (statusFilter === 'confirmed') return req.status === 'creator-processing';
      return true;
    });
  }, [requests, statusFilter]);

  const handleConfirmClick = (request: any) => {
    console.log('詳細ページへ遷移:', request.requestId);
    router.push(`/detail/${request.id}`);
  };

  const handleCreateRequest = () => {
    if (selectedDocuments.length === 0) {
      toast({
        title: 'エラー',
        description: '作成文書を最低1つ選択してください',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }

    // Map display names to document type values
    const docTypeMap: Record<string, string[]> = {
      '商品規格書／商品カルテ': ['specification'],
      'eBASE': ['ebase'],
      '各種証明書': ['certificate'],
    };

    const documentTypeValues: string[] = [];
    selectedDocuments.forEach((doc) => {
      documentTypeValues.push(...(docTypeMap[doc] || []));
    });

    // Assign creator
    const creatorResult = assignCreator(selectedRequest.categories, selectedDocuments);

    // Update request status
    const updated = updateRequestStatus(
      selectedRequest.requestId,
      'creator-processing',
      `作成依頼されました。作成文書: ${selectedDocuments.join(', ')}`
    );

    if (updated) {
      // Update local state
      updated.documentsToCreate = documentTypeValues;
      updated.creators = creatorResult.creators;
      updated.creatorDepartment = creatorResult.creatorDepartment;
      updated.status = 'creator-processing';

      toast({
        title: '成功',
        description: '作成依頼しました',
        duration: 3000,
      });
    }

    setShowDialog(false);
    setSelectedRequest(null);
    setSelectedDocuments([]);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'window-contact-pending') {
      return <span className="px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700">未確認</span>;
    }
    return <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700">確認済み</span>;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  return (
    <main className="min-h-screen bg-background py-12">
      <div className="mx-auto max-w-7xl px-4">
        <h1 className="text-3xl font-bold text-foreground mb-8">窓口担当者確認</h1>

        {/* Filter and Search */}
        <div className="bg-card rounded-lg border border-border p-6 mb-6">
          <div className="flex items-center gap-4">
            <label className="font-medium text-foreground">ステータス:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-border rounded-lg bg-background text-foreground"
            >
              <option value="all">すべて</option>
              <option value="unconfirmed">未確認</option>
              <option value="confirmed">確認済み</option>
            </select>
            <Button
              variant="outline"
              onClick={() => setStatusFilter('all')}
              className="ml-auto"
            >
              リセット
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">依頼ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">依頼日</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">商品名</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">カテゴリ</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">事業分類</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">提出先</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">提出希望日</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">ステータス</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">アクション</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((req, idx) => (
                <tr
                  key={req.requestId}
                  className={idx % 2 === 0 ? 'bg-background' : 'bg-secondary'}
                >
                  <td className="px-6 py-4 text-sm text-foreground">{req.requestId}</td>
                  <td className="px-6 py-4 text-sm text-foreground">{req.requestDate}</td>
                  <td className="px-6 py-4 text-sm text-foreground">{req.productName}</td>
                  <td className="px-6 py-4 text-sm text-foreground">{req.categories?.join(', ')}</td>
                  <td className="px-6 py-4 text-sm text-foreground">{req.businessTypes?.join(', ')}</td>
                  <td className="px-6 py-4 text-sm text-foreground">{req.submissionDestination}</td>
                  <td className="px-6 py-4 text-sm text-foreground">{formatDate(req.submissionDeadline)}</td>
                  <td className="px-6 py-4 text-sm">{getStatusBadge(req.status)}</td>
                  <td className="px-6 py-4 text-sm">
                    <Button
                      onClick={() => handleConfirmClick(req)}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      size="sm"
                    >
                      確認・作成依頼
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRequests.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            該当する依頼がありません
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>作成依頼の確認</AlertDialogTitle>
          </AlertDialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {/* Request Info */}
              <div className="bg-secondary rounded-lg p-4 space-y-4">
                <h3 className="font-semibold text-foreground">依頼内容</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">商品名</label>
                    <p className="text-foreground font-medium bg-background px-3 py-2 rounded mt-1">
                      {selectedRequest.productName}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">カテゴリ分類</label>
                    <p className="text-foreground font-medium bg-background px-3 py-2 rounded mt-1">
                      {selectedRequest.categories?.join(', ')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">事業分類</label>
                    <p className="text-foreground font-medium bg-background px-3 py-2 rounded mt-1">
                      {selectedRequest.businessTypes?.join(', ')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">提出先</label>
                    <p className="text-foreground font-medium bg-background px-3 py-2 rounded mt-1">
                      {selectedRequest.submissionDestination}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm text-muted-foreground">依頼内容詳細</label>
                    <p className="text-foreground font-medium bg-background px-3 py-2 rounded mt-1">
                      {selectedRequest.requestDetails}
                    </p>
                  </div>
                </div>
              </div>

              {/* Document Selection */}
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">作成文書<span className="text-red-500">※必須</span></h3>
                <div className="space-y-2">
                  {['商品規格書／商品カルテ', 'eBASE', '各種証明書'].map((doc) => (
                    <label key={doc} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedDocuments.includes(doc)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDocuments([...selectedDocuments, doc]);
                          } else {
                            setSelectedDocuments(selectedDocuments.filter((d) => d !== doc));
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-foreground">{doc}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4">
            <AlertDialogCancel className="bg-muted text-muted-foreground hover:bg-muted/90">
              キャンセル
            </AlertDialogCancel>
            <Button
              onClick={() => alert('開発中です')}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              却下
            </Button>
            <Button
              onClick={handleCreateRequest}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              作成依頼する
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
