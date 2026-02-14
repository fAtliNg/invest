export default function CustomersRedirect() {
  return null;
}

export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/',
      permanent: true
    }
  };
}
