import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Boxes, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Estoque Fácil" },
      { name: "description", content: "Acesse sua conta do Estoque Fácil para gerenciar o estoque." },
      { property: "og:title", content: "Entrar — Estoque Fácil" },
      { property: "og:description", content: "Acesse sua conta do Estoque Fácil." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [enviando, setEnviando] = useState(false);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");

  useEffect(() => {
    if (session) navigate({ to: "/painel", replace: true });
  }, [session, navigate]);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setEnviando(false);
    if (error) {
      toast.error(
        error.message.includes("Invalid login")
          ? "E-mail ou senha incorretos."
          : "Não foi possível entrar: " + error.message,
      );
      return;
    }
    toast.success("Bem-vindo de volta!");
    navigate({ to: "/painel", replace: true });
  }

  async function cadastrar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome }, emailRedirectTo: window.location.origin },
    });
    setEnviando(false);
    if (error) {
      toast.error("Não foi possível criar a conta: " + error.message);
      return;
    }
    if (!data.session) {
      toast.success("Conta criada! Confirme o e-mail que enviamos para começar a usar.");
      return;
    }
    toast.success("Conta criada com sucesso!");
    navigate({ to: "/painel", replace: true });
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-sidebar p-12 text-sidebar-foreground lg:flex">
        <Link to="/" className="flex items-center gap-2 text-lg font-extrabold">
          <span className="grid size-8 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Boxes className="size-5" />
          </span>
          Estoque Fácil
        </Link>
        <div>
          <h2 className="max-w-md text-3xl font-bold leading-snug">
            Saldo confiável, custo médio correto e histórico de cada movimentação.
          </h2>
          <p className="mt-4 max-w-md text-sidebar-foreground/70">
            Um mini ERP feito para pequenas e médias empresas que precisam de controle de verdade.
          </p>
        </div>
        <p className="text-xs text-sidebar-foreground/50">
          A primeira pessoa a criar conta se torna administradora do sistema.
        </p>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 flex items-center gap-2 text-lg font-extrabold lg:hidden">
            <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
              <Boxes className="size-5" />
            </span>
            Estoque Fácil
          </Link>
          <Tabs defaultValue="entrar">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="entrar">Entrar</TabsTrigger>
              <TabsTrigger value="criar">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="entrar">
              <form onSubmit={entrar} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senha">Senha</Label>
                  <Input id="senha" type="password" required value={senha} onChange={(e) => setSenha(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={enviando}>
                  {enviando && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Entrar
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="criar">
              <form onSubmit={cadastrar} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome completo</Label>
                  <Input id="nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email2">E-mail</Label>
                  <Input id="email2" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senha2">Senha</Label>
                  <Input
                    id="senha2"
                    type="password"
                    required
                    minLength={6}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Mínimo de 6 caracteres.</p>
                </div>
                <Button type="submit" className="w-full" disabled={enviando}>
                  {enviando && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Criar conta
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
}
