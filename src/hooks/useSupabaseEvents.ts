import { useEffect } from "react";
import { supabaseClient } from "@/db/supabase.client";
import type { EventHandler } from "@/types";

export function useSupabaseEvents(eventName: string, handler: EventHandler) {
  useEffect(() => {
    // Subskrybuj do kanału auth
    const channel = supabaseClient.channel("auth_events");

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
