import { Cloud, Droplets, Wind } from "lucide-react";
import { motion } from "framer-motion";

const WeatherWidget = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card rounded-xl p-5 flex items-center justify-between"
    >
      <div className="flex items-center gap-4">
        <Cloud className="w-10 h-10 text-muted-foreground" />
        <div>
          <span className="text-3xl font-display font-bold text-tabular text-foreground">24°</span>
          <p className="text-xs text-muted-foreground">Parcialmente nublado</p>
        </div>
      </div>
      <div className="flex gap-5">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Droplets className="w-4 h-4" />
          <span className="text-xs text-tabular">62%</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Wind className="w-4 h-4" />
          <span className="text-xs text-tabular">12 km/h</span>
        </div>
      </div>
    </motion.div>
  );
};

export default WeatherWidget;
