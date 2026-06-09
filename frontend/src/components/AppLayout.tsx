import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { Calendar, Users, LayoutDashboard, LogOut, Settings, FileText, Heart, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LOGO_URL, CLINIC, applyTheme } from "@/lib/brand";
import { useClinicAssets } from "@/hooks/use-clinic-assets";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";

const fisioNav = [
  { to: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { to: "/agenda", label: "Agenda", icon: Calendar },
  { to: "/pacientes", label: "Pacientes", icon: Users },
  { to: "/prontuario/novo", label: "Prontuário", icon: FileText },
] as const;

const pacienteNav = [
  { to: "/portal-paciente", label: "Meu portal", icon: Heart },
] as const;

export function AppLayout() {
  const loc = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: me, isLoading } = useCurrentUser();
  const isSuper = !!me?.isSuperAdmin;
  const isPaciente = !!me?.isPaciente && !me?.isAdmin;

  // Carrega tema: primeiro localStorage (rápido, sem flash), depois sincroniza com clinic_settings.
  useEffect(() => {
    if (typeof localStorage !== "undefined") {
      const cached = localStorage.getItem("fisio-theme");
      if (cached) applyTheme(cached);
    }
    supabase.from("clinic_settings").select("theme").maybeSingle().then(({ data }) => {
      if (data?.theme) {
        applyTheme(data.theme);
        if (typeof localStorage !== "undefined") localStorage.setItem("fisio-theme", data.theme);
      }
    });
  }, []);

  // Redirecionamentos baseados em papel
  useEffect(() => {
    if (isLoading || !me?.user) return;
    const path = loc.pathname;
    if (isPaciente && !path.startsWith("/portal-paciente")) {
      navigate({ to: "/portal-paciente", replace: true });
    } else if (!isPaciente && path.startsWith("/portal-paciente")) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [isLoading, me, isPaciente, loc.pathname, navigate]);

  const nav = isPaciente
    ? pacienteNav
    : [...fisioNav, ...(isSuper ? [{ to: "/configuracoes" as const, label: "Config.", icon: Settings }] : [])];

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const { logoUrl } = useClinicAssets();

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-60 bg-sidebar border-r border-sidebar-border z-30">
        <div className="p-5 flex items-center gap-3 border-b border-sidebar-border">
          <img src={logoUrl} alt="" className="h-10 w-10 rounded-full object-contain bg-white" />
          <div className="min-w-0">
            <p className="font-display font-bold text-sm leading-tight">FisioAgenda Pro</p>
            <p className="text-[11px] text-muted-foreground truncate">
              {isPaciente ? "Portal do paciente" : CLINIC.owner}
            </p>
          </div>
        </div>
        {isSuper && (
          <div className="mx-3 mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 text-primary text-xs font-medium">
            <ShieldCheck className="h-4 w-4" /> Suporte Técnico
          </div>
        )}
        <nav className="p-3 space-y-1 flex-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = loc.pathname.startsWith(item.to);
            return (
              <Link key={item.to} to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  active ? "gradient-brand text-white shadow-card" : "text-sidebar-foreground hover:bg-sidebar-accent",
                )}>
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <Button variant="ghost" className="w-full justify-start gap-3" onClick={signOut}>
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 md:ml-60">
        <header className="h-14 px-4 lg:px-6 border-b bg-card flex items-center gap-3 sticky top-0 z-20 md:hidden">
          <img src={logoUrl} alt="" className="h-8 w-8 rounded-full bg-white object-contain" />
          <p className="font-display font-bold flex-1">FisioAgenda Pro</p>
          {isSuper && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">
              <ShieldCheck className="h-3 w-3" /> Suporte
            </span>
          )}
        </header>
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border flex justify-around py-2 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = loc.pathname.startsWith(item.to);
          return (
            <Link key={item.to} to={item.to}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg flex-1 max-w-20 text-[10px] font-medium transition",
                active ? "text-primary" : "text-muted-foreground",
              )}>
              <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button onClick={signOut}
          className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg flex-1 max-w-20 text-[10px] font-medium text-muted-foreground">
          <LogOut className="h-5 w-5" />
          <span>Sair</span>
        </button>
      </nav>
    </div>
  );
}
