sysml
package VehicleRequirements {
    requirement def <'1'> MassLimitation {
        doc /* The total mass of a vehicle shall not exceed the limit. */
        subject vehicle : Vehicle;
        require constraint { vehicle.mass <= limit }
    }
    requirement <'UR1.1'> Load : MassLimitation {
        requirement Passengers;
    }
    part def Vehicle;
    part def VehicleDesign;
    satisfy MassLimitation by VehicleDesign;
    verify Load;
}
