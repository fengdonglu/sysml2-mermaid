sysml bdd
// 更多构造：item、alias、allocate、connection/interface 定义
package Powertrain {
    item def Fuel;
    part def Tank { item fuel : Fuel; }
    part def Engine;

    allocate Tank to Engine;             // 分配关系（虚线 allocate 边）

    alias eng for Engine;                // 别名
    part def Car { part engine : eng; }  // 用别名引用

    connection def Feed { end a : Tank; end b : Engine; }        // «connection»
    interface def FeedPort { end a : Tank; end b : Engine; }     // «interface»
}
