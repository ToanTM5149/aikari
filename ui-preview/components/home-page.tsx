import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { motion } from "framer-motion"
import { 
  BookOpen, 
  Folder, 
  GraduationCap, 
  Star, 
  Clock, 
  Users, 
  TrendingUp,
  Play,
  Eye
} from "lucide-react"

const recentStudySets = [
  {
    id: 1,
    title: "World Capitals",
    description: "Major capitals around the world",
    cardCount: 25,
    lastStudied: "2 hours ago",
    category: "Geography",
    progress: 80
  },
  {
    id: 2,
    title: "Spanish Vocabulary",
    description: "Common Spanish words and phrases",
    cardCount: 50,
    lastStudied: "1 day ago",
    category: "Language",
    progress: 60
  },
  {
    id: 3,
    title: "Chemistry Elements",
    description: "Periodic table elements and symbols",
    cardCount: 30,
    lastStudied: "3 days ago",
    category: "Science",
    progress: 45
  }
]

const recommendedSets = [
  {
    id: 4,
    title: "Math Formulas",
    description: "Essential mathematical formulas",
    cardCount: 40,
    author: "Prof. Johnson",
    rating: 4.8,
    studyCount: 1250
  },
  {
    id: 5,
    title: "History Timeline",
    description: "Important dates in world history",
    cardCount: 35,
    author: "Sarah M.",
    rating: 4.6,
    studyCount: 890
  },
  {
    id: 6,
    title: "Biology Terms",
    description: "Key biology terminology",
    cardCount: 45,
    author: "Dr. Smith",
    rating: 4.9,
    studyCount: 2100
  }
]

const foldersAndClasses = [
  {
    id: 1,
    name: "AP Biology",
    type: "class",
    itemCount: 12,
    icon: GraduationCap,
    color: "bg-blue-500"
  },
  {
    id: 2,
    name: "Language Learning",
    type: "folder",
    itemCount: 8,
    icon: Folder,
    color: "bg-green-500"
  },
  {
    id: 3,
    name: "Math Study Group",
    type: "class",
    itemCount: 15,
    icon: GraduationCap,
    color: "bg-purple-500"
  }
]

const featuredContent = [
  {
    id: 1,
    title: "SAT Prep Vocabulary",
    description: "Essential words for SAT success",
    author: "EduPartner",
    featured: true,
    cardCount: 100,
    views: 15000
  },
  {
    id: 2,
    title: "Medical Terminology",
    description: "Healthcare professional vocabulary",
    author: "MedSchool Pro",
    featured: true,
    cardCount: 200,
    views: 8500
  }
]

interface HomePageProps {
  onStudySetClick: () => void
}

export function HomePage({ onStudySetClick }: HomePageProps) {
  return (
    <div className="space-y-8">
      {/* Recent Study Sets */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Study Sets
          </h2>
          <Button variant="ghost" size="sm">View All</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentStudySets.map((set, index) => (
            <motion.div
              key={set.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onStudySetClick}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{set.title}</CardTitle>
                    <Badge variant="secondary">{set.category}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{set.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {set.cardCount} cards
                      </span>
                      <span className="text-muted-foreground">{set.lastStudied}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span>{set.progress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <motion.div 
                          className="bg-primary rounded-full h-2"
                          initial={{ width: 0 }}
                          animate={{ width: `${set.progress}%` }}
                          transition={{ delay: index * 0.1 + 0.3, duration: 0.8 }}
                        />
                      </div>
                    </div>
                    <Button className="w-full" size="sm">
                      <Play className="w-4 h-4 mr-2" />
                      Continue Studying
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recommended Study Sets */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Recommended for You
          </h2>
          <Button variant="ghost" size="sm">Explore More</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendedSets.map((set, index) => (
            <motion.div
              key={set.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onStudySetClick}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{set.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{set.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {set.cardCount} cards
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        {set.rating}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>by {set.author}</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {set.studyCount.toLocaleString()}
                      </span>
                    </div>
                    <Button className="w-full" variant="outline" size="sm">
                      <Play className="w-4 h-4 mr-2" />
                      Start Studying
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Folders and Classes */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="flex items-center gap-2">
              <Folder className="w-5 h-5" />
              Folders & Classes
            </h2>
            <Button variant="ghost" size="sm">Manage</Button>
          </div>
          <div className="space-y-3">
            {foldersAndClasses.map((item, index) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                >
                  <Card className="cursor-pointer hover:shadow-sm transition-shadow">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {item.itemCount} {item.type === 'class' ? 'sets' : 'items'}
                        </p>
                      </div>
                      <Badge variant={item.type === 'class' ? 'default' : 'secondary'}>
                        {item.type}
                      </Badge>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </section>

        {/* Featured Content */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              Featured Content
            </h2>
          </div>
          <div className="space-y-4">
            {featuredContent.map((content, index) => (
              <motion.div
                key={content.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + index * 0.1 }}
              >
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onStudySetClick}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <h3 className="font-medium">{content.title}</h3>
                          <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{content.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>by {content.author}</span>
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />
                            {content.cardCount} cards
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {content.views.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}