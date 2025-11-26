export default function FlashcardPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Flashcard Sets</h1>
      <p className="text-muted-foreground mb-6">
        Browse and study your flashcard collections.
      </p>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="p-6 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
          <h2 className="text-xl font-semibold mb-2">Spanish Vocabulary</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Common words and phrases
          </p>
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Cards:</span>
              <span className="font-medium ml-1">50</span>
            </div>
            <div>
              <span className="text-muted-foreground">Progress:</span>
              <span className="font-medium ml-1">75%</span>
            </div>
          </div>
        </div>
        
        <div className="p-6 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
          <h2 className="text-xl font-semibold mb-2">History Facts</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Important historical events
          </p>
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Cards:</span>
              <span className="font-medium ml-1">32</span>
            </div>
            <div>
              <span className="text-muted-foreground">Progress:</span>
              <span className="font-medium ml-1">40%</span>
            </div>
          </div>
        </div>
        
        <div className="p-6 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
          <h2 className="text-xl font-semibold mb-2">Math Formulas</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Essential mathematical formulas
          </p>
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Cards:</span>
              <span className="font-medium ml-1">28</span>
            </div>
            <div>
              <span className="text-muted-foreground">Progress:</span>
              <span className="font-medium ml-1">90%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
