import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { navItems } from "@/lib/nav";
import { useAuth } from "@/lib/auth";

export function BuscaGlobal() {
  const [aberto, setAberto] = useState(false);
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
        <CommandInput placeholder="Buscar telas e seções..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado.</CommandEmpty>
          <CommandGroup heading="Navegação">
            {visiveis.map((item) => (
              <CommandItem
                key={item.url}
                value={item.titulo}
                onSelect={() => {
                  setAberto(false);
                  navigate({ to: item.url });
                }}
              >
                <item.icone className="mr-2 size-4" />
                {item.titulo}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
