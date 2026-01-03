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
    index("routes/home.tsx"),
    route("redux-examples", "components/pages/homepage/redux-examples.tsx"),
  ]),
  
  // Authenticated routes 
  layout("routes/_layouts/authenticated-layout.tsx", [
    route("dashboard", "routes/dashboard/home.tsx"),
    route("dashboard/studysets", "routes/dashboard/studysets.tsx"),
    route("dashboard/studysets/:studysetId", "routes/dashboard/studyset-detail.tsx"),
    route("dashboard/studysets/:studysetId/study", "routes/dashboard/study-mode.tsx"),
    route("dashboard/studysets/:studysetId/progress", "routes/dashboard/progress.tsx"),
    route("dashboard/class", "routes/dashboard/class.tsx"),
    route("dashboard/class/:classId", "routes/dashboard/class-detail.tsx"),
    route("dashboard/class/:className/statistics", "routes/dashboard/class.$className.statistics.tsx"),
    route("create", "routes/dashboard/create.tsx"),
    route("history", "routes/history.tsx"),
    route("statistics", "routes/statistics.tsx"),
    route("user-management", "routes/user-management.tsx"),
    route("token-management", "routes/token-management.tsx"),
    route("profile", "routes/dashboard/profile.tsx"),
  ]),
] satisfies RouteConfig;
