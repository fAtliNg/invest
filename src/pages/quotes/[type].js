import Head from 'next/head';
import { useRouter } from 'next/router';
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

  return (
    <DashboardLayout>
      <Head>
        <title>{title}</title>
      </Head>
      <QuotesList />
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
