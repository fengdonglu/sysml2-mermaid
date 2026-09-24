sysml activity
// 泳道：由 perform 派生（SysML v2 没有 swimlane 关键字）
package Cooking {
    action def Boil;
    action def Drain;
    action boil : Boil;
    action drain : Drain;
    action serve;

    part def Cook;
    part chef : Cook { perform boil; }   // chef 的泳道
    part sink : Cook { perform drain; }  // sink 的泳道

    first start then boil;
    boil then drain;
    drain then serve;
}
