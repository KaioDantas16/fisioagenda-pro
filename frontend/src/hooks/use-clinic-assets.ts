import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LOGO_URL as STATIC_LOGO, OWNER_PHOTO_URL as STATIC_PHOTO } from "@/lib/brand";

/**
 * Hook que retorna URLs ativas de logo e foto do profissional.
 * Prioriza valores salvos em clinic_settings (uploads via Configurações).
 * Faz fallback para os arquivos estáticos em /public.
 */
export function useClinicAssets() {
  const { data } = useQuery({
    queryKey: ["clinic_assets"],
    queryFn: async () => {
      const { data } = await supabase
        .from("clinic_settings")
        .select("logo_url, professional_photo_url")
        .maybeSingle();
      return data;
    },
    staleTime: 60_000,
  });

  return {
    logoUrl: (data as any)?.logo_url || STATIC_LOGO,
    ownerPhotoUrl: (data as any)?.professional_photo_url || STATIC_PHOTO,
  };
}
