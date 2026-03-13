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

import { customAlphabet } from 'nanoid'

const nanoidSlug = customAlphabet('abcdefghjkmnpqrstuvwxyz23456789', 8)

export function generateSlug(): string {
  return nanoidSlug()
}
