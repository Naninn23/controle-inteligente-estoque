import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, PackageX } from "lucide-react";

import { Pagina } from "@/components/pagina";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { brl, qtd } from "@/lib/format";

function Alertas() {
  const [filtro, setFiltro] = useState("todos");

  const { data: produtos = [], isLoading } = useQuery({
    queryKey: ["alertas-pagina"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produtos")
        .select("id, nome, sku, unidade, saldo, estoque_min, estoque_max, custo_medio, localizacao, categorias(nome), fornecedores(nome)")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data ?? [];
    },
  });

  const zerados = produtos.filter((p) => Number(p.saldo) <= 0);
  const baixos = produtos.filter(
    (p) => Number(p.saldo) > 0 && Number(p.estoque_min) > 0 && Number(p.saldo) <= Number(p.estoque_min),
  );

  const linhas = useMemo(() => {
    if (filtro === "zerados") return zerados;
    if (filtro === "baixos") return baixos;
    return [...zerados, ...baixos];
  }, [filtro, zerados, baixos]);

  return (
    <Pagina
      titulo="Alertas"
      descricao="Produtos zerados e abaixo do estoque mínimo, com sugestão de reposição."
      acoes={
        <Button asChild>
          <Link to="/entradas">Lançar entrada</Link>
        </Button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="flex items-center gap-3 p-4">
          <PackageX className="size-8 text-destructive" />
          <div>
            <div className="text-2xl font-bold tabular-nums">{zerados.length}</div>
            <div className="text-sm text-muted-foreground">Produtos sem estoque</div>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <AlertTriangle className="size-8 text-amber-500" />
          <div>
            <div className="text-2xl font-bold tabular-nums">{baixos.length}</div>
            <div className="text-sm text-muted-foreground">Produtos com estoque baixo</div>
          </div>
        </Card>
      </div>

      <Select value={filtro} onValueChange={setFiltro}>
        <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os alertas</SelectItem>
          <SelectItem value="zerados">Somente zerados</SelectItem>
          <SelectItem value="baixos">Somente estoque baixo</SelectItem>
        </SelectContent>
      </Select>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[220px]">Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead className="text-right">Mínimo</TableHead>
                <TableHead className="text-right">Repor</TableHead>
                <TableHead className="text-right">Custo est.</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && linhas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    Nenhum alerta no momento.
                  </TableCell>
                </TableRow>
              )}
              {linhas.map((p) => {
                const alvo = Number(p.estoque_max) > 0 ? Number(p.estoque_max) : Number(p.estoque_min);
                const repor = Math.max(alvo - Number(p.saldo), 0);
                const zerado = Number(p.saldo) <= 0;
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-medium">{p.nome}</div>
                      <div className="text-xs text-muted-foreground">
                        {p.sku}
                        {p.localizacao ? ` · ${p.localizacao}` : ""}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.categorias?.nome ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.fornecedores?.nome ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{qtd(p.saldo)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {qtd(p.estoque_min)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {qtd(repor)} {p.unidade}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {brl(repor * Number(p.custo_medio))}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          zerado
                            ? "border-destructive/30 bg-destructive/15 text-destructive"
                            : "border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        }
                      >
                        {zerado ? "Sem estoque" : "Baixo"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </Pagina>
  );
}

export const Route = createFileRoute("/_authenticated/alertas")({
  head: () => ({
    meta: [
      { title: "Alertas — Estoque Fácil" },
      { name: "description", content: "Produtos zerados e com estoque baixo, com sugestão de reposição." },
      { property: "og:title", content: "Alertas — Estoque Fácil" },
      { property: "og:description", content: "Produtos zerados e com estoque baixo, com sugestão de reposição." },
    ],
  }),
  component: Alertas,
});
