import express from "express";
import { PORT } from "./config";
import { corsMiddleware, errorHandlerMiddleware } from "./middleware";
import { router } from "./routes";

const app = express();

app.use(express.json());
app.use(corsMiddleware);
app.use("/api", router);
app.use(errorHandlerMiddleware);

app.listen(PORT, () => {
  console.log(`geomine-backend-express listening on :${PORT}`);
});
