import * as M from "@effect-ts/system/Map/core"

import type { AnyK } from "../_abstract/Any"
import type { CovariantK } from "../_abstract/Covariant"
import { anyF } from "../_abstract/DSL"
import { instance } from "../_abstract/HKT"
import type { Ord } from "../_abstract/Ord"
import type { TraversableK } from "../_abstract/Traversable"
import { implementForeachF } from "../_abstract/Traversable"
import type { TraversableWithKeysK } from "../_abstract/TraversableWithKeys"
import { implementForeachWithKeysF } from "../_abstract/TraversableWithKeys"
import { pipe } from "../Function"
import { getKeys } from "./core"

export const MapURI = "Map"
export type MapURI = typeof MapURI

export const KeyedMapURI = "KeyedMap"
export type KeyedMapURI = typeof KeyedMapURI

declare module "../_abstract/HKT" {
  interface URItoKind<
    TL0,
    TL1,
    TL2,
    TL3,
    K,
    NK extends string,
    SI,
    SO,
    X,
    I,
    S,
    Env,
    Err,
    Out
  > {
    [MapURI]: M.Map<K, Out>
    [KeyedMapURI]: M.Map<TL0, Out>
  }
  interface URItoKeys<TL0, TL1, TL2, TL3, K, NK extends string> {
    [MapURI]: K
    [KeyedMapURI]: TL0
  }
}

/**
 * The `Any` instance for `Map[+_, +_]`
 */
export const Any = instance<AnyK<MapURI>>({
  any: () => M.empty
})

/**
 * The `Covariant` instance for `Map[+_, +_]`
 */
export const Covariant = instance<CovariantK<MapURI>>({
  map: M.map
})

/**
 * Traversable's foreachF for Map[+_, _+].
 */
export const foreachF = implementForeachF<MapURI>()((_) => (G) => (f) => (fa) => {
  let fm = anyF(G)<M.Map<typeof _.FK, typeof _.B>>(M.empty)

  const entries = fa.entries()
  let e: M.Next<readonly [typeof _.FK, typeof _.A]>
  while (!(e = entries.next()).done) {
    const [key, a] = e.value
    fm = pipe(
      fm,
      G.map((m) => (b: typeof _.B) => new Map(m).set(key, b)),
      G.both(f(a)),
      G.map(([g, b]) => g(b))
    )
  }

  return fm
})

/**
 * TraversableWithKeys's foreachF for Map[+_, _+].
 */
export const foreachWithKeysF = implementForeachWithKeysF<MapURI>()(
  ({ _a, _b, _fk }) => (G) => (f) => (fa) => {
    let fm = anyF(G)<M.Map<typeof _fk, typeof _b>>(M.empty)

    const entries = fa.entries()
    let e: M.Next<readonly [typeof _fk, typeof _a]>
    while (!(e = entries.next()).done) {
      const [key, a] = e.value
      fm = pipe(
        fm,
        G.map((m) => (b: typeof _b) => new Map(m).set(key, b)),
        G.both(f(a, key)),
        G.map(([g, b]) => g(b))
      )
    }

    return fm
  }
)

/**
 * The `Traversable` instance for `Map[+_, +_]` in insertion order
 */
export const Traversable = instance<TraversableK<MapURI>>({
  ...Covariant,
  foreachF
})

/**
 * The `TraversableWithKeys` instance for `Map[+_, +_]` in insertion order
 */
export const TraversableWithKeys = instance<TraversableWithKeysK<MapURI>>({
  ...Covariant,
  foreachWithKeysF
})

/**
 * The `Traversable` instance for `Map[+_, +_]` with order enstablished via `Ord[K]`
 */
export const getTraversable = <K>(O: Ord<K>) =>
  instance<TraversableK<KeyedMapURI, K>>({
    ...Covariant,
    foreachF: makeForeachF<K>(O)
  })

/**
 * The `TraversableWithKeys` instance for `Map[+_, +_]` with order enstablished via `Ord[K]`
 */
export const getTraversableWithKeys = <K>(O: Ord<K>) =>
  instance<TraversableWithKeysK<KeyedMapURI, K>>({
    ...Covariant,
    foreachWithKeysF: makeForeachWithKeysF<K>(O)
  })

/**
 * Traversable's foreachF for Map[K, _+] given Ord[K].
 */
export function makeForeachF<K>(O: Ord<K>) {
  return implementForeachF<KeyedMapURI, K>()(() => (G) => (f) =>
    makeForeachWithKeysF(O)(G)((a) => f(a))
  )
}

/**
 * TraversableWithKeys's foreachWithKeysF for Map[K, _+] given Ord[K].
 */
export function makeForeachWithKeysF<K>(O: Ord<K>) {
  return implementForeachWithKeysF<KeyedMapURI, K>()((_) => (G) => (f) => (fa) => {
    let fm = anyF(G)<M.Map<K, typeof _._b>>(M.empty)
    const ks = getKeys(O)(fa)
    for (const key of ks) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const a = fa.get(key)!
      fm = pipe(
        fm,
        G.map((m) => (b: typeof _._b) => new Map(m).set(key, b)),
        G.both(f(a, key)),
        G.map(([g, b]) => g(b))
      )
    }

    return fm
  })
}
