import type { InterruptStatus } from "../Fiber/core"
import { checkInterruptible, interruptStatus_ } from "./core"
import { disconnect } from "./disconnect"
import type { AsyncRE, Effect } from "./effect"
import { interruptible } from "./interruptible"
import { uninterruptible } from "./uninterruptible"

/**
 * Used to restore the inherited interruptibility
 */
export interface InterruptStatusRestore {
  readonly restore: <S, R, E, A>(effect: Effect<S, R, E, A>) => Effect<S, R, E, A>
  readonly force: <S, R, E, A>(effect: Effect<S, R, E, A>) => AsyncRE<R, E, A>
}

export class InterruptStatusRestoreImpl implements InterruptStatusRestore {
  constructor(readonly flag: InterruptStatus) {
    this.restore = this.restore.bind(this)
    this.force = this.force.bind(this)
  }

  restore<S, R, E, A>(effect: Effect<S, R, E, A>): Effect<S, R, E, A> {
    return interruptStatus_(effect, this.flag)
  }

  force<S, R, E, A>(effect: Effect<S, R, E, A>): AsyncRE<R, E, A> {
    if (this.flag.isUninteruptible) {
      return interruptible(disconnect(uninterruptible(effect)))
    }
    return interruptStatus_(effect, this.flag)
  }
}

/**
 * Makes the effect uninterruptible, but passes it a restore function that
 * can be used to restore the inherited interruptibility from whatever region
 * the effect is composed into.
 */
export const uninterruptibleMask = <S, R, E, A>(
  f: (restore: InterruptStatusRestore) => Effect<S, R, E, A>
) =>
  checkInterruptible((flag) => uninterruptible(f(new InterruptStatusRestoreImpl(flag))))
