import { succeed } from "./core"
import { die } from "./die"
import type { Effect } from "./effect"
import { foldM_ } from "./foldM_"

/**
 * Keeps none of the errors, and terminates the fiber with them, using
 * the specified function to convert the `E` into a `unknown`.
 */
export const orDieWith_ = <S, R, E, A>(
  effect: Effect<S, R, E, A>,
  f: (e: E) => unknown
) => foldM_(effect, (e) => die(f(e)), succeed)
