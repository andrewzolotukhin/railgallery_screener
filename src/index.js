import { resolve } from "path";
import { fileURLToPath } from "url";
import { JobScheduler } from "@cleverbrush/scheduler";

import { runTelegramBot } from "./telegramBot.js";

const scheduler = new JobScheduler({
  rootFolder: resolve(fileURLToPath(import.meta.url), "../jobs"),
});

scheduler.addJob({
  id: "make missing screenshots",
  path: "makeScreenshots.js",
  schedule: {
    every: "minute",
    interval: 30,
  },
  timeout: 1000 * 28 * 60,
});

scheduler.on("job:start", async ({ jobId, stdout, stderr }) => {
  console.log(`---- ${jobId} - started task`);
  for await (const chunk of stdout) {
    console.log(`---- ${jobId} - ${chunk.toString()}`);
  }
  for await (const chunk of stderr) {
    console.log(`---- ${jobId} - ${chunk.toString()}`);
  }
});

scheduler.on("job:error", async ({ jobId, stdout, stderr }) => {
  console.log(`---- ${jobId} - ERRORED`);
  for await (const chunk of stdout) {
    console.log(`ERROR---- ${jobId} - ${chunk.toString()}`);
  }
  for await (const chunk of stderr) {
    console.log(`ERROR---- ${jobId} - ${chunk.toString()}`);
  }
});

scheduler.on("job:end", (jobInstance) => {
  console.log(`---- ${jobInstance.jobId} - ended task`);
});

scheduler.start();

runTelegramBot();
