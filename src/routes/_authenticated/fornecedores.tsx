import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Plus, Search } from "lucide-react";

import { Pagina } from "@/components/pagina";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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
import {
  FornecedorDialog,
  fornecedorVazio,
  type FornecedorForm,
} from "@/components/fornecedor-dialog";
import { useAuth } from "@/lib/auth";

function Fornecedores() {
  const { podeGerenciar } = useAuth();
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("todos");
  const [aberto, setAberto] = useState(false);
  const [inicial, setInicial] = useState<FornecedorForm>(fornecedorVazio);

  const { data: fornecedores = [], isLoading } = useQuery({
    queryKey: ["fornecedores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fornecedores")
        .select("id, nome, documento, email, telefone, cidade, uf, ativo")
        .order("nome");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: contagem = {} } = useQuery({
    queryKey: ["fornecedores-produtos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("produtos").select("fornecedor_id");
      if (error) throw error;
      const mapa: Record<string, number> = {};
      for (const p of data ?? []) {
        if (p.fornecedor_id) mapa[p.fornecedor_id] = (mapa[p.fornecedor_id] ?? 0) + 1;
      }
      return mapa;
    },
  });

  const linhas = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return fornecedores.filter((f) => {
      if (status === "ativos" && !f.ativo) return false;
      if (status === "inativos" && f.ativo) return false;
      if (!t) return true;
      return [f.nome, f.documento, f.email, f.cidade]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(t));
    });
  }, [fornecedores, busca, status]);

  const novo = () => {
    setInicial(fornecedorVazio);
    setAberto(true);
  };

  return (
    <Pagina
      titulo="Fornecedores"
      descricao="Cadastro de fornecedores vinculados aos produtos e às entradas."
      acoes={
        podeGerenciar && (
          <Button onClick={novo}>
            <Plus className="mr-2 size-4" /> Novo fornecedor
          </Button>
        )
      }
    >
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por nome, documento, e-mail ou cidade"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="ativos">Ativos</SelectItem>
            <SelectItem value="inativos">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Fornecedor</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Cidade/UF</TableHead>
                <TableHead className="text-right">Produtos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && linhas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    Nenhum fornecedor encontrado.
                  </TableCell>
                </TableRow>
              )}
              {linhas.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.nome}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {f.documento ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div>{f.email ?? "—"}</div>
                    <div>{f.telefone ?? ""}</div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {[f.cidade, f.uf].filter(Boolean).join("/") || "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <Link
                      to="/produtos"
                      search={{ q: f.nome }}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {contagem[f.id] ?? 0}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={f.ativo ? "secondary" : "outline"}>
                      {f.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {podeGerenciar && (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Editar ${f.nome}`}
                        onClick={() => {
                          setInicial({
                            id: f.id,
                            nome: f.nome,
                            documento: f.documento ?? "",
                            email: f.email ?? "",
                            telefone: f.telefone ?? "",
                            cidade: f.cidade ?? "",
                            uf: f.uf ?? "",
                            ativo: f.ativo,
                          });
                          setAberto(true);
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <FornecedorDialog aberto={aberto} onOpenChange={setAberto} inicial={inicial} />
    </Pagina>
  );
}

export const Route = createFileRoute("/_authenticated/fornecedores")({
  head: () => ({
    meta: [
      { title: "Fornecedores — Estoque Fácil" },
      { name: "description", content: "Cadastro de fornecedores vinculados às entradas de estoque." },
      { property: "og:title", content: "Fornecedores — Estoque Fácil" },
      { property: "og:description", content: "Cadastro de fornecedores vinculados às entradas de estoque." },
    ],
  }),
  component: Fornecedores,
});
