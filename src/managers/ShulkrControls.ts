// ShulkrControls.ts
// shulkr.com-style WASD flight over a damped OrbitControls rig: keys translate the camera
// AND the orbit target together (the orbit rig flies), so rotate/zoom/pan keep working
// while keys are held — no pointer lock, no mode switch. Velocity is exponentially
// smoothed for the gliding accel/decel feel of the shulkr viewer.
import * as THREE from "three";
import { EventEmitter } from "events";

export interface ShulkrControlsOptions {
	baseSpeed?: number; // blocks per second at speed multiplier 1
	smoothing?: number; // 0..1 — higher = snappier, lower = floatier
}

export class ShulkrControls extends EventEmitter {
	/** Returns the camera that is currently rendering (may change with presets) */
	private getCamera: () => THREE.Camera;
	/** Returns the active orbit controls (target must move with the camera), or null */
	private getActiveControls: () => any;

	private keys = new Set<string>();
	private velocity = new THREE.Vector3();
	private enabled = false;
	private disposed = false;

	public speedMultiplier = 1;
	public baseSpeed: number;
	public smoothing: number;

	constructor(
		getCamera: () => THREE.Camera,
		getActiveControls: () => any,
		options: ShulkrControlsOptions = {}
	) {
		super();
		this.getCamera = getCamera;
		this.getActiveControls = getActiveControls;
		this.baseSpeed = options.baseSpeed ?? 40;
		this.smoothing = options.smoothing ?? 0.12;
	}

	public setEnabled(on: boolean): void {
		if (this.enabled === on) return;
		this.enabled = on;
		if (!on) {
			this.keys.clear();
			// let the current glide decelerate naturally rather than snapping to a stop
		}
	}

	public isEnabled(): boolean {
		return this.enabled;
	}

	/** Blocks/sec at multiplier 1 (slider binding) */
	public setSpeed(mult: number): void {
		this.speedMultiplier = Math.max(0.05, mult);
	}

	private onKeyDown = (e: KeyboardEvent) => {
		if (!this.enabled || this.disposed) return;
		// don't steal keys from text entry (name fields, search boxes) — but checkboxes,
		// radios, buttons and sliders must NOT swallow WASD after being clicked
		const t = e.target as HTMLElement | null;
		if (t) {
			const textInput =
				t.tagName === "TEXTAREA" ||
				t.isContentEditable ||
				(t.tagName === "INPUT" &&
					!["checkbox", "radio", "button", "range", "submit"].includes(
						(t as HTMLInputElement).type
					));
			if (textInput || t.tagName === "SELECT") return;
		}
		if (e.code === "Space") e.preventDefault(); // keep the page from scrolling
		this.keys.add(e.code);
	};

	private onKeyUp = (e: KeyboardEvent) => {
		this.keys.delete(e.code);
	};

	private onBlur = () => {
		this.keys.clear(); // avoid stuck keys when the window loses focus mid-press
	};

	public attach(): void {
		window.addEventListener("keydown", this.onKeyDown, { passive: false });
		window.addEventListener("keyup", this.onKeyUp);
		window.addEventListener("blur", this.onBlur);
	}

	/** Per-frame update — call from the camera update loop. dt in seconds. */
	public update(dt: number): void {
		if (this.disposed) return;

		// target velocity in camera space (right, up, forward)
		const target = new THREE.Vector3();
		if (this.enabled) {
			if (this.keys.has("KeyW")) target.z -= 1;
			if (this.keys.has("KeyS")) target.z += 1;
			if (this.keys.has("KeyA")) target.x -= 1;
			if (this.keys.has("KeyD")) target.x += 1;
			// Space up / Shift down (Minecraft creative); Q/E as alternates
			if (this.keys.has("Space") || this.keys.has("KeyE")) target.y += 1;
			if (this.keys.has("ShiftLeft") || this.keys.has("ShiftRight") || this.keys.has("KeyQ"))
				target.y -= 1;
			if (target.lengthSq() > 0) {
				target.normalize();
				// NOTE: no Ctrl sprint — Ctrl+W/S/D are browser shortcuts (Ctrl+W closes the
				// tab); use the speed slider instead
				target.multiplyScalar(this.baseSpeed * this.speedMultiplier);
			}
		}

		// exponential approach — frame-rate independent form of lerp(current, target, s)
		const k = 1 - Math.pow(1 - this.smoothing, Math.max(dt, 0) * 60);
		this.velocity.lerp(target, k);
		if (this.velocity.lengthSq() < 1e-6) return;

		// camera-space -> world-space (full 3D forward, pitch included — shulkr flies where you look)
		const camera = this.getCamera() as THREE.Object3D;
		if (!camera) return;
		const move = this.velocity
			.clone()
			.multiplyScalar(Math.min(dt, 0.1))
			.applyQuaternion(camera.quaternion);
		camera.position.add(move);

		// move the orbit target with the camera so the orbit rig translates as one body
		const controls = this.getActiveControls();
		if (controls && controls.target) {
			controls.target.add(move);
		}

		this.emit("move", { delta: move.clone() });
	}

	public dispose(): void {
		this.disposed = true;
		this.enabled = false;
		window.removeEventListener("keydown", this.onKeyDown);
		window.removeEventListener("keyup", this.onKeyUp);
		window.removeEventListener("blur", this.onBlur);
	}
}
