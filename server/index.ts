import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'HomeBrain AI Family Operating System',
    timestamp: new Date().toISOString()
  });
});

// AI RAG Endpoint
app.post('/api/ai/query', (req, res) => {
  const { query } = req.body;
  res.json({
    reply: `HomeBrain API Server processed query: "${query}". Database connection active.`,
    sources: ['PostgreSQL / SQLite Family Database', 'Document Indexer']
  });
});

app.listen(PORT, () => {
  console.log(`🧠 HomeBrain Server running on http://localhost:${PORT}`);
});
