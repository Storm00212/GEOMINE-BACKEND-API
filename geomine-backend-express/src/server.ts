import express from "express";
import { PORT } from "./config";
import { corsMiddleware, errorHandlerMiddleware } from "./middleware";
import { router } from "./routes";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(corsMiddleware);
  app.use("/api", router);
  app.use(errorHandlerMiddleware);

  return app;
}

const app = createApp();

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`geomine-backend-express listening on :${PORT}`);
  });
}

export { app };
