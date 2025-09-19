import { CheckCircle, Edit3, Square, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Term } from './terminology-glossary';

interface TermCardProps {
  term: Term;
  batchMode: boolean;
  isSelected: boolean;
  onSelect: (id: number) => void;
  onEdit: (term: Term) => void;
  onDelete: (id: number) => void;
}

export function TermCard({
  term,
  batchMode,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: TermCardProps) {
  const getDifficultyBadge = () => {
    if (!term.difficulty) return null;

    const variant =
      term.difficulty === 'easy'
        ? 'default'
        : term.difficulty === 'hard'
          ? 'destructive'
          : 'secondary';

    const label =
      term.difficulty === 'easy' ? '简单' : term.difficulty === 'hard' ? '困难' : '中等';

    return (
      <Badge variant={variant} className="text-xs">
        {label}
      </Badge>
    );
  };

  const renderTags = () => {
    if (!term.tags || term.tags.length === 0) return null;

    return (
      <div className="mb-2 flex flex-wrap gap-1">
        {term.tags.map((tag, index) => (
          <Badge key={`term-${term.id}-tag-${index}-${tag.substring(0, 10)}`} variant="outline">
            {tag}
          </Badge>
        ))}
      </div>
    );
  };

  const renderExamples = () => {
    if (!term.examples || term.examples.length === 0) return null;

    return (
      <div className="space-y-1">
        <p className="font-medium text-muted-foreground text-xs">例句:</p>
        {term.examples.map((example, index) => (
          <p
            key={`term-${term.id}-example-${index}-${example.substring(0, 10)}`}
            className="text-muted-foreground text-sm"
          >
            • {example}
          </p>
        ))}
      </div>
    );
  };

  const renderLastReviewed = () => {
    if (!term.lastReviewed) return null;

    return (
      <p className="mt-2 text-muted-foreground text-xs">
        最后复习: {new Date(term.lastReviewed).toLocaleDateString('zh-CN')}
      </p>
    );
  };

  return (
    <Card key={term.id} className={`p-4 ${batchMode ? 'hover:bg-muted/50' : ''}`}>
      <div className="flex items-start justify-between">
        {batchMode && term.id && (
          <div className="mr-2 flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => term.id && onSelect(term.id)}
              className="h-6 w-6"
            >
              {isSelected ? <CheckCircle className="h-4 w-4" /> : <Square className="h-4 w-4" />}
            </Button>
          </div>
        )}

        <div className="flex-1">
          <div className="mb-2 flex items-center space-x-2">
            <h4 className="font-semibold">{term.word}</h4>
            {term.reading && (
              <span className="text-muted-foreground text-sm">({term.reading})</span>
            )}
            {getDifficultyBadge()}
            {term.learned && (
              <Badge variant="outline" className="text-xs">
                <CheckCircle className="mr-1 h-3 w-3" />
                已学习
              </Badge>
            )}
            {term.reviewCount && term.reviewCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                复习 {term.reviewCount} 次
              </Badge>
            )}
          </div>

          <p className="mb-3 text-sm">{term.meaning}</p>

          {term.category && (
            <Badge variant="secondary" className="mb-2">
              {term.category}
            </Badge>
          )}

          {renderTags()}
          {renderExamples()}
          {renderLastReviewed()}
        </div>

        <div className="ml-4 flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(term)}
            aria-label={`编辑术语: ${term.word}`}
          >
            <Edit3 className="h-4 w-4" />
          </Button>
          {term.id && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => term.id && onDelete(term.id)}
              aria-label={`删除术语: ${term.word}`}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
