"use client";

import { useState, type ReactNode } from "react";
import { Button, Dialog, DialogTrigger, Heading, Modal, ModalOverlay } from "react-aria-components";
import { buildGmailComposeHref, buildMailtoDraftHref, PUBLIC_EMAIL, type EmailDraft } from "@/lib/email";
import type { BookingDraftEvent } from "@/lib/booking/progress";
import { cn } from "@/lib/utils";

const actionClass = "inline-flex min-h-11 items-center justify-center rounded-full border border-primary px-[1.2em] py-[0.6em] text-center text-sm font-semibold transition-colors hover:bg-cream";

export function BookingEmailButton({
  draft,
  children,
  className,
  onDraftAction,
}: {
  draft: EmailDraft;
  children: ReactNode;
  className: string;
  onDraftAction?: (action: Exclude<BookingDraftEvent["action"], "whatsapp">) => void;
}) {
  const [copyStatus, setCopyStatus] = useState("");

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(draft.body);
      setCopyStatus("Message copied.");
      onDraftAction?.("email_copy");
    } catch {
      setCopyStatus("Select and copy the message below.");
    }
  }

  return (
    <DialogTrigger onOpenChange={(open) => {
      setCopyStatus("");
      if (open) onDraftAction?.("email");
    }}>
      <Button type="button" className={className}>{children}</Button>
      <ModalOverlay isDismissable className="fixed inset-0 z-[60] grid place-items-center bg-foreground/40 p-4">
        <Modal className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-auto rounded-card border border-foreground/10 bg-background text-foreground shadow-card">
          <Dialog className="p-5 font-sans outline-none sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <Heading slot="title" className="font-display text-2xl font-semibold">
                Your email draft
              </Heading>
              <Button slot="close" className="min-h-11 rounded-full px-[0.8em] text-sm underline underline-offset-2">
                Close
              </Button>
            </div>
            <p className="mt-2 text-sm text-foreground/75">
              Open the draft in your email app or Gmail. You can also copy it into any inbox.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <a href={buildMailtoDraftHref(draft)} onClick={() => onDraftAction?.("email_app")} className={cn(actionClass, "bg-primary text-on-dark hover:bg-primary/90")}>
                Open email app
              </a>
              <a href={buildGmailComposeHref(draft)} target="_blank" rel="noopener noreferrer" onClick={() => onDraftAction?.("gmail")} className={actionClass}>
                Open Gmail
              </a>
              <Button onPress={copyMessage} className={actionClass}>Copy message</Button>
            </div>
            <p role="status" className="mt-2 min-h-[1.25rem] text-sm text-foreground/75">{copyStatus}</p>
            <div className="mt-2 rounded-input border border-foreground/15 bg-cream p-4 text-sm">
              <dl className="flex flex-col gap-1">
                <div className="flex gap-2"><dt className="font-semibold">To</dt><dd className="select-all [overflow-wrap:anywhere]">{PUBLIC_EMAIL}</dd></div>
                <div className="flex gap-2"><dt className="font-semibold">Subject</dt><dd className="select-all [overflow-wrap:anywhere]">{draft.subject}</dd></div>
              </dl>
              <p className="mt-3 whitespace-pre-wrap border-t border-foreground/15 pt-3 leading-relaxed [overflow-wrap:anywhere]">
                {draft.body}
              </p>
            </div>
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  );
}
