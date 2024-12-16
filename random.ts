export default class Random {
    // inclusive: max 값을 포함할 지 안할 지 여부 조사
    public static getValue(max: number = 0, min: number = 0, inclusive: boolean = false): number {
        return Math.floor(Math.random() * (max - min + Number(inclusive))) + min;
    }
}