# Credit Request Form - Documentation

## Overview
A comprehensive one-page credit request form inspired by the "Formato Único de Vinculación – Persona Natural" with Fintera's modern fintech aesthetic.

## Features

### ✨ User Experience
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Progress Tracking**: Visual progress bar showing completion status
- **Inline Validation**: Real-time field validation with helpful error messages
- **Conditional Fields**: Smart form that shows/hides fields based on user input
- **Success Screen**: Beautiful confirmation page after successful submission

### 🎨 Design System
- **Fintera Branding**: Blue gradient (#0048FF to #00D4FF)
- **Clean Layout**: Card-based sections with floating shadows
- **Smooth Animations**: Framer Motion fade/slide transitions
- **Accessible**: WCAG compliant with proper labels and focus states

### 🔒 Security & Validation
- **Zod Schema Validation**: Server and client-side validation
- **Type Safety**: Full TypeScript implementation
- **Data Sanitization**: Automatic input cleaning
- **Unique Constraints**: Prevents duplicate submissions by document number

## Form Sections

### 1. Solicitud de Producto
- Office code (optional)
- Product selection (checkboxes): Savings account, checking account, credit, CDT, credit card, portfolio, leasing, investment fund
- Product detail (text)
- Requested amount and term in months
- Portfolio selection

### 2. Datos Personales
- Full name (first, second, last names)
- Document information (type, number, issue place/date)
- Nationality and birth information
- Residence information
- Contact details (email, mobile, preferred contact methods)
- Gender and ethnic group
- PEP status
- Family in bank indicator

### 3. Datos Laborales
- Occupation (employee, independent, retired, other)
- Economic activity (for independent workers)
- CIIU code

### 4. Referencias
- Personal reference
- Family reference
- Commercial reference (required for independent workers)

### 5. Información Financiera
- Tax declaration status
- Monthly income and expenses
- Other income sources
- Total assets and liabilities
- Foreign tax residency information

## Technical Architecture

### Database Schema
```prisma
model CreditRequest {
  id                String   @id @default(cuid())
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  // ... all form fields
  status            String   @default("submitted")
  @@map("credit_requests")
}
```

### API Endpoint
**POST** `/api/credit-request`

#### Request Body
All fields from the credit request schema (see validation schema)

#### Response (Success - 201)
```json
{
  "success": true,
  "message": "Solicitud de crédito recibida exitosamente",
  "id": "clx123..."
}
```

#### Response (Error - 400/409/500)
```json
{
  "success": false,
  "message": "Error message",
  "errors": [] // Only for validation errors
}
```

### Components

#### Form Components (`app/components/form/`)
- **SectionCard**: Card wrapper with title and description
- **InputField**: Text/number/date input with validation
- **SelectField**: Dropdown with custom styling
- **CheckboxGroup**: Multiple checkbox selection

#### UI Components (`app/components/ui/`)
- **SubmitButton**: Gradient button with loading state

### Validation Schema (`app/lib/validation/creditRequestSchema.ts`)
- Comprehensive Zod schema with conditional validation
- Custom refinements for dependent fields
- Type-safe form data with TypeScript inference

## Setup Instructions

### 1. Database Migration
```bash
npm run db:push
# or
npm run db:migrate
```

### 2. Environment Variables
Ensure `DATABASE_URL` is set in `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/fintera"
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Access the Form
Navigate to: `http://localhost:3004/credit-request`

## Deployment Checklist

- [ ] Run database migrations in production
- [ ] Set up proper database backups
- [ ] Configure environment variables
- [ ] Test form submission end-to-end
- [ ] Verify email notifications (if implemented)
- [ ] Set up monitoring for form submissions
- [ ] Configure CORS if needed
- [ ] Enable rate limiting on API endpoint

## Future Enhancements

### Potential Features
1. **Multi-step Navigation**: Previous/Next buttons between sections
2. **Auto-save Draft**: Save form progress to localStorage
3. **File Upload**: Document upload functionality
4. **Email Notifications**: Send confirmation emails
5. **Admin Dashboard**: View and manage submissions
6. **PDF Generation**: Export submission as PDF
7. **Analytics**: Track form completion rates
8. **A/B Testing**: Test different form layouts

### Backend Workflow
1. **Status Management**: Implement workflow states (submitted → under_review → approved/rejected)
2. **Email Integration**: SendGrid/AWS SES for notifications
3. **Document Verification**: Integrate with ID verification services
4. **Credit Scoring**: Connect to credit bureau APIs
5. **CRM Integration**: Sync with customer management systems

## Maintenance

### Regular Tasks
- Monitor form submission rates
- Review validation error patterns
- Update form fields as requirements change
- Optimize database queries for submissions list
- Clean up old/abandoned submissions

### Testing
- Unit tests for validation schema
- Integration tests for API endpoint
- E2E tests for form submission flow
- Accessibility testing with screen readers
- Performance testing for large form datasets

## Support & Troubleshooting

### Common Issues

**Form not submitting**
- Check browser console for validation errors
- Verify all required fields are filled
- Check network tab for API errors

**Duplicate document error**
- User already has a submission with that document number
- Check database for existing record
- Consider implementing "Update existing application" flow

**Date field issues**
- Ensure dates are in YYYY-MM-DD format
- Check browser date picker compatibility
- Verify date is being converted to Date object properly

## Credits
Built with:
- Next.js 15
- TypeScript
- Tailwind CSS
- Prisma
- React Hook Form
- Zod
- Framer Motion
- Sonner (toast notifications)

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Maintained by**: Fintera Development Team
