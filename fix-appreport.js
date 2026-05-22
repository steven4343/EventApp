const TOKEN = process.env.GITHUB_TOKEN || '';

async function main() {
  const resp = await fetch('https://api.github.com/repos/steven4343/EventApp/contents/backend/database.ts', {
    headers: { 'Authorization': 'Bearer ' + TOKEN, 'Accept': 'application/vnd.github.v3.raw' }
  });
  let content = await resp.text();

  content = content.replace(
    "import { User, Event, Club, Ticket, SavedEvent, UserClub, UserReview, AppNotification, Payment } from './types';",
    "import { User, Event, Club, Ticket, SavedEvent, UserClub, UserReview, AppNotification, Payment, AppReport } from './types';"
  );

  const base64 = Buffer.from(content, 'utf-8').toString('base64');

  const shaResp = await fetch('https://api.github.com/repos/steven4343/EventApp/contents/backend/database.ts', {
    headers: { 'Authorization': 'Bearer ' + TOKEN }
  });
  const shaData = await shaResp.json();

  const updateResp = await fetch('https://api.github.com/repos/steven4343/EventApp/contents/backend/database.ts', {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer ' + TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: 'Fix missing AppReport import in database.ts',
      content: base64,
      sha: shaData.sha
    })
  });
  const result = await updateResp.json();
  console.log('Status:', updateResp.status);
  if (updateResp.ok) console.log('Fixed!');
  else console.log('Error:', result.message);
}
main().catch(console.error);
