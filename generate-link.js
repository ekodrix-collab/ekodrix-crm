const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://crrunbbgxodcfzdqfunq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNycnVuYmJneG9kY2Z6ZHFmdW5xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA4MDk5MiwiZXhwIjoyMDg2NjU2OTkyfQ.-JntGPL9Egl1BVnB60tegDwM91W2rbP4DmJ2tMdErIU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function generateLink() {
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email: 'ekodrix@gmail.com',
    options: {
      redirectTo: 'http://localhost:3001/set-password', // Using localhost so you can test locally right now!
    }
  });

  if (error) {
    console.error('Error generating link:', error);
  } else {
    console.log('\n✅ Successfully generated the reset link!');
    console.log('\nCopy and paste this link into your browser to test your password reset UI:');
    console.log('--------------------------------------------------');
    console.log(data.properties.action_link);
    console.log('--------------------------------------------------\n');
  }
}

generateLink();
