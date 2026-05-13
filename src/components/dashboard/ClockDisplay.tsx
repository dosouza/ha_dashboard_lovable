import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const ClockDisplay = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = time.getHours().toString().padStart(2, "0");
  const minutes = time.getMinutes().toString().padStart(2, "0");
  const dateStr = time.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center"
    >
      <div className="text-6xl font-display font-bold text-tabular text-foreground tracking-tight">
        {hours}
        <span className="animate-pulse-glow">:</span>
        {minutes}
      </div>
      <p className="text-sm text-muted-foreground capitalize mt-1">{dateStr}</p>
    </motion.div>
  );
};

export default ClockDisplay;
