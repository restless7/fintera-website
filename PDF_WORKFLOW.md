# PDF Auto-Fill & Signature Workflow - Fintera Credit Request Form

## 📋 Overview

Complete automated PDF generation system that fills the official SSF credit request form with user data after submission.

---

## 🎯 Features

✅ **Automatic PDF Generation**: Fill PDF form fields with submitted data  
✅ **Download Modal**: Beautiful Fintera-styled modal for document download  
✅ **Instructions Modal**: Detailed guidance on signing and submitting  
✅ **UTF-8 Support**: Handles Spanish characters (ñ, á, é, etc.)  
✅ **Flattened PDF**: Non-editable final document  
✅ **Smart Filename**: `Solicitud_Fintera_[Name]_[Date].pdf`

---

## 🏗️ Architecture

### **1. PDF Template**
- **Location**: `public/forms/SSF-vigente-marzo-2025.pdf`
- **Total Fields**: 95 fillable fields
  - 64 Text Fields
  - 16 Checkboxes
  - 15 Radio Groups

### **2. Field Mapping**
- **File**: `app/lib/pdf/fieldMapping.ts`
- **Function**: `mapFormDataToPdfFields()`
- Maps 40+ form data fields to PDF field names

### **3. API Route**
- **Endpoint**: `POST /api/fill-form`
- **Library**: pdf-lib
- **Process**:
  1. Load PDF template
  2. Map form data to PDF fields
  3. Fill all fields
  4. Flatten form (make non-editable)
  5. Return PDF as downloadable blob

### **4. UI Components**
- **DownloadPrompt**: Modal after successful submission
- **InstructionsModal**: How to sign and submit guidance
- **Helper**: Download utilities in `app/lib/pdf/downloadHelper.ts`

---

## 📊 User Flow

```
1. User completes credit request form
        ↓
2. Form validated (React Hook Form + Zod)
        ↓
3. Data saved to PostgreSQL via Prisma
        ↓
4. ✨ Download modal appears ✨
        ↓
5. User clicks "Descargar documento"
        ↓
6. PDF generated with filled data
        ↓
7. Browser downloads: Solicitud_Fintera_Juan_Perez_2025-01-05.pdf
        ↓
8. User views instructions for physical signature
        ↓
9. User signs, scans, and sends via email/WhatsApp
```

---

## 🔧 Implementation Details

### **API Route: `/api/fill-form/route.ts`**

```typescript
POST /api/fill-form
Body: CreditRequestFormData (JSON)
Response: application/pdf (binary)
Headers:
  - Content-Type: application/pdf
  - Content-Disposition: attachment; filename="..."
  - Content-Length: [size]
```

**Key Functions:**
- Load template with `fs.readFileSync()`
- Fill fields with `pdf-lib`
- Flatten with `form.flatten()`
- Return as `NextResponse` with PDF bytes

### **Field Mapping Logic**

```typescript
// Example mapping
{
  "Primer nombre": data.firstName,
  "Cuenta de ahorros": data.productsRequested?.includes("cuenta_ahorros") ? "Yes" : "Off",
  "Genero": mapGender(data.gender),
  // ... 90+ more fields
}
```

**Special Handling:**
- Dates: Split into day, month, year
- Checkboxes: "Yes" to check, "Off" to uncheck
- Radio buttons: Map to exact PDF option labels
- Arrays: Iterate and check multiple boxes

### **Download Modal Props**

```typescript
<DownloadPrompt
  isOpen={boolean}
  onClose={() => void}
  onDownload={() => Promise<void>}
  onViewInstructions={() => void}
  userName={string}
/>
```

**Features:**
- Gradient header (Fintera blue → cyan)
- 4-step instructions list
- Two action buttons
- Animated entrance with framer-motion

### **Instructions Modal**

Shows:
- ⚠️ Physical signature requirement
- 📧 Email: solicitudes@fintera.com
- 📱 WhatsApp: +57 300 123 4567
- ☎️ Phone: (601) 234 5678
- 💡 Document quality tips

---

## 📁 File Structure

```
fintera-website/
├── app/
│   ├── api/
│   │   └── fill-form/
│   │       └── route.ts                 # PDF generation API
│   ├── components/
│   │   ├── form/
│   │   │   ├── SectionCard.tsx
│   │   │   ├── InputField.tsx
│   │   │   └── ... (form components)
│   │   └── ui/
│   │       ├── DownloadPrompt.tsx       # Download modal
│   │       ├── InstructionsModal.tsx    # Instructions modal
│   │       └── SubmitButton.tsx
│   ├── credit-request/
│   │   └── page.tsx                     # Main form (updated)
│   └── lib/
│       ├── pdf/
│       │   ├── fieldMapping.ts          # Data → PDF mapping
│       │   └── downloadHelper.ts        # Download utilities
│       └── validation/
│           └── creditRequestSchema.ts
├── public/
│   └── forms/
│       └── SSF-vigente-marzo-2025.pdf   # Template
└── scripts/
    ├── extract-pdf-fields.ts            # Field extractor
    └── pdf-fields.json                  # Extracted fields
```

---

## 🧪 Testing

### **Test Checklist**

- [ ] Form submission saves to database
- [ ] Download modal appears after submission
- [ ] PDF generates with all fields filled
- [ ] Spanish characters render correctly (ñ, á, etc.)
- [ ] Checkboxes check/uncheck properly
- [ ] Radio buttons select correct options
- [ ] File downloads with correct name format
- [ ] Instructions modal shows all channels
- [ ] Success screen appears after download
- [ ] Modal animations work smoothly

### **Test Data Sample**

```json
{
  "firstName": "Juan",
  "firstLastName": "Pérez",
  "documentType": "CC",
  "documentNumber": "1234567890",
  "email": "juan.perez@example.com",
  "mobileNumber": "3001234567",
  // ... (complete form data)
}
```

### **Run PDF Field Extractor**

```bash
npx tsx scripts/extract-pdf-fields.ts
```

Output: List of all 95 PDF fields with types

---

## 🚀 Deployment

### **Environment Setup**

No additional environment variables needed.

### **Build Command**

```bash
npm run build
```

### **Verify Template Exists**

```bash
ls public/forms/SSF-vigente-marzo-2025.pdf
```

### **Database Migration**

```bash
npm run db:push
```

---

## 📝 Field Mapping Reference

### **Product Selection (Checkboxes)**
- cuenta_ahorros → "Cuenta de ahorros"
- cuenta_corriente → "Cuenta corriente"
- credito → "Crédito"
- cdt → "CDT"
- tarjeta_credito → "Tarjeta de crédito"
- portafolio → "Portafolio"
- leasing → "Leasing"

### **Contact Methods (Checkboxes)**
- llamada → "Llamada telefónica"
- correo → "Correo electrónico2"
- whatsapp → "WhatsApp"
- sms → "Mensaje de texto"

### **Document Types (Radio)**
- CC → "Cédula de Ciudadanía"
- RC → "Registro Civil"
- CE → "Cédula de Extranjería"
- TI → "Tarjeta de Identidad"
- PAS → "Pasaporte"

### **Gender (Radio)**
- femenino → "Femenino"
- masculino → "Masculino"
- transexual → "Transexual"
- no_binario → "No binario"

### **Occupation (Radio)**
- asalariado → "Asalariado"
- independiente → "Independiente"
- pensionado → "Pensionado"
- otro → "Otro"

### **Date Fields**
Split into three fields:
- birthDate → "Día nac", "Mes nac", "Año nac"
- documentIssueDate → "Día exp", "Mes exp", "Año exp"
- requestDate → "Dia", "Mes", "Año"

---

## 🔒 Security Considerations

✅ **Form Flattening**: PDF fields locked after generation  
✅ **Server-Side Generation**: PDF created on server, not client  
✅ **Input Sanitization**: Data validated before PDF generation  
✅ **No Sensitive Storage**: PDF not stored permanently (optional MinIO integration available)

---

## 🛠️ Maintenance

### **Adding New Fields**

1. Extract field names:
   ```bash
   npx tsx scripts/extract-pdf-fields.ts
   ```

2. Update mapping in `app/lib/pdf/fieldMapping.ts`:
   ```typescript
   "New PDF Field Name": data.newFormField
   ```

3. Test with sample data

### **Updating PDF Template**

1. Replace `public/forms/SSF-vigente-marzo-2025.pdf`
2. Re-run field extractor
3. Update field mapping
4. Test all fields

### **Changing Filename Format**

Edit `generateFileName()` in `/api/fill-form/route.ts`:
```typescript
function generateFileName(data: any): string {
  // Custom logic here
  return `Custom_Format_${data.field}.pdf`;
}
```

---

## 🐛 Troubleshooting

### **PDF Fields Not Filling**

**Issue**: Fields appear empty in generated PDF  
**Solution**:
- Check exact field name in PDF (case-sensitive)
- Verify data type matches (text, checkbox, radio)
- Check for special characters in field names

### **UTF-8 Characters Not Displaying**

**Issue**: Spanish characters show as � or boxes  
**Solution**:
- Ensure PDF template has embedded fonts
- Use `String(fieldValue)` before setting text
- Verify pdf-lib version supports UTF-8

### **Download Not Triggering**

**Issue**: Modal shows but download doesn't start  
**Solution**:
- Check browser console for errors
- Verify Content-Disposition header
- Test blob creation with `window.URL.createObjectURL()`

### **Radio Buttons Not Selecting**

**Issue**: Radio options don't select in PDF  
**Solution**:
- Extract exact option labels from PDF
- Match mapping values exactly (case-sensitive)
- Wrap in try-catch to log failed selections

---

## 📚 Dependencies

```json
{
  "pdf-lib": "^1.17.1",
  "react-hook-form": "^7.51.3",
  "zod": "^3.25.76",
  "framer-motion": "^11.18.2",
  "lucide-react": "^0.525.0"
}
```

---

## 🎨 UI/UX Features

### **Download Modal**
- Gradient header matching Fintera branding
- Green success indicator
- 4-step process guide
- Two action buttons (download / instructions)
- File format note at bottom

### **Instructions Modal**
- Amber warning for physical signature
- 4 submission channels with icons:
  - 📧 Email
  - 💬 WhatsApp
  - ☎️ Phone
  - 📤 Portal (coming soon)
- Quality tips for document photos
- Clickable contact links

### **Animations**
- Modal entrance: scale + fade
- Backdrop blur on modal open
- Smooth button hover states
- Toast notifications for actions

---

## ✅ Completion Checklist

- [x] PDF template added to public/forms/
- [x] Field extractor script created
- [x] 95 PDF fields extracted and documented
- [x] Field mapping configuration complete
- [x] API route `/api/fill-form` implemented
- [x] Download helper utilities created
- [x] DownloadPrompt modal component built
- [x] InstructionsModal component built
- [x] Form submission flow updated
- [x] Modals integrated into form page
- [ ] **Testing with real data** (pending)
- [ ] Production deployment

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Status**: ✅ Ready for Testing
