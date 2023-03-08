import { useSyncExternalStore } from "react";

interface Atom<AtomType> {
  get: () => AtomType;
  set: (newValue: AtomType) => void;
  subscribe: (callback: (newValue: AtomType) => void) => () => void;
  _subscribers: () => number;
}

type AtomGetter<AtomType> = (
  get: <Target>(a: Atom<Target>) => Target
) => AtomType;

export function atom<AtomType>(
  initialValue: AtomType | AtomGetter<AtomType>
): Atom<AtomType> {
  let value: AtomType = initialValue as AtomType

  const subscribers = new Set<(newValue: AtomType) => void>();

  function get<Target>(atom: Atom<Target>) {
    atom.subscribe(computeValue);
    return atom.get();
  }

  async function computeValue() {
    value =
      typeof initialValue === "function"
        ? await (initialValue as AtomGetter<AtomType>)(get)
        : value;
    subscribers.forEach((callback) => callback(value));
  }

  computeValue();

  return {
    get: () => value,
    set: (newValue) => {
      value = newValue;
      computeValue();
    },
    subscribe: (callback) => {
      subscribers.add(callback);
      return () => {
        subscribers.delete(callback);
      };
    },
    _subscribers: () => subscribers.size,
  };
}

export function useAtom<AtomType>(atom: Atom<AtomType>) {
  return [useSyncExternalStore(atom.subscribe, atom.get), atom.set];
}

export function useAtomValue<AtomType>(atom: Atom<AtomType>) {
  return useSyncExternalStore(atom.subscribe, atom.get);
}
