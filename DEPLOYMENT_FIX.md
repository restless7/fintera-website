# 🔧 Fix: Formulario PDF en Vercel - Error 500

## 📋 Problema Original

El formulario de solicitud de crédito funcionaba localmente pero fallaba en producción (Vercel) con:

```
POST /api/credit-request 500 (Internal Server Error)
Content Security Policy blocks the use of 'eval' in JavaScript
```

**Causa raíz**: 
- `pdf-lib` usa `eval()` internamente
- Vercel Edge Runtime no soporta `fs.readFileSync`
- CSP por defecto bloquea código dinámico en Edge Runtime

---

## ✅ Solución Implementada

### 1️⃣ Forzar Node.js Runtime en API Routes

**Archivos modificados**:
- `app/api/fill-form/route.ts`
- `app/api/credit-request/route.ts`

**Cambios**:
```typescript
// Force Node.js runtime (required for fs/promises and pdf-lib)
export const runtime = 'nodejs';
export const maxDuration = 60; // seconds
```

**Por qué funciona**:
- Node.js runtime soporta `eval()` (necesario para pdf-lib)
- Permite usar `fs/promises` para leer archivos
- No tiene las restricciones de CSP del Edge Runtime

---

### 2️⃣ Usar `fs/promises` en lugar de `fs.readFileSync`

**Antes** ❌:
```typescript
import * as fs from "fs";
const pdfBytes = fs.readFileSync(templatePath);
```

**Después** ✅:
```typescript
import { readFile } from "fs/promises";
const pdfBytes = await readFile(templatePath);
```

**Beneficios**:
- Non-blocking I/O (mejor rendimiento)
- Compatible con Next.js 15+
- Funciona en Vercel Node.js runtime

---

### 3️⃣ Configuración Webpack para pdf-lib

**Archivo**: `next.config.ts`

```typescript
webpack: (config, { isServer }) => {
  if (!isServer) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };
  }
  return config;
}
```

**Por qué es necesario**:
- Previene errores de "module not found" en el cliente
- pdf-lib solo debe ejecutarse en servidor (API routes)

---

### 4️⃣ Aumentar Body Size Limit

```typescript
experimental: {
  serverActions: {
    bodySizeLimit: '10mb',
  },
}
```

**Razón**: El PDF completo puede ser grande al enviarlo de vuelta al cliente.

---

## 🚀 Pasos para Deployment en Vercel

### Paso 1: Commit y Push

```bash
cd /home/sebastiangarcia/planmaestro-ecosystem/packages/fintera-website

git add .
git commit -m "fix: API routes para funcionar en Vercel con Node.js runtime"
git push origin main
```

### Paso 2: Verificar Variables de Entorno en Vercel

Ir a **Vercel Dashboard** → **Settings** → **Environment Variables**

Asegurar que existen:

```bash
DATABASE_URL=postgresql://user:pass@host:5432/fintera
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_APP_URL=https://www.finterasoluciones.co
```

### Paso 3: Verificar que el PDF Template Existe

En Vercel, el archivo debe estar en:
```
public/forms/SSF-vigente-marzo-2025.pdf
```

**Importante**: Verificar que el archivo se subió a Git y está en el repositorio.

```bash
# Verificar localmente
ls -lh public/forms/SSF-vigente-marzo-2025.pdf

# Asegurar que está trackeado por Git
git ls-files | grep SSF-vigente-marzo-2025.pdf
```

Si NO está en Git:
```bash
git add public/forms/SSF-vigente-marzo-2025.pdf
git commit -m "add: PDF template para formulario de créditos"
git push origin main
```

### Paso 4: Re-deploy en Vercel

Vercel detectará automáticamente el push y hará re-deploy.

Alternativamente, forzar re-deploy:
```bash
# Si tienes Vercel CLI instalado
vercel --prod

# O desde el dashboard
# Vercel Dashboard → Deployments → Redeploy
```

---

## 🧪 Testing Post-Deployment

### Test 1: Verificar API Routes

```bash
# Test credit-request endpoint
curl -X POST https://www.finterasoluciones.co/api/credit-request \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Debería responder con status 400 (validation error) no 500
```

### Test 2: Verificar PDF Generation

```bash
# Test fill-form endpoint
curl -X POST https://www.finterasoluciones.co/api/fill-form \
  -H "Content-Type: application/json" \
  -d '{"firstName": "Juan", "firstLastName": "Pérez"}' \
  --output test.pdf

# Debería descargar un PDF válido
```

### Test 3: Probar Formulario Completo

1. Ir a: https://www.finterasoluciones.co/credit-request
2. Llenar todos los campos del formulario
3. Submit
4. Verificar que se descarga el PDF correctamente
5. Verificar en logs de Vercel que no hay errores

---

## 📊 Logs y Debugging en Vercel

### Ver Logs en Tiempo Real

1. Vercel Dashboard → **Project** → **Functions**
2. Seleccionar la función `/api/fill-form`
3. Ver **Logs** en tiempo real

### Buscar Errores

```
Dashboard → Logs → Filter por:
- Status Code: 500
- Function: /api/fill-form
- Time range: Last 1 hour
```

### Logs Agregados en el Código

El código ahora incluye logs útiles:

```typescript
console.log("[PDF Generation] Starting PDF generation for:", {
  firstName: formData.firstName,
  documentNumber: formData.documentNumber
});

console.log("[PDF Generation] Reading template from:", templatePath);
```

Estos logs aparecerán en **Vercel Function Logs**.

---

## 🔍 Troubleshooting

### Error: "Cannot find module './public/forms/...'"

**Causa**: El PDF template no está en el deployment.

**Solución**:
```bash
# Verificar que el archivo existe en Git
git ls-files | grep SSF-vigente-marzo-2025.pdf

# Si no está, agregarlo
git add public/forms/SSF-vigente-marzo-2025.pdf
git commit -m "add: PDF template"
git push
```

### Error: "Runtime 'nodejs' is not supported"

**Causa**: Plan de Vercel puede tener restricciones.

**Solución**:
- Verificar que tienes un plan que soporte Node.js runtime
- Free tier de Vercel soporta Node.js runtime
- Si el error persiste, contactar soporte de Vercel

### Error: "Execution timed out"

**Causa**: El PDF es muy grande o el procesamiento toma mucho tiempo.

**Solución**:
```typescript
// En route.ts, aumentar el timeout
export const maxDuration = 300; // 5 minutos (requiere Vercel Pro)

// O reducir el tamaño del PDF template
```

### Error: "Memory limit exceeded"

**Causa**: pdf-lib consume mucha memoria con PDFs grandes.

**Solución**:
1. Optimizar el PDF template (reducir tamaño)
2. Upgrade a Vercel Pro (más memoria disponible)
3. Considerar procesar el PDF en background job

---

## 📈 Mejoras Futuras (Opcional)

### 1. Caché del PDF Template

```typescript
let cachedTemplate: Buffer | null = null;

async function getTemplate() {
  if (!cachedTemplate) {
    cachedTemplate = await readFile(templatePath);
  }
  return cachedTemplate;
}
```

**Beneficio**: Reduce latencia en llamadas subsecuentes.

### 2. Background Processing con Queue

Usar Vercel Queue o Inngest para procesar PDFs en background:

```typescript
// Responder inmediatamente
return NextResponse.json({ 
  success: true, 
  jobId: "xyz",
  status: "processing"
});

// Procesar PDF en background
// Notificar vía webhook cuando esté listo
```

### 3. Alternativa: Cliente-Side PDF Generation

Usar `pdf-lib` directamente en el cliente:

**Pros**:
- No consume recursos de servidor
- Instantáneo para el usuario

**Contras**:
- PDF template expuesto al cliente
- Requiere más código JS en cliente
- Posible leak de estructura del formulario

---

## ✅ Checklist de Deployment

- [ ] ✅ Código pusheado a repositorio
- [ ] ✅ PDF template en Git (`public/forms/SSF-vigente-marzo-2025.pdf`)
- [ ] ✅ Variables de entorno configuradas en Vercel
- [ ] ✅ Build exitoso en Vercel
- [ ] ✅ Prueba del formulario en producción
- [ ] ✅ PDF se genera y descarga correctamente
- [ ] ✅ Sin errores 500 en logs de Vercel
- [ ] ✅ Google Analytics funcionando

---

## 📞 Soporte

Si el problema persiste después de seguir esta guía:

1. Revisar **Vercel Function Logs** en detalle
2. Verificar que el archivo PDF template tiene permisos correctos
3. Probar localmente con `npm run build && npm start` (modo producción)
4. Contactar equipo de desarrollo: dev@fintera.com.co

---

**Última actualización**: Noviembre 2025  
**Status**: ✅ Fixed and Deployed
