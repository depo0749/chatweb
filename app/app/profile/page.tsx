'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Header } from '@/components/chat/header'
import { Camera, Loader2, Check, User } from 'lucide-react'
import Image from 'next/image'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    phone: '',
  })

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      setUser(user)

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setProfile(data)
        const nameParts = (data.full_name || data.display_name || '').split(' ')
        setFormData({
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          bio: data.bio || '',
          phone: data.phone || '',
        })
      }

      setLoading(false)
    }

    loadProfile()
  }, [])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const { url } = await response.json()
        setProfile((prev: any) => ({ ...prev, avatar_url: url }))
      } else {
        const error = await response.json()
        alert(error.error || 'Avatar yüklenirken hata oluştu')
      }
    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert('Avatar yüklenirken hata oluştu')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    setSaveSuccess(false)
    try {
      const supabase = createClient()
      await supabase.from('profiles').upsert({
        id: user.id,
        full_name: `${formData.firstName} ${formData.lastName}`.trim(),
        display_name: formData.firstName || formData.lastName || 'Kullanıcı',
        bio: formData.bio,
        phone: formData.phone,
        updated_at: new Date().toISOString(),
      })

      setProfile((prev: any) => ({
        ...prev,
        full_name: `${formData.firstName} ${formData.lastName}`.trim(),
        display_name: formData.firstName || formData.lastName || 'Kullanıcı',
        bio: formData.bio,
        phone: formData.phone,
      }))
      
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Profil güncellenirken hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 p-4 md:p-8 overflow-auto">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6 md:mb-8">Profil</h1>

          <div className="bg-card border border-border rounded-lg p-6 md:p-8">
            {/* Avatar */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Profil Fotoğrafı
              </h2>
              <div className="flex items-center gap-4">
                <div className="relative">
                  {profile?.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt="Avatar"
                      width={96}
                      height={96}
                      className="w-24 h-24 rounded-full object-cover border-2 border-border"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                      <User className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarUpload}
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    {uploading ? 'Yükleniyor...' : 'Fotoğraf Yükle'}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG, GIF veya WebP. Maks 5MB.
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Ad
                  </label>
                  <Input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    placeholder="Adınız"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Soyad
                  </label>
                  <Input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    placeholder="Soyadınız"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  E-posta
                </label>
                <Input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  E-posta adresi değiştirilemez
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Telefon
                </label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+90 5XX XXX XX XX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Biyografi
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  placeholder="Kendinizi tanıtın..."
                  className="w-full px-4 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {formData.bio.length}/500
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={saving} className="gap-2">
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : saveSuccess ? (
                    <>
                      <Check className="h-4 w-4" />
                      Kaydedildi
                    </>
                  ) : (
                    'Değişiklikleri Kaydet'
                  )}
                </Button>
                {saveSuccess && (
                  <span className="text-sm text-green-600">
                    Profil başarıyla güncellendi
                  </span>
                )}
              </div>
            </form>

            {/* Account Info */}
            <div className="mt-8 pt-8 border-t border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Hesap Bilgileri
              </h2>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Hesap ID:</span>{' '}
                  {user?.id?.slice(0, 8)}...
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Kayıt Tarihi:</span>{' '}
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
