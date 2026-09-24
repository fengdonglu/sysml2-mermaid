sysml statemachine
// 状态机：状态、嵌套、entry 动作与转移
package Door {
    state def DoorStates;
    state door : DoorStates {
        state closed;
        state opened;
        entry action initial;                       // 空 entry 动作充当初始伪状态
        transition open first closed accept OpenSignal then opened;
        transition close first opened accept CloseSignal then closed;
        transition start first initial then closed;
    }
}
