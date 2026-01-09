import { API_BASE_URL } from '../utils/config';

export function ForAgents() {
  const curlExample = `curl -X POST ${API_BASE_URL}/btc-raffle-enter \\
  -H "Content-Type: application/json" \\
  -H "X-Stacks-Address: YOUR_STACKS_ADDRESS"`;

  const response402Example = `{
  "status": 402,
  "maxAmountRequired": "1001",
  "resource": "/btc-raffle-enter",
  "payTo": "SPZQMCZMYGQGMNK75NMJNFKH0Y82BJT42J3CASCQ",
  "network": "mainnet",
  "tokenType": "sBTC",
  "description": "Enter Bitcoin Faces Raffle for $1 USD"
}`;

  const successExample = `{
  "success": true,
  "code": "BTC-M7X9K2-A3B4C5D6",
  "message": "Raffle entry confirmed!",
  "walletAddress": "SP...",
  "amountPaidSats": 1001,
  "amountPaidUSD": 1.00,
  "round": 1,
  "prizePoolContribution": 950
}`;

  return (
    <section id="for-agents" className="py-12">
      <h3 className="text-2xl font-bold text-white mb-6">For AI Agents</h3>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-6">
        <div>
          <h4 className="text-lg font-semibold text-white mb-3">x402 Payment Protocol</h4>
          <p className="text-gray-400 text-sm mb-4">
            AI agents can enter the Bitcoin Faces Raffle programmatically using the x402 protocol.
            This enables autonomous agents to participate in the weekly raffle by making HTTP requests
            and handling sBTC payments.
          </p>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-2">Endpoint</h4>
          <code className="block bg-black/50 rounded p-3 text-sm font-mono">
            <span className="text-green-400">POST</span>{' '}
            <span className="text-[#f7931a]">{API_BASE_URL}/btc-raffle-enter</span>
          </code>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-2">How It Works</h4>
          <ol className="list-decimal list-inside text-gray-400 text-sm space-y-3">
            <li>
              <span className="text-white">Make initial request</span> - Send a POST request to the endpoint with your Stacks address in the header
            </li>
            <li>
              <span className="text-white">Receive 402 response</span> - The server responds with HTTP 402 Payment Required, including the amount in sats and the payment address
            </li>
            <li>
              <span className="text-white">Execute sBTC transfer</span> - Transfer the specified amount of sBTC to the payment address
            </li>
            <li>
              <span className="text-white">Receive entry code</span> - After payment verification, receive your unique raffle entry code
            </li>
          </ol>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-2">Example Request</h4>
          <pre className="bg-black/50 rounded p-4 text-sm font-mono text-gray-300 overflow-x-auto">
{curlExample}
          </pre>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-2">402 Payment Required Response</h4>
          <pre className="bg-black/50 rounded p-4 text-sm font-mono text-gray-300 overflow-x-auto">
{response402Example}
          </pre>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-2">Success Response (after payment)</h4>
          <pre className="bg-black/50 rounded p-4 text-sm font-mono text-gray-300 overflow-x-auto">
{successExample}
          </pre>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-2">Required Headers</h4>
          <div className="bg-black/50 rounded p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-700">
                  <th className="pb-2">Header</th>
                  <th className="pb-2">Value</th>
                  <th className="pb-2">Description</th>
                </tr>
              </thead>
              <tbody className="text-gray-300 font-mono">
                <tr className="border-b border-gray-800">
                  <td className="py-2 text-[#f7931a]">X-Stacks-Address</td>
                  <td className="py-2">SP...</td>
                  <td className="py-2 font-sans text-gray-400">Your Stacks mainnet address</td>
                </tr>
                <tr>
                  <td className="py-2 text-[#f7931a]">Content-Type</td>
                  <td className="py-2">application/json</td>
                  <td className="py-2 font-sans text-gray-400">Request content type</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-2">Other Useful Endpoints</h4>
          <div className="bg-black/50 rounded p-4 space-y-2 font-mono text-sm">
            <div>
              <span className="text-blue-400">GET</span>{' '}
              <span className="text-gray-300">{API_BASE_URL}/raffle/status</span>
              <span className="text-gray-500 ml-2">- Current round info, entry price, prize pool</span>
            </div>
            <div>
              <span className="text-blue-400">GET</span>{' '}
              <span className="text-gray-300">{API_BASE_URL}/raffle/entries/:address</span>
              <span className="text-gray-500 ml-2">- Your entries for current round</span>
            </div>
            <div>
              <span className="text-blue-400">GET</span>{' '}
              <span className="text-gray-300">{API_BASE_URL}/admin/rounds</span>
              <span className="text-gray-500 ml-2">- Past round history and winners</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-[#f7931a]/10 border border-[#f7931a]/30 rounded-lg">
          <h4 className="text-[#f7931a] font-semibold mb-2">Integration Tips</h4>
          <ul className="text-gray-400 text-sm space-y-1">
            <li>- Entry price is $1 USD, dynamically converted to sats based on current BTC price</li>
            <li>- The <code className="text-[#f7931a]">maxAmountRequired</code> field in the 402 response contains the exact sats amount</li>
            <li>- Each successful entry returns a unique entry code for tracking</li>
            <li>- 95% of entry fees go to the prize pool, 5% to operations</li>
            <li>- Use the status endpoint to check current round before entering</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
