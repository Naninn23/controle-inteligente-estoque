import {
  LayoutDashboard,
  Package,
  FolderTree,
  Truck,
  ArrowLeftRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  ClipboardList,
  BarChart3,
  Users,
  Settings,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  titulo: string;
  url: string;
  icone: LucideIcon;
  grupo: "Operação" | "Cadastros" | "Gestão" | "Administração";
  somenteGestor?: boolean;
  somenteAdmin?: boolean;
};

export const navItems: NavItem[] = [
  { titulo: "Dashboard", url: "/painel", icone: LayoutDashboard, grupo: "Operação" },
  { titulo: "Estoque", url: "/estoque", icone: Boxes, grupo: "Operação" },
  { titulo: "Entradas", url: "/entradas", icone: ArrowDownToLine, grupo: "Operação" },
  { titulo: "Saídas", url: "/saidas", icone: ArrowUpFromLine, grupo: "Operação" },
  { titulo: "Movimentações", url: "/movimentacoes", icone: ArrowLeftRight, grupo: "Operação" },
  { titulo: "Inventário", url: "/inventario", icone: ClipboardList, grupo: "Operação" },

  { titulo: "Produtos", url: "/produtos", icone: Package, grupo: "Cadastros" },
  { titulo: "Categorias", url: "/categorias", icone: FolderTree, grupo: "Cadastros" },
  { titulo: "Fornecedores", url: "/fornecedores", icone: Truck, grupo: "Cadastros" },

  { titulo: "Relatórios", url: "/relatorios", icone: BarChart3, grupo: "Gestão" },

  { titulo: "Usuários", url: "/usuarios", icone: Users, grupo: "Administração", somenteAdmin: true },
  { titulo: "Configurações", url: "/configuracoes", icone: Settings, grupo: "Administração", somenteGestor: true },
  { titulo: "Auditoria", url: "/auditoria", icone: ShieldCheck, grupo: "Administração", somenteGestor: true },
];

export const grupos = ["Operação", "Cadastros", "Gestão", "Administração"] as const;
