import { pipe } from "../../Function"
import { Empty, Cause, Both } from "../Cause/cause"
import { joinAll } from "../Fiber/joinAll"
import { complete as promiseComplete } from "../Promise/complete"
import { fail as promiseFailure } from "../Promise/fail"
import { make as promiseMake } from "../Promise/make"
import { succeed as promiseSucceed } from "../Promise/succeed"
import { wait as promiseWait } from "../Promise/wait"
import { makeRef } from "../Ref"

import { bracketFiber } from "./bracketFiber"
import { catchAll } from "./catchAll"
import { chain_ } from "./chain_"
import { Effect, AsyncRE } from "./effect"
import { ensuring } from "./ensuring"
import { fiberId } from "./fiberId"
import { foreach_ } from "./foreach_"
import { fork } from "./fork"
import { halt } from "./halt"
import { Do } from "./instances"
import { interruptible } from "./interruptible"
import { map_ } from "./map_"
import { tapCause } from "./tapCause"
import { tap_ } from "./tap_"
import { uninterruptible } from "./uninterruptible"
import { unit } from "./unit"
import { whenM } from "./whenM"

/**
 * Applies the function `f` to each element of the `Iterable<A>` and runs
 * produced effects in parallel, discarding the results.
 *
 * For a sequential version of this method, see `foreach_`.
 *
 * Optimized to avoid keeping full tree of effects, so that method could be
 * able to handle large input sequences.
 * Behaves almost like this code:
 *
 * Additionally, interrupts all effects on any failure.
 */
export const foreachParUnit_ = <S, R, E, A>(
  as: Iterable<A>,
  f: (a: A) => Effect<S, R, E, any>
): AsyncRE<R, E, void> => {
  const arr = Array.from(as)
  const size = arr.length

  if (size === 0) {
    return unit
  }

  return Do()
    .bind("parentId", fiberId())
    .bind("causes", makeRef<Cause<E>>(Empty))
    .bind("result", promiseMake<never, boolean>())
    .bind("failureTrigger", promiseMake<void, void>())
    .bind("status", makeRef([0, 0, false] as [number, number, boolean]))
    .letL("startTask", (s) =>
      s.status.modify(([started, done, failing]) =>
        failing
          ? [false, [started, done, failing]]
          : [true, [started + 1, done, failing]]
      )
    )
    .letL("startFailure", (s) =>
      tap_(
        s.status.update(([started, done, _]) => [started, done, true]),
        () => promiseFailure<void>(undefined)(s.failureTrigger)
      )
    )
    .letL("task", (s) => (a: A) =>
      uninterruptible(
        whenM(s.startTask)(
          pipe(
            f(a),
            interruptible,
            tapCause((_) =>
              chain_(
                s.causes.update((l) => Both(l, _)),
                () => s.startFailure
              )
            ),
            ensuring(
              whenM(
                s.status.modify(([started, done, failing]) => [
                  (failing ? started : size) === done + 1,
                  [started, done + 1, failing]
                ])
              )(
                promiseComplete(promiseSucceed<void>(undefined)(s.failureTrigger))(
                  s.result
                )
              )
            )
          )
        )
      )
    )
    .bindL("fibers", (s) => foreach_(arr, (a) => fork(s.task(a))))
    .doL((s) =>
      pipe(
        s.failureTrigger,
        promiseWait,
        catchAll(() =>
          chain_(
            foreach_(s.fibers, (f) => fork(f.interruptAs(s.parentId))),
            joinAll
          )
        ),
        bracketFiber(() =>
          whenM(map_(promiseWait(s.result), (b) => !b))(chain_(s.causes.get, halt))
        )
      )
    )
    .unit()
}