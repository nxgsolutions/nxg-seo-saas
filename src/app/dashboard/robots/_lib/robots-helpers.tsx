import { type CheckStatus } from "@/lib/api/tools";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle
} from "lucide-react";

export const STATUS_META: Record<CheckStatus, { icon: typeof CheckCircle2; className: string; ring: string }> = {
  pass: { icon: CheckCircle2, className: "text-emerald-500", ring: "bg-emerald-500/10" },
  warn: { icon: AlertTriangle, className: "text-amber-500", ring: "bg-amber-500/10" },
  fail: { icon: XCircle, className: "text-destructive", ring: "bg-destructive/10" },
}
