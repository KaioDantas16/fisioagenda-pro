-- Support ticket timeline messages (no attachments in this phase).

CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  author_user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL
    CHECK (char_length(message) >= 1 AND char_length(message) <= 4000),
  is_internal boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS support_ticket_messages_ticket_created_idx
  ON public.support_ticket_messages (ticket_id, created_at ASC);

CREATE INDEX IF NOT EXISTS support_ticket_messages_author_created_idx
  ON public.support_ticket_messages (author_user_id, created_at DESC);

ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners and super admin read support messages"
  ON public.support_ticket_messages;
CREATE POLICY "Owners and super admin read support messages"
ON public.support_ticket_messages
FOR SELECT
TO authenticated
USING (
  is_super_admin(auth.uid())
  OR (
    is_internal = false
    AND EXISTS (
      SELECT 1
      FROM public.support_tickets t
      WHERE t.id = support_ticket_messages.ticket_id
        AND t.created_by = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Owners and super admin insert support messages"
  ON public.support_ticket_messages;
CREATE POLICY "Owners and super admin insert support messages"
ON public.support_ticket_messages
FOR INSERT
TO authenticated
WITH CHECK (
  author_user_id = auth.uid()
  AND (
    is_internal = false
    OR is_super_admin(auth.uid())
  )
  AND EXISTS (
    SELECT 1
    FROM public.support_tickets t
    WHERE t.id = ticket_id
      AND (
        t.created_by = auth.uid()
        OR is_super_admin(auth.uid())
      )
  )
);

CREATE OR REPLACE FUNCTION public.tg_support_ticket_messages_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  recent_count integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Autenticacao obrigatoria para comentar chamado';
  END IF;

  -- Serializa a cota por usuario nesta transacao.
  -- Namespace 872402 = comentarios; distinto de 872401 = chamados.
  PERFORM pg_advisory_xact_lock(872402, hashtext(auth.uid()::text));

  NEW.id := gen_random_uuid();
  NEW.author_user_id := auth.uid();
  NEW.created_at := now();
  NEW.metadata := '{}'::jsonb;

  IF NOT public.is_super_admin(auth.uid()) THEN
    NEW.is_internal := false;
  END IF;

  SELECT count(*)::integer
    INTO recent_count
  FROM public.support_ticket_messages
  WHERE author_user_id = auth.uid()
    AND created_at > now() - interval '1 hour';

  IF recent_count >= 30 THEN
    RAISE EXCEPTION 'Limite de comentarios atingido. Tente novamente mais tarde.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_support_ticket_messages_before_insert
ON public.support_ticket_messages;

CREATE TRIGGER trg_support_ticket_messages_before_insert
BEFORE INSERT ON public.support_ticket_messages
FOR EACH ROW
EXECUTE FUNCTION public.tg_support_ticket_messages_before_insert();

REVOKE ALL ON public.support_ticket_messages FROM PUBLIC;
REVOKE ALL ON public.support_ticket_messages FROM anon;
REVOKE ALL ON public.support_ticket_messages FROM authenticated;

GRANT SELECT ON public.support_ticket_messages TO authenticated;
GRANT INSERT (
  ticket_id,
  message,
  is_internal
) ON public.support_ticket_messages TO authenticated;

REVOKE ALL ON FUNCTION public.tg_support_ticket_messages_before_insert() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.tg_support_ticket_messages_before_insert() FROM anon;
REVOKE ALL ON FUNCTION public.tg_support_ticket_messages_before_insert() FROM authenticated;
