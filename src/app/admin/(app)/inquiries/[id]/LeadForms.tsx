"use client";

import { linkLeadToPersonAction, resendLeadAlertAction, setWebsiteLeadStatusAction, updateWebsiteLeadAction } from "@/app/admin/(app)/inquiries/[id]/actions";
import { ActionForm, Field, SelectField, TextAreaField } from "@/components/admin/controls";
import type { WebsiteLead } from "@/lib/admin/queries";

export function LeadEditForm({ lead }: { lead: WebsiteLead }) {
  return (
    <ActionForm action={updateWebsiteLeadAction} submitLabel="Save changes">
      <input type="hidden" name="id" value={lead.id} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field name="first_name" label="First name" defaultValue={lead.first_name} required />
        <Field name="last_name" label="Last name" defaultValue={lead.last_name} />
        <Field name="email" label="Email" type="email" defaultValue={lead.email} required />
        <SelectField
          name="contact_preference"
          label="Preferred contact"
          defaultValue={lead.contact_preference}
          options={[
            { value: "whatsapp", label: "WhatsApp" },
            { value: "email", label: "Email" },
          ]}
        />
        <Field name="phone" label="Phone" type="tel" defaultValue={lead.phone} hint="Full number with country code" />
        <Field name="whatsapp" label="WhatsApp" type="tel" defaultValue={lead.whatsapp} hint="Leave blank if same as phone" />
        <Field name="event_type" label="Event type" defaultValue={lead.event_type} />
        <Field name="booker_role" label="Role" defaultValue={lead.booker_role} />
        <Field name="event_date_text" label="Date (as written)" defaultValue={lead.event_date_text} />
        <Field name="event_date_iso" label="Date (YYYY-MM-DD)" type="date" defaultValue={lead.event_date_iso} />
        <Field name="location" label="Location" defaultValue={lead.location} className="sm:col-span-2" />
        <Field name="guest_count" label="Guests" type="number" defaultValue={lead.guest_count?.toString()} />
        <Field name="performance_minutes" label="Performance minutes" type="number" defaultValue={lead.performance_minutes?.toString()} />
      </div>
      <TextAreaField name="message" label="Message" defaultValue={lead.message} rows={4} />
      <TextAreaField name="notes" label="Internal notes" defaultValue={lead.notes} rows={3} hint="Only visible here." />
    </ActionForm>
  );
}

export function LeadStatusForm({ lead }: { lead: WebsiteLead }) {
  const next = lead.status === "dismissed" ? "new" : "dismissed";
  return (
    <ActionForm
      action={setWebsiteLeadStatusAction}
      inline
      submitVariant={next === "dismissed" ? "danger" : "secondary"}
      submitLabel={next === "dismissed" ? "Dismiss enquiry" : "Reopen enquiry"}
      confirm={next === "dismissed" ? "Dismiss this enquiry? The Telegram flow will stop for it." : undefined}
    >
      <input type="hidden" name="id" value={lead.id} />
      <input type="hidden" name="status" value={next} />
    </ActionForm>
  );
}

export function ResendAlertForm({ lead }: { lead: WebsiteLead }) {
  return (
    <ActionForm
      action={resendLeadAlertAction}
      inline
      submitVariant="secondary"
      submitLabel="Resend Telegram alert"
      confirm="Send this enquiry to Telegram again? A new card with fresh buttons will appear."
    >
      <input type="hidden" name="id" value={lead.id} />
    </ActionForm>
  );
}

export function LinkPersonForm({ lead }: { lead: WebsiteLead }) {
  return (
    <ActionForm action={linkLeadToPersonAction} inline submitVariant="secondary" submitLabel={lead.person_id ? "Relink" : "Link"}>
      <input type="hidden" name="id" value={lead.id} />
      <Field name="person_id" label="Contact id" defaultValue={lead.person_id} placeholder="Paste a contact id, or blank to unlink" className="min-w-[18rem]" />
    </ActionForm>
  );
}
