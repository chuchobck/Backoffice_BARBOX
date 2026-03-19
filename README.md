# 🍷 BARBOX — Backoffice Administrativo

> **Calificación del proyecto: 100/100** — Panel de administración completo con 14 módulos de gestión, dashboard en tiempo real y diseño premium.

**BARBOX Backoffice** es el centro de control administrativo del ecosistema BARBOX. Permite gestionar todo el negocio de licorería desde una interfaz elegante y responsive: productos, ventas, compras, inventario, promociones, clientes, empleados y más.

---

## 🏆 Highlights del Proyecto

| Métrica | Valor |
|---|---|
| **Módulos de Gestión** | 14 páginas completas con CRUD |
| **Dashboard** | KPIs en tiempo real con gráficos interactivos |
| **Formularios** | Validación con Zod + React Hook Form |
| **Server State** | TanStack React Query (cache, refetch, optimistic updates) |
| **UI/UX** | Diseño premium con paleta de vinos y tipografía editorial |
| **Deploy** | Producción en Vercel |

---

## 🛠️ Stack Tecnológico

| Tecnología | Uso |
|---|---|
| **React 18** | Biblioteca de UI |
| **Vite 5** | Build tool ultrarrápido |
| **React Router DOM 6** | Enrutamiento SPA |
| **TanStack React Query 5** | Server state management (cache, refetch, mutations) |
| **React Hook Form 7** | Formularios performantes |
| **Zod 3** | Validación de esquemas TypeScript-first |
| **Axios** | HTTP client con interceptores JWT y redirect 401 |
| **Tailwind CSS 3.4** | Utility-first CSS con tema custom BARBOX |
| **Recharts** | Gráficos interactivos para dashboard |
| **Lucide React** | Iconografía moderna |
| **date-fns 3** | Manejo de fechas |

---

## 🎨 Diseño Premium

| Elemento | Detalle |
|---|---|
| **Paleta** | `barbox-wine` (vino tinto), `barbox-terracotta` (terracota), `barbox-cream` (crema) |
| **Tipografía** | Playfair Display (títulos) + Montserrat (cuerpo) |
| **Layout** | Sidebar colapsable responsive + Navbar con notificaciones |
| **Menú** | 7 secciones agrupadas: General, Ventas, Inventario, Compras, Marketing, Configuración, Administración |

---

## 📊 Dashboard — Panel Principal

El dashboard ofrece una vista ejecutiva del negocio en tiempo real:

- **KPIs con gradientes** — Ventas del mes, total de productos, clientes activos, compras pendientes
- **Alertas de stock bajo** — Productos que necesitan reposición
- **Valor total del inventario** — Cálculo en tiempo real
- **Últimas facturas** — Actividad reciente con estados
- **Top productos** — Los más vendidos del periodo

---

## 📋 14 Módulos de Gestión

| Módulo | Funcionalidades |
|---|---|
| **📊 Dashboard** | KPIs, alertas, gráficos, actividad reciente |
| **📦 Productos** | CRUD completo, búsqueda avanzada, filtros (categoría/marca/estado/precio/stock), exportar CSV, cambio de estado, modal detalle/edición |
| **🧾 Facturas** | Listado, búsqueda multi-criterio, filtros (estado/fecha/monto), detalle modal, anulación con motivo |
| **👥 Clientes** | CRUD, búsqueda, historial de facturas por cliente |
| **🛒 Compras** | Creación con múltiples líneas de detalle, selección de proveedores, aprobación |
| **📥 Recepciones** | Recepción de mercadería en bodega, comparación cantidad solicitada vs. recibida |
| **🏷️ Promociones** | Gestión con productos asociados, categorías de promoción |
| **🏢 Proveedores** | CRUD completo con datos de contacto |
| **🏷️ Marcas** | CRUD con logo/imagen, cambio de estado |
| **📂 Categorías** | CRUD de categorías de productos |
| **💲 IVA** | Gestión de periodos fiscales con vigente activo |
| **💳 Métodos de Pago** | CRUD con disponibilidad por canal (POS/WEB) |
| **🌆 Ciudades** | CRUD de ciudades para clientes y proveedores |
| **👔 Empleados** | CRUD con asignación de roles (ADMIN/CAJERO) |

---

## 🏗️ Arquitectura

```
src/
├── components/
│   ├── Layout.jsx           # Sidebar colapsable + Navbar + 7 secciones de menú
│   └── ProtectedRoute.jsx   # Guard de autenticación
├── context/
│   └── AuthContext.jsx       # Login JWT, persistencia localStorage, logout en 401
├── lib/
│   └── axios.js             # Interceptores: token auth, redirect 401, validación IDs
├── pages/
│   ├── Dashboard.jsx        # KPIs, gráficos, alertas
│   ├── Productos.jsx        # CRUD + búsqueda + filtros + CSV
│   ├── Facturas.jsx         # Listado + detalle + anulación
│   ├── Clientes.jsx         # CRUD + historial
│   ├── Compras.jsx          # Órdenes de compra
│   ├── Recepciones.jsx      # Recepción de bodega
│   ├── Promociones.jsx      # Gestión de promociones
│   ├── Proveedores.jsx      # CRUD proveedores
│   ├── Marcas.jsx           # CRUD marcas
│   ├── Categorias.jsx       # CRUD categorías
│   ├── IVA.jsx              # Periodos fiscales
│   ├── MetodosPago.jsx      # Métodos de pago
│   ├── Ciudades.jsx         # CRUD ciudades
│   ├── Empleados.jsx        # CRUD empleados
│   └── Login.jsx            # Pantalla de autenticación
└── services/
    └── api.js               # 13 servicios con métodos CRUD estandarizados
```

---

## 🔐 Autenticación y Seguridad

- **JWT** — Token persistido en localStorage
- **Interceptores Axios** — Inyección automática del token en cada request
- **Redirect 401** — Logout automático al expirar sesión
- **ProtectedRoute** — Guarda de rutas que requieren autenticación
- **Validación de IDs** — Prevención de manipulación de URLs

---

## 🌐 Parte del Ecosistema BARBOX

Este backoffice se conecta al **Backend API** centralizado que también sirve al POS y E-commerce:

```
                    ┌───────────────────────┐
                    │   📊 BACKOFFICE       │  ◄── Estás aquí
                    │   React 18 + Vite     │
                    │   14 módulos CRUD     │
                    └───────────┬───────────┘
                                │
┌──────────────┐    ┌───────────▼───────────┐    ┌──────────────┐
│ 🛒 E-commerce│───▶│    🍷 BARBOX API      │◀───│ 🖥️ POS       │
│ React 19     │    │    Node.js + Express  │    │ React 18     │
└──────────────┘    └───────────────────────┘    └──────────────┘
```

---

## 🔗 Repositorios del Ecosistema BARBOX

| Proyecto | Repositorio | Descripción |
|---|---|---|
| **Backend API** | [backend_BARBOX](https://github.com/chuchobck/backend_BARBOX) | API REST centralizada |
| **Backoffice** | [Backoffice_BARBOX](https://github.com/chuchobck/Backoffice_BARBOX) | Panel administrativo |
| **Punto de Venta** | [POS_BARBOX](https://github.com/chuchobck/POS_BARBOX) | Terminal POS para cajeros |

---

<p align="center">
  Desarrollado como proyecto académico con calificación perfecta <strong>100/100</strong> 🏆
</p>
