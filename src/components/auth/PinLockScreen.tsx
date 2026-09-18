"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { Lock, Delete, KeyRound } from "lucide-react";
import confetti from "canvas-confetti";

interface PinLockScreenProps {
  mode?: "unlock" | "setup";
  onCloseSetup?: () => void;
}

export function PinLockScreen({ mode = "unlock", onCloseSetup }: PinLockScreenProps) {
  const { unlock, setNewPin, closePinSetup } = useAuth();
  const [pin, setPin] = useState<string>("");
  const [confirmPin, setConfirmPin] = useState<string>("");
  const [setupStep, setSetupStep] = useState<1 | 2>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  const handleKeyPress = useCallback((digit: string) => {
    setErrorMsg(null);
    if (pin.length < 4) {
      setPin((prev) => prev + digit);
    }
  }, [pin.length]);

  const handleDelete = useCallback(() => {
    setErrorMsg(null);
    setPin((prev) => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    setErrorMsg(null);
    setPin("");
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handleKeyPress(e.key);
      } else if (e.key === "Backspace") {
        handleDelete();
      } else if (e.key === "Escape") {
        handleClear();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyPress, handleDelete, handleClear]);

  useEffect(() => {
    if (pin.length === 4) {
      if (mode === "unlock") {
        const valid = unlock(pin);
        setTimeout(() => {
          const isStillLocked = document.getElementById("pin-lock-container") !== null;
          if (isStillLocked && !valid) {
            setIsShaking(true);
            setErrorMsg("Incorrect PIN. Please try again.");
            setTimeout(() => {
              setIsShaking(false);
              setPin("");
            }, 600);
          }
        }, 150);
      } else {
        if (setupStep === 1) {
          setConfirmPin(pin);
          setPin("");
          setSetupStep(2);
        } else if (setupStep === 2) {
          if (pin === confirmPin) {
            confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
            setNewPin(pin);
            if (onCloseSetup) onCloseSetup();
          } else {
            setIsShaking(true);
            setErrorMsg("PINs do not match. Let's try again.");
            setTimeout(() => {
              setIsShaking(false);
              setPin("");
              setConfirmPin("");
              setSetupStep(1);
            }, 800);
          }
        }
      }
    }
  }, [pin, mode, setupStep, confirmPin, unlock, setNewPin, onCloseSetup]);

  return (
    <div
      id="pin-lock-container"
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 dark:bg-[#090d16]/95 backdrop-blur-2xl p-4 select-none transition-colors"
    >
      <div className="w-full max-w-sm flex flex-col items-center justify-center space-y-6 text-center">
        {/* App Branding & Icon */}
        <div className="flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-400 p-0.5 shadow-2xl shadow-blue-500/30 mb-3">
            <div className="flex h-full w-full items-center justify-center rounded-[22px] bg-white dark:bg-slate-950">
              {mode === "setup" ? (
                <KeyRound className="h-8 w-8 text-blue-500 dark:text-blue-400 animate-pulse" />
              ) : (
                <Lock className="h-8 w-8 text-blue-500 dark:text-blue-400" />
              )}
            </div>
          </div>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {mode === "setup"
              ? setupStep === 1
                ? "Create Security PIN"
                : "Confirm Security PIN"
              : "BudgetFlow Locked"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {mode === "setup"
              ? setupStep === 1
                ? "Enter a 4-digit PIN to protect your finances"
                : "Re-enter the 4-digit PIN to confirm"
              : "Enter your 4-digit PIN to access your account"}
          </p>
        </div>

        {/* 4-Digit Indicator Circles */}
        <div
          className={`flex items-center gap-4 my-2 transition-transform duration-100 ${
            isShaking ? "animate-bounce text-red-500 scale-105" : ""
          }`}
        >
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={`h-4 w-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? "bg-gradient-to-tr from-blue-500 to-emerald-400 scale-125 shadow-lg shadow-blue-500/50"
                    : "bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                }`}
              />
            );
          })}
        </div>

        {/* Error Message */}
        {errorMsg && (
          <p className="text-xs font-semibold text-red-500 dark:text-red-400 animate-in fade-in">
            {errorMsg}
          </p>
        )}

        {/* Numeric Keypad Grid */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num.toString())}
              className="flex h-16 w-full items-center justify-center rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xl font-bold text-slate-900 dark:text-white shadow-md active:scale-90 active:bg-blue-600 active:text-white transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {num}
            </button>
          ))}

          {/* Bottom Row: Clear, 0, Backspace */}
          <button
            type="button"
            onClick={handleClear}
            className="flex h-16 w-full items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-900/40 text-xs font-semibold text-slate-500 dark:text-slate-400 active:scale-90 hover:text-slate-900 dark:hover:text-white transition-all"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={() => handleKeyPress("0")}
            className="flex h-16 w-full items-center justify-center rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xl font-bold text-slate-900 dark:text-white shadow-md active:scale-90 active:bg-blue-600 active:text-white transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="flex h-16 w-full items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 active:scale-90 hover:text-slate-900 dark:hover:text-white transition-all"
            aria-label="Delete last digit"
          >
            <Delete className="h-5 w-5" />
          </button>
        </div>

        {/* Setup Mode Cancel */}
        {mode === "setup" && (
          <button
            type="button"
            onClick={() => {
              if (onCloseSetup) onCloseSetup();
              closePinSetup();
            }}
            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors pt-2"
          >
            Cancel & Keep Current Settings
          </button>
        )}
      </div>
    </div>
  );
}
