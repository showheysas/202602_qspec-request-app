'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { requestFormSchema, RequestFormData, RequestData, RequestStatus } from '@/lib/types';
import { isDeadlineWarning } from '@/lib/businessLogic';
import { assignWindowContact, assignCreator } from '@/utils/autoAssignLogic';
import { addRequest } from '@/utils/dummyData';
import { useAuth } from '@/contexts/AuthContext';
import { useAccessGuard } from '@/hooks/useAccessGuard';
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

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface ProductRow {
  name: string;
  varietyCode: string;
  remarks: string;
}

export function RequestForm() {
  const { toast } = useToast();
  useAccessGuard();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogType, setDialogType] = useState<'submit' | 'clear' | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [businessTypes, setBusinessTypes] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([{ name: '', varietyCode: '', remarks: '' }]);
  const [autoAssignedResult, setAutoAssignedResult] = useState<{
    windowDepartment: string;
    windowContacts: string[];
  } | null>(null);
  const [directToQA, setDirectToQA] = useState(false);
  const [ebaseCreatorResult, setEbaseCreatorResult] = useState<{
    creatorDepartment: string;
    creators: string[];
  } | null>(null);

  // eBASE詳細フィールド
  const [ebaseSpecLink, setEbaseSpecLink] = useState('');
  const [ebaseDrawing, setEbaseDrawing] = useState('');
  const [ebaseFiles, setEbaseFiles] = useState<File[]>([]);
  const [ebaseDesignNote, setEbaseDesignNote] = useState('');
  const [ebaseTempImage, setEbaseTempImage] = useState('');
  const [ebasePackaging, setEbasePackaging] = useState('');

  // 各種証明書詳細フィールド
  const [certDestName, setCertDestName] = useState('');
  const [certType, setCertType] = useState('');
  const [certItemName, setCertItemName] = useState('');
  const [certCopies, setCertCopies] = useState('');
  const [certSealRequired, setCertSealRequired] = useState('');
  const [certOriginalNeeded, setCertOriginalNeeded] = useState('');
  const [certShipTo, setCertShipTo] = useState('');

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
      requesterName: user?.name ?? '',
      requesterEmail: user?.email ?? '',
      requestDate: getTodayString(),
    },
  });

  const deadline = watch('submissionDeadline');
  const documentType = watch('documentType');

  // 商品規格書／商品カルテ, eBASE, 各種証明書 の場合は商品入力を表示
  const showProductFields = documentType === 'specification' || documentType === 'ebase' || documentType === 'certificate';
  const isEbase = documentType === 'ebase';
  const isCertificate = documentType === 'certificate';
  const isHouseholdOnly = businessTypes.length > 0 && businessTypes.every((t) => t === '家庭用');
  const isBusinessOnly = businessTypes.length > 0 && businessTypes.every((t) => t === '業務用');

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

  // eBASE作成担当者の自動判定（品質保証部直接依頼用）
  useEffect(() => {
    if (categories.length > 0) {
      const result = assignCreator(categories, ['eBASE']);
      setEbaseCreatorResult({
        creatorDepartment: result.creatorDepartment,
        creators: result.creators,
      });
    } else {
      setEbaseCreatorResult(null);
    }
  }, [categories]);

  const showWarning = mounted && deadline && isDeadlineWarning(new Date(deadline));

  const onSubmit = async (data: RequestFormData) => {
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      // ProductRow → ProductEntry マッピング
      const productEntries = products
        .filter((p) => p.name.trim())
        .map((p) => ({ name: p.name, code: p.varietyCode }));

      // 窓口担当者自動判定
      const windowResult = businessTypes.length > 0 && categories.length > 0
        ? assignWindowContact(businessTypes, categories)
        : { windowDepartment: '', windowContacts: [] as string[] };

      // 新規依頼をストアに追加
      const newId = `REQ-${Date.now()}`;
      // eBASE詳細情報
      const ebaseDetails = data.documentType === 'ebase' ? {
        productName: productEntries.map((p) => p.name).join('、'),
        specLink: ebaseSpecLink,
        drawing: ebaseDrawing,
        fileNames: ebaseFiles.map((f) => f.name),
        designNote: ebaseDesignNote,
        tempImage: ebaseTempImage,
        packaging: ebasePackaging,
      } : undefined;

      // 各種証明書詳細情報
      const certificateDetails = data.documentType === 'certificate' ? {
        destName: certDestName,
        certType: certType,
        itemName: certItemName,
        copies: certCopies,
        sealRequired: certSealRequired,
        originalNeeded: certOriginalNeeded,
        shipTo: certShipTo,
      } : undefined;

      const newRequest: RequestData = {
        id: newId,
        requestId: newId,
        requestDate: data.requestDate || getTodayString(),
        requestDepartment: '営業企画部',
        requesterName: data.requesterName,
        requesterEmail: data.requesterEmail,
        products: productEntries,
        documentType: data.documentType === 'specification' ? '商品規格書／商品カルテ'
          : data.documentType === 'ebase' ? 'eBASE'
          : data.documentType === 'certificate' ? '各種証明書'
          : 'その他',
        submissionDestination: data.submissionDestination,
        requestDetails: data.requestDetails,
        windowDepartment: windowResult.windowDepartment,
        windowContacts: windowResult.windowContacts,
        businessTypes,
        categories,
        documentsToCreate: [],
        creatorDepartment: '',
        creators: [],
        submissionDeadline: data.submissionDeadline,
        status: RequestStatus.AWAITING_WINDOW,
        createdDate: new Date(),
        statusHistory: [{
          id: `sh-${Date.now()}`,
          status: RequestStatus.AWAITING_WINDOW,
          changedBy: data.requesterName,
          changedDate: new Date(),
          note: '新規依頼を受け付けました',
        }],
        comments: [],
        completedDocuments: [],
        ebaseDetails,
        certificateDetails,
      };
      addRequest(newRequest);

      setShowSuccessDialog(true);
      reset({
        requesterName: user?.name ?? '',
        requesterEmail: user?.email ?? '',
        requestDate: getTodayString(),
      });
      setBusinessTypes([]);
      setCategories([]);
      setAutoAssignedResult(null);
      setDirectToQA(false);
      setAttachedFiles([]);
      setProducts([{ name: '', varietyCode: '', remarks: '' }]);
      setEbaseSpecLink(''); setEbaseDrawing(''); setEbaseFiles([]);
      setEbaseDesignNote(''); setEbaseTempImage(''); setEbasePackaging('');
      setCertDestName(''); setCertType(''); setCertItemName('');
      setCertCopies(''); setCertSealRequired(''); setCertOriginalNeeded(''); setCertShipTo('');
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
      requesterName: user?.name ?? '',
      requesterEmail: user?.email ?? '',
      requestDate: getTodayString(),
    });
    setBusinessTypes([]);
    setCategories([]);
    setAutoAssignedResult(null);
    setDirectToQA(false);
    setAttachedFiles([]);
    setProducts([{ name: '', varietyCode: '', remarks: '' }]);
    setEbaseSpecLink(''); setEbaseDrawing(''); setEbaseFiles([]);
    setEbaseDesignNote(''); setEbaseTempImage(''); setEbasePackaging('');
    setCertDestName(''); setCertType(''); setCertItemName('');
    setCertCopies(''); setCertSealRequired(''); setCertOriginalNeeded(''); setCertShipTo('');
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

  const updateProduct = (index: number, field: 'name' | 'varietyCode' | 'remarks', value: string) => {
    setProducts((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  };

  const addProductRow = () => {
    setProducts((prev) => [...prev, { name: '', varietyCode: '', remarks: '' }]);
  };

  const removeProductRow = (index: number) => {
    if (products.length <= 1) return;
    setProducts((prev) => prev.filter((_, i) => i !== index));
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
              <h2 className="text-lg font-semibold text-foreground">基本情報
                <span className="text-xs font-normal text-muted-foreground ml-2">（※ログイン情報より自動入力されます）</span>
              </h2>
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

            {/* Product Info Section (checkboxes only) */}
            <div className="bg-card rounded-lg border border-border p-4 space-y-3">
              <h2 className="text-lg font-semibold text-foreground">商品情報</h2>

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

              {/* 品質保証部直接依頼チェックボックス */}
              <div className="border-t border-border pt-2">
                <label className="flex items-start gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={directToQA}
                    onChange={(e) => setDirectToQA(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary mt-0.5"
                  />
                  <span className="text-xs text-foreground leading-relaxed">
                    品質保証部に直接依頼（CC：窓口担当者）
                    <span className="text-muted-foreground">※事業部が起案するeBase作成依頼に限る</span>
                  </span>
                </label>
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
                    placeholder="○○生協"
                  />
                  {errors.submissionDestination && (
                    <p className="text-xs text-destructive mt-0.5">
                      {errors.submissionDestination.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Conditional Product Fields */}
              {showProductFields && (
                <div className="border border-border rounded p-3 space-y-2 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-foreground">商品情報 *</label>
                    <button
                      type="button"
                      onClick={addProductRow}
                      className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
                    >
                      ＋ 商品を追加
                    </button>
                  </div>
                  {products.map((product, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={product.name}
                          onChange={(e) => updateProduct(index, 'name', e.target.value)}
                          className="w-full rounded-md border border-border bg-input px-2 py-1.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="商品名"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={product.varietyCode}
                          onChange={(e) => updateProduct(index, 'varietyCode', e.target.value)}
                          className="w-full rounded-md border border-border bg-input px-2 py-1.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="品種コード（親・子がある場合は両方）"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={product.remarks}
                          onChange={(e) => updateProduct(index, 'remarks', e.target.value)}
                          className="w-full rounded-md border border-border bg-input px-2 py-1.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="備考"
                        />
                      </div>
                      {products.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeProductRow(index)}
                          className="text-destructive hover:text-destructive/80 text-sm px-1 pt-1.5"
                          title="削除"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* eBASE詳細情報（eBASE選択時のみ） */}
              {isEbase && (
                <div className="border border-border rounded p-3 space-y-2 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-foreground">eBASE 詳細情報</p>
                    <p className="text-xs text-muted-foreground">※不明な項目は空欄で構いません</p>
                  </div>
                  {/* 家庭用の場合のみ全項目表示、業務用は商品情報のみ */}
                  {!isBusinessOnly && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">書状・商品規格書へのリンク</label>
                        <input type="text" value={ebaseSpecLink} onChange={(e) => setEbaseSpecLink(e.target.value)}
                          className="w-full rounded-md border border-border bg-input px-2 py-1.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="URLを入力（ない場合は「なし」と記入）" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">展開図、立体図形</label>
                        <select value={ebaseDrawing} onChange={(e) => setEbaseDrawing(e.target.value)}
                          className="w-full px-2 py-1.5 border border-input rounded-md bg-white text-sm text-foreground">
                          <option value="">選択してください</option>
                          <option value="GAZO-WEB">GAZO-WEB</option>
                          <option value="本社掲示板">本社掲示板</option>
                          <option value="その他">その他（ファイル添付必須）</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">ファイル添付</label>
                        <input type="file" multiple
                          onChange={(e) => { if (e.target.files) setEbaseFiles((prev) => [...prev, ...Array.from(e.target.files!)]); }}
                          className="w-full text-sm text-foreground file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer" />
                        {ebaseFiles.length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            {ebaseFiles.map((file, i) => (
                              <div key={i} className="flex items-center justify-between bg-muted/30 rounded px-2 py-0.5">
                                <span className="text-xs text-foreground truncate">{file.name}</span>
                                <button type="button" onClick={() => setEbaseFiles((prev) => prev.filter((_, idx) => idx !== i))}
                                  className="text-xs text-destructive hover:underline ml-2">削除</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">通常デザインと異なる場合は記入</label>
                        <input type="text" value={ebaseDesignNote} onChange={(e) => setEbaseDesignNote(e.target.value)}
                          className="w-full rounded-md border border-border bg-input px-2 py-1.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="「新」「NEW」が外れる、キャンペーンスリーブ使用など" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">仮画像の場合、どの画像が仮か＋確定予定日</label>
                        <input type="text" value={ebaseTempImage} onChange={(e) => setEbaseTempImage(e.target.value)}
                          className="w-full rounded-md border border-border bg-input px-2 py-1.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="例：正面画像が仮、確定予定 2026/02/15" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">通常の包材以外の場合、包材の単体重量を記入</label>
                        <input type="text" value={ebasePackaging} onChange={(e) => setEbasePackaging(e.target.value)}
                          className="w-full rounded-md border border-border bg-input px-2 py-1.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="包材名と重量を記入" />
                      </div>
                    </>
                  )}
                  {isBusinessOnly && (
                    <p className="text-xs text-muted-foreground">業務用のため、商品情報のみ入力してください。</p>
                  )}
                </div>
              )}

              {/* 各種証明書詳細情報（各種証明書選択時のみ） */}
              {isCertificate && (
                <div className="border border-border rounded p-3 space-y-2 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-foreground">各種証明書 詳細情報</p>
                    <p className="text-xs text-muted-foreground">※不明な項目は空欄で構いません</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">提出先の正式名称</label>
                    <input type="text" value={certDestName} onChange={(e) => setCertDestName(e.target.value)}
                      className="w-full rounded-md border border-border bg-input px-2 py-1.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="正式名称を入力" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">証明書の種類</label>
                    <textarea value={certType} onChange={(e) => setCertType(e.target.value)} rows={2}
                      className="w-full rounded-md border border-border bg-input px-2 py-1.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="例：原産地証明書、アレルゲン不使用証明書" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">対象アイテム名</label>
                    <input type="text" value={certItemName} onChange={(e) => setCertItemName(e.target.value)}
                      className="w-full rounded-md border border-border bg-input px-2 py-1.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="対象アイテム名を入力" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">必要部数</label>
                      <input type="text" value={certCopies} onChange={(e) => setCertCopies(e.target.value)}
                        className="w-full rounded-md border border-border bg-input px-2 py-1.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="例：2部" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">捺印の要否</label>
                      <select value={certSealRequired} onChange={(e) => setCertSealRequired(e.target.value)}
                        className="w-full px-2 py-1.5 border border-input rounded-md bg-white text-sm text-foreground">
                        <option value="">選択してください</option>
                        <option value="要">要</option>
                        <option value="否">否</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">証明書原本を常便で送る必要性</label>
                    <select value={certOriginalNeeded} onChange={(e) => setCertOriginalNeeded(e.target.value)}
                      className="w-full px-2 py-1.5 border border-input rounded-md bg-white text-sm text-foreground">
                      <option value="">選択してください</option>
                      <option value="あり">あり</option>
                      <option value="なし">なし</option>
                    </select>
                  </div>
                  {certOriginalNeeded === 'あり' && (
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">常便送り先の拠点・部署・名前</label>
                      <input type="text" value={certShipTo} onChange={(e) => setCertShipTo(e.target.value)}
                        className="w-full rounded-md border border-border bg-input px-2 py-1.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="例：東京本社 営業企画部 山田太郎" />
                    </div>
                  )}
                </div>
              )}

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
              {/* Auto-Assigned Result Section - always visible */}
              <div className="bg-card rounded-lg border border-border p-4">
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  送信先自動判定結果
                </h2>
                {directToQA ? (
                  <div className="space-y-2">
                    <div className="flex">
                      <div className="w-28 text-xs font-medium text-muted-foreground">送信先：</div>
                      <div className="text-sm text-foreground">
                        {ebaseCreatorResult
                          ? `${ebaseCreatorResult.creatorDepartment}　${ebaseCreatorResult.creators.join('、')}`
                          : '－'}
                      </div>
                    </div>
                    <div className="flex">
                      <div className="w-28 text-xs font-medium text-muted-foreground">CC：</div>
                      <div className="text-sm text-foreground">
                        {autoAssignedResult
                          ? `${autoAssignedResult.windowDepartment}　${autoAssignedResult.windowContacts.join('、')}`
                          : '－'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex">
                      <div className="w-28 text-xs font-medium text-muted-foreground">窓口部署：</div>
                      <div className="text-sm text-foreground">
                        {autoAssignedResult ? autoAssignedResult.windowDepartment : '－'}
                      </div>
                    </div>
                    <div className="flex">
                      <div className="w-28 text-xs font-medium text-muted-foreground">窓口担当者：</div>
                      <div className="text-sm text-foreground">
                        {autoAssignedResult ? autoAssignedResult.windowContacts.join(', ') : '－'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

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

        <AlertDialog open={showSuccessDialog} onOpenChange={(open) => !open && setShowSuccessDialog(false)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>送信完了</AlertDialogTitle>
              <AlertDialogDescription>依頼を送信しました。</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3 justify-end">
              <AlertDialogAction onClick={() => setShowSuccessDialog(false)}>OK</AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </main>
  );
}
