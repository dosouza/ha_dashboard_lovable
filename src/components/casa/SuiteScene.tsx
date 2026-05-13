import { motion } from "framer-motion";
import baseImg from "@/assets/suite/base.png";
import ledImg from "@/assets/suite/led_on.png";
import abajurEsqImg from "@/assets/suite/abajur_esq.png";
import abajurDirImg from "@/assets/suite/abajur_dir.png";
import type { HAEntity } from "@/lib/homeAssistant";

interface Props {
  states: Record<string, HAEntity>;
  mapping: {
    led?: string;
    abajurEsq?: string;
    abajurDir?: string;
    pendentes?: string;
  };
}

const intensity = (s?: HAEntity) => {
  if (!s || s.state !== "on") return 0;
  const b = s.attributes?.brightness;
  if (typeof b === "number") return Math.max(0.15, b / 255);
  return 1;
};

const SuiteScene = ({ states, mapping }: Props) => {
  const led = intensity(mapping.led ? states[mapping.led] : undefined);
  const esq = intensity(mapping.abajurEsq ? states[mapping.abajurEsq] : undefined);
  const dir = intensity(mapping.abajurDir ? states[mapping.abajurDir] : undefined);
  // Pendentes sempre presente nos renders — usamos como filtro de "casa apagada"
  const pendentesOn = mapping.pendentes
    ? states[mapping.pendentes]?.state === "on"
    : true;

  return (
    <div className="relative w-full aspect-video rounded-3xl overflow-hidden glass-card">
      {/* Base — suíte com pendentes (mais escura disponível) */}
      <img
        src={baseImg}
        alt="Suíte"
        className="absolute inset-0 w-full h-full object-cover select-none"
        draggable={false}
        style={{
          filter: pendentesOn ? "none" : "brightness(0.35) saturate(0.6)",
          transition: "filter 600ms ease",
        }}
      />

      {/* Camada LED strip (RGB neon) */}
      <motion.img
        src={ledImg}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
        draggable={false}
        style={{ mixBlendMode: "lighten" }}
        animate={{ opacity: led }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />

      {/* Camada Abajur Esquerdo */}
      <motion.img
        src={abajurEsqImg}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
        draggable={false}
        style={{ mixBlendMode: "lighten" }}
        animate={{ opacity: esq }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />

      {/* Camada Abajur Direito */}
      <motion.img
        src={abajurDirImg}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
        draggable={false}
        style={{ mixBlendMode: "lighten" }}
        animate={{ opacity: dir }}
        transition={{ duration: 0.6, ease: "easeOut" }}
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
