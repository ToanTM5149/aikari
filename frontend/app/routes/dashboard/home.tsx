export default function HomePage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Welcome to AIKARI</h1>
      <p className="text-muted-foreground">
        This is the home page for authenticated users.
      </p>
      
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Recent Study Sets</h2>
          <p className="text-sm text-muted-foreground">
            Your recently accessed flashcard sets will appear here.
          </p>
        </div>
        
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Your Classes</h2>
          <p className="text-sm text-muted-foreground">
            Quick access to your enrolled classes.
          </p>
        </div>
        
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Study Progress</h2>
          <p className="text-sm text-muted-foreground">
            Track your learning progress and achievements.
          </p>
        </div>
      </div>
    </div>
  );
}
