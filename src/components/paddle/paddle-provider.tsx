"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";

const PaddleContext = createContext<Paddle | undefined>(undefined);

export function PaddleProvider({ children }: { children: React.ReactNode }) {
  const [paddle, setPaddle] = useState<Paddle | undefined>();

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    if (!token) return;

    initializePaddle({
      environment:
        process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === "sandbox" ? "sandbox" : "production",
      token,
    }).then(setPaddle);
  }, []);

  return <PaddleContext.Provider value={paddle}>{children}</PaddleContext.Provider>;
}

export function usePaddle() {
  return useContext(PaddleContext);
}
