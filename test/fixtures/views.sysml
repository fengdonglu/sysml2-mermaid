sysml bdd
package Vehicle {
    abstract part def PowerSource;
    #Structure part def Engine :> PowerSource;
    part def Vehicle {
        part engine : Engine;
    }
    view def StructureView :> GeneralView {
        filter @Structure;
    }
}
