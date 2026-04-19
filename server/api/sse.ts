import { emitter } from "~~/server/utils/events";

const HEARTBEAT_MS = 30_000;

export default defineEventHandler((event) => {
  setResponseHeaders(event, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const res = event.node.res;
  const clientId = Date.now();

  res.write(`event: connected\ndata: ${JSON.stringify({ clientId })}\n\n`);

  const onCheckResult = (result: unknown) => {
    if (
      result &&
      typeof result === "object" &&
      "siteId" in result &&
      typeof (result as { siteId: unknown }).siteId === "number"
    ) {
      res.write(`event: check-result\ndata: ${JSON.stringify(result)}\n\n`);
    }
  };

  emitter.on("check-result", onCheckResult);

  const heartbeat = setInterval(() => {
    try {
      res.write(": ping\n\n");
    } catch {
      clearInterval(heartbeat);
    }
  }, HEARTBEAT_MS);

  event.node.req.on("close", () => {
    clearInterval(heartbeat);
    emitter.off("check-result", onCheckResult);
  });
});

export function broadcastCheckResult(result: unknown) {
  if (
    result &&
    typeof result === "object" &&
    "siteId" in result &&
    typeof (result as { siteId: unknown }).siteId === "number"
  ) {
    emitter.emit("check-result", result);
  }
}
