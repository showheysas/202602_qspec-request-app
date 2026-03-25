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
import { useAuth } from '@/contexts/AuthContext';
import { canEditDetail } from '@/lib/auth';
import { useAccessGuard } from '@/hooks/useAccessGuard';

export default function DetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();
  useAccessGuard();
  const { user } = useAuth();

  const [requestData, setRequestData] = useState<RequestData | null>(() => getRequestById(id));
  const [dialogType, setDialogType] = useState<'status' | 'document' | 'comment' | 'createRequest' | 'completeReport' | null>(null);
  const [newStatus, setNewStatus] = useState<RequestStatus>(requestData?.status || RequestStatus.AWAITING_WINDOW);
  const [newDocumentName, setNewDocumentName] = useState('');
  const [newComment, setNewComment] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [otherDocumentComment, setOtherDocumentComment] = useState('');
  const [createMode, setCreateMode] = useState<'asIs' | 'modified'>('asIs');
  const [modificationNote, setModificationNote] = useState('');
  const [creatorDepartment, setCreatorDepartment] = useState('');
  const [creators, setCreators] = useState<string[]>([]);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // eBASE用フィールド
  const [ebaseProducts, setEbaseProducts] = useState<{ name: string; varietyCode: string; remarks: string }[]>([{ name: '', varietyCode: '', remarks: '' }]);
  const [ebaseSpecLink, setEbaseSpecLink] = useState('');
  const [ebaseDrawing, setEbaseDrawing] = useState('');
  const [ebaseFiles, setEbaseFiles] = useState<File[]>([]);
  const [ebaseDesignNote, setEbaseDesignNote] = useState('');
  const [ebaseTempImage, setEbaseTempImage] = useState('');
  const [ebasePackaging, setEbasePackaging] = useState('');

  // 各種証明書用フィールド
  const [certProducts, setCertProducts] = useState<{ name: string; varietyCode: string; remarks: string }[]>([{ name: '', varietyCode: '', remarks: '' }]);
  const [certDestName, setCertDestName] = useState('');
  const [certType, setCertType] = useState('');
  const [certCopies, setCertCopies] = useState('');
  const [certSealRequired, setCertSealRequired] = useState('');
  const [certOriginalNeeded, setCertOriginalNeeded] = useState('');
  const [certShipTo, setCertShipTo] = useState('');

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
  const userCanEditDetail = canEditDetail(user?.role ?? 'planner');
  const isBusinessOnly = requestData.businessTypes?.length > 0 && requestData.businessTypes.every((t: string) => t === '業務用');

  const APP_TODAY = new Date('2026-01-22T00:00:00');

  const getDeadlineColor = () => {
    if (!requestData.submissionDeadline || requestData.status === RequestStatus.COMPLETED) return '';
    const dl = new Date(requestData.submissionDeadline + 'T00:00:00');
    const diff = (dl.getTime() - APP_TODAY.getTime()) / (1000 * 60 * 60 * 24);
    if (diff < 0) return 'text-red-600 font-bold';
    if (diff <= 3) return 'text-orange-500 font-bold';
    return '';
  };

  const windowAssignResult = requestData.businessTypes?.length > 0 && requestData.categories?.length > 0
    ? assignWindowContact(requestData.businessTypes, requestData.categories)
    : null;

  const getStatusBadgeColor = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.AWAITING_WINDOW: return 'bg-orange-500 text-white';
      case RequestStatus.IN_PROGRESS: return 'bg-yellow-500 text-white';
      case RequestStatus.COMPLETED: return 'bg-green-500 text-white';
    }
  };

  const getStatusLabel = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.AWAITING_WINDOW: return '窓口待ち';
      case RequestStatus.IN_PROGRESS: return '作成中';
      case RequestStatus.COMPLETED: return '完了';
    }
  };

  const handleStatusUpdate = async () => {
    const updated = updateRequestStatus(id, newStatus);
    if (updated) {
      setRequestData(updated);
      setSuccessMessage('ステータスを更新しました。');
      setShowSuccessDialog(true);
    }
    setDialogType(null);
  };

  const handleDocumentRegistration = async () => {
    if (!newDocumentName.trim()) {
      toast({ title: 'エラー', description: 'ファイル名を入力してください', variant: 'destructive', duration: 3000 });
      return;
    }
    const doc = addCompletedDocument(id, DocumentType.EBASE, newDocumentName);
    if (doc) {
      const updated = getRequestById(id);
      if (updated) setRequestData(updated);
      setSuccessMessage('文書を登録しました。');
      setShowSuccessDialog(true);
      setNewDocumentName('');
    }
    setDialogType(null);
  };

  const handleCommentAdd = async () => {
    if (!newComment.trim() || newComment.length < 1 || newComment.length > 500) {
      toast({ title: 'エラー', description: 'コメントは1～500文字で入力してください', variant: 'destructive', duration: 3000 });
      return;
    }
    const comment = addComment(id, user?.name ?? 'ユーザー', newComment);
    if (comment) {
      const updated = getRequestById(id);
      if (updated) setRequestData(updated);
      setSuccessMessage('コメントを送信しました。');
      setShowSuccessDialog(true);
      setNewComment('');
    }
    setDialogType(null);
  };

  const toggleDocument = (doc: string) => {
    const newDocs = selectedDocuments.includes(doc)
      ? selectedDocuments.filter((d) => d !== doc)
      : [...selectedDocuments, doc];
    setSelectedDocuments(newDocs);
    if (newDocs.length > 0) {
      const result = assignCreator(requestData?.categories || [], newDocs);
      setCreatorDepartment(result.creatorDepartment);
      setCreators(result.creators);
    } else {
      setCreatorDepartment('');
      setCreators([]);
    }
  };

  const handleCreateRequest = () => {
    if (selectedDocuments.length === 0) {
      toast({ title: 'エラー', description: '作成文書を最低1つ選択してください', variant: 'destructive', duration: 3000 });
      return;
    }
    if (createMode === 'modified' && !modificationNote.trim()) {
      toast({ title: 'エラー', description: '変更・追加部分を記入してください', variant: 'destructive', duration: 3000 });
      return;
    }
    if (!requestData) return;
    const creatorResult = assignCreator(requestData.categories, selectedDocuments);
    updateRequestStatus(id, 'creator-processing' as RequestStatus);
    requestData.status = 'creator-processing';
    requestData.documentsToCreate = selectedDocuments;
    requestData.creators = creatorResult.creators;
    requestData.creatorDepartment = creatorResult.creatorDepartment;
    requestData.windowCreateMode = createMode;
    requestData.windowModificationNote = createMode === 'modified' ? modificationNote : undefined;
    setRequestData({ ...requestData });
    setDialogType(null);
    setSuccessMessage('作成依頼を送信しました。作成担当者にて対応が開始されます。');
    setShowSuccessDialog(true);
  };

  const handleCompleteReport = () => {
    if (!requestData) return;
    updateRequestStatus(id, RequestStatus.COMPLETED);
    requestData.status = RequestStatus.COMPLETED;
    setRequestData({ ...requestData });
    setDialogType(null);
    setSuccessMessage(`完了報告を${requestData.requesterName}に発信しました。`);
    setShowSuccessDialog(true);
  };

  // コメント欄（コメント数に応じて自然拡張）
  const commentSection = (
    <div className="bg-card rounded-lg border border-border p-4">
      <h2 className="text-lg font-semibold text-foreground mb-3">コメント欄</h2>

      {requestData.comments && requestData.comments.length > 0 && (
        <div className="mb-4 space-y-2">
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

      <div className="p-3 bg-muted/30 rounded space-y-2">
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">新規コメント</label>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="コメントを入力..."
            maxLength={500}
            rows={2}
            className="w-full rounded-md border border-border bg-input px-2 py-1.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-muted-foreground mt-0.5">{newComment.length} / 500 文字</p>
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

  // ステータス履歴
  const statusHistorySection = (
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
  );

  return (
    <main className="bg-background py-4">
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Link href="/list">
              <Button variant="ghost" className="p-1 text-sm">← 戻る</Button>
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
          {/* ===== 左カラム ===== */}
          <div className="space-y-4">
            {/* 依頼情報（常時表示） */}
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

              {/* 商品情報（eBASE/証明書以外で商品がある場合） */}
              {!requestData.ebaseDetails && !requestData.certificateDetails && requestData.products?.length > 0 && (
                <div className="mt-3 border border-border rounded p-3 bg-muted/30">
                  <p className="text-xs font-semibold text-foreground mb-2">商品情報</p>
                  <div className="space-y-1 text-sm">
                    {requestData.products.map((p, i) => (
                      <p key={i} className="text-foreground">{p.name}{p.code ? `（${p.code}）` : ''}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* eBASE詳細情報（読み取り専用・依頼情報内） */}
              {requestData.ebaseDetails && (
                <div className="mt-3 border border-border rounded p-3 bg-muted/30">
                  <p className="text-xs font-semibold text-foreground mb-2">eBASE 詳細情報</p>
                  <div className="space-y-1.5 text-sm">
                    {requestData.products?.length > 0 && (
                      <div className="flex">
                        <div className="w-36 text-xs font-medium text-muted-foreground shrink-0">商品:</div>
                        <div className="text-foreground">
                          {requestData.products.map((p, i) => (
                            <p key={i}>{p.name}{p.code ? `（${p.code}）` : ''}</p>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex">
                      <div className="w-36 text-xs font-medium text-muted-foreground shrink-0">商品名（詳細）:</div>
                      <div className="text-foreground">{requestData.ebaseDetails.productName || '－'}</div>
                    </div>
                    {!isBusinessOnly && (
                      <>
                        <div className="flex">
                          <div className="w-36 text-xs font-medium text-muted-foreground shrink-0">書状・規格書リンク:</div>
                          <div className="text-foreground break-all">{requestData.ebaseDetails.specLink || '－'}</div>
                        </div>
                        <div className="flex">
                          <div className="w-36 text-xs font-medium text-muted-foreground shrink-0">展開図・立体図形:</div>
                          <div className="text-foreground">{requestData.ebaseDetails.drawing || '－'}</div>
                        </div>
                        {requestData.ebaseDetails.fileNames?.length > 0 && (
                          <div className="flex">
                            <div className="w-36 text-xs font-medium text-muted-foreground shrink-0">添付ファイル:</div>
                            <div className="text-foreground">{requestData.ebaseDetails.fileNames.join(', ')}</div>
                          </div>
                        )}
                        {requestData.ebaseDetails.designNote && (
                          <div className="flex">
                            <div className="w-36 text-xs font-medium text-muted-foreground shrink-0">デザイン変更メモ:</div>
                            <div className="text-foreground">{requestData.ebaseDetails.designNote}</div>
                          </div>
                        )}
                        {requestData.ebaseDetails.tempImage && (
                          <div className="flex">
                            <div className="w-36 text-xs font-medium text-muted-foreground shrink-0">仮画像情報:</div>
                            <div className="text-foreground">{requestData.ebaseDetails.tempImage}</div>
                          </div>
                        )}
                        {requestData.ebaseDetails.packaging && (
                          <div className="flex">
                            <div className="w-36 text-xs font-medium text-muted-foreground shrink-0">包材単体重量:</div>
                            <div className="text-foreground">{requestData.ebaseDetails.packaging}</div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* 各種証明書詳細情報（読み取り専用・依頼情報内） */}
              {requestData.certificateDetails && (
                <div className="mt-3 border border-border rounded p-3 bg-muted/30">
                  <p className="text-xs font-semibold text-foreground mb-2">各種証明書 詳細情報</p>
                  <div className="space-y-1.5 text-sm">
                    {requestData.products?.length > 0 && (
                      <div className="flex">
                        <div className="w-36 text-xs font-medium text-muted-foreground shrink-0">商品:</div>
                        <div className="text-foreground">
                          {requestData.products.map((p, i) => (
                            <p key={i}>{p.name}{p.code ? `（${p.code}）` : ''}</p>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex">
                      <div className="w-36 text-xs font-medium text-muted-foreground shrink-0">提出先正式名称:</div>
                      <div className="text-foreground">{requestData.certificateDetails.destName || '－'}</div>
                    </div>
                    <div className="flex">
                      <div className="w-36 text-xs font-medium text-muted-foreground shrink-0">証明書の種類:</div>
                      <div className="text-foreground">{requestData.certificateDetails.certType || '－'}</div>
                    </div>
                    <div className="flex">
                      <div className="w-36 text-xs font-medium text-muted-foreground shrink-0">必要部数:</div>
                      <div className="text-foreground">{requestData.certificateDetails.copies || '－'}</div>
                    </div>
                    <div className="flex">
                      <div className="w-36 text-xs font-medium text-muted-foreground shrink-0">捺印の要否:</div>
                      <div className="text-foreground">{requestData.certificateDetails.sealRequired || '－'}</div>
                    </div>
                    <div className="flex">
                      <div className="w-36 text-xs font-medium text-muted-foreground shrink-0">原本常便送付:</div>
                      <div className="text-foreground">{requestData.certificateDetails.originalNeeded || '－'}</div>
                    </div>
                    {requestData.certificateDetails.shipTo && (
                      <div className="flex">
                        <div className="w-36 text-xs font-medium text-muted-foreground shrink-0">送り先:</div>
                        <div className="text-foreground">{requestData.certificateDetails.shipTo}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 窓口担当者対応（窓口待ち && 編集権限あり） */}
            {isAwaitingWindow && userCanEditDetail && (
              <div className="bg-card rounded-lg border border-border p-4">
                <h2 className="text-lg font-semibold text-foreground mb-3">窓口担当者対応</h2>
                <div className="space-y-3 p-3 bg-muted/30 rounded">
                  {/* 作成文書チェックボックス */}
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-2">作成文書（複数選択可）</label>
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

                  {/* 作成方法の選択 */}
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-2">作成方法</label>
                    <div className="space-y-1">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="createMode"
                          checked={createMode === 'asIs'}
                          onChange={() => setCreateMode('asIs')}
                          className="w-3.5 h-3.5 border-border text-primary"
                        />
                        <span className="ml-1.5 text-xs text-foreground">依頼情報の内容で作成</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="createMode"
                          checked={createMode === 'modified'}
                          onChange={() => setCreateMode('modified')}
                          className="w-3.5 h-3.5 border-border text-primary"
                        />
                        <span className="ml-1.5 text-xs text-foreground">依頼情報を変更・情報追加して作成</span>
                      </label>
                    </div>
                  </div>

                  {/* 変更・追加部分を記入（変更して作成の場合のみ） */}
                  {createMode === 'modified' && (
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">変更・追加部分を記入 *</label>
                      <textarea
                        value={modificationNote}
                        onChange={(e) => setModificationNote(e.target.value)}
                        placeholder="依頼情報から変更する部分を具体的に記入してください"
                        rows={3}
                        className="w-full rounded-md border border-border bg-input px-2 py-1.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 窓口担当者対応（作成中・完了：読み取り専用） */}
            {!isAwaitingWindow && (requestData.windowCreateMode) && (
              <div className="bg-card rounded-lg border border-border p-4">
                <h2 className="text-lg font-semibold text-foreground mb-3">窓口担当者対応</h2>
                <div className="space-y-2 bg-muted/50 rounded p-3 text-sm">
                  <div className="flex">
                    <div className="w-28 text-xs font-medium text-muted-foreground">作成文書:</div>
                    <div className="text-foreground">{requestData.documentsToCreate?.join(', ') || '－'}</div>
                  </div>
                  <div className="flex">
                    <div className="w-28 text-xs font-medium text-muted-foreground">作成方法:</div>
                    <div className="text-foreground">
                      {requestData.windowCreateMode === 'asIs' ? '依頼情報の内容で作成' : '依頼情報を変更・情報追加して作成'}
                    </div>
                  </div>
                  {requestData.windowCreateMode === 'modified' && requestData.windowModificationNote && (
                    <div className="flex">
                      <div className="w-28 text-xs font-medium text-muted-foreground shrink-0">変更・追加:</div>
                      <div className="text-foreground whitespace-pre-wrap">{requestData.windowModificationNote}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 作成依頼情報（作成中・完了） */}
            {!isAwaitingWindow && (
              <div className="bg-card rounded-lg border border-border p-4">
                <h2 className="text-lg font-semibold text-foreground mb-3">作成依頼情報</h2>
                <div className="space-y-2 bg-muted/50 rounded p-3 text-sm">
                  <div className="flex">
                    <div className="w-28 text-xs font-medium text-muted-foreground">依頼者:</div>
                    <div className="text-foreground">
                      {(() => {
                        const name = requestData.windowContacts?.find((n) => !n.includes('GL')) ?? requestData.windowContacts?.[0];
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

            {/* 一覧に戻るボタン */}
            <div className="flex gap-3">
              <Link href="/list" className="flex-1">
                <Button variant="outline" className="w-full h-8 text-sm">一覧に戻る</Button>
              </Link>
            </div>
          </div>

          {/* ===== 右カラム ===== */}
          <div className="space-y-4">
            {/* コメント欄（常時表示） */}
            {commentSection}

            {/* 作成担当者自動判定結果（窓口待ち && 編集権限あり）← 左から移動 */}
            {isAwaitingWindow && userCanEditDetail && (
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

            {/* 作成依頼ボタン（窓口待ち && 編集権限あり && 文書選択済み）← 左から移動 */}
            {isAwaitingWindow && userCanEditDetail && selectedDocuments.length > 0 && (
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

            {/* 完成文書（作成中・完了 && 編集権限あり） */}
            {!isAwaitingWindow && userCanEditDetail && (
              <div className="bg-card rounded-lg border border-border p-4">
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  {isInProgress ? '完成文書の登録' : '登録済み文書'}
                </h2>

                {isInProgress && (
                  <div className="mb-4 p-3 bg-muted/30 rounded space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">文書ファイル名</label>
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

            {/* 完了＆依頼者に報告ボタン（作成中 && 編集権限あり） */}
            {isInProgress && userCanEditDetail && (
              <Button
                onClick={() => setDialogType('completeReport')}
                className="w-full bg-green-600 text-white hover:bg-green-700 h-10 text-sm font-semibold"
              >
                完了＆依頼者に報告
              </Button>
            )}

            {/* ステータス履歴（常時表示）← 左から移動 */}
            {statusHistorySection}
          </div>
        </div>

        {/* Dialogs */}
        <AlertDialog open={dialogType === 'completeReport'} onOpenChange={(open) => !open && setDialogType(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>完了＆依頼者に報告</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-2 text-sm">
                  <p>以下の宛先に完了報告を発信します。</p>
                  <div className="bg-muted/50 rounded p-3 space-y-1.5">
                    <div className="flex">
                      <span className="w-16 font-medium text-foreground">宛先：</span>
                      <span className="text-foreground">{requestData?.requesterName}</span>
                    </div>
                    <div className="flex">
                      <span className="w-16 font-medium text-foreground">CC：</span>
                      <span className="text-foreground">
                        {[
                          ...(requestData?.creators || []),
                          ...(requestData?.windowContacts || []),
                        ].filter(Boolean).join('、') || '－'}
                      </span>
                    </div>
                  </div>
                  <p>発信しますか？</p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3">
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction onClick={handleCompleteReport}>発信</AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>

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
              <AlertDialogAction onClick={handleCreateRequest}>送信</AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showSuccessDialog} onOpenChange={(open) => !open && setShowSuccessDialog(false)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>送信完了</AlertDialogTitle>
              <AlertDialogDescription>{successMessage}</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3 justify-end">
              <AlertDialogAction onClick={() => setShowSuccessDialog(false)}>OK</AlertDialogAction>
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
              <AlertDialogAction onClick={handleStatusUpdate}>更新</AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={dialogType === 'document'} onOpenChange={(open) => !open && setDialogType(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>文書を登録しますか？</AlertDialogTitle>
              <AlertDialogDescription>ファイル名: {newDocumentName}</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3">
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction onClick={handleDocumentRegistration}>登録</AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={dialogType === 'comment'} onOpenChange={(open) => !open && setDialogType(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>コメントを追加しますか？</AlertDialogTitle>
              <AlertDialogDescription>{newComment}</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3">
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction onClick={handleCommentAdd}>追加</AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </main>
  );
}
