import { useEffect, useMemo, useRef, useState } from "react";
import {
  HomeAssistantClient,
  HAStatus,
  HAEntity,
  HAArea,
  HAEntityRegistry,
  HADevice,
} from "@/lib/homeAssistant";

export interface HAMeta {
  areas: HAArea[];
  entities: HAEntityRegistry[];
  devices: HADevice[];
}

export const useHomeAssistant = (url: string | null, token: string | null) => {
  const clientRef = useRef<HomeAssistantClient | null>(null);
  const [status, setStatus] = useState<HAStatus>("idle");
  const [states, setStates] = useState<Record<string, HAEntity>>({});
  const [meta, setMeta] = useState<HAMeta>({ areas: [], entities: [], devices: [] });

  useEffect(() => {
    if (!url || !token) {
      setStatus("idle");
      return;
    }
    const client = new HomeAssistantClient(url, token);
    clientRef.current = client;

    const offStatus = client.onStatus(setStatus);
    const offStates = client.onStates(setStates);
    client.connect();

    return () => {
      offStatus();
      offStates();
      client.disconnect();
      clientRef.current = null;
    };
  }, [url, token]);

  // Carrega áreas/entidades/devices depois de conectar
  useEffect(() => {
    if (status !== "connected" || !clientRef.current) return;
    const c = clientRef.current;
    Promise.all([c.getAreas(), c.getEntityRegistry(), c.getDevices()]).then(
      ([areas, entities, devices]) => setMeta({ areas, entities, devices })
    );
  }, [status]);

  const api = useMemo(
    () => ({
      toggle: (id: string) => clientRef.current?.toggleLight(id),
      setBrightness: (id: string, pct: number) =>
        clientRef.current?.setLightBrightness(id, pct),
      callService: (d: string, s: string, data: Record<string, any>) =>
        clientRef.current?.callService(d, s, data),
    }),
    []
  );

  return { status, states, meta, api };
};

// Resolve a área de uma entidade (entity_registry → device_registry)
export const resolveArea = (
  entityId: string,
  meta: HAMeta
): string | null => {
  const ent = meta.entities.find((e) => e.entity_id === entityId);
  if (!ent) return null;
  if (ent.area_id) return ent.area_id;
  if (ent.device_id) {
    const dev = meta.devices.find((d) => d.id === ent.device_id);
    return dev?.area_id ?? null;
  }
  return null;
};
