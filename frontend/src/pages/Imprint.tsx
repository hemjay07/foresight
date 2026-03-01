import LegalPageLayout from '../components/LegalPageLayout';
import SEO from '../components/SEO';

const Imprint = () => {
  return (
    <LegalPageLayout title="Legal Notice / Imprint">
      <SEO title="Legal Notice" description="Foresight legal notice and imprint information." path="/imprint" />
      <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
        Legal Notice / Imprint
      </h1>

      <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700/50 space-y-6 text-gray-300">
        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">Platform Information</h2>
          <div className="space-y-2">
            <p>
              <strong className="text-white">Platform Name:</strong> Foresight - CT Fantasy League
            </p>
            <p>
              <strong className="text-white">Platform Type:</strong> Decentralized Web Application (dApp)
            </p>
            <p>
              <strong className="text-white">Blockchain Network:</strong> Solana
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">Responsible Party</h2>
          <p className="mb-3">
            As a decentralized application, Foresight operates on smart contracts deployed on the Solana blockchain. The platform is community-governed and open-source.
          </p>
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/30">
            <p className="text-sm">
              <strong className="text-cyan-400">Contact:</strong> For inquiries, please reach out through our official Discord community or GitHub repository.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">Disclaimer of Liability</h2>
          <p className="mb-3">
            Despite careful content control, we assume no liability for the content of external links. The operators of the linked pages are solely responsible for their content.
          </p>
          <p>
            The platform is provided "as is" without any warranties. Users interact with blockchain smart contracts at their own risk.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">Intellectual Property</h2>
          <p className="mb-3">
            The content, design, and code of this platform are protected by copyright laws. Unauthorized use or reproduction is prohibited unless explicitly permitted by the open-source license.
          </p>
          <div className="space-y-2">
            <p>
              <strong className="text-white">Open Source:</strong> Core components are available on GitHub
            </p>
            <p>
              <strong className="text-white">License:</strong> See repository for specific license terms
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">Data Protection Officer</h2>
          <p>
            As a decentralized application with minimal data collection, we operate under Web3 principles where users control their own data through blockchain wallets. For data protection inquiries, please contact us through our official channels.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">Dispute Resolution</h2>
          <p className="mb-3">
            The European Commission provides a platform for online dispute resolution (ODR):
          </p>
          <a
            href="https://ec.europa.eu/consumers/odr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 transition-colors underline"
          >
            https://ec.europa.eu/consumers/odr
          </a>
          <p className="mt-3 text-sm">
            We are not obliged or willing to participate in dispute resolution proceedings before a consumer arbitration board.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">Smart Contract Addresses</h2>
          <p className="mb-3">
            All smart contracts are deployed on Solana blockchain and are publicly verifiable:
          </p>
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/30">
            <p className="text-sm text-gray-400">
              Smart contract addresses and verification links are available in our technical documentation and GitHub repository.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">Regulatory Compliance</h2>
          <p>
            This platform operates as a fantasy sports game for entertainment purposes only. No real money gambling or betting is involved. Users participate by connecting cryptocurrency wallets and interacting with smart contracts on the blockchain.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">Contact Information</h2>
          <div className="space-y-2">
            <p>
              <strong className="text-white">Discord:</strong>{' '}
              <a
                href="https://discord.gg/foresight"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Join our community
              </a>
            </p>
            <p>
              <strong className="text-white">GitHub:</strong>{' '}
              <a
                href="https://github.com/foresight-ct"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                View our repositories
              </a>
            </p>
            <p>
              <strong className="text-white">X:</strong>{' '}
              <a
                href="https://x.com/ForesightCT"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                @ForesightCT
              </a>
            </p>
          </div>
        </section>

        <div className="text-sm text-gray-500 border-t border-gray-700 pt-6 mt-8">
          Last updated: November 2025
        </div>
      </div>
    </LegalPageLayout>
  );
};

export default Imprint;
