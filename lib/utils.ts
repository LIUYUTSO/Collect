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
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 8 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('')
}
