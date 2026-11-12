import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Al cambiar de página, vuelve al inicio (el catálogo solo cambia la búsqueda, no el path).
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
