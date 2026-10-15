import { AuthShell } from "@/components/auth/auth-shell"
import { AuthFormSkeleton } from "@/components/auth/auth-form-skeleton"

export default function LoginLoading() {
  return (
    <AuthShell>
      <AuthFormSkeleton rows={2} />
    </AuthShell>
  )
}
