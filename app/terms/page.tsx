import Link from "next/link";
import { LogoMark } from "@/lib/logo";

export const metadata = {
  title: "Terms & Conditions — Folio",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white px-5 py-12 text-slate-800">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
          <LogoMark className="h-5 w-5" />
          Folio
        </Link>

        <h1 className="mt-8 text-3xl font-bold tracking-tight sm:text-4xl">Terms & Conditions</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: {new Date().toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })}</p>

        <div className="prose prose-slate mt-8 max-w-none">
          <p>
            Welcome to Folio (<a href="https://folio.cafe">folio.cafe</a>). By using Folio you agree to the
            terms below. Please read them carefully.
          </p>

          <h2 className="mt-8 text-xl font-semibold">1. What Folio is</h2>
          <p>
            Folio is a leads marketplace that connects Nigerian customers with vetted businesses. Customers
            post free service requests; businesses pay credits to unlock contact details and reach out.
          </p>

          <h2 className="mt-8 text-xl font-semibold">2. Accounts</h2>
          <p>
            Business accounts are created with email + a 4-digit PIN. You are responsible for keeping your
            PIN private. Folio is not liable for unauthorised access caused by shared credentials.
          </p>

          <h2 className="mt-8 text-xl font-semibold">3. Compliance & verification</h2>
          <p>
            Businesses may submit Nigerian compliance documents (CAC RC/BN, NIN, government ID) for the
            Verified badge. You confirm that documents you submit are authentic. Folio may reject or revoke
            verification at its discretion.
          </p>

          <h2 className="mt-8 text-xl font-semibold">4. Customer requests</h2>
          <p>
            Posting a request is free. You confirm that the information you provide — including budget,
            location and contact details — is true. You consent to the request being shared with up to 10
            matching businesses on Folio. High-priority requests are an optional paid boost.
          </p>

          <h2 className="mt-8 text-xl font-semibold">5. Credits & payments</h2>
          <p>
            Businesses purchase credits via Paystack. Credits are non-refundable once used to unlock a
            lead. Folio may, from time to time, change credit prices and unlock rates — current rates are
            always shown in your dashboard and on the pricing section of folio.cafe.
          </p>

          <h2 className="mt-8 text-xl font-semibold">6. Unlock caps</h2>
          <p>
            Each customer request can be unlocked by a maximum of 10 businesses. Once the cap is reached,
            no further unlocks are possible. Credits spent on unlocks are non-refundable.
          </p>

          <h2 className="mt-8 text-xl font-semibold">7. Conduct</h2>
          <p>
            You agree not to abuse the platform: no fraud, no spam, no harassment, no fake requests, no
            scraping of contact details for resale. We may suspend accounts that breach these rules.
          </p>

          <h2 className="mt-8 text-xl font-semibold">8. Privacy</h2>
          <p>
            We collect only the data needed to run the marketplace: emails, phone numbers and request
            details. Contact data is hidden behind the unlock paywall until a business pays credits.
            We do not sell your data to third parties.
          </p>

          <h2 className="mt-8 text-xl font-semibold">9. Liability</h2>
          <p>
            Folio facilitates introductions but is not party to the deal you ultimately do with a business
            or customer. We are not liable for the quality of work, payment defaults, or any disputes
            between users. We recommend reviewing each business's public page and reviews before engaging.
          </p>

          <h2 className="mt-8 text-xl font-semibold">10. Changes</h2>
          <p>
            We may update these terms occasionally. Material changes will be announced via email or a
            banner on the platform. Continued use of Folio after changes constitutes acceptance.
          </p>

          <h2 className="mt-8 text-xl font-semibold">11. Contact</h2>
          <p>
            Reach us anytime at <a href="mailto:hello@folio.cafe">hello@folio.cafe</a>.
          </p>
        </div>
      </div>
    </main>
  );
}
