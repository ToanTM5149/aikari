/**
 * CategoryFilter Component
 *
 * Filter dropdown để lọc studysets theo category
 */

import { useGetCategoriesQuery } from "~/redux/features/category/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Tag } from "lucide-react";
import type { Category } from "~/redux/features/shared/types";

interface CategoryFilterProps {
  value?: string;
  onChange: (categoryId: string | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function CategoryFilter({
  value,
  onChange,
  placeholder = "All Categories",
  className = "",
}: CategoryFilterProps) {
  const { data: categoriesData, isLoading } = useGetCategoriesQuery();

  const handleChange = (newValue: string) => {
    if (newValue === "all") {
      onChange(undefined);
    } else {
      onChange(newValue);
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Tag className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  const categories = categoriesData?.data || [];

  if (categories.length === 0) {
    return null; // Don't show filter if no categories
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Tag className="h-4 w-4 text-muted-foreground" />
      <Select value={value || "all"} onValueChange={handleChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.category_id} value={category.category_id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * CategoryBadge Component
 * Badge để hiển thị category
 */

import { Badge } from "~/components/ui/badge";

interface CategoryBadgeProps {
  category: Category;
  variant?: "default" | "secondary" | "outline";
  className?: string;
}

export function CategoryBadge({
  category,
  variant = "secondary",
  className = "",
}: CategoryBadgeProps) {
  return (
    <Badge variant={variant} className={`gap-1 ${className}`}>
      <Tag className="h-3 w-3" />
      {category.name}
    </Badge>
  );
}
