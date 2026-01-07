/**
 * Learning Statistics Section
 * Hiển thị thống kê học tập và trends
 */

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { StatCard } from "./stat-card";
import { Clock, Target, TrendingUp, CheckCircle } from "lucide-react";
import type { LearningOverviewStats } from "~/redux/store/api/adminApi";

interface LearningStatisticsSectionProps {
  data: LearningOverviewStats;
  isLoading?: boolean;
}

export function LearningStatisticsSection({ data, isLoading }: LearningStatisticsSectionProps) {
  if (isLoading) {
    return <div>Loading...</div>;
  }

  const masteryRate = data.total_terms_studied > 0
    ? (data.total_terms_mastered / data.total_terms_studied * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Learning Statistics</h2>
      
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Study Sessions"
          value={data.total_study_sessions.toLocaleString()}
          description={`${data.study_sessions_last_7_days} this week`}
          icon={Target}
        />
        <StatCard
          title="Total Study Time"
          value={`${data.total_study_time_hours.toLocaleString()}h`}
          description={`${data.average_session_duration_minutes.toFixed(1)} min avg session`}
          icon={Clock}
        />
        <StatCard
          title="Terms Studied"
          value={data.total_terms_studied.toLocaleString()}
          description={`${data.total_terms_mastered} mastered`}
          icon={TrendingUp}
        />
        <StatCard
          title="Average Accuracy"
          value={`${data.average_accuracy_percentage.toFixed(1)}%`}
          icon={CheckCircle}
        />
      </div>

      {/* Detailed Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Study Progress */}
            <div className="space-y-3">
              <h4 className="font-medium">Study Progress</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Mastery Rate</span>
                  <span className="font-medium">{masteryRate}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${masteryRate}%` }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Terms Mastered</span>
                  <span className="font-medium">{data.total_terms_mastered.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Terms Studied</span>
                  <span className="font-medium">{data.total_terms_studied.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="space-y-3">
              <h4 className="font-medium">Recent Activity</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Sessions (Last 7 Days)</span>
                  <span className="font-medium">{data.study_sessions_last_7_days.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Sessions (Last 30 Days)</span>
                  <span className="font-medium">{data.study_sessions_last_30_days.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Daily Average (30d)</span>
                  <span className="font-medium">
                    {Math.round(data.study_sessions_last_30_days / 30).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
