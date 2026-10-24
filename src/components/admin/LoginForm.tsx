"use client";

import { useState, useTransition } from "react";
import { Button, Input, Label, TextField } from "react-aria-components";

import { sendMagicLink, type LoginResult } from "@/app/admin/(auth)/login/actions";
import { cn } from "@/lib/utils";

interface LoginFormProps {
  next: string | null;
}

export function LoginForm({ next }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<LoginResult | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(action: (formData: FormData) => Promise<LoginResult>) {
    const formData = new FormData();
    formData.set("email", email);
    if (next) formData.set("next", next);
    startTransition(async () => {
      try {
        const outcome = await action(formData);
        setResult(outcome);
      } catch {
        // A rejected Server Action otherwise looks like a button that did
        // nothing in the browser. Always give the user a recoverable state.
        setResult({ ok: false, error: "We could not start sign-in. Please try again." });
      }
    });
  }

  if (result?.ok) {
    return (
      <div className="mt-8 rounded-2xl border border-foreground/10 bg-background p-6 shadow-card">
        <p className="font-display text-lg font-semibold tracking-tight text-foreground">
          Check your inbox
        </p>
        <p className="mt-2 font-sans text-base leading-relaxed text-foreground/70">
          If that address is allowed, a sign-in link is on its way. It works once and expires in an hour.
        </p>
        <button
          type="button"
          onClick={() => setResult(null)}
          className="mt-4 font-jost text-xs uppercase tracking-[0.18em] text-foreground/60 underline-offset-4 hover:underline"
        >
          Use a different address
        </button>
      </div>
    );
  }

  return (
    <form
      className="mt-8"
      onSubmit={(event) => {
        event.preventDefault();
        submit(sendMagicLink);
      }}
    >
      <TextField
        name="email"
        type="email"
        value={email}
        onChange={setEmail}
        isRequired
        validationBehavior="aria"
        autoComplete="email"
        className="flex flex-col gap-2"
      >
        <Label className="font-jost text-xs uppercase tracking-[0.18em] text-foreground/60">
          Email
        </Label>
        <Input
          placeholder="you@example.com"
          className="min-h-11 w-full rounded-input border border-foreground/15 bg-background px-4 font-sans text-base text-foreground outline-none placeholder:text-foreground/40 focus:border-primary"
        />
      </TextField>

      {result && !result.ok ? (
        <p role="alert" className="mt-3 font-sans text-sm text-error">
          {result.error}
        </p>
      ) : null}

      <Button
        type="submit"
        isDisabled={pending || email.trim() === ""}
        className={cn(
          "mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-cream px-[1.5em] py-[0.75em] font-sans text-base font-medium text-primary transition-colors duration-300",
          "hover:bg-primary/90 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60 data-[focus-visible]:outline data-[focus-visible]:outline-2 data-[focus-visible]:outline-offset-2 data-[focus-visible]:outline-accent hover:text-on-dark",
        )}
      >
        {pending ? "Sending…" : "Email me a sign-in link"}
      </Button>

      <p className="mt-6 font-sans text-xs leading-relaxed text-foreground/50">
        Only allow-listed addresses can sign in. The one-time link expires in an hour.
      </p>
    </form>
  );
}
