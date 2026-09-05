"use client";

import { updateWebsiteLead } from "@/app/admin/(app)/actions";
import { ActionForm } from "@/components/admin/ActionForm";
import { AreaField, Field } from "@/components/admin/fields";
import type { WebsiteLeadRow } from "@/lib/admin/queries";

export function LeadEditForm({ lead }: { lead: WebsiteLeadRow }) {
  return (
    <ActionForm action={updateWebsiteLead} submitLabel="Save changes">
      <input type="hidden" name="id" value={lead.id} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field name="first_name" label="First name" defaultValue={lead.first_name} isRequired />
        <Field name="last_name" label="Last name" defaultValue={lead.last_name} />
        <Field name="email" label="Email" type="email" defaultValue={lead.email} isRequired />
        <Field name="phone" label="Phone" defaultValue={lead.phone} description="Any format; normalised to +27… on save." />
        <Field name="whatsapp" label="WhatsApp" defaultValue={lead.whatsapp} description="Leave blank when same as phone." />
        <Field name="booker_role" label="Role" defaultValue={lead.booker_role} />
        <Field name="event_type" label="Event type" defaultValue={lead.event_type} />
        <Field name="event_date_text" label="Date (as text)" defaultValue={lead.event_date_text} />
        <Field name="event_date_iso" label="Date (YYYY-MM-DD)" defaultValue={lead.event_date_iso} placeholder="2026-11-14" />
        <Field name="location" label="Location" defaultValue={lead.location} />
        <Field name="guest_count" label="Guests" type="number" defaultValue={lead.guest_count} />
        <Field name="performance_minutes" label="Performance minutes" type="number" defaultValue={lead.performance_minutes} />
      </div>
      <AreaField name="message" label="Their message" defaultValue={lead.message} className="mt-4" />
      <AreaField name="notes" label="Internal notes / form summary" defaultValue={lead.notes} className="mt-4" rows={3} />
    </ActionForm>
  );
}
