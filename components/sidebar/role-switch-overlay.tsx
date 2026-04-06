"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

interface RoleSwitchOverlayProps {
  isSwitching: boolean;
  targetRole: "farmer" | "buyer";
}

export function RoleSwitchOverlay({ isSwitching, targetRole }: RoleSwitchOverlayProps) {
  const roleLabel = targetRole === "farmer" ? "Farmer Workspace" : "Buyer Marketplace";

  return (
    <AnimatePresence>
      {isSwitching && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-background/80 backdrop-blur-3xl"
        >
          <motion.div 
            layout
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="flex flex-col items-center space-y-8 text-center p-12 rounded-[3.5rem] bg-white/10 border border-white/20 shadow-2xl"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="size-20 rounded-full border-t-2 border-primary"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="size-8 text-primary animate-pulse" />
              </div>
            </div>
            
            <div className="space-y-2">
              <motion.h2 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-black tracking-tight"
              >
                Switching to {roleLabel}
              </motion.h2>
              <motion.p 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 transition={{ delay: 0.3 }}
                 className="text-muted-foreground font-medium"
              >
                Syncing your permissions and personalizing your dashboard...
              </motion.p>
            </div>

            <div className="flex gap-1">
               {[1, 2, 3].map((i) => (
                 <motion.div
                   key={i}
                   animate={{ 
                     opacity: [0.2, 1, 0.2],
                     scale: [1, 1.2, 1]
                   }}
                   transition={{ 
                     duration: 1, 
                     repeat: Infinity, 
                     delay: i * 0.2 
                   }}
                   className="size-1.5 rounded-full bg-primary"
                 />
               ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
