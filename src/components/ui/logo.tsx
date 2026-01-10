import { cn } from "../../lib/utils";

interface LogoProps {
  subtitle?: string;
  className?: string;
  logoClassName?: string;
  subtitleClassName?: string;
  titleClassName?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({
  subtitle,
  className,
  logoClassName,
  subtitleClassName,
  titleClassName,
  size = "md",
}: LogoProps) {
  const sizeClasses = {
    sm: { logo: "h-6 w-6", text: "text-lg" },
    md: { logo: "h-8 w-8", text: "text-xl" },
    lg: { logo: "h-10 w-10", text: "text-2xl" },
  };

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-center gap-3">
        <img
          src="/stormwatch-logo.webp"
          alt="StormWatch Logo"
          className={cn(
            sizeClasses[size].logo,
            "object-contain rounded-full",
            logoClassName
          )}
        />
        <h1 className={cn("font-bold tracking-tight", sizeClasses[size].text, titleClassName)}>
          StormWatch
        </h1>
      </div>
      {subtitle && (
        <p
          className={cn(
            "text-xs text-muted-foreground ml-11",
            subtitleClassName
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
