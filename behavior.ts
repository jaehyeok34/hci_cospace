import Random from "./random";

export interface Behavior {
    begin(item: AnimatedItem, duration: number): void;
    halt(item: AnimatedItem, lookAt?: Transform, isAnimation?: boolean): void;
}

export class WitchBehavior implements Behavior {
    private static readonly ROTATE_SPEED = 0.5;

    public begin = (item: AnimatedItem, duration: number) => {
        if (!item || !(item instanceof AnimatedItem)) {
            return;
        }

        const range = (start: number, n: number) => [...Array(n)].map((_, i) => start + i);
        const behaviors: Map<number[], ((item: AnimatedItem, duration: number) => void)> = new Map([
            [range(0, 40), this.walk],          // 40%
            [range(40, 30), this.run],          // 30%
            [range(70, 20), this.laugh],        // 20%
            [range(90, 10), this.castSpeel]     // 10%
        ]); 

        const random = Random.getValue(100);
        behaviors.forEach((behavior, key) => {
            if (!key.find((x) => x === random)) {
                return;
            }

            behavior(item, duration);
        });
    };

    public halt = (item: AnimatedItem, lookAt?: Transform, isAnimation: boolean = false) => {
        item.animation.stop();
        item.transition.stop();

        new Map<boolean, (item: AnimatedItem) => void>([
            [false, this.idle],
            [true, this.laugh]
        ]).get(isAnimation)(item);

        const disposable = Time.scheduleRepeating(() => {
            if (!item.active) {
                disposable.dispose();
            }

            if (!lookAt) {
                return;
            }

            const r = item.transform.lookAt(lookAt.position).rotation;
            item.transform.rotation = new Quat(0, 0, r.z, r.w);
        }, 0.1);
    };

    private walk = (item: AnimatedItem, duration: number) => {
        if (duration <= 0) {
            return;
        }

        item.animation.playLooping("Walk");
        this.rotate(item, () => this.slowMove(item, duration));
    };

    private run = (item: AnimatedItem, duration: number) => {
        if (duration <= 0) {
            return;
        }

        item.animation.playLooping("Run");
        this.rotate(item, () => this.fastMove(item, duration));
    };

    private rotate = (item: AnimatedItem, callback: () => void) => {
        const angle = Random.getValue(5); // 회전 각도이기 때문에 값 조정 X
        const axis = new Vector3(0, 0, 1); // 회전 축

        item.transition.rotateLocal(axis, angle, WitchBehavior.ROTATE_SPEED, callback);
    };

    private slowMove = (item: AnimatedItem, duration: number) => {
        const t = Random.getValue(duration);
        const distance = new Vector3(0, t, 0);

        item.transition.moveBy(distance, t, () => this.idle(item));
    };

    private fastMove = (item: AnimatedItem, duration: number) => {
        const min = 5; // 최소 움직임 시간
        const t = Random.getValue(duration * 2, min, true);
        const speed = t / 3;
        const distance = new Vector3(0, t, 0);

        item.transition.moveBy(distance, speed, () => this.idle(item));
    };

    private idle = (item: AnimatedItem) => {
        item.transition.stop();
        item.animation.playLooping("Neutral");
    };

    private laugh = (item: AnimatedItem) => {
        item.transition.stop();
        item.animation.playLooping("Laugh");
    };

    private castSpeel = (item: AnimatedItem) => {
        item.transition.stop();
        item.animation.playLooping("Cast spell");
    };
}