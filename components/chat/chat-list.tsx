'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import Image from 'next/image'
import { Search, Users, MessageCircle, X, Check, Loader2 } from 'lucide-react'

interface Chat {
  id: string
  name: string
  avatar_url?: string
  is_group: boolean
  last_message?: string
  last_message_at?: string
  unread_count?: number
}

interface User {
  id: string
  display_name: string
  full_name: string
  avatar_url?: string
  bio?: string
}

interface ChatListProps {
  selectedId?: string
  onSelect: (id: string) => void
}

export function ChatList({ selectedId, onSelect }: ChatListProps) {
  const [chats, setChats] = useState<Chat[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showNewChat, setShowNewChat] = useState(false)
  const [showNewGroup, setShowNewGroup] = useState(false)
  
  // New chat state
  const [userSearch, setUserSearch] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [searching, setSearching] = useState(false)
  const [creatingChat, setCreatingChat] = useState(false)
  
  // New group state
  const [newGroupName, setNewGroupName] = useState('')
  const [groupMemberSearch, setGroupMemberSearch] = useState('')
  const [groupMemberResults, setGroupMemberResults] = useState<User[]>([])
  const [selectedMembers, setSelectedMembers] = useState<User[]>([])
  const [creatingGroup, setCreatingGroup] = useState(false)
  const [groupSearching, setGroupSearching] = useState(false)

  useEffect(() => {
    loadChats()
  }, [])

  const loadChats = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    // Get conversations where user is a member
    const { data: memberData } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', user.id)

    if (!memberData || memberData.length === 0) {
      setChats([])
      setLoading(false)
      return
    }

    const conversationIds = memberData.map(m => m.conversation_id)

    const { data } = await supabase
      .from('conversations')
      .select(`
        id,
        name,
        avatar_url,
        is_group,
        messages (content, created_at)
      `)
      .in('id', conversationIds)
      .order('updated_at', { ascending: false })

    if (data) {
      setChats(
        data.map((chat: any) => ({
          ...chat,
          name: chat.name || 'Sohbet',
          last_message: chat.messages?.[0]?.content,
          last_message_at: chat.messages?.[0]?.created_at,
        }))
      )
    }

    setLoading(false)
  }

  // User search with debounce
  const searchUsers = useCallback(async (query: string, isForGroup: boolean = false) => {
    if (query.length < 2) {
      if (isForGroup) {
        setGroupMemberResults([])
      } else {
        setSearchResults([])
      }
      return
    }

    if (isForGroup) {
      setGroupSearching(true)
    } else {
      setSearching(true)
    }

    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&limit=10`)
      const data = await response.json()
      
      if (isForGroup) {
        // Filter out already selected members
        const filteredUsers = (data.users || []).filter(
          (user: User) => !selectedMembers.find(m => m.id === user.id)
        )
        setGroupMemberResults(filteredUsers)
      } else {
        setSearchResults(data.users || [])
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      if (isForGroup) {
        setGroupSearching(false)
      } else {
        setSearching(false)
      }
    }
  }, [selectedMembers])

  // Debounced search effect for new chat
  useEffect(() => {
    const timer = setTimeout(() => {
      if (userSearch) {
        searchUsers(userSearch, false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [userSearch, searchUsers])

  // Debounced search effect for group members
  useEffect(() => {
    const timer = setTimeout(() => {
      if (groupMemberSearch) {
        searchUsers(groupMemberSearch, true)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [groupMemberSearch, searchUsers])

  const startNewChat = async (targetUser: User) => {
    setCreatingChat(true)
    try {
      const response = await fetch('/api/conversations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: targetUser.id }),
      })
      
      const data = await response.json()
      
      if (data.conversation) {
        setShowNewChat(false)
        setUserSearch('')
        setSearchResults([])
        loadChats()
        onSelect(data.conversation.id)
      }
    } catch (error) {
      console.error('Error creating chat:', error)
    } finally {
      setCreatingChat(false)
    }
  }

  const addGroupMember = (user: User) => {
    setSelectedMembers(prev => [...prev, user])
    setGroupMemberSearch('')
    setGroupMemberResults([])
  }

  const removeGroupMember = (userId: string) => {
    setSelectedMembers(prev => prev.filter(m => m.id !== userId))
  }

  const createGroup = async () => {
    if (!newGroupName.trim()) return

    setCreatingGroup(true)
    try {
      const response = await fetch('/api/conversations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isGroup: true,
          groupName: newGroupName,
          memberIds: selectedMembers.map(m => m.id),
        }),
      })
      
      const data = await response.json()
      
      if (data.conversation) {
        setShowNewGroup(false)
        setNewGroupName('')
        setSelectedMembers([])
        loadChats()
        onSelect(data.conversation.id)
      }
    } catch (error) {
      console.error('Error creating group:', error)
    } finally {
      setCreatingGroup(false)
    }
  }

  const filteredChats = chats.filter((chat) =>
    chat.name?.toLowerCase().includes(search.toLowerCase())
  )

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getUserDisplayName = (user: User) => {
    return user.display_name || user.full_name || 'Kullanici'
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Sohbetleri ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Yukleniyor...
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center">
            <MessageCircle className="h-12 w-12 mb-4 opacity-50" />
            <p>Henuz sohbet yok</p>
            <p className="text-sm mt-2">Yeni bir sohbet veya grup baslatin</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onSelect(chat.id)}
                className={`w-full p-4 hover:bg-muted transition-colors text-left ${
                  selectedId === chat.id ? 'bg-muted' : ''
                }`}
              >
                <div className="flex gap-3 items-center">
                  {chat.avatar_url ? (
                    <Image
                      src={chat.avatar_url}
                      alt={chat.name}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium ${
                      chat.is_group ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {chat.is_group ? <Users className="h-5 w-5" /> : getInitials(chat.name)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground truncate">
                        {chat.name}
                      </h3>
                      {chat.is_group && (
                        <span className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                          Grup
                        </span>
                      )}
                    </div>
                    {chat.last_message && (
                      <p className="text-sm text-muted-foreground truncate">
                        {chat.last_message}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border flex gap-2">
        {/* New Chat Dialog */}
        <Dialog open={showNewChat} onOpenChange={(open) => {
          setShowNewChat(open)
          if (!open) {
            setUserSearch('')
            setSearchResults([])
          }
        }}>
          <DialogTrigger asChild>
            <Button className="flex-1" size="sm">
              <MessageCircle className="h-4 w-4 mr-2" />
              Yeni Sohbet
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Yeni Sohbet Baslat</DialogTitle>
              <DialogDescription>
                Sohbet baslatmak icin bir kullanici arayin.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Kullanici ara..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="max-h-64 overflow-y-auto">
                {searching ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Araniyor...
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-2">
                    {searchResults.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => startNewChat(user)}
                        disabled={creatingChat}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                      >
                        {user.avatar_url ? (
                          <Image
                            src={user.avatar_url}
                            alt={getUserDisplayName(user)}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-sm font-medium text-muted-foreground">
                              {getInitials(getUserDisplayName(user))}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {getUserDisplayName(user)}
                          </p>
                          {user.bio && (
                            <p className="text-sm text-muted-foreground truncate">
                              {user.bio}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : userSearch.length >= 2 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Kullanici bulunamadi
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Aramak icin en az 2 karakter girin
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* New Group Dialog */}
        <Dialog open={showNewGroup} onOpenChange={(open) => {
          setShowNewGroup(open)
          if (!open) {
            setNewGroupName('')
            setSelectedMembers([])
            setGroupMemberSearch('')
            setGroupMemberResults([])
          }
        }}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex-1" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Yeni Grup
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Yeni Grup Olustur</DialogTitle>
              <DialogDescription>
                Grup icin bir isim girin ve uyeler ekleyin.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Grup Adi
                </label>
                <Input
                  type="text"
                  placeholder="Grup adi girin..."
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
              </div>
              
              {/* Selected Members */}
              {selectedMembers.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Secilen Uyeler ({selectedMembers.length})
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-sm"
                      >
                        <span>{getUserDisplayName(member)}</span>
                        <button
                          onClick={() => removeGroupMember(member.id)}
                          className="hover:bg-primary/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Member Search */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Uye Ekle
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Kullanici ara..."
                    value={groupMemberSearch}
                    onChange={(e) => setGroupMemberSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Search Results */}
              <div className="max-h-40 overflow-y-auto">
                {groupSearching ? (
                  <div className="flex items-center justify-center py-4 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Araniyor...
                  </div>
                ) : groupMemberResults.length > 0 ? (
                  <div className="space-y-1">
                    {groupMemberResults.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => addGroupMember(user)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                      >
                        {user.avatar_url ? (
                          <Image
                            src={user.avatar_url}
                            alt={getUserDisplayName(user)}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-xs font-medium text-muted-foreground">
                              {getInitials(getUserDisplayName(user))}
                            </span>
                          </div>
                        )}
                        <span className="flex-1 text-sm truncate">
                          {getUserDisplayName(user)}
                        </span>
                        <Check className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                ) : groupMemberSearch.length >= 2 ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    Kullanici bulunamadi
                  </div>
                ) : null}
              </div>

              <Button
                onClick={createGroup}
                disabled={creatingGroup || !newGroupName.trim()}
                className="w-full"
              >
                {creatingGroup ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Olusturuluyor...
                  </>
                ) : (
                  'Grup Olustur'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
