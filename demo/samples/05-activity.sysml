sysml activity
package Cooking {
    attribute def Water;
    attribute def Pasta;
    action def Boil { in water : Water; out pasta : Pasta; }
    action boil : Boil;
    action drain;
    action serve;
    first start then boil;
    boil then drain;
    drain then serve;
    flow of Pasta from boil to drain;
}
