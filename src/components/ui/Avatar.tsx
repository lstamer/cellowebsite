"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

type AvatarSize = "sm" | "md" | "lg";

interface AvatarProps {
  /** Image source; when it fails to load, `fallback` initials are shown instead. */
  src?: string;
  /** Accessible name. Pass `""` when the name is printed right next to the avatar. */
  alt: string;
  /** One to three characters shown when there is no image or it fails to load. */
  fallback: string;
  size?: AvatarSize;
  className?: string;
}

const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: "h-[32px] w-[32px] text-xs",
  md: "h-[44px] w-[44px] text-sm",
  lg: "h-[56px] w-[56px] text-base",
};

const SIZE_PX: Record<AvatarSize, number> = { sm: 32, md: 44, lg: 56 };

/**
 * Small circular avatar with initials fallback (same behaviour as the shadcn
 * Avatar / AvatarImage / AvatarFallback trio, without the Radix dependency).
 */
export function Avatar({ src, alt, fallback, size = "md", className }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;
  const px = SIZE_PX[size];

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-cream font-display font-semibold uppercase tracking-wide text-primary",
        SIZE_CLASSES[size],
        className
      )}
    >
      {showImage && src ? (
        <Image
          src={src}
          alt={alt}
          width={px}
          height={px}
          sizes={`${px}px`}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          role={alt ? "img" : undefined}
          aria-label={alt || undefined}
          aria-hidden={alt ? undefined : true}
        >
          {fallback.slice(0, 3)}
        </span>
      )}
    </span>
  );
}
