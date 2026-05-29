import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Web HTML shell for Expo Router.
 * Forces light mode on the browser level so the page background is never
 * driven by the device/browser dark-mode preference.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en" style={{ colorScheme: 'light' }}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <style dangerouslySetInnerHTML={{ __html: `
          /* Lock the web shell to light — overrides prefers-color-scheme: dark */
          html, body {
            color-scheme: light;
            background-color: #F5F2ED;
            margin: 0;
            padding: 0;
          }
        `}} />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
