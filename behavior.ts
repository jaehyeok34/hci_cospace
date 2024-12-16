import Entity  from "./entity";
import Random from "./random";
import * as Component from "./component";
import GameProperty from "./game_property";

export interface System { }

// TargetComponent + AnimatedItemComponent
export class HintSystem implements System {
    public static hint(entity: Entity, duration?: number): void;
    public static hint(entities: Entity[], duration?: number): void;

    public static hint(entities: (Entity | Entity[]), duration?: number): void {
        if (duration <= 0) {
            return;
        }

        if (!Array.isArray(entities)) {
            entities = [entities];
        }

        entities.forEach((entity) => {
            const targetComponent = entity.getComponent(Component.TargetComponent);
            const animatedItemComponent = entity.getComponent(Component.AnimatedItemComponent);

            if (!targetComponent || !animatedItemComponent) {
                return;
            }

            if (!targetComponent.isTarget || !animatedItemComponent.animatedItem.active) {
                return;
            }

            HintSystem.process(animatedItemComponent.animatedItem.children[0], duration);
        });
    }

    private static process(effect: BaseItem, duration: number) {
        effect.active = true;
        Time.schedule(() => effect.active = false, duration);
    }
}



// ControllableComponent + CamItemComponent
export class ControllSystem implements System {
    public static enable(entities: Entity[]) {
        entities.filter((entity) => entity.getComponent(Component.ControllableComponent) !== null)
            .forEach((entity) => {
            const controllableComponent = entity.getComponent(Component.ControllableComponent);
            const camItemComponent = entity.getComponent(Component.CamItemComponent);

            if (!controllableComponent || !camItemComponent) {
                return;
            }

            const text = camItemComponent.camItem.children[0].copy();               // fixed_cam의 텍스트 복사
            const rotation = camItemComponent.camItem.transform.rotation;           // fixed_cam의 회전값 저장
            camItemComponent.camItem.children[0].delete();                          // fixed_cam 텍스트 삭제
            camItemComponent.camItem = Scene.getItem("movable_cam") as CameraItem;  // movable_cam으로 갱신

            const cam = camItemComponent.camItem;
            cam.transform.rotation = rotation;      // movable_cam의 회전값을 기존 fixed_cam의 회전값으로 갱신

            cam.add(text);              // movable_cam에 텍스트 추가
            cam.canJump = false;
            Camera.focusedItem = cam;   // movable_cam 활성화
        });
    }
}



export class ClickSystem implements System {
    // 1. AnimatedItemComponent + ClickableComponent + TargetComponent + AutoBehaviorComponent;
    // 2. CamItemComponent + ControllableComponent + CountComponent + LifeComponrnt
    public static enableAnimatedItemClick(entities: Entity[]) {
        const cam = entities.find((entity) => entity.getComponent(Component.CamItemComponent) !== null);
        if (!cam) {
            return;
        }

        // cam을 제외한 모든 entity에 대해 실행
        entities.filter((entity) => entity.id !== cam.id).forEach((entity) => {
            const animatedItemComponent = entity.getComponent(Component.AnimatedItemComponent);
            const clickableComponent = entity.getComponent(Component.ClickableComponent);
            const targetComponent = entity.getComponent(Component.TargetComponent);
            const autoBehaviorComponent = entity.getComponent(Component.AutoBehaviorComponent);

            if (!animatedItemComponent || !clickableComponent || !targetComponent || !autoBehaviorComponent) {
                return;
            }

            const camItemComponent = cam.getComponent(Component.CamItemComponent);
            const controllableComponent = cam.getComponent(Component.ControllableComponent);
            const countComponent = cam.getComponent(Component.CountComponent);
            const lifeComponent = cam.getComponent(Component.LifeComponent);

            if (!controllableComponent || !countComponent || !lifeComponent) {
                return;
            }

            const animatedItem = animatedItemComponent.animatedItem;
            const camItem = camItemComponent.camItem;
            const duration = 3;

            // 클릭 됐을 때 동작
            animatedItem.input.onClick(() => {
                const distance = () => Vector3.distance2(animatedItem.transform.position, camItem.transform.position);
                
                if (distance() > 30) {
                    return;
                }

                animatedItem.input.onClick(null);

                let msg = "용케 날 찾아내다니...";
                let animation = false;

                if (targetComponent.isTarget) {
                    CountSystem.countUp(cam);
                    HintSystem.hint(entity, duration);
                } else {
                    LifeSystem.reduce(cam);
                    const lifeText = (lifeComponent.life > 0) ?
                        `자네 목숨은 ${lifeComponent.life}개 남았다네...` :
                        `마지막 목숨이네.. 신중하게나...`;
                    msg = `내가 아니라네 끌끌..\n${lifeText}`;
                    animation = true;
                }

                // 선택된 animatedItem의 움직임을 정지
                SoundSystem.play(entities, "witch");
                autoBehaviorComponent.behavior.halt(animatedItem, camItem.transform, animation);
                autoBehaviorComponent.haltSig = true;

                // msg를 띄우고, t초뒤 삭제
                animatedItem.speech = msg;
                Time.schedule(() => {
                    animatedItem.speech = ""
                    animatedItem.active = false;
                }, duration);
            });
        });
    }
}



// CountComponent
export class CountSystem implements System {
    public static countUp(entity: Entity): void;
    public static countUp(entities: Entity[]): void;

    public static countUp(entities: (Entity | Entity[])) {
        if (!Array.isArray(entities)) {
            entities = [entities];
        }

        const entity = entities.find((entity) => entity.getComponent(Component.CountComponent) !== null);

        if (!entity) {
            return;
        }

        entity.getComponent(Component.CountComponent).conut++;
    }
}



// LifeComponent
export class LifeSystem implements System {
    public static reduce(entity: Entity): void;
    public static reduce(entities: Entity[]): void;

    public static reduce(entities: (Entity | Entity[])) {
        if (!Array.isArray(entities)) {
            entities = [entities];
        }

        const entity = entities.find((entity) => entity.getComponent(Component.LifeComponent) !== null);
        
        if (!entity) {
            return;
        }

        entity.getComponent(Component.LifeComponent).life--;
    }
}



// AutoBehaviorComponent + AnimatedItemComponent
export class AutoBehaviorSystem implements System {
    public static begin(entities: Entity[]) {
        entities.forEach((entity) => {
            const autoBehaviorComponent = entity.getComponent(Component.AutoBehaviorComponent);
            const animatedItemComponent = entity.getComponent(Component.AnimatedItemComponent);

            if (!autoBehaviorComponent || !animatedItemComponent) {
                return;
            }

            if (autoBehaviorComponent.haltSig) {
                return;
            }

            AutoBehaviorSystem.loop(autoBehaviorComponent, animatedItemComponent.animatedItem);
        });
    }

    private static loop(autoBehaviorComponent: Component.AutoBehaviorComponent, animatedItem: AnimatedItem) {
        const duration = Random.getValue(10);
        autoBehaviorComponent.behavior.begin(animatedItem, duration);
        Time.schedule(() => AutoBehaviorSystem.loop(autoBehaviorComponent, animatedItem), duration);
    }
}


// 1. CamItemComponent + LifeComponent + CountComponent
// 2. AnimatedItemComponent + TargetComponent + AutoBehaviorComponent
export class GameSystem implements System {
    public static observe(entities: Entity[], callback?: () => void): Disposable[] {
        const disposables: Disposable[] = [];

        disposables.push(GameSystem.observeGameOver(entities, callback));
        disposables.push(GameSystem.observeGameClear(entities, callback));

        return disposables;
    }

    public static observeGameOver(entities: Entity[], callback?: () => void): Disposable {
        const disposable = Time.scheduleRepeating(() => {
            const lifeEntity = entities.find((entity) => entity.getComponent(Component.LifeComponent) !== null);
            if (!lifeEntity) {
                return;
            }

            const camItemCompnent = lifeEntity.getComponent(Component.CamItemComponent);
            const lifeComponent = lifeEntity.getComponent(Component.LifeComponent);
            const countComponent = lifeEntity.getComponent(Component.CountComponent);

            if (!camItemCompnent || !lifeComponent || !countComponent) {
                return;
            }

            // not game over
            if (lifeComponent.life >= lifeComponent.minimum) {
                return;
            }

            // game over
            disposable.dispose(); // 현재 모니터링하고 있는 것을 중지
            callback();

            const camItem = camItemCompnent.camItem;
            GameSystem.showText(camItem, countComponent, "Game Over !!");
            
            entities.forEach((entity) => {
                const animatedItemComponent = entity.getComponent(Component.AnimatedItemComponent);
                const targetComponent = entity.getComponent(Component.TargetComponent);
                const autoBehaviorComponent = entity.getComponent(Component.AutoBehaviorComponent);

                if (!animatedItemComponent || !targetComponent || !autoBehaviorComponent) {
                    return;
                }

                const animatedItem = animatedItemComponent.animatedItem;

                // 타겟 유닛만 남기고 모두 삭제, 타겟 유닛은 이펙트 활성화
                if (targetComponent.isTarget) {
                    HintSystem.hint(entity, 9999);
                } else {
                    animatedItem.active = false;
                }

                SoundSystem.play(entities, "witch");
                autoBehaviorComponent.behavior.halt(animatedItem, camItem.transform, true);
                autoBehaviorComponent.haltSig = true;
                animatedItem.input.onClick(null);
            });
        });

        return disposable;
    }

    public static observeGameClear(entities: Entity[], callback?: () => void): Disposable {
        const disposable = Time.scheduleRepeating(() => {
            const countComponent = entities.find((e) => e.getComponent(Component.CountComponent) !== null)?.getComponent(Component.CountComponent);

            if (!countComponent) {
                return;
            }

            // not game clear
            if (countComponent.conut < countComponent.maximum) {
                return;
            }

            // game clear
            disposable.dispose();
            callback();
            SoundSystem.play(entities, "fireworks", true);

            const camItem = entities.find(e => e.getComponent(Component.CamItemComponent) !== null)?.getComponent(Component.CamItemComponent).camItem;

            if (!camItem) {
                return;
            }

            GameSystem.showText(camItem, countComponent, "Game Clear !!");
            entities.filter(e => e.getComponent(Component.AnimatedItemComponent) !== null)
                .filter(e => e.getComponent(Component.AutoBehaviorComponent) !== null)
                .forEach(e => {
                    const animatedItemComponent = e.getComponent(Component.AnimatedItemComponent);
                    const autoBehaviorComponent = e.getComponent(Component.AutoBehaviorComponent);

                    SoundSystem.play(entities, "witch");
                    autoBehaviorComponent.behavior.halt(animatedItemComponent.animatedItem);
                    autoBehaviorComponent.haltSig = true;

                    animatedItemComponent.animatedItem.active = false;
                });

            const origin = entities.find(e => e.getComponent(Component.EffectComponent) !== null);

            if (!origin) {
                return;
            }

            const effects: BaseItem[] = [];
            new Promise(resolve => {
                for (let i = 0; i < 30; i++) {
                    const effect = origin.getComponent(Component.EffectComponent).effect.copy();
                    const pos = () => Random.getValue(20, -20)
                    const bytes = () => Random.getValue(255);

                    effect.transform.position = new Vector3(pos(), pos(), Random.getValue(3));
                    effect.color = new Color(bytes(), bytes(), bytes());
                    effect.transform.scale = Random.getValue(5);

                    effects.push(effect);
                }

                resolve();
            }).then(_ => {
                effects.forEach(e => e.active = true);
            });
        });

        return disposable;
    }

    private static showText = (cam: CameraItem, countComponent: Component.CountComponent, message: string) => {
        const offset = 0.1;
        const title = cam.children[0] as TextItem;
        const text = title.children[0] as TextItem;

        title.text = message;
        text.text = `${countComponent.conut} / ${countComponent.maximum}\n` + 
            `${GameProperty.currentTime()}s`;

        title.transform.position = Vector3.add(title.transform.position, new Vector3(0, 0, offset));
        title.active = true;
        text.active = true;
    };

}



export class ArtifactSystem implements System {
    public static create(entities: Entity[]): Disposable {
        const artifacts = entities.filter((entity) => entity.getComponent(Component.ArtifactComponent) !== null);
        const cam = entities.find((entity) => entity.getComponent(Component.CamItemComponent) !== null);

        if (!artifacts || !cam) {
            return;
        }

        const [min, max] = [GameProperty.ARTIFACT_MIN_PERIOD, GameProperty.ARTIFACT_MAX_PERIOD];
        const [blinkStart, remove] = [GameProperty.ARTIFACT_BLINK_START, GameProperty.ARTIFACT_REMOVE]; 
        let period = Random.getValue(max, min, true);

        // 1초 카운팅
        return Time.scheduleRepeating(() => {
            Debug.log(`period: ${period}, time: ${GameProperty.currentTime()}`);

            if (period !== GameProperty.currentTime()) { // 생성 주기와 현재 시간이 다르다면 생성 X
                return;
            }

            period = Random.getValue(max, min, true) + GameProperty.currentTime(); // 다음 아티팩트 생성 주기 갱신
            
            const artifactComponent = artifacts[Random.getValue(artifacts.length)].getComponent(Component.ArtifactComponent); // 여러 개의 아티팩트 중 랜덤한 하나 선택(추후 확률을 적용해야 함)
            const artifact = artifactComponent.artifact.copy();
            const range = 20;
            const getPos = () => Random.getValue(range, -range, true);
            const camItem = cam.getComponent(Component.CamItemComponent)!.camItem;

            // 아티팩트 생성
            artifact.transform.position = new Vector3(getPos(), getPos(), 0);
            const r = artifact.transform.lookAt(camItem.transform.position).rotation;
            artifact.transform.rotation = new Quat(0, 0, r.z, r.w);
            artifact.active = true;


            const disposable = ArtifactSystem.blink(artifact, blinkStart);                                     
            const removeDisposable = ArtifactSystem.remove(artifact, remove, () => disposable.then((d: Disposable) => d.dispose()));  

            // 클릭했을 때, 동작 추가
            artifact.input.onClick(() => {
                const getDistance = () => Vector3.distance2(artifact.transform.position, camItem.transform.position);

                if (getDistance() > 30) {
                    return;
                }
                
                artifact.input.onClick(null);
                SoundSystem.play(entities, "item");

                new Map<Component.ArtifactType, () => void>([
                    ["remove", () => {
                        artifact.active = false;
                        ArtifactSystem.applyRemove(entities);
                    }],
                    ["hint", () => {
                        artifact.active = false;
                        ArtifactSystem.applyHint(entities);
                    }],
                    ["life", () => {
                        removeDisposable.dispose();
                        disposable.then((d: Disposable) => d.dispose());
                        artifact.opacity = 1;
                        
                        const life = ArtifactSystem.applyLife(entities);
                        artifact.speech = `목숨 추가!!\n남은 목숨: ${life}`;
                        Time.schedule(() => {
                            artifact.speech = ""
                            artifact.active = false;
                        }, 3);
                    }],
                    ["guide", () => {
                        disposable.then((d: Disposable) => d.dispose());
                        artifact.opacity = 1;

                        ArtifactSystem.applyGuide(artifact, removeDisposable, entities);
                    }]
                ]).get(artifactComponent.artifactType)();
            });
        }, 1);
    }

    private static applyRemove(entities: Entity[]) {
        entities.filter((entity) => entity.getComponent(Component.AnimatedItemComponent) !== null)
            .filter((entity) => entity.getComponent(Component.AnimatedItemComponent).animatedItem.active)
            .filter((entity) => entity.getComponent(Component.TargetComponent) !== null)
            .filter((entity) => !entity.getComponent(Component.TargetComponent).isTarget)
            .filter((entity) => entity.getComponent(Component.AutoBehaviorComponent) !== null)
            .slice(0, GameProperty.ARTIFACT_REMOVE_EFFECTiVE)
            .forEach((entity) => {
                const animatedItemComponent = entity.getComponent(Component.AnimatedItemComponent);
                const autoBehaviorComponent = entity.getComponent(Component.AutoBehaviorComponent);
                const animatedItem = animatedItemComponent.animatedItem;

                const cam = entities.find((e) => e.getComponent(Component.CamItemComponent) !== null);
                const camItem = cam.getComponent(Component.CamItemComponent)!.camItem;

                const disposable = Time.scheduleRepeating(() => {
                    const r = animatedItem.transform.lookAt(camItem.transform.position).rotation;
                    animatedItem.transform.rotation = new Quat(0, 0, r.z, r.w);
                });

                SoundSystem.play(entities, "witch");
                animatedItem.speech = "분하다...";
                autoBehaviorComponent.behavior.halt(animatedItem);
                autoBehaviorComponent.haltSig = true;

                Time.schedule(() => {
                    disposable.dispose();
                    animatedItem.speech = "";
                    animatedItem.active = false;
                }, 2);
            });
    }

    private static applyHint(entities: Entity[]) {
        const targets = entities.filter((entity) => entity.getComponent(Component.AnimatedItemComponent) !== null)
            .filter((entity) => entity.getComponent(Component.AnimatedItemComponent).animatedItem.active)
            .filter((entity) => entity.getComponent(Component.TargetComponent) !== null)
            .filter((entity) => entity.getComponent(Component.TargetComponent).isTarget);

        HintSystem.hint(targets, 2);
    }

    private static applyLife(entities: Entity[]): number {
        let life: number
        entities.filter((e) => e.getComponent(Component.LifeComponent) !== null)
            .forEach((e) => {
                const lifeComponent = e.getComponent(Component.LifeComponent);
                lifeComponent.life += 3;
                life = lifeComponent.life;
            });

        return life;
    }

    private static applyGuide(artifact: BaseItem, removeDisposable: Disposable, entities: Entity[]) {
        removeDisposable.dispose(); // 삭제 예약 제거

        const target = entities.filter((e) => e.getComponent(Component.TargetComponent) != null)
            .filter((e) => e.getComponent(Component.TargetComponent).isTarget)
            .filter((e) => e.getComponent(Component.AnimatedItemComponent) !== null)
            .find((e) => e.getComponent(Component.AnimatedItemComponent).animatedItem.active)
            .getComponent(Component.AnimatedItemComponent).animatedItem;

        (artifact as AnimatedItem).animation.playLooping("Run");
        const speed = 8;
        const disposable = Time.scheduleRepeating(() => {
            const r = artifact.transform.lookAt(target.transform.position).rotation;
            artifact.transform.rotation = new Quat(0, 0, r.z, r.w);
            
            if (speed < 0.1) {
                return;
            }

            artifact.transition.stop();
            artifact.transition.moveTo(target.transform.position, speed);
        }, 0.1);

        Time.schedule(() => {
            disposable.dispose();
            artifact.active = false;
            artifact.delete();
        }, 3);
    }

    private static async blink(artifact: BaseItem, delay: number) {
        return new Promise((resolve) => {
            Time.schedule(() => {
                const disposable = Time.scheduleRepeating(() => {
                    artifact.opacity = (artifact.opacity > 0.5) ? 0.4 : 1;
                }, 0.3);

                resolve(disposable);
            }, delay);
        });
    }

    private static remove(artifact: BaseItem, delay: number, callback: () => void): Disposable {
        return Time.schedule(() => {
            artifact.active = false;
            artifact.delete();
            callback();
        }, delay);
    }
}



export class SoundSystem implements System {
    public static play(entities: Entity[], soundType: Component.SoundType, isLoop?: boolean) {
        const sound = entities.filter(e => e.getComponent(Component.SoundComponent) !== null)
            .find(e => e.getComponent(Component.SoundComponent)!.soundType === soundType)
            .getComponent(Component.SoundComponent)
            .sound;

        if (!sound) {
            return;
        }   

        sound.stop();
        sound.play(isLoop);
        sound.volume = 0.8;
    }
}




