import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type FornecedorForm = {
  id?: string;
  nome: string;
  documento: string;
  email: string;
  telefone: string;
  cidade: string;
  uf: string;
  ativo: boolean;
};

export const fornecedorVazio: FornecedorForm = {
  nome: "",
  documento: "",
  email: "",
  telefone: "",
  cidade: "",
  uf: "",
  ativo: true,
};

export function FornecedorDialog({
  aberto,
  onOpenChange,
  inicial,
}: {
  aberto: boolean;
  onOpenChange: (v: boolean) => void;
  inicial: FornecedorForm;
}) {
  const [form, setForm] = useState<FornecedorForm>(inicial);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (aberto) setForm(inicial);
  }, [aberto, inicial]);

  const salvar = useMutation({
    mutationFn: async () => {
      if (!form.nome.trim()) throw new Error("Informe o nome do fornecedor.");
      if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        throw new Error("Informe um e-mail válido.");
      }
      const payload = {
        nome: form.nome.trim(),
        documento: form.documento.trim() || null,
        email: form.email.trim() || null,
        telefone: form.telefone.trim() || null,
        cidade: form.cidade.trim() || null,
        uf: form.uf.trim().toUpperCase() || null,
        ativo: form.ativo,
      };
      const res = form.id
        ? await supabase.from("fornecedores").update(payload).eq("id", form.id)
        : await supabase.from("fornecedores").insert(payload);
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      toast.success(form.id ? "Fornecedor atualizado." : "Fornecedor cadastrado.");
      queryClient.invalidateQueries({ queryKey: ["fornecedores"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{form.id ? "Editar fornecedor" : "Novo fornecedor"}</DialogTitle>
          <DialogDescription>
            Fornecedores ficam disponíveis no cadastro de produtos e nas entradas.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="f-nome">Nome *</Label>
            <Input
              id="f-nome"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="f-doc">CNPJ / CPF</Label>
            <Input
              id="f-doc"
              value={form.documento}
              onChange={(e) => setForm({ ...form, documento: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="f-tel">Telefone</Label>
            <Input
              id="f-tel"
              value={form.telefone}
              onChange={(e) => setForm({ ...form, telefone: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="f-email">E-mail</Label>
            <Input
              id="f-email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="f-cidade">Cidade</Label>
            <Input
              id="f-cidade"
              value={form.cidade}
              onChange={(e) => setForm({ ...form, cidade: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="f-uf">UF</Label>
            <Input
              id="f-uf"
              maxLength={2}
              value={form.uf}
              onChange={(e) => setForm({ ...form, uf: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-3 sm:col-span-2">
            <Switch
              id="f-ativo"
              checked={form.ativo}
              onCheckedChange={(v) => setForm({ ...form, ativo: v })}
            />
            <Label htmlFor="f-ativo">Fornecedor ativo</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => salvar.mutate()} disabled={salvar.isPending}>
            {salvar.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
