import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Logo } from "~/components/ui/logo";

export default function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Logo size="sm" showText={true} />
          </div>
          <nav className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}