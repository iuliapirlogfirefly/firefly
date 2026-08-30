"use client";

import { createContext, useContext, type ReactNode } from "react";

const LaunchContext = createContext(false);

type Props = {
  isPrelaunch: boolean;
  children: ReactNode;
};

export function LaunchProvider({ isPrelaunch, children }: Props) {
  return (
    <LaunchContext.Provider value={isPrelaunch}>{children}</LaunchContext.Provider>
  );
}

export function usePrelaunch() {
  return useContext(LaunchContext);
}
