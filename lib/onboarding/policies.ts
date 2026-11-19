import { PUBLIC_CONTACT } from "@/lib/public-contact";
import {
  QUICK_PRIVACY_VERSION,
  SERVICE_DECLARATION_VERSION,
  PROCESSING_CONSENT_VERSION,
  LEGACY_PROCESSING_CONSENT_VERSION,
} from "./contracts";

export const ONBOARDING_POLICIES = {
  privacySource: {
    versionLabel: "Enero 2025",
    repositoryCommit: "6c987e767049d76d96e5c35a935d351e75b42e1f",
    sourceFile: "app/legal/privacidad/page.tsx",
    sourceSha256:
      "7d3bb0fbf456fe4fe7c8d3357347e9d82f54f585ef9e4c07c4113941056d40ff",
  },
  privacyUrl: "/legal/privacidad",
  termsUrl: "/legal/terminos",
  quick: {
    version: QUICK_PRIVACY_VERSION,
    text: `Autorizo a FINTERA a recopilar y tratar los datos de este registro para atender mi interés en servicios financieros, conservar mi registro y permitirme continuar con una cuenta. Puedo conocer, actualizar y rectificar mis datos y ejercer los demás derechos de la Política de Privacidad en privacidad@fintera.com.co o ${PUBLIC_CONTACT.phoneDisplay}. Esta autorización no es consentimiento de mercadeo ni autoriza consultas a centrales de riesgo o radicación ante bancos.`,
  },
  declaration: {
    version: SERVICE_DECLARATION_VERSION,
    text: "Solicito a FINTERA orientación e intermediación en servicios financieros respecto del producto y monto que confirmo en esta solicitud. Declaro que la información revisada es veraz. Entiendo que FINTERA no es una entidad financiera, no otorga créditos ni decide su aprobación. Este registro no es una aprobación ni una radicación bancaria.",
  },
  processing: {
    version: PROCESSING_CONSENT_VERSION,
    text: `Autorizo expresamente a FINTERA a tratar los datos de esta solicitud para revisarla, orientarme sobre el servicio solicitado y comunicarme su estado, conforme a la Política de Privacidad. Puedo conocer, actualizar y rectificar mis datos y ejercer los demás derechos indicados en dicha política en privacidad@fintera.com.co o ${PUBLIC_CONTACT.phoneDisplay}. Esta autorización es independiente de la solicitud de servicio; no incluye mercadeo, consulta a centrales de riesgo ni radicación bancaria.`,
  },
  legacyProcessing: {
    version: LEGACY_PROCESSING_CONSENT_VERSION,
    text: "Autorizo expresamente el tratamiento de los datos que suministro a FINTERA para registrar y gestionar esta solicitud conforme a su Política de Privacidad. Esta aceptación no es autorización de mercadeo ni sustituye las autorizaciones específicas que correspondan.",
  },
} as const;
