import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowUpRight, Scale, Search } from "lucide-react";

import { Pagina } from "@/components/pagina";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { brl, dataHora, qtd } from "@/lib/format";

const rotuloTipo = { entrada: "Entrada", saida: "Saída", ajuste: "Ajuste" } as const;
const classeTipo = {
  entrada: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400",
  saida: "bg-destructive/15 text-destructive border-destructive/30",
  ajuste: "bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400",
} as const;
const iconeTipo = { entrada: ArrowDownLeft, saida: ArrowUpRight, ajuste: Scale } as const;

function Movimentacoes() {
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState("todos");

  const { data: movimentos = [], isLoading } = useQuery({
    queryKey: ["movimentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movimentos")
        .select(
          "id, tipo, quantidade, saldo_anterior, saldo_posterior, custo_unitario, custo_medio_anterior, custo_medio_posterior, origem, observacao, created_at, produtos(nome, sku, unidade)",
        )
        .order("created_at", { ascending: false })
        .limit(400);
      if (error) throw error;
      return data ?? [];
    },
  });

  const linhas = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return movimentos.filter((m) => {
      if (tipo !== "todos" && m.tipo !== tipo) return false;
      if (!t) return true;
      return (
        (m.produtos?.nome ?? "").toLowerCase().includes(t) ||
        (m.produtos?.sku ?? "").toLowerCase().includes(t)
      );
    });
  }, [movimentos, busca, tipo]);

  return (
    <Pagina
      titulo="Movimentações"
      descricao="Histórico imutável com saldo anterior, saldo posterior e custo médio ponderado."
      acoes={
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/entradas">
              <ArrowDownLeft className="mr-2 size-4" />
              Nova entrada
            </Link>
          </Button>
          <Button asChild>
            <Link to="/saidas">
              <ArrowUpRight className="mr-2 size-4" />
              Nova saída
            </Link>
          </Button>
        </div>
      }
    >
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por produto ou SKU"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="entrada">Entradas</SelectItem>
            <SelectItem value="saida">Saídas</SelectItem>
            <SelectItem value="ajuste">Ajustes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead className="min-w-[220px]">Produto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Qtd.</TableHead>
                <TableHead className="text-right">Saldo anterior</TableHead>
                <TableHead className="text-right">Saldo posterior</TableHead>
                <TableHead className="text-right">Custo unit.</TableHead>
                <TableHead className="text-right">Custo médio</TableHead>
                <TableHead>Origem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && linhas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                    Nenhuma movimentação encontrada.
                  </TableCell>
                </TableRow>
              )}
              {linhas.map((m) => {
                const t = m.tipo as keyof typeof rotuloTipo;
                const Icone = iconeTipo[t];
                return (
                  <TableRow key={m.id}>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {dataHora(m.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{m.produtos?.nome ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{m.produtos?.sku}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={classeTipo[t]}>
                        <Icone className="mr-1 size-3" />
                        {rotuloTipo[t]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {qtd(m.quantidade)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {qtd(m.saldo_anterior)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {qtd(m.saldo_posterior)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{brl(m.custo_unitario)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {brl(m.custo_medio_anterior)} → {brl(m.custo_medio_posterior)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {m.observacao ?? m.origem}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      <p className="text-sm text-muted-foreground">
        {linhas.length} movimentação(ões). Registros são imutáveis: correções são feitas por
        inventário ou novo documento.
      </p>
    </Pagina>
  );
}

export const Route = createFileRoute("/_authenticated/movimentacoes")({
  head: () => ({
    meta: [
      { title: "Movimentações — Estoque Fácil" },
      {
        name: "description",
        content: "Histórico imutável de entradas, saídas e ajustes com saldo e custo médio.",
      },
      { property: "og:title", content: "Movimentações — Estoque Fácil" },
      {
        property: "og:description",
        content: "Histórico imutável de entradas, saídas e ajustes com saldo e custo médio.",
      },
    ],
  }),
  component: Movimentacoes,
});
