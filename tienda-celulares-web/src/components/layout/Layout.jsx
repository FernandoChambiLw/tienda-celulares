import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Spinner from '../ui/Spinner';
import CompareBar from './CompareBar';
import Footer from './Footer';
import Header from './Header';
import ScrollToTop from './ScrollToTop';
import WhatsAppFab from './WhatsAppFab';
import styles from './Layout.module.css';

export default function Layout() {
  return (
    <div className={styles.shell}>
      <ScrollToTop />
      <Header />
      <main className={styles.main}>
        {/* Cada página se descarga recién cuando se visita (ver App.jsx). */}
        <Suspense fallback={<Spinner />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <CompareBar />
      <WhatsAppFab />
    </div>
  );
}
