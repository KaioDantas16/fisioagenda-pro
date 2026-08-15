import { Link, useLocation } from "@tanstack/react-router";
import { Calendar, CalendarDays, Users, LayoutDashboard, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/dashboard" as const, label: "Início", icon: LayoutDashboard, match: (path: string) => path.startsWith("/dashboard") },
  { to: "/pacientes" as const, label: "Pacientes", icon: Users, match: (path: string) => path.startsWith("/pacientes") },
  { to: "/agenda" as const, label: "Agenda", icon: Calendar, match: (path: string) => path.startsWith("/agenda") },
  { to: "/prontuario/novo" as const, label: "Prontuário", icon: FileText, match: (path: string) => path.startsWith("/prontuario") },
  { to: "/agenda" as const, label: "Hoje", icon: CalendarDays, match: (path: string) => path.startsWith("/agenda") },
];

export function MobileBottomNav() {
  const loc = useLocation();

  return (
    <nav
      aria-label="Navegação principal"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border/80 bg-card/95 backdrop-blur-xl pb-[max(0.4rem,env(safe-area-inset-bottom))]"
    >
      <ul className="grid grid-cols-5 px-1 pt-1.5">
        {items.map((item, index) => {
          const Icon = item.icon;
          const active = item.match(loc.pathname);
          return (
            <li key={`${item.label}-${index}`}>
              <Link
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-1.5 rounded-2xl text-[10px] font-semibold tracking-wide transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-xl transition-all",
                    active && "gradient-brand text-white shadow-card",
                  )}
                >
                  <Icon className={cn("h-5 w-5", active && "stroke-[2.4]")} />
                </span>
                <span className="leading-none">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
