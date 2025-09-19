import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { DbUtils } from '@/lib/db';
import { handleAndShowError } from '@/lib/error-handler';
import type { Term } from '@/types/database';

export interface UseTermsReturn {
  terms: Term[];
  isLoading: boolean;
  loadTerms: () => Promise<void>;
  addTerm: (termData: Omit<Term, 'id'>) => Promise<void>;
  updateTerm: (term: Term) => Promise<void>;
  deleteTerm: (termId: number) => Promise<void>;
}

/**
 * Custom hook for managing terminology data
 */
export function useTerms(): UseTermsReturn {
  const [terms, setTerms] = useState<Term[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadTerms = useCallback(async () => {
    try {
      setIsLoading(true);
      const loadedTerms = await DbUtils.getAllTerms();
      setTerms(loadedTerms);
    } catch (error) {
      handleAndShowError(error, 'loadTerms');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addTerm = async (termData: Omit<Term, 'id'>) => {
    try {
      await DbUtils.addTerm(termData);
      await loadTerms();
      toast.success('Term added successfully');
    } catch (error) {
      handleAndShowError(error, 'addTerm');
    }
  };

  const updateTerm = async (term: Term) => {
    try {
      if (!term.id) throw new Error('Term ID is required for update');
      await DbUtils.updateTerm(term.id, term);
      await loadTerms();
      toast.success('Term updated successfully');
    } catch (error) {
      handleAndShowError(error, 'updateTerm');
    }
  };

  const deleteTerm = async (termId: number) => {
    try {
      await DbUtils.deleteTerm(termId);
      await loadTerms();
      toast.success('Term deleted successfully');
    } catch (error) {
      handleAndShowError(error, 'deleteTerm');
    }
  };

  // Load terms on mount
  useEffect(() => {
    loadTerms();
  }, [loadTerms]);

  return {
    terms,
    isLoading,
    loadTerms,
    addTerm,
    updateTerm,
    deleteTerm,
  };
}
