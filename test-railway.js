const TOKEN = '2bfdf4af-c2b2-44e8-83f9-19d37c081ef7';
const endpoints = [
  'https://backboard.railway.com/graphql/v2',
  'https://backboard.railway.app/graphql/v2',
  'https://api.railway.app/graphql/v2'
];

async function test() {
  for (const url of endpoints) {
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: 'query { me { name email } }'
        })
      });
      const text = await resp.text();
      console.log(`URL: ${url}`);
      console.log(`Status: ${resp.status}`);
      console.log(`Response: ${text.substring(0, 300)}`);
      console.log('---');
    } catch (e) {
      console.log(`URL: ${url}`);
      console.log(`Error: ${e.message}`);
      console.log('---');
    }
  }
}
test();
