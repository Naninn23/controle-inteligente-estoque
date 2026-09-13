import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, ShieldCheck } from "lucide-react";

import { Pagina } from "@/components/pagina";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { data as fmtData } from "@/lib/format";
import { useAuth, type Papel } from "@/lib/auth";

const PAPEIS: { valor: Papel; rotulo: string; descricao: string }[] = [
  {
    valor: "admin",
    rotulo: "Administrador",
    descricao: "Acesso total, inclusive usuários, configurações e auditoria.",
  },
  {
    valor: "gerente",
    rotulo: "Gerente",
    descricao: "Cadastros, inventário, relatórios e auditoria. Não altera permissões.",
  },
  {
    valor: "operador",
    rotulo: "Operador",
    descricao: "Consulta o estoque e lança entradas e saídas.",
  },
];

function Usuarios() {
  const { ehAdmin, session } = useAuth();
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ["usuarios"],
    queryFn: async () => {
      const [{ data: perfis, error }, { data: papeis }] = await Promise.all([
        supabase.from("profiles").select("id, nome, email, ativo, created_at").order("nome"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (error) throw error;
      const mapa = new Map((papeis ?? []).map((p) => [p.user_id, p.role as Papel]));
      return (perfis ?? []).map((p) => ({ ...p, papel: mapa.get(p.id) ?? ("operador" as Papel) }));
    },
  });

  const alterar = useMutation({
    mutationFn: async ({ id, papel }: { id: string; papel: Papel }) => {
      const { error } = await supabase.rpc("definir_papel", { _user_id: id, _role: papel });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Permissão atualizada.");
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const linhas = useMemo(() => {
    const t = busca.trim().toLowerCase();
    if (!t) return usuarios;
    return usuarios.filter(
      (u) => u.nome.toLowerCase().includes(t) || u.email.toLowerCase().includes(t),
    );
  }, [usuarios, busca]);

  return (
    <Pagina
      titulo="Usuários"
      descricao="Equipe, perfis de acesso e permissões aplicadas diretamente no banco."
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {PAPEIS.map((p) => (
          <Card key={p.valor} className="p-4">
            <div className="flex items-center gap-2 font-medium">
              <ShieldCheck className="size-4 text-primary" />
              {p.rotulo}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{p.descricao}</p>
          </Card>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por nome ou e-mail"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Usuário</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Desde</TableHead>
                <TableHead className="w-[190px]">Perfil</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && linhas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              )}
              {linhas.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    {u.nome || "—"}
                    {u.id === session?.user.id && (
                      <Badge variant="outline" className="ml-2">você</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {fmtData(u.created_at)}
                  </TableCell>
                  <TableCell>
                    {ehAdmin ? (
                      <Select
                        value={u.papel}
                        onValueChange={(v) => alterar.mutate({ id: u.id, papel: v as Papel })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PAPEIS.map((p) => (
                            <SelectItem key={p.valor} value={p.valor}>{p.rotulo}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="secondary" className="capitalize">{u.papel}</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <p className="text-sm text-muted-foreground">
        Novos usuários entram pelo cadastro na tela de acesso e recebem o perfil Operador; apenas
        administradores alteram permissões.
      </p>
    </Pagina>
  );
}

export const Route = createFileRoute("/_authenticated/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuários — Estoque Fácil" },
      { name: "description", content: "Gestão de usuários e perfis de acesso da equipe." },
      { property: "og:title", content: "Usuários — Estoque Fácil" },
      { property: "og:description", content: "Gestão de usuários e perfis de acesso da equipe." },
    ],
  }),
  component: Usuarios,
});
