import { motion, AnimatePresence } from "framer-motion";
import { X, Lightbulb, Power } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import type { Room } from "./RoomCard";

interface LightControlPopupProps {
  room: Room | null;
  onClose: () => void;
  onBrightnessChange: (id: string, value: number) => void;
  onToggle: (id: string) => void;
}

const colorTemps = [
  { label: "Quente", color: "hsl(35, 100%, 60%)" },
  { label: "Neutro", color: "hsl(45, 30%, 80%)" },
  { label: "Frio", color: "hsl(210, 50%, 85%)" },
];

const LightControlPopup = ({ room, onClose, onBrightnessChange, onToggle }: LightControlPopupProps) => {
  return (
    <AnimatePresence>
      {room && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-card rounded-xl p-8 w-[360px] max-w-[90vw] relative"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-8">
              <div className={`p-3 rounded-lg ${room.isOn ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>
                <Lightbulb className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-display font-semibold text-foreground">{room.name}</h3>
                <p className="text-xs text-muted-foreground">{room.isOn ? "Ligado" : "Desligado"}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Brilho</span>
                  <span className="text-sm font-medium text-tabular text-foreground">{room.brightness ?? 0}%</span>
                </div>
                <Slider
                  value={[room.brightness ?? 0]}
                  onValueChange={([v]) => onBrightnessChange(room.id, v)}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <span className="text-sm text-muted-foreground mb-3 block">Temperatura de Cor</span>
                <div className="flex gap-3">
                  {colorTemps.map((ct) => (
                    <button
                      key={ct.label}
                      className="flex flex-col items-center gap-1.5 flex-1 py-2 rounded-lg glass-card hover:border-muted-foreground/30 transition-all"
                    >
                      <div className="w-6 h-6 rounded-full border border-border" style={{ backgroundColor: ct.color }} />
                      <span className="text-[10px] text-muted-foreground">{ct.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => onToggle(room.id)}
                className={`
                  w-full flex items-center justify-center gap-2 py-3.5 rounded-lg font-medium text-sm
                  transition-all duration-300
                  ${room.isOn
                    ? "bg-primary/15 text-primary hover:bg-primary/25 border border-primary/30"
                    : "bg-secondary text-muted-foreground hover:text-foreground border border-border"
                  }
                `}
              >
                <Power className="w-4 h-4" />
                {room.isOn ? "Desligar" : "Ligar"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LightControlPopup;
