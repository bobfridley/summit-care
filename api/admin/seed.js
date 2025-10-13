import { withConn } from '../../lib/db.js';

function readBody(req){return new Promise(r=>{let d='';req.setEncoding('utf8');req.on('data',c=>d+=c);req.on('end',()=>r(d||'{}'));});}

export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','https://healthandhiking.com');
  res.setHeader('Access-Control-Allow-Methods','POST,GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization, x-admin-token');
  if (req.method==='OPTIONS') return res.status(204).end();

  const token = req.headers['x-admin-token'] || new URL(req.url,'http://x').searchParams.get('token') || null;
  if (!process.env.ADMIN_SEED_TOKEN || token !== process.env.ADMIN_SEED_TOKEN) {
    return res.status(401).json({ ok:false, error:'Unauthorized' });
  }

  try{
    const body = typeof req.body==='object' && req.body!==null ? req.body : JSON.parse(await readBody(req));
    const drug = String(body?.drug || 'PHENELZINE').toUpperCase();
    const doContra = body?.seedContraindications !== false;
    const doAe = body?.seedAeTrends !== false;
    const summary = { drug, inserted:{ contraindications:0, ae_trends:0 } };

    await withConn(async (conn)=>{
      if (doContra){
        const rows = [
          { contraindication:'MAOIs with SSRIs', level:'major', note:'Risk of serotonin syndrome' },
          { contraindication:'Tyramine-rich foods', level:'moderate', note:'Hypertensive crisis risk' },
          { contraindication:'Pseudoephredrine', level:'moderate', note:'May elevate blood pressure' },
        ];
        for (const r of rows){
          const [exists] = await conn.execute(
            `SELECT 1 FROM contraindications
             WHERE UPPER(drug)=UPPER(?) AND UPPER(contraindication)=UPPER(?) AND UPPER(level)=UPPER(?) LIMIT 1`,
            [drug, r.contraindication, r.level]
          );
          const has = Array.isArray(exists) ? exists.length>0 : !!exists;
          if (!has){
            await conn.execute(
              `INSERT INTO contraindications (drug, contraindication, level, note)
               VALUES (?,?,?,?)`, [drug, r.contraindication, r.level, r.note||null]
            );
            summary.inserted.contraindications++;
          }
        }
      }
      if (doAe){
        const today=new Date(); const day=(d)=>new Date(today.getTime()-d*24*3600*1000).toISOString().slice(0,10);
        const buckets=[{date:day(0),count:12},{date:day(1),count:9},{date:day(2),count:7},{date:day(3),count:10}];
        for (const b of buckets){
          await conn.execute(
            `INSERT INTO ae_trends_cache (drug,bucket_date,count_value)
             VALUES (?,?,?)
             ON DUPLICATE KEY UPDATE count_value=VALUES(count_value), updated_at=CURRENT_TIMESTAMP`,
            [drug, b.date, b.count]
          );
          summary.inserted.ae_trends++;
        }
      }
    });

    return res.status(200).json({ ok:true, ...summary });
  }catch(e){
    return res.status(500).json({ ok:false, error:e?.message || String(e) });
  }
}
