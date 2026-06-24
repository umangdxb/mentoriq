import { Router } from "express";
import { SEEDS } from "../data/seeds.js";

export const seedsRouter = Router();

seedsRouter.get("/seeds", (_req, res) => {
  res.json({ seeds: SEEDS });
});
