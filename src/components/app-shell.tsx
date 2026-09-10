import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, LogOut, User } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { BuscaGlobal } from "@/components/busca-global";
import { useAuth } from "@/lib/auth";

function useEmpresa() {
  const { data } = useQuery({
    queryKey: ["empresa"],
    queryFn: async () => {
      const { data } = await supabase.from("configuracoes").select("empresa_nome").maybeSingle();
      return data?.empresa_nome ?? "Estoque Fácil";
    },
  });
  return data ?? "Estoque Fácil";
}

function Alertas() {
  const { data: alertas = [] } = useQuery({
    queryKey: ["alertas-estoque"],
    queryFn: async () => {
      const { data } = await supabase
        .from("produtos")
        .select("id, nome, sku, saldo, estoque_min")
        .eq("ativo", true)
        .gt("estoque_min", 0)
        .limit(200);
      return (data ?? []).filter((p) => Number(p.saldo) <= Number(p.estoque_min));
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
          <Bell className="size-5" />
          {alertas.length > 0 && (
            <Badge className="absolute -right-1 -top-1 size-5 justify-center rounded-full p-0 text-[10px]">
              {alertas.length > 9 ? "9+" : alertas.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Alertas de estoque</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {alertas.length === 0 ? (
          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
            Nenhum alerta no momento.
          </div>
        ) : (
          alertas.slice(0, 8).map((p) => (
            <DropdownMenuItem key={p.id} asChild>
              <Link to="/estoque" className="flex flex-col items-start">
                <span className="text-sm font-medium">{p.nome}</span>
                <span className="text-xs text-muted-foreground">
                  {p.sku} — saldo {Number(p.saldo)} / mínimo {Number(p.estoque_min)}
                </span>
              </Link>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const empresa = useEmpresa();
  const { nome, papel, session } = useAuth();

  const sair = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar empresa={empresa} />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur sm:px-6">
            <SidebarTrigger />
            <span className="hidden truncate font-semibold md:inline">{empresa}</span>
            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              <BuscaGlobal />
              <Alertas />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Perfil">
                    <User className="size-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="truncate">{nome || session?.user.email}</div>
                    <div className="text-xs font-normal capitalize text-muted-foreground">
                      {papel ?? "—"}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={sair}>
                    <LogOut className="mr-2 size-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
