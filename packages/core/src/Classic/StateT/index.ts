import type { Erase } from "@effect-ts/system/Utils"

import { flow, pipe, tuple } from "../../Function"
import type { StateInURI, StateOutURI } from "../../Modules"
import type { Auto, Monad } from "../../Prelude"
import { chainF } from "../../Prelude/DSL"
import * as HKT from "../../Prelude/HKT"

/**
 * Take over ownership of "S" making it invariant
 */
export type V<C> = HKT.Unfix<Erase<HKT.Strip<C, "S">, HKT.Auto>, "S"> & HKT.V<"S", "_">

export type StateT<F extends HKT.URIS> = HKT.PrependURI<
  StateInURI,
  HKT.AppendURI<F, StateOutURI>
>

export interface StateIn<S, A> {
  (s: S): A
}

export type StateOut<S, A> = readonly [A, S]

export function monad<F extends HKT.URIS, C>(M: Monad<F, C>): Monad<StateT<F>, V<C>>
export function monad(M: Monad<[HKT.UF_]>): Monad<StateT<[HKT.UF_]>, V<Auto>> {
  return HKT.instance({
    any: <S = any>() => (s: S): HKT.F_<readonly [any, S]> =>
      pipe(
        M.any(),
        M.map((m) => tuple(m, s))
      ),
    flatten: <A, S2>(
      ffa: (s: S2) => HKT.F_<readonly [(s: S2) => HKT.F_<readonly [A, S2]>, S2]>
    ): ((s: S2) => HKT.F_<readonly [A, S2]>) =>
      flow(
        ffa,
        chainF(M)(([f, us]) => f(us))
      ),
    map: <A, B>(f: (a: A) => B) => <S>(
      fa: (s: S) => HKT.F_<readonly [A, S]>
    ): ((s: S) => HKT.F_<readonly [B, S]>) =>
      flow(
        fa,
        M.map(([a, s]) => tuple(f(a), s))
      )
  })
}
