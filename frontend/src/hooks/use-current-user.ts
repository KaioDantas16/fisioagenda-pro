import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        return {
          user: null,
          roles: [] as string[],
          isSuperAdmin: false,
          isAdmin: false,
          isPaciente: false,
        };
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      const roleList = (roles ?? []).map((r: any) => r.role as string);
      return {
        user,
        roles: roleList,
        isSuperAdmin: roleList.includes("super_admin"),
        isAdmin: roleList.includes("admin") || roleList.includes("super_admin"),
        isPaciente: roleList.includes("paciente"),
      };
    },
    staleTime: 60_000,
  });
}
