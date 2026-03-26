-- User Settings Table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notifications_enabled BOOLEAN DEFAULT true,
  message_sound_enabled BOOLEAN DEFAULT true,
  theme VARCHAR(20) DEFAULT 'auto',
  language VARCHAR(10) DEFAULT 'tr',
  two_factor_enabled BOOLEAN DEFAULT false,
  online_status_visible BOOLEAN DEFAULT true,
  read_receipts_enabled BOOLEAN DEFAULT true,
  typing_indicator_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "users_view_own_settings" ON public.user_settings;
CREATE POLICY "users_view_own_settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_insert_own_settings" ON public.user_settings;
CREATE POLICY "users_insert_own_settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_update_own_settings" ON public.user_settings;
CREATE POLICY "users_update_own_settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_delete_own_settings" ON public.user_settings;
CREATE POLICY "users_delete_own_settings" ON public.user_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);
