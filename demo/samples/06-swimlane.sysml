sysml activity
package Cooking {
    action def Boil;
    action def Drain;
    action boil : Boil;
    action drain : Drain;
    action serve;
    part def Cook;
    part chef : Cook { perform boil; }
    part sink : Cook { perform drain; }
    first start then boil;
    boil then drain;
    drain then serve;
}
