import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeConstants } from '@/lib/constants';
import { log } from '@/lib/utils/logger';

// Initialize dynamic constants from database
initializeConstants().catch(error => {
  log.error('Failed to initialize constants:', error);
});

createRoot(document.getElementById("root")!).render(<App />);
