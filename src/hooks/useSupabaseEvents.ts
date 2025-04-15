import { useEffect } from "react";
import { supabase } from "@/lib/supabase.client";

type EventHandler = (payload: any) => void;

export function useSupabaseEvents(eventName: string, handler: EventHandler) {
  useEffect(() => {
    // Subskrybuj do kanału auth
    const channel = supabase.channel("auth_events");

    channel
      .on("broadcast", { event: eventName }, ({ payload }) => {
        console.log("Otrzymano event:", eventName, payload);
        handler(payload);
      })
      .subscribe((status) => {
        console.log("Status subskrypcji:", status);
      });

    // Cleanup przy odmontowaniu
    return () => {
      channel.unsubscribe();
    };
  }, [eventName, handler]);
}
