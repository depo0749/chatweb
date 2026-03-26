-- User Settings Table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notifications BOOLEAN DEFAULT true,
  sound BOOLEAN DEFAULT true,
  message_preview BOOLEAN DEFAULT true,
  read_receipts BOOLEAN DEFAULT true,
  online_status BOOLEAN DEFAULT true,
  language VARCHAR(10) DEFAULT 'tr',
  font_size VARCHAR(20) DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- User Sessions Table (for tracking active sessions)
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL,
  device_name VARCHAR(255),
  device_type VARCHAR(50),
  browser VARCHAR(100),
  ip_address VARCHAR(50),
  location VARCHAR(255),
  is_current BOOLEAN DEFAULT false,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support Tickets Table
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticket_number VARCHAR(20) UNIQUE NOT NULL,
  category VARCHAR(50) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'open',
  priority VARCHAR(20) DEFAULT 'normal',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support Ticket Messages Table
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_staff BOOLEAN DEFAULT false,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FAQ/Help Articles Table
CREATE TABLE IF NOT EXISTS help_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  keywords TEXT[],
  view_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_articles ENABLE ROW LEVEL SECURITY;

-- User Settings Policies
CREATE POLICY "users_read_own_settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_own_settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);

-- User Sessions Policies
CREATE POLICY "users_read_own_sessions" ON user_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_sessions" ON user_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_delete_own_sessions" ON user_sessions FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "users_update_own_sessions" ON user_sessions FOR UPDATE USING (auth.uid() = user_id);

-- Support Tickets Policies
CREATE POLICY "users_read_own_tickets" ON support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_tickets" ON support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_own_tickets" ON support_tickets FOR UPDATE USING (auth.uid() = user_id);

-- Support Messages Policies
CREATE POLICY "users_read_ticket_messages" ON support_messages FOR SELECT 
  USING (EXISTS (SELECT 1 FROM support_tickets WHERE id = ticket_id AND user_id = auth.uid()));
CREATE POLICY "users_insert_ticket_messages" ON support_messages FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM support_tickets WHERE id = ticket_id AND user_id = auth.uid()));

-- Help Articles - Public read
CREATE POLICY "anyone_read_articles" ON help_articles FOR SELECT USING (is_published = true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_help_articles_category ON help_articles(category);

-- Insert some default help articles
INSERT INTO help_articles (category, title, content, keywords) VALUES
('account', 'Hesap nasil olusturulur?', 'Hesap olusturmak icin ana sayfadaki "Kayit Ol" butonuna tiklayin ve gerekli bilgileri doldurun.', ARRAY['hesap', 'kayit', 'uyelik']),
('account', 'Sifremi unuttum', 'Giris sayfasindaki "Sifremi Unuttum" linkine tiklayarak e-posta adresinize sifirlama baglantisi gonderebilirsiniz.', ARRAY['sifre', 'unutma', 'sifirlama']),
('security', 'Iki faktorlu dogrulama', 'Hesabinizi daha guvenli hale getirmek icin Ayarlar > Guvenlik bolumunden iki faktorlu dogrulamayi etkinlestirebilirsiniz.', ARRAY['guvenlik', '2fa', 'dogrulama']),
('security', 'Supheli giris uyarisi', 'Tanimadiginiz bir cihazdan giris yapildiginda size bildirim gondeririz. Bu durumda hemen sifrenizi degistirin.', ARRAY['guvenlik', 'giris', 'uyari']),
('messages', 'Mesaj nasil gonderilir?', 'Sol panelden bir sohbet secin veya yeni sohbet olusturun, ardindan mesaj kutusuna yazin ve gonderin.', ARRAY['mesaj', 'sohbet', 'gonderme']),
('messages', 'Grup sohbeti olusturma', 'Sol paneldeki + butonuna tiklayin, "Grup Olustur" secenegini secin ve uyeleri ekleyin.', ARRAY['grup', 'sohbet', 'olusturma']),
('privacy', 'Engellemeler', 'Bir kullaniciyi engellemek icin profil sayfasina gidin ve "Engelle" butonuna tiklayin.', ARRAY['engel', 'gizlilik', 'kullanici']),
('privacy', 'Veri indirme', 'Tum verilerinizi indirmek icin Ayarlar > Gizlilik > Verilerimi Indir secenegini kullanin.', ARRAY['veri', 'indirme', 'gdpr'])
ON CONFLICT DO NOTHING;
