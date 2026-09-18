# TOKO ERP — Backend Spring Boot

API REST offline-first para el sistema de punto de venta TOKO ERP.
Procesa la cola Outbox de ventas generadas localmente por el frontend React/Dexie.js.

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Spring Boot 3.3 |
| Lenguaje | Java 21 |
| ORM | Spring Data JPA / Hibernate |
| Base de datos | PostgreSQL 15+ |
| Build | Maven |
| Utilidades | Lombok |

## Configuración rápida

```bash
# 1. Crear la base de datos en PostgreSQL
createdb toko_erp_db
psql toko_erp_db -c "CREATE USER toko_user WITH PASSWORD 'toko_password';"
psql toko_erp_db -c "GRANT ALL PRIVILEGES ON DATABASE toko_erp_db TO toko_user;"

# 2. Configurar conexión (editar src/main/resources/application.yml)
#    Ajustar: spring.datasource.url / username / password

# 3. Compilar y ejecutar
mvn clean package -DskipTests
java -jar target/toko-erp-backend-0.0.1-SNAPSHOT.jar
```

El servidor arranca en http://localhost:8080.
Hibernate crea las tablas automáticamente en el primer arranque (`ddl-auto: update`).

---

## Endpoint Principal

### `POST /api/v1/sync/push`

Recibe el lote de ventas offline y aplica la regla de Backorder.

#### Ejemplo con curl

```bash
curl -X POST http://localhost:8080/api/v1/sync/push \
  -H "Content-Type: application/json" \
  -d '{
    "ventas": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "numeroTicket": "T0001-000123",
        "fechaHora": "2024-03-15T10:30:00-03:00",
        "tipoOperacion": "POS_MOSTRADOR",
        "cliente": {
          "id": "00000000-0000-0000-0000-000000000001",
          "codigo": "CLI-0001",
          "nombre": "Consumidor Final Mostrador",
          "documento": "00-00000000-0",
          "tipo": "CONSUMIDOR_FINAL"
        },
        "items": [
          {
            "id": "aaaaaaaa-0000-0000-0000-000000000001",
            "productoId": "00000000-0000-0000-0000-000000000002",
            "productoNombre": "Coca Cola 2.25L",
            "cantidad": 3,
            "precioUnitario": 3100.00,
            "subtotal": 9300.00
          }
        ],
        "subtotal": 9300.00,
        "descuentoPorcentaje": 0.00,
        "total": 9300.00,
        "metodoPago": "EFECTIVO",
        "vendedor": "Juan Pérez"
      }
    ]
  }'
```

#### Respuesta posible — Aceptada normalmente

```json
{
  "procesadas": 1,
  "resultados": [
    {
      "ventaId": "550e8400-e29b-41d4-a716-446655440000",
      "estadoResultado": "ACCEPTED",
      "mensaje": "Venta procesada y stock descontado correctamente.",
      "productosConBackorder": null
    }
  ]
}
```

#### Respuesta posible — Backorder (stock insuficiente)

```json
{
  "procesadas": 1,
  "resultados": [
    {
      "ventaId": "550e8400-e29b-41d4-a716-446655440000",
      "estadoResultado": "ACCEPTED_WITH_BACKORDER",
      "mensaje": "Venta registrada con BACKORDER. 1 producto(s) quedaron con stock negativo. Se requiere reposición urgente.",
      "productosConBackorder": ["00000000-0000-0000-0000-000000000002"]
    }
  ]
}
```

### `GET /api/v1/sync/health`

Verificación de disponibilidad. El frontend lo consulta antes del push.

```bash
curl http://localhost:8080/api/v1/sync/health
# → TOKO ERP Sync API operativa. Lista para recibir ventas offline.
```

---

## Regla de Backorder

```
Para cada ítem de la venta:
  stockResultante = stockActual - cantidad

  Si stockResultante < 0:
    → Se DESCUENTA de todas formas (stock queda en negativo)
    → La venta es marcada como ACCEPTED_WITH_BACKORDER
    → El campo productosConBackorder lista los UUIDs afectados
    → El frontend alerta al encargado de reposición

Esta decisión prioriza la continuidad operativa del vendedor en campo
por encima de la exactitud inmediata del inventario.
```

## Modelo relacional

```
productos          clientes
─────────          ────────
id (uuid) PK       id (uuid) PK
codigoBarra        codigo (unique)
nombre             nombre
categoria          documento
precioMostrador    tipo
precioMayorista    listaPrecioPorDefecto
stockActual *      saldoCuentaCorriente
stockMinimo        limiteCredito
unidadMedida

* puede ser negativo (Backorder)

ventas                        venta_items
──────                        ───────────
id (uuid) PK                  id (uuid) PK
numeroTicket (unique)         venta_id (uuid) FK
fechaHora                     producto_id (uuid) FK
tipoOperacion                 cantidad
cliente_id FK → clientes      precioUnitario
subtotal                      subtotal
descuentoPorcentaje
total
metodoPago
vendedor
estadoSync
```
