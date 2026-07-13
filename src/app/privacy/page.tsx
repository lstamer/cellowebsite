import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SectionWrapper } from "@/components/ui/SectionWrapper";

const EFFECTIVE_DATE = "26 May 2026";

export const metadata: Metadata = {
  title: "Privacy Policy | Stamer",
  description:
    "How Luke Stamer (stamer.co.za) collects, uses, and protects your personal information in line with POPIA and GDPR.",
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main id="main" className="min-h-dvh bg-background pt-24 pb-20 lg:pt-32 lg:pb-24">
        <SectionWrapper maxWidth="max-w-4xl" className="!py-0">
          {/* Page header */}
          <div className="mb-10">
            <p className="font-serif italic text-2xl md:text-3xl text-foreground/70 mb-2">
              Your data, your rights
            </p>
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl tracking-tight mb-4">
              Privacy Policy
            </h1>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80">
              Effective date: {EFFECTIVE_DATE}
            </p>
          </div>

          {/* 1. Who we are */}
          <div className="mb-14">
            <p className="font-jost text-xs uppercase tracking-widest text-foreground/60 mb-4">
              01 — Who We Are
            </p>
            <h2 className="font-display text-2xl md:text-3xl mb-6">
              The Responsible Party
            </h2>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              This website, <strong>stamer.co.za</strong>, is operated by{" "}
              <strong>Luke Stamer</strong>, a sole proprietor and professional
              cellist based in South Africa. Under the Protection of Personal
              Information Act 4 of 2013 (<strong>POPIA</strong>), Luke Stamer
              is the Responsible Party — the person who determines the purpose
              of and means for processing your personal information.
            </p>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              If you have any questions about this policy, or wish to exercise
              any of your rights, please get in touch:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80 mb-4 font-sans text-base md:text-lg">
              <li>
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:luke@stamer.co.za"
                  className="underline underline-offset-4 hover:text-accent-ink"
                >
                  luke@stamer.co.za
                </a>
              </li>
              <li>
                <strong>Phone / WhatsApp:</strong>{" "}
                <a
                  href="tel:+27639081386"
                  className="underline underline-offset-4 hover:text-accent-ink"
                >
                  +27 63 908 1386
                </a>
              </li>
              <li>
                <strong>Website:</strong>{" "}
                <Link
                  href="/"
                  className="underline underline-offset-4 hover:text-accent-ink"
                >
                  stamer.co.za
                </Link>
              </li>
            </ul>
          </div>

          {/* 2. What this policy covers */}
          <div className="mb-14">
            <p className="font-jost text-xs uppercase tracking-widest text-foreground/60 mb-4">
              02 — Scope
            </p>
            <h2 className="font-display text-2xl md:text-3xl mb-6">
              What This Policy Covers
            </h2>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              This policy explains what personal information we collect when you
              use stamer.co.za, why we collect it, who we share it with, and
              what rights you have over it. It applies to all visitors,
              whether you are simply browsing, submitting a general enquiry, or
              requesting a booking quote.
            </p>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              This policy does not cover third-party websites that we may link
              to. Once you leave stamer.co.za, the privacy practices of those
              sites govern your experience there.
            </p>
          </div>

          {/* 3. Information we collect */}
          <div className="mb-14">
            <p className="font-jost text-xs uppercase tracking-widest text-foreground/60 mb-4">
              03 — Information We Collect
            </p>
            <h2 className="font-display text-2xl md:text-3xl mb-6">
              What We Collect and How
            </h2>

            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              We only collect information that you actively provide to us, plus
              basic technical data that every web server receives automatically.
              We do not use tracking pixels, third-party analytics, or
              advertising networks.
            </p>

            <h3 className="font-display text-xl md:text-2xl mb-3 mt-8">
              Home page contact form
            </h3>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              When you complete the contact form on our homepage, we collect:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80 mb-4 font-sans text-base md:text-lg">
              <li>First name and last name</li>
              <li>Email address</li>
              <li>Phone number (optional)</li>
              <li>
                Enquiry type (wedding, private event, corporate event,
                fundraiser, or other)
              </li>
              <li>Your message</li>
            </ul>

            <h3 className="font-display text-xl md:text-2xl mb-3 mt-8">
              Booking enquiry form at /book
            </h3>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              When you submit a booking enquiry, we collect:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80 mb-4 font-sans text-base md:text-lg">
              <li>First name and last name</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>
                WhatsApp number (optional — you may indicate this matches your
                phone number)
              </li>
              <li>Event type</li>
              <li>Preferred date (or indication that a date is not yet set)</li>
              <li>
                Event location (free-text entry powered by Google Maps Places
                autocomplete — see section 6 below)
              </li>
              <li>Approximate guest count</li>
              <li>Desired performance duration in minutes</li>
              <li>Message or additional notes</li>
            </ul>

            <h3 className="font-display text-xl md:text-2xl mb-3 mt-8">
              Server and access logs
            </h3>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              Our hosting provider, Vercel, automatically records standard web
              server log data each time you request a page. This includes your
              IP address, browser type and version (user-agent string), the
              page you requested, the date and time of the request, and the
              HTTP status code returned. This data is used solely for
              performance monitoring and security purposes, and we do not use
              it to identify or profile individual visitors.
            </p>
          </div>

          {/* 4. Why we use it */}
          <div className="mb-14">
            <p className="font-jost text-xs uppercase tracking-widest text-foreground/60 mb-4">
              04 — Purpose of Processing
            </p>
            <h2 className="font-display text-2xl md:text-3xl mb-6">
              Why We Use Your Information
            </h2>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              We use the information you provide exclusively to respond to your
              enquiry and, where relevant, to prepare and provide a performance
              quote or booking confirmation. Specifically, we use your details
              to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80 mb-4 font-sans text-base md:text-lg">
              <li>
                Respond to general enquiries and answer questions about
                availability and repertoire
              </li>
              <li>
                Prepare accurate quotations tailored to your event type,
                location, and duration requirements
              </li>
              <li>
                Coordinate and confirm performance bookings and related
                logistics
              </li>
              <li>
                Maintain a CRM record of our correspondence so that follow-up
                communications are efficient and nothing falls through the cracks
              </li>
              <li>
                Send you a WhatsApp notification (internally, to Luke) so that
                new booking requests are actioned promptly
              </li>
            </ul>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              We do not use your information for automated decision-making,
              profiling, or unsolicited marketing communications. We will never
              sell your personal information to any third party.
            </p>
          </div>

          {/* 5. Lawful basis */}
          <div className="mb-14">
            <p className="font-jost text-xs uppercase tracking-widest text-foreground/60 mb-4">
              05 — Lawful Basis
            </p>
            <h2 className="font-display text-2xl md:text-3xl mb-6">
              Our Legal Grounds for Processing
            </h2>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              Under <strong>POPIA section 11</strong>, we process your personal
              information on the following grounds:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80 mb-4 font-sans text-base md:text-lg">
              <li>
                <strong>Consent:</strong> By submitting our contact or booking
                form, you voluntarily provide your information and consent to
                us using it to respond to your enquiry. You may withdraw this
                consent at any time by contacting us (see section 9 for your
                rights).
              </li>
              <li>
                <strong>Legitimate interest / pre-contractual measures:</strong>{" "}
                Processing is necessary to take steps at your request prior to
                entering into a contract for performance services — for example,
                to calculate a quote or check availability.
              </li>
              <li>
                <strong>Contractual necessity:</strong> Once a booking is
                confirmed, processing is necessary to fulfil our contractual
                obligations to you.
              </li>
            </ul>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              For visitors based in the European Union or European Economic
              Area, the equivalent lawful bases under{" "}
              <strong>GDPR Article 6</strong> apply: Article 6(1)(a) (consent),
              Article 6(1)(b) (performance of a contract or pre-contractual
              steps), and Article 6(1)(f) (legitimate interests) where
              applicable. Our legitimate interests are to respond to genuine
              commercial enquiries and to manage our business records
              efficiently, and these interests are not overridden by your
              privacy rights given the limited and expected nature of the
              processing.
            </p>
          </div>

          {/* 6. Who we share with */}
          <div className="mb-14">
            <p className="font-jost text-xs uppercase tracking-widest text-foreground/60 mb-4">
              06 — Third-Party Processors
            </p>
            <h2 className="font-display text-2xl md:text-3xl mb-6">
              Who We Share Your Information With
            </h2>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              We share your information only with the service providers listed
              below. Each receives only the data necessary to perform their
              function. We do not sell, rent, or trade your personal information
              with any other party.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80 mb-6 font-sans text-base md:text-lg">
              <li>
                <strong>Attio</strong> (USA) — Our customer relationship
                management (CRM) platform. Enquiry and booking form submissions
                are stored here so we can manage correspondence and follow-ups
                in one place.{" "}
                <a
                  href="https://attio.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 hover:text-accent-ink"
                >
                  Attio Privacy Policy
                </a>
              </li>
              <li>
                <strong>WaSender</strong> (USA) — A WhatsApp notification
                service. When you submit a booking enquiry, a WhatsApp alert is
                sent to Luke&apos;s number so that new requests are actioned
                promptly. Your name and enquiry details are included in this
                notification.{" "}
                <a
                  href="https://wasender.app/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 hover:text-accent-ink"
                >
                  WaSender Privacy Policy
                </a>
              </li>
              <li>
                <strong>Google LLC — Maps Platform / Places API</strong> (USA)
                — The location field in the booking form uses Google&apos;s Places
                autocomplete service to help you select your venue accurately.
                Text you type into that field is sent to Google&apos;s servers in
                real time to generate suggestions.{" "}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 hover:text-accent-ink"
                >
                  Google Privacy Policy
                </a>
              </li>
              <li>
                <strong>Vercel Inc.</strong> (USA) — Our hosting and deployment
                platform. Vercel processes server log data (IP address,
                user-agent) as a necessary part of serving the website.{" "}
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 hover:text-accent-ink"
                >
                  Vercel Privacy Policy
                </a>
              </li>
            </ul>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              We also load typefaces (Cormorant Garamond, Manrope, and Jost)
              via Google Fonts at page load. Google may log the request
              including your IP address. We do not receive any data from Google
              in relation to this.{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 hover:text-accent-ink"
              >
                Google Privacy Policy
              </a>
            </p>
          </div>

          {/* 7. Cross-border transfers */}
          <div className="mb-14">
            <p className="font-jost text-xs uppercase tracking-widest text-foreground/60 mb-4">
              07 — Cross-Border Transfers
            </p>
            <h2 className="font-display text-2xl md:text-3xl mb-6">
              Transfer of Information Outside South Africa
            </h2>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              As described above, all of our third-party processors are based in
              the United States of America. In terms of{" "}
              <strong>POPIA section 72</strong>, personal information may be
              transferred to a third country only if that country, territory, or
              international organisation ensures an adequate level of
              protection, or if the recipient is bound by binding corporate
              rules, contractual obligations, or equivalent measures that
              uphold the conditions of lawful processing comparable to POPIA.
            </p>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              Each processor listed in section 6 above maintains data processing
              agreements (DPAs) and contractual safeguards — including standard
              contractual clauses where required under GDPR — that provide
              equivalent protections. By submitting a form on this website, you
              acknowledge that your personal information will be transferred to
              and processed in the United States under these protections.
            </p>
          </div>

          {/* 8. Retention */}
          <div className="mb-14">
            <p className="font-jost text-xs uppercase tracking-widest text-foreground/60 mb-4">
              08 — Retention
            </p>
            <h2 className="font-display text-2xl md:text-3xl mb-6">
              How Long We Keep Your Information
            </h2>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              We retain personal information for as long as is necessary to
              fulfil the purpose for which it was collected, or as required by
              law. For booking and enquiry records, we follow the{" "}
              <strong>seven-year retention period</strong> aligned with South
              African Revenue Service (SARS) requirements for business records
              under the Tax Administration Act.
            </p>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              If your enquiry did not result in a booking and there is no
              ongoing business relationship, we may delete your information
              sooner upon request (see section 9). Server log data held by
              Vercel is subject to Vercel&apos;s own retention schedule and is
              outside our direct control, though we will facilitate requests
              to the extent we are able.
            </p>
          </div>

          {/* 9. Your rights */}
          <div className="mb-14">
            <p className="font-jost text-xs uppercase tracking-widest text-foreground/60 mb-4">
              09 — Your Rights
            </p>
            <h2 className="font-display text-2xl md:text-3xl mb-6">
              Your Rights Under POPIA and GDPR
            </h2>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              You have the following rights regarding your personal information.
              To exercise any of them, email{" "}
              <a
                href="mailto:luke@stamer.co.za"
                className="underline underline-offset-4 hover:text-accent-ink"
              >
                luke@stamer.co.za
              </a>{" "}
              with a clear description of your request. We will respond within
              a reasonable time and at no cost to you.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80 mb-4 font-sans text-base md:text-lg">
              <li>
                <strong>Right of access:</strong> You may request a copy of
                the personal information we hold about you.
              </li>
              <li>
                <strong>Right to correction:</strong> You may ask us to correct
                any inaccurate or incomplete personal information.
              </li>
              <li>
                <strong>Right to deletion (erasure):</strong> You may ask us to
                delete your personal information where we no longer have a
                lawful basis to retain it, subject to any overriding legal
                obligation (such as the seven-year retention period described
                above).
              </li>
              <li>
                <strong>Right to object:</strong> You may object to processing
                based on legitimate interests. We will consider your objection
                and cease processing unless we have compelling grounds to
                continue.
              </li>
              <li>
                <strong>Right to withdraw consent:</strong> Where processing is
                based on your consent, you may withdraw it at any time without
                affecting the lawfulness of processing before withdrawal.
              </li>
              <li>
                <strong>Right to data portability (GDPR):</strong> If you are
                in the EU/EEA, you may request your personal information in a
                structured, commonly used, machine-readable format.
              </li>
              <li>
                <strong>Right to lodge a complaint:</strong> If you believe we
                have mishandled your personal information, you have the right to
                lodge a complaint with the South African{" "}
                <strong>Information Regulator</strong>:
                <br />
                <a
                  href="mailto:inforeg@justice.gov.za"
                  className="underline underline-offset-4 hover:text-accent-ink"
                >
                  inforeg@justice.gov.za
                </a>
                . EU/EEA residents may also complain to the supervisory
                authority in their member state.
              </li>
            </ul>
          </div>

          {/* 10. Cookies and tracking */}
          <div className="mb-14">
            <p className="font-jost text-xs uppercase tracking-widest text-foreground/60 mb-4">
              10 — Cookies &amp; Tracking
            </p>
            <h2 className="font-display text-2xl md:text-3xl mb-6">
              Cookies and Tracking Technologies
            </h2>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              This website currently uses <strong>no tracking cookies</strong>,
              analytics cookies, or advertising pixels of any kind. We do not
              use Google Analytics, Meta Pixel, HotJar, or any similar
              third-party tracking service.
            </p>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              The only external network requests made on page load are to
              Google Fonts (to load our typefaces) and, on the booking page, to
              the Google Maps Places API as you type in the location field.
              Neither of these sets first-party cookies via this site. Should
              we introduce any cookies or tracking technologies in the future,
              we will update this policy, add an appropriate notice, and
              obtain consent where required.
            </p>
          </div>

          {/* 11. Testimonials */}
          <div className="mb-14">
            <p className="font-jost text-xs uppercase tracking-widest text-foreground/60 mb-4">
              11 — Client Testimonials
            </p>
            <h2 className="font-display text-2xl md:text-3xl mb-6">
              Use of Client Communications for Marketing
            </h2>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              We may from time to time quote positive feedback and kind words
              you share with us — for example, messages sent after a
              performance — on our website or social media as testimonials. By
              default, we do this in an <strong>anonymised</strong> form: we
              may include your first name only, your event type, or a general
              descriptor (e.g. &ldquo;wedding client&rdquo;), without any
              information that would identify you to a third party.
            </p>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              If we wish to publish a testimonial that includes your{" "}
              <strong>full name, photograph, social media handle,</strong> or
              any other directly identifiable information, we will first seek
              your separate, explicit written consent before doing so. No
              identifiable testimonial will be published without that consent.
            </p>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              You may opt out of having your feedback used in any form —
              anonymised or otherwise — at any time by emailing{" "}
              <a
                href="mailto:luke@stamer.co.za"
                className="underline underline-offset-4 hover:text-accent-ink"
              >
                luke@stamer.co.za
              </a>
              . We will remove any existing quotes promptly upon request. This
              clause mirrors the corresponding provision in our{" "}
              <Link
                href="/terms"
                className="underline underline-offset-4 hover:text-accent-ink"
              >
                Terms of Service
              </Link>
              .
            </p>
          </div>

          {/* 12. Children */}
          <div className="mb-14">
            <p className="font-jost text-xs uppercase tracking-widest text-foreground/60 mb-4">
              12 — Children
            </p>
            <h2 className="font-display text-2xl md:text-3xl mb-6">
              Children&apos;s Privacy
            </h2>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              This website is not directed at children under the age of 18. We
              do not knowingly collect personal information from minors. If you
              are a parent or guardian and you believe your child has submitted
              personal information through this site, please contact us
              immediately at{" "}
              <a
                href="mailto:luke@stamer.co.za"
                className="underline underline-offset-4 hover:text-accent-ink"
              >
                luke@stamer.co.za
              </a>{" "}
              and we will delete that information without delay.
            </p>
          </div>

          {/* 13. Changes */}
          <div className="mb-14">
            <p className="font-jost text-xs uppercase tracking-widest text-foreground/60 mb-4">
              13 — Policy Updates
            </p>
            <h2 className="font-display text-2xl md:text-3xl mb-6">
              Changes to This Policy
            </h2>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              We may update this Privacy Policy from time to time to reflect
              changes in our practices, the services we use, or applicable law.
              When we make a material change, we will update the effective date
              at the top of this page. We encourage you to review this policy
              periodically. Continued use of the website after any update
              constitutes acceptance of the revised terms.
            </p>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              If we introduce new data collection practices — such as analytics
              cookies or a newsletter — we will update this policy before
              those practices begin and will obtain any necessary consent.
            </p>
          </div>

          {/* 14. Contact */}
          <div className="mb-14">
            <p className="font-jost text-xs uppercase tracking-widest text-foreground/60 mb-4">
              14 — Contact
            </p>
            <h2 className="font-display text-2xl md:text-3xl mb-6">
              Get in Touch
            </h2>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              If you have any questions, concerns, or requests relating to this
              Privacy Policy or the way we handle your personal information,
              please contact us directly — we are happy to help.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/80 mb-4 font-sans text-base md:text-lg">
              <li>
                <strong>Luke Stamer</strong> — Responsible Party
              </li>
              <li>
                Email:{" "}
                <a
                  href="mailto:luke@stamer.co.za"
                  className="underline underline-offset-4 hover:text-accent-ink"
                >
                  luke@stamer.co.za
                </a>
              </li>
              <li>
                Phone / WhatsApp:{" "}
                <a
                  href="tel:+27639081386"
                  className="underline underline-offset-4 hover:text-accent-ink"
                >
                  +27 63 908 1386
                </a>
              </li>
              <li>
                Website:{" "}
                <Link
                  href="/"
                  className="underline underline-offset-4 hover:text-accent-ink"
                >
                  stamer.co.za
                </Link>
              </li>
            </ul>
            <p className="font-sans text-base md:text-lg leading-relaxed text-foreground/80 mb-4">
              You also have the right to lodge a complaint with the South
              African Information Regulator if you believe your personal
              information has not been handled in accordance with POPIA:{" "}
              <a
                href="mailto:inforeg@justice.gov.za"
                className="underline underline-offset-4 hover:text-accent-ink"
              >
                inforeg@justice.gov.za
              </a>
              .
            </p>
          </div>
        </SectionWrapper>
      </main>
      <Footer />
    </>
  );
}
