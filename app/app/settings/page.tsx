'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/chat/header'
import { Loader2, Check, Bell, Palette, Shield, Globe, Volume2, Eye, Clock, MessageSquare } from 'lucide-react'
import { useTheme } from 'next-themes'

interface Settings {
  notifications: boolean
  sound: boolean
  messagePreview: boolean
  readReceipts: boolean
  onlineStatus: boolean
  language: string
  fontSize: string
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [settings, setSettings] = useState<Settings>({
    notifications: true,
    sound: true,
    messagePreview: true,
    readReceipts: true,
    onlineStatus: true,
    language: 'tr',
    fontSize: 'medium',
  })

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings')
        if (response.ok) {
          const data = await response.json()
          setSettings(prev => ({ ...prev, ...data }))
        }
      } catch (error) {
        console.error('Error loading settings:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  const handleToggle = async (key: keyof Settings) => {
    const newSettings = {
      ...settings,
      [key]: !settings[key],
    }
    setSettings(newSettings)
    await saveSettings(newSettings)
  }

  const handleChange = async (key: keyof Settings, value: string) => {
    const newSettings = {
      ...settings,
      [key]: value,
    }
    setSettings(newSettings)
    await saveSettings(newSettings)
  }

  const saveSettings = async (newSettings: Settings) => {
    setSaving(true)
    setSaveSuccess(false)
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      })

      if (response.ok) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 2000)
      }
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const Toggle = ({ enabled, onToggle, disabled = false }: { enabled: boolean; onToggle: () => void; disabled?: boolean }) => (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-primary' : 'bg-muted'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )

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
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Ayarlar</h1>
            {(saving || saveSuccess) && (
              <div className="flex items-center gap-2 text-sm">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-muted-foreground">Kaydediliyor...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">Kaydedildi</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* Notification Settings */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">
                  Bildirimler
                </h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      Bildirimleri Etkinleştir
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Yeni mesajlar için bildirimleri alın
                    </p>
                  </div>
                  <Toggle
                    enabled={settings.notifications}
                    onToggle={() => handleToggle('notifications')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Volume2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">
                        Mesaj Sesi
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Yeni mesaj geldiğinde ses çal
                      </p>
                    </div>
                  </div>
                  <Toggle
                    enabled={settings.sound}
                    onToggle={() => handleToggle('sound')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">
                        Mesaj Önizleme
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Bildirimlerde mesaj içeriğini göster
                      </p>
                    </div>
                  </div>
                  <Toggle
                    enabled={settings.messagePreview}
                    onToggle={() => handleToggle('messagePreview')}
                  />
                </div>
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Eye className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">
                  Gizlilik
                </h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      Okundu Bilgisi
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Mesajları okuduğunuzda diğerlerinin görmesine izin verin
                    </p>
                  </div>
                  <Toggle
                    enabled={settings.readReceipts}
                    onToggle={() => handleToggle('readReceipts')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">
                        Çevrimiçi Durumu
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Çevrimiçi olduğunuzda diğerlerinin görmesine izin verin
                      </p>
                    </div>
                  </div>
                  <Toggle
                    enabled={settings.onlineStatus}
                    onToggle={() => handleToggle('onlineStatus')}
                  />
                </div>
              </div>
            </div>

            {/* Display Settings */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Palette className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">
                  Görünüm
                </h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Tema
                  </label>
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="w-full px-4 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="system">Sistem Varsayılanı</option>
                    <option value="light">Açık</option>
                    <option value="dark">Koyu</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Yazı Boyutu
                  </label>
                  <select
                    value={settings.fontSize}
                    onChange={(e) => handleChange('fontSize', e.target.value)}
                    className="w-full px-4 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="small">Küçük</option>
                    <option value="medium">Orta</option>
                    <option value="large">Büyük</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Language Settings */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">
                  Dil ve Bölge
                </h2>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Dil
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => handleChange('language', e.target.value)}
                  className="w-full px-4 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="tr">Türkçe</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>

            {/* Security Settings */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">
                  Güvenlik
                </h2>
              </div>
              <div className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  Şifremi Değiştir
                </Button>
                <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
                  Hesabı Sil
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
