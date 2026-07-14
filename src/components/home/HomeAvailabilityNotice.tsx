"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, X } from "lucide-react";

const INITIAL_DISMISS_DELAY_MS = 5_000;

export function HomeAvailabilityNotice() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const announcementRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [canDismiss, setCanDismiss] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(5);

  useEffect(() => {
    const startedAt = performance.now();

    const updateDismissDelay = () => {
      const remainingMs = Math.max(
        0,
        INITIAL_DISMISS_DELAY_MS - (performance.now() - startedAt)
      );

      setRemainingSeconds(Math.ceil(remainingMs / 1_000));

      if (remainingMs === 0) {
        setCanDismiss(true);
        window.clearInterval(intervalId);
      }
    };

    const intervalId = window.setInterval(updateDismissDelay, 200);
    updateDismissDelay();

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
      dialog.focus();
      document.body.classList.add("overflow-hidden");
    } else if (!isOpen && dialog.open) {
      dialog.close();
      document.body.classList.remove("overflow-hidden");
    }

    return () => document.body.classList.remove("overflow-hidden");
  }, [isOpen]);

  const dismiss = () => {
    if (!canDismiss) return;

    setIsOpen(false);
  };

  const reopen = () => {
    setIsOpen(true);
  };

  return (
    <>
      <aside className="fixed inset-x-0 top-0 z-[60] flex h-[3.5rem] items-center bg-primary text-on-dark md:h-[2.75rem]">
        <button
          ref={announcementRef}
          type="button"
          aria-controls="health-availability-notice"
          aria-haspopup="dialog"
          onClick={reopen}
          className="group mx-auto flex h-full w-full max-w-7xl items-center justify-center gap-2 px-section-x-sm text-center font-sans text-xs leading-snug transition-colors duration-300 hover:bg-surface-dark focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-on-dark md:px-section-x-md md:text-sm lg:px-section-x-lg"
        >
          <span className="md:hidden">
            Availability paused until September.
          </span>
          <span className="hidden md:inline">
            Availability paused until September while I recover from surgery.
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 font-semibold underline underline-offset-4">
            Read more
            <ArrowRight
              aria-hidden="true"
              className="size-[14px] transition-transform duration-300 group-hover:translate-x-[2px]"
              strokeWidth={1.75}
            />
          </span>
        </button>
      </aside>

      <dialog
        ref={dialogRef}
        id="health-availability-notice"
        aria-labelledby="health-notice-title"
        aria-describedby="health-notice-body health-notice-instructions"
        onClose={() => announcementRef.current?.focus()}
        onCancel={(event) => {
          event.preventDefault();
          dismiss();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) dismiss();
        }}
        className="m-auto max-h-[88svh] w-[92%] max-w-2xl overflow-y-auto border-0 bg-transparent p-0 text-foreground backdrop:bg-surface-darker focus:outline-none"
      >
        <div className="relative rounded-card border border-primary/10 bg-cream p-6 shadow-card md:p-10">
          <button
            type="button"
            aria-label={
              canDismiss
                ? "Close health update"
                : `Close available in ${remainingSeconds} ${remainingSeconds === 1 ? "second" : "seconds"}`
            }
            disabled={!canDismiss}
            onClick={dismiss}
            className="absolute right-4 top-4 flex size-[44px] items-center justify-center rounded-full border border-primary/20 text-primary transition-colors duration-300 hover:bg-primary hover:text-on-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-40 md:right-6 md:top-6"
          >
            <X aria-hidden="true" className="size-[20px]" strokeWidth={1.75} />
          </button>

          <div className="pr-12 md:pr-14">
            <p className="mb-3 font-jost text-sm font-bold tracking-widest text-accent-ink">
              Taking a break
            </p>
            <h2
              id="health-notice-title"
              className="text-balance font-serif text-4xl italic leading-tight text-primary md:text-5xl"
            >
              A personal health update
            </h2>
          </div>

          <div
            id="health-notice-body"
            className="mt-6 space-y-4 text-pretty font-sans text-base leading-relaxed text-foreground/80"
          >
            <p>
              Please note that I’m not accepting new enquiries for events taking
              place within the next <strong className="font-semibold">1-2 months</strong>.
              If you’ve reached out, please know that my reply may take much longer
              than usual.
            </p>

            <p>
              After years of battling unexplained injuries in my hands and arms,
              I’ve been diagnosed with a significant condition affecting the nerves
              that run through my hands and fingers. I care about delivering the
              best standard of music at the events I perform at, and I cannot
              deliver on this until I&apos;ve had surgery on both arms.
            </p>

            <p>
              I’m recovering from the first operation as you read this, and the
              second is scheduled soon. I truly apologise for any WhatsApp messages
              or emails I may have missed, and for not being able to send
              personalised recordings as I normally would.
            </p>

            <p>
              <strong className="font-semibold">The good news</strong> is that recovery
              looks promising and will not impact my playing in the future. I’ll be
              back as soon as I can and continue advancing my professional musical
              journey. Thank you, genuinely, for the kindness and support I’ve
              received so far. Be back soon 💪 ❤️
            </p>
          </div>

          <p id="health-notice-instructions" className="sr-only">
            This notice can be closed after a five-second reading period.
          </p>

          <div className="mt-7 flex flex-col-reverse gap-3 border-t border-primary/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="font-mono text-xs text-foreground/70"
            >
              {canDismiss
                ? "You can close this update now."
                : `You can continue in ${remainingSeconds} ${remainingSeconds === 1 ? "second" : "seconds"}.`}
            </p>

            <button
              type="button"
              disabled={!canDismiss}
              onClick={dismiss}
              className="rounded-full bg-primary px-[1.429em] py-[0.714em] font-sans text-sm font-semibold text-on-dark transition-colors duration-300 hover:bg-surface-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:bg-primary/40"
            >
              I understand
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
