import { motion } from "framer-motion";
import type { HAEntity } from "@/lib/homeAssistant";

// ── Imports dos 16 renders pré-baked ────────────────────────────────────────
// Chave: "${L}${P}${E}${D}" → L=LED, P=Pendentes, E=AbajurEsq, D=AbajurDir
import img0000 from "@/assets/suite/suite_isometric_off.png";
import img0001 from "@/assets/suite/suite_iso_off_abajur_right_on.png";
import img0010 from "@/assets/suite/suite_iso_off_abajur_left_on.png";
import img0011 from "@/assets/suite/suite_iso_off_abajur_both_on.png";
import img0100 from "@/assets/suite/suite_iso_off_pendentes_on.png";
import img0101 from "@/assets/suite/suite_iso_off_abajur_right_on_pendentes_on.png";
import img0110 from "@/assets/suite/suite_iso_off_abajur_left_on_pendentes_on.png";
import img0111 from "@/assets/suite/suite_iso_off_abajur_both_on_pendentes_on.png";
import img1000 from "@/assets/suite/suite_iso_abajur_both_off.png";
import img1001 from "@/assets/suite/suite_iso_abajur_left_off.png";
import img1010 from "@/assets/suite/suite_iso_abajur_right_off.png";
import img1011 from "@/assets/suite/suite_isometric.png";
import img1100 from "@/assets/suite/suite_iso_abajur_both_off_pendentes_on.png";
import img1101 from "@/assets/suite/suite_iso_abajur_left_off_pendentes_on.png";
import img1110 from "@/assets/suite/suite_iso_abajur_right_off_pendentes_on.png";
import img1111 from "@/assets/suite/suite_iso_pendentes_on.png";

const SCENE_MAP: Record<string, string> = {
  "0000": img0000, "0001": img0001, "0010": img0010, "0011": img0011,
  "0100": img0100, "0101": img0101, "0110": img0110, "0111": img0111,
  "1000": img1000, "1001": img1001, "1010": img1010, "1011": img1011,
  "1100": img1100, "1101": img1101, "1110": img1110, "1111": img1111,
};

interface Props {
  states: Record<string, HAEntity>;
  mapping: {
    led?: string;
    abajurEsq?: string;
    abajurDir?: string;
    pendentes?: string;
  };
}

const isOn = (entityId: string | undefined, states: Record<string, HAEntity>) => {
  if (!entityId) return false;
  const s = states[entityId];
  return !!s && s.state === "on";
};

const SuiteScene = ({ states, mapping }: Props) => {
  const L = isOn(mapping.led, states) ? "1" : "0";
  const P = isOn(mapping.pendentes, states) ? "1" : "0";
  const E = isOn(mapping.abajurEsq, states) ? "1" : "0";
  const D = isOn(mapping.abajurDir, states) ? "1" : "0";

  // Se nenhuma entidade estiver mapeada ainda, mostra o render com tudo aceso
  const anyMapped = mapping.led || mapping.pendentes || mapping.abajurEsq || mapping.abajurDir;
  const key = anyMapped ? `${L}${P}${E}${D}` : "1111";
  const src = SCENE_MAP[key];

  return (
    <div className="relative w-full aspect-video rounded-3xl overflow-hidden glass-card">
      <motion.img
        key={key}
        src={src}
        alt="Suíte"
        className="absolute inset-0 w-full h-full object-cover select-none"
        draggable={false}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      />

      {/* Vinheta sutil para integrar com o tema */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-background/40 via-transparent to-transparent" />

      {/* Label */}
      <div className="absolute top-4 left-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Cômodo</p>
        <h3 className="text-xl font-semibold">Suíte</h3>
      </div>
    </div>
  );
};

export default SuiteScene;
