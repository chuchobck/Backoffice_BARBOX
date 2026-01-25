# 🍷 BARBOX - Backoffice

Sistema administrativo para gestión de licorería.

## 🚀 Instalación

```bash
npm install
cp .env.example .env
npm run dev
```

## 📦 Producción

```bash
npm run build
```

## 🔐 Variables de Entorno

```env
VITE_API_URL=http://localhost:3000/api/v1
```

## 📁 Estructura

```
src/
├── components/    # Componentes reutilizables
├── context/       # Context API (Auth)
├── lib/           # Utilidades (Axios)
├── pages/         # Páginas/Vistas
└── services/      # APIs
```
