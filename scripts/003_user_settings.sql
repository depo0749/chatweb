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

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_own_settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);
