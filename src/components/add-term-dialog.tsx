import { Plus, X } from 'lucide-react';
import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { Term } from './terminology-glossary';

interface AddTermDialogProps {
  onAddTerm: (term: Omit<Term, 'id'>) => Promise<void>;
}

export function AddTermDialog({ onAddTerm }: AddTermDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wordId = useId();
  const readingId = useId();
  const meaningId = useId();
  const categoryId = useId();
  const difficultyId = useId();
  const [newTerm, setNewTerm] = useState<Omit<Term, 'id'>>({
    word: '',
    reading: '',
    meaning: '',
    category: '',
    examples: [],
    tags: [],
    difficulty: 'medium',
    learned: false,
    reviewCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const handleAddTerm = async () => {
    if (!newTerm.word.trim() || !newTerm.meaning.trim()) return;

    try {
      await onAddTerm(newTerm);
      setNewTerm({
        word: '',
        reading: '',
        meaning: '',
        category: '',
        examples: [],
        tags: [],
        difficulty: 'medium',
        learned: false,
        reviewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      setIsOpen(false);
    } catch (_error) {
      // 静默处理添加术语错误，避免中断用户操作
    }
  };

  const addExample = () => {
    setNewTerm((prev) => ({
      ...prev,
      examples: [...(prev.examples || []), ''],
    }));
  };

  const updateExample = (index: number, value: string) => {
    setNewTerm((prev) => ({
      ...prev,
      examples: prev.examples?.map((ex, i) => (i === index ? value : ex)) || [],
    }));
  };

  const removeExample = (index: number) => {
    setNewTerm((prev) => ({
      ...prev,
      examples: prev.examples?.filter((_, i) => i !== index) || [],
    }));
  };

  const addTag = () => {
    setNewTerm((prev) => ({
      ...prev,
      tags: [...(prev.tags || []), ''],
    }));
  };

  const updateTag = (index: number, value: string) => {
    setNewTerm((prev) => ({
      ...prev,
      tags: prev.tags?.map((tag, i) => (i === index ? value : tag)) || [],
    }));
  };

  const removeTag = (index: number) => {
    setNewTerm((prev) => ({
      ...prev,
      tags: prev.tags?.filter((_, i) => i !== index) || [],
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          添加术语
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>添加新术语</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label htmlFor={wordId} className="font-medium text-sm">
              Word *
            </label>
            <Input
              id={wordId}
              value={newTerm.word}
              onChange={(e) => setNewTerm((prev) => ({ ...prev, word: e.target.value }))}
              placeholder="Enter word or phrase"
            />
          </div>

          <div>
            <label htmlFor={readingId} className="font-medium text-sm">
              Reading
            </label>
            <Input
              id={readingId}
              value={newTerm.reading || ''}
              onChange={(e) =>
                setNewTerm((prev) => ({
                  ...prev,
                  reading: e.target.value,
                }))
              }
              placeholder="Reading (e.g., furigana)"
            />
          </div>

          <div>
            <label htmlFor={meaningId} className="font-medium text-sm">
              Meaning *
            </label>
            <Input
              id={meaningId}
              value={newTerm.meaning}
              onChange={(e) =>
                setNewTerm((prev) => ({
                  ...prev,
                  meaning: e.target.value,
                }))
              }
              placeholder="Enter meaning"
            />
          </div>

          <div>
            <label htmlFor={categoryId} className="font-medium text-sm">
              Category
            </label>
            <Input
              id={categoryId}
              value={newTerm.category || ''}
              onChange={(e) =>
                setNewTerm((prev) => ({
                  ...prev,
                  category: e.target.value,
                }))
              }
              placeholder="Category (e.g., grammar, vocabulary)"
            />
          </div>

          <div>
            <label htmlFor={difficultyId} className="font-medium text-sm">
              难度
            </label>
            <select
              id={difficultyId}
              value={newTerm.difficulty}
              onChange={(e) =>
                setNewTerm((prev) => ({
                  ...prev,
                  difficulty: e.target.value as 'easy' | 'medium' | 'hard',
                }))
              }
              className="w-full rounded-md border border-gray-300 p-2"
            >
              <option value="easy">简单</option>
              <option value="medium">中等</option>
              <option value="hard">困难</option>
            </select>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="font-medium text-sm">Examples</span>
              <Button type="button" variant="outline" size="sm" onClick={addExample}>
                <Plus className="mr-1 h-3 w-3" />
                Add
              </Button>
            </div>
            {newTerm.examples?.map((example, index) => (
              <div
                key={`example-${index}-${example.substring(0, 10)}`}
                className="mb-2 flex items-center space-x-2"
              >
                <Input
                  value={example}
                  onChange={(e) => updateExample(index, e.target.value)}
                  placeholder="Example sentence"
                  aria-label={`Example sentence ${index + 1}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeExample(index)}
                  aria-label={`Remove example ${index + 1}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="font-medium text-sm">Tags</span>
              <Button type="button" variant="outline" size="sm" onClick={addTag}>
                <Plus className="mr-1 h-3 w-3" />
                Add
              </Button>
            </div>
            {newTerm.tags?.map((tag, index) => (
              <div
                key={`tag-${index}-${tag.substring(0, 10)}`}
                className="mb-2 flex items-center space-x-2"
              >
                <Input
                  value={tag}
                  onChange={(e) => updateTag(index, e.target.value)}
                  placeholder="Tag"
                  aria-label={`Tag ${index + 1}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTag(index)}
                  aria-label={`Remove tag ${index + 1}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddTerm}
              disabled={!newTerm.word.trim() || !newTerm.meaning.trim()}
            >
              Add Term
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
