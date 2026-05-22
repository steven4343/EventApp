const TOKEN = process.env.RAILWAY_TOKEN || '';

async function graphql(query, variables = {}) {
    const resp = await fetch('https://backboard.railway.com/graphql/v2', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + TOKEN,
      'Railway-Token': TOKEN,
      'X-Api-Key': TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, variables })
  });
  return resp.json();
}

async function main() {
  // Get user info and projects
  const me = await graphql(`query { me { name email projects { edges { node { id name } } } } }`);
  console.log('User info:', JSON.stringify(me, null, 2));
}

main().catch(console.error);
