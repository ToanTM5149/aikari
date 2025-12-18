# Mock Data Documentation

This folder contains mock data used throughout the frontend application to simulate the UI with realistic data similar to the project demo.

## Structure

### Files

- **`home-data.ts`** - Data for Home page
  - `recentStudySets` - Recently studied flashcard sets
  - `recommendedSets` - Recommended study sets
  - `foldersAndClasses` - User's folders and classes
  - `featuredContent` - Featured study content

- **`class-data.ts`** - Data for Class page
  - `classes` - List of all classes with assignments, study sets, and progress

- **`folder-data.ts`** - Data for Folder page
  - `folders` - List of folders containing study sets

- **`flashcard-data.ts`** - Data for Flashcard pages
  - `sampleFlashcards` - Sample flashcards for study mode
  - `flashcardSets` - Complete flashcard sets with metadata

- **`index.ts`** - Main export file for all mock data

## Usage

### Import from data folder

```typescript
// Import specific data
import { recentStudySets, recommendedSets } from '~/data'
import { classes } from '~/data'
import { folders } from '~/data'
import { sampleFlashcards, flashcardSets } from '~/data'

// Or import all at once
import * as mockData from '~/data'
```

### In Components

Components in `/app/components/pages/dashboard/` already use this mock data:

- **HomePage** uses: `recentStudySets`, `recommendedSets`, `foldersAndClasses`, `featuredContent`
- **ClassPage** uses: `classes`
- **FolderPage** uses: `folders`
- **Flashcard** uses: `sampleFlashcards`
- **CreateFlashcard** - Uses dynamic state (no mock data needed)

## Data Types

All mock data includes TypeScript interfaces for type safety:

```typescript
interface StudySet {
  id: number
  title: string
  description: string
  cardCount: number
  category: string
  progress: number
  // ... more fields
}

interface Class {
  id: number
  name: string
  code: string
  instructor: string
  assignments: Assignment[]
  studySets: ClassStudySet[]
  // ... more fields
}

// And more...
```

## Customization

To add or modify mock data:

1. Edit the relevant file in `/app/data/`
2. Update TypeScript interfaces if needed
3. The components will automatically use the updated data

## Example

```typescript
// In your component
import { classes } from '~/data'

export function MyComponent() {
  return (
    <div>
      {classes.map(cls => (
        <div key={cls.id}>{cls.name}</div>
      ))}
    </div>
  )
}
```

## Notes

- All mock data is designed to match the UI structure of the project demo
- Data includes realistic values for progress, dates, and statistics
- Components are already configured to use this data
- When connecting to real backend APIs, simply replace imports with API calls
