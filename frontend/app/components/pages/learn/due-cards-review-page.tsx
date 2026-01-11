
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  useGetAllDueCardsQuery,
} from '~/redux/features/learning';
import type { NextTermResponse } from '~/redux/features/session/types';

import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { 
  ArrowLeft, 
  RefreshCw, 
  Filter,
  BookOpen,
  Tag,
  Calendar,
  Play
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { FlashcardLearningPage } from './flashcard-learning-page';

export function DueCardsReviewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get filter params from URL
  const filterCategory = searchParams.get('category');
  const filterStudyset = searchParams.get('studyset');

  // Get all due cards
  const { data: dueCardsData, isLoading: isLoadingDue } = useGetAllDueCardsQuery({
    includeFuture: false,
  });

  // Local state
  const [filteredCards, setFilteredCards] = useState<any[]>([]);
  const [sessionStarted, setSessionStarted] = useState(false);
  
  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string>(filterCategory || 'all');
  const [selectedStudyset, setSelectedStudyset] = useState<string>(filterStudyset || 'all');

  // Extract unique categories and studysets
  const categories = React.useMemo(() => {
    if (!dueCardsData?.cards) return [];
    const cats = new Set(
      dueCardsData.cards
        .filter(c => c.category_name && c.category_id)
        .map(c => ({ id: c.category_id!, name: c.category_name! }))
    );
    return Array.from(cats).reduce((acc: any[], curr) => {
      if (!acc.find(c => c.id === curr.id)) acc.push(curr);
      return acc;
    }, []);
  }, [dueCardsData]);

  const studysets = React.useMemo(() => {
    if (!dueCardsData?.cards) return [];
    const sets = new Set(
      dueCardsData.cards.map(c => ({ id: c.studyset_id, name: c.studyset_name }))
    );
    return Array.from(sets).reduce((acc: any[], curr) => {
      if (!acc.find(s => s.id === curr.id)) acc.push(curr);
      return acc;
    }, []);
  }, [dueCardsData]);

  // Apply filters
  useEffect(() => {
    if (!dueCardsData?.cards) return;

    let filtered = [...dueCardsData.cards];

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(c => c.category_id && c.category_id === selectedCategory);
    }

    if (selectedStudyset !== 'all') {
      filtered = filtered.filter(c => c.studyset_id === selectedStudyset);
    }

    setFilteredCards(filtered);
  }, [dueCardsData, selectedCategory, selectedStudyset]);

  const handleStartSession = () => {
    if (filteredCards.length === 0) return;
    setSessionStarted(true);
  };

  // Convert due cards to NextTermResponse format
  const dueCardsTerms: NextTermResponse[] = React.useMemo(() => {
    if (!filteredCards.length) return [];
    return filteredCards.map(card => ({
      term_id: card.term_id,
      term_text: card.term_text,
      definition: card.definition,
      example: card.example || undefined,
      image_url: card.image_url || undefined,
      is_new: false,
      previous_recall_score: undefined,
    }));
  }, [filteredCards]);

  if (isLoadingDue) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading due cards...</p>
        </div>
      </div>
    );
  }

  // No due cards
  if (!dueCardsData?.cards || dueCardsData.cards.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">No Due Cards 🎉</h2>
            <p className="text-gray-600 mb-4">
              You're all caught up! No cards are due for review right now.
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show overview page before starting review
  if (!sessionStarted) {
    // Calculate stats
    const uniqueStudysets = new Set(filteredCards.map(c => c.studyset_id)).size;
    const uniqueCategories = new Set(
      filteredCards.filter(c => c.category_id).map(c => c.category_id!)
    ).size;

    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Due Cards Review</h1>
          <p className="text-muted-foreground">
            Review your flashcards that are due for study
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Due Cards</p>
                  <p className="text-3xl font-bold">{dueCardsData.total_due}</p>
                </div>
                <Calendar className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Study Sets</p>
                  <p className="text-3xl font-bold">{uniqueStudysets}</p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Categories</p>
                  <p className="text-3xl font-bold">{uniqueCategories}</p>
                </div>
                <Tag className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Start Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter & Start Review
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Cards to Review</p>
                  <p className="text-2xl font-bold">{filteredCards.length}</p>
                </div>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {filteredCards.length} {filteredCards.length === 1 ? 'card' : 'cards'}
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Filter by Category
                </label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Filter by Study Set
                </label>
                <Select value={selectedStudyset} onValueChange={setSelectedStudyset}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Study Sets" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Study Sets</SelectItem>
                    {studysets.map(set => (
                      <SelectItem key={set.id} value={set.id}>
                        {set.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              className="w-full" 
              size="lg"
              onClick={handleStartSession}
              disabled={filteredCards.length === 0}
            >
              <Play className="h-5 w-5 mr-2" />
              Start Review ({filteredCards.length} {filteredCards.length === 1 ? 'card' : 'cards'})
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Use FlashcardLearningPage for the learning session
  if (sessionStarted && dueCardsTerms.length > 0) {
    return (
      <FlashcardLearningPage
        initialTerms={dueCardsTerms}
        title="Due Cards Review"
        onEndNavigate={() => navigate('/dashboard')}
        autoAdvance={false}
      />
    );
  }

  return null;
}
