# 🗄️ Setup de Base de Datos para FINTERA

## ✅ Estado Actual (Temporal)

El formulario **YA FUNCIONA** con un bypass temporal:
- ✅ Validación de datos
- ✅ Generación de PDF
- ✅ Descarga de PDF
- ⚠️ NO guarda en base de datos (temporal)

**Deployment actual**: El formulario funciona completamente, solo falta conectar la base de datos.

---

## 🎯 Próximos Pasos: Configurar Base de Datos Real

### Opción 1: Vercel Postgres (Recomendado)

#### Ventajas
- ✅ Integración nativa con Vercel
- ✅ Auto-configura variables de entorno
- ✅ Región optimizada
- ✅ Fácil de escalar

#### Pasos

1. **Ir al Dashboard de Vercel**:
   ```
   https://vercel.com/restless7s-projects/fintera-website/stores
   ```

2. **Crear Database**:
   - Click en "Create Database"
   - Selecciona "Postgres"
   - Nombre: `fintera-production`
   - Región: `us-east-1` o `sao1` (Sao Paulo - más cercano a Colombia)
   - Plan: Hobby (Gratis)
   - Click "Create"

3. **Conectar al Proyecto**:
   - La UI preguntará: "Connect to project?"
   - Selecciona: `fintera-website`
   - Environment: `Production`, `Preview`, `Development`
   - Click "Connect"

4. **Configurar Prisma**:
   ```bash
   # Pull las nuevas variables de entorno
   cd /home/sebastiangarcia/planmaestro-ecosystem/packages/fintera-website
   vercel env pull .env.local
   
   # Push el schema a la nueva DB
   npm run db:push
   
   # Verificar que funciona
   npm run db:studio
   ```

5. **Remover el Bypass Temporal**:
   
   En `app/api/credit-request/route.ts`, eliminar estas líneas:
   
   ```typescript
   // BORRAR ESTAS LÍNEAS (22-41):
   // TEMPORARY: Skip database save until DATABASE_URL is configured
   // TODO: Remove this bypass and enable DB save once Vercel Postgres is setup
   const useDatabaseSave = process.env.DATABASE_URL && 
                           !process.env.DATABASE_URL.includes('user:pass@host') &&
                           !process.env.DATABASE_URL.includes('localhost');
   
   if (!useDatabaseSave) {
     console.log("[Credit Request] Database save skipped (using temporary bypass)");
     return NextResponse.json(
       {
         success: true,
         message: "Solicitud de crédito recibida exitosamente",
         id: `temp-${Date.now()}-${validatedData.documentNumber}`,
         note: "Su solicitud ha sido procesada. Descargue el PDF para continuar."
       },
       { status: 201 }
     );
   }
   ```

6. **Deploy Final**:
   ```bash
   git add .
   git commit -m "feat: enable database save with Vercel Postgres"
   git push origin main
   ```

---

### Opción 2: Neon.tech (Alternativa Rápida)

#### Ventajas
- ✅ Más rápido de configurar
- ✅ Tier gratuito generoso (512 MB, auto-scaling)
- ✅ Excelente para desarrollo
- ✅ Branching de base de datos

#### Pasos

1. **Crear Cuenta**:
   - Ve a: https://neon.tech
   - Sign in con GitHub

2. **Crear Proyecto**:
   - Click "New Project"
   - Name: `fintera-production`
   - Postgres version: `16`
   - Region: `US East (Ohio)` o `AWS US East`
   - Click "Create Project"

3. **Copiar Connection String**:
   - Neon te mostrará la connection string automáticamente
   - Formato: `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/fintera?sslmode=require`
   - Copia completa la URL

4. **Configurar en Vercel**:
   ```bash
   cd /home/sebastiangarcia/planmaestro-ecosystem/packages/fintera-website
   
   # Remover la vieja DATABASE_URL
   vercel env rm DATABASE_URL production
   
   # Agregar la nueva de Neon
   vercel env add DATABASE_URL production
   # Pega la connection string de Neon cuando te lo pida
   
   # También para Preview y Development
   vercel env add DATABASE_URL preview
   vercel env add DATABASE_URL development
   ```

5. **Push Schema**:
   ```bash
   # Actualizar .env.local con la nueva URL
   echo "DATABASE_URL='tu-neon-connection-string'" > .env.local
   
   # Push schema a Neon
   npm run db:push
   ```

6. **Remover Bypass y Deploy** (mismos pasos que Opción 1, paso 5-6)

---

### Opción 3: Supabase (Alternativa con Extras)

#### Ventajas
- ✅ Postgres + Auth + Storage + Realtime
- ✅ Tier gratuito: 500 MB database
- ✅ Dashboard SQL muy amigable
- ✅ Extensiones Postgres pre-instaladas

#### Pasos

1. **Crear Proyecto**:
   - Ve a: https://supabase.com
   - Sign in con GitHub
   - New Project:
     - Name: `fintera-production`
     - Database Password: (genera uno seguro)
     - Region: `South America (São Paulo)` ← Más cercano!
     - Click "Create"

2. **Obtener Connection String**:
   - Project Settings → Database
   - Scroll a "Connection string"
   - Tab: "URI"
   - Connection pooling: **Disabled** (para Prisma)
   - Copia la URI

3. **Configurar en Vercel** (mismo proceso que Neon, Opción 2, paso 4-6)

---

## 🧪 Verificar que Todo Funciona

Después de configurar la base de datos:

### 1. Test Local
```bash
# Pull env vars
vercel env pull .env.local

# Test Prisma
npm run db:push
npm run db:studio
# Abre http://localhost:5555
```

### 2. Test en Producción
```bash
# Llenar formulario en:
https://www.finterasoluciones.co/credit-request

# Verificar en Prisma Studio o Dashboard de DB que se guardó
```

### 3. Verificar Logs
```bash
vercel ls
vercel logs https://fintera-website-xxx.vercel.app
# Buscar: "[Credit Request] Saving to database..."
# Debe aparecer, NO "[Credit Request] Database save skipped"
```

---

## 📊 Comparación de Opciones

| Feature | Vercel Postgres | Neon | Supabase |
|---------|----------------|------|----------|
| Integración Vercel | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Setup Speed | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Free Tier Size | 256 MB | 512 MB | 500 MB |
| Region Latam | ✅ São Paulo | ❌ US Only | ✅ São Paulo |
| Extras | - | Branching | Auth/Storage |
| Precio Pro | $20/mo | $19/mo | $25/mo |

**Recomendación**: 
- **Vercel Postgres** si quieres la mejor integración
- **Neon** si quieres setup más rápido
- **Supabase** si piensas usar auth/storage después

---

## 🚨 Troubleshooting

### Error: "Can't reach database"
```bash
# Verificar que la URL es correcta
vercel env pull .env.local
cat .env.local | grep DATABASE_URL

# Debe ser algo como:
# postgresql://user:real_password@real-host.aws.neon.tech:5432/fintera?sslmode=require

# NO debe ser:
# postgresql://user:pass@host:5432/fintera
# postgresql://user:pass@localhost:5432/fintera
```

### Error: "SSL required"
Agregar `?sslmode=require` al final de la URL:
```bash
vercel env rm DATABASE_URL production
vercel env add DATABASE_URL production
# Pega: postgresql://...?sslmode=require
```

### Error: "Invalid connection string"
Vercel Postgres usa formato especial. Si usas Vercel Postgres, debe incluir:
```
POSTGRES_URL="postgres://..."
POSTGRES_PRISMA_URL="postgres://..."  ← Usa esta para Prisma
```

---

## ✅ Checklist Final

Una vez configurada la base de datos:

- [ ] Base de datos creada (Vercel/Neon/Supabase)
- [ ] `DATABASE_URL` configurada en Vercel (Production, Preview, Development)
- [ ] `npm run db:push` ejecutado exitosamente
- [ ] Bypass temporal removido de `app/api/credit-request/route.ts`
- [ ] Git commit y push
- [ ] Deployment exitoso en Vercel
- [ ] Test del formulario en https://www.finterasoluciones.co/credit-request
- [ ] Verificación en Prisma Studio que los datos se guardan
- [ ] Logs de Vercel muestran "Saving to database..."

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs: `vercel logs [deployment-url]`
2. Verifica DATABASE_URL: `vercel env pull .env.local`
3. Prueba conexión local: `npm run db:push`

**Estado actual del proyecto**: El formulario funciona al 100%, solo falta persistencia en base de datos.

---

**Última actualización**: Noviembre 2025  
**Status**: ⚠️ Temporal Bypass Activo - Configurar DB para completar
