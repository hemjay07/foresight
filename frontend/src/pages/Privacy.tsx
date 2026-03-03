import LegalPageLayout from '../components/LegalPageLayout';
import SEO from '../components/SEO';

const Privacy = () => {
  return (
    <LegalPageLayout title="Privacy Policy">
      <SEO title="Privacy Policy" description="How Foresight handles your data. We collect minimal information and never sell your personal data." path="/privacy" />
      <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
        Privacy Policy
      </h1>

      <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700/50 space-y-6 text-gray-300">
        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">1. Information We Collect</h2>
          <p className="mb-3">
            Foresight is a decentralized application. We collect minimal information:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Wallet Address:</strong> Your public blockchain address when you connect your wallet</li>
            <li><strong>On-Chain Data:</strong> Your transactions and interactions with our smart contracts</li>
            <li><strong>Usage Data:</strong> Anonymous analytics about how you use the Platform</li>
            <li><strong>Local Storage:</strong> Preferences stored in your browser</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">2. How We Use Your Information</h2>
          <p>
            We use the collected information to:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
            <li>Provide and maintain the Platform</li>
            <li>Track your contest performance</li>
            <li>Improve user experience and features</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">3. Data Storage</h2>
          <p>
            Most of your data is stored on the Solana blockchain, which is public and immutable. Some preferences may be stored locally in your browser or on our servers for functionality purposes.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">4. Third-Party Services</h2>
          <p className="mb-3">
            We use the following third-party services:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Privy:</strong> Wallet authentication and connection</li>
            <li><strong>Solana Network:</strong> Blockchain infrastructure</li>
            <li><strong>Twitter API:</strong> For influencer metrics (public data only)</li>
            <li><strong>Analytics Tools:</strong> For anonymous usage statistics</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">5. Cookies and Tracking</h2>
          <p>
            We use essential cookies to maintain your session and preferences. See our Cookie Policy for more details.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">6. Your Rights</h2>
          <p className="mb-3">
            You have the right to:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Access your data</li>
            <li>Request deletion of off-chain data (on-chain data is immutable)</li>
            <li>Opt-out of analytics</li>
            <li>Disconnect your wallet at any time</li>
            <li>Data portability (export your data)</li>
            <li>Object to processing of your personal data</li>
            <li>Lodge a complaint with a supervisory authority</li>
          </ul>
          <p className="mt-3 text-sm">
            <strong className="text-white">GDPR Rights:</strong> If you are in the European Economic Area (EEA), you have additional rights under the General Data Protection Regulation (GDPR). Contact us to exercise these rights.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">6a. Data Retention</h2>
          <p>
            We retain off-chain data only as long as necessary for the purposes set out in this policy. On-chain data is permanently stored on the blockchain and cannot be deleted. Local storage data persists until you clear your browser cache.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">6b. International Data Transfers</h2>
          <p>
            Your data may be processed in countries outside your jurisdiction. Blockchain data is distributed globally by nature. We ensure appropriate safeguards are in place for any international data transfers.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">7. Data Security</h2>
          <p>
            We implement security measures to protect your data. However, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">8. Children's Privacy</h2>
          <p>
            Our Platform is not intended for children under 13. We do not knowingly collect information from children under 13.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">10. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us through our Discord community.
          </p>
        </section>

        <div className="text-sm text-gray-500 border-t border-gray-700 pt-6 mt-8">
          Last updated: November 2025
        </div>
      </div>
    </LegalPageLayout>
  );
};

export default Privacy;
