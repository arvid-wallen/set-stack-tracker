-- Create table for storing PT chat messages
CREATE TABLE public.pt_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL DEFAULT '',
  actions jsonb DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_pt_chat_messages_user_id ON public.pt_chat_messages(user_id);
CREATE INDEX idx_pt_chat_messages_created_at ON public.pt_chat_messages(created_at DESC);

-- Enable RLS
ALTER TABLE public.pt_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own chat messages" 
  ON public.pt_chat_messages FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat messages" 
  ON public.pt_chat_messages FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat messages" 
  ON public.pt_chat_messages FOR DELETE 
  USING (auth.uid() = user_id);