import { constant, flow, pipe, tuple } from "../../Function"
import { EnforceNonEmptyRecord, UnionToIntersection } from "../../Utils"
import { Any } from "../Any"
import { AssociativeFlatten } from "../AssociativeFlatten"
import { Applicative, Monad } from "../Combined"
import { Covariant } from "../Covariant"
import { Access } from "../FX"
import {
  Auto,
  F_,
  F___,
  InferA,
  InferE,
  InferI,
  InferK,
  InferN,
  InferR,
  InferX,
  Kind,
  OrE,
  OrI,
  OrK,
  OrN,
  OrNever,
  OrR,
  OrS,
  OrX,
  UF_,
  UF___,
  URIS
} from "../HKT"

import * as A from "@effect-ts/system/Array"

export function succeedF<F extends URIS, C = Auto>(
  F: Any<F, C> & Covariant<F, C>
): <A, SI, SO, S, K, N extends string>(
  a: A
) => Kind<
  F,
  OrN<C, N>,
  OrK<C, K>,
  SI,
  SO,
  OrX<C, never>,
  OrI<C, unknown>,
  OrS<C, S>,
  OrR<C, unknown>,
  OrE<C, never>,
  A
>
export function succeedF(F: Any<UF_> & Covariant<UF_>): <A>(a: A) => F_<A> {
  return <A>(a: A) => F.map(constant(a))(F.any())
}

export function chainF<F extends URIS, C = Auto>(
  F: Monad<F, C>
): <N2 extends string, K2, SO, SO2, X2, I2, S, R2, E2, A, B>(
  f: (
    a: A
  ) => Kind<
    F,
    OrN<C, N2>,
    OrK<C, K2>,
    SO,
    SO2,
    OrX<C, X2>,
    OrI<C, I2>,
    OrS<C, S>,
    OrR<C, R2>,
    OrE<C, E2>,
    B
  >
) => <N extends string, K, SI, X, I, R, E>(
  fa: Kind<
    F,
    OrN<C, N>,
    OrK<C, K>,
    SI,
    SO,
    OrX<C, X>,
    OrI<C, I>,
    OrS<C, S>,
    OrR<C, R>,
    OrE<C, E>,
    A
  >
) => Kind<
  F,
  OrN<C, N2>,
  OrK<C, K2>,
  SI,
  SO2,
  OrX<C, X | X2>,
  OrI<C, I & I2>,
  OrS<C, S>,
  OrR<C, R & R2>,
  OrE<C, E | E2>,
  B
>
export function chainF(F: Monad<UF_>) {
  return <A, B>(f: (a: A) => F_<B>) => flow(F.map(f), F.flatten)
}

export function accessMF<F extends URIS, C = Auto>(
  F: Access<F, C> & AssociativeFlatten<F, C>
): <N extends string, K, SI, SO, X, I, S, R, R2, E, A>(
  f: (
    r: OrR<C, R>
  ) => Kind<
    F,
    OrN<C, N>,
    OrK<C, K>,
    SI,
    SO,
    OrX<C, X>,
    OrI<C, I>,
    OrS<C, S>,
    OrR<C, R2>,
    OrE<C, E>,
    A
  >
) => Kind<
  F,
  OrN<C, N>,
  OrK<C, K>,
  SI,
  SO,
  OrX<C, X>,
  OrI<C, I>,
  OrS<C, S>,
  OrR<C, R & R2>,
  OrE<C, E>,
  A
>
export function accessMF(
  F: Access<UF___> & AssociativeFlatten<UF___>
): <R, R2, E, A>(f: (r: R) => F___<R2, E, A>) => F___<R & R2, E, A> {
  return flow(F.access, F.flatten)
}

export function sequenceSF<F extends URIS, C = Auto>(
  F: Applicative<F, C>
): <
  S,
  SIO,
  NER extends Record<
    string,
    Kind<
      F,
      OrN<C, any>,
      OrK<C, any>,
      SIO,
      SIO,
      OrX<C, any>,
      OrI<C, any>,
      OrS<C, S>,
      OrR<C, any>,
      OrE<C, any>,
      any
    >
  >
>(
  r: EnforceNonEmptyRecord<NER>
) => Kind<
  F,
  OrN<
    C,
    {
      [K in keyof NER]: InferN<F, NER[K]>
    }[keyof NER]
  >,
  OrK<
    C,
    {
      [K in keyof NER]: InferK<F, NER[K]>
    }[keyof NER]
  >,
  SIO,
  SIO,
  OrX<
    C,
    {
      [K in keyof NER]: InferX<F, NER[K]>
    }[keyof NER]
  >,
  OrI<
    C,
    UnionToIntersection<
      {
        [K in keyof NER]: OrNever<InferI<F, NER[K]>>
      }[keyof NER]
    >
  >,
  OrS<C, S>,
  OrR<
    C,
    UnionToIntersection<
      {
        [K in keyof NER]: OrNever<InferR<F, NER[K]>>
      }[keyof NER]
    >
  >,
  OrE<
    C,
    {
      [K in keyof NER]: InferE<F, NER[K]>
    }[keyof NER]
  >,
  {
    [K in keyof NER]: InferA<F, NER[K]>
  }
>
export function sequenceSF(
  F: Applicative<UF_>
): (r: Record<string, F_<any>>) => F_<Record<string, any>> {
  return (r) =>
    pipe(
      Object.keys(r).map((k) => tuple(k, r[k])),
      A.reduce(succeedF(F)([] as readonly (readonly [string, any])[]), (b, a) =>
        pipe(
          b,
          F.both(a[1]),
          F.map(([x, y]) => [...x, tuple(a[0], y)])
        )
      ),
      F.map((a) => {
        const res = {}
        a.forEach(([k, v]) => {
          res[k] = v
        })
        return res
      })
    )
}