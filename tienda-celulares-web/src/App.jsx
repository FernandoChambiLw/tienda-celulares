import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import RequireAuth from './auth/RequireAuth';
import Layout from './components/layout/Layout';
import PanelLayout from './components/panel/PanelLayout';
import { ROLES } from './config/panel';

// Carga diferida: el navegador descarga el código de cada página solo al visitarla.
const HomePage = lazy(() => import('./pages/HomePage'));
const CatalogPage = lazy(() => import('./pages/CatalogPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const PromotionsPage = lazy(() => import('./pages/PromotionsPage'));
const ComparePage = lazy(() => import('./pages/ComparePage'));
const RepairStatusPage = lazy(() => import('./pages/RepairStatusPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const LoginPage = lazy(() => import('./pages/panel/LoginPage'));
const DashboardPage = lazy(() => import('./pages/panel/DashboardPage'));
const SalesPage = lazy(() => import('./pages/panel/SalesPage'));
const NewSalePage = lazy(() => import('./pages/panel/NewSalePage'));
const InventoryPage = lazy(() => import('./pages/panel/InventoryPage'));
const ProductsAdminPage = lazy(() => import('./pages/panel/ProductsAdminPage'));
const ProductFormPage = lazy(() => import('./pages/panel/ProductFormPage'));
const OrdersPage = lazy(() => import('./pages/panel/OrdersPage'));
const ReceiptPage = lazy(() => import('./pages/panel/ReceiptPage'));
const CashPage = lazy(() => import('./pages/panel/CashPage'));
const AccountsPage = lazy(() => import('./pages/panel/AccountsPage'));
const ReportsPage = lazy(() => import('./pages/panel/ReportsPage'));
const RestockPage = lazy(() => import('./pages/panel/RestockPage'));
const AuditPage = lazy(() => import('./pages/panel/AuditPage'));
const RepairsPage = lazy(() => import('./pages/panel/RepairsPage'));

const { admin, seller, tech, storekeeper } = ROLES;

// Único lugar donde se declaran las rutas: la vitrina pública y el panel interno.
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="catalogo" element={<CatalogPage />} />
        <Route path="catalogo/:id" element={<ProductDetailPage />} />
        <Route path="promociones" element={<PromotionsPage />} />
        <Route path="comparar" element={<ComparePage />} />
        <Route path="carrito" element={<CartPage />} />
        <Route path="reparacion" element={<RepairStatusPage />} />
        <Route path="contacto" element={<ContactPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route path="panel/login" element={<LoginPage />} />
      <Route path="panel" element={<RequireAuth />}>
        <Route element={<PanelLayout />}>
          <Route index element={<DashboardPage />} />
          <Route element={<RequireAuth roles={[admin, seller]} />}>
            <Route path="ventas" element={<SalesPage />} />
            <Route path="ventas/nueva" element={<NewSalePage />} />
            <Route path="ventas/:id/comprobante" element={<ReceiptPage />} />
            <Route path="pedidos" element={<OrdersPage />} />
            <Route path="caja" element={<CashPage />} />
            <Route path="cobros" element={<AccountsPage />} />
          </Route>
          <Route element={<RequireAuth roles={[admin]} />}>
            <Route path="reportes" element={<ReportsPage />} />
            <Route path="bitacora" element={<AuditPage />} />
          </Route>
          <Route path="inventario" element={<InventoryPage />} />
          <Route element={<RequireAuth roles={[admin, storekeeper]} />}>
            <Route path="reposicion" element={<RestockPage />} />
            <Route path="productos" element={<ProductsAdminPage />} />
            <Route path="productos/nuevo" element={<ProductFormPage />} />
            <Route path="productos/:id" element={<ProductFormPage />} />
          </Route>
          <Route element={<RequireAuth roles={[admin, tech]} />}>
            <Route path="reparaciones" element={<RepairsPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
