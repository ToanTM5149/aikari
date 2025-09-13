import { Outlet } from "react-router";
import Header from "~/components/layout/header/Header";

export default function MainLayout() {
  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
      <footer>Main Footer</footer>
    </>
  );
}