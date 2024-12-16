import { Component } from "./component";

export default class Entity {
    private static id = 1;

    public static create(): Entity {
        return new Entity(Entity.id++);
    }

    private components = new Map<Function, Component>(); // key: Component 구현체의 생성자, value: Component 구현체
    private constructor(public readonly id: number) { } // 외부에서 new를 통한 생성을 차단함

    public addComponent(component: Component): Entity {
        this.components.set(component.constructor, component);
        return this;
    }

    public getComponent<T extends Component>(componentClass: { new (...args: any[]): T }): (T | null) {
        return this.components.get(componentClass) as T || null;
    }
}