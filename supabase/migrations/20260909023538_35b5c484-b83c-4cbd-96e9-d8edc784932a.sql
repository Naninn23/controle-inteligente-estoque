
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.pode_gerenciar() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.registrar_auditoria() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.bloquear_alteracao_movimento() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.garantir_perfil(text, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.definir_papel(uuid, public.app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.confirmar_documento(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.finalizar_inventario(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.pode_gerenciar() TO authenticated;
GRANT EXECUTE ON FUNCTION public.garantir_perfil(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.definir_papel(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirmar_documento(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finalizar_inventario(uuid) TO authenticated;
