import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("auth", "routes/_layouts/auth-layout.tsx", [
        route("login", "routes/auth/login.tsx"),
        route("signup", "routes/auth/signup.tsx"),
        route("forgot-password", "routes/auth/forgot-password.tsx"),
        route("reset-password", "routes/auth/reset-password.tsx"),
    ])
] satisfies RouteConfig;
