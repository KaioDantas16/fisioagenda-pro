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

REVOKE ALL ON public.support_ticket_messages FROM PUBLIC;
REVOKE ALL ON public.support_ticket_messages FROM anon;
GRANT SELECT, INSERT ON public.support_ticket_messages TO authenticated;
