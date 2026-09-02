"use client";

import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import { Lock } from "lucide-react";
import {
  Button as AriaButton,
  Dialog,
  FieldError,
  Heading,
  Input,
  Label,
  Modal,
  ModalOverlay,
  TextField,
} from "react-aria-components";
import { ScrollTrigger } from "@/lib/gsap-client";
import { Button } from "@/components/ui/Button";
import { buildWhatsAppHref } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

/**
 * Soft gate for /pricing while the packages are still being finalised.
 *
 * This is a courtesy lock, not a security boundary: the page markup still ships
 * to the client, so nothing behind it should ever be confidential.
 */
const PASSWORD = "essential 123";
const STORAGE_KEY = "stamer:pricing-unlocked";

/** Forgiving match — casing and stray whitespace should not block anyone. */
function isCorrect(value: string): boolean {
  return value.trim().replace(/\s+/g, " ").toLowerCase() === PASSWORD;
}

/**
 * The unlock lives in sessionStorage so a refresh, or a trip to another page
 * and back, does not ask again. It is read through `useSyncExternalStore` so
 * the server and the hydrating client agree on "locked" and the real value
 * lands on the next commit, with no setState-in-effect cascade.
 */
const listeners = new Set<() => void>();
let cachedUnlocked: boolean | null = null;

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function getUnlocked(): boolean {
  if (cachedUnlocked === null) {
    try {
      cachedUnlocked = window.sessionStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      // Private mode / storage disabled — stay locked and ask again.
      cachedUnlocked = false;
    }
  }
  return cachedUnlocked;
}

function getUnlockedOnServer(): boolean {
  return false;
}

function persistUnlock(): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // Non-fatal: they stay unlocked for this session in memory.
  }
  cachedUnlocked = true;
  for (const listener of listeners) listener();
}

export function PricingPasswordGate({ children }: { children: React.ReactNode }) {
  const unlocked = useSyncExternalStore(subscribe, getUnlocked, getUnlockedOnServer);
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  // The overlay locks body scroll while it is open, so the page's ScrollTrigger
  // reveals cache their start points against a pinned layout. Recompute them
  // once scrolling is handed back, or the sections fire at the wrong offsets.
  useEffect(() => {
    if (!unlocked) return;
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [unlocked]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isCorrect(value)) {
      setError(true);
      return;
    }

    persistUnlock();
  }

  return (
    <>
      {children}

      <ModalOverlay
        isOpen={!unlocked}
        isDismissable={false}
        isKeyboardDismissDisabled
        className={cn(
          "fixed inset-0 z-[60] flex items-center justify-center p-[1.25rem]",
          "bg-foreground/40 backdrop-blur-xl",
          "transition-opacity duration-300 ease-out",
          "data-entering:opacity-0 data-exiting:opacity-0"
        )}
      >
        <Modal
          className={cn(
            "w-full max-w-[30rem] outline-none",
            "transition-[opacity,transform] duration-300 ease-out",
            "data-entering:translate-y-2 data-entering:opacity-0",
            "data-exiting:translate-y-2 data-exiting:opacity-0"
          )}
        >
          <Dialog
            aria-label="Pricing page locked"
            className="rounded-2xl border border-primary/10 bg-background p-[1.75rem] text-left shadow-card outline-none md:p-[2.25rem]"
          >
            <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-on-dark">
              <Lock className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
            </div>

            <p className="font-jost mb-3 text-xs uppercase tracking-widest text-foreground/60">
              Packages
            </p>

            <Heading
              slot="title"
              className="font-serif italic text-3xl leading-tight text-foreground text-balance md:text-4xl"
            >
              This page is in progress.
            </Heading>

            <p className="mt-4 font-sans text-base leading-relaxed text-foreground/75 text-pretty">
              For now, please reach out via WhatsApp to get more info about my
              packages.
            </p>

            <div className="mt-7">
              <Button
                href={buildWhatsAppHref({ source: "pricing-gate" })}
                variant="primary"
                size="md"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                Message me on WhatsApp
              </Button>
            </div>

            <div className="my-7 h-px w-full bg-primary/10" />

            <form onSubmit={handleSubmit} noValidate>
              <TextField
                name="pricing-password"
                type="password"
                value={value}
                onChange={(next) => {
                  setValue(next);
                  setError(false);
                }}
                isInvalid={error}
                autoComplete="off"
                className="flex flex-col gap-2"
              >
                <Label className="font-jost text-xs uppercase tracking-wider text-foreground/70">
                  Have the password?
                </Label>

                <Input
                  autoFocus
                  placeholder="Enter password"
                  className={cn(
                    "w-full rounded-xl border bg-transparent px-4 py-3 font-sans text-foreground placeholder:text-foreground/60",
                    "transition-colors focus:outline-none",
                    error
                      ? "border-accent focus:border-accent"
                      : "border-foreground/20 focus:border-primary"
                  )}
                />

                <FieldError className="font-sans text-sm text-accent">
                  That password is not right. Try again, or message me on
                  WhatsApp.
                </FieldError>
              </TextField>

              <AriaButton
                type="submit"
                className={cn(
                  "mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full",
                  "border border-primary/20 bg-background px-[1.778em] py-[0.889em]",
                  "font-sans text-sm text-primary transition-colors duration-300",
                  "hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                )}
              >
                Unlock the page
              </AriaButton>
            </form>
          </Dialog>
        </Modal>
      </ModalOverlay>
    </>
  );
}
