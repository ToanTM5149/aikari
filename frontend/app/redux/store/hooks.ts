/**
 * Redux Store Hooks
 * 
 * File này chỉ chứa các typed hooks cơ bản cho Redux
 * - useAppDispatch: Typed version of useDispatch
 * - useAppSelector: Typed version of useSelector
 * 
 * Các custom hooks domain-specific sẽ được đặt trong features
 */

import type { TypedUseSelectorHook } from 'react-redux';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './index';

/**
 * Typed Hooks - Pre-typed versions of useDispatch and useSelector
 * 
 * Thay vì dùng useDispatch và useSelector thông thường,
 * dùng các hooks này để có type safety và autocomplete
 * 
 * Usage:
 * ```tsx
 * const dispatch = useAppDispatch();
 * const user = useAppSelector((state) => state.user.currentUser);
 * ```
 */

// useAppDispatch - Typed version of useDispatch
export const useAppDispatch: () => AppDispatch = useDispatch;

// useAppSelector - Typed version of useSelector
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
