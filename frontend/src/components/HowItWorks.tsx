export function HowItWorks() {
  const steps = [
    {
      number: '1',
      title: 'Generate Face',
      description:
        'Connect your Stacks wallet and generate a unique Bitcoin Face for $1 in sBTC. Each face is one-of-a-kind.',
    },
    {
      number: '2',
      title: 'Get Raffle Ticket',
      description:
        'Every Bitcoin Face you generate includes a weekly BTC raffle ticket. Your unique code is your entry.',
    },
    {
      number: '3',
      title: 'Winner Drawn',
      description:
        'A random winner is selected weekly from all entries. The selection uses provably fair Bitcoin block hash randomness.',
    },
    {
      number: '4',
      title: 'Prize Paid',
      description:
        'The winner receives 95% of the prize pool in sBTC. 5% goes to operating costs.',
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
        <h4 className="text-white font-semibold mb-4">Powered by x402</h4>
        <p className="text-gray-400 text-sm mb-4">
          Bitcoin Faces uses the x402 protocol for seamless sBTC micropayments. When you click "Generate Face":
        </p>
        <ol className="list-decimal list-inside text-gray-400 text-sm space-y-2">
          <li>Your wallet prompts you to sign an sBTC transfer</li>
          <li>A unique Bitcoin Face is generated just for you</li>
          <li>You receive a raffle ticket code as a bonus</li>
          <li>Your ticket is entered into the current weekly drawing</li>
        </ol>
        <p className="text-gray-400 text-sm mt-4">
          All entries are verifiable on the Stacks blockchain. Entry prices dynamically adjust based on the current BTC/USD exchange rate to maintain a $1 price.
        </p>
      </div>
    </section>
  );
}
