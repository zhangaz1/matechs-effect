import { map } from "../Cause/core"
import { pipe } from "../Function"
import { foldCauseM_, halt, succeed } from "./core"
import type { Effect } from "./effect"

/**
 * Returns an effect with its error channel mapped using the specified
 * function. This can be used to lift a "smaller" error into a "larger"
 * error.
 */
export const mapError_ = <S, R, E, E2, A>(self: Effect<S, R, E, A>, f: (e: E) => E2) =>
  foldCauseM_(
    self,
    (c) => pipe(c, map(f), halt),
    (a) => succeed(a)
  )

/**
 * Returns an effect with its error channel mapped using the specified
 * function. This can be used to lift a "smaller" error into a "larger"
 * error.
 */
export const mapError = <E, E2>(f: (e: E) => E2) => <S, R, A>(
  self: Effect<S, R, E, A>
) => mapError_(self, f)
