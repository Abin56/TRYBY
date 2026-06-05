import { cn } from "@/lib/cn";
import type { ProductStatus, OrderStatus, ReviewStatus, CustomerStatus } from "@/data/mock";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral" | "primary";

const variantStyles: Record<BadgeVariant, string> = {
  success: "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]",
  warning: "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]",
  danger:  "bg-[#FFF1F2] text-[#DC2626] border-[#FECDD3]",
  info:    "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]",
  neutral: "bg-[#F9FAFB] text-[#6B7280] border-[#E5E7EB]",
  primary: "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]",
};

interface BadgeProps { variant?: BadgeVariant; children: React.ReactNode; className?: string; dot?: boolean; }

export function Badge({ variant = "neutral", children, className, dot }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold", variantStyles[variant], className)}>
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", { success:"bg-[#16A34A]", warning:"bg-[#D97706]", danger:"bg-[#DC2626]", info:"bg-[#2563EB]", neutral:"bg-[#9CA3AF]", primary:"bg-[#2563EB]" }[variant])} />}
      {children}
    </span>
  );
}

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const map: Record<ProductStatus, { variant: BadgeVariant; label: string }> = {
    active:       { variant: "success", label: "Active" },
    draft:        { variant: "neutral", label: "Draft" },
    out_of_stock: { variant: "warning", label: "Out of Stock" },
    archived:     { variant: "danger",  label: "Archived" },
  };
  const { variant, label } = map[status];
  return <Badge variant={variant} dot>{label}</Badge>;
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const map: Record<OrderStatus, { variant: BadgeVariant; label: string }> = {
    pending:    { variant: "warning", label: "Pending" },
    processing: { variant: "info",    label: "Processing" },
    packed:     { variant: "info",    label: "Packed" },
    shipped:    { variant: "primary", label: "Shipped" },
    delivered:  { variant: "success", label: "Delivered" },
    cancelled:  { variant: "danger",  label: "Cancelled" },
    refunded:   { variant: "neutral", label: "Refunded" },
  };
  const { variant, label } = map[status];
  return <Badge variant={variant} dot>{label}</Badge>;
}

export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  const map: Record<ReviewStatus, { variant: BadgeVariant; label: string }> = {
    pending:  { variant: "warning", label: "Pending" },
    approved: { variant: "success", label: "Approved" },
    rejected: { variant: "danger",  label: "Rejected" },
  };
  const { variant, label } = map[status];
  return <Badge variant={variant} dot>{label}</Badge>;
}
