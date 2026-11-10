import { app } from './app';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[FF Esports Platform Backend] Server running on port ${PORT}`);
  console.log(`API Base: http://localhost:${PORT}/api`);
});
