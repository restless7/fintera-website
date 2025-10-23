# Fintera Credit Application System

This directory contains the complete credit application system for Fintera, built as a multi-step form with comprehensive validation and database persistence.

## 🌟 Features

- **Multi-step form flow**: 5 intuitive steps with progress tracking
- **Dynamic validation**: Real-time form validation using Zod
- **Conditional logic**: Form adapts based on user selections (e.g., occupation type)
- **Responsive design**: Mobile-first approach with Fintera branding
- **Accessibility**: WCAG-compliant with proper ARIA attributes
- **Progress persistence**: Form state maintained across steps
- **Type safety**: Full TypeScript support throughout

## 🏗 Architecture

```
/app/credits/apply/
├── page.tsx                 # Main form container with step management
├── schema.ts                # Zod validation schemas and types
└── components/
    ├── FormProgress.tsx     # Progress bar and step indicators
    ├── StepCreditDetails.tsx # Step 1: Credit type, amount, term
    ├── StepPersonalInfo.tsx  # Step 2: Personal information
    ├── StepEmploymentInfo.tsx # Step 3: Employment and financial data
    ├── StepReferences.tsx    # Step 4: Personal/family/commercial references
    └── Summary.tsx          # Step 5: Review and consent

/app/api/credits/apply/
└── route.ts                 # API endpoint for form submission

/prisma/
└── schema.prisma           # Database schema for credit applications
```

## 📝 Form Steps

### Step 1: Credit Details
- Credit type selection (Vivienda, Vehículo, Libranza, etc.)
- Requested amount with currency formatting
- Term in months with validation

### Step 2: Personal Information
- Full name fields with proper Colombian naming conventions
- Document information (C.C., C.E., Passport)
- Contact information with phone formatting
- Demographic information (optional)

### Step 3: Employment & Financial Information
- Occupation type with conditional fields
- Financial details (income, expenses, assets, liabilities)
- Tax information with conditional foreign tax residency

### Step 4: References
- Personal reference (always required)
- Family reference (always required)
- Commercial reference (only for independientes)

### Step 5: Summary & Consent
- Complete application review
- Data processing authorization
- Information veracity declaration

## 🎨 Design System

The form uses Fintera's brand colors and components:
- Primary: `fintera-600` (#0284c7)
- Success states with green accents
- Error states with red validation messages
- Consistent card layouts with shadows and rounded corners
- Progress indicators with gradient backgrounds

## 🔒 Validation

Comprehensive validation includes:
- **Field validation**: Length, format, and type checking
- **Cross-field validation**: Income vs expenses, age requirements
- **Conditional validation**: Required fields based on selections
- **Business rules**: Minimum amounts, maximum terms, etc.

### Key Validation Rules
- Minimum age: 18 years
- Credit amounts: $1,000,000 - $2,000,000,000 COP
- Terms: 6 - 360 months
- Phone numbers: Colombian format validation
- Email: Standard email validation
- Documents: Format validation by type

## 🗄 Database Schema

The `CreditApplication` model stores all form data with proper field types and constraints:
- Unique constraint on `documentNumber`
- Proper date handling for birth dates and document issue dates
- Optional fields properly handled as nullable
- Status tracking for application workflow

## 🚀 Setup Instructions

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Setup database**:
   ```bash
   # Copy environment file
   cp .env.example .env
   
   # Update DATABASE_URL in .env
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Access the form**:
   Navigate to `http://localhost:3004/credits/apply`

## 🧪 Testing

To test the form thoroughly:

1. **Valid submission**: Complete all steps with valid data
2. **Validation testing**: Try invalid inputs to see error messages  
3. **Conditional logic**: Test independiente vs asalariado flows
4. **Foreign tax residency**: Test conditional field requirements
5. **Mobile responsiveness**: Test on different screen sizes

## 🔧 Customization

### Adding New Credit Types
1. Update `CreditTypeEnum` in `schema.ts`
2. Add label in `CREDIT_TYPE_LABELS`
3. Update icon mapping in `StepCreditDetails.tsx`
4. Update validation rules if needed

### Adding New Fields
1. Update the relevant schema in `schema.ts`
2. Add field to the appropriate step component
3. Update the Prisma schema
4. Run database migration

### Styling Changes
All styling uses Tailwind CSS with Fintera's design tokens. Key classes:
- `fintera-*`: Brand colors
- `rounded-xl`: Consistent border radius
- `shadow-sm`: Subtle shadows for cards

## 📊 Performance

The form is optimized for performance:
- **Lazy validation**: Only validates current step
- **Minimal re-renders**: Optimized state management
- **Progressive enhancement**: Works without JavaScript for basic functionality
- **Code splitting**: Each step component loads only when needed

## 🛡 Security

Security measures implemented:
- **Input validation**: Both client and server-side
- **SQL injection prevention**: Prisma ORM with parameterized queries
- **XSS prevention**: Proper input sanitization
- **Rate limiting**: Can be added to API routes
- **HTTPS**: Enforced in production

## 🔄 Future Enhancements

Potential improvements:
- **Save & resume**: Allow users to save progress and continue later
- **Document upload**: Add file upload for required documents
- **Electronic signature**: Digital signature for legal consent
- **Credit scoring**: Integration with external scoring APIs
- **Email notifications**: Automated confirmation and status updates
- **Admin dashboard**: Back-office interface for application management

## 📞 Support

For questions or issues:
- Check the component comments for implementation details
- Review validation schemas for business rules
- Check API route for database interaction patterns
- Refer to Prisma docs for database operations

---

**Built with ❤️ for Fintera's Credit Application System**