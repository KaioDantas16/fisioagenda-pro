import { useCurrentUser } from "@/hooks/use-current-user";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useEffectiveTherapistId() {
  const { data: me } = useCurrentUser();
  
  return useQuery({
    queryKey: ["effective-therapist-id", me?.user?.id],
    queryFn: async () => {
      if (!me?.user) return null;
      if (me.isSuperAdmin) {
        // Se for super_admin, busca o therapist_id da tabela clinic_settings
        const { data } = await supabase.from("clinic_settings").select("therapist_id").maybeSingle();
        if (data?.therapist_id) {
          return data.therapist_id;
        }
      }
      // Se for admin ou se falhar, retorna o próprio ID do usuário
      return me.user.id;
    },
    enabled: !!me?.user,
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
  });
}
