"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { searchPeople, type PersonRow } from "@/lib/admin/queries";

export async function searchPeopleAction(term: string): Promise<PersonRow[]> {
  await requireAdmin();
  return searchPeople(term.slice(0, 80));
}
