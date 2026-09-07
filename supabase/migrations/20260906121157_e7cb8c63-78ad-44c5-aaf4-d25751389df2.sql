revoke execute on function public.has_role(uuid, public.app_role) from public, anon, authenticated;
revoke execute on function public.claim_admin() from public, anon;
revoke execute on function public.is_admin() from public;