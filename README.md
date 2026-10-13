# TOKO ERP

Sistema ERP con punto de venta (POS) offline-first. Frontend en React + Vite (datos locales con Dexie) y backend en Spring Boot + PostgreSQL para la sincronización.

## Frontend

```bash
npm install
npm run dev
```

## Backend

Variables de entorno:

- `DB_PASSWORD` (obligatoria)
- `DB_USER` (por defecto `postgres`)
- `DB_URL` (por defecto `jdbc:postgresql://localhost:5432/toko_erp`)

```bash
cd backend
mvn spring-boot:run
```

El backend escucha en el puerto 8080 (`SERVER_PORT` para cambiarlo).
