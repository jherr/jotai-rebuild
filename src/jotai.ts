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
  let value: AtomType =
    typeof initialValue === "function" ? (null as AtomType) : initialValue;

  const subscribers = new Set<(newValue: AtomType) => void>();
  const subscribed = new Set<Atom<any>>();

  function get<Target>(atom: Atom<Target>) {
    let currentValue = atom.get();
    // console.log(atom._subscribers())

    if (!subscribed.has(atom)) {
      subscribed.add(atom);
      atom.subscribe(function (newValue) {
        if (currentValue === newValue) return;
        currentValue = newValue;
        computeValue();
      });
    }

    return currentValue;
  }

  function getInitialType() {
    const _type = typeof initialValue;
    if (initialValue?.then && typeof initialValue.then === "function") {
      return "promise";
    }
    return _type;
  }

  async function computeValue() {
    const newValue =
      typeof initialValue === "function"
        ? (initialValue as AtomGetter<AtomType>)(get)
        : value;

    value = null as AtomType;
    value = await newValue;
    subscribers.forEach((callback) => callback(value));
  }

  if (["promise", "function"].includes(getInitialType())) computeValue();

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
