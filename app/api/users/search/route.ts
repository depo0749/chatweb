import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] })
    }

    // Search users by display_name, full_name or email
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, display_name, full_name, avatar_url, bio')
      .neq('id', user.id) // Exclude current user
      .or(`display_name.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(limit)

    if (error) {
      console.error('Search error:', error)
      return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }

    return NextResponse.json({ users: users || [] })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
