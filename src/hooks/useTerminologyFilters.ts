import { useMemo } from 'react';
import type { Term } from '@/components/terminology-glossary';

interface UseTerminologyFiltersProps {
  terms: Term[];
  searchQuery: string;
  categoryFilter: string;
  difficultyFilter: string;
  learnedFilter: string;
  sortBy: 'word' | 'createdAt' | 'reviewCount' | 'difficulty';
}

export function useTerminologyFilters({
  terms,
  searchQuery,
  categoryFilter,
  difficultyFilter,
  learnedFilter,
  sortBy,
}: UseTerminologyFiltersProps) {
  const filteredAndSortedTerms = useMemo(() => {
    let result = terms.filter(
      (term) =>
        term.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        term.meaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
        term.reading?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        term.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        term.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // 分类过滤
    if (categoryFilter !== 'all') {
      result = result.filter((term) => term.category === categoryFilter);
    }

    // 难度过滤
    if (difficultyFilter !== 'all') {
      result = result.filter((term) => term.difficulty === difficultyFilter);
    }

    // 学习状态过滤
    if (learnedFilter !== 'all') {
      result = result.filter((term) =>
        learnedFilter === 'learned' ? term.learned : !term.learned
      );
    }

    // 排序
    result.sort((a, b) => {
      switch (sortBy) {
        case 'word':
          return a.word.localeCompare(b.word);
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'reviewCount':
          return (b.reviewCount || 0) - (a.reviewCount || 0);
        case 'difficulty': {
          const difficultyOrder = { easy: 0, medium: 1, hard: 2 };
          return (
            difficultyOrder[a.difficulty || 'medium'] - difficultyOrder[b.difficulty || 'medium']
          );
        }
        default:
          return 0;
      }
    });

    return result;
  }, [searchQuery, terms, categoryFilter, difficultyFilter, learnedFilter, sortBy]);

  const allCategories = useMemo(() => {
    const categories = new Set(terms.map((term) => term.category).filter(Boolean));
    return Array.from(categories);
  }, [terms]);

  return {
    filteredAndSortedTerms,
    allCategories,
  };
}
