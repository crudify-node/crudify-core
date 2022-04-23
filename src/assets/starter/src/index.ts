import "module-alias/register";
import "source-map-support/register";
import app from "./app";
import config from "./config";

app.listen(config.PORT, () => {
  console.log(`Server started on http://localhost:${config.PORT}/`);
});
