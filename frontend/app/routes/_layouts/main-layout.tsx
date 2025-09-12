import { Outlet } from "react-router";

function MainLayout() {
  return (
    <>
      <header>Main Header</header>
      <main>
        <Outlet />
      </main>
      <footer>Main Footer</footer>
    </>
  );
}

export default MainLayout;