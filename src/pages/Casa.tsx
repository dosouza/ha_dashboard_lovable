import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Settings2 } from "lucide-react";
import { useHomeAssistant } from "@/hooks/useHomeAssistant";
import { loadConfig } from "@/lib/homeAssistant";
import SuiteScene from "@/components/casa/SuiteScene";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type SuiteMapping = {
  led?: string;
  abajurEsq?: string;
  abajurDir?: string;
  pendentes?: string;
};

const STORAGE_KEY = "casa.suite.mapping";

const loadMapping = (): SuiteMapping => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
};

const Casa = () => {
  const cfg = loadConfig() || { url: "", token: "", selectedEntities: [] };
  const { states, meta } = useHomeAssistant(cfg.url || null, cfg.token || null);
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

  const update = (key: keyof SuiteMapping) => (val: string) =>
    setMapping((m) => ({ ...m, [key]: val === "__none" ? undefined : val }));

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
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    {label}
                  </Label>
                  <Select
                    value={mapping[key] || "__none"}
                    onValueChange={update(key)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar entidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">— nenhuma —</SelectItem>
                      {entityOptions.map((s) => (
                        <SelectItem key={s.entity_id} value={s.entity_id}>
                          {s.attributes.friendly_name || s.entity_id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

      <p className="text-xs text-muted-foreground text-center">
        {meta.areas.length > 0
          ? "Em breve: outros cômodos com seus próprios renders 3D."
          : "Conecte ao Home Assistant no Dashboard para ativar a cena."}
      </p>
    </div>
  );
};

export default Casa;
