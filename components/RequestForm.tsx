'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { requestFormSchema, RequestFormData } from '@/lib/types';
import { isDeadlineWarning } from '@/lib/businessLogic';
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

// ダミーのログインユーザー情報（モック）
const DUMMY_USER = {
  name: '田中太郎',
  email: 'tanaka@example.com',
};

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function RequestForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogType, setDialogType] = useState<'submit' | 'clear' | null>(null);
  const [mounted, setMounted] = useState(false);
  const [businessTypes, setBusinessTypes] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
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
      requesterName: DUMMY_USER.name,
      requesterEmail: DUMMY_USER.email,
      requestDate: getTodayString(),
      productName: '黒ラベル',
    },
  });

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

  const onSubmit = async (data: RequestFormData) => {
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.log('Form submitted:', data, 'files:', attachedFiles);
      toast({
        title: '成功',
        description: '依頼を提出しました',
        duration: 3000,
      });
      reset({
        requesterName: DUMMY_USER.name,
        requesterEmail: DUMMY_USER.email,
        requestDate: getTodayString(),
        productName: '黒ラベル',
      });
      setBusinessTypes([]);
      setCategories([]);
      setAutoAssignedResult(null);
      setAttachedFiles([]);
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
    reset({
      requesterName: DUMMY_USER.name,
      requesterEmail: DUMMY_USER.email,
      requestDate: getTodayString(),
      productName: '黒ラベル',
    });
    setBusinessTypes([]);
    setCategories([]);
    setAutoAssignedResult(null);
    setAttachedFiles([]);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <main className="bg-background py-4">
      <div className="mx-auto max-w-7xl px-4">
        <h1 className="text-2xl font-bold text-foreground mb-4">品質文書リクエスト作成</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Top row: Basic Info + Product Info side by side */}
          <div className="grid grid-cols-2 gap-4">
            {/* Basic Info Section */}
            <div className="bg-card rounded-lg border border-border p-4 space-y-3">
              <h2 className="text-lg font-semibold text-foreground">基本情報</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    依頼者名
                  </label>
                  <input
                    type="text"
                    {...register('requesterName')}
                    readOnly
                    className="w-full rounded-md border border-border bg-muted/50 px-2 py-1.5 text-sm text-foreground focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    連絡先メール
                  </label>
                  <input
                    type="email"
                    {...register('requesterEmail')}
                    readOnly
                    className="w-full rounded-md border border-border bg-muted/50 px-2 py-1.5 text-sm text-foreground focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    依頼日
                  </label>
                  <input
                    type="date"
                    {...register('requestDate')}
                    readOnly
                    className="w-full rounded-md border border-border bg-muted/50 px-2 py-1.5 text-sm text-foreground focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Product Info Section */}
            <div className="bg-card rounded-lg border border-border p-4 space-y-3">
              <h2 className="text-lg font-semibold text-foreground">商品情報</h2>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">商品名 *</label>
                  <input
                    type="text"
                    {...register('productName')}
                    className="w-full rounded-md border border-border bg-input px-2 py-1.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="黒ラベル"
                  />
                  {errors.productName && (
                    <p className="text-xs text-destructive mt-0.5">{errors.productName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">商品コード</label>
                  <input
                    type="text"
                    {...register('productCode')}
                    className="w-full rounded-md border border-border bg-input px-2 py-1.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="KC123456"
                  />
                </div>
              </div>

              {/* Business Types & Categories side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">事業分類 *</label>
                  <div className="space-y-0.5">
                    {BUSINESS_TYPES.map((type) => (
                      <label key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={businessTypes.includes(type)}
                          onChange={() => toggleBusinessType(type)}
                          className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary"
                        />
                        <span className="ml-1.5 text-xs text-foreground">{type}</span>
                      </label>
                    ))}
                  </div>
                  {businessTypes.length === 0 && (
                    <p className="text-xs text-destructive mt-0.5">最低1つ選択してください</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    カテゴリ分類 *
                  </label>
                  <div className="space-y-0.5">
                    {CATEGORIES.map((cat) => (
                      <label key={cat} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={categories.includes(cat)}
                          onChange={() => toggleCategory(cat)}
                          className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary"
                        />
                        <span className="ml-1.5 text-xs text-foreground">{cat}</span>
                      </label>
                    ))}
                  </div>
                  {categories.length === 0 && (
                    <p className="text-xs text-destructive mt-0.5">最低1つ選択してください</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom row: Request Content + Auto-Assigned Result side by side */}
          <div className="grid grid-cols-2 gap-4">
            {/* Request Content Section */}
            <div className="bg-card rounded-lg border border-border p-4 space-y-3">
              <h2 className="text-lg font-semibold text-foreground">依頼内容</h2>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    文書種別 *
                  </label>
                  <Controller
                    control={control}
                    name="documentType"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full h-8 text-sm">
                          <SelectValue placeholder="文書種別を選択" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="specification">商品規格書／商品カルテ</SelectItem>
                          <SelectItem value="ebase">eBASE</SelectItem>
                          <SelectItem value="certificate">各種証明書</SelectItem>
                          <SelectItem value="other">その他</SelectItem>
                          <SelectItem value="unknown">不明</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.documentType && (
                    <p className="text-xs text-destructive mt-0.5">{errors.documentType.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">提出先 *</label>
                  <input
                    type="text"
                    {...register('submissionDestination')}
                    className="w-full rounded-md border border-border bg-input px-2 py-1.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="某百貨店"
                  />
                  {errors.submissionDestination && (
                    <p className="text-xs text-destructive mt-0.5">
                      {errors.submissionDestination.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  作成完了希望日 *
                </label>
                <input
                  type="date"
                  {...register('submissionDeadline')}
                  className="w-full rounded-md border border-border bg-input px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {errors.submissionDeadline && (
                  <p className="text-xs text-destructive mt-0.5">
                    {errors.submissionDeadline.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  ※ 5営業日以降で選択してください。急ぎの場合は別途、本社担当者にご連絡お願いします。
                </p>
                {showWarning && (
                  <p className="text-xs text-accent font-medium mt-1 bg-accent/10 px-2 py-1 rounded">
                    ⚠ 作成完了希望日まで5営業日未満です
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  依頼内容詳細 *
                </label>
                <textarea
                  {...register('requestDetails')}
                  className="w-full rounded-md border border-border bg-input px-2 py-1.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-16"
                  placeholder="具体的な依頼内容をご入力ください"
                  rows={3}
                />
                {errors.requestDetails && (
                  <p className="text-xs text-destructive mt-0.5">{errors.requestDetails.message}</p>
                )}
              </div>

              {/* 添付文書 */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  添付文書
                </label>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="w-full text-sm text-foreground file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                />
                {attachedFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {attachedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-muted/30 rounded px-2 py-1">
                        <span className="text-xs text-foreground truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-xs text-destructive hover:underline ml-2 flex-shrink-0"
                        >
                          削除
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right column: Auto-Assigned Result + Buttons */}
            <div className="flex flex-col gap-4">
              {/* Auto-Assigned Result Section */}
              {autoAssignedResult && (
                <div className="bg-card rounded-lg border border-border p-4">
                  <h2 className="text-lg font-semibold text-foreground mb-3">
                    送信先自動判定結果
                  </h2>
                  <div className="space-y-2">
                    <div className="flex">
                      <div className="w-28 text-xs font-medium text-muted-foreground">窓口部署：</div>
                      <div className="text-sm text-foreground">{autoAssignedResult.windowDepartment}</div>
                    </div>
                    <div className="flex">
                      <div className="w-28 text-xs font-medium text-muted-foreground">窓口担当者：</div>
                      <div className="text-sm text-foreground">
                        {autoAssignedResult.windowContacts.join(', ')}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-4 mt-auto">
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
            </div>
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
