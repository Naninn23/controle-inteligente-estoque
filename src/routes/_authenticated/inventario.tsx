import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, ClipboardList, Plus } from "lucide-react";

import { Pagina } from "@/components/pagina";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { dataHora, qtd } from "@/lib/format";
import { useAuth } from "@/lib/auth";

function Inventario() {
  const { podeGerenciar } = useAuth();
  const queryClient = useQueryClient();
  const [descricao, setDescricao] = useState("");
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [contagens, setContagens] = useState<Record<string, string>>({});

  const { data: inventarios = [] } = useQuery({
    queryKey: ["inventarios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventarios")
        .select("id, descricao, status, created_at, finalizado_em")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const atual = selecionado ?? inventarios[0]?.id ?? null;
  const inventarioAtual = inventarios.find((i) => i.id === atual);

  const { data: itens = [] } = useQuery({
    queryKey: ["inventario-itens", atual],
    enabled: !!atual,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventario_itens")
        .select("id, produto_id, saldo_sistema, saldo_contado, produtos(nome, sku, unidade)")
        .eq("inventario_id", atual!);
      if (error) throw error;
      return (data ?? []).sort((a, b) =>
        (a.produtos?.nome ?? "").localeCompare(b.produtos?.nome ?? "", "pt-BR"),
      );
    },
  });

  const criar = useMutation({
    mutationFn: async () => {
      const inv = await supabase
        .from("inventarios")
        .insert({ descricao: descricao.trim() || "Inventário" })
        .select("id")
        .single();
      if (inv.error) throw inv.error;

      const produtos = await supabase
        .from("produtos")
        .select("id, saldo")
        .eq("ativo", true);
      if (produtos.error) throw produtos.error;

      const linhas = (produtos.data ?? []).map((p) => ({
        inventario_id: inv.data.id,
        produto_id: p.id,
        saldo_sistema: p.saldo,
      }));
      if (linhas.length) {
        const ins = await supabase.from("inventario_itens").insert(linhas);
        if (ins.error) throw ins.error;
      }
      return inv.data.id;
    },
    onSuccess: (id) => {
      toast.success("Inventário aberto com a posição atual do estoque.");
      setDescricao("");
      setSelecionado(id);
      setContagens({});
      queryClient.invalidateQueries({ queryKey: ["inventarios"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const salvarContagem = useMutation({
    mutationFn: async ({ id, valor }: { id: string; valor: number }) => {
      const res = await supabase
        .from("inventario_itens")
        .update({ saldo_contado: valor })
        .eq("id", id);
      if (res.error) throw res.error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventario-itens", atual] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const finalizar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("finalizar_inventario", { _inventario_id: atual! });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Inventário finalizado. Ajustes lançados nas movimentações.");
      queryClient.invalidateQueries({ queryKey: ["inventarios"] });
      queryClient.invalidateQueries({ queryKey: ["inventario-itens", atual] });
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      queryClient.invalidateQueries({ queryKey: ["movimentos"] });
      queryClient.invalidateQueries({ queryKey: ["painel"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const aberto = inventarioAtual?.status === "aberto";

  return (
    <Pagina
      titulo="Inventário"
      descricao="Conte o estoque físico e gere ajustes automáticos com trilha de auditoria."
    >
      {podeGerenciar && (
        <Card className="flex flex-wrap items-end gap-3 p-4">
          <div className="min-w-[220px] flex-1">
            <label className="text-sm font-medium" htmlFor="desc-inv">
              Nova contagem
            </label>
            <Input
              id="desc-inv"
              className="mt-1"
              placeholder="Ex.: Inventário geral de setembro"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>
          <Button onClick={() => criar.mutate()} disabled={criar.isPending}>
            <Plus className="mr-2 size-4" /> Abrir inventário
          </Button>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        {inventarios.map((i) => (
          <Button
            key={i.id}
            variant={i.id === atual ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setSelecionado(i.id);
              setContagens({});
            }}
          >
            <ClipboardList className="mr-2 size-4" />
            {i.descricao}
            <Badge variant="secondary" className="ml-2">
              {i.status === "aberto" ? "Aberto" : "Finalizado"}
            </Badge>
          </Button>
        ))}
        {inventarios.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhum inventário criado ainda.
          </p>
        )}
      </div>

      {atual && (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
            <div>
              <p className="font-medium">{inventarioAtual?.descricao}</p>
              <p className="text-xs text-muted-foreground">
                Criado em {dataHora(inventarioAtual?.created_at)}
                {inventarioAtual?.finalizado_em &&
                  ` · Finalizado em ${dataHora(inventarioAtual.finalizado_em)}`}
              </p>
            </div>
            {aberto && podeGerenciar && (
              <Button onClick={() => finalizar.mutate()} disabled={finalizar.isPending}>
                <CheckCircle2 className="mr-2 size-4" /> Finalizar e ajustar estoque
              </Button>
            )}
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[220px]">Produto</TableHead>
                  <TableHead className="text-right">Saldo do sistema</TableHead>
                  <TableHead className="text-right">Saldo contado</TableHead>
                  <TableHead className="text-right">Diferença</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itens.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                      Nenhum item nesta contagem.
                    </TableCell>
                  </TableRow>
                )}
                {itens.map((it) => {
                  const valor = contagens[it.id] ?? (it.saldo_contado?.toString() ?? "");
                  const dif =
                    valor === "" ? null : Number(valor) - Number(it.saldo_sistema);
                  return (
                    <TableRow key={it.id}>
                      <TableCell>
                        <div className="font-medium">{it.produtos?.nome ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">
                          {it.produtos?.sku} · {it.produtos?.unidade}
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {qtd(it.saldo_sistema)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          className="ml-auto w-28 text-right"
                          disabled={!aberto || !podeGerenciar}
                          value={valor}
                          onChange={(e) =>
                            setContagens((c) => ({ ...c, [it.id]: e.target.value }))
                          }
                          onBlur={(e) => {
                            if (e.target.value === "") return;
                            salvarContagem.mutate({ id: it.id, valor: Number(e.target.value) });
                          }}
                          aria-label={`Saldo contado de ${it.produtos?.nome}`}
                        />
                      </TableCell>
                      <TableCell
                        className={`text-right tabular-nums font-medium ${
                          dif === null || dif === 0
                            ? "text-muted-foreground"
                            : dif > 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-destructive"
                        }`}
                      >
                        {dif === null ? "—" : `${dif > 0 ? "+" : ""}${qtd(dif)}`}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <p className="text-sm text-muted-foreground">
        Ao finalizar, cada diferença gera um movimento de ajuste com saldo anterior e posterior,
        mantendo o custo médio e registrando a alteração na auditoria.
      </p>
    </Pagina>
  );
}

export const Route = createFileRoute("/_authenticated/inventario")({
  head: () => ({
    meta: [
      { title: "Inventário — Estoque Fácil" },
      {
        name: "description",
        content: "Contagens de inventário com ajustes automáticos de saldo e auditoria.",
      },
      { property: "og:title", content: "Inventário — Estoque Fácil" },
      {
        property: "og:description",
        content: "Contagens de inventário com ajustes automáticos de saldo e auditoria.",
      },
    ],
  }),
  component: Inventario,
});
