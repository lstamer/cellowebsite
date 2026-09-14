"use client";

import { sendMagicLinkAction } from "@/app/admin/(auth)/login/actions";
import { ActionForm, Field } from "@/components/admin/controls";

export function LoginForm({ next }: { next: string }) {
  return (
    <ActionForm action={sendMagicLinkAction} submitLabel="Send sign-in link">
      <input type="hidden" name="next" value={next} />
      <Field name="email" label="Email" type="email" placeholder="you@example.com" required autoComplete="email" />
    </ActionForm>
  );
}
