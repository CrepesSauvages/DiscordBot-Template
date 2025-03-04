import '../styles/globals.css';
import { Layout } from '../components/layout/Layout';
import { withAuth } from '../lib/withAuth';

function MyApp({ Component, pageProps }) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

// Appliquer le HOC withAuth à l'application entière
export default withAuth(MyApp);