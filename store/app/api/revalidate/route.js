import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { secret } = await request.json()
    if (secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }
    // Revalidate all store pages
    revalidatePath('/', 'layout')
    return NextResponse.json({ revalidated: true, timestamp: new Date().toISOString() })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
