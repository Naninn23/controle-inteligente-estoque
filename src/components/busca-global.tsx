import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Package, Search, Truck } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { navItems } from "@/lib/nav";
import { useAuth } from "@/lib/auth";
import { qtd } from "@/lib/format";

export function BuscaGlobal() {
  const [aberto, setAberto] = useState(false);
  const [termo, setTermo] = useState("");
  const navigate = useNavigate();
  const { podeGerenciar, ehAdmin } = useAuth();

  const visiveis = navItems.filter(
    (i) => (!i.somenteAdmin || ehAdmin) && (!i.somenteGestor || podeGerenciar),
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setAberto((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const busca = termo.trim();

  const { data, isFetching } = useQuery({
    queryKey: ["busca-global", busca],
    enabled: aberto && busca.length >= 2,
    queryFn: async () => {
      const like = `%${busca}%`;
      const [produtos, fornecedores] = await Promise.all([
        supabase
          .from("produtos")
          .select("id, nome, sku, saldo, unidade, codigo_barras")
          .or(`nome.ilike.${like},sku.ilike.${like},codigo_barras.ilike.${like}`)
          .limit(8),
        supabase
          .from("fornecedores")
          .select("id, nome, cidade, uf")
          .or(`nome.ilike.${like},documento.ilike.${like},email.ilike.${like}`)
          .limit(5),
      ]);
      return { produtos: produtos.data ?? [], fornecedores: fornecedores.data ?? [] };
    },
  });

  const irPara = (url: string) => {
    setAberto(false);
    setTermo("");
    navigate({ to: url });
  };

  const telas = visiveis.filter((i) =>
    !busca ? true : i.titulo.toLowerCase().includes(busca.toLowerCase()),
  );

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setAberto(true)}
        className="text-muted-foreground gap-2 sm:w-64 sm:justify-start"
        aria-label="Busca global"
      >
        <Search className="size-4" />
        <span className="hidden sm:inline">Buscar...</span>
        <kbd className="ml-auto hidden rounded border px-1.5 text-[10px] sm:inline">Ctrl K</kbd>
      </Button>

      <CommandDialog open={aberto} onOpenChange={setAberto}>
        <CommandInput
          placeholder="Buscar produtos, SKU, código de barras, fornecedores..."
          value={termo}
          onValueChange={setTermo}
        />
        <CommandList>
          <CommandEmpty>
            {busca.length < 2
              ? "Digite ao menos 2 caracteres para buscar."
              : isFetching
                ? "Buscando..."
                : "Nenhum resultado encontrado."}
          </CommandEmpty>

          {(data?.produtos.length ?? 0) > 0 && (
            <CommandGroup heading="Produtos">
              {data!.produtos.map((p) => (
                <CommandItem
                  key={p.id}
                  value={`produto-${p.id}`}
                  onSelect={() => irPara("/estoque")}
                >
                  <Package className="mr-2 size-4" />
                  <span className="truncate">{p.nome}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {p.sku} · {qtd(p.saldo)} {p.unidade}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {(data?.fornecedores.length ?? 0) > 0 && (
            <CommandGroup heading="Fornecedores">
              {data!.fornecedores.map((f) => (
                <CommandItem
                  key={f.id}
                  value={`fornecedor-${f.id}`}
                  onSelect={() => irPara("/fornecedores")}
                >
                  <Truck className="mr-2 size-4" />
                  <span className="truncate">{f.nome}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {[f.cidade, f.uf].filter(Boolean).join("/")}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {telas.length > 0 && (
            <CommandGroup heading="Navegação">
              {telas.map((item) => (
                <CommandItem
                  key={item.url}
                  value={`tela-${item.titulo}`}
                  onSelect={() => irPara(item.url)}
                >
                  <item.icone className="mr-2 size-4" />
                  {item.titulo}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
