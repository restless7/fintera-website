# Fintera — Administración de usuarios y RBAC

Estado: implementación local verificada con límites explícitos. La aplicación de la migración alojada, el despliegue y la aceptación humana del módulo se registran por separado; este informe no los acredita.

El módulo `/admin/crm/users` incorpora Usuarios, Roles y permisos, Equipos y Auditoría al panel existente. Su acceso requiere SUPER_ADMIN canónico. Las identidades ordinarias de registro público no reciben acceso interno automático.

## Arquitectura documental y alcance

Se revisó primero `.graphify/GRAPH_REPORT.md`; no existe un índice wiki. El grafo describe el corpus versionado del ecosistema y no constituye un inventario completo de Fintera. Las conclusiones proceden del código actual. El directorio `docs/` ya contiene los informes R1/R1B y el handoff del equipo: este único informe subordinado documenta la nueva función y conserva esos registros históricos.

El contrato compartido está en `lib/auth/access-contracts.ts`. El servidor, la resolución de identidad, los permisos, la auditoría, el esquema y la navegación pertenecen a la implementación del arquitecto; `components/admin/users/*` contiene la interfaz. Las operaciones usan `/api/admin/access`; no se escriben perfiles de Clerk desde la interfaz.

## Comportamiento implementado

Usuarios consulta cuentas reales con búsqueda, rol, estado y paginación. Habilitar acceso exige buscar un correo exacto y comprobar su identidad principal verificada mediante el servidor. Si no existe, se ofrece la ruta pública `/sign-up` y su enlace copiable; no se crea una identidad, se invita por correo ni se concede acceso al registrarse.

El rol, la activación y las membresías se revisan juntos y se guardan con motivo obligatorio y revisión esperada. La pantalla confirma los cambios de privilegios antes del POST. Las cuentas CLIENT están incluidas en el ciclo de vida, carecen de equipos internos y no obtienen navegación administrativa ni vínculo automático con Customer. El propio rol/estado y los de la última cuenta activa SUPER_ADMIN aparecen protegidos; el servidor sigue siendo la autoridad de esas guardas.

Roles y permisos muestra el catálogo efectivo devuelto por el servidor para los ocho roles actuales. Cinco políticas de personal son editables y persistentes. SUPER_ADMIN, CLIENT y AUDITOR permanecen protegidos. La vista presenta los permisos y sus restricciones; los equipos, las asignaciones, el alcance ABAC y las condiciones de cada operación siguen aplicando. Cambiar una política no elimina las condiciones de los flujos de negocio.

Equipos permite crear o editar nombre y descripción con motivo. Sus integrantes y la marca de responsabilidad se administran desde cada usuario. No se presenta un estado activo/inactivo inexistente ni se reasignan expedientes. Auditoría presenta los movimientos reales devueltos por el registro, su motivo y referencia. Los eventos de webhook indican su origen en Clerk para no atribuirlos como acciones humanas.

## Conflictos y continuidad

Las operaciones envían `expectedRevision`; un conflicto exige descartar el formulario y actualizar el estado, sin replay automático. Un resultado de red ambiguo bloquea nuevas mutaciones hasta consultar el estado real. Un ACK de guardado seguido de fallo de lectura se muestra como cambio confirmado pendiente de actualización, para evitar duplicarlo.

Los formularios conservan borradores y el estado pendiente dentro de la memoria del shell autenticado durante navegación interna. No se persisten identidades ni formularios en almacenamiento del navegador. Los diálogos tienen título, descripción, gestión de foco, confirmación de descarte y cierre bloqueado mientras la petición sigue pendiente.

## Verificación actual

La comprobación final de TypeScript completo, `lint:admin` con cero advertencias y el lint estricto de los nuevos límites API/hooks pasó. El build real de Next terminó con código 0, registró la ruta nueva y produjo `BUILD_ID=x26Vlv9C4h_YczqHz191C`. El recibo vincula 214 archivos de fuente al agregado SHA256 `b224a78db30507fa95be3f6f32f6ee2d6c6155ff6a0a41227efce75a67b7501d`, sin deriva; 20 archivos generados permanecieron intactos.

QA ejecutó los handlers y servicios reales con PostgreSQL aislado. Clerk se sustituyó únicamente en el límite externo de identidad del harness; no se usaron sesiones humanas ni datos alojados.

| Comprobación local | Resultado |
| --- | --- |
| Seguridad del módulo y casos adicionales | 35 grupos PASS |
| Resolución canónica de identidad y fallo de infraestructura | 15 grupos PASS |
| Guardas de página y navegación por rol | 12 grupos PASS |
| Regresión de handlers CRM anteriores | 6 grupos PASS |
| Migración aditiva sobre fixture previo de ocho migraciones | PASS; nueve migraciones finalizadas; 40 tablas previas y 31 solicitudes sintéticas preservadas |
| Cuatro pestañas a 375, 768 y 1440 px | 12 vistas; cero errores JavaScript, hallazgos axe o desbordamiento |

La revisión funcional verificó borradores al retroceder/avanzar, estado pendiente sin POST duplicado, foco y retorno de los diálogos, protección propia, bloqueo ante error 503 y recuperación de conflictos de equipos. Las capturas muestran explícitamente el contexto local sintético. Axe empleó `wcag2a`, `wcag2aa`, `wcag21aa` y `wcag22aa`; esto no certifica cumplimiento WCAG completo.

QA demostró un desbordamiento a 1440 px causado por etiquetas accesibles fuera del bloque de posición de la matriz. La corrección mínima establece un contenedor relativo y la matriz final confirmó ausencia de desbordamiento. El build anterior `-au1FkwPZ6V-CCRwTMb70` quedó sustituido por el candidato final indicado arriba. Los primeros fallos de selectores/fixtures y la evidencia previa a esa corrección se conservaron.

Los recibos externos de este ciclo se agrupan en `control/access-administration-20261029`: `build-receipt.json`, `qa/security-results.json`, `qa/supplemental-results.json`, `qa/canonical-state-fixtures-results.json`, `qa/canonical-state-db-error-results.json`, `qa/page-gate-results.json`, `qa/security-handler-access-regression.json`, `qa/migration-preservation-results.json` y `qa/browser-results.json`. Contienen el alcance y las vinculaciones de fuente; no forman un requisito de acceso privado para compilar el repositorio.

La interfaz no ejecuta cambios de proveedor ni crea identidades. La aplicación alojada de la migración aditiva, la publicación y el despliegue requieren sus recibos separados del control de ejecución; se mantienen fuera de este registro local congelado. La aceptación humana del módulo nuevo sigue pendiente en este corte. No se acredita producción lista ni recorridos funcionales de los cinco perfiles a partir de las pruebas locales.

Las APIs de Mission Control, memoria vectorial y telemetría exacta no están disponibles en esta sesión. El seguimiento usa una bitácora atómica local. Tokens de entrada/salida y coste: `null`.
