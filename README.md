[API Endpoints](https://github.com/Nithin-reddy-k/Redis-PostgreSQL-Latency-Comparison?tab=readme-ov-file#api-endpoints)

[Results](https://github.com/Nithin-reddy-k/Redis-PostgreSQL-Latency-Comparison?tab=readme-ov-file#expected-results)

---

# What is this?

- A simple benchmarking that compares data retrieval latency between Redis and PostgreSQL database.
- We use docker containers to run both PostgreSQL database and Redis store.
- We also expose REST API endpoints that insert data and measure fetch times from each.
- Measurement of latency is done in milliseconds and we also calculate speedup factor.

# Project Structure

├── docker-compose.yml

├── package.json

├── index.js

└── README.md

## Setup

1. Start PostgreSQL and Redis
    
    ```tsx
    docker compose up
    ```
    
2. Install dependencies
    
    ```tsx
    npm install
    ```
    
3. Start the app
    
    ```tsx
    npm start
    ```
    

# API Endpoints

1. **POST `/api/insert`** 
    
    This endpoint inserts a user into PostgreSQL database and stores a copy in Redis.
    
    ```json
    {
    	"name": "John",
    	"age": 18
    }
    ```
    
    Response - 
    
    ```json
    {
        "success": true,
        "message": "Data inserted sucessfuly",
        "data": {
            "id": 1,
            "name": "John",
            "age": 18,
            "created_at": "2025-12-05T10:01:34.082Z"
        }
    }
    ```
    
2. **GET `/api/insert/:id`**
    
    This endpoint compares single record fetching latency.
    
    Example request - 
    
    ```json
    http://localhost:3000/api/compare/1
    ```
    
    Response -
    
    ```json
    {
        "userId": "2",
        "postgres": {
            "data": {
                "id": 2,
                "name": "John dres",
                "age": 184,
                "created_at": "2025-12-05T10:01:34.082Z"
            },
            "latency_ms": "26.150",
            "found": true
        },
        "redis": {
            "data": {
                "id": 2,
                "name": "John dres",
                "age": 184,
                "created_at": "2025-12-05T10:01:34.082Z"
            },
            "latency_ms": "1.804",
            "found": true
        },
        "comparison": {
            "postgres_latency_ms": 26.15,
            "redis_latency_ms": 1.804,
            "difference_ms": "24.346",
            "redis_speedup_factor": "14.50x",
            "winner": "Redis"
        }
    }
    ```
    

# Expected Results

Typically, you should see:

- **Redis latency:** 0.1 - 1 ms (sub-millisecond for single key lookups)
- **PostgreSQL latency:** 1 - 10 ms (depends on query complexity and connection overhead)
- **Speed difference:** Redis is usually 5-20x faster for simple key-value lookups

# Observed Results

- Initial fetch for a `id` showed that PostgreSQL takes significantly more time than Redis for the same.
- Initial PostgreSQL latency: 15 - 20ms
- Initial Redis latency: 1 - 2ms
- When the same `id` (data) was fetched for more than once, PostgreSQL showed significant reduction in latency(comparable to Redis)
- Latency of PostgreSQL for consecutive fetches: ~5ms
- Latency of Redis for consecutive fetches: 1 - 2ms(low = 1.104ms)
