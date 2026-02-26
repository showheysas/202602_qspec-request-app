'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { requestFormSchema, RequestFormData, AlcoholCategory } from '@/lib/types';
import { determineDepartment } from '@/lib/departmentLogic';
import { isDeadlineWarning, formatJapaneseDate } from '@/lib/businessLogic';
import { assignWindowContact } from '@/utils/autoAssignLogic';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const BUSINESS_TYPES = ['家庭用', '業務用', 'その他'];

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

export function RequestForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogType, setDialogType] = useState<'submit' | 'clear' | null>(null);
  const [selectedDeadline, setSelectedDeadline] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  const [businessTypes, setBusinessTypes] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [autoAssignedResult, setAutoAssignedResult] = useState<{
    windowDepartment: string;
    windowContacts: string[];
  } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
    reset,
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      alcoholCategory: AlcoholCategory.OTHER,
    },
  });

  const category = watch('alcoholCategory');
  const deadline = watch('submissionDeadline');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-assign window contact when business types and categories are selected
  useEffect(() => {
    if (businessTypes.length > 0 && categories.length > 0) {
      const result = assignWindowContact(businessTypes, categories);
      setAutoAssignedResult({
        windowDepartment: result.windowDepartment,
        windowContacts: result.windowContacts,
      });
    } else {
      setAutoAssignedResult(null);
    }
  }, [businessTypes, categories]);

  const showWarning = mounted && deadline && isDeadlineWarning(new Date(deadline));
  const department = determineDepartment(category as AlcoholCategory);

  const onSubmit = async (data: RequestFormData) => {
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.log('Form submitted:', data);
      toast({
        title: '成功',
        description: '依頼を提出しました',
        duration: 3000,
      });
      reset();
      setSelectedDeadline('');
      setBusinessTypes([]);
      setCategories([]);
      setAutoAssignedResult(null);
    } catch (error) {
      toast({
        title: 'エラー',
        description: 'リクエストの送信に失敗しました',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
      setDialogType(null);
    }
  };

  const handleClear = () => {
    reset();
    setSelectedDeadline('');
    setBusinessTypes([]);
    setCategories([]);
    setAutoAssignedResult(null);
    setDialogType(null);
  };

  const toggleBusinessType = (type: string) => {
    setBusinessTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleCategory = (cat: string) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  return (
    <main className="min-h-screen bg-background py-12">
      <div className="mx-auto max-w-4xl px-4">
        <h1 className="text-3xl font-bold text-foreground mb-8">品質文書リクエスト作成</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Info Section */}
          <div className="bg-card rounded-lg border border-border p-6 space-y-4">
            <h2 className="text-xl font-semibold text-foreground mb-4">基本情報</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  依頼者名 *
                </label>
                <input
                  type="text"
                  {...register('requesterName')}
                  className="w-full rounded-md border border-border bg-input px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="山田太郎"
                />
                {errors.requesterName && (
                  <p className="text-sm text-destructive mt-1">{errors.requesterName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  連絡先メール *
                </label>
                <input
                  type="email"
                  {...register('requesterEmail')}
                  className="w-full rounded-md border border-border bg-input px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="yamada@example.com"
                />
                {errors.requesterEmail && (
                  <p className="text-sm text-destructive mt-1">{errors.requesterEmail.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  アルコール分類
                </label>
                <select
                  {...register('alcoholCategory')}
                  className="w-full rounded-md border border-border bg-input px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value={AlcoholCategory.BEER}>ビール</option>
                  <option value={AlcoholCategory.RTDRTL}>RTD・RTL</option>
                  <option value={AlcoholCategory.SAKE}>和酒</option>
                  <option value={AlcoholCategory.WINE}>ワイン・洋酒</option>
                  <option value={AlcoholCategory.OTHER}>その他</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  依頼日
                </label>
                <input
                  type="date"
                  {...register('requestDate')}
                  className="w-full rounded-md border border-border bg-input px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Product Info Section */}
          <div className="bg-card rounded-lg border border-border p-6 space-y-4">
            <h2 className="text-xl font-semibold text-foreground mb-4">商品情報</h2>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">商品名 *</label>
              <input
                type="text"
                {...register('productName')}
                className="w-full rounded-md border border-border bg-input px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="キリン一番搾り"
              />
              {errors.productName && (
                <p className="text-sm text-destructive mt-1">{errors.productName.message}</p>
              )}
            </div>

            {/* Business Types */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">事業分類 *</label>
              <div className="space-y-2">
                {BUSINESS_TYPES.map((type) => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={businessTypes.includes(type)}
                      onChange={() => toggleBusinessType(type)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-foreground">{type}</span>
                  </label>
                ))}
              </div>
              {businessTypes.length === 0 && (
                <p className="text-sm text-destructive mt-1">最低1つ選択してください</p>
              )}
            </div>

            {/* Categories */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                カテゴリ分類 *
              </label>
              <div className="space-y-2">
                {CATEGORIES.map((cat) => (
                  <label key={cat} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={categories.includes(cat)}
                      onChange={() => toggleCategory(cat)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-foreground">{cat}</span>
                  </label>
                ))}
              </div>
              {categories.length === 0 && (
                <p className="text-sm text-destructive mt-1">最低1つ選択してください</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">商品コード</label>
              <input
                type="text"
                {...register('productCode')}
                className="w-full rounded-md border border-border bg-input px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="KC123456"
              />
            </div>
          </div>

          {/* Request Content Section */}
          <div className="bg-card rounded-lg border border-border p-6 space-y-4">
            <h2 className="text-xl font-semibold text-foreground mb-4">依頼内容</h2>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                文書種別 *
              </label>
              <Controller
                control={control}
                name="documentType"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="文書種別を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="specification">商品規格書／商品カルテ</SelectItem>
                      <SelectItem value="ebase">eBASE</SelectItem>
                      <SelectItem value="certificate">各種証明書</SelectItem>
                      <SelectItem value="other">その他</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.documentType && (
                <p className="text-sm text-destructive mt-1">{errors.documentType.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">提出先 *</label>
              <input
                type="text"
                {...register('submissionDestination')}
                className="w-full rounded-md border border-border bg-input px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="某百貨店"
              />
              {errors.submissionDestination && (
                <p className="text-sm text-destructive mt-1">
                  {errors.submissionDestination.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                提出希望日 *
              </label>
              <input
                type="date"
                {...register('submissionDeadline')}
                className="w-full rounded-md border border-border bg-input px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.submissionDeadline && (
                <p className="text-sm text-destructive mt-1">
                  {errors.submissionDeadline.message}
                </p>
              )}
              {showWarning && (
                <p className="text-sm text-accent font-medium mt-2 bg-accent/10 px-3 py-2 rounded">
                  ⚠️ 提出希望日まで5営業日未満です
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                依頼内容詳細 *
              </label>
              <textarea
                {...register('requestDetails')}
                className="w-full rounded-md border border-border bg-input px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-24"
                placeholder="具体的な依頼内容をご入力ください"
              />
              {errors.requestDetails && (
                <p className="text-sm text-destructive mt-1">{errors.requestDetails.message}</p>
              )}
            </div>
          </div>

          {/* Auto-Assigned Result Section */}
          {autoAssignedResult && (
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                送信先自動判定結果
              </h2>
              <div className="space-y-3">
                <div className="flex">
                  <div className="w-32 text-sm font-medium text-muted-foreground">窓口部署：</div>
                  <div className="text-sm text-foreground">{autoAssignedResult.windowDepartment}</div>
                </div>
                <div className="flex">
                  <div className="w-32 text-sm font-medium text-muted-foreground">窓口担当者：</div>
                  <div className="text-sm text-foreground">
                    {autoAssignedResult.windowContacts.join(', ')}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={isSubmitting || businessTypes.length === 0 || categories.length === 0}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 h-10"
              onClick={() => setDialogType('submit')}
            >
              {isSubmitting ? '送信中...' : '依頼を送信'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-10"
              onClick={() => setDialogType('clear')}
            >
              クリア
            </Button>
          </div>
        </form>

        {/* Dialogs */}
        <AlertDialog open={dialogType === 'submit'} onOpenChange={(open) => !open && setDialogType(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>依頼を送信しますか？</AlertDialogTitle>
              <AlertDialogDescription>
                この操作は取り消せません。入力した内容で依頼を送信します。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3">
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleSubmit(onSubmit)()}>
                送信
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={dialogType === 'clear'} onOpenChange={(open) => !open && setDialogType(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>フォームをクリアしますか？</AlertDialogTitle>
              <AlertDialogDescription>
                入力した内容がすべて削除されます。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3">
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction onClick={handleClear}>
                クリア
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </main>
  );
}
