import { PHYS, PLAYER_H, PLAYER_W } from '../constants';
import type { ActionFrame } from '../input/ActionFrame';
import { createBody, type Body } from '../physics/Body';
import type { Collider, OneWayPlatform } from '../physics/Collider';
import type { AnimState } from '../recorder/Recorder';

/** Bit. Position is the hitbox's top-left corner. */
export class Player {
  readonly body: Body;
  facing: 1 | -1 = 1;
  anim: AnimState = 'idle';
  /** While recording, Bit is a draft: passes firewalls like a ghost. */
  draft = false;
  /** Bottom edge before this frame's move, used for stomp checks. */
  prevBottom = 0;
  standingOn: unknown = null;
  private coyote = 0;
  private jumpBuffer = 0;

  constructor(private spawnX: number, private spawnY: number) {
    this.body = createBody(spawnX, spawnY, PLAYER_W, PLAYER_H);
    this.prevBottom = spawnY + PLAYER_H;
  }

  get ignoreTags(): string[] {
    return this.draft ? ['firewall'] : [];
  }

  /** Move by (dx, dy) with collision, e.g. riding a ghost. */
  carry(dx: number, dy: number, collider: Collider): void {
    collider.moveX(this.body, dx, this.ignoreTags);
    if (dy !== 0) {
      const g = this.body.grounded;
      collider.moveY(this.body, dy, [], this.ignoreTags);
      this.body.grounded = g;
    }
  }

  step(a: ActionFrame, jumpPressed: boolean, collider: Collider, platforms: OneWayPlatform[]): void {
    const b = this.body;
    const dir = (a.right ? 1 : 0) - (a.left ? 1 : 0);
    if (dir !== 0) this.facing = dir as 1 | -1;

    const target = dir * PHYS.runSpeed;
    const accel = b.grounded ? PHYS.groundAccel : PHYS.airAccel;
    if (b.vx < target) b.vx = Math.min(target, b.vx + accel);
    else if (b.vx > target) b.vx = Math.max(target, b.vx - accel);

    this.coyote = b.grounded ? PHYS.coyoteFrames : Math.max(0, this.coyote - 1);
    if (jumpPressed) this.jumpBuffer = PHYS.jumpBufferFrames;
    if (this.jumpBuffer > 0 && this.coyote > 0) {
      b.vy = -PHYS.jumpVelocity;
      this.jumpBuffer = 0;
      this.coyote = 0;
      b.grounded = false;
    } else if (this.jumpBuffer > 0) {
      this.jumpBuffer--;
    }

    b.vy = Math.min(PHYS.maxFall, b.vy + PHYS.gravity);
    this.prevBottom = b.y + b.h;
    collider.moveX(b, b.vx, this.ignoreTags);
    const res = collider.moveY(b, b.vy, platforms, this.ignoreTags);
    this.standingOn = b.grounded ? res.landedOn : null;

    if (!b.grounded) this.anim = b.vy < 0 ? 'jump' : 'fall';
    else this.anim = Math.abs(b.vx) > 0.05 ? 'run' : 'idle';
  }

  bounce(): void {
    this.body.vy = -PHYS.jumpVelocity * PHYS.stompBounce;
    this.body.grounded = false;
    this.coyote = 0;
  }

  teleport(x: number, y: number): void {
    const b = this.body;
    b.x = x;
    b.y = y;
    b.vx = 0;
    b.vy = 0;
    this.prevBottom = y + b.h;
    this.standingOn = null;
  }

  respawn(): void {
    this.teleport(this.spawnX, this.spawnY);
    this.draft = false;
    this.facing = 1;
    this.anim = 'idle';
    this.coyote = 0;
    this.jumpBuffer = 0;
  }
}
