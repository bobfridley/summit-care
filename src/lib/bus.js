// src/lib/bus.js
const bus = new EventTarget();

export function emit(event, detail) {
  bus.dispatchEvent(new CustomEvent(event, { detail }));
}

export function on(event, handler) {
  const wrapped = (e) => handler?.(e.detail);
  bus.addEventListener(event, wrapped);
  return () => bus.removeEventListener(event, wrapped);
}
