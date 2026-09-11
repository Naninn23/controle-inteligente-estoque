import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Wand2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { gerarSku } from "@/lib/estoque";
import { brl } from "@/lib/format";

export type ProdutoForm = {
  id?: string;
  sku: string;
  nome: string;
  descricao: string;
  unidade: string;
  categoria_id: string | null;
  fornecedor_id: string | null;
  estoque_min: number;
  estoque_max: number;
  preco_venda: number;
  custo_medio: number;
  localizacao: string;
  codigo_barras: string;
  ativo: boolean;
};

export const produtoVazio: ProdutoForm = {
  sku: "",
  nome: "",
  descricao: "",
  unidade: "UN",
  categoria_id: null,
  fornecedor_id: null,
  estoque_min: 0,
  estoque_max: 0,
  preco_venda: 0,
  custo_medio: 0,
  localizacao: "",
  codigo_barras: "",
  ativo: true,
};

const UNIDADES = ["UN", "CX", "PC", "FD", "KG", "L", "M", "CT"];

export function ProdutoDialog({
  aberto,
  onOpenChange,
  inicial,
}: {
  aberto: boolean;
  onOpenChange: (v: boolean) => void;
  inicial: ProdutoForm;
}) {
  const [form, setForm] = useState<ProdutoForm>(inicial);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (aberto) setForm(inicial);
  }, [aberto, inicial]);

  const { data: categorias = [] } = useQuery({
    queryKey: ["categorias"],
    queryFn: async () =>
      (await supabase.from("categorias").select("id, nome").order("nome")).data ?? [],
  });
  const { data: fornecedores = [] } = useQuery({
    queryKey: ["fornecedores"],
    queryFn: async () =>
      (await supabase.from("fornecedores").select("id, nome").order("nome")).data ?? [],
  });

  const salvar = useMutation({
    mutationFn: async () => {
      if (!form.nome.trim()) throw new Error("Informe o nome do produto.");
      if (!form.sku.trim()) throw new Error("Informe o SKU do produto.");

      const dup = await supabase
        .from("produtos")
        .select("id")
        .eq("sku", form.sku.trim())
        .maybeSingle();
      if (dup.data && dup.data.id !== form.id) throw new Error("Já existe um produto com este SKU.");

      const payload = {
        sku: form.sku.trim(),
        nome: form.nome.trim(),
        descricao: form.descricao.trim() || null,
        unidade: form.unidade,
        categoria_id: form.categoria_id,
        fornecedor_id: form.fornecedor_id,
        estoque_min: Number(form.estoque_min) || 0,
        estoque_max: Number(form.estoque_max) || 0,
        preco_venda: Number(form.preco_venda) || 0,
        localizacao: form.localizacao.trim() || null,
        codigo_barras: form.codigo_barras.trim() || null,
        ativo: form.ativo,
      };

      const res = form.id
        ? await supabase.from("produtos").update(payload).eq("id", form.id)
        : await supabase.from("produtos").insert({ ...payload, custo_medio: Number(form.custo_medio) || 0 });
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      toast.success(form.id ? "Produto atualizado." : "Produto cadastrado.");
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      queryClient.invalidateQueries({ queryKey: ["painel"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const custo = Number(form.custo_medio) || 0;
  const preco = Number(form.preco_venda) || 0;
  const margem = preco > 0 && custo > 0 ? ((preco - custo) / preco) * 100 : 0;

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{form.id ? "Editar produto" : "Novo produto"}</DialogTitle>
          <DialogDescription>
            Preencha os dados do produto. O SKU precisa ser único.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Ex.: Café torrado 500g"
            />
          </div>

          <div>
            <Label htmlFor="sku">SKU</Label>
            <div className="flex gap-2">
              <Input
                id="sku"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })}
                placeholder="CAT-0001"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Gerar SKU"
                onClick={() =>
                  setForm({
                    ...form,
                    sku: gerarSku(
                      categorias.find((c) => c.id === form.categoria_id)?.nome,
                      form.nome,
                    ),
                  })
                }
              >
                <Wand2 className="size-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="codigo">Código de barras</Label>
            <Input
              id="codigo"
              value={form.codigo_barras}
              onChange={(e) => setForm({ ...form, codigo_barras: e.target.value })}
            />
          </div>

          <div>
            <Label>Categoria</Label>
            <Select
              value={form.categoria_id ?? "none"}
              onValueChange={(v) => setForm({ ...form, categoria_id: v === "none" ? null : v })}
            >
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem categoria</SelectItem>
                {categorias.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Fornecedor</Label>
            <Select
              value={form.fornecedor_id ?? "none"}
              onValueChange={(v) => setForm({ ...form, fornecedor_id: v === "none" ? null : v })}
            >
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem fornecedor</SelectItem>
                {fornecedores.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Unidade</Label>
            <Select value={form.unidade} onValueChange={(v) => setForm({ ...form, unidade: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {UNIDADES.map((u) => (
                  <SelectItem key={u} value={u}>{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="local">Localização</Label>
            <Input
              id="local"
              value={form.localizacao}
              onChange={(e) => setForm({ ...form, localizacao: e.target.value })}
              placeholder="A-01-02"
            />
          </div>

          <div>
            <Label htmlFor="min">Estoque mínimo</Label>
            <Input
              id="min"
              type="number"
              value={form.estoque_min}
              onChange={(e) => setForm({ ...form, estoque_min: Number(e.target.value) })}
            />
          </div>

          <div>
            <Label htmlFor="max">Estoque máximo</Label>
            <Input
              id="max"
              type="number"
              value={form.estoque_max}
              onChange={(e) => setForm({ ...form, estoque_max: Number(e.target.value) })}
            />
          </div>

          <div>
            <Label htmlFor="custo">Custo médio {form.id && "(calculado)"}</Label>
            <Input
              id="custo"
              type="number"
              step="0.01"
              disabled={!!form.id}
              value={form.custo_medio}
              onChange={(e) => setForm({ ...form, custo_medio: Number(e.target.value) })}
            />
          </div>

          <div>
            <Label htmlFor="preco">Preço de venda</Label>
            <Input
              id="preco"
              type="number"
              step="0.01"
              value={form.preco_venda}
              onChange={(e) => setForm({ ...form, preco_venda: Number(e.target.value) })}
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="desc">Descrição</Label>
            <Textarea
              id="desc"
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              rows={2}
            />
          </div>

          <div className="rounded-md border bg-muted/40 p-3 text-sm sm:col-span-2">
            Margem estimada:{" "}
            <strong>{margem > 0 ? `${margem.toFixed(1)}%` : "—"}</strong>{" "}
            <span className="text-muted-foreground">
              (custo {brl(custo)} · venda {brl(preco)})
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => salvar.mutate()} disabled={salvar.isPending}>
            {salvar.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
