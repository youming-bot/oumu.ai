'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Search, Plus, X, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

export interface Term {
  id?: number;
  word: string;
  reading?: string;
  meaning: string;
  category?: string;
  examples?: string[];
  tags?: string[];
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
  className = ''
}: TerminologyGlossaryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTerms, setFilteredTerms] = useState<Term[]>(terms);
  const [isAdding, setIsAdding] = useState(false);
  const [editingTerm, setEditingTerm] = useState<Term | null>(null);
  const [newTerm, setNewTerm] = useState<Omit<Term, 'id'>>({
    word: '',
    reading: '',
    meaning: '',
    category: '',
    examples: [],
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date()
  });

  useEffect(() => {
    const filtered = terms.filter(term => 
      term.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      term.meaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
      term.reading?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      term.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      term.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredTerms(filtered);
  }, [searchQuery, terms]);

  const handleAddTerm = async () => {
    if (!newTerm.word.trim() || !newTerm.meaning.trim()) return;
    
    try {
      await onAddTerm?.(newTerm);
      setNewTerm({
        word: '',
        reading: '',
        meaning: '',
        category: '',
        examples: [],
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      setIsAdding(false);
    } catch (error) {
      console.error('Failed to add term:', error);
    }
  };

  const handleUpdateTerm = async () => {
    if (!editingTerm || !editingTerm.word.trim() || !editingTerm.meaning.trim()) return;
    
    try {
      await onUpdateTerm?.(editingTerm);
      setEditingTerm(null);
    } catch (error) {
      console.error('Failed to update term:', error);
    }
  };

  const handleDeleteTerm = async (id: number) => {
    if (!confirm('Are you sure you want to delete this term?')) return;
    
    try {
      await onDeleteTerm?.(id);
    } catch (error) {
      console.error('Failed to delete term:', error);
    }
  };

  const addExample = () => {
    setNewTerm(prev => ({
      ...prev,
      examples: [...(prev.examples || []), '']
    }));
  };

  const updateExample = (index: number, value: string) => {
    setNewTerm(prev => ({
      ...prev,
      examples: prev.examples?.map((ex, i) => i === index ? value : ex) || []
    }));
  };

  const removeExample = (index: number) => {
    setNewTerm(prev => ({
      ...prev,
      examples: prev.examples?.filter((_, i) => i !== index) || []
    }));
  };

  const addTag = () => {
    setNewTerm(prev => ({
      ...prev,
      tags: [...(prev.tags || []), '']
    }));
  };

  const updateTag = (index: number, value: string) => {
    setNewTerm(prev => ({
      ...prev,
      tags: prev.tags?.map((tag, i) => i === index ? value : tag) || []
    }));
  };

  const removeTag = (index: number) => {
    setNewTerm(prev => ({
      ...prev,
      tags: prev.tags?.filter((_, i) => i !== index) || []
    }));
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium flex items-center">
          <BookOpen className="w-5 h-5 mr-2" />
          Terminology Glossary
        </h3>
        
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Term
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Term</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Word *</label>
                <Input
                  value={newTerm.word}
                  onChange={(e) => setNewTerm(prev => ({ ...prev, word: e.target.value }))}
                  placeholder="Enter word or phrase"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Reading</label>
                <Input
                  value={newTerm.reading || ''}
                  onChange={(e) => setNewTerm(prev => ({ ...prev, reading: e.target.value }))}
                  placeholder="Reading (e.g., furigana)"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Meaning *</label>
                <Input
                  value={newTerm.meaning}
                  onChange={(e) => setNewTerm(prev => ({ ...prev, meaning: e.target.value }))}
                  placeholder="Enter meaning"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Category</label>
                <Input
                  value={newTerm.category || ''}
                  onChange={(e) => setNewTerm(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="Category (e.g., grammar, vocabulary)"
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Examples</label>
                  <Button type="button" variant="outline" size="sm" onClick={addExample}>
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </Button>
                </div>
                {newTerm.examples?.map((example, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <Input
                      value={example}
                      onChange={(e) => updateExample(index, e.target.value)}
                      placeholder="Example sentence"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeExample(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Tags</label>
                  <Button type="button" variant="outline" size="sm" onClick={addTag}>
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </Button>
                </div>
                {newTerm.tags?.map((tag, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <Input
                      value={tag}
                      onChange={(e) => updateTag(index, e.target.value)}
                      placeholder="Tag"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTag(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAdding(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddTerm} disabled={!newTerm.word.trim() || !newTerm.meaning.trim()}>
                  Add Term
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search terms..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Terms List */}
      <ScrollArea className="h-96">
        <div className="space-y-4">
          {filteredTerms.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {terms.length === 0 ? 'No terms yet. Add your first term!' : 'No terms match your search.'}
            </div>
          ) : (
            filteredTerms.map((term) => (
              <Card key={term.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-semibold">{term.word}</h4>
                      {term.reading && (
                        <span className="text-sm text-muted-foreground">({term.reading})</span>
                      )}
                    </div>
                    
                    <p className="text-sm mb-3">{term.meaning}</p>
                    
                    {term.category && (
                      <Badge variant="secondary" className="mb-2">
                        {term.category}
                      </Badge>
                    )}
                    
                    {term.tags && term.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {term.tags.map((tag, index) => (
                          <Badge key={index} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {term.examples && term.examples.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Examples:</p>
                        {term.examples.map((example, index) => (
                          <p key={index} className="text-sm text-muted-foreground">• {example}</p>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingTerm(term)}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    {term.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => term.id && handleDeleteTerm(term.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Edit Dialog */}
      <Dialog open={!!editingTerm} onOpenChange={(open) => !open && setEditingTerm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Term</DialogTitle>
          </DialogHeader>
          
          {editingTerm && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Word *</label>
                <Input
                  value={editingTerm.word}
                  onChange={(e) => setEditingTerm(prev => prev ? { ...prev, word: e.target.value } : null)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Reading</label>
                <Input
                  value={editingTerm.reading || ''}
                  onChange={(e) => setEditingTerm(prev => prev ? { ...prev, reading: e.target.value } : null)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Meaning *</label>
                <Input
                  value={editingTerm.meaning}
                  onChange={(e) => setEditingTerm(prev => prev ? { ...prev, meaning: e.target.value } : null)}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingTerm(null)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateTerm}>
                  Update Term
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}