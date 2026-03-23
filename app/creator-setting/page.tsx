'use client';

import { useState, useMemo } from 'react';
import { useAccessGuard } from '@/hooks/useAccessGuard';
import { getCreatorContacts } from '@/utils/contactDummyData';
import { CreatorContact } from '@/lib/types/contact';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const DOC_TYPE_LABELS: Record<string, string> = {
  specification: '商品規格書',
  ebase: 'eBASE',
  certificate: '各種証明書',
};

const DOC_TYPE_OPTIONS = [
  { value: 'specification', label: '商品規格書' },
  { value: 'ebase', label: 'eBASE' },
  { value: 'certificate', label: '各種証明書' },
];

const CATEGORY_OPTIONS = [
  'ビールテイスト',
  'RTD',
  'RTS',
  '和酒',
  'バカルディ社製品',
  '輸入ワイン・洋酒',
  '国内製造ワイン・洋酒',
  'その他',
];

export default function CreatorSettingPage() {
  useAccessGuard();
  const [contacts, setContacts] = useState<CreatorContact[]>(() => getCreatorContacts());
  const [editingContact, setEditingContact] = useState<CreatorContact | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CreatorContact | null>(null);
  const [filterDocType, setFilterDocType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const [formData, setFormData] = useState({
    name: '',
    department: '',
    documentType: 'specification' as 'specification' | 'ebase' | 'certificate',
    category: 'ビールテイスト',
    email: '',
  });

  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      const dtMatch = filterDocType === 'all' || c.documentType === filterDocType;
      const catMatch = filterCategory === 'all' || c.category === filterCategory;
      return dtMatch && catMatch;
    });
  }, [contacts, filterDocType, filterCategory]);

  const openAddForm = () => {
    setFormData({ name: '', department: '', documentType: 'specification', category: 'ビールテイスト', email: '' });
    setIsAddMode(true);
    setEditingContact(null);
  };

  const openEditForm = (contact: CreatorContact) => {
    setFormData({
      name: contact.name,
      department: contact.department,
      documentType: contact.documentType,
      category: contact.category,
      email: contact.email,
    });
    setEditingContact(contact);
    setIsAddMode(false);
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.department.trim()) return;

    if (editingContact) {
      setContacts((prev) =>
        prev.map((c) =>
          c.id === editingContact.id
            ? { ...c, ...formData }
            : c
        )
      );
      setEditingContact(null);
    } else {
      const newContact: CreatorContact = {
        id: `cc-new-${Date.now()}`,
        ...formData,
      };
      setContacts((prev) => [...prev, newContact]);
      setIsAddMode(false);
    }
  };

  const handleDelete = () => {
    if (deleteTarget) {
      setContacts((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    }
  };

  const cancelEdit = () => {
    setEditingContact(null);
    setIsAddMode(false);
  };

  return (
    <main className="bg-background py-3 px-4">
      <div className="max-w-full mx-auto">
        <div className="mb-3">
          <h1 className="text-2xl font-bold text-foreground mb-1">作成担当者設定</h1>
          <p className="text-sm text-muted-foreground">
            カテゴリ×文書種別に基づく作成担当者の登録・修正・削除を行います
          </p>
        </div>

        {/* Filters + Add button */}
        <Card className="p-3 mb-3">
          <div className="flex items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">文書種別</label>
              <select
                value={filterDocType}
                onChange={(e) => setFilterDocType(e.target.value)}
                className="px-2 py-1.5 border border-input rounded-md bg-white text-sm text-foreground"
              >
                <option value="all">全て</option>
                {DOC_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">カテゴリ</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-2 py-1.5 border border-input rounded-md bg-white text-sm text-foreground"
              >
                <option value="all">全て</option>
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="ml-auto">
              <Button onClick={openAddForm} className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 text-sm">
                ＋ 新規追加
              </Button>
            </div>
          </div>
        </Card>

        {/* Add/Edit Form */}
        {(isAddMode || editingContact) && (
          <Card className="p-4 mb-3 border-primary border-2">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              {editingContact ? '担当者を編集' : '新規担当者を追加'}
            </h3>
            <div className="grid grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">氏名 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-md border border-border bg-input px-2 py-1.5 text-sm"
                  placeholder="山田太郎"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">部署 *</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full rounded-md border border-border bg-input px-2 py-1.5 text-sm"
                  placeholder="製造部"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">文書種別 *</label>
                <select
                  value={formData.documentType}
                  onChange={(e) => setFormData({ ...formData, documentType: e.target.value as 'specification' | 'ebase' | 'certificate' })}
                  className="w-full px-2 py-1.5 border border-input rounded-md bg-white text-sm"
                >
                  {DOC_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">カテゴリ *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-2 py-1.5 border border-input rounded-md bg-white text-sm"
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">メール</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-md border border-border bg-input px-2 py-1.5 text-sm"
                  placeholder="example@company.com"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 text-sm">
                {editingContact ? '更新' : '追加'}
              </Button>
              <Button onClick={cancelEdit} variant="outline" className="h-8 text-sm">
                キャンセル
              </Button>
            </div>
          </Card>
        )}

        {/* Contact List */}
        <div className="text-xs text-muted-foreground mb-1">{filteredContacts.length}件の担当者</div>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-foreground">文書種別</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-foreground">カテゴリ</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-foreground">部署</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-foreground">氏名</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-foreground">メール</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-foreground">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.length > 0 ? (
                  filteredContacts.map((contact, idx) => (
                    <tr
                      key={contact.id}
                      className={`border-b border-border hover:bg-muted transition ${
                        idx % 2 === 0 ? 'bg-background' : 'bg-card'
                      }`}
                    >
                      <td className="px-3 py-1.5 text-xs text-foreground">
                        {DOC_TYPE_LABELS[contact.documentType] || contact.documentType}
                      </td>
                      <td className="px-3 py-1.5 text-xs text-foreground">{contact.category}</td>
                      <td className="px-3 py-1.5 text-xs text-foreground">{contact.department}</td>
                      <td className="px-3 py-1.5 text-xs text-foreground font-medium">{contact.name}</td>
                      <td className="px-3 py-1.5 text-xs text-foreground">{contact.email}</td>
                      <td className="px-3 py-1.5 text-xs">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs px-2 h-6"
                            onClick={() => openEditForm(contact)}
                          >
                            編集
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs px-2 h-6 text-destructive border-destructive hover:bg-destructive hover:text-white"
                            onClick={() => setDeleteTarget(contact)}
                          >
                            削除
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                      該当する担当者がありません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>担当者を削除しますか？</AlertDialogTitle>
              <AlertDialogDescription>
                {deleteTarget && `${deleteTarget.name}（${deleteTarget.department}）を削除します。この操作は取り消せません。`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3">
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                削除
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </main>
  );
}
