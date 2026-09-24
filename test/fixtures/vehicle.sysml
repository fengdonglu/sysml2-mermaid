sysml
package Vehicle {
    private import ScalarValues::*;

    enum def Color { red; green; blue; }

    attribute def Mass :> Real;
    port def FuelPort;

    part def PowerSource {
        doc /* something that provides power */
        attribute power : Real;
    }

    part def Engine :> PowerSource {
        attribute mass : Mass;
        port fuelPort : FuelPort;
    }

    part def Vehicle {
        attribute mass : Mass;
        part engine : Engine;
        part spare : Engine[2];
        ref part operator : Person;
    }

    part def Car :> Vehicle {
        part engine : Engine :>> engine;
        part wheels : Wheel[4] subsets parts;
    }

    dependency from Car to Engine;
}
