# Persistencia Automática del Formulario - FINTERA

## 🎯 Funcionalidad

El formulario de solicitud de crédito ahora cuenta con **persistencia automática de datos** que permite a los usuarios:

- ✅ Continuar llenando el formulario si cierran accidentalmente la página
- ✅ Recuperar datos después de errores de red o fallos del navegador
- ✅ Mantener el progreso durante interrupciones
- ✅ Auto-guardado transparente sin intervención del usuario

## 📋 Características

### Auto-guardado
- Los datos se guardan automáticamente cada **500ms** después del último cambio
- No requiere acción del usuario
- Funciona en segundo plano sin afectar el rendimiento

### Tiempo de Expiración (TTL)
- Los datos guardados expiran automáticamente después de **10 minutos**
- Evita que datos antiguos persistan indefinidamente
- Se elimina automáticamente al detectar expiración

### Recuperación Automática
- Al recargar la página, los datos se restauran automáticamente
- Banner visual confirma la recuperación de datos
- Toast notification muestra tiempo restante de expiración

### Limpieza Automática
- Los datos se eliminan automátamente después de:
  - Envío exitoso del formulario
  - Expiración del TTL (10 minutos)
  - Usuario cierra el banner de notificación (opcional)

## 🔧 Implementación Técnica

### Hook: `useFormPersistence`

**Ubicación**: `app/hooks/useFormPersistence.ts`

**API**:
```typescript
const { 
  clearFormData,      // Función para limpiar datos guardados
  hasStoredData,      // Boolean: si hay datos restaurados
  getTimeRemaining    // Función: minutos restantes antes de expiración
} = useFormPersistence({
  watch,              // React Hook Form watch
  setValue,           // React Hook Form setValue
  onRestore           // Callback ejecutado al restaurar datos
});
```

### Almacenamiento

**LocalStorage Keys**:
- `fintera_credit_form_draft` - Datos del formulario + timestamp
- `fintera_credit_form_timestamp` - Timestamp de último guardado

**Estructura de datos**:
```typescript
{
  data: Partial<CreditRequestFormData>,
  timestamp: number  // Date.now()
}
```

### Flujo de Funcionamiento

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuario llena formulario                                │
│    ↓                                                        │
│ 2. Cada cambio → debounce 500ms → guarda en localStorage   │
│    ↓                                                        │
│ 3. Usuario recarga página                                  │
│    ↓                                                        │
│ 4. useFormPersistence verifica localStorage                │
│    ↓                                                        │
│ 5. Si hay datos válidos (< 10 min)                        │
│    → Restaura campos con setValue                          │
│    → Muestra banner de recuperación                        │
│    → Ejecuta onRestore callback                            │
│    ↓                                                        │
│ 6. Usuario completa y envía formulario                     │
│    → clearFormData() limpia localStorage                   │
└─────────────────────────────────────────────────────────────┘
```

## 🎨 Interfaz de Usuario

### Banner de Recuperación

**Apariencia**:
- Gradiente verde-cyan con borde
- Ícono de check animado
- Mensaje descriptivo
- Botón de cierre (X)
- Auto-desaparece después de 8 segundos

**Ubicación**: Justo debajo del título "Solicitud de Crédito"

**Contenido**:
```
┌───────────────────────────────────────────────────────┐
│ ✓  Datos recuperados automáticamente                 │
│                                                       │
│    Hemos restaurado la información que guardaste     │
│    anteriormente. Los datos se guardan               │
│    automáticamente mientras completas el formulario. │
└───────────────────────────────────────────────────────┘
```

### Toast Notification

**Mensaje**: "Datos recuperados. Expiran en X minuto(s)."
**Duración**: 5 segundos
**Tipo**: Success (verde)

## 🔒 Seguridad y Privacidad

### Datos Locales
- Los datos se almacenan **solo en el navegador del usuario**
- No se transmiten a servidores hasta el envío final
- No son accesibles desde otros dominios o sitios web

### Expiración Automática
- TTL de 10 minutos previene acumulación de datos antiguos
- Limpieza automática al enviar formulario exitosamente

### Sin Datos Sensibles Persistentes
- Los datos se tratan como "draft" temporal
- La única copia "oficial" está en la base de datos después del envío

## 📱 Compatibilidad

### Navegadores
- ✅ Chrome/Edge (v90+)
- ✅ Firefox (v88+)
- ✅ Safari (v14+)
- ✅ Opera (v76+)

### Dispositivos
- ✅ Desktop (Windows, macOS, Linux)
- ✅ Mobile (iOS Safari, Android Chrome)
- ✅ Tablets

### Requisitos
- JavaScript habilitado
- LocalStorage disponible (no modo privado con restricciones)

## 🧪 Testing

### Escenarios de Prueba

1. **Auto-guardado básico**:
   - Llenar varios campos
   - Esperar 500ms
   - Verificar en DevTools → Application → Local Storage

2. **Recuperación después de recarga**:
   - Llenar formulario parcialmente
   - Recargar página (F5)
   - Verificar que datos aparezcan
   - Verificar banner de notificación

3. **Expiración TTL**:
   - Llenar formulario
   - Cambiar timestamp en localStorage a hace 11 minutos
   - Recargar página
   - Verificar que no se restauren datos

4. **Limpieza post-envío**:
   - Llenar formulario completamente
   - Enviar con datos válidos
   - Verificar que localStorage esté vacío
   - Recargar página nueva
   - Verificar que no hay datos recuperados

### DevTools Debugging

```javascript
// Ver datos guardados
JSON.parse(localStorage.getItem('fintera_credit_form_draft'))

// Ver timestamp
new Date(parseInt(localStorage.getItem('fintera_credit_form_timestamp')))

// Limpiar manualmente
localStorage.removeItem('fintera_credit_form_draft')
localStorage.removeItem('fintera_credit_form_timestamp')

// Simular datos antiguos
localStorage.setItem('fintera_credit_form_timestamp', 
  Date.now() - (11 * 60 * 1000) // 11 minutos atrás
)
```

## 🚀 Casos de Uso

### Usuario se distrae
1. Usuario empieza a llenar formulario
2. Recibe llamada telefónica, cierra navegador
3. 5 minutos después regresa
4. Datos están listos para continuar

### Error de red
1. Usuario está en WiFi inestable
2. Llena formulario completamente
3. Click en "Enviar" → error 500
4. Recarga página
5. Datos siguen ahí, puede reintentar

### Comparación de opciones
1. Usuario llena formulario con un monto
2. Quiere comparar con otro monto
3. Abre calculadora en nueva pestaña
4. Regresa a formulario
5. Datos intactos

### Batería baja en móvil
1. Usuario en móvil llena formulario
2. Teléfono se apaga (batería agotada)
3. Carga teléfono y regresa
4. Dentro de 10 minutos, datos recuperables

## 📊 Métricas y Monitoreo

### Eventos a Trackear (opcional con Analytics)

```javascript
// Datos restaurados
analytics.track('form_data_restored', {
  fields_count: Object.keys(restoredData).length,
  time_elapsed_minutes: elapsed
});

// Datos expirados
analytics.track('form_data_expired', {
  time_since_save: minutes
});

// Auto-guardado ejecutado
analytics.track('form_auto_saved', {
  fields_filled: count
});
```

## 🐛 Troubleshooting

### "Los datos no se guardan"
- Verificar que LocalStorage esté habilitado
- Confirmar que no está en modo incógnito con restricciones
- Revisar límites de cuota de localStorage (5-10MB típicamente)

### "Banner no aparece al recargar"
- Verificar que hayan pasado menos de 10 minutos
- Confirmar que hay datos en localStorage (DevTools)
- Revisar consola por errores de JavaScript

### "Datos incorrectos después de restaurar"
- Limpiar localStorage manualmente
- Recargar página
- Comenzar de nuevo

## 🔄 Actualizaciones Futuras

### Mejoras Potenciales
- [ ] Aumentar/reducir TTL según preferencia del usuario
- [ ] Sincronización con cuenta de usuario (si se implementa login)
- [ ] Múltiples drafts guardados (historial)
- [ ] Encriptación de datos sensibles en localStorage
- [ ] Compresión de datos para ahorrar espacio
- [ ] Advertencia visual cuando quedan < 2 minutos de expiración

## 📞 Soporte

Para reportar bugs o sugerir mejoras relacionadas con la persistencia del formulario:
- **Email**: soporte@finterasoluciones.co
- **Ubicación del código**: `app/hooks/useFormPersistence.ts`
- **Página**: `/credit-request`

---

**Última actualización**: 2025-11-06  
**Versión**: 1.0.0  
**Autor**: PlanMaestro Development Team
