import React from 'react';
import { Outlet } from 'react-router';

function AuthLayout() {
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

export default AuthLayout;