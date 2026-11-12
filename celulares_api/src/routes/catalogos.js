import { Router } from 'express';
import { q } from '../db.js';
import { ah } from '../utils.js';

// Listas de apoyo para formularios (combos) de la web y la app. Solo lectura.
const router = Router();

const lista = (ruta, sql) =>
  router.get(ruta, ah(async (_req, res) => res.json((await q(sql)).rows)));

lista('/marcas', 'SELECT id_marca, nombre FROM marca ORDER BY nombre');
lista('/categorias', "SELECT id_categoria, nombre FROM categoria WHERE estado = 'Activo' ORDER BY nombre");
lista('/metodos-pago', "SELECT id_metodo_pago, nombre, comision FROM metodo_pago WHERE estado = 'Activo' ORDER BY id_metodo_pago");
lista('/almacenes', `SELECT a.id_almacen, a.nombre, a.id_sucursal, s.nombre AS sucursal
                       FROM almacen a JOIN sucursal s USING (id_sucursal)
                      WHERE a.estado = 'Activo' ORDER BY a.id_almacen`);
lista('/sucursales', `SELECT s.id_sucursal, s.nombre, s.direccion, c.nombre AS ciudad
                        FROM sucursal s JOIN ciudad c USING (id_ciudad)
                       WHERE s.estado = 'Activo' ORDER BY s.id_sucursal`);
lista('/ciudades', `SELECT c.id_ciudad, c.nombre, d.nombre AS departamento, p.nombre AS pais
                      FROM ciudad c JOIN departamento d USING (id_departamento) JOIN pais p USING (id_pais)
                     ORDER BY p.nombre, d.nombre, c.nombre`);
lista('/empleados', `SELECT id_empleado, nombres || ' ' || apellido_paterno AS nombre, id_cargo, id_sucursal
                       FROM empleado WHERE estado = 'Activo' ORDER BY nombres`);
lista('/tecnicos', `SELECT e.id_empleado, e.nombres || ' ' || e.apellido_paterno AS nombre
                      FROM empleado e JOIN usuario u USING (id_empleado)
                     WHERE u.rol = 'Tecnico' AND e.estado = 'Activo' ORDER BY e.nombres`);

export default router;
