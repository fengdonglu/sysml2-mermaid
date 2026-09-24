sysml bdd
package SafetyViews {
    abstract part def Component;
    #Safety part def SeatBelt :> Component;
    #Safety part def Airbag :> Component;
    part def Engine :> Component;

    view def SafetyView :> GeneralView {
        filter @Safety;
        render asTreeDiagram;
    }
    view safetyView : SafetyView;
}
