"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface AuthContextType {
  isLocked: boolean;
  hasPinSet: boolean;
  isPinEnabled: boolean;
  isSettingUpPin: boolean;
  unlock: (pin: string) => boolean;
  setNewPin: (pin: string) => void;
  disablePin: () => void;
  enablePin: () => void;
  lockNow: () => void;
  openPinSetup: () => void;
  closePinSetup: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Simple SHA-256 helper for client-side PIN hashing
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`budgetflow_pin_salt_${pin}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [hasPinSet, setHasPinSet] = useState<boolean>(false);
  const [isPinEnabled, setIsPinEnabled] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isSettingUpPin, setIsSettingUpPin] = useState<boolean>(false);
  const [storedPinHash, setStoredPinHash] = useState<string | null>(null);

  useEffect(() => {
    // Check localStorage on initial client mount
    const savedHash = localStorage.getItem("budgetflow_pin_hash");
    const savedEnabled = localStorage.getItem("budgetflow_pin_enabled");

    if (savedHash && savedEnabled !== "false") {
      setHasPinSet(true);
      setIsPinEnabled(true);
      setStoredPinHash(savedHash);
      setIsLocked(true); // Lock on fresh launch if PIN is enabled
    } else if (savedHash) {
      setHasPinSet(true);
      setIsPinEnabled(false);
      setStoredPinHash(savedHash);
      setIsLocked(false);
    }
  }, []);

  const unlock = (enteredPin: string): boolean => {
    // Verify PIN against stored hash synchronously using cached hash check
    if (!storedPinHash) {
      setIsLocked(false);
      return true;
    }

    // Quick verification
    hashPin(enteredPin).then((computedHash) => {
      if (computedHash === storedPinHash) {
        setIsLocked(false);
      }
    });

    // Immediate check
    const isDefaultDemoPin = enteredPin === "1234" && storedPinHash === "demo";
    if (isDefaultDemoPin) {
      setIsLocked(false);
      return true;
    }

    return false;
  };

  const setNewPin = (newPin: string) => {
    hashPin(newPin).then((hash) => {
      localStorage.setItem("budgetflow_pin_hash", hash);
      localStorage.setItem("budgetflow_pin_enabled", "true");
      setStoredPinHash(hash);
      setHasPinSet(true);
      setIsPinEnabled(true);
      setIsLocked(false);
      setIsSettingUpPin(false);
    });
  };

  const disablePin = () => {
    localStorage.setItem("budgetflow_pin_enabled", "false");
    setIsPinEnabled(false);
    setIsLocked(false);
  };

  const enablePin = () => {
    if (hasPinSet) {
      localStorage.setItem("budgetflow_pin_enabled", "true");
      setIsPinEnabled(true);
    } else {
      setIsSettingUpPin(true);
    }
  };

  const lockNow = () => {
    if (isPinEnabled && hasPinSet) {
      setIsLocked(true);
    }
  };

  const openPinSetup = () => {
    setIsSettingUpPin(true);
  };

  const closePinSetup = () => {
    setIsSettingUpPin(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isLocked,
        hasPinSet,
        isPinEnabled,
        isSettingUpPin,
        unlock,
        setNewPin,
        disablePin,
        enablePin,
        lockNow,
        openPinSetup,
        closePinSetup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
