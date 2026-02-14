export default function EquitiesRedirect() {
  return null;
}

export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/quotes/share',
      permanent: true
    }
  };
}
