// Cliente WebSocket simples para Home Assistant
// Docs: https://developers.home-assistant.io/docs/api/websocket

export interface HAEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, any>;
}

export interface HAArea {
  area_id: string;
  name: string;
  icon?: string | null;
}

export interface HAEntityRegistry {
  entity_id: string;
  area_id: string | null;
  device_id: string | null;
  name: string | null;
  original_name: string | null;
  platform: string;
}

export interface HADevice {
  id: string;
  area_id: string | null;
  name: string | null;
  name_by_user: string | null;
}

type Listener = (states: Record<string, HAEntity>) => void;
type StatusListener = (status: HAStatus) => void;

export type HAStatus = "idle" | "connecting" | "auth" | "connected" | "error" | "closed";

export class HomeAssistantClient {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string;
  private msgId = 1;
  private pending = new Map<number, (msg: any) => void>();
  private states: Record<string, HAEntity> = {};
  private listeners = new Set<Listener>();
  private statusListeners = new Set<StatusListener>();
  private status: HAStatus = "idle";
  private reconnectTimer: number | null = null;
  private shouldReconnect = true;

  constructor(baseUrl: string, token: string) {
    this.url = baseUrl.replace(/^http/, "ws").replace(/\/$/, "") + "/api/websocket";
    this.token = token;
  }

  private setStatus(s: HAStatus) {
    this.status = s;
    this.statusListeners.forEach((l) => l(s));
  }

  onStates(l: Listener) {
    this.listeners.add(l);
    l(this.states);
    return () => this.listeners.delete(l);
  }

  onStatus(l: StatusListener) {
    this.statusListeners.add(l);
    l(this.status);
    return () => this.statusListeners.delete(l);
  }

  getStates() {
    return this.states;
  }

  connect() {
    this.shouldReconnect = true;
    this.setStatus("connecting");
    try {
      this.ws = new WebSocket(this.url);
    } catch (e) {
      this.setStatus("error");
      this.scheduleReconnect();
      return;
    }

    this.ws.onmessage = (ev) => this.handleMessage(JSON.parse(ev.data));
    this.ws.onerror = () => this.setStatus("error");
    this.ws.onclose = () => {
      this.setStatus("closed");
      this.scheduleReconnect();
    };
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }

  private scheduleReconnect() {
    if (!this.shouldReconnect || this.reconnectTimer) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }

  private handleMessage(msg: any) {
    if (msg.type === "auth_required") {
      this.setStatus("auth");
      this.ws?.send(JSON.stringify({ type: "auth", access_token: this.token }));
      return;
    }
    if (msg.type === "auth_invalid") {
      this.setStatus("error");
      this.shouldReconnect = false;
      this.ws?.close();
      return;
    }
    if (msg.type === "auth_ok") {
      this.setStatus("connected");
      this.subscribeStates();
      return;
    }
    if (msg.type === "result" && this.pending.has(msg.id)) {
      this.pending.get(msg.id)!(msg);
      this.pending.delete(msg.id);
      return;
    }
    if (msg.type === "event" && msg.event?.event_type === "state_changed") {
      const { entity_id, new_state } = msg.event.data;
      if (new_state) {
        this.states = { ...this.states, [entity_id]: new_state };
      } else {
        const next = { ...this.states };
        delete next[entity_id];
        this.states = next;
      }
      this.listeners.forEach((l) => l(this.states));
    }
  }

  private send<T = any>(payload: any): Promise<T> {
    return new Promise((resolve) => {
      const id = this.msgId++;
      this.pending.set(id, resolve);
      this.ws?.send(JSON.stringify({ id, ...payload }));
    });
  }

  private async subscribeStates() {
    const result = await this.send<any>({ type: "get_states" });
    const list: HAEntity[] = result.result || [];
    const map: Record<string, HAEntity> = {};
    list.forEach((s) => (map[s.entity_id] = s));
    this.states = map;
    console.info(
      `[HA] get_states success=${result.success} total=${list.length}`,
      result.success === false ? result : undefined
    );
    this.listeners.forEach((l) => l(this.states));
    await this.send({ type: "subscribe_events", event_type: "state_changed" });
  }

  async getAreas(): Promise<HAArea[]> {
    const r = await this.send<any>({ type: "config/area_registry/list" });
    return r.result || [];
  }

  async getEntityRegistry(): Promise<HAEntityRegistry[]> {
    const r = await this.send<any>({ type: "config/entity_registry/list" });
    return r.result || [];
  }

  async getDevices(): Promise<HADevice[]> {
    const r = await this.send<any>({ type: "config/device_registry/list" });
    return r.result || [];
  }

  callService(domain: string, service: string, service_data: Record<string, any>) {
    return this.send({ type: "call_service", domain, service, service_data });
  }

  toggleLight(entity_id: string) {
    const domain = entity_id.split(".")[0] || "light";
    return this.callService(domain, "toggle", { entity_id });
  }

  setLightBrightness(entity_id: string, brightnessPct: number) {
    const domain = entity_id.split(".")[0] || "light";
    if (domain !== "light") {
      // Switches/fans não têm brilho — só liga/desliga
      return this.callService(domain, brightnessPct <= 0 ? "turn_off" : "turn_on", { entity_id });
    }
    if (brightnessPct <= 0) {
      return this.callService("light", "turn_off", { entity_id });
    }
    return this.callService("light", "turn_on", {
      entity_id,
      brightness_pct: brightnessPct,
    });
  }
}

// ---------- Persistência ----------
const STORAGE_KEY = "ha-config";

export interface HAConfig {
  url: string;
  token: string;
  selectedEntities: string[]; // entity_ids visíveis
}

export const loadConfig = (): HAConfig | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveConfig = (cfg: HAConfig) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
};

export const clearConfig = () => localStorage.removeItem(STORAGE_KEY);
