import { motion } from 'framer-motion';

export function StatsCard({ icon, label, value, color }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-card rounded-xl p-6 flex items-center shadow-sm hover:shadow-md transition-all"
    >
      <div 
        className={`w-14 h-14 rounded-full flex items-center justify-center mr-4 flex-shrink-0 ${color}`}
      >
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
          {label}
        </span>
        <span className="text-2xl font-bold">
          {value}
        </span>
      </div>
    </motion.div>
  );
}