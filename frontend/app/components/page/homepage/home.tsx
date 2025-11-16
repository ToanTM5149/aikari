import { Logo } from "~/components/atoms/Logo";
import { Button } from "~/components/ui/button";
import { ReduxExamplesCard } from "~/components/shared/ReduxExamplesCard";

export function loader() {
  return null;
}

export default function Home() {
  return (
    <div className="container mx-auto p-8">
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-8">
        <Logo size="xl" showText={true} />
        <h1 className="text-4xl font-bold text-center">
          Welcome to AIKARI
        </h1>
        <p className="text-xl text-muted-foreground text-center max-w-2xl">
          Your AI-powered flashcard learning assistant
        </p>
        <div className="flex gap-4">
          <Button size="lg">Get Started</Button>
          <Button size="lg" variant="outline">Learn More</Button>
        </div>

        {/* Redux Examples Card */}
        <div className="mt-12 w-full max-w-xl">
          <ReduxExamplesCard />
        </div>
      </div>
    </div>
  );
}
