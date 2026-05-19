# C-Flux- The Adapative Intelligence Engine  (In Progress)

C-Flux is a decoupled, event-driven Adaptive Intelligence Engine engineered to handle high-concurrency, real-time document analysis without blocking the primary application thread. Built as a distributed alternative to monolithic backends, C-Flux separates stateless HTTP operations from a stateful WebSocket streaming layer. By offloading heavy document ingestion, 3072-dimensional vector embedding generation, and LLM processing to an independent background worker via a Redis message queue, the system ensures zero-latency API responsiveness and reliable, horizontally scaled AI chunk streaming.

---

## 🏗️ System Architecture & Data Flow

C-Flux is explicitly engineered as three distinct, decoupled processes to ensure horizontal scalability:

1. **Primary Backend (Express REST API):** Handles stateless HTTP operations (authentication, chat retrieval, pagination logic) and pushes heavy, slow tasks (like file parsing and message generation) into a **Redis Queue**.
2. **Asynchronous Worker:** A dedicated background process that continuously pops jobs from the Redis queue (`brPop`), pulls document streams, segments text into overlapping chunks, generates high-dimensional embeddings, and handles contextual prompts.
3. **Stateful WebSocket Server:** Attached cleanly to the primary server instance via Dependency Injection. It subscribes globally to a **Redis Pub/Sub** channel using a dedicated duplicate subscriber client to catch streaming response chunks from the worker and route them instantly to the correct active client connection.

### The Pipeline Blueprint

```text
[Client React App]
│
├─── (HTTP POST / Message) ───► [Express REST API] ───► [Pushes to Redis Queue]
│                                                               │
│                                                               │ (brPop)
▼                                                               ▼
[Receives Chunks] ◄─── (WS) ─── [WS Server] ◄── (Pub/Sub) ─── [Asynchronous Worker]
                                                                │
                                                                │ (Gemini RAG Pipeline)
                                                                ▼
                                                          [Pinecone DB]
```

---

## 🛠️ Tech Stack

*   **Runtime & Framework:** Node.js, Express, TypeScript
*   **Real-Time Layer:** Native WebSockets (`ws`)
*   **Message Broker & Queue:** Redis (In-Memory Data Structures)
*   **Vector DB & Search:** Pinecone (3072-dimensional embedding storage)
*   **AI Engine:** Google Gemini AI (`gemini-2.5-flash`, `gemini-embedding-001`)
*   **Database:** MongoDB & Mongoose (for persistent, paginated chat and user history)

---

## ✨ Core Features & Guardrails Implemented

*   **Decoupled Job Queueing:** Ingestion and AI workloads are isolated from the main thread, keeping the client-facing API completely non-blocking and ultra-responsive.
*   **Production-Grade RAG Pipeline:** Context is pulled using cosine similarity from Pinecone space, combined with double-newline delimiters, and injected directly into a highly restrictive system persona prompt template.
*   **Anti-Hallucination Guardrails:** The LLM is locked into a strict "open-book exam" mode. If the retrieved context doesn't contain the answer, it fails gracefully with a standard fallback string rather than generating fake information.
*   **Asynchronous Chunk Streaming:** AI responses are streamed back to the user chunk-by-chunk using Redis Pub/Sub to bypass HTTP buffering overhead and simulate an immediate typing effect on the frontend.
*   **Dedicated Subscriber Cloning:** Fixed application socket collisions by duplicating the main Redis client instance for Pub/Sub operations, preventing connection locking errors during API queue operations.

---

## 💻 Local Development Setup

Follow these steps to spin up the entire C-Flux system on your local machine.

### Prerequisites

*   Node.js (v18+ recommended)
*   TypeScript installed globally (`npm install -g typescript`)
*   A running Redis Server instance
*   A running MongoDB instance

### 1. Clone the Repository

```bash
git clone https://github.com/Chetanwadhwa03/C-Flux---The-Adaptive-Intelligence-engine.git
cd C-Flux---The-Adaptive-Intelligence-engine
```

### 2. Configure Environment Variables

Create a `.env` file inside your backend directory:

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
REDIS_URL=redis://127.0.0.1:6379 or Cloud Upstash URL
PINECONE_API_KEY=your_pinecone_api_key
GEMINI_API_KEY=your_google_gemini_api_key
```

### 3. Install Dependencies & Build

```bash
npm install
npm run build
```

### 4. Running the Distributed System

Because the system is fully decoupled, you must boot up the API/WebSocket server and the background worker as separate processes in individual terminal windows.

#### Terminal 1: Start the Primary HTTP Server & WebSocket Engine

```bash
npm run dev
# Boots server.ts, initializes Express, and attaches the WebSocket Server to port 3000
```

#### Terminal 2: Start the Background Worker Queue Listener

```bash
npm run worker
# Establishes an independent connection to Redis and enters a continuous brPop loop
```

---

## 🚧 Roadmap & Technical Debt Mitigation

*   **TCP Half-Open Connection Cleanup:** Moving from standard timeouts to a global, centralized heartbeat (`setInterval` sweep) checking an `isAlive` flag state machine to forcefully terminate zombie pipes.
*   **Multi-Device Routing Scale:** Upgrading the routing map from a single socket reference to `Map<string, Set<WebSocket>>` to support multi-device session concurrency seamlessly.
