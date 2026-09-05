"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { Button, Input, Label, SearchField } from "react-aria-components";

import { linkLeadToPerson, type ActionResult } from "@/app/admin/(app)/actions";
import { searchPeopleAction } from "@/app/admin/(app)/search-actions";
import { inputClass, labelClass } from "@/components/admin/fields";
import { adminPath } from "@/lib/admin/paths";
import type { PersonRow } from "@/lib/admin/queries";

export function PersonLinker({ leadId, personId }: { leadId: string; personId: string | null }) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<PersonRow[]>([]);
  const [status, setStatus] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const debounce = useRef<number | null>(null);

  function handleTermChange(value: string) {
    setTerm(value);
    if (debounce.current) window.clearTimeout(debounce.current);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    debounce.current = window.setTimeout(() => {
      startTransition(async () => {
        setResults(await searchPeopleAction(value));
      });
    }, 250);
  }

  function link(nextPersonId: string) {
    const formData = new FormData();
    formData.set("id", leadId);
    formData.set("personId", nextPersonId);
    startTransition(async () => {
      setStatus(await linkLeadToPerson(formData));
      setResults([]);
      setTerm("");
    });
  }

  return (
    <div className="font-sans text-sm">
      {personId ? (
        <p className="mb-3 text-foreground/85">
          Linked to{" "}
          <Link href={adminPath(`/contacts/${personId}`)} className="font-medium underline-offset-4 hover:underline">
            contact profile
          </Link>
          .{" "}
          <Button onPress={() => link("")} className="text-foreground/60 underline-offset-4 hover:underline">
            Unlink
          </Button>
        </p>
      ) : (
        <p className="mb-3 text-foreground/60">Not linked to a contact. Search to link, or leave it: the next form or WhatsApp message from the same number or email links automatically.</p>
      )}

      <SearchField value={term} onChange={handleTermChange} aria-label="Search contacts" className="flex flex-col gap-1.5">
        <Label className={labelClass}>Link to a contact</Label>
        <Input placeholder="Search by name, email or phone" className={inputClass} />
      </SearchField>

      {results.length > 0 ? (
        <ul className="mt-2 divide-y divide-foreground/10 rounded-input border border-foreground/15">
          {results.map((person) => (
            <li key={person.id} className="flex items-center justify-between gap-2 px-3 py-2">
              <span>
                <span className="text-foreground">{person.display_name ?? person.email ?? person.phone_e164}</span>
                <span className="block text-xs text-foreground/50">{[person.email, person.phone_e164].filter(Boolean).join(" · ")}</span>
              </span>
              <Button
                onPress={() => link(person.id)}
                isDisabled={pending}
                className="rounded-full bg-cream px-[1em] py-[0.4em] font-sans text-xs font-medium text-primary"
              >
                Link
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      {status ? (
        <p role="status" className={status.ok ? "mt-2 text-primary" : "mt-2 text-accent"}>
          {status.ok ? status.message : status.error}
        </p>
      ) : null}
    </div>
  );
}
