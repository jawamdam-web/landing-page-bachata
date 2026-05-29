-- Migration: 0005_share_tokens
-- Tabela tokenów udostępniania + SECURITY DEFINER function dla publicznego dostępu

-- Tabela share_tokens
CREATE TABLE public.share_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  target_type text NOT NULL CHECK (target_type IN ('video', 'folder')),
  target_id uuid NOT NULL,  -- weak reference (nie FK — żeby usunąć video bez usuwania tokena)
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_accessed_at timestamptz
);

-- Indeksy dla wydajności
CREATE INDEX share_tokens_user_id_idx ON public.share_tokens (user_id);
CREATE INDEX share_tokens_token_idx ON public.share_tokens (token);
CREATE INDEX share_tokens_target_idx ON public.share_tokens (target_type, target_id);

-- RLS: Owner widzi/modyfikuje swoje; anon = żaden direct access
ALTER TABLE public.share_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_all" ON public.share_tokens
  FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Anon: brak polityki = brak dostępu bezpośredniego do share_tokens

-- SECURITY DEFINER function dla anon access przez token
-- SET search_path = '' zapobiega search_path injection
CREATE OR REPLACE FUNCTION public.get_shared_content(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_share public.share_tokens%ROWTYPE;
  v_result jsonb;
BEGIN
  -- Lookup token (tylko aktywne — revoked_at IS NULL)
  SELECT * INTO v_share
  FROM public.share_tokens
  WHERE token = p_token AND revoked_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'token_invalid_or_revoked';
  END IF;

  -- Update last_accessed_at (fire-and-forget, nie blokuje wyniku)
  UPDATE public.share_tokens
  SET last_accessed_at = now()
  WHERE id = v_share.id;

  -- Fetch content wg target_type
  IF v_share.target_type = 'video' THEN
    SELECT jsonb_build_object('type', 'video', 'video', row_to_json(v)::jsonb)
    INTO v_result
    FROM public.videos v
    WHERE v.id = v_share.target_id;

    IF v_result IS NULL THEN
      RAISE EXCEPTION 'target_not_found';
    END IF;

  ELSIF v_share.target_type = 'folder' THEN
    SELECT jsonb_build_object(
      'type', 'folder',
      'folder', row_to_json(f)::jsonb,
      'videos', COALESCE(jsonb_agg(row_to_json(v)::jsonb ORDER BY v.created_at DESC), '[]'::jsonb)
    )
    INTO v_result
    FROM public.folders f
    LEFT JOIN public.video_folders vf ON vf.folder_id = f.id
    LEFT JOIN public.videos v ON v.id = vf.video_id
    WHERE f.id = v_share.target_id
    GROUP BY f.id, f.name, f.user_id, f.created_at, f.updated_at;

    IF v_result IS NULL THEN
      RAISE EXCEPTION 'target_not_found';
    END IF;
  END IF;

  RETURN v_result;
END;
$$;

-- Grant EXECUTE dla anon i authenticated (RPC działa przez anon key)
GRANT EXECUTE ON FUNCTION public.get_shared_content(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_shared_content(text) TO authenticated;
