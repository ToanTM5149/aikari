/**
 * System Overview Section
 * Hiển thị tổng quan hệ thống
 */

import { Users, GraduationCap, BookOpen, FileText, Sparkles, MessageSquare } from "lucide-react";
import { StatCard } from "./stat-card";
import type { SystemOverviewStats } from "~/redux/store/api/adminApi";

interface SystemOverviewSectionProps {
  data: SystemOverviewStats;
  isLoading?: boolean;
}

export function SystemOverviewSection({ data, isLoading }: SystemOverviewSectionProps) {
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">System Overview</h2>
      
      {/* User Statistics */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Users</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Users"
            value={data.total_users.toLocaleString()}
            description={`${data.new_users_last_7_days} new this week`}
            icon={Users}
          />
          <StatCard
            title="Students"
            value={data.total_students.toLocaleString()}
            description={`${((data.total_students / data.total_users) * 100).toFixed(1)}% of total`}
            icon={GraduationCap}
          />
          <StatCard
            title="Teachers"
            value={data.total_teachers.toLocaleString()}
            description={`${((data.total_teachers / data.total_users) * 100).toFixed(1)}% of total`}
            icon={Users}
          />
          <StatCard
            title="Admins"
            value={data.total_admins.toLocaleString()}
            icon={Users}
          />
        </div>
      </div>

      {/* Active Users */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Active Users</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          <StatCard
            title="Active (Last 7 Days)"
            value={data.active_users_last_7_days.toLocaleString()}
            description={`${((data.active_users_last_7_days / data.total_users) * 100).toFixed(1)}% of total users`}
          />
          <StatCard
            title="Active (Last 30 Days)"
            value={data.active_users_last_30_days.toLocaleString()}
            description={`${((data.active_users_last_30_days / data.total_users) * 100).toFixed(1)}% of total users`}
          />
        </div>
      </div>

      {/* Content Statistics */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Content</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Classes"
            value={data.total_classes.toLocaleString()}
            icon={BookOpen}
          />
          <StatCard
            title="Study Sets"
            value={data.total_studysets.toLocaleString()}
            icon={FileText}
          />
          <StatCard
            title="Terms"
            value={data.total_terms.toLocaleString()}
            description={`${(data.total_terms / data.total_studysets).toFixed(1)} per set`}
          />
          <StatCard
            title="Study Activities"
            value={data.total_study_activities.toLocaleString()}
            icon={BookOpen}
          />
        </div>
      </div>

      {/* AI Usage */}
      <div>
        <h3 className="text-lg font-semibold mb-3">AI Usage</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <StatCard
            title="AI Generations"
            value={data.total_ai_generations.toLocaleString()}
            icon={Sparkles}
          />
          <StatCard
            title="Chat Messages"
            value={data.total_chat_messages.toLocaleString()}
            icon={MessageSquare}
          />
        </div>
      </div>
    </div>
  );
}
