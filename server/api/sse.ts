import { emitter } from "~~/server/utils/events";

const clients = new Set<any>();

export default (event: any) => {
  setResponseHeaders(event, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const clientId = Date.now();
  event.node.res.write(
    `event: connected\ndata: ${JSON.stringify({ clientId })}\n\n`,
  );

  clients.add(event.node.res);

  const onCheckResult = (result: any) => {
    if (result && typeof result.siteId === "number") {
      event.node.res.write(
        `event: check-result\ndata: ${JSON.stringify(result)}\n\n`,
      );
    }
  };

  emitter.on("check-result", onCheckResult);

  event.node.req.on("close", () => {
    clients.delete(event.node.res);
    emitter.off("check-result", onCheckResult);
  });
};

export function broadcastCheckResult(result: any) {
  if (result && typeof result.siteId === "number") {
    emitter.emit("check-result", result);
  }
}
