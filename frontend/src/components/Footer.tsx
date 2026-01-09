export function Footer() {
  return (
    <footer className="border-t border-gray-800 py-8 mt-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#f7931a] flex items-center justify-center">
              <span className="text-sm font-bold text-black">B</span>
            </div>
            <span className="text-gray-400 text-sm">Bitcoin Faces Raffle</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-400">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition"
            >
              GitHub
            </a>
            <a
              href="https://explorer.stacks.co"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition"
            >
              Contract
            </a>
            <a
              href="mailto:support@example.com"
              className="hover:text-white transition"
            >
              Support
            </a>
          </div>

          <p className="text-xs text-gray-500">
            NO PURCHASE NECESSARY TO ENTER OR WIN. 18+ only.
          </p>
        </div>
      </div>
    </footer>
  );
}
