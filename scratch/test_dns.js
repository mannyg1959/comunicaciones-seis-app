import dns from 'dns';

const hosts = [
  'db.lztxuvtmsqpovfkdoipt.supabase.co',
  'aws-0-us-east-1.pooler.supabase.com',
  'aws-0-us-east-2.pooler.supabase.com',
  'aws-0-us-west-1.pooler.supabase.com',
  'aws-0-us-west-2.pooler.supabase.com',
  'aws-0-sa-east-1.pooler.supabase.com'
];

function checkDns(host) {
  return new Promise((resolve) => {
    dns.lookup(host, (err, address, family) => {
      if (err) {
        console.log(`${host}: FAILED - ${err.code}`);
        resolve(null);
      } else {
        console.log(`${host}: SUCCESS - ${address}`);
        resolve(address);
      }
    });
  });
}

async function main() {
  for (const host of hosts) {
    await checkDns(host);
  }
}

main();
