sysml bdd
package Vehicle {
    enum def Color { red; green; blue; }

    part def Person;
    part def PowerSource;
    part def Engine :> PowerSource {
        attribute power : Real;
    }
    part def Vehicle {
        attribute mass : Real;
        part engine : Engine;
        part spare : Engine[2];
        ref part operator : Person;
    }
    part def Car :> Vehicle {
        part engine : Engine :>> engine;
    }
    dependency from Car to Engine;
}
