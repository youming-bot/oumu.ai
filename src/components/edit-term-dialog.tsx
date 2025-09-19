import { useId } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { Term } from './terminology-glossary';

interface EditTermDialogProps {
  editingTerm: Term | null;
  setEditingTerm: React.Dispatch<React.SetStateAction<Term | null>>;
  onUpdateTerm: () => void;
}

export function EditTermDialog({ editingTerm, setEditingTerm, onUpdateTerm }: EditTermDialogProps) {
  const editWordInputId = useId();
  const editReadingInputId = useId();
  const editMeaningInputId = useId();
  const editDifficultyId = useId();

  if (!editingTerm) return null;

  return (
    <Dialog open={!!editingTerm} onOpenChange={(open) => !open && setEditingTerm(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑术语</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label htmlFor={editWordInputId} className="font-medium text-sm">
              Word *
            </label>
            <Input
              id={editWordInputId}
              value={editingTerm.word}
              onChange={(e) => {
                const newValue = e.target.value;
                setEditingTerm((prev) => (prev ? { ...prev, word: newValue } : null));
              }}
            />
          </div>

          <div>
            <label htmlFor={editReadingInputId} className="font-medium text-sm">
              Reading
            </label>
            <Input
              id={editReadingInputId}
              value={editingTerm.reading || ''}
              onChange={(e) => {
                const newValue = e.target.value;
                setEditingTerm((prev) => (prev ? { ...prev, reading: newValue } : null));
              }}
            />
          </div>

          <div>
            <label htmlFor={editMeaningInputId} className="font-medium text-sm">
              Meaning *
            </label>
            <Input
              id={editMeaningInputId}
              value={editingTerm.meaning}
              onChange={(e) => {
                const newValue = e.target.value;
                setEditingTerm((prev) => (prev ? { ...prev, meaning: newValue } : null));
              }}
            />
          </div>

          <div>
            <label htmlFor={editDifficultyId} className="font-medium text-sm">
              难度
            </label>
            <select
              id={editDifficultyId}
              value={editingTerm.difficulty || 'medium'}
              onChange={(e) => {
                const newValue = e.target.value as 'easy' | 'medium' | 'hard';
                setEditingTerm((prev) =>
                  prev
                    ? {
                        ...prev,
                        difficulty: newValue,
                      }
                    : null
                );
              }}
              className="w-full rounded-md border border-gray-300 p-2"
            >
              <option value="easy">简单</option>
              <option value="medium">中等</option>
              <option value="hard">困难</option>
            </select>
          </div>

          <div>
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={editingTerm.learned || false}
                onChange={(e) => {
                  const newChecked = e.target.checked;
                  setEditingTerm((prev) => (prev ? { ...prev, learned: newChecked } : null));
                }}
              />
              <span>已学习</span>
            </label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setEditingTerm(null)}>
              取消
            </Button>
            <Button onClick={onUpdateTerm}>更新术语</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
