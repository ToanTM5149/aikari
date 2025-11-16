import { Outlet } from 'react-router';

export default function AuthLayout() {
  return (
    <div className="auth-container">
      <main>
        <Outlet />
      </main>
    </div>
  );
}

 