import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  path?: string;
}

const SITE_NAME = 'Foresight';
const BASE_URL = 'https://ct-foresight.xyz';
const DEFAULT_TITLE = 'Foresight — Back CT Calls. Get Paid.';
const DEFAULT_DESC = 'Draft top CT influencers, score their real engagement, and compete for SOL prizes on Solana. Free to play.';

export default function SEO({ title, description, keywords, path = '' }: SEOProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const desc = description || DEFAULT_DESC;
  const url = `${BASE_URL}${path}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:url" content={url} />
    </Helmet>
  );
}
