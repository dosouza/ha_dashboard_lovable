import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Settings2, X, Sun, Lamp, Lightbulb } from "lucide-react";
import { useHomeAssistant } from "@/hooks/useHomeAssistant";
import { loadConfig } from "@/lib/homeAssistant";
import type { HAEntity } from "@/lib/homeAssistant";
import SuiteScene from "@/components/casa/SuiteScene";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

type SuiteMapping = {
  led?: string;
  abajurEsq?: string;
  abajurDir?: string;
  pendentes?: string;
  tv?: string;
  luzPrincipal?: string;
};

const STORAGE_KEY = "casa.suite.mapping";

const loadMapping = (): SuiteMapping => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
};

function EntityCombobox({
  value,
  onChange,
  options,
}: {
  value: string | undefined;
  onChange: (val: string | undefined) => void;
  options: HAEntity[];
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.entity_id === value);
  const displayName =
    selected?.attributes.friendly_name || selected?.entity_id || "";

  const filtered =
    query.length >= 3
      ? options.filter(
          (o) =>
            (o.attributes.friendly_name || "")
              .toLowerCase()
              .includes(query.toLowerCase()) ||
            o.entity_id.toLowerCase().includes(query.toLowerCase())
        )
      : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          value={query !== "" ? query : displayName}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(e.target.value.length >= 3);
            if (e.target.value === "") onChange(undefined);
          }}
          onFocus={() => setQuery("")}
          placeholder="Digite 3+ caracteres para buscar..."
          className="pr-7"
        />
        {value && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => {
              onChange(undefined);
              setQuery("");
            }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md max-h-52 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground p-3">
              Nenhuma entidade encontrada.
            </p>
          ) : (
            filtered.map((o) => (
              <button
                key={o.entity_id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(o.entity_id);
                  setQuery("");
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-accent hover:text-accent-foreground transition"
              >
                <div className="font-medium">
                  {o.attributes.friendly_name || o.entity_id}
                </div>
                <div className="text-muted-foreground">{o.entity_id}</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const Casa = () => {
  const cfg = loadConfig() || { url: "", token: "", selectedEntities: [] };
  const { states, meta, api } = useHomeAssistant(cfg.url || null, cfg.token || null);
  const [mapping, setMapping] = useState<SuiteMapping>(() => loadMapping());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mapping));
  }, [mapping]);

  const entityOptions = Object.values(states)
    .filter((s) => {
      const d = s.entity_id.split(".")[0];
      return ["light", "switch", "input_boolean"].includes(d);
    })
    .sort((a, b) =>
      (a.attributes.friendly_name || a.entity_id).localeCompare(
        b.attributes.friendly_name || b.entity_id
      )
    );

  const update = (key: keyof SuiteMapping) => (val: string | undefined) =>
    setMapping((m) => ({ ...m, [key]: val }));

  return (
    <div className="min-h-screen p-6 md:p-8 max-w-[1400px] mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>
        <h1 className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
          Modo Casa
        </h1>
        <Dialog>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg glass-card text-xs hover:border-muted-foreground/30 transition">
              <Settings2 className="w-4 h-4" />
              Mapear luzes
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mapeamento — Suíte</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {(
                [
                  ["pendentes", "Pendentes (teto)"],
                  ["led", "LED Strip (sanca)"],
                  ["abajurEsq", "Abajur esquerdo"],
                  ["abajurDir", "Abajur direito"],
                  ["luzPrincipal", "Luz principal"],
                  ["tv", "TV / Monitor"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    {label}
                  </Label>
                  <EntityCombobox
                    value={mapping[key]}
                    onChange={update(key)}
                    options={entityOptions}
                  />
                </div>
              ))}
              <p className="text-xs text-muted-foreground pt-2">
                A cena reage automaticamente ao estado e brilho das entidades selecionadas.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <SuiteScene states={states} mapping={mapping} />

      {/* Painel de controle das luzes mapeadas */}
      {(() => {
        const controls: { key: keyof SuiteMapping; label: string; icon: React.ReactNode }[] = [
          { key: "pendentes",   label: "Pendentes",    icon: <Lightbulb className="w-5 h-5" /> },
          { key: "led",         label: "LED Strip",    icon: <Sun className="w-5 h-5" /> },
          { key: "abajurEsq",  label: "Abajur Esq",   icon: <Lamp className="w-5 h-5" /> },
          { key: "abajurDir",  label: "Abajur Dir",   icon: <Lamp className="w-5 h-5 scale-x-[-1]" /> },
          { key: "luzPrincipal", label: "Luz Principal", icon: <Lightbulb className="w-5 h-5" /> },
          { key: "tv",          label: "TV",           icon: <Sun className="w-5 h-5" /> },
        ].filter((c) => !!mapping[c.key]);

        if (controls.length === 0) return (
          <p className="text-xs text-muted-foreground text-center">
            {meta.areas.length > 0
              ? "Mapeie as luzes acima para controlar a cena."
              : "Conecte ao Home Assistant no Dashboard para ativar a cena."}
          </p>
        );

        return (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {controls.map(({ key, label, icon }) => {
              const entityId = mapping[key]!;
              const entity = states[entityId];
              const isOn = entity?.state === "on";
              const unavailable = !entity || entity.state === "unavailable";
              const brightness = entity?.attributes?.brightness
                ? Math.round((entity.attributes.brightness / 255) * 100)
                : isOn ? 100 : 0;
              const isLight = entityId.startsWith("light.");

              return (
                <div
                  key={key}
                  className={`glass-card rounded-xl p-4 flex flex-col gap-3 transition-all ${
                    isOn ? "border-primary/30 bg-primary/5" : "opacity-70"
                  } ${unavailable ? "opacity-40 pointer-events-none" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={isOn ? "text-primary" : "text-muted-foreground"}>
                        {icon}
                      </span>
                      <span className="text-xs font-medium">{label}</span>
                    </div>
                    <button
                      onClick={() => api.toggle(entityId)}
                      className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${
                        isOn ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${
                          isOn ? "left-5" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>

                  {isLight && isOn && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Brilho</span>
                        <span>{brightness}%</span>
                      </div>
                      <Slider
                        min={1}
                        max={100}
                        step={1}
                        value={[brightness]}
                        onValueChange={([v]) => api.setBrightness(entityId, v)}
                        className="cursor-pointer"
                      />
                    </div>
                  )}

                  {unavailable && (
                    <p className="text-[10px] text-destructive">Indisponível</p>
                  )}
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
};

export default Casa;
