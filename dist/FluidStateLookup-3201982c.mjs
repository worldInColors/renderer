function y(f) {
  return f.map((i) => {
    const o = i.name || i.Name || "", l = i.properties || i.Properties || {}, a = Object.keys(l).sort();
    return a.length ? `${o}[${a.map((n) => `${n}=${l[n]}`).join(",")}]` : o;
  });
}
function U(f, i, o, l, a, { bounds: n, hiddenCells: u } = {}) {
  var k;
  const A = i.length < 256 ? Uint8Array : i.length < 65536 ? Uint16Array : Uint32Array, m = new A(o * l * a), p = (t, e, r) => t >= 0 && e >= 0 && r >= 0 && t < o && e < l && r < a, g = (t, e, r, c) => {
    !p(t, e, r) || c < 0 || c >= i.length || n != null && n.enabled && (t < n.min.x || e < n.min.y || r < n.min.z || t >= n.max.x || e >= n.max.y || r >= n.max.z) || (m[(e * a + r) * o + t] = c + 1);
  }, h = f.create_lazy_chunk_iterator(16, 16, 16, "bottom_up", 0, 0, 0);
  try {
    for (; h.has_next(); ) {
      const t = (k = h.next()) == null ? void 0 : k.blocks;
      if (t)
        if (t instanceof Int32Array || t instanceof Uint32Array)
          for (let e = 0; e + 3 < t.length; e += 4)
            g(t[e], t[e + 1], t[e + 2], t[e + 3]);
        else
          for (const [e, r, c, _] of t)
            g(e, r, c, _);
    }
  } finally {
    h.free();
  }
  for (const t of u ?? []) {
    const [e, r, c] = t.split(",").map(Number);
    p(e, r, c) && (m[(r * a + c) * o + e] = 0);
  }
  return (t, e, r) => p(t, e, r) && i[m[(e * a + r) * o + t] - 1] || "";
}
export {
  U as createFluidStateLookup,
  y as fluidPaletteStates
};
