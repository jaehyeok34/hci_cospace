import Entity from "./entity";
import * as Component from "./component";
import Random from "./random";
import { WitchBehavior } from "./behavior";

export default class EntityManager {
    // n: 복제된 유닛의 갯수
    // m: 타겟 갯수
    public static createEntities(n: number, m: number): Entity[] {
        const entities: Entity[] = [];

        const player = Entity.create();
        player.addComponent(new Component.CamItemComponent(Scene.getItem("fixed_cam") as CameraItem))
            .addComponent(new Component.ControllableComponent())
            .addComponent(new Component.LifeComponent(0, m))
            .addComponent(new Component.CountComponent(m, 0));

        entities.push(player);

        const origin = Scene.getItem("origin");
        for (let i = 0; i < n; i++) {
            const item = (i === 0) ? origin : origin.copy();
            const [min, max] = [-20, 20];
            const random = () => Random.getValue(max, min, true);
            const pos = new Vector3(random(), random(), 0);
            const lookAt = player.getComponent(Component.CamItemComponent)?.camItem.transform.position;

            const unit = Entity.create();
            unit.addComponent(new Component.AnimatedItemComponent(item as AnimatedItem, pos, lookAt))
                .addComponent(new Component.TargetComponent(i < m))
                .addComponent(new Component.ClickableComponent())
                .addComponent(new Component.AutoBehaviorComponent(new WitchBehavior()));

            entities.push(unit);
        }
        
        new Map<Component.ArtifactType, BaseItem>([
            ["remove", Scene.getItem("artifact1")],
            ["hint", Scene.getItem("artifact2")],
            ["life", Scene.getItem("artifact3")],
            ["guide", Scene.getItem("artifact4")]
        ]).forEach((artifact, t) => {
            const entity = Entity.create();
            entity.addComponent(new Component.ArtifactComponent(artifact, t))
                .addComponent(new Component.ClickableComponent());
            
            entities.push(entity);
        });

        const effect = Entity.create();
        effect.addComponent(new Component.EffectComponent(Scene.getItem("effect")));
        entities.push(effect);

        
        const witchSound = Entity.create();
        witchSound.addComponent(new Component.SoundComponent(Sound.load("r3/u78qZgL2PyjDOLi7enUHmkBUkXFFtPVnnUATV4oNfEu"), "witch"));
        entities.push(witchSound);

        const itemSound = Entity.create();
        itemSound.addComponent(new Component.SoundComponent(Sound.load("r3/edNZI43PDLTCJcT9TM5yshMPKYUTR9OihkLvW7bBMqG"), "item"));
        entities.push(itemSound);

        const fireworksSound = Entity.create();
        fireworksSound.addComponent(new Component.SoundComponent(Sound.load("r3/E9Ji1TFsVslkCfiabmBOtuVTfgDy9QBXQULMnyGXRcG"), "fireworks"));
        entities.push(fireworksSound);
        
        return entities;
    }
}