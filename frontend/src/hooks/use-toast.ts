"use client";

import { useState, useCallback } from "react";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

let listeners: Array<(toasts: Toast[]) => void> = [];
let toasts: Toast[] = [];

function notify() {
  listeners.forEach((l) => l([...toasts]));
}

export function addToast(message: string, type: ToastType = "success") {
  const id = Math.random().toString(36).slice(2);
  toasts = [...toasts, { id, message, type }];
  notify();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  }, 3500);
}

export function useToastStore() {
  const [items, setItems] = useState<Toast[]>([]);
  const subscribe = useCallback(() => {
    const handler = (t: Toast[]) => setItems(t);
    listeners.push(handler);
    return () => { listeners = listeners.filter((l) => l !== handler); };
  }, []);
  return { items, subscribe };
}

export const toast = {
  success: (msg: string) => addToast(msg, "success"),
  error:   (msg: string) => addToast(msg, "error"),
  info:    (msg: string) => addToast(msg, "info"),
};
