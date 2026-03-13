'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { getRequestById, addComment, addCompletedDocument, updateRequestStatus } from '@/utils/dummyData';
import { RequestData, RequestStatus, DocumentType } from '@/lib/types';
import { assignCreator, assignWindowContact } from '@/utils/autoAssignLogic';
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
  const [dialogType, setDialogType] = useState<'status' | 'document' | 'comment' | 'createRequest' | null>(null);
  const [newStatus, setNewStatus] = useState<RequestStatus>(requestData?.status || RequestStatus.AWAITING_WINDOW);
  const [newDocumentName, setNewDocumentName] = useState('');
  const [newComment, setNewComment] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [otherDocumentComment, setOtherDocumentComment] = useState('');
  const [creatorDepartment, setCreatorDepartment] = useState('');
  const [creators, setCreators] = useState<string[]>([]);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  if (!requestData) {
    return (
      <main className="bg-background py-4">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center">
            <h1 className="text-xl font-bold text-foreground mb-4">依頼が見つかりません</h1>
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

  // アプリ内の現在日付（モック用固定値）
  const APP_TODAY = new Date('2026-01-22T00:00:00');

  const getDeadlineColor = () => {
    if (!requestData.submissionDeadline || requestData.status === RequestStatus.COMPLETED) return '';
    const dl = new Date(requestData.submissionDeadline + 'T00:00:00');
    const diff = (dl.getTime() - APP_TODAY.getTime()) / (1000 * 60 * 60 * 24);
    if (diff < 0) return 'text-red-600 font-bold';
    if (diff <= 3) return 'text-orange-500 font-bold';
    return '';
  };

  // 依頼発信先を自動判定で算出
  const windowAssignResult = requestData.businessTypes?.length > 0 && requestData.categories?.length > 0
    ? assignWindowContact(requestData.businessTypes, requestData.categories)
    : null;

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
    updateRequestStatus(id, 'creator-processing' as RequestStatus);

    // リクエストに作成情報を保存
    requestData.status = 'creator-processing';
    requestData.documentsToCreate = selectedDocuments;
    requestData.creators = creatorResult.creators;
    requestData.creatorDepartment = creatorResult.creatorDepartment;
    setRequestData({ ...requestData });

    // ダイアログを閉じてから成功ダイアログを表示
    setDialogType(null);
    setShowSuccessDialog(true);
  };

  // 商品名表示用ヘルパー
  const productNamesDisplay = requestData.products?.length > 0
    ? requestData.products.map((p) => p.name).join('、')
    : '－';

  // コメント欄JSX（全ステータスで共通利用）
  const commentSection = (
    <div className="bg-card rounded-lg border border-border p-4">
      <h2 className="text-lg font-semibold text-foreground mb-3">コメント欄</h2>

      {/* Comments List */}
      {requestData.comments && requestData.comments.length > 0 && (
        <div className="mb-4 space-y-2 max-h-48 overflow-y-auto">
          {requestData.comments.map((comment) => (
            <div key={comment.id} className="border border-border rounded p-2">
              <div className="flex justify-between mb-1">
                <p className="font-semibold text-sm text-foreground">{comment.author}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(comment.timestamp).toLocaleString('ja-JP')}
                </p>
              </div>
              <p className="text-sm text-foreground">{comment.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add Comment Form */}
      <div className="p-3 bg-muted/30 rounded space-y-2">
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">
            新規コメント
          </label>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="コメントを入力..."
            maxLength={500}
            rows={2}
            className="w-full rounded-md border border-border bg-input px-2 py-1.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-muted-foreground mt-0.5">
            {newComment.length} / 500 文字
          </p>
        </div>

        <Button
          onClick={() => setDialogType('comment')}
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 w-full text-sm"
        >
          コメント追加
        </Button>
      </div>
    </div>
  );

  return (
    <main className="bg-background py-4">
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Link href="/list">
              <Button variant="ghost" className="p-1 text-sm">
                ← 戻る
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">依頼詳細</h1>
              <p className="text-muted-foreground text-xs">{requestData.requestId}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${getStatusBadgeColor(requestData.status as RequestStatus)}`}>
            {getStatusLabel(requestData.status as RequestStatus)}
          </span>
        </div>

        {/* 2-column layout */}
        <div className="grid grid-cols-2 gap-4">
          {/* Left column: 依頼情報 + 作成依頼情報 + ステータス履歴 */}
          <div className="space-y-4">
            {/* Section 1: Request Info */}
            <div className="bg-card rounded-lg border border-border p-4">
              <h2 className="text-lg font-semibold text-foreground mb-3">依頼情報</h2>
              <div className="grid grid-cols-2 gap-2 bg-muted/50 rounded p-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">依頼日</p>
                  <p className="text-foreground font-medium">{requestData.requestDate}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">依頼者名</p>
                  <p className="text-foreground font-medium">{requestData.requesterName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">連絡先メール</p>
                  <p className="text-foreground font-medium">{requestData.requesterEmail}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">文書種別</p>
                  <p className="text-foreground font-medium">{requestData.documentType}</p>
                </div>
                {requestData.products?.length > 0 && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">商品</p>
                    <div className="text-foreground font-medium">
                      {requestData.products.map((p, i) => (
                        <p key={i}>{p.name}{p.code ? `（${p.code}）` : ''}</p>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">事業分類</p>
                  <p className="text-foreground font-medium">{requestData.businessTypes?.join(', ') || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">カテゴリ分類</p>
                  <p className="text-foreground font-medium">{requestData.categories?.join(', ') || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">提出先</p>
                  <p className="text-foreground font-medium">{requestData.submissionDestination}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">作成完了希望日</p>
                  <p className={`font-medium ${getDeadlineColor() || 'text-foreground'}`}>{requestData.submissionDeadline}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">依頼発信先</p>
                  <p className="text-foreground font-medium">
                    {windowAssignResult
                      ? `${windowAssignResult.windowDepartment}　${windowAssignResult.windowContacts.join('、')}`
                      : requestData.windowContacts?.length
                        ? `${requestData.windowDepartment}　${requestData.windowContacts.join('、')}`
                        : '－'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">依頼内容詳細</p>
                  <p className="text-foreground font-medium mt-1">{requestData.requestDetails}</p>
                </div>
              </div>
            </div>

            {/* Document Selection（窓口待ちのみ表示） */}
            {isAwaitingWindow && (
              <div className="bg-card rounded-lg border border-border p-4">
                <h2 className="text-lg font-semibold text-foreground mb-3">作成文書選択</h2>
                <div className="space-y-2 p-3 bg-muted/30 rounded">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-2">
                      作成文書（複数選択可）
                    </label>
                    <div className="space-y-1">
                      {['商品規格書／商品カルテ', 'eBASE', '各種証明書', 'その他'].map((doc) => (
                        <label key={doc} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedDocuments.includes(doc)}
                            onChange={() => toggleDocument(doc)}
                            className="w-3.5 h-3.5 rounded border-border text-primary"
                          />
                          <span className="ml-1.5 text-xs text-foreground">{doc}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {/* その他選択時のコメント入力欄 */}
                  {selectedDocuments.includes('その他') && (
                    <div className="mt-2">
                      <label className="block text-xs font-medium text-foreground mb-1">
                        「その他」の詳細
                      </label>
                      <textarea
                        value={otherDocumentComment}
                        onChange={(e) => setOtherDocumentComment(e.target.value)}
                        placeholder="その他の文書について詳細を入力してください"
                        rows={2}
                        className="w-full rounded-md border border-border bg-input px-2 py-1.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 作成担当者自動判定結果 - always visible for 窓口待ち */}
            {isAwaitingWindow && (
              <div className="bg-card rounded-lg border border-border p-4">
                <h2 className="text-lg font-semibold text-foreground mb-3">作成担当者自動判定結果</h2>
                <div className="space-y-2 bg-muted/50 rounded p-3 text-sm">
                  <div className="flex">
                    <div className="w-28 text-xs font-medium text-muted-foreground">作成文書:</div>
                    <div className="text-foreground">{selectedDocuments.length > 0 ? selectedDocuments.join(', ') : '－'}</div>
                  </div>
                  <div className="flex">
                    <div className="w-28 text-xs font-medium text-muted-foreground">作成部署:</div>
                    <div className="text-foreground">{creatorDepartment || '－'}</div>
                  </div>
                  <div className="flex">
                    <div className="w-28 text-xs font-medium text-muted-foreground">作成担当者:</div>
                    <div className="text-foreground">{creators.length > 0 ? creators.join(', ') : '－'}</div>
                  </div>
                </div>
              </div>
            )}

            {!isAwaitingWindow && (
              <div className="bg-card rounded-lg border border-border p-4">
                <h2 className="text-lg font-semibold text-foreground mb-3">作成依頼情報</h2>
                <div className="space-y-2 bg-muted/50 rounded p-3 text-sm">
                  <div className="flex">
                    <div className="w-28 text-xs font-medium text-muted-foreground">依頼者:</div>
                    <div className="text-foreground">
                      {(() => {
                        const name =
                          requestData.windowContacts?.find((n) => !n.includes('GL')) ??
                          requestData.windowContacts?.[0];
                        return name ? `${requestData.windowDepartment} ${name}` : '－';
                      })()}
                    </div>
                  </div>
                  <div className="flex">
                    <div className="w-28 text-xs font-medium text-muted-foreground">作成文書:</div>
                    <div className="text-foreground">{requestData.documentsToCreate?.join(', ') || '－'}</div>
                  </div>
                  <div className="flex">
                    <div className="w-28 text-xs font-medium text-muted-foreground">作成部署:</div>
                    <div className="text-foreground">{requestData.creatorDepartment || '－'}</div>
                  </div>
                  <div className="flex">
                    <div className="w-28 text-xs font-medium text-muted-foreground">作成担当者:</div>
                    <div className="text-foreground">{requestData.creators?.join(', ') || '－'}</div>
                  </div>
                </div>
              </div>
            )}

            {/* 作成担当者修正・作成依頼ボタン（窓口待ちかつ文書選択済みのみ表示） */}
            {isAwaitingWindow && selectedDocuments.length > 0 && (
              <div className="flex gap-3">
                <Button
                  onClick={() => alert('開発中です')}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  size="sm"
                >
                  作成担当者修正
                </Button>
                <Button
                  onClick={() => setDialogType('createRequest')}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1"
                  size="sm"
                >
                  作成依頼
                </Button>
              </div>
            )}

            {/* ステータス履歴 */}
            <div className="bg-card rounded-lg border border-border p-4">
              <h2 className="text-lg font-semibold text-foreground mb-3">ステータス履歴</h2>
              <div className="space-y-2">
                {requestData.statusHistory?.map((history) => (
                  <div key={history.id} className="border-l-4 border-primary pl-3 py-1">
                    <p className="font-semibold text-sm text-foreground">{getStatusLabel(history.status as RequestStatus)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(history.changedDate).toLocaleString('ja-JP')}
                    </p>
                    {history.note && <p className="text-xs text-foreground mt-0.5">{history.note}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <Link href="/list" className="flex-1">
                <Button variant="outline" className="w-full h-8 text-sm">
                  一覧に戻る
                </Button>
              </Link>
            </div>
          </div>

          {/* Right column: コメント欄 + 完成文書 */}
          <div className="space-y-4">
            {/* コメント欄（全ステータス共通） */}
            {commentSection}

            {/* 完成文書の登録（窓口待ち以外） */}
            {!isAwaitingWindow && (
              <div className="bg-card rounded-lg border border-border p-4">
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  {isInProgress ? '完成文書の登録' : '登録済み文書'}
                </h2>

                {/* Registration Form（作成中のみ表示） */}
                {isInProgress && (
                  <div className="mb-4 p-3 bg-muted/30 rounded space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">
                        文書ファイル名
                      </label>
                      <input
                        type="text"
                        value={newDocumentName}
                        onChange={(e) => setNewDocumentName(e.target.value)}
                        placeholder="specification_20260116.pdf"
                        className="w-full rounded-md border border-border bg-input px-2 py-1.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">登録日</label>
                      <input
                        type="text"
                        value={new Date().toISOString().split('T')[0]}
                        disabled
                        className="w-full rounded-md border border-border bg-muted/50 px-2 py-1.5 text-sm text-foreground focus:outline-none"
                      />
                    </div>

                    <Button
                      onClick={() => setDialogType('document')}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 w-full text-sm"
                    >
                      登録
                    </Button>
                  </div>
                )}

                {/* Documents List */}
                {requestData.completedDocuments && requestData.completedDocuments.length > 0 ? (
                  <div className="space-y-2">
                    {isInProgress && <h3 className="font-semibold text-sm text-foreground">登録済み文書</h3>}
                    {requestData.completedDocuments.map((doc) => (
                      <div key={doc.id} className="border border-border rounded p-2">
                        <p className="font-medium text-sm text-foreground">ファイル名: {doc.filePath}</p>
                        <p className="text-xs text-muted-foreground">
                          登録日: {new Date(doc.registrationDate).toISOString().split('T')[0]}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  !isInProgress && (
                    <p className="text-muted-foreground text-xs">登録済みの文書はありません</p>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        {/* Dialogs */}
        <AlertDialog open={dialogType === 'createRequest'} onOpenChange={(open) => !open && setDialogType(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>作成依頼を送信しますか？</AlertDialogTitle>
              <AlertDialogDescription>
                選択した文書（{selectedDocuments.join(', ')}）の作成依頼を送信します。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3">
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction onClick={handleCreateRequest}>
                送信
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showSuccessDialog} onOpenChange={(open) => !open && setShowSuccessDialog(false)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>送信完了</AlertDialogTitle>
              <AlertDialogDescription>
                作成依頼を送信しました。作成担当者にて対応が開始されます。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3 justify-end">
              <AlertDialogAction onClick={() => setShowSuccessDialog(false)}>
                OK
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={dialogType === 'status'} onOpenChange={(open) => !open && setDialogType(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>ステータスを更新しますか？</AlertDialogTitle>
              <AlertDialogDescription>
                {getStatusLabel(requestData.status as RequestStatus)} から {getStatusLabel(newStatus)} に変更します。
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
