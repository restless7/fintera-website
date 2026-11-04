/**
 * lib/linkedin-strategy.ts
 *
 * Plan Estratégico de Posicionamiento de FINTERA en LinkedIn (90 Días · Octubre 2026 – Enero 2027).
 * Codifica íntegramente el modelo de marca, calendario interactivo de 4 semanas, rutina semanal,
 * embudo con UTM, KPIs y reglas editoriales de cumplimiento.
 */

import { ContentTypeKey, FinteraContentPillarKey } from "./content-types";

export interface LinkedinCalendarPostSpec {
  id: string;
  week: 1 | 2 | 3 | 4;
  weekTheme: string;
  day: "Lunes" | "Martes" | "Miércoles" | "Jueves";
  categoryBadge: "Marca" | "Vivienda" | "Empresas" | "Conversión" | "Mercado";
  pillar: FinteraContentPillarKey;
  title: string;
  format: string;
  contentType: ContentTypeKey;
  objective: string;
  primarySources: string[];
  ctaText: string;
  ctaUrlWithUtm: string;
  draftOutlineMarkdown: string;
}

export const FINTERA_LINKEDIN_PROFILE_SPEC = {
  brandName: "FINTERA | Soluciones Financieras",
  tagline: "Crédito de vivienda · Financiación empresarial · Factoring",
  centralClaim: "Hagamos posible tu próximo proyecto.",
  centralPromise:
    "Conectamos personas y empresas con soluciones financieras, mediante orientación especializada y acompañamiento durante el proceso.",
  companyHeadline:
    "Soluciones financieras para personas y empresas | Crédito de vivienda | Factoring para capital de trabajo",
  companyDescription: `En FINTERA conectamos personas y empresas con alternativas de financiación acordes con sus necesidades y perfil.
Acompañamos la gestión de crédito de vivienda, orientando a los compradores durante el proceso de solicitud y facilitando la comprensión de requisitos y condiciones.
Para las empresas, trabajamos en el desarrollo de soluciones financieras que contribuyan a gestionar sus necesidades de liquidez y capital de trabajo, incluyendo operaciones de factoring cuando estén disponibles a través de nuestros aliados.
Creemos en una gestión financiera transparente, en el acompañamiento cercano y en la importancia de tomar decisiones informadas.
Conoce nuestras soluciones y conversemos sobre tu necesidad de financiación.
Sitio web: https://www.finterasoluciones.co/`,
  attributes: [
    {
      name: "Criterio financiero",
      description: "Análisis de necesidades, capacidad de pago y condiciones reales.",
    },
    {
      name: "Acompañamiento",
      description: "Orientación personalizada durante toda la gestión documental y bancaria.",
    },
    {
      name: "Transparencia",
      description:
        "Explicación clara de requisitos, costos efectivos, condiciones y riesgos sin promesas engañosas.",
    },
  ],
};

export const FINTERA_90_DAY_PHASES = [
  {
    period: "Días 1–30",
    title: "Construir identidad y credibilidad",
    expectedResult:
      "Perfil corporativo optimizado, consistencia web verificada, mensaje claro y calendario editorial activo (4 publicaciones/semana).",
    insightMilestones: [
      "Semana 2: Publicar Whitepaper 01 (Crédito de vivienda en Colombia)",
      "Semana 4: Realizar Webinar 01 (¿Cómo elegir un crédito de vivienda sin fijarse únicamente en la tasa?)",
    ],
  },
  {
    period: "Días 31–60",
    title: "Ampliar alcance y conexiones calificadas",
    expectedResult:
      "Mayor visibilidad ante compradores de vivienda, gerentes financieros, contadores, empresarios y aliados inmobiliarios.",
    insightMilestones: [
      "Semana 6: Publicar Whitepaper 02 (Liquidez empresarial y factoring)",
      "Semana 8: Publicar Caso de Estudio numérico (Costo de esperar el pago de facturas)",
    ],
  },
  {
    period: "Días 61–90",
    title: "Generar oportunidades comerciales recurrentes",
    expectedResult:
      "Consultas calificadas, reuniones de diagnóstico, simulaciones hipotecarias y solicitudes de evaluación en el CRM.",
    insightMilestones: [
      "Semana 10: Realizar Webinar 02 (Factoring en Colombia y RADIAN)",
      "Semana 12: Revisión integral de métricas de alcance, confianza y negocio",
    ],
  },
];

export const FINTERA_MONTH_1_CALENDAR: LinkedinCalendarPostSpec[] = [
  // SEMANA 1: Presentación y posicionamiento
  {
    id: "cal_w1_mon",
    week: 1,
    weekTheme: "Presentación y posicionamiento",
    day: "Lunes",
    categoryBadge: "Marca",
    pillar: "CONFIANZA_OPORTUNIDADES",
    title: "¿Qué hace FINTERA y cómo acompañamos las decisiones de financiación?",
    format: "Carrusel institucional",
    contentType: "TUTORIAL",
    objective:
      "Presentar a FINTERA como aliado estratégico basado en criterio financiero, acompañamiento y transparencia.",
    primarySources: ["Superintendencia Financiera de Colombia (SFC)", "Superintendencia de Sociedades"],
    ctaText: "Conoce nuestras soluciones en finterasoluciones.co",
    ctaUrlWithUtm:
      "/portafolio?utm_source=linkedin&utm_medium=organic&utm_campaign=w1_marca",
    draftOutlineMarkdown: `## ¿Qué hace FINTERA y cómo acompañamos las decisiones de financiación?

En **FINTERA Soluciones Financieras** creemos que una buena decisión financiera comienza con información clara y acompañamiento experto (*Fecha de corte: Octubre 2026*).

### Nuestros 3 atributos diferenciadores
1. **Criterio financiero**: Analizamos necesidades reales, capacidad de endeudamiento y flujo de caja.
2. **Acompañamiento**: Orientamos a compradores de vivienda y empresas durante la preparación documental y evaluación con aliados vigilados por la **Superintendencia Financiera de Colombia (SFC)**.
3. **Transparencia**: Explicamos tasas efectivas anuales (E.A.), seguros, requisitos en **RADIAN (DIAN)** y riesgos sin prometer aprobaciones sin estudio previo.`,
  },
  {
    id: "cal_w1_tue",
    week: 1,
    weekTheme: "Presentación y posicionamiento",
    day: "Martes",
    categoryBadge: "Vivienda",
    pillar: "VIVIENDA_B2C",
    title: "Antes de solicitar un crédito hipotecario, revisa estas 5 variables.",
    format: "Carrusel educativo",
    contentType: "GUIDE",
    objective:
      "Educar a compradores de vivienda sobre capacidad de pago, cuota inicial, plazo, modalidad y costos adicionales.",
    primarySources: ["Superintendencia Financiera de Colombia (SFC)", "Fondo Nacional del Ahorro (FNA)", "DANE"],
    ctaText: "Simula tu crédito de vivienda con criterio financiero",
    ctaUrlWithUtm:
      "/simulador?utm_source=linkedin&utm_medium=organic&utm_campaign=w1_vivienda",
    draftOutlineMarkdown: `## Antes de solicitar un crédito hipotecario en Colombia, revisa estas 5 variables

Con base en los lineamientos de la **Superintendencia Financiera de Colombia (SFC)** y el **Fondo Nacional del Ahorro (FNA)** (*Corte: Octubre 2026*), en **FINTERA** recomendamos verificar estas cinco variables antes de firmar promesa de compraventa:

1. **Relación cuota / ingreso familiar (Límite legal del 30% bajo Ley 546 de 1999)**.
2. **Disponibilidad de cuota inicial (20%–30%) más gastos de escrituración, avalúo y registro**.
3. **Modalidad de amortización: Pesos (cuota fija) vs. UVR (indexada a la inflación del DANE)**.
4. **Costo total mensual incluyendo seguros obligatorios de vida e incendio/terremoto**.
5. **Consistencia entre extractos bancarios, declaración de renta y soportes laborales**.`,
  },
  {
    id: "cal_w1_wed",
    week: 1,
    weekTheme: "Presentación y posicionamiento",
    day: "Miércoles",
    categoryBadge: "Empresas",
    pillar: "FACTORING_B2B",
    title: "Vender más no siempre significa tener más liquidez.",
    format: "Post de análisis",
    contentType: "BLOG_POST",
    objective:
      "Visibilizar el impacto de las ventas a crédito a 60–90 días sobre el capital de trabajo de las pymes en Colombia.",
    primarySources: ["Confecámaras", "OCDE (Financing SMEs 2026)", "DIAN (RADIAN)"],
    ctaText: "Conversemos sobre la liquidez y capital de trabajo de tu empresa",
    ctaUrlWithUtm:
      "/contacto?utm_source=linkedin&utm_medium=organic&utm_campaign=w1_empresas",
    draftOutlineMarkdown: `## Vender más no siempre significa tener más liquidez

Como muestran los estudios de **Confecámaras** y el capítulo Colombia del informe *Financing SMEs and Entrepreneurs 2026* de la **OCDE** (*Corte: Octubre 2026*), el crecimiento acelerado en ventas a crédito puede tensionar la caja cuando los clientes pagan a 60 o 90 días y los costos operativos se cubren de contado.

### Criterio Financiero FINTERA
- Evaluar el ciclo de conversión de efectivo antes de asumir nuevos contratos a plazo.
- Asegurar que las facturas electrónicas cumplan con los eventos de título valor en **RADIAN (DIAN)** para habilitar alternativas legítimas de negociación y liquidez empresarial.`,
  },
  {
    id: "cal_w1_thu",
    week: 1,
    weekTheme: "Presentación y posicionamiento",
    day: "Jueves",
    categoryBadge: "Conversión",
    pillar: "CONFIANZA_OPORTUNIDADES",
    title: "¿Cuándo conviene buscar acompañamiento para evaluar una financiación?",
    format: "Guía breve + llamado a la acción",
    contentType: "BLOG_POST",
    objective:
      "Convertir el interés de la primera semana en solicitudes de evaluación de perfil y consultas calificadas.",
    primarySources: ["Superintendencia Financiera de Colombia (SFC)", "Asobancaria"],
    ctaText: "Solicita una evaluación inicial de tu perfil en FINTERA",
    ctaUrlWithUtm:
      "/credit-request?utm_source=linkedin&utm_medium=organic&utm_campaign=w1_conversion",
    draftOutlineMarkdown: `## ¿Cuándo conviene buscar acompañamiento para evaluar una financiación?

Presentar múltiples solicitudes de crédito sin un filtro técnico previo puede afectar tu historial de consulta en centrales de riesgo y retrasar tu proyecto.

### 3 momentos en los que el acompañamiento de FINTERA marca la diferencia
1. **Antes de separar un inmueble**: Para conocer tu capacidad real de endeudamiento multibanco según tasas vigentes reportadas ante la **Superfinanciera (SFC)** (*Corte: Octubre 2026*).
2. **Cuando tienes ingresos mixtos o eres independiente**: Para estructurar tus extractos y soportes tributarios (**DIAN**) de forma clara.
3. **Cuando tu empresa necesita evaluar alternativas de capital de trabajo**: Con transparencia sobre costos, requisitos y condiciones.`,
  },

  // SEMANA 2: Educación financiera aplicada
  {
    id: "cal_w2_mon",
    week: 2,
    weekTheme: "Educación financiera aplicada",
    day: "Lunes",
    categoryBadge: "Vivienda",
    pillar: "VIVIENDA_B2C",
    title: "Cómo estimar tu capacidad de endeudamiento antes de buscar vivienda.",
    format: "Caso numérico",
    contentType: "CASE_STUDY",
    objective:
      "Enseñar con un ejemplo numérico transparente cómo calcular el monto máximo de cuota mensual e ingreso requerido.",
    primarySources: ["Superintendencia Financiera de Colombia (SFC)", "Banco de la República", "DANE"],
    ctaText: "Calcula tu capacidad en nuestro simulador hipotecario",
    ctaUrlWithUtm:
      "/simulador?utm_source=linkedin&utm_medium=organic&utm_campaign=w2_vivienda",
    draftOutlineMarkdown: `## Caso numérico: Cómo estimar tu capacidad de endeudamiento antes de buscar vivienda

> *Nota de transparencia FINTERA: Simulación con cifras hipotéticas con fines educativos; sujeta a evaluación crediticia individual (Corte de referencia: Octubre 2026, SFC / BanRep).*

- **Paso 1**: Suma los ingresos mensuales fijos demostrables del núcleo familiar.
- **Paso 2**: Aplica la regla prudencial de la Ley 546 de 1999: la primera cuota del crédito hipotecario (incluyendo seguros) no debe exceder el **30% del ingreso mensual**.
- **Paso 3**: Revisa tus compromisos actuales en centrales de riesgo para asegurar que tu flujo de caja neto respalde la operación con holgura.`,
  },
  {
    id: "cal_w2_tue",
    week: 2,
    weekTheme: "Educación financiera aplicada",
    day: "Martes",
    categoryBadge: "Empresas",
    pillar: "FACTORING_B2B",
    title: "Diferencia entre financiar capital de trabajo con deuda y usar factoring.",
    format: "Tabla comparativa en carrusel",
    contentType: "TUTORIAL",
    objective:
      "Explicar las diferencias técnicas entre adquirir un pasivo bancario y negociar un título valor en RADIAN.",
    primarySources: ["DIAN (RADIAN)", "Superintendencia de Sociedades", "Bancóldex"],
    ctaText: "Descarga nuestro Whitepaper de Liquidez Empresarial",
    ctaUrlWithUtm:
      "/insights/whitepaper-liquidez-empresarial-factoring-radian-colombia?utm_source=linkedin&utm_medium=organic&utm_campaign=w2_empresas",
    draftOutlineMarkdown: `## Diferencia entre financiar capital de trabajo con deuda bancaria y usar factoring

Con base en el marco normativo de la **Superintendencia de Sociedades**, **Bancóldex** y la **DIAN (RADIAN)** (*Corte: Octubre 2026*), en **FINTERA** resumimos las diferencias clave para directores financieros y contadores:

- **Naturaleza de la operación**: El préstamo bancario genera nuevo endeudamiento financiero; el factoring anticipa el recaudo de una cuenta por cobrar existente.
- **Foco del análisis de riesgo**: En el crédito tradicional prima el balance del solicitante; en el factoring cobra especial relevancia la calidad crediticia del pagador de la factura y su aceptación en **RADIAN**.`,
  },
  {
    id: "cal_w2_wed",
    week: 2,
    weekTheme: "Educación financiera aplicada",
    day: "Miércoles",
    categoryBadge: "Mercado",
    pillar: "AUTORIDAD_MERCADO",
    title: "Por qué la tasa no es el único costo que debes mirar en una financiación.",
    format: "Post de opinión técnica",
    contentType: "BLOG_POST",
    objective:
      "Posicionar el criterio financiero de FINTERA explicando seguros, avalúos, plazos y costos transaccionales.",
    primarySources: ["Superintendencia Financiera de Colombia (SFC)", "Banco de la República"],
    ctaText: "Lee el análisis completo en FINTERA Insights",
    ctaUrlWithUtm:
      "/insights?utm_source=linkedin&utm_medium=organic&utm_campaign=w2_mercado",
    draftOutlineMarkdown: `## Por qué la tasa de interés no es el único costo que debes mirar en una financiación

Al comparar alternativas publicadas ante la **Superintendencia Financiera de Colombia (SFC)** (*Corte: Octubre 2026*), fijarse exclusivamente en la tasa nominal o efectiva anual puede ocultar costos determinantes:

1. **Primas de seguros asociados** (vida deudor, incendio y terremoto en vivienda).
2. **Costos de originación** (avalúo técnico, estudio de títulos y gastos notariales).
3. **Indexación a la inflación** (comportamiento de la UVR certificada por el **Banco de la República**).`,
  },
  {
    id: "cal_w2_thu",
    week: 2,
    weekTheme: "Educación financiera aplicada",
    day: "Jueves",
    categoryBadge: "Vivienda",
    pillar: "VIVIENDA_B2C",
    title: "Documentos básicos que conviene organizar antes de iniciar tu solicitud.",
    format: "Lista práctica",
    contentType: "GUIDE",
    objective:
      "Entregar una lista accionable para empleados e independientes que acelere su radicación hipotecaria.",
    primarySources: ["Superintendencia Financiera de Colombia (SFC)", "Fondo Nacional del Ahorro (FNA)", "DIAN"],
    ctaText: "Inicia tu estudio de crédito con acompañamiento FINTERA",
    ctaUrlWithUtm:
      "/credit-request?utm_source=linkedin&utm_medium=organic&utm_campaign=w2_documentos",
    draftOutlineMarkdown: `## Lista práctica: Documentos básicos para organizar antes de tu solicitud de vivienda

En **FINTERA Soluciones Financieras** acompañamos a empleados e independientes a estructurar su carpeta documental conforme a los estándares de las entidades vigiladas por la **SFC** (*Corte: Octubre 2026*):

- **Soportes de identidad y estado civil**.
- **Certificación laboral y desprendibles de nómina** (empleados) o **extractos bancarios de 6 meses y RUT DIAN** (independientes).
- **Declaración de renta o certificado de ingresos y retenciones**.`,
  },

  // SEMANA 3:Objeciones y errores frecuentes
  {
    id: "cal_w3_mon",
    week: 3,
    weekTheme: "Objeciones y errores frecuentes",
    day: "Lunes",
    categoryBadge: "Vivienda",
    pillar: "VIVIENDA_B2C",
    title: "4 errores que suelen retrasar el estudio de un crédito de vivienda.",
    format: "Carrusel",
    contentType: "TUTORIAL",
    objective:
      "Prevenir reprocesos en bancos explicando los 4 errores más frecuentes en solicitudes hipotecarias.",
    primarySources: ["Asobancaria", "Camacol (Coordenada Urbana)", "Superfinanciera (SFC)"],
    ctaText: "Evita reprocesos: evalúa tu perfil con FINTERA",
    ctaUrlWithUtm:
      "/simulador?utm_source=linkedin&utm_medium=organic&utm_campaign=w3_errores_vivienda",
    draftOutlineMarkdown: `## 4 errores que suelen retrasar el estudio de un crédito de vivienda en Colombia

Según la experiencia operativa del sector hipotecario (**Asobancaria**, **Camacol** y **SFC**, *Corte: Octubre 2026*), estos cuatro factores explican la mayoría de demoras:

1. **Inconsistencias entre ingresos declarados (DIAN) y movimientos en extractos bancarios**.
2. **Cupos rotativos altos en tarjetas de crédito que reducen la capacidad de endeudamiento**.
3. **Adquirir nuevas deudas de consumo mientras el crédito hipotecario está en estudio**.
4. **No contemplar los tiempos de avalúo comercial y estudio jurídico de títulos**.`,
  },
  {
    id: "cal_w3_tue",
    week: 3,
    weekTheme: "Objeciones y errores frecuentes",
    day: "Martes",
    categoryBadge: "Empresas",
    pillar: "FACTORING_B2B",
    title: "¿Qué revisa una entidad antes de realizar una operación de factoring?",
    format: "Guía paso a paso",
    contentType: "GUIDE",
    objective:
      "Explicar con rigor técnico la validación del pagador, del emisor y de los eventos en RADIAN.",
    primarySources: ["DIAN (RADIAN)", "Superintendencia de Sociedades", "IFC"],
    ctaText: "Consulta nuestra guía de liquidez empresarial",
    ctaUrlWithUtm:
      "/contacto?utm_source=linkedin&utm_medium=organic&utm_campaign=w3_requisitos_factoring",
    draftOutlineMarkdown: `## ¿Qué revisa una entidad antes de realizar una operación de factoring en Colombia?

Bajo el marco normativo de la **DIAN (RADIAN)** y la **Superintendencia de Sociedades** (*Corte: Octubre 2026*), toda evaluación seria de factoring verifica:

1. **Validez del título valor en RADIAN**: Acuse de recibo de la factura electrónica, recibo del bien o servicio y aceptación expresa o tácita.
2. **Capacidad y hábito de pago del deudor comercial (pagador de la factura)**.
3. **Debida diligencia societaria y prevención de riesgos (SAGRILAFT)** tanto del emisor como del pagador.`,
  },
  {
    id: "cal_w3_wed",
    week: 3,
    weekTheme: "Objeciones y errores frecuentes",
    day: "Miércoles",
    categoryBadge: "Marca",
    pillar: "CONFIANZA_OPORTUNIDADES",
    title: "Cómo trabajamos en FINTERA desde el primer contacto hasta la respuesta.",
    format: "Infografía de proceso",
    contentType: "BLOG_POST",
    objective:
      "Transparentar las etapas de atención de FINTERA para generar confianza y reducir la fricción de contacto.",
    primarySources: ["Superintendencia Financiera de Colombia (SFC)"],
    ctaText: "Inicia tu proceso con acompañamiento transparente",
    ctaUrlWithUtm:
      "/credit-request?utm_source=linkedin&utm_medium=organic&utm_campaign=w3_proceso_fintera",
    draftOutlineMarkdown: `## Cómo trabajamos en FINTERA desde el primer contacto hasta la respuesta

Nuestro protocolo de acompañamiento combina tecnología y criterio experto en 4 etapas claras (*Estándares de transparencia SFC, Octubre 2026*):

1. **Diagnóstico inicial de necesidades y capacidad de pago**.
2. **Estructuración y validación preventiva de la carpeta documental**.
3. **Comparación de alternativas y radicación ante entidades aliadas**.
4. **Seguimiento continuo en avalúo, estudio de títulos y desembolso**.`,
  },
  {
    id: "cal_w3_thu",
    week: 3,
    weekTheme: "Objeciones y errores frecuentes",
    day: "Jueves",
    categoryBadge: "Conversión",
    pillar: "CONFIANZA_OPORTUNIDADES",
    title: "Preguntas frecuentes sobre crédito de vivienda y liquidez empresarial.",
    format: "Post interactivo",
    contentType: "BLOG_POST",
    objective:
      "Responder las dudas más frecuentes de la audiencia B2C y B2B y abrir conversaciones privadas calificadas.",
    primarySources: ["Superintendencia Financiera de Colombia (SFC)", "Fondo Nacional del Ahorro (FNA)", "DIAN"],
    ctaText: "Agenda una conversación privada con un especialista FINTERA",
    ctaUrlWithUtm:
      "/contacto?utm_source=linkedin&utm_medium=organic&utm_campaign=w3_faq",
    draftOutlineMarkdown: `## Preguntas frecuentes sobre crédito de vivienda y liquidez empresarial en Colombia

Resolvemos con **transparencia** y **criterio financiero** las consultas más habituales que recibimos en **FINTERA** (*Referencias normativas: SFC, FNA y DIAN, Octubre 2026*):

- **¿Puedo sumar ingresos familiares para solicitar un crédito de vivienda?** Sí, la mayoría de entidades permiten consolidar ingresos del núcleo familiar para fortalecer la capacidad de endeudamiento.
- **¿Solicitar información con FINTERA tiene costo o exige publicar datos en comentarios?** Nunca pedimos información financiera confidencial en comentarios públicos; la evaluación se realiza por canales privados protegidos por Habeas Data.`,
  },

  // SEMANA 4: Autoridad y generación de conversaciones
  {
    id: "cal_w4_mon",
    week: 4,
    weekTheme: "Autoridad y generación de conversaciones",
    day: "Lunes",
    categoryBadge: "Mercado",
    pillar: "AUTORIDAD_MERCADO",
    title: "Qué revisar al comparar dos ofertas de crédito de vivienda.",
    format: "Carrusel comparativo",
    contentType: "TUTORIAL",
    objective:
      "Demostrar autoridad técnica comparando dos ofertas hipotecarias más allá de la tasa nominal.",
    primarySources: ["Superintendencia Financiera de Colombia (SFC)", "Banco de la República"],
    ctaText: "Compara alternativas con nuestro simulador",
    ctaUrlWithUtm:
      "/simulador?utm_source=linkedin&utm_medium=organic&utm_campaign=w4_comparativo",
    draftOutlineMarkdown: `## Qué revisar al comparar dos ofertas de crédito de vivienda en Colombia

Antes de elegir entre dos propuestas de entidades vigiladas por la **Superintendencia Financiera de Colombia (SFC)** (*Corte: Octubre 2026*), en **FINTERA** recomendamos contrastar:

1. **Tasa Efectiva Anual (E.A.) y sistema de amortización (Pesos vs. UVR BanRep)**.
2. **Valor mensual de las pólizas de seguro de vida e incendio/terremoto**.
3. **Porcentaje máximo de financiación aprobado (LTV) y plazo en años**.
4. **Condiciones para abonos extraordinarios a capital sin penalidad (Ley 546 de 1999)**.`,
  },
  {
    id: "cal_w4_tue",
    week: 4,
    weekTheme: "Autoridad y generación de conversaciones",
    day: "Martes",
    categoryBadge: "Empresas",
    pillar: "FACTORING_B2B",
    title: "Cuándo tiene sentido evaluar factoring y cuándo no es la mejor opción.",
    format: "Post de criterio financiero",
    contentType: "BLOG_POST",
    objective:
      "Reforzar la honestidad y transparencia de FINTERA mostrando que el factoring no se recomienda a ciegas.",
    primarySources: ["OCDE (Financing SMEs 2026)", "DIAN (RADIAN)", "Factors Chain International (FCI)"],
    ctaText: "Solicita orientación empresarial en FINTERA",
    ctaUrlWithUtm:
      "/contacto?utm_source=linkedin&utm_medium=organic&utm_campaign=w4_criterio_factoring",
    draftOutlineMarkdown: `## Cuándo tiene sentido evaluar factoring y cuándo no es la mejor opción

El verdadero **criterio financiero** consiste en recomendar una solución solo cuando genera valor real para la empresa (*Fuentes: OCDE 2026, DIAN RADIAN y FCI, Corte: Octubre 2026*):

- **Sí tiene sentido evaluarlo**: Cuando la liquidez anticipada permite cubrir capital de trabajo productivo, aprovechar descuentos por pronto pago o sostener el crecimiento con pagadores corporativos sólidos.
- **No es la mejor opción**: Cuando el margen bruto de la factura es inferior al costo financiero o cuando la factura aún no cuenta con aceptación válida en **RADIAN**.`,
  },
  {
    id: "cal_w4_wed",
    week: 4,
    weekTheme: "Autoridad y generación de conversaciones",
    day: "Miércoles",
    categoryBadge: "Vivienda",
    pillar: "VIVIENDA_B2C",
    title: "Plazo, cuota inicial y tasa: cómo se relacionan entre sí.",
    format: "Ejemplo práctico",
    contentType: "CASE_STUDY",
    objective:
      "Ilustrar matemáticamente el equilibrio entre cuota inicial, plazo y tasa en un crédito de vivienda.",
    primarySources: ["Superintendencia Financiera de Colombia (SFC)", "DANE", "Fondo Nacional del Ahorro (FNA)"],
    ctaText: "Haz tu simulación personalizada en FINTERA",
    ctaUrlWithUtm:
      "/simulador?utm_source=linkedin&utm_medium=organic&utm_campaign=w4_plazo_cuota_tasa",
    draftOutlineMarkdown: `## Ejemplo práctico: Plazo, cuota inicial y tasa — cómo se relacionan entre sí

> *Simulación pedagógica con cifras ilustrativas bajo parámetros públicos de la Superfinanciera (SFC) y DANE (Corte: Octubre 2026).*

- **Mayor cuota inicial**: Reduce el saldo financiado, disminuye el costo total de intereses y facilita cumplir la relación cuota/ingreso del 30%.
- **Plazo más largo (15 a 20 años)**: Reduce la cuota mensual exigible hoy, aunque incrementa el acumulado de intereses y seguros en el tiempo — lo cual puede optimizarse mediante abonos inteligentes a capital.`,
  },
  {
    id: "cal_w4_thu",
    week: 4,
    weekTheme: "Autoridad y generación de conversaciones",
    day: "Jueves",
    categoryBadge: "Conversión",
    pillar: "CONFIANZA_OPORTUNIDADES",
    title: "Hablemos de tu próximo proyecto: vivienda o liquidez para tu empresa.",
    format: "Publicación de cierre mensual",
    contentType: "BLOG_POST",
    objective:
      "Cerrar el primer mes convirtiendo la audiencia educada en oportunidades comerciales calificadas.",
    primarySources: ["Superintendencia Financiera de Colombia (SFC)", "Superintendencia de Sociedades"],
    ctaText: "Conversemos sobre tu necesidad de financiación",
    ctaUrlWithUtm:
      "/contacto?utm_source=linkedin&utm_medium=organic&utm_campaign=w4_cierre_mensual",
    draftOutlineMarkdown: `## Hablemos de tu próximo proyecto: vivienda o liquidez para tu empresa

Durante este mes en **FINTERA Soluciones Financieras** hemos compartido herramientas prácticas respaldadas en fuentes oficiales (**SFC**, **Banco de la República**, **DANE**, **DIAN / RADIAN** y **OCDE**, *Corte: Octubre 2026*) para tomar decisiones financieras informadas.

### Hagamos posible tu próximo proyecto
- **Para personas**: Acompañamiento integral en tu solicitud de **crédito de vivienda o leasing habitacional**.
- **Para empresas**: Orientación especializada en **flujo de caja, capital de trabajo y estructuración de soluciones empresariales**.`,
  },
];

export const FINTERA_WEEKLY_ROUTINE = [
  {
    day: "Lunes",
    focus: "Publicación + prospección",
    action:
      "Publicar el contenido del día. Enviar entre 10 y 15 invitaciones personalizadas a perfiles objetivo (compradores de vivienda, gerentes financieros, contadores y aliados inmobiliarios).",
  },
  {
    day: "Martes",
    focus: "Publicación + interacción",
    action:
      "Publicar contenido educativo. Comentar con criterio financiero en 5 publicaciones del sector inmobiliario, empresarial o financiero colombiano.",
  },
  {
    day: "Miércoles",
    focus: "Publicación + seguimiento",
    action:
      "Publicar contenido enfocado en empresas. Revisar quién interactuó con la página y abrir conversaciones privadas sin discurso agresivo de venta.",
  },
  {
    day: "Jueves",
    focus: "Publicación + conversión",
    action:
      "Publicar pieza orientada a consulta o evaluación. Invitar a reunión de diagnóstico o formulario con enlace UTM.",
  },
  {
    day: "Viernes",
    focus: "Análisis y ajuste",
    action:
      "Revisar métricas en LinkedIn Analytics y el CRM de FINTERA, registrar consultas recibidas y preparar el contenido de la siguiente semana.",
  },
];

export const FINTERA_TARGET_NETWORK = {
  b2cVivienda: [
    "Profesionales en Colombia con interés en compra de vivienda o inversión inmobiliaria",
    "Agentes inmobiliarios, brokers y constructoras",
    "Asesores patrimoniales, abogados inmobiliarios y avalúadores",
  ],
  b2bFactoring: [
    "Gerentes generales y fundadores de pymes en Colombia",
    "Directores financieros (CFOs) y jefes de tesorería / cartera",
    "Contadores públicos, firmas contables y revisores fiscales",
    "Empresas proveedoras de grandes compañías e industria",
  ],
};

export const FINTERA_CONVERSION_FUNNEL = [
  {
    step: 1,
    stage: "Publicación útil en LinkedIn",
    description:
      "Contenido educativo o analítico respaldado en fuentes oficiales (SFC, BanRep, DANE, DIAN/RADIAN, OCDE).",
  },
  {
    step: 2,
    stage: "Interacción o visita al perfil corporativo",
    description:
      "El usuario valida la promesa de marca de FINTERA: criterio financiero, acompañamiento y transparencia.",
  },
  {
    step: 3,
    stage: "Mensaje directo o clic hacia el sitio con UTM",
    description:
      "Redirección trazable hacia /simulador (B2C Vivienda), /credit-request o /contacto (B2B Empresas).",
  },
  {
    step: 4,
    stage: "Formulario breve o conversación inicial",
    description:
      "Captura segura bajo Ley 1581 de Habeas Data (nunca en comentarios públicos).",
  },
  {
    step: 5,
    stage: "Evaluación de la necesidad y radicación en CRM FINTERA",
    description:
      "Asignación automática en el panel administrativo de FINTERA para análisis de viabilidad multibanco o empresarial.",
  },
];

export const FINTERA_EDITORIAL_COMPLIANCE_RULES = [
  {
    id: "rule_1",
    title: "1. Usar fuentes primarias o institucionales",
    description:
      "Respaldar todo análisis con las 14 fuentes oficiales, gremiales y multilaterales (SFC, BanRep, DANE, FNA, DIAN, Supersociedades, Asobancaria, Camacol, Confecámaras, Bancóldex, IFC, OCDE, Banco Mundial, FCI).",
  },
  {
    id: "rule_2",
    title: "2. Indicar fecha de corte y enlace oficial",
    description:
      "Siempre que se citen tasas de interés, inflación, UVR o estadísticas sectoriales, especificar la fecha de corte y la entidad emisora.",
  },
  {
    id: "rule_3",
    title: "3. Separar el dato publicado de la interpretación de FINTERA",
    description:
      "Distinguir explícitamente qué dice la fuente oficial y cuál es la recomendación o lectura técnica de FINTERA.",
  },
  {
    id: "rule_4",
    title: "4. No presentar simulaciones como resultados garantizados",
    description:
      "Los casos prácticos numéricos deben identificarse como ejercicios ilustrativos con supuestos transparentes; jamás inventar testimonios de clientes.",
  },
  {
    id: "rule_5",
    title: "5. Distinguir soluciones activas de soluciones en desarrollo",
    description:
      "No prometer aprobación garantizada, tasas preferenciales sin evaluación de perfil ni liquidez inmediata garantizada. Aclarar el alcance real del portafolio en vivienda y factoring.",
  },
  {
    id: "rule_6",
    title: "6. Proteger la privacidad financiera (Ley 1581 Habeas Data)",
    description:
      "Nunca pedir cédula, NIT, ingresos, extractos ni puntajes de centrales de riesgo en comentarios públicos de LinkedIn.",
  },
];

