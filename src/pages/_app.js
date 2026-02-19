import Head from 'next/head';
import { CacheProvider } from '@emotion/react';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { createEmotionCache } from '../utils/create-emotion-cache';
import { theme } from '../theme';
import TagManager from 'react-gtm-module';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

const tagManagerArgs = {
  gtmId: 'GTM-KSWNJ4R',
};

const clientSideEmotionCache = createEmotionCache();

const App = (props) => {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;
  const router = useRouter();
  
  // Logic to generate canonical URL
  const domain = process.env.NEXT_PUBLIC_IS_DEV === 'true' ? 'https://profit-case-dev.ru' : 'https://profit-case.ru';
  const canonicalUrl = `${domain}${router.asPath === '/' ? '' : router.asPath.split('?')[0]}`;
  const isDev = process.env.NEXT_PUBLIC_IS_DEV === 'true';
  const is404 = router.pathname === '/404';

  useEffect(() => {
    const isDevEnv = process.env.NEXT_PUBLIC_IS_DEV === 'true';
    if (process.env.NODE_ENV === 'production' && !isDevEnv) {
      TagManager.initialize(tagManagerArgs);
    }
  }, []);

  useEffect(() => {
    // Only fix legacy hash routing or similar if needed, avoiding loops
  }, []);

  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <title>
          Profit Case
        </title>
        <meta
          name="viewport"
          content="initial-scale=1, width=device-width"
        />
        {isDev && <meta name="robots" content="noindex, nofollow" />}
        {!is404 && <link rel="canonical" href={canonicalUrl} />}
      </Head>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {getLayout(<Component {...pageProps} />)}
        </ThemeProvider>
      </LocalizationProvider>
    </CacheProvider>
  );
};

export default App;
