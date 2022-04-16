import { Request, Response, Router } from "express";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.send("Hey there, this is the api route");
});

export default router;
