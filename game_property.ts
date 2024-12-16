export default class GameProperty {
    public static readonly UNIT_NUM = 50;
    public static readonly TARGET_NUM = 10;

    public static readonly READY = 5;
    public static currentTime = () => Math.floor(Time.currentTime) - GameProperty.READY;

    public static readonly ARTIFACT_MAX_PERIOD = 15;
    public static readonly ARTIFACT_MIN_PERIOD = 8;
    public static readonly ARTIFACT_BLINK_START = 8;
    public static readonly ARTIFACT_REMOVE = 10;
    public static readonly ARTIFACT_REMOVE_EFFECTiVE = 5;
}

