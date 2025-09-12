import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";

export function loader() {
  return null;
}

export default function Home() {
  return (
    <>
      <Welcome />
    </>
  );
}
