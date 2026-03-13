'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { getDummyRequests } from '@/utils/dummyData';
import { RequestStatus } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function CompletedPage() {
  const completedRequests = useMemo(() => {
    return getDummyRequests().filter((req) => req.status === RequestStatus.COMPLETED);
  }, []);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <main className="bg-background py-3 px-4">
      <div className="max-w-full mx-auto">
        <div className="mb-3">
          <h1 className="text-2xl font-bold text-foreground mb-1">完成文書</h1>
          <p className="text-sm text-muted-foreground">作成が完了した文書を確認・取得できます</p>
        </div>

        <div className="mb-1 text-xs text-muted-foreground">
          {completedRequests.length}件の完了済み依頼
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-foreground whitespace-nowrap">依頼ID</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-foreground whitespace-nowrap">作成日</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-foreground whitespace-nowrap">商品名</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-foreground whitespace-nowrap">文書種別</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-foreground whitespace-nowrap">カテゴリ</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-foreground whitespace-nowrap">提出先</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-foreground whitespace-nowrap">依頼者</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-foreground whitespace-nowrap">完了日</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-foreground whitespace-nowrap">アクション</th>
                </tr>
              </thead>
              <tbody>
                {completedRequests.length > 0 ? (
                  completedRequests.map((request, idx) => {
                    const completedHistory = request.statusHistory?.find(
                      (h) => h.status === RequestStatus.COMPLETED
                    );
                    return (
                      <tr
                        key={request.id}
                        className={`border-b border-border hover:bg-muted transition ${
                          idx % 2 === 0 ? 'bg-background' : 'bg-card'
                        }`}
                      >
                        <td className="px-3 py-2 text-xs text-foreground font-mono">{request.id}</td>
                        <td className="px-3 py-2 text-xs text-foreground whitespace-nowrap">
                          {formatDate(request.createdDate)}
                        </td>
                        <td className="px-3 py-2 text-xs text-foreground">
                          {request.products?.length > 0
                            ? request.products.map((p) => p.name).join(', ')
                            : '－'}
                        </td>
                        <td className="px-3 py-2 text-xs text-foreground">{request.documentType}</td>
                        <td className="px-3 py-2 text-xs text-foreground">{request.categories?.join(', ')}</td>
                        <td className="px-3 py-2 text-xs text-foreground">{request.submissionDestination}</td>
                        <td className="px-3 py-2 text-xs text-foreground">{request.requesterName}</td>
                        <td className="px-3 py-2 text-xs text-foreground whitespace-nowrap">
                          {completedHistory
                            ? formatDate(completedHistory.changedDate)
                            : '－'}
                        </td>
                        <td className="px-3 py-2 text-xs">
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
                    <td colSpan={9} className="px-3 py-6 text-center text-muted-foreground">
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
