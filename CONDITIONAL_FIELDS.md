# Campos Condicionales - Formulario de Solicitud de Crédito

## Resumen
El formulario implementa campos dinámicos que se muestran u ocultan basándose en las respuestas del usuario, mejorando la experiencia y asegurando que solo se recopile información relevante.

---

## 📋 Campo 3: Datos Laborales

### Ocupación (Campo Base)
**Opciones disponibles:**
- ✅ Asalariado
- ✅ Independiente
- ✅ Pensionado
- ✅ Otro

---

### ⚡ Condición 1: Si selecciona "Asalariado" o "Pensionado"

**Campos que aparecen:**

```
┌─────────────────────────────────────────────┐
│ Nombre de la empresa *                     │
│ ┌─────────────────────────────────────────┐ │
│ │ Nombre de la empresa o entidad         │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**Validación:**
- ✅ Campo requerido
- ✅ Debe contener texto (no puede estar vacío)
- ❌ Error mostrado: "Por favor especifique el nombre de la empresa"

**Implementación:**
```typescript
// En el formulario:
{(occupation === "asalariado" || occupation === "pensionado") && (
  <InputField
    label="Nombre de la empresa"
    {...register("companyName")}
    error={errors.companyName?.message}
    placeholder="Nombre de la empresa o entidad"
    required
  />
)}

// En el schema de validación:
.refine((data) => {
  if (data.occupation === "asalariado" || data.occupation === "pensionado") {
    return data.companyName && data.companyName.trim().length > 0;
  }
  return true;
}, {
  message: "Por favor especifique el nombre de la empresa",
  path: ["companyName"]
})
```

---

### ⚡ Condición 2: Si selecciona "Otro"

**Campos que aparecen:**

```
┌─────────────────────────────────────────────┐
│ Especifique su ocupación *                  │
│ ┌─────────────────────────────────────────┐ │
│ │ Describa su ocupación                   │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**Validación:**
- ✅ Campo requerido
- ✅ Debe contener texto (no puede estar vacío)
- ❌ Error mostrado: "Por favor especifique su ocupación"

**Implementación:**
```typescript
// En el formulario:
{occupation === "otro" && (
  <InputField
    label="Especifique su ocupación"
    {...register("otherOccupationDetail")}
    error={errors.otherOccupationDetail?.message}
    placeholder="Describa su ocupación"
    required
  />
)}

// En el schema de validación:
.refine((data) => {
  if (data.occupation === "otro") {
    return data.otherOccupationDetail && data.otherOccupationDetail.trim().length > 0;
  }
  return true;
}, {
  message: "Por favor especifique su ocupación",
  path: ["otherOccupationDetail"]
})
```

---

### ⚡ Condición 2: Si selecciona "Independiente"

**Campos que aparecen:**

```
┌─────────────────────────────────────────────┐
│ Actividad Económica Principal               │
│ ┌─────────────────────────────────────────┐ │
│ │ Describa su actividad económica         │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Código CIIU                                 │
│ ┌─────────────────────────────────────────┐ │
│ │ Código de Clasificación Industrial      │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**Validación:**
- ⚠️ Campos opcionales (no requeridos)
- ℹ️ Recomendados para trabajadores independientes

**Implementación:**
```typescript
{occupation === "independiente" && (
  <>
    <InputField
      label="Actividad Económica Principal"
      {...register("mainEconomicActivity")}
      error={errors.mainEconomicActivity?.message}
      placeholder="Describa su actividad económica"
    />
    <InputField
      label="Código CIIU"
      {...register("ciiuCode")}
      error={errors.ciiuCode?.message}
      placeholder="Código de Clasificación Industrial"
    />
  </>
)}
```

---

## 📋 Campo 4: Referencias

### Referencias Base (Siempre visibles)
1. **Referencia Personal** - Siempre requerida
2. **Referencia Familiar** - Siempre requerida

---

### ⚡ Condición 3: Si Ocupación = "Independiente"

**Campo adicional que aparece:**

```
┌─────────────────────────────────────────────────────────┐
│ 🔵 Referencia Comercial (Requerida)                    │
│                                                          │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Nombre Completo *                                  │ │
│ │ ┌────────────────────────────────────────────────┐ │ │
│ │ │                                                │ │ │
│ │ └────────────────────────────────────────────────┘ │ │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│ │ Ciudad *     │ │ Depto. *     │ │ Teléfono *   │    │
│ │              │ │              │ │              │    │
│ └──────────────┘ └──────────────┘ └──────────────┘    │
└─────────────────────────────────────────────────────────┘
```

**Validación:**
- ✅ Todos los campos son requeridos
- ✅ Nombre completo mínimo 2 caracteres
- ✅ Ciudad y departamento mínimo 2 caracteres
- ✅ Teléfono mínimo 10 dígitos
- ❌ Error mostrado: "Referencia comercial es requerida para trabajadores independientes"

**Implementación:**
```typescript
// En el formulario:
{occupation === "independiente" && (
  <div className="p-4 bg-blue-50 rounded-xl space-y-4">
    <h3 className="font-semibold text-gray-900">Referencia Comercial</h3>
    <InputField
      label="Nombre Completo"
      {...register("commercialReferenceName")}
      error={errors.commercialReferenceName?.message}
      required
    />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <InputField label="Ciudad" {...register("commercialReferenceCity")} required />
      <InputField label="Departamento" {...register("commercialReferenceDept")} required />
      <InputField label="Teléfono" type="tel" {...register("commercialReferencePhone")} required />
    </div>
  </div>
)}

// En el schema de validación:
.refine((data) => {
  if (data.occupation === "independiente") {
    return (
      data.commercialReferenceName &&
      data.commercialReferenceCity &&
      data.commercialReferenceDept &&
      data.commercialReferencePhone
    );
  }
  return true;
}, {
  message: "Referencia comercial es requerida para trabajadores independientes",
  path: ["commercialReferenceName"]
})
```

---

## 🎨 Indicadores Visuales

### Colores de Fondo
- **Gris claro** (`bg-gray-50`): Referencias estándar (Personal y Familiar)
- **Azul claro** (`bg-blue-50`): Referencia Comercial (solo independientes)

### Diseño Responsivo
- **Móvil**: Campos apilados verticalmente
- **Tablet/Desktop**: Grid de 3 columnas para ciudad, departamento y teléfono

---

## 🔄 Flujo de Usuario

### Escenario 1: Usuario Asalariado
```
1. Selecciona "Asalariado"
   ↓
2. Aparece campo "Nombre de la empresa" (obligatorio)
   ↓
3. Debe especificar el nombre de la empresa
   ↓
4. Sección 4 → Solo ve Referencia Personal y Familiar
```

### Escenario 2: Usuario Pensionado
```
1. Selecciona "Pensionado"
   ↓
2. Aparece campo "Nombre de la empresa" (obligatorio)
   ↓
3. Debe especificar el nombre de la entidad (fondo de pensiones, empresa anterior, etc.)
   ↓
4. Sección 4 → Solo ve Referencia Personal y Familiar
```

### Escenario 3: Usuario Independiente
```
1. Selecciona "Independiente"
   ↓
2. Aparece "Actividad Económica Principal" y "Código CIIU"
   ↓
3. Sección 4 → Ve Referencia Personal, Familiar y Comercial
   ↓
4. Debe completar Referencia Comercial (obligatoria)
```

### Escenario 4: Usuario con Ocupación "Otro"
```
1. Selecciona "Otro"
   ↓
2. Aparece campo "Especifique su ocupación" (obligatorio)
   ↓
3. Debe describir su ocupación
   ↓
4. Sección 4 → Solo ve Referencia Personal y Familiar
```

---

## 🗄️ Campos en Base de Datos

```sql
-- Campos nuevos agregados:
companyName              String?  -- Para asalariado/pensionado
otherOccupationDetail    String?  -- Para ocupación "otro"

-- Campos existentes condicionales:
mainEconomicActivity     String?  -- Para independientes
ciiuCode                 String?  -- Para independientes
commercialReferenceName  String?  -- Para independientes
commercialReferenceCity  String?  -- Para independientes
commercialReferenceDept  String?  -- Para independientes
commercialReferencePhone String?  -- Para independientes
```

---

## ✅ Checklist de Validación

### Para Ocupación = "Asalariado" o "Pensionado"
- [x] Campo "Nombre de la empresa" aparece
- [x] Campo es requerido
- [x] Validación en cliente (React Hook Form)
- [x] Validación en servidor (Zod schema)
- [x] Se guarda en base de datos

### Para Ocupación = "Otro"
- [x] Campo "Especifique su ocupación" aparece
- [x] Campo es requerido
- [x] Validación en cliente (React Hook Form)
- [x] Validación en servidor (Zod schema)
- [x] Se guarda en base de datos

### Para Ocupación = "Independiente"
- [x] Campos de actividad económica aparecen
- [x] Referencia Comercial es requerida en Sección 4
- [x] Validación condicional funciona
- [x] Error claro si falta información
- [x] Se guarda todo en base de datos

---

## 📱 Pruebas Recomendadas

1. **Test 1**: Seleccionar "Asalariado" → Verificar campo "Nombre de la empresa" aparece
2. **Test 2**: Intentar enviar sin completar "Nombre de la empresa" siendo asalariado
3. **Test 3**: Seleccionar "Pensionado" → Verificar campo "Nombre de la empresa" aparece
4. **Test 4**: Seleccionar "Otro" → Verificar campo "Especifique su ocupación" aparece
5. **Test 5**: Intentar enviar sin completar "Especifique su ocupación"
6. **Test 6**: Seleccionar "Independiente" → Verificar aparecen 3 referencias
7. **Test 7**: Intentar enviar sin Referencia Comercial siendo independiente
8. **Test 8**: Cambiar de "Independiente" a "Asalariado" → Verificar campos cambian dinámicamente
9. **Test 9**: Cambiar de "Asalariado" a "Otro" → Verificar campo empresa desaparece
10. **Test 10**: Verificar que todos los datos se guardan correctamente en DB

---

**Última actualización**: Enero 2025  
**Estado**: ✅ Implementado y funcional
