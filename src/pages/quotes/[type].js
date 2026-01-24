import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { Box, TextField, InputAdornment, SvgIcon } from '@mui/material';
import { Search as SearchIcon } from '../../icons/search';
import { DashboardLayout } from '../../components/dashboard-layout';
import { QuotesList } from '../../components/quotes-list';

const TITLES = {
  share: 'Акции',
  bond: 'Облигации',
  fund: 'Фонды',
  currency: 'Валюта',
  future: 'Фьючерсы'
};

const QuotesTypePage = ({ type }) => {
  const router = useRouter();
  // Fallback to router query if prop is missing (though getStaticProps should provide it)
  const currentType = type || router.query.type;
  const title = TITLES[currentType] ? `${TITLES[currentType]} | Profit Case` : 'Котировки | Profit Case';
  
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
      </Head>
      <QuotesList 
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
      />
    </DashboardLayout>
  );
};

export async function getStaticPaths() {
  const paths = Object.keys(TITLES).map((type) => ({
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
