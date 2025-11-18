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

// Use a shared in-memory store across route handlers during dev
const g = globalThis as any
g.__PARTIES__ = g.__PARTIES__ || []
const parties = g.__PARTIES__ as Party[]

export async function GET() {
  return NextResponse.json(parties)
}

export async function POST(req: Request) {
  const body = (await req.json()) as Omit<Party, 'id'>
  const id = crypto.randomUUID()
  const party: Party = { id, name: body.name, ...body }
  parties.push(party)
  return NextResponse.json(party, { status: 201 })
}


