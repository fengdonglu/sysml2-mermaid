sysml bdd
package Powertrain {
    item def Fuel;
    part def Tank { item fuel : Fuel; }
    part def Engine;

    allocate Tank to Engine;

    alias eng for Engine;
    part def Car { part engine : eng; }

    connection def Feed { end a : Tank; end b : Engine; }
    interface def FeedPort { end a : Tank; end b : Engine; }
}
