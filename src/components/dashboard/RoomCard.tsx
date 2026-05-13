import { motion } from "framer-motion";
import {
  Lightbulb, Tv, Sofa, UtensilsCrossed, DoorOpen,
  Bath, Car, ArrowUpDown, Droplets, Leaf, ChefHat, WashingMachine
} from "lucide-react";

export interface Room {
  id: string;
  name: string;
  icon: string;
  isOn: boolean;
  brightness?: number;
  unavailable?: boolean;
}

const iconMap: Record<string, React.ReactNode> = {
  tv: <Tv className="w-7 h-7" />,
  sofa: <Sofa className="w-7 h-7" />,
  chef: <ChefHat className="w-7 h-7" />,
  lightbulb: <Lightbulb className="w-7 h-7" />,
  door: <DoorOpen className="w-7 h-7" />,
  utensils: <UtensilsCrossed className="w-7 h-7" />,
  bath: <Bath className="w-7 h-7" />,
  car: <Car className="w-7 h-7" />,
  stairs: <ArrowUpDown className="w-7 h-7" />,
  droplets: <Droplets className="w-7 h-7" />,
  leaf: <Leaf className="w-7 h-7" />,
  washing: <WashingMachine className="w-7 h-7" />,
};

interface RoomCardProps {
  room: Room;
  onToggle: (id: string) => void;
  onLongPress?: (id: string) => void;
  index: number;
}

const RoomCard = ({ room, onToggle, onLongPress, index }: RoomCardProps) => {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => !room.unavailable && onToggle(room.id)}
      onContextMenu={(e) => {
        e.preventDefault();
        onLongPress?.(room.id);
      }}
      disabled={room.unavailable}
      className={`
        relative flex flex-col items-center justify-center gap-3 p-5 rounded-lg
        transition-all duration-300 min-h-[120px] w-full
        glass-card cursor-pointer select-none
        ${room.isOn ? "glow-active" : ""}
        ${room.unavailable ? "opacity-40 cursor-not-allowed" : "hover:border-muted-foreground/30"}
      `}
    >
      {room.unavailable && (
        <span className="absolute top-2 right-2 text-[10px] font-semibold text-destructive uppercase tracking-wider">
          Indisponível
        </span>
      )}

      <div className={`transition-colors duration-300 ${room.isOn ? "text-primary" : "text-muted-foreground"}`}>
        {iconMap[room.icon] || <Lightbulb className="w-7 h-7" />}
      </div>

      <span className="text-sm font-medium text-foreground">{room.name}</span>

      {room.isOn && room.brightness !== undefined && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
          <div className="h-0.5 w-8 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${room.brightness}%` }}
            />
          </div>
        </div>
      )}
    </motion.button>
  );
};

export default RoomCard;
