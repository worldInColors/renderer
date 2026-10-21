var l = Object.defineProperty;
var g = (r, e, s) => e in r ? l(r, e, { enumerable: !0, configurable: !0, writable: !0, value: s }) : r[e] = s;
var i = (r, e, s) => (g(r, typeof e != "symbol" ? e + "" : e, s), s);
import * as t from "three";
class u {
  constructor(e, s = 20) {
    i(this, "group");
    i(this, "plane");
    i(this, "nearEdge");
    i(this, "farEdge");
    i(this, "center");
    i(this, "parent");
    i(this, "disposed", !1);
    this.parent = e, this.group = new t.Group(), this.group.name = "tilt-shift-gizmo", this.group.renderOrder = 999, this.group.visible = !1;
    const a = new t.PlaneGeometry(s, s), o = new t.MeshBasicMaterial({
      color: 16755251,
      transparent: !0,
      opacity: 0.18,
      side: t.DoubleSide,
      depthWrite: !1
    });
    this.plane = new t.Mesh(a, o), this.group.add(this.plane);
    const n = new t.EdgesGeometry(a), p = new t.LineBasicMaterial({
      color: 16746496,
      transparent: !0,
      opacity: 0.55,
      depthWrite: !1
    });
    this.nearEdge = new t.LineSegments(n, p), this.farEdge = new t.LineSegments(n, p), this.group.add(this.nearEdge), this.group.add(this.farEdge);
    const h = new t.SphereGeometry(0.25, 16, 12), d = new t.MeshBasicMaterial({
      color: 16755251,
      depthWrite: !1
    });
    this.center = new t.Mesh(h, d), this.group.add(this.center), e.add(this.group);
  }
  /**
   * Sync the gizmo to the current focus parameters.
   * @param focusPoint world-space anchor of the focus plane
   * @param focusNormal unit vector orienting the plane
   * @param focusRange half-width of the in-focus slab (world units)
   */
  update(e, s, a) {
    if (this.disposed)
      return;
    this.group.position.copy(e);
    const o = new t.Quaternion().setFromUnitVectors(
      new t.Vector3(0, 0, 1),
      s.clone().normalize()
    );
    this.plane.quaternion.copy(o), this.nearEdge.quaternion.copy(o), this.farEdge.quaternion.copy(o);
    const n = s.clone().normalize().multiplyScalar(a);
    this.nearEdge.position.copy(n).negate(), this.farEdge.position.copy(n);
  }
  setVisible(e) {
    this.group.visible = e;
  }
  isVisible() {
    return this.group.visible;
  }
  dispose() {
    this.disposed || (this.disposed = !0, this.parent.remove(this.group), this.plane.geometry.dispose(), this.plane.material.dispose(), this.nearEdge.geometry.dispose(), this.nearEdge.material.dispose(), this.center.geometry.dispose(), this.center.material.dispose());
  }
}
export {
  u as TiltShiftGizmo
};
