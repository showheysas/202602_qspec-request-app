'use client';

import { use } from 'react';
import Link from 'next/link';
import { getRequestById } from '@/utils/dummyData';
import { RequestStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';

export default function CompletedDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const requestData = getRequestById(id);

  if (!requestData || requestData.status !== RequestStatus.COMPLETED) {
    return (
      <main className="bg-background py-4">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center">
            <h1 className="text-xl font-bold text-foreground mb-4">完了済み依頼が見つかりません</h1>
            <Link href="/completed">
              <Button>完成文書一覧に戻る</Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case RequestStatus.AWAITING_WINDOW: return '窓口待ち';
      case RequestStatus.IN_PROGRESS: return '作成中';
      case RequestStatus.COMPLETED: return '完了';
      default: return status;
    }
  };

  return (
    <main className="bg-background py-4">
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Link href="/completed">
              <Button variant="ghost" className="p-1 text-sm">
                ← 戻る
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">完成文書詳細</h1>
              <p className="text-muted-foreground text-xs">{requestData.requestId}</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-lg text-sm font-semibold bg-green-500 text-white">
            完了
          </span>
        </div>

        {/* 2-column layout */}
        <div className="grid grid-cols-2 gap-4">
          {/* Left column */}
          <div className="space-y-4">
            {/* 依頼情報 */}
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
                  <p className="text-xs text-muted-foreground">文書種別</p>
                  <p className="text-foreground font-medium">{requestData.documentType}</p>
                </div>
                {requestData.products?.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground">商品</p>
                    <div className="text-foreground font-medium">
                      {requestData.products.map((p, i) => (
                        <p key={i}>{p.name}{p.code ? `（${p.code}）` : ''}</p>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">カテゴリ</p>
                  <p className="text-foreground font-medium">{requestData.categories?.join(', ') || '－'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">提出先</p>
                  <p className="text-foreground font-medium">{requestData.submissionDestination}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">依頼内容詳細</p>
                  <p className="text-foreground font-medium mt-1">{requestData.requestDetails}</p>
                </div>
              </div>
            </div>

            {/* 窓口担当者・作成担当者 */}
            <div className="bg-card rounded-lg border border-border p-4">
              <h2 className="text-lg font-semibold text-foreground mb-3">担当者情報</h2>
              <div className="space-y-2 bg-muted/50 rounded p-3 text-sm">
                <div className="flex">
                  <div className="w-28 text-xs font-medium text-muted-foreground">窓口部署:</div>
                  <div className="text-foreground">{requestData.windowDepartment || '－'}</div>
                </div>
                <div className="flex">
                  <div className="w-28 text-xs font-medium text-muted-foreground">窓口担当者:</div>
                  <div className="text-foreground">{requestData.windowContacts?.join(', ') || '－'}</div>
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

                {/* eBASE 詳細情報（読み取り専用） */}
                {requestData.ebaseDetails && (() => {
                  const isBizOnly = requestData.businessTypes?.length > 0 && requestData.businessTypes.every((t: string) => t === '業務用');
                  return (
                    <div className="mt-3 border border-border rounded p-3 bg-muted/30">
                      <p className="text-xs font-semibold text-foreground mb-2">eBASE 詳細情報</p>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex">
                          <div className="w-36 text-xs font-medium text-muted-foreground shrink-0">商品名:</div>
                          <div className="text-foreground">{requestData.ebaseDetails.productName || '－'}</div>
                        </div>
                        {!isBizOnly && (
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
                  );
                })()}

                {/* 各種証明書 詳細情報（読み取り専用） */}
                {requestData.certificateDetails && (
                  <div className="mt-3 border border-border rounded p-3 bg-muted/30">
                    <p className="text-xs font-semibold text-foreground mb-2">各種証明書 詳細情報</p>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex">
                        <div className="w-36 text-xs font-medium text-muted-foreground shrink-0">提出先正式名称:</div>
                        <div className="text-foreground">{requestData.certificateDetails.destName || '－'}</div>
                      </div>
                      <div className="flex">
                        <div className="w-36 text-xs font-medium text-muted-foreground shrink-0">証明書の種類:</div>
                        <div className="text-foreground">{requestData.certificateDetails.certType || '－'}</div>
                      </div>
                      <div className="flex">
                        <div className="w-36 text-xs font-medium text-muted-foreground shrink-0">対象アイテム名:</div>
                        <div className="text-foreground">{requestData.certificateDetails.itemName || '－'}</div>
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

            <Link href="/completed">
              <Button variant="outline" className="w-full h-8 text-sm">
                完成文書一覧に戻る
              </Button>
            </Link>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* 登録済み文書 */}
            <div className="bg-card rounded-lg border border-border p-4">
              <h2 className="text-lg font-semibold text-foreground mb-3">登録済み文書</h2>
              {requestData.completedDocuments && requestData.completedDocuments.length > 0 ? (
                <div className="space-y-2">
                  {requestData.completedDocuments.map((doc) => (
                    <div key={doc.id} className="border border-border rounded p-3 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm text-foreground">ファイル名: {doc.filePath}</p>
                          <p className="text-xs text-muted-foreground">
                            登録日: {new Date(doc.registrationDate).toISOString().split('T')[0]}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" className="text-xs">
                          ダウンロード
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-xs">登録済みの文書はありません</p>
              )}
            </div>

            {/* ステータス履歴 */}
            <div className="bg-card rounded-lg border border-border p-4">
              <h2 className="text-lg font-semibold text-foreground mb-3">ステータス履歴</h2>
              <div className="space-y-2">
                {requestData.statusHistory?.map((history) => (
                  <div key={history.id} className="border-l-4 border-primary pl-3 py-1">
                    <p className="font-semibold text-sm text-foreground">{getStatusLabel(history.status)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(history.changedDate).toLocaleString('ja-JP')}
                    </p>
                    {history.note && <p className="text-xs text-foreground mt-0.5">{history.note}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
