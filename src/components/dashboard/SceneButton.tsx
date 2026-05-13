import { motion } from "framer-motion";
import { Film, Moon, Sun, DoorOpen, PartyPopper } from "lucide-react";

export interface Scene {
  id: string;
  name: string;
  icon: string;
  active?: boolean;
}

const sceneIcons: Record<string, React.ReactNode> = {
  cinema: <Film className="w-5 h-5" />,
  night: <Moon className="w-5 h-5" />,
  morning: <Sun className="w-5 h-5" />,
  away: <DoorOpen className="w-5 h-5" />,
  party: <PartyPopper className="w-5 h-5" />,
};

interface SceneButtonProps {
  scene: Scene;
  onActivate: (id: string) => void;
  index: number;
}

const SceneButton = ({ scene, onActivate, index }: SceneButtonProps) => {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + index * 0.05 }}
      whileTap={{ scale: 0.93 }}
      onClick={() => onActivate(scene.id)}
      className={`
        flex items-center gap-2.5 px-5 py-3 rounded-lg
        glass-card transition-all duration-300 select-none
        ${scene.active ? "glow-active text-primary" : "text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"}
      `}
    >
      {sceneIcons[scene.icon] || <Film className="w-5 h-5" />}
      <span className="text-sm font-medium">{scene.name}</span>
    </motion.button>
  );
};

export default SceneButton;
