sysml activity
// 活动图：动作、接续与对象流
package Cooking {
    attribute def Water;
    attribute def Pasta;
    action def Boil { in water : Water; out pasta : Pasta; }
    action boil : Boil;
    action drain;
    action serve;
    first start then boil;          // 初始节点 → boil
    boil then drain;                // 接续
    drain then serve;
    flow of Pasta from boil to drain;   // 对象流（虚线，标签为载荷）
}
