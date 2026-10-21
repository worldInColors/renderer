function r(t) {
  return t.map((e) => {
    const i = e.geometries.filter((o) => !o.fluid);
    return i.length === e.geometries.length ? e : { ...e, geometries: i, occlusionFlags: 0, isCubic: !1 };
  });
}
export {
  r as withoutFluidGeometry
};
