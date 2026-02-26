'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { getRequestById, addComment, addCompletedDocument, updateRequestStatus } from '@/utils/dummyData';
import { RequestData, RequestStatus, DocumentType } from '@/lib/types';
import { assignCreator } from '@/utils/autoAssignLogic';
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
import { useToast } from '@/hooks/use-toast';

export default function DetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();

  const [requestData, setRequestData] = useState<RequestData | null>(() => getRequestById(id));
  const [dialogType, setDialogType] = useState<'status' | 'document' | 'comment' | null>(null);
  const [newStatus, setNewStatus] = useState<RequestStatus>(requestData?.status || RequestStatus.AWAITING_WINDOW);
  const [newDocumentName, setNewDocumentName] = useState('');
  const [newComment, setNewComment] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [creatorDepartment, setCreatorDepartment] = useState('');
  const [creators, setCreators] = useState<string[]>([]);

  if (!requestData) {
    return (
      <main className="min-h-screen bg-background py-12">
        <div className="mx-auto max-w-4xl px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">依頼が見つかりません</h1>
            <Link href="/list">
              <Button>一覧に戻る</Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const isAwaitingWindow = requestData.status === RequestStatus.AWAITING_WINDOW;
  const isInProgress = requestData.status === RequestStatus.IN_PROGRESS;

  const getStatusBadgeColor = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.AWAITING_WINDOW:
        return 'bg-orange-500 text-white';
      case RequestStatus.IN_PROGRESS:
        return 'bg-yellow-500 text-white';
      case RequestStatus.COMPLETED:
        return 'bg-green-500 text-white';
    }
  };

  const getStatusLabel = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.AWAITING_WINDOW:
        return '窓口待ち';
      case RequestStatus.IN_PROGRESS:
        return '作成中';
      case RequestStatus.COMPLETED:
        return '完了';
    }
  };

  const getNextStatuses = (currentStatus: RequestStatus): RequestStatus[] => {
    switch (currentStatus) {
      case RequestStatus.AWAITING_WINDOW:
        return [RequestStatus.IN_PROGRESS];
      case RequestStatus.IN_PROGRESS:
        return [RequestStatus.COMPLETED];
      case RequestStatus.COMPLETED:
        return [];
    }
  };

  const handleStatusUpdate = async () => {
    const updated = updateRequestStatus(id, newStatus);
    if (updated) {
      setRequestData(updated);
      toast({
        title: '成功',
        description: 'ステータスを更新しました',
        duration: 3000,
      });
    }
    setDialogType(null);
  };

  const handleDocumentRegistration = async () => {
    if (!newDocumentName.trim()) {
      toast({
        title: 'エラー',
        description: 'ファイル名を入力してください',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }

    const doc = addCompletedDocument(id, DocumentType.EBASE, newDocumentName);
    if (doc) {
      const updated = getRequestById(id);
      if (updated) {
        setRequestData(updated);
      }
      toast({
        title: '成功',
        description: '文書を登録しました',
        duration: 3000,
      });
      setNewDocumentName('');
    }
    setDialogType(null);
  };

  const handleCommentAdd = async () => {
    if (!newComment.trim() || newComment.length < 1 || newComment.length > 500) {
      toast({
        title: 'エラー',
        description: 'コメントは1～500文字で入力してください',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }

    const comment = addComment(id, 'ユーザー', newComment);
    if (comment) {
      const updated = getRequestById(id);
      if (updated) {
        setRequestData(updated);
      }
      toast({
        title: '成功',
        description: 'コメントを追加しました',
        duration: 3000,
      });
      setNewComment('');
    }
    setDialogType(null);
  };

  const toggleDocument = (doc: string) => {
    setSelectedDocuments((prev) =>
      prev.includes(doc) ? prev.filter((d) => d !== doc) : [...prev, doc]
    );

    // ドキュメント選択時に自動判定
    if (!selectedDocuments.includes(doc)) {
      const newDocs = [...selectedDocuments, doc];
      const result = assignCreator(requestData?.categories || [], newDocs);
      setCreatorDepartment(result.creatorDepartment);
      setCreators(result.creators);
    }
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

    if (!requestData) return;

    // assignCreator() で作成担当者を自動判定
    const creatorResult = assignCreator(requestData.categories, selectedDocuments);

    // ステータスを更新
    updateRequestStatus(id, 'creator-processing');

    // リクエストに作成情報を保存
    requestData.status = 'creator-processing';
    requestData.documentsToCreate = selectedDocuments;
    requestData.creators = creatorResult.creators;
    requestData.creatorDepartment = creatorResult.creatorDepartment;
    setRequestData({ ...requestData });

    // トースト通知
    toast({
      title: '成功',
      description: '作成依頼しました',
      duration: 3000,
    });

    // ページをリロード
    window.location.reload();
  };

  // コメント欄JSX（窓口待ち・作成中/完了で共通利用）
  const commentSection = (
    <div className="bg-card rounded-lg border border-border p-6">
      <h2 className="text-xl font-semibold text-foreground mb-4">コメント欄</h2>

      {/* Comments List */}
      {requestData.comments && requestData.comments.length > 0 && (
        <div className="mb-6 space-y-3">
          {requestData.comments.map((comment) => (
            <div key={comment.id} className="border border-border rounded p-3">
              <div className="flex justify-between mb-2">
                <p className="font-semibold text-foreground">{comment.author}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(comment.timestamp).toLocaleString('ja-JP')}
                </p>
              </div>
              <p className="text-foreground">{comment.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add Comment Form */}
      <div className="p-4 bg-muted/30 rounded space-y-3">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            新規コメント
          </label>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="コメントを入力..."
            maxLength={500}
            className="w-full rounded-md border border-border bg-input px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-20"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {newComment.length} / 500 文字
          </p>
        </div>

        <Button
          onClick={() => setDialogType('comment')}
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 w-full"
        >
          コメント追加
        </Button>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-background py-12">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/list">
              <Button variant="ghost" className="p-2">
                ← 戻る
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">依頼詳細</h1>
              <p className="text-muted-foreground text-sm mt-1">{requestData.requestId}</p>
            </div>
          </div>
          <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${getStatusBadgeColor(requestData.status)}`}>
            {getStatusLabel(requestData.status)}
          </span>
        </div>

        <div className="space-y-8">
          {/* Section 1: Request Info */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">依頼情報</h2>
            <div className="grid grid-cols-2 gap-4 bg-muted/50 rounded p-4">
              <div>
                <p className="text-sm text-muted-foreground">依頼日</p>
                <p className="text-foreground font-medium">{requestData.requestDate}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">依頼者名</p>
                <p className="text-foreground font-medium">{requestData.requesterName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">連絡先メール</p>
                <p className="text-foreground font-medium">{requestData.requesterEmail}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">商品名</p>
                <p className="text-foreground font-medium">{requestData.productName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">事業分類</p>
                <p className="text-foreground font-medium">{requestData.businessTypes?.join(', ') || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">カテゴリ分類</p>
                <p className="text-foreground font-medium">{requestData.categories?.join(', ') || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">商品コード</p>
                <p className="text-foreground font-medium">{requestData.productCode || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">文書種別</p>
                <p className="text-foreground font-medium">{requestData.documentType}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">提出先</p>
                <p className="text-foreground font-medium">{requestData.submissionDestination}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">提出希望日</p>
                <p className="text-foreground font-medium">{requestData.submissionDeadline}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">窓口担当者</p>
                <p className="text-foreground font-medium mt-1">
                  {requestData.windowContacts?.length
                    ? `${requestData.windowDepartment}　${requestData.windowContacts.join('、')}`
                    : '-'}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">依頼内容詳細</p>
                <p className="text-foreground font-medium mt-2">{requestData.requestDetails}</p>
              </div>
            </div>
          </div>

          {/* Section 2.5: Document Selection（窓口待ちのみ表示） */}
          {isAwaitingWindow && (
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">作成文書選択</h2>
              <div className="space-y-4 p-4 bg-muted/30 rounded">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    作成文書（複数選択可）
                  </label>
                  <div className="space-y-2">
                    {['商品規格書／商品カルテ', 'eBASE', '各種証明書', 'その他'].map((doc) => (
                      <label key={doc} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedDocuments.includes(doc)}
                          onChange={() => toggleDocument(doc)}
                          className="w-4 h-4 rounded border-border text-primary"
                        />
                        <span className="ml-2 text-sm text-foreground">{doc}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 2.6: 作成担当者自動判定結果（窓口待ち）/ 作成依頼先情報（作成中・完了） */}
          {isAwaitingWindow && selectedDocuments.length > 0 && (
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">作成担当者自動判定結果</h2>
              <div className="space-y-3 bg-muted/50 rounded p-4">
                <div className="flex">
                  <div className="w-40 text-sm font-medium text-muted-foreground">作成文書:</div>
                  <div className="text-foreground">{selectedDocuments.join(', ')}</div>
                </div>
                <div className="flex">
                  <div className="w-40 text-sm font-medium text-muted-foreground">作成部署:</div>
                  <div className="text-foreground">{creatorDepartment || '-'}</div>
                </div>
                <div className="flex">
                  <div className="w-40 text-sm font-medium text-muted-foreground">作成担当者:</div>
                  <div className="text-foreground">{creators.join(', ') || '-'}</div>
                </div>
              </div>
            </div>
          )}

          {!isAwaitingWindow && (
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">作成依頼情報</h2>
              <div className="space-y-3 bg-muted/50 rounded p-4">
                <div className="flex">
                  <div className="w-40 text-sm font-medium text-muted-foreground">依頼者:</div>
                  <div className="text-foreground">
                    {(() => {
                      const name =
                        requestData.windowContacts?.find((n) => !n.includes('GL')) ??
                        requestData.windowContacts?.[0];
                      return name ? `${requestData.windowDepartment} ${name}` : '-';
                    })()}
                  </div>
                </div>
                <div className="flex">
                  <div className="w-40 text-sm font-medium text-muted-foreground">作成文書:</div>
                  <div className="text-foreground">{requestData.documentsToCreate?.join(', ') || '-'}</div>
                </div>
                <div className="flex">
                  <div className="w-40 text-sm font-medium text-muted-foreground">作成部署:</div>
                  <div className="text-foreground">{requestData.creatorDepartment || '-'}</div>
                </div>
                <div className="flex">
                  <div className="w-40 text-sm font-medium text-muted-foreground">作成担当者:</div>
                  <div className="text-foreground">{requestData.creators?.join(', ') || '-'}</div>
                </div>
              </div>
            </div>
          )}

          {/* コメント欄（窓口待ち：作成担当者自動判定結果とボタンの間） */}
          {isAwaitingWindow && commentSection}

          {/* 作成担当者修正・作成依頼ボタン（窓口待ちかつ文書選択済みのみ表示） */}
          {isAwaitingWindow && selectedDocuments.length > 0 && (
            <div className="flex gap-4">
              <Button
                onClick={() => alert('開発中です')}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                作成担当者修正
              </Button>
              <Button
                onClick={handleCreateRequest}
                className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1"
              >
                作成依頼
              </Button>
            </div>
          )}

          {/* Section 3: Status History */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">ステータス履歴</h2>
            <div className="space-y-4">
              {requestData.statusHistory?.map((history) => (
                <div key={history.id} className="border-l-4 border-primary pl-4 py-2">
                  <p className="font-semibold text-foreground">{getStatusLabel(history.status)}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(history.changedDate).toLocaleString('ja-JP')}
                  </p>
                  {history.note && <p className="text-sm text-foreground mt-1">{history.note}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Completed Documents（窓口待ちは非表示） */}
          {!isAwaitingWindow && (
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                {isInProgress ? '完成文書の登録' : '登録済み文書'}
              </h2>

              {/* Registration Form（作成中のみ表示） */}
              {isInProgress && (
                <div className="mb-6 p-4 bg-muted/30 rounded space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      文書ファイル名
                    </label>
                    <input
                      type="text"
                      value={newDocumentName}
                      onChange={(e) => setNewDocumentName(e.target.value)}
                      placeholder="specification_20250116.pdf"
                      className="w-full rounded-md border border-border bg-input px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">登録日</label>
                    <input
                      type="text"
                      value={new Date().toISOString().split('T')[0]}
                      disabled
                      className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-foreground focus:outline-none"
                    />
                  </div>

                  <Button
                    onClick={() => setDialogType('document')}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 w-full"
                  >
                    登録
                  </Button>
                </div>
              )}

              {/* Documents List */}
              {requestData.completedDocuments && requestData.completedDocuments.length > 0 ? (
                <div className="space-y-3">
                  {isInProgress && <h3 className="font-semibold text-foreground">登録済み文書</h3>}
                  {requestData.completedDocuments.map((doc) => (
                    <div key={doc.id} className="border border-border rounded p-3">
                      <p className="font-medium text-foreground">ファイル名: {doc.filePath}</p>
                      <p className="text-sm text-muted-foreground">
                        登録日: {new Date(doc.registrationDate).toISOString().split('T')[0]}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                !isInProgress && (
                  <p className="text-muted-foreground text-sm">登録済みの文書はありません</p>
                )
              )}
            </div>
          )}

          {/* Section 6: コメント欄（作成中・完了のみ表示） */}
          {!isAwaitingWindow && commentSection}

          {/* Section 7: Buttons */}
          <div className="flex gap-4">
            <Link href="/list" className="flex-1">
              <Button variant="outline" className="w-full h-10">
                一覧に戻る
              </Button>
            </Link>
          </div>
        </div>

        {/* Dialogs */}
        <AlertDialog open={dialogType === 'status'} onOpenChange={(open) => !open && setDialogType(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>ステータスを更新しますか？</AlertDialogTitle>
              <AlertDialogDescription>
                {getStatusLabel(requestData.status)} から {getStatusLabel(newStatus)} に変更します。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3">
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction onClick={handleStatusUpdate}>
                更新
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={dialogType === 'document'} onOpenChange={(open) => !open && setDialogType(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>文書を登録しますか？</AlertDialogTitle>
              <AlertDialogDescription>
                ファイル名: {newDocumentName}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3">
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction onClick={handleDocumentRegistration}>
                登録
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={dialogType === 'comment'} onOpenChange={(open) => !open && setDialogType(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>コメントを追加しますか？</AlertDialogTitle>
              <AlertDialogDescription>
                {newComment}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3">
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction onClick={handleCommentAdd}>
                追加
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </main>
  );
}
