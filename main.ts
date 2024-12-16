import * as System from "./system";
import EntityManager from "./entity_manager";
import GameProperty from "./game_property";

function main() {
    GUI.HUD.sceneNavigationVisible = false;
    const [n, m] = [GameProperty.UNIT_NUM, GameProperty.TARGET_NUM];
    const entities = EntityManager.createEntities(n, m);

    menu(() => {
        // 준비
        System.HintSystem.hint(entities, GameProperty.READY);

        // 시작
        Time.schedule(() => {
            System.ControllSystem.enable(entities);
            System.ClickSystem.enableAnimatedItemClick(entities);
            System.AutoBehaviorSystem.begin(entities);
            const disposable = System.ArtifactSystem.create(entities);

            System.GameSystem.observe(entities, () => disposable.dispose());
        }, GameProperty.READY);
    });
}

function menu(onHide: () => void) {
    GUI.HUD.showInfoPanel({
        title: "마녀 숨바꼭질",
        text: `${GameProperty.UNIT_NUM} 명의 마녀 중, 진짜 마녀 ${GameProperty.TARGET_NUM} 명을 찾아 내라 !\n` +
            "----------아이템 설명----------\n" +
            `해골: ${GameProperty.ARTIFACT_REMOVE_EFFECTiVE} 명의 가짜 마녀를 제거한다.\n` +
            `마녀 모자: 2초 동안 진짜 마녀에 대한 힌트를 준다.\n` +
            `하트: 3개의 목숨이 추가된다.(초기 목숨: ${GameProperty.TARGET_NUM + 1}개)\n` + 
            `생쥐: 진짜 마녀 중 1명에게 3초동안 다가 간다.\n`,
        onHide
    });
}

main();