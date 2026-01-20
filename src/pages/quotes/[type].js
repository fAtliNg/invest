import { useRouter } from 'next/router';
import { DashboardLayout } from '../../components/dashboard-layout';
import { QuotesList } from '../../components/quotes-list';

const TABS = ['share', 'bond', 'fund', 'currency', 'future'];

const QuotesTypePage = () => {
  return (
    <DashboardLayout>
      <QuotesList />
    </DashboardLayout>
  );
};

export default QuotesTypePage;
