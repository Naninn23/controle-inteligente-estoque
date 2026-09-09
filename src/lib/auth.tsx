import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Papel = "admin" | "gerente" | "operador";

type AuthValue = {
  session: Session | null;
  carregando: boolean;
  papel: Papel | null;
  nome: string;
  podeGerenciar: boolean;
  ehAdmin: boolean;
};

const AuthContext = createContext<AuthValue>({
  session: null,
  carregando: true,
  papel: null,
  nome: "",
  podeGerenciar: false,
  ehAdmin: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [carregando, setCarregando] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      setCarregando(false);
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        queryClient.invalidateQueries({ queryKey: ["me"] });
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCarregando(false);
    });
    return () => sub.subscription.unsubscribe();
  }, [queryClient]);

  const userId = session?.user.id;

  const { data: me } = useQuery({
    queryKey: ["me", userId],
    enabled: !!userId,
    queryFn: async () => {
      await supabase.rpc("garantir_perfil", {
        _nome: (session?.user.user_metadata?.["nome"] as string) ?? "",
        _email: session?.user.email ?? "",
      });
      const [{ data: perfil }, { data: papeis }] = await Promise.all([
        supabase.from("profiles").select("nome, email").eq("id", userId!).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId!),
      ]);
      return {
        nome: perfil?.nome ?? session?.user.email ?? "",
        papel: (papeis?.[0]?.role ?? "operador") as Papel,
      };
    },
  });

  const papel = me?.papel ?? null;

  return (
    <AuthContext.Provider
      value={{
        session,
        carregando,
        papel,
        nome: me?.nome ?? "",
        podeGerenciar: papel === "admin" || papel === "gerente",
        ehAdmin: papel === "admin",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
