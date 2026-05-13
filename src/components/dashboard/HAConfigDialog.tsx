import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Wifi, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { HAMeta } from "@/hooks/useHomeAssistant";
import { resolveArea } from "@/hooks/useHomeAssistant";
import type { HAStatus, HAEntity } from "@/lib/homeAssistant";

interface Props {
  open: boolean;
  onClose: () => void;
  url: string;
  token: string;
  selected: string[];
  status: HAStatus;
  meta: HAMeta;
  states: Record<string, HAEntity>;
  onSave: (cfg: { url: string; token: string; selected: string[] }) => void;
  onDisconnect: () => void;
}

const statusLabel: Record<HAStatus, string> = {
  idle: "Desconectado",
  connecting: "Conectando…",
  auth: "Autenticando…",
  connected: "Conectado",
  error: "Erro de conexão",
  closed: "Conexão fechada",
};

const HAConfigDialog = ({
  open, onClose, url, token, selected, status, meta, states, onSave, onDisconnect,
}: Props) => {
  const [tab, setTab] = useState<"connection" | "entities">("connection");
  const [u, setU] = useState(url);
  const [t, setT] = useState(token);
  const [sel, setSel] = useState<string[]>(selected);
  const [filter, setFilter] = useState("");

  useEffect(() => { setU(url); setT(token); setSel(selected); }, [url, token, selected, open]);

  const ALLOWED_DOMAINS = ["light", "switch", "fan", "input_boolean"];
  const lights = useMemo(
    () =>
      Object.values(states).filter((s) =>
        ALLOWED_DOMAINS.some((d) => s.entity_id.startsWith(d + "."))
      ),
    [states]
  );
  const totalEntities = Object.keys(states).length;

  const grouped = useMemo(() => {
    const byArea: Record<string, HAEntity[]> = { __none: [] };
    lights
      .filter((l) =>
        !filter ||
        l.entity_id.toLowerCase().includes(filter.toLowerCase()) ||
        (l.attributes.friendly_name || "").toLowerCase().includes(filter.toLowerCase())
      )
      .forEach((l) => {
        const areaId = resolveArea(l.entity_id, meta) ?? "__none";
        (byArea[areaId] ??= []).push(l);
      });
    return byArea;
  }, [lights, meta, filter]);

  const areaName = (id: string) =>
    id === "__none" ? "Sem área" : meta.areas.find((a) => a.area_id === id)?.name || id;

  const toggleEntity = (id: string) =>
    setSel((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const selectAreaAll = (areaId: string) => {
    const ids = (grouped[areaId] || []).map((e) => e.entity_id);
    const allIn = ids.every((i) => sel.includes(i));
    setSel((prev) => allIn ? prev.filter((x) => !ids.includes(x)) : Array.from(new Set([...prev, ...ids])));
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-card rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col relative"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>

            <div className="px-7 pt-7 pb-4 border-b border-border">
              <h3 className="text-lg font-display font-semibold flex items-center gap-2">
                <Wifi className="w-5 h-5 text-primary" /> Home Assistant
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Status:{" "}
                <span className={status === "connected" ? "text-success" : status === "error" ? "text-destructive" : "text-muted-foreground"}>
                  {statusLabel[status]}
                </span>
              </p>

              <div className="flex gap-1 mt-4 bg-secondary/50 p-1 rounded-lg w-fit">
                <button
                  onClick={() => setTab("connection")}
                  className={`px-4 py-1.5 text-xs font-medium rounded-md transition ${tab === "connection" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >Conexão</button>
                <button
                  onClick={() => setTab("entities")}
                  disabled={status !== "connected"}
                  className={`px-4 py-1.5 text-xs font-medium rounded-md transition disabled:opacity-40 ${tab === "entities" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >Entidades ({sel.length})</button>
              </div>
            </div>

            <div className="overflow-y-auto px-7 py-5 flex-1">
              {tab === "connection" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">URL do Home Assistant</label>
                    <Input value={u} onChange={(e) => setU(e.target.value)} placeholder="http://homeassistant.local:8123" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Long-Lived Access Token</label>
                    <Input type="password" value={t} onChange={(e) => setT(e.target.value)} placeholder="eyJhbGciOi..." />
                    <p className="text-[11px] text-muted-foreground mt-1.5">
                      Crie em <code>HA → Perfil → Tokens de Acesso de Longa Duração</code>.
                    </p>
                  </div>
                  <div className="text-[11px] text-muted-foreground bg-secondary/40 p-3 rounded-lg leading-relaxed">
                    💡 Hospede o build em <code>/config/www/dashboard/</code> e abra via <code>/local/dashboard/</code> no mesmo domínio do HA para evitar problemas de CORS/SSL.
                  </div>
                </div>
              )}

              {tab === "entities" && (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Buscar luz..." className="pl-9" />
                  </div>

                  {Object.keys(grouped)
                    .filter((a) => grouped[a].length > 0)
                    .sort((a, b) => areaName(a).localeCompare(areaName(b)))
                    .map((areaId) => (
                    <div key={areaId}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {areaName(areaId)} <span className="text-foreground/40">({grouped[areaId].length})</span>
                        </h4>
                        <button onClick={() => selectAreaAll(areaId)} className="text-[11px] text-primary hover:underline">
                          alternar todos
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {grouped[areaId].map((e) => {
                          const isSel = sel.includes(e.entity_id);
                          const fname = e.attributes.friendly_name || e.entity_id;
                          return (
                            <button
                              key={e.entity_id}
                              onClick={() => toggleEntity(e.entity_id)}
                              className={`flex items-center gap-2 text-left px-3 py-2 rounded-lg border transition ${isSel ? "bg-primary/10 border-primary/40 text-foreground" : "bg-secondary/30 border-border/50 text-muted-foreground hover:text-foreground"}`}
                            >
                              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isSel ? "bg-primary border-primary" : "border-border"}`}>
                                {isSel && <Check className="w-3 h-3 text-primary-foreground" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-medium truncate">{fname}</div>
                                <div className="text-[10px] text-muted-foreground truncate">{e.entity_id}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {lights.length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-8 space-y-2">
                      <p>Nenhuma luz/switch/fan encontrada.</p>
                      <p className="text-[11px]">
                        Total de entidades carregadas do HA: <strong>{totalEntities}</strong>
                      </p>
                      {totalEntities === 0 && (
                        <p className="text-[11px] text-destructive">
                          O HA não retornou entidades. Verifique no console (F12) se há erro de permissão do token.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-7 py-4 border-t border-border flex items-center justify-between gap-3">
              <button onClick={onDisconnect} className="text-xs text-destructive hover:underline">
                Desconectar
              </button>
              <div className="flex gap-2">
                <button onClick={onClose} className="px-4 py-2 text-xs rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition">
                  Cancelar
                </button>
                <button
                  onClick={() => onSave({ url: u, token: t, selected: sel })}
                  className="px-4 py-2 text-xs rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
                >
                  Salvar
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HAConfigDialog;
