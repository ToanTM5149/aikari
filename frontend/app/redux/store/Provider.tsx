/**
 * Redux Provider Component
 * 
 * Wrapper component để provide Redux store cho toàn bộ app
 * Phải wrap app với Provider này để các components có thể access Redux store
 */

import { Provider } from 'react-redux';
import { store } from './index';

interface ReduxProviderProps {
  children: React.ReactNode;
}

/**
 * Redux Provider
 * 
 * Usage:
 * ```tsx
 * import { ReduxProvider } from '~/store/Provider';
 * 
 * function App() {
 *   return (
 *     <ReduxProvider>
 *       <YourApp />
 *     </ReduxProvider>
 *   );
 * }
 * ```
 */
export function ReduxProvider({ children }: ReduxProviderProps) {
  return <Provider store={store}>{children}</Provider>;
}

export default ReduxProvider;
