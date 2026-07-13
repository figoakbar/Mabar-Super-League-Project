import { Badge } from "@/components/ui/badge";
import type { TournamentStatus } from "@/lib/types";

const statusConfig: Record<
  TournamentStatus,
  { label: string; variant: "success" | "warning" | "secondary" }
> = {
  open: { label: "Registration open", variant: "success" },
  ongoing: { label: "Ongoing", variant: "warning" },
  completed: { label: "Completed", variant: "secondary" },
};

export function TournamentStatusBadge({
  status,
}: {
  status: TournamentStatus;
}) {
  const { label, variant } = statusConfig[status];
  return <Badge variant={variant}>{label}</Badge>;
}
