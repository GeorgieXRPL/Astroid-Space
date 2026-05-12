import { DonationLedger } from '../components/DonationLedger';
import { CharityNominationForm } from '../components/CharityNominationForm';
import { CharityNominationsList } from '../components/CharityNominationsList';

export const metadata = {
  // Title intentionally omitted: page falls through to the layout default
  // ("Astroid \u00b7 Starlike") so the tab stays brand-only here.
  description:
    "Live, on-chain transparency for every cent flowing to charity. 25% of pump.fun creator fees auto-route via donate.gg to St. Jude Children's Research Hospital - we never custody.",
};

export default function CharityPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      {/* ==================== HEADER ==================== */}
      <div className="text-center mb-12">
        <div className="eyebrow mb-3">Transparency</div>
        <h1 className="font-display text-4xl sm:text-6xl font-bold text-white tracking-tight mb-4">
          Every lamport. <span className="text-white/50">On-chain.</span>
        </h1>
        <p className="text-white/60 max-w-xl mx-auto leading-relaxed">
          We don&apos;t custody donations. 25% of pump.fun creator fees
          auto-route at the moment fees are claimed, through{' '}
          <strong className="text-white">donate.gg</strong> - an arms-length
          service that delivers crypto donations to verified 501(c)(3)
          charities - on to St. Jude Children&apos;s Research Hospital.
        </p>
      </div>

      {/* ==================== LIVE LEDGER ==================== */}
      <DonationLedger />

      {/* ==================== HOW IT ROUTES ==================== */}
      <div className="mt-16 space-y-6">
        <div className="section-divider">How it routes</div>

        <div className="glass-panel-bright p-6 sm:p-8">
          <div className="eyebrow mb-2">25% &middot; St. Jude (via donate.gg)</div>
          <h3 className="font-display text-xl text-white mb-3">
            Auto-routed at fee-claim time
          </h3>
          <p className="text-sm text-white/70 leading-relaxed mb-4">
            When pump.fun creator fees are claimed, 25% routes automatically
            to a donate.gg-controlled wallet earmarked for St. Jude
            Children&apos;s Research Hospital. From there donate.gg sweeps
            the SOL onward, converts it to USDC, and forwards to St.
            Jude&apos;s organisational receiving wallet. The Astroid project
            never custody-holds any of it - the routing is configured at the
            source and runs without us touching the funds.
          </p>
          <p className="text-xs text-white/50 leading-relaxed">
            The wallet shown above is the donate.gg intake address. Because
            donate.gg sweeps it on a schedule, the live balance can drop to
            zero between claims. The number we headline is{' '}
            <em>cumulative inflow</em> - the lifetime sum of credits to that
            wallet - which stays accurate after every sweep.
          </p>
        </div>

        {/* About the recipient */}
        <div className="glass-panel p-6 sm:p-8">
          <div className="eyebrow mb-2">Recipient</div>
          <h3 className="font-display text-lg text-white mb-2">
            St. Jude Children&apos;s Research Hospital
          </h3>
          <p className="text-sm text-white/60 leading-relaxed mb-4">
            St. Jude treats children with cancer and other catastrophic
            illnesses regardless of family ability to pay. ALSAC - the
            American Lebanese Syrian Associated Charities - is the
            fundraising and awareness organisation for St. Jude. donate.gg
            (operated by The Giving Block) verifies that the receiving
            entity is the genuine charity before delivering funds.
          </p>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono text-white/50 leading-relaxed">
            <div>
              <dt className="text-white/30 uppercase tracking-[0.18em] mb-1">
                Tax ID (EIN)
              </dt>
              <dd className="text-white/70">62-0646012</dd>
            </div>
            <div>
              <dt className="text-white/30 uppercase tracking-[0.18em] mb-1">
                Address
              </dt>
              <dd>
                262 Danny Thomas Place
                <br />
                Memphis, TN 38105 USA
              </dd>
            </div>
            <div>
              <dt className="text-white/30 uppercase tracking-[0.18em] mb-1">
                Website
              </dt>
              <dd>
                <a
                  href="https://www.stjude.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cosmos hover:text-white"
                >
                  stjude.org &#8599;
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-white/30 uppercase tracking-[0.18em] mb-1">
                Social
              </dt>
              <dd>
                <a
                  href="https://x.com/StJude"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cosmos hover:text-white"
                >
                  @StJude &#8599;
                </a>
              </dd>
            </div>
          </dl>
          <p className="text-[11px] text-white/40 leading-relaxed mt-4">
            We use no St. Jude logo and make no claim of partnership,
            sponsorship, or endorsement. The EIN and mailing address are
            public information from St. Jude&apos;s own listings, included
            here so anyone can independently verify the organisation we&apos;re
            naming.
          </p>
        </div>

        {/* Other splits */}
        <div className="glass-panel p-6 sm:p-8 space-y-5">
          <div>
            <div className="eyebrow mb-2">10% &middot; Future children&apos;s charity</div>
            <h3 className="font-display text-lg text-white mb-2">
              Held in a separate wallet pending recipient
            </h3>
            <p className="text-sm text-white/60 leading-relaxed">
              An additional 10% of creator fees routes to a dedicated wallet
              reserved for a future, community-nominated children&apos;s
              charity. Funds accumulate there; they aren&apos;t spent in the
              meantime. The recipient is selected through the nomination
              process below and only confirmed after they consent in
              writing.
            </p>
          </div>

          <div className="pt-5 border-t border-white/5">
            <div className="eyebrow mb-2">65% &middot; Community &amp; operations</div>
            <h3 className="font-display text-lg text-white mb-2">
              Project funding and community-voted activities
            </h3>
            <p className="text-sm text-white/60 leading-relaxed">
              The remaining 65% funds project operations and community-voted
              activities - for example, Astroid Club initiatives chosen by
              holder vote. This is operational, not charitable: it is what
              keeps the project running and lets the community direct
              additional efforts beyond the 25% / 10% charity routing.
            </p>
            <p className="text-xs text-white/40 leading-relaxed mt-3">
              No charity is added without recipient consent. We do not
              solicit donations on behalf of any charity, and no user action
              constitutes a charitable contribution by the user.
            </p>
          </div>
        </div>

        {/* Why the legacy wallet is still visible */}
        <div className="glass-panel p-6 sm:p-8">
          <div className="eyebrow mb-2">Why we still show the original wallet</div>
          <p className="text-sm text-white/60 leading-relaxed">
            Before the donate.gg routing went live, 25% of creator fees
            routed to a separate Solana wallet originally provided by ALSAC.
            That wallet is now frozen - no new fees arrive there - but its
            balance is preserved on-chain forever as a permanent record of
            donations sent during that earlier era. We keep it on this page
            for transparency: erasing it would erase part of the project&apos;s
            on-chain history.
          </p>
        </div>
      </div>

      {/* ==================== COMMUNITY NOMINATIONS ==================== */}
      <div id="nominate" className="mt-20 space-y-6 scroll-mt-24">
        <div className="section-divider">
          More charities - chosen by the community
        </div>

        <div className="glass-panel p-6 sm:p-8">
          <p className="text-white/70 leading-relaxed text-sm">
            Beyond St. Jude, we&apos;re actively reaching out to other
            children&apos;s charities - nominated by the community - to
            request permission to receive on-chain transfers. Once a charity
            confirms in writing, they&apos;re considered as the recipient of
            the 10% future-charity wallet (or, in the future, a fresh split
            funded from the community-and-operations side). The 25% routing
            to St. Jude is not affected. Suggest a charity below and
            we&apos;ll do the outreach.
          </p>
        </div>

        <CharityNominationForm />

        <div className="pt-4">
          <div className="telemetry-label mb-3">Approved nominations</div>
          <CharityNominationsList />
        </div>
      </div>

      {/* ==================== LEGAL DISCLAIMER ==================== */}
      <div className="mt-20 glass-panel p-6 sm:p-8">
        <div className="eyebrow mb-3">Important</div>
        <p className="text-sm text-white/60 leading-relaxed">
          Astroid is not affiliated with, endorsed by, partnered with, or
          sponsored by St. Jude Children&apos;s Research Hospital, ALSAC,
          donate.gg, or any other organisation listed on this site. The
          25% routing flows through donate.gg, an arms-length third-party
          service for crypto donations to verified 501(c)(3) charities; the
          inclusion of St. Jude as the named beneficiary reflects donate.gg
          delivering funds to that charity, not a relationship between
          Astroid and St. Jude. We do not solicit donations on behalf of
          St. Jude or any other charity. No portion of the token&apos;s
          price or any user action constitutes a charitable contribution by
          the user. Naming a star, writing a wish, and submitting a drawing
          are all free and unrelated to any donation flow.
        </p>
      </div>

      <div className="text-center pt-12">
        <p className="text-xs font-mono text-white/30 tracking-widest uppercase">
          Not financial advice &middot; Naming a star is free &middot; Wallet
          addresses are public
        </p>
      </div>
    </div>
  );
}
