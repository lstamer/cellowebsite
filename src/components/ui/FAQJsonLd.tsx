import type { FaqEntry } from "@/lib/faqs";

/**
 * Emits schema.org FAQPage structured data for a page's FAQ set.
 *
 * Note: Google restricted FAQ *rich results* to authoritative government and
 * health sites in 2023, so this will not render an accordion in Google's SERP.
 * It is still worth emitting — answer engines and LLM-based search read it, and
 * it costs nothing at runtime.
 */
export function FAQJsonLd({ faqs }: { faqs: FaqEntry[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      // Content is authored in-repo, not user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
