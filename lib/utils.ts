export function formatCAD(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function getPaymentInstructions(method: string) {
  if (method === 'td') {
    return {
      label: 'TD Interac e-Transfer',
      detail: process.env.TD_EMAIL || '',
      icon: '🏦',
      color: '#2D5234',
    }
  }
  return {
    label: 'WealthSimple Interac',
    detail: process.env.WS_HANDLE ? `${process.env.WS_HANDLE}@wealthsimple.me` : '',
    icon: '🌿',
    color: '#3D4B3E',
  }
}

export function generateSlug(): string {
  const allowedChars = 'abcdefghjkmnpqrstuvwxyz23456789'
  let slug = ''
  const randomBytes = crypto.getRandomValues(new Uint8Array(8))
  for (let i = 0; i < 8; i++) {
    slug += allowedChars.charAt(randomBytes[i] % allowedChars.length)
  }
  return slug
}
