'use client';

import {
  BookOpen,
  CheckCircle,
  CheckSquare,
  Download,
  Search,
  Square,
  Trash2,
  Upload,
} from 'lucide-react';
import { useId, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBatchOperations } from '@/hooks/useBatchOperations';
import { useTerminologyFilters } from '@/hooks/useTerminologyFilters';
import { AddTermDialog } from './add-term-dialog';
import { EditTermDialog } from './edit-term-dialog';
import { TermCard } from './term-card';

export interface Term {
  id?: number;
  word: string;
  reading?: string;
  meaning: string;
  category?: string;
  examples?: string[];
  tags?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  learned?: boolean;
  reviewCount?: number;
  lastReviewed?: Date;
  nextReview?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface TerminologyGlossaryProps {
  terms?: Term[];
  onAddTerm?: (term: Omit<Term, 'id'>) => Promise<void>;
  onUpdateTerm?: (term: Term) => Promise<void>;
  onDeleteTerm?: (id: number) => Promise<void>;
  className?: string;
}

export default function TerminologyGlossary({
  terms = [],
  onAddTerm,
  onUpdateTerm,
  onDeleteTerm,
  className = '',
}: TerminologyGlossaryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [learnedFilter, setLearnedFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'word' | 'createdAt' | 'reviewCount' | 'difficulty'>('word');
  const [_isAdding, _setIsAdding] = useState(false);
  const [editingTerm, setEditingTerm] = useState<Term | null>(null);
  const [importData, setImportData] = useState<string>('');

  const importDataId = useId();

  // 使用自定义Hook管理过滤和排序
  const { filteredAndSortedTerms, allCategories } = useTerminologyFilters({
    terms,
    searchQuery,
    categoryFilter,
    difficultyFilter,
    learnedFilter,
    sortBy,
  });

  // 使用自定义Hook管理批量操作
  const {
    selectedTerms,
    batchMode,
    handleTermSelect,
    handleSelectAll,
    handleBatchDelete,
    handleBatchMarkLearned,
    handleBatchModeToggle,
  } = useBatchOperations({
    terms,
    onUpdateTerm,
    onDeleteTerm,
  });

  const handleUpdateTerm = async () => {
    if (!editingTerm || !editingTerm.word.trim() || !editingTerm.meaning.trim()) return;

    try {
      await onUpdateTerm?.(editingTerm);
      setEditingTerm(null);
    } catch (_error) {
      // 静默处理更新术语错误，避免中断用户操作
      toast.error('Failed to update term');
    }
  };

  const handleDeleteTerm = async (id: number) => {
    if (!confirm('Are you sure you want to delete this term?')) return;

    try {
      await onDeleteTerm?.(id);
    } catch (_error) {
      // 静默处理删除术语错误，避免中断用户操作
      toast.error('Failed to delete term');
    }
  };

  const handleExportTerms = () => {
    const dataStr = JSON.stringify(terms, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `terms-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('术语导出成功');
  };

  const handleImportTerms = () => {
    try {
      const importedTerms = JSON.parse(importData);
      if (!Array.isArray(importedTerms)) {
        throw new Error('导入数据格式错误');
      }

      const validTerms = importedTerms.map((term: Partial<Term>) => ({
        word: term.word || '',
        reading: term.reading || '',
        meaning: term.meaning || '',
        category: term.category || '',
        examples: term.examples || [],
        tags: term.tags || [],
        difficulty: term.difficulty || 'medium',
        learned: term.learned || false,
        reviewCount: term.reviewCount || 0,
        createdAt: term.createdAt ? new Date(term.createdAt) : new Date(),
        updatedAt: term.updatedAt ? new Date(term.updatedAt) : new Date(),
      }));

      Promise.all(validTerms.map((term) => onAddTerm?.(term)))
        .then(() => {
          setImportData('');
          toast.success(`成功导入 ${validTerms.length} 个术语`);
        })
        .catch(() => {
          toast.error('导入失败');
        });
    } catch (_error) {
      toast.error('导入数据格式错误');
    }
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="mb-6 flex items-center justify-between">
        <h3 className="flex items-center font-medium text-lg">
          <BookOpen className="mr-2 h-5 w-5" />
          Terminology Glossary
        </h3>

        <div className="flex items-center space-x-2">
          <Button
            variant={batchMode ? 'secondary' : 'outline'}
            size="sm"
            onClick={handleBatchModeToggle}
          >
            <CheckSquare className="mr-2 h-4 w-4" />
            批量操作
          </Button>

          <Button variant="outline" size="sm" onClick={handleExportTerms}>
            <Download className="mr-2 h-4 w-4" />
            导出
          </Button>

          {onAddTerm && <AddTermDialog onAddTerm={onAddTerm} />}
        </div>
      </div>

      {/* 搜索和过滤 */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
          <Input
            placeholder="搜索术语..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            aria-label="搜索术语"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Label className="text-sm">分类:</Label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-32 rounded-md border border-gray-300 p-2"
            >
              <option value="all">全部分类</option>
              {allCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Label className="text-sm">难度:</Label>
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="w-32 rounded-md border border-gray-300 p-2"
            >
              <option value="all">全部难度</option>
              <option value="easy">简单</option>
              <option value="medium">中等</option>
              <option value="hard">困难</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Label className="text-sm">学习状态:</Label>
            <select
              value={learnedFilter}
              onChange={(e) => setLearnedFilter(e.target.value)}
              className="w-32 rounded-md border border-gray-300 p-2"
            >
              <option value="all">全部状态</option>
              <option value="learned">已学习</option>
              <option value="unlearned">未学习</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Label className="text-sm">排序:</Label>
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as 'word' | 'createdAt' | 'reviewCount' | 'difficulty')
              }
              className="w-32 rounded-md border border-gray-300 p-2"
            >
              <option value="word">按词汇</option>
              <option value="createdAt">按创建时间</option>
              <option value="reviewCount">按复习次数</option>
              <option value="difficulty">按难度</option>
            </select>
          </div>
        </div>
      </div>

      {/* 批处理操作栏 */}
      {batchMode && (
        <Card className="mb-4 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSelectAll(filteredAndSortedTerms)}
              >
                {selectedTerms.size === filteredAndSortedTerms.length ? '取消全选' : '全选'}
              </Button>
              <span className="text-muted-foreground text-sm">
                已选择 {selectedTerms.size} 个术语
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBatchMarkLearned(true)}
                disabled={selectedTerms.size === 0}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                标记已学习
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBatchMarkLearned(false)}
                disabled={selectedTerms.size === 0}
              >
                <Square className="mr-2 h-4 w-4" />
                标记未学习
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBatchDelete}
                disabled={selectedTerms.size === 0}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                删除选中
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* 导入功能 */}
      <Card className="mb-4 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Upload className="mr-2 h-4 w-4" />
                  导入术语
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>导入术语</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor={importDataId}>JSON 数据</Label>
                    <textarea
                      id={importDataId}
                      placeholder="粘贴 JSON 格式的术语数据..."
                      value={importData}
                      onChange={(e) => setImportData(e.target.value)}
                      rows={6}
                      className="w-full rounded-md border border-gray-300 p-2"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setImportData('')}>
                      取消
                    </Button>
                    <Button onClick={handleImportTerms} disabled={!importData.trim()}>
                      导入
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </Card>

      {/* Terms List */}
      <ScrollArea className="h-96">
        <div className="space-y-4">
          {filteredAndSortedTerms.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {terms.length === 0
                ? 'No terms yet. Add your first term!'
                : 'No terms match your search.'}
            </div>
          ) : (
            filteredAndSortedTerms.map((term) => (
              <TermCard
                key={term.id}
                term={term}
                batchMode={batchMode}
                isSelected={term.id ? selectedTerms.has(term.id) : false}
                onSelect={handleTermSelect}
                onEdit={setEditingTerm}
                onDelete={handleDeleteTerm}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {onUpdateTerm && (
        <EditTermDialog
          editingTerm={editingTerm}
          setEditingTerm={setEditingTerm}
          onUpdateTerm={handleUpdateTerm}
        />
      )}
    </Card>
  );
}
