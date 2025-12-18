import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  route(".well-known/*", "routes/.well-known.tsx"),
  
  // Auth routes (login, signup, etc.) - cho user chưa đăng nhập
  route("/auth", "routes/_layouts/auth-layout.tsx", [
    route("login", "routes/auth/login.tsx"),
    route("signup", "routes/auth/signup.tsx"),
    route("forgot-password", "routes/auth/forgot-password.tsx"),
    route("reset-password", "routes/auth/reset-password.tsx"),
  ]),
  
  // Public routes (landing page) - cho user chưa đăng nhập
  layout("routes/_layouts/main-layout.tsx", [
    index("routes/home.tsx"),
    route("redux-examples", "components/pages/homepage/redux-examples.tsx"),
  ]),
  
  // Authenticated routes - cho user đã đăng nhập (với sidebar + header mới)
  layout("routes/_layouts/authenticated-layout.tsx", [
    route("dashboard", "routes/dashboard/home.tsx"),
    route("dashboard/class", "routes/dashboard/class.tsx"),
    route("dashboard/class/:className/statistics", "routes/dashboard/class.$className.statistics.tsx"),
    route("create", "routes/dashboard/create.tsx"),
    route("flashcard", "routes/dashboard/flashcard.tsx"),
    route("profile", "routes/dashboard/profile.tsx"),
  ]),
] satisfies RouteConfig;
