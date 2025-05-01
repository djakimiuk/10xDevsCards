import { useEffect } from "react";
import { supabase } from "@/lib/supabase.client";
import type { EventHandler } from "@/types";

export function useSupabaseEvents(eventName: string, handler: EventHandler) {
  useEffect(() => {
    // Subskrybuj do kanału auth
    const channel = supabase.channel("auth_events");

    channel
      .on("broadcast", { event: eventName }, ({ payload }) => {
        handler(payload);
      })
      .subscribe();

    // Cleanup przy odmontowaniu
    return () => {
      channel.unsubscribe();
    };
  }, [eventName, handler]);
}
