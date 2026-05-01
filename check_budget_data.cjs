const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://crrunbbgxodcfzdqfunq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNycnVuYmJneG9kY2Z6ZHFmdW5xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA4MDk5MiwiZXhwIjoyMDg2NjU2OTkyfQ.-JntGPL9Egl1BVnB60tegDwM91W2rbP4DmJ2tMdErIU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  const { data, error } = await supabase
    .from('leads')
    .select('name, budget_range')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('--- ALL BUDGET DATA ---');
  const uniqueRanges = [...new Set(data.map(l => l.budget_range))];
  console.log('Unique budget_range values:', uniqueRanges);
  
  data.forEach(l => {
    if (l.budget_range && (l.budget_range.includes('-') || !isNaN(l.budget_range))) {
        console.log(`Potential Inconsistent Lead: ${l.name} | budget_range: ${JSON.stringify(l.budget_range)}`);
    }
  });
  console.log('----------------------');
}

checkData();
