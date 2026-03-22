"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export function PostContentWrapper({ children }: { children: React.ReactNode }) {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!container.current) return;
    
    // Animate all direct paragraph, header, and div children sequentially
    gsap.from(container.current.children, {
      y: 30,
      opacity: 0,
      duration: 0.8,
      stagger: 0.05,
      ease: "power2.out",
    });
  }, { scope: container });

  return (
    <div ref={container} className="post-content-wrapper min-h-[50vh]">
      {children}
    </div>
  );
}
