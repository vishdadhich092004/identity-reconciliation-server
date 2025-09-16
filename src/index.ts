import express from "express";
import dotenv from "dotenv";
import prisma from "./db/prisma.client";
import identifyRoutes from "./routes/identify.routes";
dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

prisma.$connect().then(() => {
    console.log("Connected to database");
}).catch((err) => {
    console.log("Error connecting to database", err);
});

app.get("/", (req, res) => {
    res.send("Hola from identity reconciliation service backend :)");
});

app.use("/api/v1/identify", identifyRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);

});
