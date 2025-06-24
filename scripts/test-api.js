// Test script for checking our sample management API endpoints
const fetch = require('node-fetch');

async function testApiEndpoints() {
  try {
    console.log('Testing sample API endpoints...');
    
    // Get samples endpoint
    const samplesResponse = await fetch('http://localhost:3000/api/samples');
    console.log('Samples API status:', samplesResponse.status);
    
    if (samplesResponse.ok) {
      const samplesData = await samplesResponse.json();
      console.log('Sample count:', samplesData.length);
      
      if (samplesData.length > 0) {
        console.log('First sample:', {
          id: samplesData[0].id,
          title: samplesData[0].title,
          duration: samplesData[0].duration,
          hasTags: Array.isArray(samplesData[0].tags),
          tagCount: samplesData[0].tags?.length
        });
      }
    }
    
    console.log('\nTest completed!');
  } catch (error) {
    console.error('Error during API testing:', error);
  }
}

// Run the tests
testApiEndpoints(); 