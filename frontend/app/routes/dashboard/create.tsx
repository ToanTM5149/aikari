export default function CreatePage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Create Flashcards</h1>
      <p className="text-muted-foreground mb-6">
        Create new flashcard sets to help you study better.
      </p>
      
      <div className="max-w-2xl mx-auto">
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">New Flashcard Set</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Set Title
              </label>
              <input
                type="text"
                placeholder="e.g., Spanish Vocabulary"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                placeholder="Brief description of this flashcard set..."
                rows={3}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div className="flex items-center gap-4 pt-4">
              <button className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                Create Set
              </button>
              <button className="px-6 py-2 border rounded-md hover:bg-accent">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
