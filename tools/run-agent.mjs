import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: join(root, ".env") });
const isWindows = process.platform === "win32";
const wrapper = join(root, isWindows ? "mvnw.cmd" : "mvnw");

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: "inherit", ...options });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) reject(new Error(`Commande interrompue par ${signal}`));
      else resolve(code ?? 1);
    });
  });
}

const buildCode = await run(wrapper, ["-q", "-f", "agent-java/pom.xml", "package"], {
  shell: isWindows,
});
if (buildCode !== 0) process.exit(buildCode);

const jar = join(root, "agent-java", "target", "pulsegrid-agent.jar");
const agentCode = await run("java", ["-jar", jar]);
process.exit(agentCode);

