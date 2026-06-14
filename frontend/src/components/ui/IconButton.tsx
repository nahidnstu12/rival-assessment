import type { LucideIcon } from "lucide-react";

type IconButtonProps = {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  variant?: "default" | "danger";
  className?: string;
};

export function IconButton({
  icon: Icon,
  label,
  onClick,
  variant = "default",
  className = "",
}: IconButtonProps) {
  return (
    <button
      type="button"
      className={`icon-action ${variant === "danger" ? "icon-action-danger" : ""} ${className}`.trim()}
      onClick={onClick}
      aria-label={label}
    >
      <Icon size={15} strokeWidth={2} aria-hidden />
    </button>
  );
}
