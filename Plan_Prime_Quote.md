# Plan Prime Quote: Participación por Porcentaje (Opción 2)

## Objetivo
Permitir a los usuarios crear cotizaciones donde el pago no sea un monto fijo ("projectPrice"), sino un porcentaje de participación ("revenue share") sobre las ganancias/utilidades del proyecto.

## Modificaciones Base de Datos (`prisma/schema.prisma`)
Al modelo `Quote` se le agregarán los siguientes campos:
- `quoteType String @default("FIXED")`: Para definir el tipo de cobro ('FIXED' | 'PERCENTAGE').
- `percentageValue Float?`: Para guardar el valor porcentual (ej. 25 para 25%).

Se requerirá ejecutar `npx prisma generate` y `npx prisma db push`.

## Modificaciones Backend (API)
- `src/app/api/quotes/route.ts`: Actualizar el método `POST` y/o `PUT` para aceptar `quoteType` y `percentageValue`.

## Modificaciones Frontend (Administrador)
- `src/app/admin/nueva/page.tsx`:
  - Agregar un selector o toggle para elegir entre "Cobro Fijo" y "Cobro por Porcentaje".
  - Si es "Cobro Fijo", mostrar el input de "projectPrice".
  - Si es "Cobro por Porcentaje", ocultar "projectPrice" y mostrar un input para ingresar el porcentaje (`percentageValue`).

## Modificaciones Frontend (Cliente - Vista de Cotización)
- `src/app/cotizacion/[token]/page.tsx`:
  - Si la cotización es de tipo `PERCENTAGE`, en el área donde se muestra el precio o el total de la cotización, reemplazar el formato de moneda ($) por un texto grande y profesional como:
    **"Condiciones de pago: XX% de participación sobre las ganancias del proyecto."**
  - Opcional: Ocultar columnas de precio unitario o totales si existieran en tablas de entregables (según el rediseño).

## Notas
Esto da una imagen profesional al crear un contrato de partnership y se adapta para tratos como socio, no como proveedor/empleado normal.
