sysml bdd
// 车辆模型：块、组合（实心菱形）、引用与泛化（空心三角）
package Vehicle {
    enum def Color { red; green; blue; }

    part def Person;
    part def PowerSource;
    part def Engine :> PowerSource {
        // 属性以行显示在块内
        attribute power : Real;
    }
    part def Vehicle {
        attribute mass : Real;
        part engine : Engine;          // 复合：Vehicle 拥有 engine
        part spare : Engine[2];        // 多重度 [2]
        ref part operator : Person;    // 引用（非复合）
    }
    part def Car :> Vehicle {
        part engine : Engine :>> engine;   // 重定义继承来的 engine
    }
    dependency from Car to Engine;         // 弱依赖
}
