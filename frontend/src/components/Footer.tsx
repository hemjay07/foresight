import { Link } from 'react-router-dom';
import {
  DiscordLogo,
  XLogo,
  GithubLogo,
  Book,
  Globe,
} from '@phosphor-icons/react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-gray-800 pt-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="col-span-1">
            <h3 className="text-xl font-bold mb-3 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Foresight
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              The premier CT Fantasy League. Build your squad, compete, and climb the ranks.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-3">
              <a
                href="https://discord.gg/foresight"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-all hover:scale-110 hover:shadow-lg hover:shadow-cyan-500/20"
                aria-label="Join our Discord"
              >
                <DiscordLogo size={20} weight="fill" className="text-gray-300" />
              </a>
              <a
                href="https://twitter.com/ForesightCT"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-all hover:scale-110 hover:shadow-lg hover:shadow-cyan-500/20"
                aria-label="Follow us on X/Twitter"
              >
                <XLogo size={20} weight="fill" className="text-gray-300" />
              </a>
              <a
                href="https://github.com/foresight-ct"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-all hover:scale-110 hover:shadow-lg hover:shadow-cyan-500/20"
                aria-label="View on GitHub"
              >
                <GithubLogo size={20} weight="fill" className="text-gray-300" />
              </a>
              <a
                href="https://docs.foresight.ct"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-all hover:scale-110 hover:shadow-lg hover:shadow-cyan-500/20"
                aria-label="Read documentation"
              >
                <Book size={20} weight="fill" className="text-gray-300" />
              </a>
              <a
                href="https://foresight.ct"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-all hover:scale-110 hover:shadow-lg hover:shadow-cyan-500/20"
                aria-label="Visit website"
              >
                <Globe size={20} weight="fill" className="text-gray-300" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold text-white mb-3">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/league" className="text-gray-400 hover:text-cyan-400 transition-colors">
                  League
                </Link>
              </li>
              <li>
                <Link to="/compete" className="text-gray-400 hover:text-cyan-400 transition-colors">
                  Compete
                </Link>
              </li>
              <li>
                <Link to="/intel" className="text-gray-400 hover:text-cyan-400 transition-colors">
                  Intel
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-gray-400 hover:text-cyan-400 transition-colors">
                  Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-white mb-3">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://docs.foresight.ct"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-cyan-400 transition-colors"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/foresight-ct"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-cyan-400 transition-colors"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://discord.gg/foresight"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-cyan-400 transition-colors"
                >
                  Bug Bounty
                </a>
              </li>
              <li>
                <a
                  href="https://foresight.ct/blog"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-cyan-400 transition-colors"
                >
                  Blog
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-white mb-3">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/terms" className="text-gray-400 hover:text-cyan-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-400 hover:text-cyan-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="text-gray-400 hover:text-cyan-400 transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link to="/imprint" className="text-gray-400 hover:text-cyan-400 transition-colors">
                  Legal Notice / Imprint
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-6 pb-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <div>
              © {currentYear} Foresight. Built on Base • All rights reserved.
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs">Powered by</span>
              <a
                href="https://base.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
              >
                Base
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
