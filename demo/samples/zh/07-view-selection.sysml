sysml bdd
// 视图选择：view 决定显示哪些元素；filter 结合元数据标注
package SafetyViews {
    abstract part def Component;                 // 抽象块（斜体）
    #Safety part def SeatBelt :> Component;      // 元数据标注 @Safety
    #Safety part def Airbag :> Component;
    part def Engine :> Component;

    view def SafetyView :> GeneralView {         // 特化标准基类 → BDD
        filter @Safety;                          // 只保留带 #Safety 的元素
        render asTreeDiagram;
    }
    view safetyView : SafetyView;                // 具名视图（单一 view 时自动启用）
}
