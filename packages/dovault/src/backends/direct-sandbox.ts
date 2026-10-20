import type {
  BackendAvailability,
  BuildSpawnResult,
  DeclaredLayers,
  SandboxBackend,
} from "./sandbox-backend.js";
import type { SandboxProfile } from "../profile.js";

/**
 * Direct sandbox backend — plain spawn, no isolation.
 *
 * The vendor registry ships bubblewrap / sandbox-exec / psroot /
 * systemd backends only, so on hosts where the bubblewrap jail
 * cannot run (e.g. Docker containers whose mount/user-namespace
 * operations are blocked by the host's AppArmor / capability
 * bounding set) every jailed spawn fails and the AI loses its
 * bash / install / build tools entirely.
 *
 * This backend is the operator escape hatch for trusted,
 * single-tenant deployments (the threat model the compose
 * sandbox overlay itself documents as not needing the jail):
 * select it with DOABLE_SANDBOX_BACKEND=direct and a non
 * prod/staging hardening level (the resolver fail-closes
 * non-isolating backends under prod/staging by design).
 * Priority is the lowest of all backends so auto-resolution
 * still prefers a real jail wherever one is available.
 *
 * Pair with DOABLE_COMPOSERS_DISABLED listing the layer
 * composers (proc-mask, etc-synth, seccomp-bpf, landlock,
 * nft-egress, cgroup-cap, mac-profile): they exist to bolt
 * isolation layers onto backends that lack them and their
 * preflight steps assume a jail exists.
 */
export const directSandboxBackend: SandboxBackend = {
  id: "direct",
  priority: -100,

  async available(): Promise<BackendAvailability> {
    return { ok: true };
  },

  declaredLayers(): DeclaredLayers {
    return {
      fs: "none",
      pidNs: false,
      netNs: false,
      seccomp: false,
      cgroups: false,
      capsDrop: false,
      procMask: false,
      etcSynth: false,
      landlock: false,
      nftEgress: false,
    };
  },

  buildSpawn(
    profile: SandboxProfile,
    command: string,
    args: string[],
    cwd: string,
  ): BuildSpawnResult {
    const env: Record<string, string> = {};
    for (const key of profile.env.allowlist) {
      const value = process.env[key];
      if (value !== undefined) env[key] = value;
    }
    Object.assign(env, profile.env.inject);
    // Profile inject targets the jail layout, where the project
    // is mounted at /work (HOME=/work, PWD=/work). A direct spawn
    // already runs with cwd = the real project directory, so
    // point HOME at the host home (tool state, caches) and PWD
    // at the real cwd instead of the non-existent jail paths.
    env.HOME = process.env.HOME ?? cwd;
    env.PWD = cwd;
    if (!env.npm_config_cache) {
      env.npm_config_cache =
        process.env.NPM_CACHE_DIR ?? "/var/cache/doable/npm";
    }
    return { argv: [command, ...args], env, preflight: [], teardown: [] };
  },
};
