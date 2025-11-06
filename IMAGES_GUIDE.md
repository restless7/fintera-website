# 📷 Guía de Imágenes para FINTERA Website

Este documento describe las imágenes necesarias para el sitio web FINTERA y sus especificaciones técnicas.

## 📁 Estructura de Carpetas

Todas las imágenes deben ubicarse en la carpeta `public/images/` del proyecto:

```
public/
└── images/
    ├── hero-dashboard.png
    ├── creditos-hero.jpg
    ├── og-image.jpg
    ├── creditos-og.jpg
    ├── portafolio-og.jpg
    ├── nosotros-og.jpg
    └── contacto-og.jpg
```

---

## 🖼️ Imágenes Requeridas

### 1. **Hero Dashboard** (Página Principal)
- **Archivo**: `hero-dashboard.png`
- **Dimensiones**: 600x600 px (1:1 ratio)
- **Formato**: PNG con transparencia (preferido) o JPG
- **Descripción**: Imagen principal del hero section mostrando un panel de créditos o dashboard financiero
- **Estilo**: Mockup moderno, limpio, con colores azul (#0EA5E9) y cyan (#06B6D4)
- **Ubicación en sitio**: Página principal (/)

### 2. **Créditos Hero Banner**
- **Archivo**: `creditos-hero.jpg`
- **Dimensiones**: 1920x1080 px (16:9 ratio)
- **Formato**: JPG optimizado
- **Descripción**: Banner principal para la página de créditos mostrando conceptos de vivienda, vehículo, inversión
- **Estilo**: Profesional, financiero, con personas o imágenes conceptuales de bienes
- **Ubicación en sitio**: /creditos

### 3. **Open Graph Image (Principal)**
- **Archivo**: `og-image.jpg`
- **Dimensiones**: 1200x630 px (1.91:1 ratio)
- **Formato**: JPG optimizado
- **Descripción**: Imagen para compartir en redes sociales (Facebook, Twitter, LinkedIn)
- **Contenido**: Logo FINTERA + texto "Créditos Inteligentes en Colombia" + elementos visuales de marca
- **Ubicación en sitio**: Metadata global (todas las páginas por defecto)

### 4. **Open Graph - Créditos**
- **Archivo**: `creditos-og.jpg`
- **Dimensiones**: 1200x630 px
- **Formato**: JPG
- **Descripción**: OG image específica para la página de créditos
- **Contenido**: "Créditos de Vivienda, Vehículo, Libre Inversión y Libranza"

### 5. **Open Graph - Portafolio**
- **Archivo**: `portafolio-og.jpg`
- **Dimensiones**: 1200x630 px
- **Formato**: JPG
- **Descripción**: OG image para página de portafolio de servicios
- **Contenido**: "Servicios Financieros Integrales"

### 6. **Open Graph - Nosotros**
- **Archivo**: `nosotros-og.jpg`
- **Dimensiones**: 1200x630 px
- **Formato**: JPG
- **Descripción**: OG image para página sobre FINTERA
- **Contenido**: "Transformando el Acceso al Crédito en Colombia"

### 7. **Open Graph - Contacto**
- **Archivo**: `contacto-og.jpg`
- **Dimensiones**: 1200x630 px
- **Formato**: JPG
- **Descripción**: OG image para página de contacto
- **Contenido**: "Contáctanos - Asesores Especializados"

---

## 🎨 Especificaciones de Diseño

### Paleta de Colores FINTERA
- **Primary (Fintera Blue)**: `#0EA5E9`
- **Accent (Cyan)**: `#06B6D4`
- **Secondary (Purple)**: `#8B5CF6`
- **Dark**: `#0F172A`
- **Light Background**: `#F8FAFC`

### Tipografía
- **Font**: Inter (Google Fonts)
- **Estilo**: Modern, clean, sans-serif

### Estilo Visual
- ✅ Gradientes suaves azul-cyan
- ✅ Sombras sutiles
- ✅ Formas redondeadas (border-radius)
- ✅ Profesional y confiable
- ✅ Minimalista y limpio
- ❌ Evitar stock photos genéricas
- ❌ Evitar saturación excesiva de colores

---

## 🔧 Optimización de Imágenes

### Herramientas Recomendadas
1. **TinyPNG** (https://tinypng.com/) - Compresión sin pérdida de calidad
2. **Squoosh** (https://squoosh.app/) - Conversor y optimizador avanzado
3. **ImageOptim** (Mac) - Optimizador local

### Targets de Peso
- **Hero images**: < 200 KB
- **OG images**: < 150 KB
- **Icons/logos**: < 50 KB

### Formatos
- **JPG**: Para fotografías y banners con muchos colores
- **PNG**: Para gráficos con transparencias, logos, ilustraciones
- **WebP**: Alternativa moderna (Next.js puede convertir automáticamente)

---

## 📝 Checklist de Implementación

- [ ] Crear carpeta `public/images/` si no existe
- [ ] Diseñar/obtener imagen `hero-dashboard.png`
- [ ] Diseñar/obtener imagen `creditos-hero.jpg`
- [ ] Crear 5 imágenes Open Graph (og-image.jpg, creditos-og.jpg, portafolio-og.jpg, nosotros-og.jpg, contacto-og.jpg)
- [ ] Optimizar todas las imágenes con TinyPNG o similar
- [ ] Verificar dimensiones correctas de cada imagen
- [ ] Subir imágenes a `public/images/`
- [ ] Verificar que las imágenes cargan correctamente en desarrollo
- [ ] Probar compartir URLs en Facebook/Twitter para validar OG images

---

## 🚀 Implementación Técnica

Las imágenes ya están referenciadas en el código mediante Next.js `<Image>` component:

```tsx
<Image
  src="/images/hero-dashboard.png"
  alt="FINTERA - Panel de Créditos Financieros"
  width={600}
  height={600}
  priority
  placeholder="blur"
/>
```

### Ventajas del Next.js Image Component
- ✅ Lazy loading automático
- ✅ Optimización automática de formatos (WebP, AVIF)
- ✅ Responsive images
- ✅ Prevención de Cumulative Layout Shift (CLS)
- ✅ Placeholder blur durante la carga

---

## 📞 Soporte

Para preguntas sobre las especificaciones de imágenes o ayuda con el diseño:
- **Email técnico**: dev@fintera.com.co
- **Email diseño**: design@fintera.com.co

---

**Última actualización**: Enero 2025  
**Versión**: 1.0
