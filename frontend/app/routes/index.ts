import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  route(".well-known/*", "routes/.well-known.tsx"),
  
  route("/", "routes/_layouts/auth-layout.tsx", [
    route("login", "routes/auth/login.tsx"),
    route("signup", "routes/auth/signup.tsx"),
    route("forgot-password", "routes/auth/forgot-password.tsx"),
    route("reset-password", "routes/auth/reset-password.tsx"),
  ]),
  layout("routes/_layouts/main-layout.tsx", [
    index("routes/home.tsx"),
    route("redux-examples", "pages/homepage/redux-examples.tsx"),
  ]),
] satisfies RouteConfig;
