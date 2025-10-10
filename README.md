# Fintera Website

A professional fintech website built with Next.js 15, TypeScript, and TailwindCSS. Features modern design, smooth animations, and conversion-focused user experience.

## 🌟 Features

- **Modern Fintech Design**: Clean, professional interface with gradient accents
- **Responsive Layout**: Optimized for desktop, tablet, and mobile devices
- **Smooth Animations**: Framer Motion powered interactions and transitions
- **Lead Capture**: Conversion-optimized signup forms and CTAs
- **Professional Sections**:
  - Hero with interactive financial dashboard
  - Feature showcase with stats
  - Trust & security section
  - How it works timeline
  - Social proof testimonials
  - Lead capture CTA

## 🚀 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS v3
- **Animations**: Framer Motion
- **Icons**: Heroicons
- **UI Components**: Custom Radix UI components

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Navigate to the project directory:
```bash
cd packages/fintera-website
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3004](http://localhost:3004) in your browser

### Available Scripts

- `npm run dev` - Start development server on port 3004
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🎨 Design System

### Colors

- **Primary Blue**: `fintera-500` (#0ea5e9)
- **Gradient Purple**: `gradient-via` (#8b5cf6) 
- **Gradient Pink**: `gradient-to` (#ec4899)
- **Neutral**: Slate color palette

### Typography

- **Font**: Inter (system font fallback)
- **Headings**: Bold weights with gradient text effects
- **Body**: Regular weight with good contrast

## 📁 Project Structure

```
fintera-website/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── fintera/
│   │   ├── hero-section.tsx
│   │   ├── features-section.tsx
│   │   ├── trust-section.tsx
│   │   ├── how-it-works-section.tsx
│   │   ├── social-proof-section.tsx
│   │   ├── cta-section.tsx
│   │   └── footer.tsx
│   └── ui/
│       ├── button.tsx
│       ├── card.tsx
│       └── input.tsx
├── lib/
│   └── utils.ts
└── public/
```

## 🔧 Customization

### Brand Colors

Update the color scheme in `tailwind.config.ts`:

```typescript
fintera: {
  // Update color values
  500: "#your-color",
  // ...
}
```

### Content

- **Hero messaging**: Edit `components/fintera/hero-section.tsx`
- **Features**: Update `components/fintera/features-section.tsx`  
- **Testimonials**: Modify `components/fintera/social-proof-section.tsx`

### Animations

All animations use Framer Motion. Customize timing, delays, and effects in individual component files.

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set build command: `npm run build`
3. Set install command: `npm install`
4. Deploy

### Other Platforms

Build the project:
```bash
npm run build
```

Then deploy the `.next` folder to your hosting platform.

## 📄 License

This project is proprietary and confidential.

## 🤝 Contributing

This is a private project. Contact the development team for contribution guidelines.

---

**Fintera** - Smarter Finance. Clearer Future.
