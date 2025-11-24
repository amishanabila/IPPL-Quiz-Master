// Test API endpoint to verify data flow
const BASE_URL = 'http://localhost:5000/api';

async function testAPI() {
  console.log('🧪 Testing API Endpoints\n');
  
  try {
    // Test 1: Get materi by ID
    console.log('1️⃣ Testing GET /api/soal/materi/1');
    const response = await fetch(`${BASE_URL}/soal/materi/1`);
    const data = await response.json();
    
    console.log('Status:', data.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.status === 'success' && data.data) {
      console.log('\n✅ API Response received');
      console.log('Kumpulan Soal ID:', data.data.kumpulan_soal_id);
      console.log('Soal count:', data.data.soal_list?.length || 0);
      
      if (data.data.soal_list && data.data.soal_list.length > 0) {
        console.log('\nFirst soal details:');
        const firstSoal = data.data.soal_list[0];
        console.log('- ID:', firstSoal.soal_id);
        console.log('- Pertanyaan:', firstSoal.pertanyaan);
        console.log('- Jawaban benar:', firstSoal.jawaban_benar);
        console.log('- Jawaban type:', typeof firstSoal.jawaban_benar);
        console.log('- Is array?:', Array.isArray(firstSoal.jawaban_benar));
        
        if (Array.isArray(firstSoal.jawaban_benar)) {
          console.log('- Array content:', firstSoal.jawaban_benar);
        }
      }
    } else {
      console.log('\n❌ No data received or error');
    }
    
  } catch (error) {
    console.error('❌ API test error:', error);
  }
}

testAPI();
