import LegalPageLayout from '../components/LegalPageLayout';
import SEO from '../components/SEO';

const Terms = () => {
  return (
    <LegalPageLayout title="Terms of Service">
      <SEO title="Terms of Service" description="Foresight Terms of Service — rules and conditions for using the CT Fantasy League platform." path="/terms" />
      <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
        Terms of Service
      </h1>

      <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700/50 space-y-6 text-gray-300">
        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
          <p>
            By accessing and using Foresight ("the Platform"), you accept and agree to be bound by the terms and provision of this agreement.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">2. Use License</h2>
          <p className="mb-3">
            Permission is granted to temporarily use the Platform for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Modify or copy the materials</li>
            <li>Use the materials for any commercial purpose or for any public display</li>
            <li>Attempt to decompile or reverse engineer any software contained on the Platform</li>
            <li>Remove any copyright or other proprietary notations from the materials</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">3. Web3 and Blockchain</h2>
          <p>
            Foresight is a decentralized application built on the Solana blockchain. Users are responsible for:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
            <li>Managing their own wallet and private keys</li>
            <li>Understanding transaction fees and blockchain operations</li>
            <li>Verifying all transactions before confirmation</li>
            <li>Understanding that blockchain transactions are irreversible</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">4. Eligibility and Age Requirements</h2>
          <p>
            You must be at least 13 years old to use this Platform. If you are under 18, you must have permission from a parent or guardian. By using Foresight, you represent that you meet these age requirements.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">5. Fantasy League Disclaimer</h2>
          <p>
            The fantasy league is for entertainment purposes only. Scores are based on publicly available social media metrics and may not reflect actual performance or endorsements. We do not guarantee the accuracy of any data.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">6. Prohibited Conduct</h2>
          <p className="mb-3">
            You agree not to:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Use the Platform for any illegal purpose or in violation of any laws</li>
            <li>Attempt to manipulate scores, rankings, or game outcomes</li>
            <li>Use bots, scripts, or automated tools to gain unfair advantages</li>
            <li>Harass, abuse, or harm other users</li>
            <li>Attempt to hack, exploit, or disrupt the Platform or smart contracts</li>
            <li>Create multiple accounts to circumvent restrictions</li>
            <li>Infringe on intellectual property rights</li>
            <li>Impersonate others or misrepresent your affiliation</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">7. Account Termination</h2>
          <p>
            We reserve the right to suspend or terminate your access to the Platform at any time, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, or for any other reason. As a decentralized platform, smart contract interactions may remain on the blockchain even after account termination.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">8. Liability Disclaimer</h2>
          <p>
            The Platform is provided "as is". Foresight makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">9. Limitations</h2>
          <p>
            In no event shall Foresight or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the Platform.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">10. Modifications</h2>
          <p>
            Foresight may revise these terms of service at any time without notice. By using this Platform you are agreeing to be bound by the then current version of these terms of service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">11. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with applicable laws. Any disputes arising from these Terms or use of the Platform shall be resolved through arbitration or in the courts of competent jurisdiction.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-3">12. Contact</h2>
          <p>
            If you have any questions about these Terms, please contact us through our Discord community.
          </p>
        </section>

        <div className="text-sm text-gray-500 border-t border-gray-700 pt-6 mt-8">
          Last updated: November 2025
        </div>
      </div>
    </LegalPageLayout>
  );
};

export default Terms;
