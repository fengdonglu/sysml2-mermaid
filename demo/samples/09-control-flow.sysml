sysml activity
package OrderFlow {
    action validate;
    action ship;
    action hold;
    merge;

    first start then validate;
    validate then merge;
    if inStock then ship;
    else hold;
    ship then merge;
    hold then merge;
}
