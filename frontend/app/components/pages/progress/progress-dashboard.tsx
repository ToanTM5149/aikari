/**
 * Progress Dashboard Page
 * Overview of user's learning progress and statistics
 */

import React from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  useGetStudysetProgressQuery,
  useGetStudysetStatsQuery,
  type WeakTerm,
} from '~/redux/features/learning';

import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Progress } from '~/components/ui/progress';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import {
  CheckCircle,
  Clock,
  TrendingUp,
  Target,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';

export function ProgressDashboard() {
  const { studysetId } = useParams<{ studysetId: string }>();
  const navigate = useNavigate();

  const {
    data: progress,
    isLoading: isLoadingProgress,
  } = useGetStudysetProgressQuery(studysetId || '', {
    skip: !studysetId,
  });

  const {
    data: stats,
    isLoading: isLoadingStats,
  } = useGetStudysetStatsQuery(studysetId || '', {
    skip: !studysetId,
  });

  const handleBack = () => {
    if (studysetId) {
      navigate(`/studysets/${studysetId}`);
    } else {
      navigate('/studysets');
    }
  };

  if (isLoadingProgress || isLoadingStats) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-pulse">Loading progress...</div>
        </div>
      </div>
    );
  }

  if (!progress || !stats) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p>No progress data available yet. Start learning to see your progress!</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
        <h1 className="text-3xl font-bold mb-2">Learning Progress</h1>
        <p className="text-gray-600">Track your progress and performance</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completion Rate
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {progress.completion_rate.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.studied_terms} / {stats.total_terms} cards
            </p>
            <Progress value={progress.completion_rate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Mastered Terms
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {progress.mastered_terms}/{stats.total_terms}
            </div>
            <p className="text-xs text-muted-foreground">
              {((progress.mastered_terms / stats.total_terms) * 100).toFixed(0)}% mastered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Recall Score
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.average_recall_score.toFixed(1)}/5
            </div>
            <p className="text-xs text-muted-foreground">
              Based on {stats.total_terms} terms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Response Time
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {progress.average_response_time > 0 
                ? `${progress.average_response_time.toFixed(1)}s`
                : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {progress.average_response_time > 0 
                ? 'Time to answer per card'
                : 'Start learning to see stats'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Streak Days
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {progress.streak_days}
            </div>
            <p className="text-xs text-muted-foreground">
              Keep going! 🔥
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="weak-terms">Weak Terms</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Terms Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Terms Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Mastered</span>
                    <span className="text-sm text-gray-600">
                      {stats.mastered_terms} cards
                    </span>
                  </div>
                  <Progress
                    value={(stats.mastered_terms / stats.total_terms) * 100}
                    className="h-2 bg-green-100"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Reviewing</span>
                    <span className="text-sm text-gray-600">
                      {stats.reviewing_terms} cards
                    </span>
                  </div>
                  <Progress
                    value={(stats.reviewing_terms / stats.total_terms) * 100}
                    className="h-2 bg-blue-100"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Needs Work</span>
                    <span className="text-sm text-gray-600">
                      {stats.forgotten_terms} cards
                    </span>
                  </div>
                  <Progress
                    value={(stats.forgotten_terms / stats.total_terms) * 100}
                    className="h-2 bg-red-100"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Not Started</span>
                    <span className="text-sm text-gray-600">
                      {stats.never_studied} cards
                    </span>
                  </div>
                  <Progress
                    value={(stats.never_studied / stats.total_terms) * 100}
                    className="h-2 bg-gray-100"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Review */}
          {progress.next_due_date && (
            <Card>
              <CardHeader>
                <CardTitle>Next Review</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Your next review session is scheduled for:
                </p>
                <p className="text-lg font-semibold mt-2">
                  {new Date(progress.next_due_date).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="weak-terms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                Terms That Need More Practice
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.weak_terms.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Great job! No weak terms right now. 🎉
                </p>
              ) : (
                <div className="space-y-4">
                  {stats.weak_terms.map((term: WeakTerm) => (
                    <div
                      key={term.term_id}
                      className="border rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{term.term_text}</h3>
                        <Badge variant="destructive">
                          Score: {term.recall_score}/5
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {term.definition}
                      </p>
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span>Reviewed: {term.times_reviewed} times</span>
                        <span>
                          Last: {new Date(term.last_reviewed).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
