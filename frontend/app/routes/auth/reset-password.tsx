import { useSearchParams } from "react-router"
import { ResetPasswordPage } from "~/components/pages/auth/reset-password"

export function loader() {
  return null
}

export default function ResetPasswordRoute() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token") || undefined

  return <ResetPasswordPage token={token} />
}
