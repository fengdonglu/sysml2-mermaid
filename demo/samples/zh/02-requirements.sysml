sysml requirement
// 需求图：id、正文、主体、约束与满足关系
package VehicleRequirements {
    requirement def <'1'> MassLimitation {
        doc /* 车辆总质量不得超过限值。 */
        subject vehicle : Vehicle;
        require constraint { vehicle.mass <= limit }
    }
    requirement <'UR1.1'> Load : MassLimitation {
        requirement Passengers;        // 嵌套（包含）子需求
    }
    part def Vehicle;
    part def VehicleDesign;
    satisfy MassLimitation by VehicleDesign;   // 箭头从设计指向需求
    verify Load;
}
