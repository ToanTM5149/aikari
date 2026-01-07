/**
 * Admin Dashboard Page
 * Complete admin statistics dashboard
 */

import { useGetAdminDashboardQuery } from "~/redux/store/api/adminApi";
import { Card, CardContent } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { SystemOverviewSection } from "~/components/admin/system-overview-section";
import { UserStatisticsSection } from "~/components/admin/user-statistics-section";
import { LearningStatisticsSection } from "~/components/admin/learning-statistics-section";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "~/components/ui/button";

export function AdminDashboardPage() {
  const { data, error, isLoading, refetch } = useGetAdminDashboardQuery();

  // Error state
  if (error) {
    const errorMessage = 'status' in error
      ? error.status === 403
        ? "Access denied. You need Admin privileges to view this page."
        : "Failed to load admin dashboard."
      : "An error occurred.";

    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Loading state
  if (isLoading || !data) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            System-wide statistics and analytics
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Last Updated */}
      <div className="text-sm text-muted-foreground">
        Last updated: {new Date(data.generated_at).toLocaleString()}
      </div>

      {/* Tabs for different sections */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="learning">Learning</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="ai">AI Usage</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <SystemOverviewSection data={data.system_overview} />
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <UserStatisticsSection data={data.user_stats} />
        </TabsContent>

        {/* Learning Tab */}
        <TabsContent value="learning" className="space-y-4">
          <LearningStatisticsSection data={data.learning_stats} />
        </TabsContent>

        {/* Classes Tab */}
        <TabsContent value="classes" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Class Statistics</h2>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Total Classes</p>
                    <p className="text-2xl font-bold">{data.class_stats.overview.total_classes}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Public Classes</p>
                    <p className="text-2xl font-bold">{data.class_stats.overview.total_public_classes}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Total Members</p>
                    <p className="text-2xl font-bold">{data.class_stats.overview.total_class_members}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Usage Tab */}
        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">AI Usage Statistics</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Total Generations</p>
                    <p className="text-2xl font-bold">{data.ai_usage_stats.total_generations}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Tests Generated</p>
                    <p className="text-2xl font-bold">{data.ai_usage_stats.total_tests_generated}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Chat Conversations</p>
                    <p className="text-2xl font-bold">{data.ai_usage_stats.total_chat_conversations}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Chat Messages</p>
                    <p className="text-2xl font-bold">{data.ai_usage_stats.total_chat_messages}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Content Statistics</h2>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Total Study Sets</p>
                    <p className="text-2xl font-bold">{data.content_stats.total_studysets}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Total Terms</p>
                    <p className="text-2xl font-bold">{data.content_stats.total_terms}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Avg Terms/Set</p>
                    <p className="text-2xl font-bold">{data.content_stats.average_terms_per_studyset.toFixed(1)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
