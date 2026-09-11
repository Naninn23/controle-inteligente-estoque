import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowUpDown, Package, Pencil, Plus, Search } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProdutoDialog, produtoVazio, type ProdutoForm } from "@/components/produto-dialog";
import { classeStatus, rotuloStatus, statusEstoque } from "@/lib/estoque";
import { brl, qtd } from "@/lib/format";
import { useAuth } from "@/lib/auth";

export function useProdutos() {
  return useQuery({
    queryKey: ["produtos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produtos")
        .select(
          "id, sku, nome, descricao, unidade, saldo, estoque_min, estoque_max, custo_medio, preco_venda, localizacao, codigo_barras, ativo, categoria_id, fornecedor_id, categorias(nome)",
        )
        .order("nome");
      if (error) throw error;
      return data ?? [];
    },
  });
}

type Ordem = "nome" | "saldo" | "valor";

export function TabelaProdutos({ modo }: { modo: "produtos" | "estoque" }) {
  const { podeGerenciar } = useAuth();
  const { data: produtos = [], isLoading } = useProdutos();
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("todas");
  const [status, setStatus] = useState("todos");
  const [ordem, setOrdem] = useState<Ordem>("nome");
  const [aberto, setAberto] = useState(false);
  const [edicao, setEdicao] = useState<ProdutoForm>(produtoVazio);

  const { data: categorias = [] } = useQuery({
    queryKey: ["categorias"],
    queryFn: async () =>
      (await supabase.from("categorias").select("id, nome").order("nome")).data ?? [],
  });

  const linhas = useMemo(() => {
    const t = busca.trim().toLowerCase();
    const filtradas = produtos.filter((p) => {
      const s = statusEstoque(Number(p.saldo), Number(p.estoque_min));
      if (categoria !== "todas" && p.categoria_id !== categoria) return false;
      if (status !== "todos" && s !== status) return false;
      if (!t) return true;
      return (
        p.nome.toLowerCase().includes(t) ||
        p.sku.toLowerCase().includes(t) ||
        (p.codigo_barras ?? "").toLowerCase().includes(t)
      );
    });
    return [...filtradas].sort((a, b) => {
      if (ordem === "saldo") return Number(b.saldo) - Number(a.saldo);
      if (ordem === "valor")
        return Number(b.saldo) * Number(b.custo_medio) - Number(a.saldo) * Number(a.custo_medio);
      return a.nome.localeCompare(b.nome, "pt-BR");
    });
  }, [produtos, busca, categoria, status, ordem]);

  const valorTotal = linhas.reduce((s, p) => s + Number(p.saldo) * Number(p.custo_medio), 0);

  const editar = (p: (typeof produtos)[number]) => {
    setEdicao({
      id: p.id,
      sku: p.sku,
      nome: p.nome,
      descricao: p.descricao ?? "",
      unidade: p.unidade,
      categoria_id: p.categoria_id,
      fornecedor_id: p.fornecedor_id,
      estoque_min: Number(p.estoque_min),
      estoque_max: Number(p.estoque_max),
      preco_venda: Number(p.preco_venda),
      custo_medio: Number(p.custo_medio),
      localizacao: p.localizacao ?? "",
      codigo_barras: p.codigo_barras ?? "",
      ativo: p.ativo,
    });
    setAberto(true);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="relative min-w-0">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por nome, SKU ou código de barras"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        {modo === "produtos" && podeGerenciar && (
          <Button
            onClick={() => {
              setEdicao(produtoVazio);
              setAberto(true);
            }}
          >
            <Plus className="mr-2 size-4" /> Novo produto
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={categoria} onValueChange={setCategoria}>
          <SelectTrigger className="w-[190px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as categorias</SelectItem>
            {categorias.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="baixo">Estoque baixo</SelectItem>
            <SelectItem value="sem">Sem estoque</SelectItem>
          </SelectContent>
        </Select>

        <Select value={ordem} onValueChange={(v) => setOrdem(v as Ordem)}>
          <SelectTrigger className="w-[190px]">
            <ArrowUpDown className="mr-2 size-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nome">Nome (A-Z)</SelectItem>
            <SelectItem value="saldo">Maior saldo</SelectItem>
            <SelectItem value="valor">Maior valor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[240px]">Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Un.</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead className="text-right">Mínimo</TableHead>
                <TableHead className="text-right">Custo médio</TableHead>
                <TableHead className="text-right">Valor total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Local</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={10} className="py-10 text-center text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && linhas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="py-10 text-center text-muted-foreground">
                    Nenhum produto encontrado com esses filtros.
                  </TableCell>
                </TableRow>
              )}
              {linhas.map((p) => {
                const s = statusEstoque(Number(p.saldo), Number(p.estoque_min));
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="grid size-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                          <Package className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium">{p.nome}</div>
                          <div className="truncate text-xs text-muted-foreground">{p.sku}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.categorias?.nome ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">{p.unidade}</TableCell>
                    <TableCell className="text-right tabular-nums">{qtd(p.saldo)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {qtd(p.estoque_min)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{brl(p.custo_medio)}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {brl(Number(p.saldo) * Number(p.custo_medio))}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={classeStatus[s]}>
                        {rotuloStatus[s]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.localizacao ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to="/movimentacoes">Histórico</Link>
                        </Button>
                        {podeGerenciar && (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Editar ${p.nome}`}
                            onClick={() => editar(p)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      <p className="text-sm text-muted-foreground">
        {linhas.length} produto(s) · valor total em estoque{" "}
        <strong className="text-foreground">{brl(valorTotal)}</strong>
      </p>

      <ProdutoDialog aberto={aberto} onOpenChange={setAberto} inicial={edicao} />
    </div>
  );
}
