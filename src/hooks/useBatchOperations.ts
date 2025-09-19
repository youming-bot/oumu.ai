import { useState } from 'react';
import { toast } from 'sonner';
import type { Term } from '@/components/terminology-glossary';

interface UseBatchOperationsProps {
  terms: Term[];
  onUpdateTerm?: (term: Term) => Promise<void>;
  onDeleteTerm?: (id: number) => Promise<void>;
}

export function useBatchOperations({ terms, onUpdateTerm, onDeleteTerm }: UseBatchOperationsProps) {
  const [selectedTerms, setSelectedTerms] = useState<Set<number>>(new Set());
  const [batchMode, setBatchMode] = useState(false);

  const handleTermSelect = (id: number) => {
    setSelectedTerms((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = (filteredTerms: Term[]) => {
    if (selectedTerms.size === filteredTerms.length) {
      setSelectedTerms(new Set());
    } else {
      const allIds = filteredTerms
        .map((term) => term.id)
        .filter((id): id is number => id !== undefined);
      setSelectedTerms(new Set(allIds));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedTerms.size === 0) return;

    if (!confirm(`确定要删除 ${selectedTerms.size} 个术语吗？`)) return;

    try {
      await Promise.all(Array.from(selectedTerms).map((id) => onDeleteTerm?.(id)));
      setSelectedTerms(new Set());
      setBatchMode(false);
      toast.success('批量删除成功');
    } catch (_error) {
      toast.error('批量删除失败');
    }
  };

  const handleBatchMarkLearned = async (learned: boolean) => {
    if (selectedTerms.size === 0) return;

    try {
      await Promise.all(
        Array.from(selectedTerms).map((id) => {
          const term = terms.find((t) => t.id === id);
          if (term) {
            return onUpdateTerm?.({ ...term, learned, updatedAt: new Date() });
          }
          return Promise.resolve();
        })
      );
      setSelectedTerms(new Set());
      setBatchMode(false);
      toast.success(learned ? '批量标记为已学习' : '批量标记为未学习');
    } catch (_error) {
      toast.error('批量操作失败');
    }
  };

  const handleBatchModeToggle = () => {
    setBatchMode(!batchMode);
    setSelectedTerms(new Set());
  };

  return {
    selectedTerms,
    batchMode,
    handleTermSelect,
    handleSelectAll,
    handleBatchDelete,
    handleBatchMarkLearned,
    handleBatchModeToggle,
  };
}
