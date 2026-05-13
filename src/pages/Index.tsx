import { useState, useCallback, useEffect, useMemo } from "react";
import { Settings, Lightbulb, Wifi, WifiOff, Home } from "lucide-react";
import { Link } from "react-router-dom";
import StatusBar from "@/components/dashboard/StatusBar";
import RoomCard from "@/components/dashboard/RoomCard";
import type { Room } from "@/components/dashboard/RoomCard";
import SceneButton from "@/components/dashboard/SceneButton";
import type { Scene } from "@/components/dashboard/SceneButton";
import LightControlPopup from "@/components/dashboard/LightControlPopup";
import WeatherWidget from "@/components/dashboard/WeatherWidget";
import ClockDisplay from "@/components/dashboard/ClockDisplay";
import HAConfigDialog from "@/components/dashboard/HAConfigDialog";
import { useHomeAssistant, resolveArea } from "@/hooks/useHomeAssistant";
import { loadConfig, saveConfig, clearConfig } from "@/lib/homeAssistant";

const initialScenes: Scene[] = [
  { id: "cinema", name: "Cinema", icon: "cinema", active: false },
  { id: "night", name: "Boa Noite", icon: "night", active: false },
  { id: "morning", name: "Bom Dia", icon: "morning", active: false },
  { id: "away", name: "Sair de Casa", icon: "away", active: false },
  { id: "party", name: "Festa", icon: "party", active: false },
];

const Index = () => {
  // ---- Config persistida ----
  const [cfg, setCfg] = useState(() =>
    loadConfig() || { url: "", token: "", selectedEntities: [] as string[] }
  );
  const [configOpen, setConfigOpen] = useState(false);

  // ---- HA ----
  const { status, states, meta, api } = useHomeAssistant(
    cfg.url || null,
    cfg.token || null
  );
  const isConnected = status === "connected";

  useEffect(() => {
    // Abre configuração automaticamente se não há credenciais
    if (!cfg.url || !cfg.token) setConfigOpen(true);
  }, []);

  // ---- Agrupamento por área ----
  const roomsByArea = useMemo(() => {
    const groups: { areaId: string; areaName: string; rooms: Room[] }[] = [];
    const map = new Map<string, Room[]>();

    cfg.selectedEntities.forEach((entityId) => {
      const s = states[entityId];
      const areaId = resolveArea(entityId, meta) ?? "__none";
      const room: Room = {
        id: entityId,
        name: s?.attributes.friendly_name || entityId,
        icon: "lightbulb",
        isOn: s?.state === "on",
        brightness: s?.attributes.brightness
          ? Math.round((s.attributes.brightness / 255) * 100)
          : s?.state === "on" ? 100 : 0,
        unavailable: !s || s.state === "unavailable",
      };
      if (!map.has(areaId)) map.set(areaId, []);
      map.get(areaId)!.push(room);
    });

    map.forEach((rooms, areaId) => {
      const name = areaId === "__none"
        ? "Outros"
        : meta.areas.find((a) => a.area_id === areaId)?.name || areaId;
      groups.push({ areaId, areaName: name, rooms });
    });

    return groups.sort((a, b) => a.areaName.localeCompare(b.areaName));
  }, [cfg.selectedEntities, states, meta]);

  const allRooms = useMemo(
    () => roomsByArea.flatMap((g) => g.rooms),
    [roomsByArea]
  );
  const activeCount = allRooms.filter((r) => r.isOn).length;

  // ---- Scenes (mock por enquanto) ----
  const [scenes, setScenes] = useState<Scene[]>(initialScenes);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const selectedRoom = allRooms.find((r) => r.id === selectedRoomId) || null;

  const toggleRoom = useCallback(
    (id: string) => {
      if (isConnected) api.toggle(id);
    },
    [api, isConnected]
  );

  const handleBrightnessChange = useCallback(
    (id: string, value: number) => {
      if (isConnected) api.setBrightness(id, value);
    },
    [api, isConnected]
  );

  const activateScene = useCallback((id: string) => {
    setScenes((prev) => prev.map((s) => ({ ...s, active: s.id === id })));
  }, []);

  const handleSaveConfig = (next: { url: string; token: string; selected: string[] }) => {
    const newCfg = { url: next.url, token: next.token, selectedEntities: next.selected };
    setCfg(newCfg);
    saveConfig(newCfg);
    setConfigOpen(false);
  };

  const handleDisconnect = () => {
    clearConfig();
    setCfg({ url: "", token: "", selectedEntities: [] });
    setConfigOpen(false);
  };

  return (
    <div className="min-h-screen p-6 md:p-8 max-w-[1400px] mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <ClockDisplay />
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            <span className="text-tabular text-primary font-semibold">{activeCount}</span> luzes ligadas
          </p>
          <Link
            to="/casa"
            className="flex items-center gap-2 px-3 py-2 rounded-lg glass-card text-xs hover:border-primary/40 transition"
            title="Modo Casa"
          >
            <Home className="w-4 h-4 text-primary" />
            <span className="hidden md:inline">Modo Casa</span>
          </Link>
          <button
            onClick={() => setConfigOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg glass-card text-xs hover:border-muted-foreground/30 transition"
            title="Configurações"
          >
            {isConnected ? (
              <Wifi className="w-4 h-4 text-success" />
            ) : (
              <WifiOff className="w-4 h-4 text-destructive" />
            )}
            <Settings className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <StatusBar />

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <WeatherWidget />
        </div>
        <div className="flex flex-wrap gap-2">
          {scenes.map((scene, i) => (
            <SceneButton key={scene.id} scene={scene} onActivate={activateScene} index={i} />
          ))}
        </div>
      </div>

      {/* Cômodos agrupados por área */}
      <div className="flex-1 space-y-6">
        {roomsByArea.length === 0 && (
          <div className="glass-card rounded-xl p-10 text-center">
            <Lightbulb className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              {isConnected
                ? "Nenhuma entidade selecionada. Abra as configurações para escolher quais luzes mostrar."
                : "Conecte ao Home Assistant para começar."}
            </p>
            <button
              onClick={() => setConfigOpen(true)}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90"
            >
              Configurar
            </button>
          </div>
        )}

        {roomsByArea.map((group) => (
          <div key={group.areaId}>
            <h2 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
              {group.areaName}
            </h2>
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {group.rooms.map((room, i) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onToggle={toggleRoom}
                  onLongPress={(id) => {
                    const r = allRooms.find((x) => x.id === id);
                    if (r && !r.unavailable) setSelectedRoomId(id);
                  }}
                  index={i}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <LightControlPopup
        room={selectedRoom}
        onClose={() => setSelectedRoomId(null)}
        onBrightnessChange={handleBrightnessChange}
        onToggle={(id) => toggleRoom(id)}
      />

      <HAConfigDialog
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        url={cfg.url}
        token={cfg.token}
        selected={cfg.selectedEntities}
        status={status}
        meta={meta}
        states={states}
        onSave={handleSaveConfig}
        onDisconnect={handleDisconnect}
      />
    </div>
  );
};

export default Index;
