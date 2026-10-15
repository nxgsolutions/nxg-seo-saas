import { AuthShell } from "@/components/auth/auth-shell"
import { AuthFormSkeleton } from "@/components/auth/auth-form-skeleton"

export default function RegisterLoading() {
  return (
    <AuthShell>
      <AuthFormSkeleton rows={4} />
    </AuthShell>
  )
}
