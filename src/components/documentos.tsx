import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

type Tipo = "entrada" | "saida";
type Item = { produto_id: string; quantidade: string; valor_unitario: string };

const itemVazio: Item = { produto_id: "", quantidade: "1", valor_unitario: "0" };

export function Documentos({ tipo }: { tipo: Tipo }) {
  const queryClient = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const [fornecedorId, setFornecedorId] = useState<string>("");
  const [destino, setDestino] = useState("");
  const [observacao, setObservacao] = useState("");
  const [itens, setItens] = useState<Item[]>([{ ...itemVazio }]);

  const { data: documentos = [], isLoading } = useQuery({
    queryKey: ["documentos", tipo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos")
        .select(
          "id, numero, status, destino, observacao, total, created_at, confirmado_em, fornecedores(nome), documento_itens(id, quantidade, valor_unitario, produtos(nome, sku))",
        )
        .eq("tipo", tipo)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: produtos = [] } = useQuery({
    queryKey: ["produtos-simples"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produtos")
        .select("id, nome, sku, unidade, saldo, custo_medio")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: fornecedores = [] } = useQuery({
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

  const total = useMemo(
    () =>
      itens.reduce(
        (s, i) => s + (Number(i.quantidade) || 0) * (Number(i.valor_unitario) || 0),
        0,
      ),
    [itens],
  );

  const limpar = () => {
    setFornecedorId("");
    setDestino("");
    setObservacao("");
    setItens([{ ...itemVazio }]);
  };

  const criar = useMutation({
    mutationFn: async (confirmar: boolean) => {
      const validos = itens.filter((i) => i.produto_id && Number(i.quantidade) > 0);
      if (validos.length === 0) throw new Error("Adicione ao menos um item com quantidade.");

      const doc = await supabase
        .from("documentos")
        .insert({
          tipo,
          fornecedor_id: tipo === "entrada" && fornecedorId ? fornecedorId : null,
          destino: tipo === "saida" ? destino.trim() || null : null,
          observacao: observacao.trim() || null,
        })
        .select("id")
        .single();
      if (doc.error) throw doc.error;

      const ins = await supabase.from("documento_itens").insert(
        validos.map((i) => ({
          documento_id: doc.data.id,
          produto_id: i.produto_id,
          quantidade: Number(i.quantidade),
          valor_unitario: Number(i.valor_unitario) || 0,
        })),
      );
      if (ins.error) throw ins.error;

      if (confirmar) {
        const rpc = await supabase.rpc("confirmar_documento", { _documento_id: doc.data.id });
        if (rpc.error) throw rpc.error;
      }
    },
    onSuccess: (_d, confirmar) => {
      toast.success(confirmar ? "Documento confirmado e estoque atualizado." : "Rascunho salvo.");
      queryClient.invalidateQueries();
      setAberto(false);
      limpar();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const confirmar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("confirmar_documento", { _documento_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Documento confirmado.");
      queryClient.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setAberto(true)}>
          <Plus className="mr-2 size-4" />
          {tipo === "entrada" ? "Nova entrada" : "Nova saída"}
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="min-w-[200px]">
                  {tipo === "entrada" ? "Fornecedor" : "Destino"}
                </TableHead>
                <TableHead>Itens</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32" />
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
              {!isLoading && documentos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    Nenhum documento lançado ainda.
                  </TableCell>
                </TableRow>
              )}
              {documentos.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="tabular-nums">#{d.numero}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {dataHora(d.created_at)}
                  </TableCell>
                  <TableCell>
                    {tipo === "entrada" ? d.fornecedores?.nome ?? "—" : d.destino ?? "—"}
                    {d.observacao && (
                      <div className="text-xs text-muted-foreground">{d.observacao}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {(d.documento_itens ?? []).length} item(ns)
                    <div className="text-xs">
                      {(d.documento_itens ?? [])
                        .slice(0, 2)
                        .map((i) => `${i.produtos?.sku ?? ""} × ${qtd(i.quantidade)}`)
                        .join(", ")}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{brl(d.total)}</TableCell>
                  <TableCell>
                    <Badge variant={d.status === "confirmado" ? "secondary" : "outline"}>
                      {d.status === "confirmado" ? "Confirmado" : "Rascunho"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {d.status === "rascunho" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={confirmar.isPending}
                        onClick={() => confirmar.mutate(d.id)}
                      >
                        <CheckCircle2 className="mr-1 size-4" /> Confirmar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {tipo === "entrada" ? "Nova entrada de estoque" : "Nova saída de estoque"}
            </DialogTitle>
            <DialogDescription>
              Ao confirmar, cada item gera uma movimentação com saldo anterior, saldo posterior e
              custo médio ponderado.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            {tipo === "entrada" ? (
              <div>
                <Label>Fornecedor</Label>
                <Select value={fornecedorId} onValueChange={setFornecedorId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {fornecedores.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <Label htmlFor="destino">Destino</Label>
                <Input
                  id="destino"
                  placeholder="Cliente, setor ou obra"
                  value={destino}
                  onChange={(e) => setDestino(e.target.value)}
                />
              </div>
            )}
            <div>
              <Label htmlFor="obs">Observação</Label>
              <Textarea
                id="obs"
                rows={1}
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            {itens.map((item, idx) => {
              const p = produtos.find((x) => x.id === item.produto_id);
              return (
                <div key={idx} className="grid gap-2 sm:grid-cols-[1fr_110px_130px_40px]">
                  <div>
                    <Select
                      value={item.produto_id}
                      onValueChange={(v) => {
                        const prod = produtos.find((x) => x.id === v);
                        setItens((arr) =>
                          arr.map((it, i) =>
                            i === idx
                              ? {
                                  ...it,
                                  produto_id: v,
                                  valor_unitario:
                                    tipo === "saida" || Number(it.valor_unitario) === 0
                                      ? String(Number(prod?.custo_medio ?? 0))
                                      : it.valor_unitario,
                                }
                              : it,
                          ),
                        );
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="Produto" /></SelectTrigger>
                      <SelectContent>
                        {produtos.map((p2) => (
                          <SelectItem key={p2.id} value={p2.id}>
                            {p2.nome} — {p2.sku}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {p && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Saldo atual: {qtd(p.saldo)} {p.unidade} · custo médio {brl(p.custo_medio)}
                      </p>
                    )}
                  </div>
                  <Input
                    inputMode="decimal"
                    placeholder="Qtd."
                    value={item.quantidade}
                    onChange={(e) =>
                      setItens((arr) =>
                        arr.map((it, i) => (i === idx ? { ...it, quantidade: e.target.value } : it)),
                      )
                    }
                  />
                  <Input
                    inputMode="decimal"
                    placeholder="Valor unit."
                    value={item.valor_unitario}
                    onChange={(e) =>
                      setItens((arr) =>
                        arr.map((it, i) =>
                          i === idx ? { ...it, valor_unitario: e.target.value } : it,
                        ),
                      )
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remover item"
                    onClick={() => setItens((arr) => arr.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              );
            })}
            <Button variant="outline" size="sm" onClick={() => setItens((a) => [...a, { ...itemVazio }])}>
              <Plus className="mr-2 size-4" /> Adicionar item
            </Button>
          </div>

          <div className="text-right text-sm">
            Total do documento: <span className="font-semibold">{brl(total)}</span>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => criar.mutate(false)} disabled={criar.isPending}>
              Salvar rascunho
            </Button>
            <Button onClick={() => criar.mutate(true)} disabled={criar.isPending}>
              {criar.isPending ? "Processando..." : "Confirmar e atualizar estoque"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
