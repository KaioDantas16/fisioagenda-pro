CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  created_by uuid NOT NULL DEFAULT auth.uid()
    REFERENCES auth.users(id) ON DELETE CASCADE,

  category text NOT NULL DEFAULT 'duvida'
    CHECK (category IN ('duvida', 'erro', 'melhoria', 'financeiro', 'acesso', 'urgente')),

  priority text NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('baixa', 'normal', 'alta', 'urgente')),

  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),

  subject text NOT NULL
    CHECK (char_length(subject) >= 3 AND char_length(subject) <= 140),

  message text NOT NULL
    CHECK (char_length(message) >= 10 AND char_length(message) <= 4000),

  contact_preference text NOT NULL DEFAULT 'whatsapp'
    CHECK (contact_preference IN ('whatsapp', 'email', 'ambos')),

  app_context jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS support_tickets_created_by_created_at_idx
ON public.support_tickets(created_by, created_at DESC);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own support tickets or super admin"
ON public.support_tickets;

CREATE POLICY "Users read own support tickets or super admin"
ON public.support_tickets
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
  OR is_super_admin(auth.uid())
);

DROP POLICY IF EXISTS "Users create own support tickets"
ON public.support_tickets;

CREATE POLICY "Users create own support tickets"
ON public.support_tickets
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  OR is_super_admin(auth.uid())
);

DROP POLICY IF EXISTS "Users update own open support tickets or super admin"
ON public.support_tickets;

CREATE POLICY "Users update own open support tickets or super admin"
ON public.support_tickets
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid()
  OR is_super_admin(auth.uid())
)
WITH CHECK (
  created_by = auth.uid()
  OR is_super_admin(auth.uid())
);

DROP TRIGGER IF EXISTS trg_support_tickets_updated_at
ON public.support_tickets;

CREATE TRIGGER trg_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.tg_set_updated_at();

REVOKE ALL ON public.support_tickets FROM PUBLIC;
REVOKE ALL ON public.support_tickets FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.support_tickets TO authenticated;
