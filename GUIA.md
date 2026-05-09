# 🏠 House App — Guía del proyecto

## Cómo encender el proyecto

1. Abrí una terminal (CMD o PowerShell)
2. Entrá a la carpeta del proyecto:
   ```
   cd C:\Users\VICTUS\Desktop\House\house-app
   ```
3. Arrancá el servidor:
   ```
   npm run dev
   ```
4. Abrí el navegador en: `http://localhost:3000`

> Para apagar el servidor: presioná `Ctrl + C` en la terminal.

---

## Lo que ya está hecho

- Login y registro de usuarios
- Dashboard principal con las 4 secciones
- **Tareas** — agregar, completar, historial de pendientes/completadas
- **Compras** — lista con precio estimado, total por comprar y total gastado
- **Gastos** — registro con categorías (comida, transporte, limpieza, etc.), desglose y filtros
- **Recordatorios** — agregar con fecha y hora, separa próximos e historial

---

## Mejoras pendientes / ideas futuras

> Agregá acá tus ideas y yo las implemento cuando retomemos

- [ ] Recordatorios: agregar tipo (limpieza, pago, salud...) y alerta visual cuando hay algo para hoy
- [ ] Recordatorios recurrentes (ej: limpiar el baño cada semana)
- [ ] Ver quién registró cada gasto o tarea (nombre del usuario)
- [ ] Dashboard con resumen: cuántas tareas pendientes, próximo recordatorio, total de gastos del mes
- [ ] Subir fotos a los gastos (facturas/recibos)
- [ ] Modo oscuro / claro
- [ ] Versión mobile optimizada (PWA)
- [ ] Notificaciones push para recordatorios
- [x] ~~(agregar más ideas acá)~~

---

## Stack técnico

| Tecnología | Para qué se usa |
|---|---|
| Next.js | Frontend + rutas + lógica del servidor |
| Supabase | Base de datos, autenticación, almacenamiento |
| Tailwind CSS | Diseño y estilos |
| Vercel | Deploy en la nube (cuando estemos listos) |

---

## Credenciales y configuración

Las credenciales de Supabase están en el archivo `.env.local` (no se sube a internet).

Si perdés ese archivo, los valores están en:
**supabase.com → tu proyecto → Settings → API**
