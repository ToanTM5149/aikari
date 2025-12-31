import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Plus, Wand2, Upload } from "lucide-react"

export function GenerateContent() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle>Generate Content</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Flashcard
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Wand2 className="w-4 h-4" />
              AI Generate
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Import
            </Button>
          </div>
          <div className="text-muted-foreground">
            Create new study materials and flashcard sets
          </div>
        </div>
      </CardContent>
    </Card>
  )
}