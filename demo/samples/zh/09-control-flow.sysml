sysml activity
// 活动控制流：控制节点与带标签的接续
package OrderFlow {
    action validate;
    action ship;
    action hold;
    merge;                              // 声明的控制节点（菱形）

    first start then validate;
    validate then merge;
    if inStock then ship;               // 条件分支（标签为 "if …"）
    else hold;                          // 否则分支
    ship then merge;
    hold then merge;
}
