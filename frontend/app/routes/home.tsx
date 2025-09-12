import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "AIKARI" },
    { name: "description", content: "Welcome to AIKARI!" },
  ];
}

export default function Home() {
  return (
    <>
      <Welcome />
    </>
  );
}
