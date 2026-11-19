# FINTERA — Customer Onboarding R1

**Calificación local: `PASS_LOCAL_CUSTOMER_ONBOARDING_R1_QUALIFIED` / `LOCAL_GO_WITH_DISCLOSED_LIMITS`.** Este informe documenta el alcance y la verificación de la entrega; el estado alojado vigente y sus identificadores se registran por separado en los recibos de `control/publication/`. La aceptación humana con una sesión real de Clerk requiere su propio registro.

## Document Architecture Check

La arquitectura canónica se conserva en `FINTERA_ARCHITECTURE_AND_CONTENT_OS.md`; el portal documental está documentado en `FINTERA_CUSTOMER_VIVIENDA_PORTAL.md`. Este registro subordinado, dentro del directorio `docs` ya existente del paquete, describe exclusivamente la activación de clientes. No sustituye la arquitectura ni reescribe los cierres históricos. La orientación de `.graphify/GRAPH_REPORT.md` cubre archivos confirmados y excluye archivos sin seguimiento; el inventario real y la copia independiente de QA son la referencia para esta entrega.

## Recorrido del cliente

1. El inicio y `/solicitar` ofrecen un registro corto: tipo de crédito —Vivienda, Libre destino, Libranza o Vehículo—, monto, nombre, actividad, celular y correo. La autorización de datos del registro inicial está desmarcada y se expresa antes de enviarlos.
2. `/onboarding/sign-up` y `/onboarding/sign-in` reutilizan los componentes oficiales de Clerk. No hay un formulario propio de contraseñas. La continuación fija es `/onboarding/solicitud`; una cuenta creada directamente puede iniciar una solicitud breve desde allí.
3. La cuenta con correo principal verificado recupera únicamente el registro permitido por la prueba del navegador y la identidad. Un correo coincidente, un identificador conocido o el registro de una cuenta no conceden por sí solos acceso a un cliente CRM.
4. `/onboarding/solicitud` permite revisar los datos y expresar por separado la solicitud de servicio y la autorización de tratamiento. Se reutilizan las políticas actuales aprobadas por el propietario; el anclaje de la política identifica la versión visible Enero 2025 y sus bytes anteriores a la actualización del teléfono oficial, conservando esa procedencia histórica en los recibos. No se convierte esta autorización en consentimiento de mercadeo ni en autorización bancaria.
5. `/portal` muestra las solicitudes de servicio propias independientemente de que exista un expediente CRM vinculado. El envío no crea un cliente CRM ni un expediente bancario. Los documentos continúan sujetos a la identidad, vinculación y permisos existentes.
6. `/onboarding/constancia/[id]` presenta una constancia legible con los datos efectivamente enviados, referencia, fecha y textos/versiones/fechas realmente aceptados. La impresión nativa permite guardar PDF. Su consulta requiere identidad y propiedad verificadas; el JSON de la API no es el destino principal del cliente.

La antigua ruta duplicada `/credits/apply` redirige al registro corto; su API retirada no genera solicitudes a partir de campos ficticios. El formulario avanzado `/credit-request` sigue disponible para la etapa que lo requiera, con aceptación explícita de tratamiento. El nuevo cliente no debe completarlo para enviar la solicitud breve. Los valores ilustrativos del simulador no se convierten en hechos de una solicitud real.

## Contacto, navegación e identidad visual

`lib/public-contact.ts` concentra el número indicado por el propietario: **+57 313 846 1713**, teléfono `+573138461713` y WhatsApp `https://wa.me/573138461713`. Navegación, pie, contacto, páginas legales, ayudas del formulario y plantilla institucional usan esa fuente. El formulario genérico de contacto que mostraba éxito local sin envío fue retirado: su lugar conserva enlaces reales a WhatsApp, teléfono y el correo ya publicado. Abrir estas aplicaciones no se presenta como mensaje enviado ni prueba de entrega; no se afirma la disponibilidad del buzón. El ancla histórica `#formulario` se conserva. Los teléfonos de clientes/asesores y los enlaces para compartir contenidos conservan sus destinatarios reales.

La navegación compartida ofrece Mi portal, Crear cuenta e Iniciar solicitud en escritorio y móvil. El menú móvil tiene nombre accesible, estado expandido y cierre con Escape/devolución de foco; el encabezado queda visible por encima de la imagen inicial existente. Las ventanas del formulario avanzado conservan una capa superior al encabezado.

El favicon es un ICO real de varias resoluciones derivado del símbolo del logo existente; el nombre coincide con `/favicon.ico`. El wordmark ajustado deriva de los mismos píxeles de marca. Los archivos originales no se reemplazan ni se rediseñan.

## Operación interna

La vista `/admin/crm/commercial?tab=service` consulta la cola real de solicitudes de servicio según los permisos existentes. Permite revisión, responsable/equipo y próximo paso cuando están autorizados. La vinculación es explícita con un expediente existente compatible y no crea identidades ni datos financieros. El equipo no acepta la solicitud o los consentimientos en nombre del cliente. No se envían comunicaciones externas automáticamente.

## Persistencia y errores

El servidor conserva el registro y las aceptaciones versionadas. Los borradores nuevos y los intentos pendientes se conservan solo en memoria de la sesión/pestaña; no se escriben datos personales en URLs, `localStorage` o `sessionStorage`. La prueba de navegador es una cookie HttpOnly opaca; no representa por sí sola una identidad de cliente.

Un envío pendiente o de resultado incierto conserva el mismo identificador y cuerpo, incluso después de salir y volver a la ruta o recibir una revisión nueva. El cliente reintenta explícitamente ese mismo envío; una respuesta incierta no se presenta como éxito. Un conflicto requiere consultar y revisar los datos actuales, sin reproducción automática. Cambiar de cuenta separa los borradores. La pérdida de la prueba del navegador no se resuelve con una asociación por correo sin control.

## Verificación del código y del recorrido local

QA preservó una copia de **446 archivos** del árbol real, HEAD `6c987e767049d76d96e5c35a935d351e75b42e1f`, manifiesto `b81bd9652a137589c18762e23290ef63fbbff498faf4e082d9613b1ff58a26e5`; incluye las ocho entradas ajenas a esta tarea.

El build final posterior a las correcciones de contacto y contraste terminó con código 0, sin deriva de **354 archivos** de código. Agregado SHA256 `83b07d2d80f5cff8a4c82246ad3b6bfe5c91274adc765f408020fccfbf317d7c`; BUILD_ID `0IYJ-MzkGYB7ktpkesChH`. El recibo `publication/final-build-receipt.json`, SHA256 `f22cd1a3be247fb3006636038f52e9c373428e2d6a5b38178c009330a1870f1e`, conserva el comando real. TypeScript completo pasó. Lint de los 61 archivos TS/TSX modificados terminó sin errores y con una advertencia de React Hook Form demostrada heredada, sin advertencias nuevas ni supresión de reglas. Los componentes nuevos de interfaz pasaron lint estricto sin advertencias.

La navegación se verificó a 375, 768, 1280 y 1440 px: portal visible, Escape/foco y regreso histórico correctos. El ICO se decodificó en seis resoluciones de 16 a 128 px. QA capturó las cinco vistas —registro corto, confirmación, portal, constancia y cola interna— a 375, 768 y 1440 px: **15 vistas sin errores de JavaScript, violaciones axe en las reglas ejecutadas, desbordamientos o imágenes visibles rotas**. Esto no es una certificación integral WCAG. La constancia produjo un PDF A4 real de dos páginas mediante la impresión de Chromium.

El recorrido se ejecutó desde componentes reales hacia los handlers y PostgreSQL aislado, con una frontera de Clerk controlada y datos sintéticos identificados. Las pruebas cubren aceptaciones inicialmente desmarcadas, envío y constancia, respuestas perdidas con el mismo UUID/cuerpo, navegación atrás mientras el envío original sigue pendiente, separación entre cuentas, cuenta directa sin registro previo, correo sin verificar y revisión conflictiva. La comprobación final de varias solicitudes pasó: conserva y reconcilia una sola vez el intento original, con el mismo UUID y revisión, aunque exista otra solicitud en borrador. La decisión independiente `qa/final-independent-decision.json`, SHA256 **`97682bf5268fbb286f527f4f52363f8aff425c4f092e834d6e08e21c9eabb7b8`**, declara `allChecksPass: true` y vincula exactamente los 354 archivos y el build indicados.

| Verificación normalizada | Resultado |
| --- | --- |
| Seguridad y servicio, handlers/servicios/PostgreSQL reales | 32 grupos PASS |
| Migración aditiva y preservación local | 9 grupos PASS |
| Recorrido del cliente | 8 grupos PASS |
| Gestión del equipo | 2 grupos PASS |
| Suplemento de respuesta perdida con varias solicitudes | 1 PASS |
| Vistas principales responsive | 15 PASS |
| Contacto con animaciones asentadas y contraste corregido | 2 vistas PASS |
| Constancia a 350 px, teclado y PDF A4 de dos páginas | PASS |
| Next real sin sustitución de componentes y formulario anónimo Clerk TEST | 5 comprobaciones PASS |
| Rutas públicas existentes mediante GET | 10 PASS |
| Regresión portátil de fidelidad financiera | 5 grupos PASS |
| Registro de marca y activos originales | 22 activos PASS |

Los conteos corresponden a las capas y recibos normalizados; no se presentan como un único total de pruebas independientes. Las ocho entradas originales ajenas al trabajo conservan sus bytes. El control de 48 rutas protegidas confirma 47 sin cambios y una excepción autorizada para la versión explícita del consentimiento.

La cadena canónica local resulta en 59 tablas después de 12 migraciones. Producción contiene tablas adicionales fuera de esa cadena: el resultado local no pretende reproducirlas ni autoriza por sí solo una migración alojada. El operador conserva una revisión y recibos de preservación propios para el destino real. El formulario avanzado conserva otros comportamientos históricos fuera de esta entrega; el registro breve no llama sus valores de respaldo ni crea clientes, solicitantes o expedientes a partir de ellos.

El hook normal de graphify conservó el grafo existente al rechazar un reemplazo menor; su salida se registra como mantenimiento con guarda, no como certificado semántico del cambio.

## Evidencia y límites operativos

Evidencia externa del trabajo: `~/.local/share/fintera-customer-onboarding/20261119/control`. Los recibos de QA y `publication/final-build-receipt.json` vinculan el código ensayado; los recibos de publicación, migración y despliegue, cuando se ejecutan, se conservan en `publication/` sin requerir otro commit de este informe para insertar su propio SHA o identificador de Vercel.

El entorno de identidad observado conserva **Clerk TEST**. Las pruebas locales usan una frontera de identidad controlada; no se presentan como una sesión genuina del propietario o de un cliente, ni prueban la entrega de mensajes externos. La aceptación humana del nuevo recorrido se registra por separado. No se declaran aprobaciones de crédito, radicaciones bancarias, asesorías realizadas o una migración automática de identidad a LIVE.

La solicitud de servicio es independiente de un expediente crediticio. La vinculación administrativa requiere un expediente existente y compatible; no completa en nombre del cliente una solicitud bancaria ni sus autorizaciones específicas. La autorización del registro y la del servicio no habilitan mercadeo, consultas a centrales de riesgo o radicación bancaria. La implementación de las políticas aprobadas no equivale a una auditoría jurídica integral.

Se conservan las correcciones y los intentos de QA anteriores para mostrar su procedencia; los conteos normalizados evitan sumar ejecuciones superpuestas. Métricas exactas de tokens y costo no disponibles: `null`. Mission Control y memoria vectorial no estuvieron disponibles; se mantiene el ledger local atómico.
