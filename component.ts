import { Behavior } from "./behavior";

export interface Component { }

export class AnimatedItemComponent implements Component {
    public constructor(public animatedItem: AnimatedItem, position?: Vector3, lookAt?: Vector3) {
        if (position) {
            animatedItem.transform.position = position;
        }

        if (lookAt) {
            const r = animatedItem.transform.lookAt(lookAt).rotation;
            animatedItem.transform.rotation = new Quat(0, 0, r.z, r.w);
        }
    }
}

export class CamItemComponent implements Component {
    public constructor(public camItem: CameraItem) { 
        const [axis, angle] = [new Vector3(1, 0, 0), Math.PI / 2];
        const title = Scene.createText(Vector3.add(camItem.transform.position, new Vector3(0, 1, 0)), "");
        title.transform.rotateLocal(axis, angle);
        title.fontSize = 24;
        title.active = false;

        const text = Scene.createText(Vector3.add(title.transform.position, new Vector3(0, 0, -0.25)), "");
        text.transform.rotation = title.transform.rotation;
        text.fontSize = 14;
        text.active = false;

        title.add(text);
        camItem.add(title);
    }
}

export type ArtifactType = "remove" | "hint" | "life" | "guide";
export class ArtifactComponent implements Component {
    public constructor(public artifact: BaseItem, public artifactType: ArtifactType) { }
}

export class ClickableComponent implements Component {
    public constructor() { }
}

export class TargetComponent implements Component {
    public constructor(public readonly isTarget: boolean) { }
}

export class ControllableComponent implements Component {
    public constructor() { }
}

export class LifeComponent implements Component {
    public constructor(public readonly minimum: number, public life: number) { }
}

export class CountComponent implements Component {
    public constructor(public readonly maximum: number, public conut: number) { }
}

export class AutoBehaviorComponent implements Component {
    public haltSig: boolean;

    public constructor(public readonly behavior: Behavior) { 
        this.haltSig = false;
    }
}

export class EffectComponent implements Component {
    public constructor(public readonly effect: BaseItem) { }
}

export type SoundType = "witch" | "item" | "fireworks";
export class SoundComponent implements Component {
    public constructor(public readonly sound: Sound, public readonly soundType: SoundType) { }
}

