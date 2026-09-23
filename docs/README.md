# Compras MSI

Documentacion del proyecto y decisiones de producto para la aplicacion Android de control de compras a Meses Sin Intereses.

## Alcance

La aplicacion administra exclusivamente compras MSI. Suscripciones, gastos variables, backend, sincronizacion e iOS quedan fuera del alcance inicial.

La aplicacion proyecta compromisos MSI y deuda restante; no registra ni confirma pagos bancarios reales.

## Estructura

- `app/`: rutas y pantallas de Expo Router.
- `src/database/`: SQLite, migraciones y repositorios.
- `src/features/`: logica de dominio por funcionalidad.
- `src/components/`: componentes visuales reutilizables.
- `tests/`: pruebas de calculos y persistencia.
