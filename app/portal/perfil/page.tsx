"use client";

import React, { useEffect, useState } from "react";
import {
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Key,
  Users,
  FileText,
  Lock,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ClientProfile {
  fullName: string;
  documentType: string;
  documentNumberMasked: string;
  email: string;
  phoneMasked: string;
}

interface ProfileData {
  isLinked: boolean;
  client: ClientProfile | null;
  applicationsCount: number;
}

export default function PerfilPortalPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const res = await fetch("/api/portal/dashboard");
        if (!res.ok) throw new Error("No se pudo cargar el perfil del cliente.");
        const json = await res.json();
        setData({
          isLinked: json.isLinked,
          client: json.client,
          applicationsCount: json.applications?.length || 0,
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Perfil y Seguridad de la Cuenta
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Información de identidad vinculada, permisos de acceso y políticas de privacidad aplicadas.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
          <Clock className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-3" />
          <p className="text-sm">Cargando perfil de seguridad...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <p>{error}</p>
        </div>
      ) : !data?.isLinked ? (
        <Card className="border-amber-200 bg-amber-50/30">
          <CardHeader>
            <div className="flex items-center gap-2 text-amber-700">
              <AlertCircle className="w-5 h-5" />
              <CardTitle className="text-lg">Cuenta No Vinculada</CardTitle>
            </div>
            <CardDescription className="text-slate-600">
              Su sesión actual de Clerk aún no está asociada a ningún cliente canonical en Fintera.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">
              Para vincular su expediente, regrese a la pantalla principal del Portal e introduzca su documento
              de identidad para completar el desafío de verificación OTP.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Identidad Vinculada */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <CardTitle className="text-base font-bold text-slate-900">
                    Identidad Bancaria Verificada
                  </CardTitle>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Activo y Vinculado
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Nombre Completo
                  </span>
                  <span className="text-sm font-bold text-slate-900">{data.client?.fullName}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Documento de Identidad
                  </span>
                  <span className="text-sm font-bold font-mono text-slate-900">
                    {data.client?.documentType} {data.client?.documentNumberMasked}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Correo Electrónico Registrado
                  </span>
                  <span className="text-sm font-medium text-slate-800">{data.client?.email}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Teléfono Celular Enmascarado
                  </span>
                  <span className="text-sm font-medium font-mono text-slate-800">
                    {data.client?.phoneMasked}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Políticas de Privacidad y Modelo de Acceso ABAC */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-700" />
                <CardTitle className="text-sm font-bold text-slate-900">
                  Políticas de Seguridad y Privacidad Aplicadas
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p>
                  <strong>Aislamiento Estricto por Objeto (OWASP API1 / BOLA):</strong> Solo tiene acceso a los
                  expedientes donde figura formalmente como titular o cotitular acreditado.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p>
                  <strong>Segregación Titular / Cotitular:</strong> Los cotitulares solo pueden consultar y
                  cargar sus propios requisitos documentales personales (ej. cédula, desprendibles), sin
                  acceso cruzado no autorizado a información del titular.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p>
                  <strong>Cifrado y Antivirus en Tiempo Real:</strong> Todos los documentos cargados se
                  inspeccionan con el motor ClamAV y se protegen en almacenamiento cifrado AES-256-GCM.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
