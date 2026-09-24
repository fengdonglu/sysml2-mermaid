sysml requirement
package SafetyRequirements {
    requirement def <'SR1'> Braking {
        doc /* The vehicle shall brake within the required distance. */
        subject vehicle : Vehicle;
        stakeholder driver : Person;
        actor system : System;
        require constraint { distance <= limit }
    }
    requirement <'SR2'> EmergencyBraking : Braking;
    requirement def BrakingVerification { verify EmergencyBraking; }
    part def BrakeSystem;
    satisfy Braking by BrakeSystem;
}
