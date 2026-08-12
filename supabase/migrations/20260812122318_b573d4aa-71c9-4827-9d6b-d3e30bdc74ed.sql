CREATE OR REPLACE FUNCTION public.assign_default_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.assign_default_user_role() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER assign_profile_user_role AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.assign_default_user_role();