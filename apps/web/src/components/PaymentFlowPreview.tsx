const payoutCorridors = ['NGN', 'GHS', 'KES', 'ZAR', 'TZS', 'UGX', 'XOF', 'XAF'];

const flowCards = [
  {
    step: '01',
    title: 'Treasury wallet',
    label: 'Payroll funded once',
    description: 'Operators prepare one payroll batch instead of managing separate cross-border transfers.',
  },
  {
    step: '02',
    title: 'Stellar settlement',
    label: 'Signed and settled in seconds',
    description: 'AfriWage uses Stellar to move value quickly while keeping each transfer traceable.',
  },
  {
    step: '03',
    title: 'Local payout corridors',
    label: 'Delivered in familiar currencies',
    description: 'Teams receive payroll through supported African payout corridors with clear proof.',
  },
];

export function PaymentFlowPreview() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5 md:p-6">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#14A800]">
            How AfriWage works
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-white md:text-3xl">
            One payroll path from treasury to local payout.
          </h2>
        </div>
        <div className="rounded-lg border border-white/10 bg-[#0A0A0A] px-4 py-3 md:min-w-[210px]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/35">
            Transaction proof
          </p>
          <p className="mt-1 font-mono text-sm text-white/80">hash · memo · status</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {flowCards.map((card) => (
          <div key={card.step} className="rounded-xl border border-white/10 bg-[#0A0A0A] p-5">
            <div className="flex items-center justify-between gap-4">
              <span className="font-mono text-xs font-semibold text-[#14A800]">{card.step}</span>
              <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/35">
                {card.title}
              </span>
            </div>
            <p className="mt-5 text-lg font-semibold text-white">{card.label}</p>
            <p className="mt-3 text-sm leading-6 text-white/55">{card.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-xl border border-white/10 bg-[#0A0A0A] p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/35">
              Supported payout corridors
            </p>
            <p className="mt-2 text-sm leading-6 text-white/60">
              Payroll can be routed into supported African currency corridors while retaining a
              verifiable on-chain record.
            </p>
          </div>
          <div className="flex max-w-xl flex-wrap gap-2">
            {payoutCorridors.map((currency) => (
              <span
                key={currency}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-xs font-semibold text-white/75"
              >
                {currency}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
