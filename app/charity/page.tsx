import { DonationLedger } from '../components/DonationLedger';
import { CharityNominationForm } from '../components/CharityNominationForm';
import { CharityNominationsList } from '../components/CharityNominationsList';

export const metadata = {
  title: 'Charity · Astroid',
  description:
    'Live, on-chain transparency for every cent flowing to charity. 25% of pump.fun creator fees auto-route at the source - we never custody.',
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
          auto-route at the source into a public Solana wallet you can verify
          on Solscan in real time.
        </p>
      </div>

      {/* ==================== LIVE LEDGER ==================== */}
      <DonationLedger />

      {/* ==================== RECIPIENT (ALSAC / ST. JUDE) ==================== */}
      <div className="mt-16 space-y-6">
        <div className="section-divider">Recipient</div>

        <div className="glass-panel-bright p-6 sm:p-8">
          <div className="eyebrow mb-2">Wallet provided by ALSAC</div>
          <h3 className="font-display text-xl text-white mb-3">
            St. Jude Children&apos;s Research Hospital
          </h3>
          <p className="text-sm text-white/70 leading-relaxed mb-4">
            ALSAC - the fundraising and awareness organization for St. Jude
            Children&apos;s Research Hospital - provided the Solana wallet
            above by email correspondence as an internally-supported St. Jude
            wallet for receiving on-chain transfers. 25% of every pump.fun
            creator fee auto-routes there at the protocol level on every
            trade. We never custody the funds.
          </p>
          <p className="text-xs text-white/50 leading-relaxed mb-4">
            We have not yet received formal brand-use guidelines from ALSAC.
            This site uses no St. Jude logo and makes no claim of partnership,
            sponsorship, or endorsement.
          </p>
          <div className="text-xs font-mono text-white/40 leading-relaxed">
            ALSAC · 501 St. Jude Place · Memphis, TN 38105
          </div>
        </div>

        {/* Mechanics */}
        <div className="glass-panel p-6 sm:p-8 space-y-5">
          <div>
            <div className="eyebrow mb-2">How it routes</div>
            <h3 className="font-display text-lg text-white mb-2">
              Pump.fun creator fees
            </h3>
            <p className="text-sm text-white/60 leading-relaxed">
              Pump.fun&apos;s creator fee is split 75 / 25 at the source. The
              25% wallet auto-routes on-chain to the ALSAC-provided St. Jude
              wallet above. We never touch the 25% - the split happens on-chain,
              on every trade, automatically.
            </p>
          </div>

          <div className="pt-5 border-t border-white/5">
            <div className="eyebrow mb-2">Additional charities</div>
            <h3 className="font-display text-lg text-white mb-2">
              Funded from the 75% project wallet
            </h3>
            <p className="text-sm text-white/60 leading-relaxed">
              When another children&apos;s charity confirms a wallet and
              approves the routing in writing, they&apos;re added to a
              recurring on-chain split <em>from the 75% project wallet</em>
              {' '}- the side that funds development. This does not reduce the
              25% routing to St. Jude. Per-charity portions are decided case
              by case at onboarding and disclosed publicly here once active.
            </p>
            <p className="text-xs text-white/40 leading-relaxed mt-3">
              No charity is added without recipient consent. We do not solicit
              donations on behalf of any charity, and no user action constitutes
              a charitable contribution by the user.
            </p>
          </div>
        </div>
      </div>

      {/* ==================== COMMUNITY NOMINATIONS ==================== */}
      <div id="nominate" className="mt-20 space-y-6 scroll-mt-24">
        <div className="section-divider">More charities - chosen by the community</div>

        <div className="glass-panel p-6 sm:p-8">
          <p className="text-white/70 leading-relaxed text-sm">
            Beyond St. Jude, we&apos;re actively reaching out to other
            children&apos;s charities - nominated by the community - to
            request permission to receive on-chain transfers from this
            protocol. Once a charity provides a wallet and approves the
            routing in writing, they&apos;re added to a recurring on-chain
            split from the 75% project wallet. The 25% routing to St. Jude
            is not affected. Suggest a charity below and we&apos;ll do the
            outreach.
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
          sponsored by St. Jude Children&apos;s Research Hospital, ALSAC, or
          any other charity listed on this site. The recipient wallet above
          was provided by ALSAC for the purpose of receiving on-chain
          donations. We do not solicit donations on behalf of St. Jude or any
          other charity. No portion of the token&apos;s price or any user
          action constitutes a charitable contribution by the user. Naming a
          star, writing a wish, and submitting a drawing are all free and
          unrelated to any donation flow.
        </p>
      </div>

      <div className="text-center pt-12">
        <p className="text-xs font-mono text-white/30 tracking-widest uppercase">
          Not financial advice · Naming a star is free · Charity address is public
        </p>
      </div>
    </div>
  );
}
