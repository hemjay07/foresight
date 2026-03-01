import LegalPageLayout from '../components/LegalPageLayout';
import SEO from '../components/SEO';

const Cookies = () => {
  return (
    <LegalPageLayout title="Cookie Policy">
      <SEO title="Cookie Policy" description="Foresight cookie policy — what cookies we use and why." path="/cookies" />
      <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
        Cookie Policy
      </h1>

      <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700/50 space-y-6 text-gray-300">
        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">What Are Cookies?</h2>
          <p>
            Cookies are small text files stored on your device when you visit a website. They help us provide you with a better experience by remembering your preferences and analyzing usage patterns.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">How We Use Cookies</h2>
          <p className="mb-3">
            Foresight uses the following types of cookies:
          </p>

          <div className="space-y-4">
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/30">
              <h3 className="font-semibold text-cyan-400 mb-2">Essential Cookies</h3>
              <p className="text-sm">
                Required for the Platform to function properly. These include wallet connection state, session management, and security features.
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Cannot be disabled
              </p>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/30">
              <h3 className="font-semibold text-cyan-400 mb-2">Preference Cookies</h3>
              <p className="text-sm">
                Remember your settings such as theme preferences, language, and display options.
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Can be disabled (may affect user experience)
              </p>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/30">
              <h3 className="font-semibold text-cyan-400 mb-2">Analytics Cookies</h3>
              <p className="text-sm">
                Help us understand how visitors interact with the Platform. Data is anonymized and used to improve functionality.
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Can be disabled
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">Local Storage</h2>
          <p>
            In addition to cookies, we use browser local storage to store:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
            <li>Wallet connection preferences</li>
            <li>Welcome modal dismissal status</li>
            <li>Draft picks and team selections</li>
            <li>UI preferences and settings</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">Third-Party Cookies</h2>
          <p className="mb-3">
            Some cookies are set by third-party services we use:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Privy:</strong> Wallet authentication and connection</li>
            <li><strong>Analytics Providers:</strong> Anonymous usage tracking</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">Managing Cookies</h2>
          <p className="mb-3">
            You can control cookies through:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Browser settings: Most browsers allow you to refuse or delete cookies</li>
            <li>Platform settings: Manage preferences within the application</li>
            <li>Opt-out tools: Use browser extensions to block tracking cookies</li>
          </ul>
          <p className="mt-3 text-sm text-yellow-400">
            Note: Disabling essential cookies may affect Platform functionality.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">Web3 Considerations</h2>
          <p>
            As a decentralized application, most of your data is stored on the blockchain, not in cookies. Your wallet manages your identity and authentication, providing enhanced privacy compared to traditional web applications.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">Updates to This Policy</h2>
          <p>
            We may update this Cookie Policy to reflect changes in our practices or for legal reasons. Check this page periodically for updates.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">Contact</h2>
          <p>
            Questions about our cookie usage? Reach out through our Discord community.
          </p>
        </section>

        <div className="text-sm text-gray-500 border-t border-gray-700 pt-6 mt-8">
          Last updated: November 2025
        </div>
      </div>
    </LegalPageLayout>
  );
};

export default Cookies;
