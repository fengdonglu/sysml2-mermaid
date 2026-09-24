sysml requirement
// 需求角色：subject / stakeholder / actor / invariant / satisfy / verify
package SafetyRequirements {
    requirement def <'SR1'> Braking {
        doc /* 车辆应在要求的距离内制动。 */
        subject vehicle : Vehicle;
        stakeholder driver : Person;
        actor system : System;
        require constraint { distance <= limit }
    }
    requirement <'SR2'> EmergencyBraking : Braking;
    requirement def BrakingVerification { verify EmergencyBraking; }
    part def Vehicle;
    part def Person;
    part def System;
    part def BrakeSystem;
    satisfy Braking by BrakeSystem;
}
