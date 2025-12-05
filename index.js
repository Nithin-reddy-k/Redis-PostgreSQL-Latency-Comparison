const express = require("express");
const { Pool } = require("pg");
const redis = require("redis");


const app = express();
app.use(express.json());


const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://testuser:testpass@localhost:5433/testdb"
});


const redisClient = redis.createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379"
});


async function initialize() {
    try {
        
        await redisClient.connect();
        console.log("Connected to Redis");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100),
                age INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )    
        `);
        console.log("PostgreSQL table ready");
    } catch (error) {
        console.error("Initialization error:", error);
        process.exit(1);
    }
}



app.post("/api/insert", async (req, res) => {


    try {
        const { name, age } = req.body;

        const result = await pool.query(`
            INSERT INTO users (name, age) VALUES ($1, $2) RETURNING *`, [name, age]
        );

        const user = result.rows[0];

        await redisClient.set(
            `user:${user.id}`,
            JSON.stringify(user),
            { EX : 3600 }
        );

        res.json({
            success: true,
            message: "Data inserted sucessfuly",
            data: user
        });


    } catch (error) {
        console.error("Insert error: ", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});




app.get("/api/compare/:id", async (req, res) => {
    
    console.log("inside")

    try {
        const { id } = req.params;
        const results = {
            userId: id,
            postgres: {},
            redis: {},
            comparison: {}
        };

        const pgStart = performance.now();
        const pgResult = await pool.query(`SELECT * FROM users WHERE id = $1`, [id]);
        const pgEnd = performance.now();


        results.postgres = {
            data: pgResult.rows[0] || null,
            latency_ms: (pgEnd - pgStart).toFixed(3),
            found: pgResult.rows.length > 0
        };


        const redisStart = performance.now();
        const redisData = await redisClient.get(`user:${id}`);
        const redisEnd = performance.now();

        
        results.redis = {
            data: redisData ? JSON.parse(redisData) : null,
            latency_ms: (redisEnd - redisStart).toFixed(3),
            found: redisData !== null
        };


        const pgLatency = parseFloat(results.postgres.latency_ms);
        const redisLatency = parseFloat(results.redis.latency_ms);
        const speedup = (pgLatency/redisLatency).toFixed(2);
        const difference = (pgLatency - redisLatency).toFixed(3);

        results.comparison = {
            postgres_latency_ms: pgLatency,
            redis_latency_ms: redisLatency,
            difference_ms: difference,
            redis_speedup_factor: speedup + "x",
            winner: pgLatency < redisLatency ? "PostgreSQL" : "Redis"
        };

        res.json(results);

    } catch (error) {
        console.error("Comparison error: ", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});









const PORT = process.env.PORT || 3000;


initialize().then(() => {
    app.listen(PORT, () => {
        console.log(`Server runnign on port - ${PORT}`);
    });
});



process.on('SIGTERM', async () => {
    console.log("SIGTERM received, closing connections...");
    await redisClient.quit();
    await pool.end();
    process.exit(0);
});