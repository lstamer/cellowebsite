import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap-client";
import { cn } from "@/lib/utils";

interface PackageCardsProps {
  value: string;
  onChange: (pkg: string) => void;
}

const PACKAGES = [
  { id: "essential", name: "Essential", desc: "Ceremony & Cocktails" },
  { id: "popular", name: "Popular", desc: "Full Day Coverage", badge: "Most chosen" },
  { id: "ultimate", name: "Ultimate", desc: "Premium Ensemble" },
  { id: "unsure", name: "Unsure", desc: "Let's discuss options" },
];

export function PackageCards({ value, onChange }: PackageCardsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;
    gsap.fromTo(
      containerRef.current.children,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.4, ease: "power3.out", stagger: 0.1 }
    );
  }, []);

  return (
    <div className="flex flex-col gap-3 w-full">
      <label className="font-jost text-xs uppercase tracking-wider text-foreground/50">
        Already have a package in mind
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4" ref={containerRef}>
        {PACKAGES.map((pkg) => {
          const isSelected = value === pkg.id;
          return (
            <button
              key={pkg.id}
              type="button"
              onClick={() => onChange(pkg.id)}
              className={cn(
                "relative flex flex-col items-start text-left p-5 rounded-2xl border transition-all duration-300",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-foreground/10 hover:border-foreground/30 bg-transparent"
              )}
            >
              {pkg.badge && (
                <span className="absolute -top-3 left-4 bg-primary text-on-dark text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full">
                  {pkg.badge}
                </span>
              )}
              <div className="flex items-center gap-3 w-full mb-2">
                <div className={cn(
                  "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                  isSelected ? "border-primary" : "border-foreground/30"
                )}>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <span className="font-display font-semibold text-foreground">
                  {pkg.name}
                </span>
              </div>
              <p className="font-sans text-sm text-foreground/60 pl-7">
                {pkg.desc}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
