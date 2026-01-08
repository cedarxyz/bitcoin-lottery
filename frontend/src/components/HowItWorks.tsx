export function HowItWorks() {
  const steps = [
    {
      number: '1',
      title: 'Buy Tickets',
      description:
        'Connect your Stacks wallet and purchase tickets with STX. Each ticket gives you one chance to win.',
    },
    {
      number: '2',
      title: 'Wait for Drawing',
      description:
        'Tickets sales close 1 hour before the drawing. The drawing happens automatically at the scheduled time.',
    },
    {
      number: '3',
      title: 'Winner Selected',
      description:
        'A Bitcoin block hash determines the winner. This is provably fair and verifiable by anyone.',
    },
    {
      number: '4',
      title: 'Prize Paid',
      description:
        'The winner automatically receives the entire prize pool directly to their wallet. No claims needed.',
    },
  ];

  return (
    <section id="how-it-works" className="py-12">
      <h3 className="text-2xl font-bold text-white mb-8 text-center">
        How It Works
      </h3>

      <div className="grid md:grid-cols-4 gap-6">
        {steps.map((step) => (
          <div
            key={step.number}
            className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-[#f7931a] text-black font-bold text-xl flex items-center justify-center mx-auto mb-4">
              {step.number}
            </div>
            <h4 className="text-white font-semibold mb-2">{step.title}</h4>
            <p className="text-gray-400 text-sm">{step.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <h4 className="text-white font-semibold mb-4">Provably Fair</h4>
        <p className="text-gray-400 text-sm mb-4">
          The winning ticket is determined by the Bitcoin block hash using a simple,
          verifiable formula:
        </p>
        <code className="block bg-black/50 rounded p-4 text-sm text-[#f7931a] font-mono">
          winning_ticket = (block_hash % total_tickets) + 1
        </code>
        <p className="text-gray-400 text-sm mt-4">
          Since Bitcoin blocks are immutable and unpredictable before they're mined,
          no one—including the operator—can manipulate the outcome. You can verify
          any drawing yourself using the block hash and total tickets sold.
        </p>
      </div>
    </section>
  );
}
