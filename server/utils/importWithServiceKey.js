process.env.SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4ZGd2eWpiY2lxemZ6d3hqcWp0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDU1NjgxOCwiZXhwIjoyMDk2MTMyODE4fQ.aF1lp-zXIrAB5txsRE3b0l3jQksK7HvidR5lV8HXdXM";

console.log('🔑 Overriding Supabase key with Service Role Key...');
await import('./importData.js');
