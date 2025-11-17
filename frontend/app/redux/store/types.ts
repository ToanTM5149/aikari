/**
 * Redux Store Types
 * 
 * File này chỉ chứa các types liên quan đến store configuration
 * - RootState: Type của toàn bộ Redux state
 * - AppDispatch: Type của dispatch function
 * 
 * Các types khác sẽ được đặt trong:
 * - features/shared/types.ts: Types dùng chung
 * - features/{feature}/types.ts: Types riêng của từng feature
 */

// Re-export từ index.ts để dễ import
export type { RootState, AppDispatch } from './index';
