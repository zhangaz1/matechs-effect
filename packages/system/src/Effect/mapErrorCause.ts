import type { Cause } from "../Cause/cause"
import { foldCauseM_, halt, succeed } from "./core"
import type { Effect } from "./effect"

/**
 * Returns an effect with its full cause of failure mapped using
 * the specified function. This can be used to transform errors
 * while preserving the original structure of Cause.
 */
export const mapErrorCause_ = <S, R, E, A, E2>(
  self: Effect<S, R, E, A>,
  f: (cause: Cause<E>) => Cause<E2>
) => foldCauseM_(self, (c) => halt(f(c)), succeed)

/**
 * Returns an effect with its full cause of failure mapped using
 * the specified function. This can be used to transform errors
 * while preserving the original structure of Cause.
 */
export const mapErrorCause = <E, E2>(f: (cause: Cause<E>) => Cause<E2>) => <S, R, A>(
  self: Effect<S, R, E, A>
) => foldCauseM_(self, (c) => halt(f(c)), succeed)
