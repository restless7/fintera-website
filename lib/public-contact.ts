/** Official customer contact supplied by the owner. Not a customer/advisor number. */
export const PUBLIC_CONTACT = {
  phoneDisplay: "+57 313 846 1713",
  phoneE164: "+573138461713",
  telephoneUrl: "tel:+573138461713",
  whatsappUrl: "https://wa.me/573138461713",
} as const;

export function officialWhatsAppUrl(message?: string): string {
  return message
    ? `${PUBLIC_CONTACT.whatsappUrl}?text=${encodeURIComponent(message)}`
    : PUBLIC_CONTACT.whatsappUrl;
}
