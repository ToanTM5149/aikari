import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  route(".well-known/*", "routes/.well-known.tsx"),
  
  // Auth routes (login, signup, etc.)
  layout("routes/_layouts/auth-layout.tsx", [
    route("login", "routes/auth/login.tsx"),
    route("signup", "routes/auth/signup.tsx"),
    route("forgot-password", "routes/auth/forgot-password.tsx"),
    route("reset-password", "routes/auth/reset-password.tsx"),
  ]),
  
  // Public routes (landing page)
  layout("routes/_layouts/main-layout.tsx", [
    index("components/pages/homepage/home.tsx"),
    route("redux-examples", "components/pages/homepage/redux-examples.tsx"),
  ]),
  
  // Authenticated routes 
  layout("routes/_layouts/authenticated-layout.tsx", [
    // Home
    route("home", "routes/home.tsx"),
    
    // Study Sets
    route("studysets", "routes/studysets/index.tsx"),
    route("studysets/:studysetId", "routes/studysets/$studysetId.tsx"),
    route("studysets/:studysetId/terms/:termId", "routes/studysets/$studysetId.terms.$termId.tsx"),
    route("studysets/:studysetId/study", "routes/studysets/$studysetId.study.tsx"),
    route("studysets/:studysetId/test/:testId", "routes/studysets/$studysetId.test.$testId.tsx"),
    route("studysets/:studysetId/progress", "routes/studysets/$studysetId.progress.tsx"),
    
    // Terms
    route("terms", "routes/terms/index.tsx"),
    route("terms/:termId", "routes/terms/$termId.tsx"),
    route("terms/:termId/edit", "routes/terms/$termId.edit.tsx"),
    
    // Categories
    route("categories", "routes/categories/index.tsx"),
    
    // Classes
    route("classes", "routes/classes/index.tsx"),
    route("classes/:classId", "routes/classes/$classId.tsx"),
    route("classes/:classId/analytics", "routes/classes/$classId.analytics.tsx"),
    route("classes/:className/statistics", "routes/classes/$className.statistics.tsx"),
    
    // History
    route("history", "routes/history.tsx"),
    
    // Admin
    route("admin", "routes/admin/index.tsx"),
    route("admin/users", "routes/admin/users.tsx"),
    route("admin/tokens", "routes/admin/tokens.tsx"),
    
    // Profile
    route("profile", "routes/profile/index.tsx"),
    
    // Common routes
    route("create", "routes/common/create.tsx"),
    route("quick-review", "routes/common/quick-review.tsx"),
    route("due-cards", "routes/common/due-cards.tsx"),
    route("flashcard", "routes/common/flashcard.tsx"),
    route("attempts/:attemptId/result", "routes/common/attempts.$attemptId.result.tsx"),
  ]),
] satisfies RouteConfig;
