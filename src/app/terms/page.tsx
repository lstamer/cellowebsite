import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SectionWrapper } from "@/components/ui/SectionWrapper";

export const metadata: Metadata = {
  title: "Terms of Service | Stamer",
  description:
    "Terms governing your use of stamer.co.za — Luke Stamer's portfolio and performance inquiry website, operated from Cape Town, South Africa.",
};

const EFFECTIVE_DATE = "26 May 2026";

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-dvh bg-background pt-24 pb-20 lg:pt-32 lg:pb-24">
        <SectionWrapper maxWidth="max-w-4xl" className="!py-0">
          {/* Page header */}
          <div className="mb-10">
            <p className="font-serif italic text-2xl md:text-3xl text-foreground/70 mb-2">
              stamer.co.za
            </p>
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl tracking-tight mb-4">
              Terms of Service
            </h1>
            <p className="font-sans text-base text-foreground/70 mt-4">
              Last revised: {EFFECTIVE_DATE}
            </p>
          </div>

          {/* 1. Acceptance */}
          <div className="mb-14">
            <h2 className="font-jost text-xs uppercase tracking-widest text-foreground/60 mb-4">
              01
            </h2>
            <p className="font-display text-2xl md:text-3xl mb-6">
              Acceptance of These Terms
            </p>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              By visiting, browsing, or otherwise using stamer.co.za (the
              &quot;Site&quot;), you confirm that you have read, understood, and agree to
              be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree,
              please stop using the Site immediately.
            </p>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              These Terms apply each time you access the Site, regardless of
              whether you are a first-time visitor or a returning one. We
              reserve the right to update them at any time — see Section 11 for
              how we handle changes and how continued use constitutes acceptance.
            </p>
          </div>

          {/* 2. Who We Are */}
          <div className="mb-14">
            <h2 className="font-jost text-xs uppercase tracking-widest text-foreground/60 mb-4">
              02
            </h2>
            <p className="font-display text-2xl md:text-3xl mb-6">
              Who We Are
            </p>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              This Site is owned and operated by <strong>Luke Stamer</strong>,
              a sole proprietor based in Cape Town, South Africa. Luke is a
              professional cellist who offers live performance services for
              weddings, corporate events, private functions, and other
              occasions.
            </p>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              Throughout these Terms, &quot;we&quot;, &quot;us&quot;, and &quot;our&quot; refer to Luke
              Stamer operating as Stamer Cello. &quot;You&quot; and &quot;your&quot; refer to any
              person accessing or using the Site.
            </p>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              You can reach Luke directly at{" "}
              <a
                href="mailto:luke@stamer.co.za"
                className="underline underline-offset-4 hover:text-accent"
              >
                luke@stamer.co.za
              </a>{" "}
              or by phone at{" "}
              <a
                href="tel:+27639081386"
                className="underline underline-offset-4 hover:text-accent"
              >
                +27 63 908 1386
              </a>
              .
            </p>
          </div>

          {/* 3. What the Site Is and Isn't */}
          <div className="mb-14">
            <h2 className="font-jost text-xs uppercase tracking-widest text-foreground/60 mb-4">
              03
            </h2>
            <p className="font-display text-2xl md:text-3xl mb-6">
              What This Site Is — and Isn&apos;t
            </p>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              The Site is a portfolio and professional inquiry channel. It
              allows prospective clients to learn about Luke&apos;s work, explore
              available services and submit a booking
              inquiry.
            </p>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              <strong>
                Submitting an inquiry form on this Site does not constitute a
                booking, reservation, or binding agreement of any kind.
              </strong>{" "}
              A contract for performance services only comes into existence once
              (a) Luke has confirmed his availability in writing, and (b) both
              parties have signed a separate, written Performance Agreement
              covering the specific event details, fee, and cancellation terms.
            </p>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              There are no payment facilities on this Site. No money changes
              hands through stamer.co.za — all payment arrangements are handled
              directly between Luke and the client following the signing of a
              Performance Agreement.
            </p>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              Any pricing information shown on the Site (including on the
              Services or Weddings pages) is indicative only and intended to
              give you a general sense of investment level. Final pricing is
              confirmed in a personalised quote issued after your inquiry has
              been reviewed.
            </p>
          </div>

          {/* 4. Acceptable Use */}
          <div className="mb-14">
            <h2 className="font-jost text-xs uppercase tracking-widest text-foreground/60 mb-4">
              04
            </h2>
            <p className="font-display text-2xl md:text-3xl mb-6">
              Acceptable Use
            </p>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              You may use this Site only for lawful purposes and in a manner
              consistent with these Terms. In particular, you agree not to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80 mb-4 font-sans text-base md:text-lg leading-relaxed">
              <li>
                Scrape, crawl, spider, or otherwise systematically extract data
                from the Site using automated tools without our express written
                permission.
              </li>
              <li>
                Submit spam, unsolicited commercial messages, or bulk
                communications through any form or contact channel on the Site.
              </li>
              <li>
                Impersonate Luke Stamer, any member of his team, or any other
                person or entity in connection with the Site.
              </li>
              <li>
                Use automated scripts, bots, or other software to submit
                inquiry forms or otherwise interact with the Site in a
                non-human manner.
              </li>
              <li>
                Attempt to gain unauthorised access to any part of the Site&apos;s
                infrastructure, server, or database.
              </li>
              <li>
                Use the Site in any way that could damage, disable, overburden,
                or impair its operation, or that interferes with any other
                party&apos;s use of the Site.
              </li>
              <li>
                Reproduce, republish, or redistribute any content from this
                Site — including audio or video recordings, or
                photography — without prior written permission (see Section 5
                on Intellectual Property).
              </li>
            </ul>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              We reserve the right to block access to the Site for any user or
              IP address that we reasonably believe is violating these rules.
            </p>
          </div>

          {/* 5. Intellectual Property */}
          <div className="mb-14">
            <h2 className="font-jost text-xs uppercase tracking-widest text-foreground/60 mb-4">
              05
            </h2>
            <p className="font-display text-2xl md:text-3xl mb-6">
              Intellectual Property
            </p>

            {/* 5a — Site content & Luke's work */}
            <p className="font-jost text-xs uppercase tracking-widest text-foreground/70 mb-3 mt-8">
              5a — Site Content &amp; Luke&apos;s Work
            </p>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              All original content on this Site — including but not limited to
              written copy, audio recordings, video recordings,
              and performance photography taken of Luke Stamer — is owned by
              Luke Stamer and protected under applicable South African and
              international copyright law.
            </p>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              We grant you a limited, non-exclusive, non-transferable,
              revocable licence to access and view this content for personal,
              non-commercial purposes only. This licence does not permit you to
              download, copy, reproduce, redistribute, publish, broadcast, or
              create derivative works from any content on this Site without our
              prior written consent.
            </p>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              If you wish to use content from this Site — for example, a press
              quote or a recording excerpt — please contact us at{" "}
              <a
                href="mailto:luke@stamer.co.za"
                className="underline underline-offset-4 hover:text-accent"
              >
                luke@stamer.co.za
              </a>{" "}
              to request permission.
            </p>

            {/* 5b — Image disclosure */}
            <p className="font-jost text-xs uppercase tracking-widest text-foreground/70 mb-3 mt-8">
              5b — Image Disclosure
            </p>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              We want to be transparent about the imagery used across this
              Site. Some photographs are illustrative — sourced from licensed
              stock libraries, royalty-free archives, or used under
              fair-dealing or editorial-use principles — and are intended to
              represent the <em>type</em> of setting, event, or atmosphere
              relevant to Luke&apos;s work. Not every photograph on this Site depicts
              a literal past Stamer performance, and the inclusion of any image
              does not imply endorsement by, or affiliation with, the
              individuals pictured.
            </p>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              We take image rights seriously. If you believe that an image
              appearing on this Site infringes your copyright, your likeness
              rights, or any other rights you hold, please contact Luke
              directly at{" "}
              <a
                href="mailto:luke@stamer.co.za"
                className="underline underline-offset-4 hover:text-accent"
              >
                luke@stamer.co.za
              </a>{" "}
              with the following information: (a) a description of the image
              you believe is infringing and its URL on the Site; (b) a
              description of the work or right you believe is being infringed;
              and (c) your contact details. Luke will review your notice and,
              where the claim is well-founded, remove or replace the image
              promptly — typically within five (5) business days of receiving
              a complete notice. This good-faith takedown path gives legitimate
              rights-holders a documented resolution route.
            </p>
          </div>

          {/* 6. Client Communications & Testimonial Licence */}
          <div className="mb-14">
            <h2 className="font-jost text-xs uppercase tracking-widest text-foreground/60 mb-4">
              06
            </h2>
            <p className="font-display text-2xl md:text-3xl mb-6">
              Client Communications &amp; Testimonial Licence
            </p>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              When you send messages to Luke through the contact or booking
              forms on this Site, by email, or via WhatsApp, you grant Stamer
              Cello a non-exclusive, royalty-free, perpetual licence to quote
              excerpts from those communications as testimonials or social
              proof on this Site and on Stamer&apos;s social media channels. In
              practice, this means short quotes like &quot;Luke was absolutely
              wonderful at our wedding — I couldn&apos;t recommend him more highly.&quot;
              Where used in this way, communications are typically anonymised
              or attributed using first name and city only (e.g. &quot;Sarah, Cape
              Town&quot;).
            </p>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              <strong>Identifiable testimonials</strong> — meaning those that
              include your full name, a photograph of you, or a video recording
              in which you appear — will never be published without your
              separate, explicit consent obtained in advance. We will always
              ask you directly before using content that could identify you
              personally.
            </p>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              You may withdraw your consent to testimonial use at any time by
              emailing{" "}
              <a
                href="mailto:luke@stamer.co.za"
                className="underline underline-offset-4 hover:text-accent"
              >
                luke@stamer.co.za
              </a>
              . Upon receiving a withdrawal request, Luke will remove or fully
              anonymise the relevant content within a reasonable period. This
              clause is mirrored in our{" "}
              <Link
                href="/privacy"
                className="underline underline-offset-4 hover:text-accent"
              >
                Privacy Policy
              </Link>
              , which also describes how we handle your personal data more
              broadly.
            </p>
          </div>

          {/* 7. Third-Party Links */}
          <div className="mb-14">
            <h2 className="font-jost text-xs uppercase tracking-widest text-foreground/60 mb-4">
              07
            </h2>
            <p className="font-display text-2xl md:text-3xl mb-6">
              Third-Party Links
            </p>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              This Site may contain links to external websites — for example,
              social media profiles, music streaming platforms, or event venue
              pages. These links are provided for your convenience and do not
              constitute an endorsement of the linked site or its content.
            </p>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              We have no control over, and accept no responsibility for, the
              content, privacy practices, or availability of any third-party
              website. When you click an external link, you leave stamer.co.za
              and are subject to the terms and policies of that third-party
              site. We encourage you to read those policies before providing
              any personal information to external services.
            </p>
          </div>

          {/* 8. No Warranties */}
          <div className="mb-14">
            <h2 className="font-jost text-xs uppercase tracking-widest text-foreground/60 mb-4">
              08
            </h2>
            <p className="font-display text-2xl md:text-3xl mb-6">
              No Warranties
            </p>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              The Site is provided on an &quot;as is&quot; and &quot;as available&quot; basis. We
              make no warranty, express or implied, that the Site will be
              available without interruption, error-free, or free of viruses or
              other harmful components. We may need to take the Site offline for
              maintenance, updates, or unforeseen technical reasons at any time
              and without notice.
            </p>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              While we take care to keep information on this Site accurate and
              up to date, we do not warrant that all content — including
              indicative pricing, availability information, or service
              descriptions — is complete, current, or free from error. Pricing
              shown on marketing pages is illustrative only; the authoritative
              figure is always the personalised quote issued after your inquiry
              has been reviewed.
            </p>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              Nothing in this section limits any rights you may have under the
              South African Consumer Protection Act 68 of 2008 (&quot;CPA&quot;) or any
              other applicable legislation that cannot be excluded by agreement.
            </p>
          </div>

          {/* 9. Limitation of Liability */}
          <div className="mb-14">
            <h2 className="font-jost text-xs uppercase tracking-widest text-foreground/60 mb-4">
              09
            </h2>
            <p className="font-display text-2xl md:text-3xl mb-6">
              Limitation of Liability
            </p>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              To the fullest extent permitted by applicable law, including the
              CPA, Luke Stamer shall not be liable to you for any indirect,
              incidental, special, consequential, or punitive damages arising
              out of or in connection with your use of, or inability to use,
              this Site or its content. This includes, without limitation, loss
              of profits, loss of data, loss of goodwill, or business
              interruption, even if Luke has been advised of the possibility of
              such damages.
            </p>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              Because the Site does not process payments and does not form
              binding contracts, any loss or disappointment arising from an
              unfulfilled expectation based solely on Site content — such as
              indicative pricing or illustrative imagery — is expressly
              excluded from our liability.
            </p>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              Nothing in these Terms excludes or limits liability for death or
              personal injury caused by negligence, or for any other matter
              which cannot lawfully be excluded or limited under South African
              law.
            </p>
          </div>

          {/* 10. Governing Law & Jurisdiction */}
          <div className="mb-14">
            <h2 className="font-jost text-xs uppercase tracking-widest text-foreground/60 mb-4">
              10
            </h2>
            <p className="font-display text-2xl md:text-3xl mb-6">
              Governing Law &amp; Jurisdiction
            </p>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              These Terms and any dispute or claim arising out of or in
              connection with them — including non-contractual disputes or
              claims — are governed by and construed in accordance with the
              laws of the Republic of South Africa, without regard to its
              conflict-of-law rules.
            </p>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              You agree that the courts of Cape Town, Western Cape, South
              Africa shall have jurisdiction to settle any dispute or claim
              arising out of or in connection with these Terms or your use of
              this Site. If you are a consumer, you may also have the right to
              bring a dispute before the National Consumer Tribunal or another
              body established under the CPA.
            </p>
          </div>

          {/* 11. Changes to These Terms */}
          <div className="mb-14">
            <h2 className="font-jost text-xs uppercase tracking-widest text-foreground/60 mb-4">
              11
            </h2>
            <p className="font-display text-2xl md:text-3xl mb-6">
              Changes to These Terms
            </p>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              We may update these Terms from time to time to reflect changes in
              the law, changes to how the Site operates, or to clarify existing
              provisions. When we make changes, we will update the &quot;Last
              revised&quot; date shown at the top of this page.
            </p>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              We will not send you individual notice of changes; it is your
              responsibility to check this page periodically. Your continued
              use of the Site after any update has been posted constitutes your
              acceptance of the revised Terms. If you do not agree to the
              updated Terms, you should stop using the Site.
            </p>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              Significant changes — such as new clauses that meaningfully
              affect your rights — will be flagged with a note at the top of
              this page for at least 30 days after they take effect.
            </p>
          </div>

          {/* 12. Contact */}
          <div className="mb-14">
            <h2 className="font-jost text-xs uppercase tracking-widest text-foreground/60 mb-4">
              12
            </h2>
            <p className="font-display text-2xl md:text-3xl mb-6">Contact</p>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              If you have any questions about these Terms, wish to report a
              potential intellectual property issue, or want to exercise any
              rights described in this document, please get in touch:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80 mb-4 font-sans text-base md:text-lg leading-relaxed">
              <li>
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:luke@stamer.co.za"
                  className="underline underline-offset-4 hover:text-accent"
                >
                  luke@stamer.co.za
                </a>
              </li>
              <li>
                <strong>Phone / WhatsApp:</strong>{" "}
                <a
                  href="tel:+27639081386"
                  className="underline underline-offset-4 hover:text-accent"
                >
                  +27 63 908 1386
                </a>
              </li>
              <li>
                <strong>Location:</strong> Cape Town, South Africa
              </li>
            </ul>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              For information about how we collect, store, and use your personal
              data, please read our{" "}
              <Link
                href="/privacy"
                className="underline underline-offset-4 hover:text-accent"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>

          {/* Footer note */}
          <div className="border-t border-foreground/10 pt-10 mt-10">
            <p className="font-sans text-sm text-foreground/70 leading-relaxed">
              These Terms of Service were last revised on {EFFECTIVE_DATE} and
              apply to all use of stamer.co.za from that date forward. Luke
              Stamer operates as a sole proprietor from Cape Town, South Africa.
              South African law governs these Terms.
            </p>
          </div>
        </SectionWrapper>
      </main>
      <Footer />
    </>
  );
}
