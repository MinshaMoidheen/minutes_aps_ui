import { NextResponse } from 'next/server'

type Party = {
  id: string
  name: string
  gstin?: string
  phone?: string
  email?: string
  billingAddress?: string
  shippingAddress?: string
  openingBalance?: number
  gstType?: string
  state?: string
  asOfDate?: string
  noLimit?: boolean
  customLimitValue?: number
  additionalField1?: string
  additionalField2?: string
  additionalField3?: string
}

// Share the same in-memory array by attaching to global
const g = globalThis as any
g.__PARTIES__ = g.__PARTIES__ || []
const parties = g.__PARTIES__ as Party[]

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const party = parties.find((p) => p.id === params.id)
  if (!party) return NextResponse.json({ message: 'Not found' }, { status: 404 })
  return NextResponse.json(party)
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const idx = parties.findIndex((p) => p.id === params.id)
  if (idx === -1) return NextResponse.json({ message: 'Not found' }, { status: 404 })
  const body = await req.json()
  parties[idx] = { ...parties[idx], ...body, id: params.id }
  return NextResponse.json(parties[idx])
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const idx = parties.findIndex((p) => p.id === params.id)
  if (idx === -1) return NextResponse.json({ message: 'Not found' }, { status: 404 })
  parties.splice(idx, 1)
  return NextResponse.json({ success: true })
}


