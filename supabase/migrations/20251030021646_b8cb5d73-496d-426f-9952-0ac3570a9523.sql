-- Corrigir todas as funções SECURITY DEFINER para usar search_path vazio

-- 1. check_rate_limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_user_id uuid, p_action_type text, p_max_count integer, p_window_minutes integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count INTEGER;
  v_window_start TIMESTAMP WITH TIME ZONE;
BEGIN
  v_window_start := now() - (p_window_minutes || ' minutes')::INTERVAL;
  
  SELECT COALESCE(SUM(count), 0) INTO v_count
  FROM public.rate_limits
  WHERE user_id = p_user_id
    AND action_type = p_action_type
    AND window_start > v_window_start;
  
  IF v_count >= p_max_count THEN
    RETURN FALSE;
  END IF;
  
  -- Incrementar contador
  INSERT INTO public.rate_limits (user_id, action_type, count, window_start)
  VALUES (p_user_id, p_action_type, 1, now())
  ON CONFLICT (user_id, action_type, window_start)
  DO UPDATE SET public.rate_limits.count = public.rate_limits.count + 1;
  
  RETURN TRUE;
END;
$$;

-- 2. handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- 3. has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4. is_master_admin
CREATE OR REPLACE FUNCTION public.is_master_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = 'master_admin'::public.app_role
  )
$$;

-- 5. link_admin_to_agency
CREATE OR REPLACE FUNCTION public.link_admin_to_agency(p_agency_id uuid, p_admin_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Buscar user_id pelo email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_admin_email;
  
  IF v_user_id IS NOT NULL THEN
    -- Atualizar owner_id da agência
    UPDATE public.agencies 
    SET owner_id = v_user_id
    WHERE id = p_agency_id;
    
    -- Garantir que o usuário tem role agency_admin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'agency_admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$$;

-- 6. log_submission_status_change
CREATE OR REPLACE FUNCTION public.log_submission_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Apenas logar se o status mudou
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.submission_logs (
      submission_id, 
      changed_by, 
      old_status, 
      new_status,
      reason
    ) VALUES (
      NEW.id,
      auth.uid(),
      OLD.status,
      NEW.status,
      NEW.rejection_reason
    );
  END IF;
  RETURN NEW;
END;
$$;