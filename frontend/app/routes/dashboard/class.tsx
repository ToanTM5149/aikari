export default function ClassPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">My Classes</h1>
      <p className="text-muted-foreground mb-6">
        Manage your classes and view student progress.
      </p>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold mb-2">Mathematics 101</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Basic algebra and geometry
          </p>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Students:</span>
            <span className="font-medium">24</span>
          </div>
        </div>
        
        <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold mb-2">English Literature</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Classical literature analysis
          </p>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Students:</span>
            <span className="font-medium">18</span>
          </div>
        </div>
        
        <div className="p-6 border-2 border-dashed rounded-lg flex items-center justify-center hover:border-primary transition-colors cursor-pointer">
          <div className="text-center">
            <p className="text-lg font-medium">+ Create New Class</p>
          </div>
        </div>
      </div>
    </div>
  );
}
