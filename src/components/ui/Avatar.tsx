import { initials } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

type AvatarProps = {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-16 text-lg",
};

/** Avatar com iniciais. O nome completo fica sempre visível ao lado, por isso é decorativo. */
export function Avatar({ name, size = "md", className }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground",
        sizes[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
