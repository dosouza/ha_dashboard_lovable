import { Lock, Home, User, Shield, Wifi } from "lucide-react";
import { motion } from "framer-motion";

interface StatusItem {
  icon: React.ReactNode;
  label: string;
  status: "ok" | "warning" | "error";
}

const statusItems: StatusItem[] = [
  { icon: <Lock className="w-4 h-4" />, label: "Fechado", status: "ok" },
  { icon: <Home className="w-4 h-4" />, label: "Portão fechado", status: "ok" },
  { icon: <User className="w-4 h-4" />, label: "2 em casa", status: "ok" },
  { icon: <Shield className="w-4 h-4" />, label: "Alarme ativo", status: "ok" },
  { icon: <Wifi className="w-4 h-4" />, label: "Online", status: "ok" },
];

const StatusBar = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center gap-6 py-3 px-6"
    >
      {statusItems.map((item, i) => (
        <div key={i} className="flex items-center gap-2 text-muted-foreground">
          <span className="text-success">{item.icon}</span>
          <span className="text-xs font-medium">{item.label}</span>
        </div>
      ))}
    </motion.div>
  );
};

export default StatusBar;
