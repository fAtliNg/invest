import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { Box, TextField, InputAdornment, SvgIcon } from '@mui/material';
import { Search as SearchIcon } from '../../icons/search';
import { DashboardLayout } from '../../components/dashboard-layout';
import { QuotesList } from '../../components/quotes-list';

const SEO_CONFIG = {
  share: {
    title: 'Котировки акций Московской биржи (MOEX) онлайн',
    description: 'Котировки акций российских компаний на Московской бирже (MOEX) в реальном времени. Цены, графики и динамика торгов.'
  },
  bond: {
    title: 'Котировки облигаций и ОФЗ Московской биржи онлайн',
    description: 'Облигации федерального займа (ОФЗ), корпоративные и муниципальные облигации. Доходность, цены и купоны онлайн.'
  },
  fund: {
    title: 'Котировки фондов (БПИФ, ETF) на Московской бирже',
    description: 'Биржевые паевые инвестиционные фонды (БПИФ) и ETF на Московской бирже. Котировки и динамика стоимости паев.'
  },
  currency: {
    title: 'Курсы валют на Московской бирже онлайн',
    description: 'Курсы валют на Московской бирже онлайн. Доллар, Евро, Юань и другие валютные пары в реальном времени.'
  },
  future: {
    title: 'Котировки фьючерсов на срочном рынке MOEX',
    description: 'Фьючерсы и опционы на срочном рынке Московской биржи. Котировки, ГО и даты экспирации онлайн.'
  }
};

const QuotesTypePage = ({ type }) => {
  const router = useRouter();
  // Fallback to router query if prop is missing (though getStaticProps should provide it)
  const currentType = type || router.query.type;
  
  const seo = SEO_CONFIG[currentType] || {
    title: 'Котировки финансовых инструментов | Profit Case',
    description: 'Котировки акций, облигаций, валют и фьючерсов на Московской бирже в реальном времени.'
  };

  const title = `${seo.title} | Profit Case`;
  
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const controls = (
    <Box sx={{ flexGrow: 1, ml: 2, display: { xs: 'block', md: 'none' } }}>
      <TextField
        fullWidth
        size="small"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SvgIcon
                color="action"
                fontSize="small"
              >
                <SearchIcon />
              </SvgIcon>
            </InputAdornment>
          ),
          style: { backgroundColor: 'background.paper' } 
        }}
        onChange={handleSearchChange}
        placeholder="Поиск по названию или тикеру"
        variant="outlined"
        value={searchQuery}
      />
    </Box>
  );

  return (
    <DashboardLayout controls={controls}>
      <Head>
        <title>{title}</title>
        <meta name="description" content={seo.description} />
      </Head>
      <QuotesList 
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
      />
    </DashboardLayout>
  );
};

export async function getStaticPaths() {
  const paths = Object.keys(SEO_CONFIG).map((type) => ({
    params: { type },
  }));

  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  return {
    props: {
      type: params.type,
    },
  };
}

export default QuotesTypePage;
