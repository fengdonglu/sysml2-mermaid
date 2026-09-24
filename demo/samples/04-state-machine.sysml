sysml statemachine
package Door {
    state def DoorStates;
    state door : DoorStates {
        state closed;
        state opened;
        entry action initial;
        transition open first closed accept OpenSignal then opened;
        transition close first opened accept CloseSignal then closed;
        transition start first initial then closed;
    }
}
