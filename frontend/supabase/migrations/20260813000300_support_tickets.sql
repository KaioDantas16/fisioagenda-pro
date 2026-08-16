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

-- Fila privilegiada deve paginar por (created_at DESC, id DESC).
-- created_at e servidor; LIMIT 20 nao e a fila completa.
CREATE INDEX IF NOT EXISTS support_tickets_created_by_created_at_idx
ON public.support_tickets(created_by, created_at DESC);

CREATE INDEX IF NOT EXISTS support_tickets_created_at_id_idx
ON public.support_tickets(created_at DESC, id DESC);

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
  AND status = 'open'
);

DROP POLICY IF EXISTS "Users update own open support tickets or super admin"
ON public.support_tickets;

DROP POLICY IF EXISTS "Super admin update support tickets"
ON public.support_tickets;

CREATE POLICY "Super admin update support tickets"
ON public.support_tickets
FOR UPDATE
TO authenticated
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.tg_support_tickets_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  recent_count integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Autenticacao obrigatoria para abrir chamado';
  END IF;

  -- Serializa a cota por usuario nesta transacao.
  -- Namespace 872401 = chamados; distinto de 872402 = comentarios.
  PERFORM pg_advisory_xact_lock(872401, hashtext(auth.uid()::text));

  NEW.id := gen_random_uuid();
  NEW.created_by := auth.uid();
  NEW.status := 'open';
  NEW.created_at := now();
  NEW.updated_at := now();
  NEW.app_context := '{}'::jsonb;

  SELECT count(*)::integer
    INTO recent_count
  FROM public.support_tickets
  WHERE created_by = auth.uid()
    AND created_at > now() - interval '1 hour';

  IF recent_count >= 10 THEN
    RAISE EXCEPTION 'Limite de chamados atingido. Tente novamente mais tarde.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_support_tickets_before_insert
ON public.support_tickets;

CREATE TRIGGER trg_support_tickets_before_insert
BEFORE INSERT ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.tg_support_tickets_before_insert();

DROP TRIGGER IF EXISTS trg_support_tickets_updated_at
ON public.support_tickets;

CREATE TRIGGER trg_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.tg_set_updated_at();

REVOKE ALL ON public.support_tickets FROM PUBLIC;
REVOKE ALL ON public.support_tickets FROM anon;
REVOKE ALL ON public.support_tickets FROM authenticated;

GRANT SELECT ON public.support_tickets TO authenticated;
GRANT INSERT (
  category,
  priority,
  contact_preference,
  subject,
  message
) ON public.support_tickets TO authenticated;
GRANT UPDATE (
  category,
  priority,
  status,
  contact_preference,
  subject,
  message,
  app_context
) ON public.support_tickets TO authenticated;

REVOKE ALL ON FUNCTION public.tg_support_tickets_before_insert() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.tg_support_tickets_before_insert() FROM anon;
REVOKE ALL ON FUNCTION public.tg_support_tickets_before_insert() FROM authenticated;
