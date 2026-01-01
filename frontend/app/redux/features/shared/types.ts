/**
 * Class & StudySet Types
 * 
 * Types cho Class management và StudySet/Flashcard features
 * Sync với backend models
 */

// ==================== ENUMS ====================

export enum UserRole {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
  ADMIN = 'ADMIN',
}

export enum ClassRole {
  OWNER = 'OWNER',
  MEMBER = 'MEMBER',
  CO_TEACHER = 'CO_TEACHER',
}

export enum ContentType {
  DEFAULT = 'DEFAULT',
  AI_GENERATED = 'AI_GENERATED',
}

// ==================== CLASS TYPES ====================

export interface Class {
  class_id: string;
  class_name: string;
  description?: string;
  created_by: string;
  owner_user_id: string;
  is_public: boolean;
  class_code?: string;
  created_at: string;
  updated_at: string;
}

export type MembershipStatus = 'ACTIVE' | 'PENDING' | 'INVITED' | 'REJECTED' | 'LEFT';

export interface ClassMember {
  class_id: string;
  user_id: string;
  role: ClassRole;
  status: MembershipStatus;
  joined_at: string;
  invited_by?: string;
  approved_at?: string;
  user?: {
    user_id: string;
    username: string;
    email: string;
  };
}

export interface ClassCreate {
  class_name: string;
  description?: string;
  is_public?: boolean;
  class_code?: string;
}

export interface ClassUpdate {
  class_name?: string;
  description?: string;
  is_public?: boolean;
  class_code?: string;
}

export interface ClassesResponse {
  data: Class[];
  count: number;
}

export interface ClassMemberCreate {
  user_id: string;
  role?: ClassRole;
  status?: MembershipStatus;
}

export interface ClassMemberUpdate {
  role?: ClassRole;
  status?: MembershipStatus;
}

export interface ClassMembersResponse {
  data: ClassMember[];
  count: number;
}

// ==================== STUDYSET TYPES ====================

export interface StudySet {
  studyset_id: string;
  title: string;
  description?: string;
  owner_id: string;
  content_type: ContentType;
  created_at: string;
  updated_at: string;
}

export interface StudySetCreate {
  title: string;
  description?: string;
  content_type?: ContentType;
}

export interface StudySetUpdate {
  title?: string;
  description?: string;
  content_type?: ContentType;
}

export interface StudySetsResponse {
  data: StudySet[];
  count: number;
}

// ==================== TERM TYPES ====================

export interface Term {
  term_id: string;
  studyset_id: string;
  term_text: string;
  definition: string;
  example?: string;
  category?: string;
  subcategory?: string;
  image_url?: string;
  attributes?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface TermCreate {
  term_text: string;
  definition: string;
  example?: string;
  category?: string;
  subcategory?: string;
  image_url?: string;
  attributes?: Record<string, any>;
}

export interface TermUpdate {
  term_text?: string;
  definition?: string;
  example?: string;
  category?: string;
  subcategory?: string;
  image_url?: string;
  attributes?: Record<string, any>;
}

export interface TermsResponse {
  data: Term[];
  count: number;
}

// ==================== API RESPONSE TYPES ====================

export interface MessageResponse {
  message: string;
}

// ==================== QUERY PARAMS ====================

export interface PaginationParams {
  skip?: number;
  limit?: number;
}
