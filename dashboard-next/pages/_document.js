import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="fr">
      <Head>
        <meta charSet="utf-8" />
        <meta name="description" content="Dashboard pour gérer votre bot Discord" />
        <meta name="theme-color" content="#5865F2" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Polices */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" 
          rel="stylesheet"
        />
      </Head>
      <body className="bg-white dark:bg-discord-darker-gray text-gray-900 dark:text-white">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}