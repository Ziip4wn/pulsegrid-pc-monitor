import { spawn } from "node:child_process";
import { constants } from "node:fs";
import { access, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const prefix = "[java-rmi]";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const runtimeDirectory = join(root, "dependencies");
const executable = join(runtimeDirectory, "java-rmi.exe");
const pidFile = join(runtimeDirectory, ".java-rmi.pid");

function isAutostartDisabled() {
  return ["1", "true", "yes"].includes(
    (process.env.PULSEGRID_SKIP_JAVA_RMI ?? "").trim().toLowerCase(),
  );
}

async function readRunningPid() {
  let pid;

  try {
    pid = Number.parseInt((await readFile(pidFile, "utf8")).trim(), 10);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }

  if (!Number.isSafeInteger(pid) || pid <= 0) {
    await rm(pidFile, { force: true });
    return null;
  }

  try {
    process.kill(pid, 0);
    return pid;
  } catch (error) {
    if (error?.code === "EPERM") return pid;
    if (error?.code !== "ESRCH") throw error;
    await rm(pidFile, { force: true });
    return null;
  }
}

async function start() {
  if (isAutostartDisabled()) {
    console.log(`${prefix} démarrage automatique désactivé.`);
    return;
  }

  if (process.platform !== "win32") {
    console.log(`${prefix} démarrage ignoré : java-rmi.exe nécessite Windows.`);
    return;
  }

  await access(executable, constants.F_OK);

  const runningPid = await readRunningPid();
  if (runningPid !== null) {
    console.log(`${prefix} déjà démarré (PID ${runningPid}).`);
    return;
  }

  const child = spawn(executable, [], {
    cwd: runtimeDirectory,
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });

  await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("spawn", resolve);
  });

  child.unref();
  await writeFile(pidFile, `${child.pid}\n`, "utf8");
  console.log(`${prefix} démarré en arrière-plan (PID ${child.pid}).`);
}

start().catch((error) => {
  console.error(`${prefix} impossible de démarrer : ${error.message}`);
  process.exitCode = 1;
});
