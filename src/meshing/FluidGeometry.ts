interface FluidPaletteEntry {
	geometries: { fluid?: "water" | "lava" }[];
	occlusionFlags: number;
	isCubic: boolean;
}

/** Remove the template water cubes where the surface mesher supplies the fluid.
 * Keep cached templates intact for CPU builds. A water shell's full-cube culling
 * flags must not hide adjacent waterlogged stairs, fences, or scaffolding.
 */
export function withoutFluidGeometry<T extends FluidPaletteEntry>(palette: T[]): T[] {
	return palette.map((entry) => {
		const geometries = entry.geometries.filter((geometry) => !geometry.fluid);
		if (geometries.length === entry.geometries.length) return entry;
		return { ...entry, geometries, occlusionFlags: 0, isCubic: false };
	});
}
