import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing Preview",
  description: "Pricing page preview route.",
  robots: { index: false, follow: false },
};

export default function PricingMockupsPage() {
  redirect("/pricing");
}
