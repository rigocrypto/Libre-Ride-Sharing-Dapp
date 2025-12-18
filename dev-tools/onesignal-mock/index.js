const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

const LOG_FILE = path.join("/app", "onesignal.log");

app.post("/notifications", (req, res) => {
  const entry = {
    ts: new Date().toISOString(),
    body: req.body,
  };

  console.log("ONESIGNAL MOCK:", JSON.stringify(entry, null, 2));
  fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + "\n");
  res.json({ success: true });
});

app.get("/health", (_req, res) => res.json({ ok: true }));

const port = 5010;
app.listen(port, () => {
  console.log(`OneSignal mock listening on ${port}`);
});





