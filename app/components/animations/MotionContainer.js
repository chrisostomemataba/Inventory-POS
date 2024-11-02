// components/animations/MotionContainer.js
'use client'
import { motion } from 'framer-motion';

export const MotionContainer = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{
      duration: 0.5,
      delay,
      ease: "easeOut"
    }}
  >
    {children}
  </motion.div>
);

