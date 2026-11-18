# FINTERA — Portal del cliente para vivienda

Estado: **LOCAL_GO_WITH_DISCLOSED_LIMITS**, con migración alojada, configuración de almacenamiento y arranque del trabajador aceptados mediante recibos independientes. Corte previo al push: la publicación en Vercel y el recorrido de una sesión humana de cliente siguen pendientes. Este informe distingue esos pasos de la verificación local satisfactoria.

## Ubicación documental

La autoridad existente es `FINTERA_ARCHITECTURE_AND_CONTENT_OS.md`, en este mismo directorio. Antes de editar se revisaron las instrucciones del workspace y `.graphify/GRAPH_REPORT.md`; no existe índice wiki. El grafo usa el corpus versionado y excluye los archivos sin seguimiento, por lo que la auditoría del portal se realizó sobre la fuente real. Este informe no crea otra arquitectura ni modifica los registros históricos de admin, RBAC o marca.

## Experiencia del cliente

`/portal` reúne solicitudes autorizadas y la siguiente acción disponible. `/portal/solicitudes` permite buscar expedientes y filtrar los que requieren atención. El detalle conserva el retorno a la lista, muestra novedades publicadas por entidad y los datos reales del asesor. La conversación sólo admite envíos cuando el servidor los autoriza. `/portal/perfil` muestra datos de contacto con documento y teléfono enmascarados y ofrece ayuda para vincular o corregir la información.

`/portal/documentos` mantiene el contexto de solicitud y persona, permite registrar las condiciones documentales, distingue la lista general de los requisitos de cada banco y presenta las evidencias, sus versiones y observaciones públicas. La navegación utiliza los activos existentes de Fintera, navy institucional, superficies claras y acentos turquesa con contraste. No se muestran eventos RADIAN ficticios, plazos de respuesta prometidos, afirmaciones regulatorias sin respaldo ni aprobación financiera derivada de documentos cargados.

Los estados de carga, ausencia de expediente, acceso sin vincular, fallo del servicio y restricciones de operación tienen respuestas distintas. Los enlaces conservan los recorridos existentes hacia solicitud de crédito y contacto.

## Lista general de vivienda solicitada

Para empleados: identificación, desprendibles de los últimos dos meses, certificación laboral y declaración de renta cuando declara.

Para independientes: identificación, declaración de renta, RUT, soportes de ingreso, extractos bancarios de los últimos tres meses, Cámara de Comercio cuando aplica y estados financieros anuales cuando aplican. Los ingresos por arrendamiento de inmuebles requieren el certificado del inmueble y los contratos de arrendamiento. El alquiler de vehículos requiere contratos, tarjetas de propiedad y cuentas de cobro.

Cada mes tiene su propio requisito; pueden agregarse varios soportes por periodo, por ejemplo nóminas o cuentas bancarias diferentes. El perfil y sus condiciones se guardan por solicitante con revisión esperada. Una respuesta desconocida permanece sin confirmar y no se convierte en asalariado, exención tributaria o no aplicabilidad automática.

Un perfil todavía sin guardar permite preparar explícitamente la lista conservando todas las respuestas desconocidas. Así se habilita el requisito universal de identificación sin obligar al cliente a declarar una actividad incorrecta.

El catálogo bancario previo contiene requisitos específicos con otros periodos, incluidos tres meses de nómina y seis meses de extractos para una entidad. Esos requisitos se presentan por separado y conservan su significado. Completar la lista general no implica cumplir todos los requisitos del banco ni obtener aprobación de crédito.

## Acceso y contratos

`lib/portal/portal-contracts.ts` define perfiles, aplicabilidad, requisitos, evidencias, permisos, proceso de carga y vinculación. Los estados y las acciones del cliente se basan en esos DTO. Las operaciones sensibles requieren identidad de Clerk verificada y vinculación autorizada; el seguimiento mediante enlace firmado conserva una vista de estado limitada y no habilita documentos o datos personales.

La vinculación utiliza la coincidencia verificada y el flujo explícito que expone el servidor. No se genera una cuenta, OTP ficticio ni concesión de personal desde la interfaz. Los casos que requieren ayuda presentan el canal real de Fintera.

La respuesta anónima del servidor ofrece los recorridos reales de inicio de sesión y registro con retorno al portal. Cuando falta verificar el correo principal, la interfaz dirige al control existente de la cuenta; otros accesos denegados y los fallos del servicio mantienen sus estados específicos.

Los nuevos componentes se ubican en `components/customer-portal/` y el estilo se limita a `app/portal/portal.css`. El diseñador posee la interfaz; el arquitecto posee contratos, autenticación, API, servicios, esquema, controles del servidor y el wrapper del layout. QA verifica de forma independiente fuente, comportamiento y evidencias.

### Requisito de entrada al expediente

El formulario real `/credit-request` envía a `/api/credit-request`; el intake canónico crea `Client`, `CrmCreditApplication` con referencia FNT y solicitante principal, además de la fila de compatibilidad histórica. La creación autorizada del personal y el endpoint compatible `/api/credits/apply` comparten ese flujo. Las 31 solicitudes antiguas conservadas únicamente en `credit_requests` no se importan automáticamente como expedientes CRM.

Ser SUPER_ADMIN no otorga propiedad sobre expedientes del portal de clientes: se necesita la relación real con un cliente o una concesión de acceso. Un cliente nuevo con marcador de origen confiable puede confirmar expresamente la vinculación de su correo principal verificado en Clerk. Los contactos históricos o ambiguos requieren la vinculación asistida del personal SUPER_ADMIN sobre un expediente existente. No es necesario vincular un banco para comenzar la lista general documental.

## Carga y versiones

El cliente selecciona un archivo, revisa su destino y confirma el envío. Se obtiene una autorización, se transfiere con progreso real y se confirma el mismo intento. El procesamiento asíncrono y la revisión documental son estados distintos: recibir o validar un archivo no equivale a aprobarlo.

Añadir soporte crea una evidencia adicional; reemplazar crea una versión del archivo elegido y conserva el historial. Los envíos adicionales se realizan uno por vez y requieren una lectura actualizada del requisito. No se recorre una selección múltiple sustituyendo silenciosamente el mismo activo.

Cada requisito admite un intento activo. La lista de envíos propios permite reconciliar una respuesta perdida y cancelar explícitamente una recepción que todavía no entró en cola; los trabajos en cola o procesamiento no ofrecen esa acción. Una cancelación ambigua exige consultar el mismo intento antes de repetirla. Cancelar la recepción no acredita borrado del objeto almacenado.

La interfaz bloquea cierres y cambios de contexto durante las fases activas de envío y confirmación. Conserva selección, borradores y estado pendiente dentro de la memoria de la sesión; no persiste documentos o identidad en almacenamiento del navegador. Al volver mediante el historial se consulta y retoma el estado, sin ejecutar un POST nuevo automáticamente.

Si un enlace contiene una solicitud o persona que ya no está en la lista autorizada, el portal exige elegir explícitamente un destino disponible. No sustituye ese contexto por el primer expediente o solicitante, lo que evita preparar un envío para otra persona por una dirección antigua o incorrecta.

Un conflicto de revisión o un resultado ambiguo exige actualizar o reconciliar el intento antes de repetirlo. Las consultas de estado son limitadas y el usuario puede volver a consultarlas. Si la transferencia no llegó a confirmarse, se ofrece cerrar el intento y preparar otro de forma explícita. Sólo se permite descargar la evidencia que el servidor autoriza.

La aplicación acepta confirmar el intento durante diez minutos. El token de carga firmado del proveedor conserva una vigencia de dos horas, conforme a la [referencia de Supabase](https://supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl); no se afirma que se revoque a los diez minutos. Las descargas autorizadas de evidencia limpia usan enlaces de cinco minutos. Las credenciales de servicio permanecen en el servidor: el navegador recibe sólo la capacidad firmada para su operación.

## Operación del procesamiento

La arquitectura utiliza un trabajador saliente y antivirus dedicado, con credenciales y servicios de alcance restringido. El inventario previo encontró un daemon nativo inactivo y firmas antiguas; esa instalación no se utilizó como acreditación. QA verificó el primer arranque del contenedor dedicado con imagen fijada, ClamAV 1.5.4 y firmas 28186 del 17 de noviembre, PDF limpio y EICAR físicos, sin OOM. La política de reinicio quedó `unless-stopped` tras sus controles autorizados. Ese control no demuestra resistencia de carga o recarga prolongada. El plan y las autorizaciones operativas se conservan fuera de Git; no se tomó la URL de una base local distinta como configuración de producción.

En el corte del 18 de noviembre a las 04:57 UTC, la migración adicional alojada ya tenía ACK y aceptación independiente. Su primer postcheck mantuvo STOP por diferencias de representación del catálogo y `search_path` entre la referencia local y PostgreSQL 18.7. Se conservó ese STOP y no se repitió la migración. La conciliación de sólo lectura comprobó exactamente 56 columnas, 17 restricciones semánticas y 18 índices, además de 35 restricciones NOT NULL nativas que corresponden una a una a columnas obligatorias; las 52 restricciones quedaron verificadas como impuestas. Se conservaron las 53 tablas previas, sus conteos salvo el incremento de la historia de migración y los hashes seleccionados, las 31 solicitudes históricas y las nueve entradas originales de migración; la historia final tiene diez entradas. Los recibos son `publication/additive-document-migration-acceptance.json` y `qa/independent-hosted-migration-review.json`.

La configuración documental recibió cuatro ACK de creación de variables dedicadas: los 77 registros previos conservaron su metadata y el total quedó en 81. Ambos buckets se verificaron privados, con límite de 15 MB. Esta lectura de metadata y los ACK de escritura no constituyen una atestación de bytes de secretos. El recibo es `publication/document-storage-configuration-receipt.json`.

El trabajador de la aplicación está activo con Node 22.23.5 fijado, proceso y ejecutable reales, entorno verificado contra la custodia privada, 21 artefactos conservados y heartbeat reciente con antivirus listo. El STOP inicial de ejecución quedó registrado; se resolvió cambiando únicamente dos directorios del runtime de 0700 a 0755, sin repetir el instalador ni añadir puertos entrantes. `publication/worker-permission-repair-receipt.json` e `qa/independent-hosted-worker-review.json` registran el resultado cualificado. Una consulta real de Prisma nativo, ejecutada como el usuario del servicio y revertida en sólo lectura, confirmó la base y el rol esperados con configuración estricta del motor y CA del sistema. El indicador SSL del backend fue falso detrás de la terminación del proveedor: no se interpreta como atestación del transporte cliente-proveedor ni se afirma inspección de certificados del par.

Un envío fallido, una confirmación ambigua o un ACK perdido puede conservar un objeto privado en cuarentena o un objeto limpio único todavía sin referencia. El trabajador no repite automáticamente esas escrituras ni declara que se eliminaron. En este alcance no se verificó una política programada de retención o recolección de objetos huérfanos: su revisión y limpieza requieren una decisión operativa manual, sin afirmar plazos legales de conservación. La prueba física satisfactoria de 77 bytes utilizó dos claves aisladas y confirmó la eliminación de ambas; ese resultado no acredita limpieza automática de todos los intentos.

## Verificación y límites actuales

QA capturó 406 archivos reales antes de cambios y conservó el documento de marca modificado y cuatro imágenes de insights sin seguimiento. Las capturas iniciales del portal se conservaron con datos sintéticos identificados; mostraron desbordamiento en tablet. La comprobación de ESLint de la interfaz y rutas de portal pasó con cero advertencias y la integración completa de TypeScript pasó. Estas comprobaciones preceden al cierre final de QA y no sustituyen el recibo del build final.

El build real de reemplazo terminó satisfactoriamente el 18 de noviembre de 2026 a las 04:36 UTC: `BUILD_ID preNL5tC0qJ3UbSoMLrN4`, 299 fuentes con agregado `ebdc1c37cbba36290203b62f847fd4002ac9b35a1788ffb52541cea60f9b45d6` y cero cambios de fuente durante la ejecución. TypeScript completo y ESLint estricto sobre los 60 archivos TS/TSX cambiados terminaron con código cero. Los recibos son `publication/final-build-receipt.json`, `publication/final-typecheck-receipt.json` y `publication/final-focused-lint-receipt.json`, bajo `~/.local/share/fintera-vivienda-portal/20261117/control/`. No se presenta ese lint focal como certificación de todos los archivos históricos del workspace.

La revisión real del navegador encontró y corrigió un enlace móvil sin nombre accesible, la superposición del icono de búsqueda y el retorno de foco después de historial y recarga. El foco de cierre regresa al requisito concreto del archivo, con el contenido principal como destino seguro si ese requisito deja de existir. También se corrigieron el contrato estricto de confirmación y la serialización de cargas del mismo requisito. Los primeros intentos fallidos se conservan como evidencia histórica; sólo una repetición independiente satisfactoria puede cerrar cada hallazgo.

La prueba independiente `control/qa/supabase-actual-results.json`, en el directorio externo del workstream, registró siete controles satisfactorios con Supabase real, PostgreSQL aislado y ClamAV físico: autorización del servicio, PUT firmado sin sobrescritura, lectura acotada, procesamiento y COMMIT, denegación anónima del objeto privado, descarga con los mismos bytes y preflight CORS desde el origen de producción. Utilizó únicamente un PDF sintético de 77 bytes y dos claves aisladas, cuya ausencia final se comprobó. La resolución del método de borrado no se presenta como ACK de DELETE del proveedor. Esta prueba no escribió la base alojada ni utilizó una sesión real de cliente Clerk.

La decisión independiente `qa/final-independent-decision.json`, SHA256 `851c4dab8f78fb2b5cb1f0a929b95b41c6f8154353df887f2204369fdea78b18`, confirmó `PASS_LOCAL_QUALIFIED` sobre esa misma fuente y build. Conserva hashes y procedencia de cada control, incluidos intentos iniciales y correcciones de fixtures.

| Verificación local | Resultado observado |
| --- | --- |
| Servicios, identidad/intake y fronteras del personal | 18, 13 y 7 grupos PASS, respectivamente |
| Trabajador adversarial, proyección bancaria y política | 11, 3 y 4 controles PASS |
| Serialización de cola y vinculación delegada | 1 y 4 controles PASS |
| Catálogo y análisis de archivos | 86 ramas y 23 grupos PASS |
| Navegación, formularios, historial y recuperación | 12 recorridos distintos PASS, normalizados con procedencia por grupo |
| Cinco páginas a 375, 768 y 1440 px | 15 vistas; cero errores JS, hallazgos axe, desbordamientos o imágenes visibles rotas |
| Migración PostgreSQL aislada real | Prisma 5.22, historia 9→10; 41 modelos previos comparados y 31 filas sintéticas conservadas; 46 modelos finales |
| Supabase físico con archivos sintéticos | 7 controles PASS, con las fronteras descritas arriba |

Las etiquetas de axe fueron `wcag2a`, `wcag2aa`, `wcag21aa` y `wcag22aa`; este resultado no equivale a certificar íntegramente WCAG. Los recorridos usan componentes y handlers HTTP reales con PostgreSQL aislado, una frontera explícita del SDK de Clerk y Storage REST local; la prueba física separada sí usó Supabase real. No se presentan como un recorrido autenticado completo de Next alojado.

La preservación independiente comparó los 406 archivos de base: 374 sin cambios, 32 modificaciones existentes intencionales y ninguno ausente. El documento de marca previamente modificado y sus cuatro PNG conservaron exactamente sus bytes. El hook ordinario de graphify terminó sin reemplazar el grafo por una versión menor; su metadata quedó registrada fuera de Git. No se repitieron indiscriminadamente las suites financieras ajenas al cambio.

El push, la disponibilidad de la nueva versión en Vercel y la aceptación aplicación→trabajador→Supabase desde una sesión real del entorno publicado siguen pendientes en este corte previo a publicación. Los fixtures locales, el arranque real del trabajador y sus consultas de sólo lectura no acreditan ese recorrido humano. El rechazo de contenido activo de PDF es heurístico, no reconstrucción de contenido ni garantía de detectar todos los archivos maliciosos; la denegación anónima de Storage tampoco certifica todas sus políticas autenticadas.

La lectura pública del portal alojado previa a esta publicación confirmó que conserva la instancia TEST de Clerk. Este trabajo no autoriza sustituir sus claves o entorno de identidad. Una publicación para revisión dentro de ese entorno no acredita una instancia LIVE ni aceptación operativa de clientes reales; la comprobación final debe mantener explícita esa distinción.

Mission Control, memoria vectorial y telemetría exacta no están disponibles en esta sesión. Se usa una bitácora atómica externa por tarea. Tokens de entrada/salida y coste: `null`.
