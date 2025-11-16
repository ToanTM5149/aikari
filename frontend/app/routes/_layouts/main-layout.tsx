import { Outlet } from "react-router";
import Header from "~/components/layout/header/Header";
import Home from "~/components/page/homepage/home";

export default function MainLayout() {
  return (
    <>
      <Header />
      <main>
        <Home />
      </main>
      <footer>Main Footer</footer>
    </>
  );
}