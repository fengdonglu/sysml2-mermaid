sysml ibd
package Powertrain {
    port def FuelPort;
    part def FuelTank { port tankPort : FuelPort; }
    part def Engine { port enginePort : FuelPort; }
    part def Vehicle {
        part tank : FuelTank;
        part eng : Engine;
        connect tank.tankPort to eng.enginePort;
    }
}
