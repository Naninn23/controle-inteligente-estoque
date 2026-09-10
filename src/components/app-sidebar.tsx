import { Link, useRouterState } from "@tanstack/react-router";
import { Boxes } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { navItems, grupos } from "@/lib/nav";
import { useAuth } from "@/lib/auth";

export function AppSidebar({ empresa }: { empresa: string }) {
  const { state, setOpenMobile, isMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const { podeGerenciar, ehAdmin } = useAuth();
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  const visiveis = navItems.filter(
    (i) => (!i.somenteAdmin || ehAdmin) && (!i.somenteGestor || podeGerenciar),
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link
          to="/painel"
          onClick={() => isMobile && setOpenMobile(false)}
          className="flex items-center gap-2 px-1 py-1.5 font-extrabold tracking-tight"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Boxes className="size-5" />
          </span>
          {!collapsed && <span className="truncate">{empresa}</span>}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {grupos.map((grupo) => {
          const itens = visiveis.filter((i) => i.grupo === grupo);
          if (itens.length === 0) return null;
          return (
            <SidebarGroup key={grupo}>
              <SidebarGroupLabel>{grupo}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {itens.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.titulo}
                        isActive={pathname === item.url || pathname.startsWith(item.url + "/")}
                      >
                        <Link
                          to={item.url}
                          onClick={() => isMobile && setOpenMobile(false)}
                          className="flex items-center gap-2"
                        >
                          <item.icone className="size-4 shrink-0" />
                          <span>{item.titulo}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}
