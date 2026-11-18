# FINTERA — Operación comercial e ingresos de vivienda R1

**LOCAL_GO_WITH_DISCLOSED_LIMITS — implementación y verificación local aprobadas. Migración alojada, runtime comercial, publicación y aceptación humana pendientes al corte.** Este informe es subordinado a [FINTERA_ARCHITECTURE_AND_CONTENT_OS.md](FINTERA_ARCHITECTURE_AND_CONTENT_OS.md). Conserva el cierre histórico del portal del cliente y no sustituye la arquitectura canónica.

## Problema y alcance autorizado

La captación pública previa mezclaba ejemplos con un archivo local y podía devolver éxito sin persistencia duradera. El resumen público y el seguimiento devolvían datos de prospectos; la interfaz mostraba avances y proyecciones que no acreditaban un caso o una comisión real. Se reemplaza esa frontera por captación persistente, recibo mínimo y gestión comercial autenticada.

El propietario confirmó que ya existen convenios activos y que bancos **y aliados pagan ingresos a FINTERA**. Los términos y soportes concretos deben registrarse expresamente: no se inventan tasas, contratos, desembolsos, recaudos, clientes o resultados comerciales.

Los cuatro entregables son captación confiable; manejo comercial y revisión histórica; entrega bancaria/cierre/desembolso acreditados; y convenios, cartera, movimientos y medición real. La interfaz conserva el shell actual y sus permisos. El servidor mantiene la autoridad del rol, alcance, revisión y hecho bancario.

## Comportamiento implementado

- `/aliados` y la calculadora de factoring usan el contrato estricto de captura. La autorización de tratamiento es explícita; un resultado incierto bloquea los datos y permite sólo reintentar el mismo cuerpo y UUID. Éxito exige el recibo del servidor. La simulación permanece ilustrativa y sus supuestos no alimentan registros financieros ni certifican eventos RADIAN.
- El seguimiento público comienza vacío y muestra sólo recepción. No presenta nombres, contacto, avances financieros ni un resumen global. Los datos de formulario y comandos no se guardan en localStorage o sessionStorage.
- `/admin/crm/commercial` muestra captaciones paginadas, responsables, equipos, próxima acción y contactos efectuados. La revisión histórica queda reservada al alcance autorizado. Vincular exige un expediente canónico existente y contacto verificado; no modifica ni importa automáticamente la fila histórica.
- El expediente incorpora seguimiento y cierre: entrega al banco con referencia y soporte, condiciones con resolución documentada y desembolso real. Una corrección conserva el registro anterior. Aprobación, importe solicitado y simulación no sustituyen un desembolso.
- `/admin/crm/finance` registra convenios versionados cuyo pagador es BANK o ALLY y beneficiario FINTERA. Porcentaje sólo sobre desembolso real; radicación admite importe fijo. No hay tarifa predeterminada. El servidor reconoce la cuenta por cobrar desde el convenio y el hecho acreditado.
- Recaudos parciales, ajustes y costos conservan soporte, fecha, motivo y revisión. «Reversar registro» vincula un importe positivo al recaudo/costo original y su saldo reversible; añade historia y no ejecuta un reembolso ni transferencia bancaria. Costos ausentes y contribución permanecen desconocidos; un costo cero requiere registro y evidencia explícitos.
- Los importes se transportan como cadenas decimales y se presentan sin conversión binaria que pierda centavos. Los formularios administrativos conservan el intento pendiente en memoria del shell autenticado; conflictos de revisión requieren nueva consulta y no se reproducen automáticamente.
- Los hitos por expediente usan unidades canónicas únicas; las tarjetas bancarias conservan subcasos bancarios explícitos. Son observaciones del alcance y no una cohorte ni un embudo necesariamente monótono; no se rellenan hitos históricos ausentes.
- Analítica consume servicios autenticados y todo el alcance autorizado, con denominadores y muestras observadas. Origen declarado es atribución de múltiples contactos **no aditiva**: el mismo caso puede aparecer en varios canales. No equivale a atribución financiera reconciliada o ROI demostrado.
- Una comunicación se prepara como vista previa del destinatario y contenido exactos. Aprobarla es una acción expresa, restringida y con huella/revisión. Cola, ACK del proveedor y entrega son estados distintos. No se ha autorizado ni ejecutado contacto externo desde este trabajo.

## Primer uso y entradas

1. Captar desde `/aliados` o `/simulador` y conservar el recibo devuelto tras persistencia. El recibo no contiene una decisión crediticia.
2. Abrir `/admin/crm/commercial`, revisar la captación o solicitud histórica, asignar responsable/equipo y documentar el contacto y la próxima acción. Si faltan los datos canónicos completos, usar `/credit-request`; después verificar la correspondencia antes de vincular el expediente existente.
3. En `/admin/crm/applications/[id]`, mantener el flujo bancario y registrar sus entregas, condiciones y desembolso únicamente con soporte real.
4. En `/admin/crm/finance`, registrar el convenio real de ingreso, reconocer el derecho de cobro desde el hecho acreditado y conciliar los recaudos/costos/ajustes. Revisar `/admin/crm/bi` para observaciones por alcance/origen/banco y tipo de pagador, con sus muestras y desconocidos.

La cartera es un registro operativo con evidencias; no ejecuta transferencias ni certifica conciliación bancaria, declaración tributaria o utilidad fiscal. El envío de comunicaciones externas está deshabilitado por defecto y no se activa mediante este informe.

La preparación de mensajes exige correo principal actual verificado en Clerk, procedencia de contacto validada, consentimiento vigente `COMMERCIAL_CONTACT` y preferencia `EMAIL`. El intake actual registra `HABEAS_DATA_LEY_1581`; ese permiso de tratamiento **no equivale** a autorización comercial. No se crea consentimiento desde el equipo, no se convierte el existente ni se activa al cliente automáticamente. El flujo de consentimiento/preferencias originado por el cliente queda fuera de esta entrega; los cuatro entregables principales no dependen del envío externo, que permanece deshabilitado.

## Permisos y compatibilidad

Se conserva el catálogo de ocho roles. Finanzas requiere los permisos nuevos de lectura/escritura y las restricciones duras del servidor: Administración/Dirección para escribir y Auditoría para lectura autorizada. Asesoría ordinaria no recibe finanzas al editar una política. El cambio de compatibilidad del worker documental usa el catálogo vigente de permisos; no amplía el alcance ni rediseña el flujo documental.

Los selectores señalan el límite de opciones cuando existe; un caso no disponible no se sustituye por otro. El alta de casos sigue `/credit-request` y su intake canónico validado. Las solicitudes históricas conservadas no se convierten automáticamente en Client, expediente o acceso al portal. El rol SUPER_ADMIN por sí solo tampoco es una relación de cliente.

## Verificación y límites actuales

QA capturó **438 fuentes reales** antes de editar, incluidas las cinco piezas de marca ajenas a este cambio. Base: `56336d99b41191f05c2867fc0fa009abd99f9b88`. Manifest SHA256: `21636c450f66d17ff106b2293dc0db1cee9fc534bfd98c81cbbf0855b665be1a`.

La decisión independiente es `PASS_LOCAL_COMMERCIAL_R1_QUALIFIED`, `allChecksPass: true`, observada el 18 de noviembre de 2026 a las 06:50 UTC. Está vinculada a **320 fuentes**, agregado SHA256 `b93fdc16c0dd4c7e6468e8aaaed9968f92375533ccfb8bc34a74cbb5672b988a`, y al build `79fkGZd2rMja_xyH8bXrO`. TypeScript, lint estricto de 36 archivos cambiados y `npm run build` pasaron sin deriva de fuente; Node observado `22.23.5`.

| Comprobación independiente | Resultado local |
| --- | --- |
| Captura, autenticación y revocación | 8 grupos PASS |
| Dominio comercial y finanzas | 16 grupos PASS |
| Notificaciones y scheduler | 8 grupos PASS, proveedor simulado y entrega deshabilitada |
| Plazos, revocación y SLA | 4 grupos PASS; 1 grupo de lease expirado PASS |
| Vinculación histórica, API, métricas y fallos | 5 grupos PASS |
| Ingresos pagados por aliados | 2 grupos PASS |
| Denominador de subcasos bancarios frente a expediente único | 1 grupo PASS |
| Script financiero portable | 5 grupos PASS; cobertura parcialmente superpuesta con dominio |
| Recorridos de navegador | 8 grupos PASS |
| Vistas adaptables y formularios oscuros | 15 vistas a 375/768/1440 y 2 vistas oscuras focales: cero errores JS, desbordamiento o infracciones axe reportadas |

Las pruebas de navegador usan componentes y handlers reales con PostgreSQL aislado y límites externos de Clerk/navegación explícitamente sintéticos. Doce capturas de cuerpos sin cambios se conservan con compatibilidad de fuente revisada; las tres vistas BI y los dos formularios oscuros usan la fuente final. Los grupos normalizados conservan sus intentos/correcciones y compatibilidad por archivo: no se afirma que toda prueba histórica se ejecutó contra un único agregado idéntico. Axe se limitó a los tags `wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa`; no es una certificación universal WCAG.

La migración aislada real pasó tanto de cero a once como de diez a once con datos sintéticos, conservando conteos y hashes de columnas originales de 46 tablas y los diez checksums históricos. Esto no acredita una migración alojada. La comparación protegida conserva 32 de 36 fuentes byte a byte; las cuatro excepciones revisadas son captura/copy ilustrativa del calculador, snapshot SLA de transiciones, catálogo dinámico de permisos del worker documental y cliente transaccional opcional de readiness. El motor financiero y las cinco piezas de marca ajenas al trabajo se conservan exactos; no se afirma haber reejecutado todas las suites históricas.

QA reprodujo un COMMIT real con respuesta perdida al navegador y cambio posterior de revisión: la clave del formulario descartaba el intento incierto al volver atrás. Se separó la identidad del comando de la revisión de los campos y se conserva el cuerpo original en memoria, con reconciliación manual incluso si el estado confirmado oculta el formulario original. QA confirmó la recuperación del mismo comando con una sola fila de contacto y la finalización del intento original tras remontar, sin POST duplicado. QA confirmó también el conflicto 409 visible y su consulta explícita; las correcciones de selectores del harness permanecen registradas por separado.

Clerk **TEST** permanece. Las pruebas locales con límites de identidad controlados no acreditan sesiones genuinas, aceptación humana, contratos reales ni resultados comerciales. No se afirma un cambio automático a LIVE. Migración, runtime, publicación y aceptación alojada se registrarán únicamente tras sus recibos; el diseñador no ejecuta esas operaciones.

## Comprobación financiera portable

`scripts/qa-commercial-finance.cjs` verifica cinco grupos críticos contra PostgreSQL real: centavos de gran importe, duplicado de familia, recaudo parcial/reverso con revisión, costo/reverso neto y rollback de auditoría. QA ejecutó estos cinco grupos con resultado PASS.

Requiere una base **desechable, vacía y aislada**, en loopback y puerto no predeterminado, con las once migraciones exactas actuales aplicadas mediante `prisma migrate deploy`. No usar una base de desarrollo compartida ni alojada. El script usa la dependencia TypeScript declarada para cargar la fuente real, sin esbuild ni bundle temporal. Comprueba filas vacías, alias de base y checksums, no carga `.env` y bloquea `fetch` externo; conserva fixtures sintéticos para inspección. La segunda ejecución sobre esa misma base se detiene: crear otra base vacía.

```sh
FNT_COMMERCIAL_TEST_DATABASE_URL='postgresql://<dedicated-role>@127.0.0.1:<nondefault-port>/fintera_commercial_qa_<suffix>' node scripts/qa-commercial-finance.cjs .
```

## Arquitectura documental y evidencia

Se revisaron la arquitectura existente, su informe del portal y la orientación de `.graphify/GRAPH_REPORT.md`; el grafo comprometido excluye fuentes sin seguimiento, por lo que no sustituye el inventario real de QA. El hook ordinario offline posterior terminó conservando el grafo original cuando su guarda rechazó un grafo reducido; no es una certificación semántica de las fuentes nuevas. El destino es este único informe subordinado en `docs/`; no se añade otra arquitectura o roadmap.

Evidencia externa: `~/.local/share/fintera-vivienda-commercial/20261118/control/`. `DOCUMENT_ARCHITECTURE_CHECK.md` registra el destino; `tasks.json` contiene tareas atómicas con propietarios. QA conserva intentos iniciales y correcciones sin presentarlos como una ejecución final única. Mission Control, memoria vectorial y telemetría exacta no están disponibles: tokens de entrada/salida y coste son **null**.

## Recibos del corte local

Todos los nombres siguientes se resuelven bajo el directorio de evidencia externa indicado arriba; no se incluyen credenciales, datos de clientes ni contratos comerciales en este informe.

- `qa/final-independent-decision.json`, SHA256 `9137455462e010a0c593e7bdb51ca5dd1583a8f2b26a99a2ee93345293b85539`.
- `publication/final-build-receipt.json`, SHA256 `166b01ae7cca72160637cfa52d8c9d52d96f00b3c393e019abd58d4e8a3eea6d`; lint y typecheck tienen recibos propios en el mismo directorio.
- `qa/normalized-test-results.json`, `qa/per-suite-final-source-compatibility.json`, `qa/independent-source-build-review.json` y `qa/protected-source-review.json`.
- `qa/browser-functional-results-final.json`, `qa/browser-capture-results-final.json` y `qa/browser-dark-results-final.json`. Vistas finales: `qa/screenshots-bi-final/bi-{375,768,1440}.png`; las otras doce en `qa/screenshots-final-clean/`.
- `qa/portable-finance-regression-results.json`; script versionado SHA256 `712fee26ec3a93f6ed1d319b789b396cda4800e45d01fdcb10c7d6075b6000a9`.

La publicación posterior debe comprobar separadamente migración aditiva, preservación alojada, proceso comercial real y compatibilidad del worker documental en ejecución con 19 permisos. El runtime y el ACK de un proveedor simulado local no satisfacen esos pasos. Clerk TEST, entrega externa OFF y aceptación humana genuina pendiente siguen siendo límites explícitos de este corte local.
