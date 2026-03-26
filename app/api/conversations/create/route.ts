import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { targetUserId, isGroup, groupName, memberIds } = body

    // For direct chat (1-on-1)
    if (!isGroup && targetUserId) {
      // Check if conversation already exists between these two users
      const { data: existingConversations } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', user.id)

      if (existingConversations && existingConversations.length > 0) {
        const conversationIds = existingConversations.map(c => c.conversation_id)

        // Check if target user is in any of these conversations (and it's not a group)
        const { data: sharedConversations } = await supabase
          .from('conversation_members')
          .select('conversation_id, conversations!inner(id, is_group)')
          .eq('user_id', targetUserId)
          .in('conversation_id', conversationIds)

        const directChat = sharedConversations?.find(
          (c: any) => c.conversations?.is_group === false
        )

        if (directChat) {
          return NextResponse.json({ 
            conversation: { id: directChat.conversation_id },
            existing: true 
          })
        }
      }

      // Get target user's profile for conversation name
      const { data: targetProfile } = await supabase
        .from('profiles')
        .select('display_name, full_name')
        .eq('id', targetUserId)
        .single()

      // Create new direct conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          name: targetProfile?.display_name || targetProfile?.full_name || 'Sohbet',
          is_group: false,
          created_by: user.id,
        })
        .select()
        .single()

      if (convError) throw convError

      // Add both users as members
      const { error: memberError } = await supabase
        .from('conversation_members')
        .insert([
          { conversation_id: conversation.id, user_id: user.id, role: 'member' },
          { conversation_id: conversation.id, user_id: targetUserId, role: 'member' },
        ])

      if (memberError) throw memberError

      return NextResponse.json({ conversation, existing: false })
    }

    // For group chat
    if (isGroup && groupName) {
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          name: groupName,
          is_group: true,
          created_by: user.id,
        })
        .select()
        .single()

      if (convError) throw convError

      // Add creator as admin
      const members = [
        { conversation_id: conversation.id, user_id: user.id, role: 'admin' },
      ]

      // Add other members
      if (memberIds && memberIds.length > 0) {
        memberIds.forEach((memberId: string) => {
          if (memberId !== user.id) {
            members.push({
              conversation_id: conversation.id,
              user_id: memberId,
              role: 'member',
            })
          }
        })
      }

      const { error: memberError } = await supabase
        .from('conversation_members')
        .insert(members)

      if (memberError) throw memberError

      return NextResponse.json({ conversation, existing: false })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('Create conversation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
