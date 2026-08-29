import { cn } from "@/lib/utils";

/**
 * MagicUI-style aurora text: an animated gradient sweep clipped to the
 * characters. Colors follow the site palette.
 */
export function AuroraText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={cn("aurora-text", className)}>{children}</span>;
}
