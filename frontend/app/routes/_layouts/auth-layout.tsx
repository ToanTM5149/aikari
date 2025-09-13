import { Outlet } from 'react-router';

export default function AuthLayout() {
  return (
    <div className="auth-container">
      <header>
        <h2>Authentication</h2>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

 