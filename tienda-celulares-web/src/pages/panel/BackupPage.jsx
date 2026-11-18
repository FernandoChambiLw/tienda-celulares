import { useState } from 'react';
import { backupApi } from '../../api/panel/panelApi';
import PageHeader from '../../components/ui/PageHeader';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function BackupPage() {
  usePageTitle('Respaldo');
  const [state, setState] = useState({ busy: false, error: '', done: null });

  const download = async () => {
    setState({ busy: true, error: '', done: null });
    try {
      const data = await backupApi.download();
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `respaldo-fx-${data.fecha.slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      const filas = Object.values(data.tablas).reduce((n, t) => n + t.length, 0);
      setState({ busy: false, error: '', done: `${Object.keys(data.tablas).length} tablas y ${filas} registros` });
    } catch (e) {
      setState({ busy: false, error: e.message, done: null });
    }
  };

  return (
    <>
      <PageHeader title="Respaldo de datos" subtitle="Una copia completa de tu negocio: productos, stock, ventas, clientes, cajas, cuentas por cobrar y fotos." />
      <div className="box">
        <button type="button" className={`button is-primary is-medium is-rounded ${state.busy ? 'is-loading' : ''}`} onClick={download} disabled={state.busy}>
          Descargar respaldo
        </button>
        {state.done && <p className="notification is-success is-light mt-4" role="status">Listo: se descargó el respaldo ({state.done}). Guárdalo en un lugar seguro, por ejemplo tu correo o Google Drive.</p>}
        {state.error && <p className="notification is-danger is-light mt-4" role="alert">{state.error}</p>}
      </div>
      <div className="content">
        <h2 className="title is-5">Buenas costumbres</h2>
        <ul>
          <li>Descarga un respaldo <strong>al cerrar el día</strong> o, como mínimo, una vez por semana. El resumen te avisa si pasan 7 días.</li>
          <li>Guarda los archivos <strong>fuera del sistema</strong> (correo, Drive, un USB): un respaldo guardado solo aquí no sirve si la base se pierde.</li>
          <li>El archivo contiene datos de tus clientes: no lo compartas.</li>
          <li>Para restaurar: <code>node scripts/restore-backup.mjs respaldo.json</code> en la carpeta <code>celulares_api</code> (reemplaza todos los datos de esa base). Ver <code>MIGRAR_A_NEON.md</code>.</li>
        </ul>
      </div>
    </>
  );
}
