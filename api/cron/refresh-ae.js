import { withConn, query } from '../../lib/db.js';

function uniq(a){return [...new Set(a.map(s=>s.trim().toUpperCase()).filter(Boolean))];}

export default async function handler(req,res){
  const token=req.headers['x-cron-token'];
  if (process.env.CRON_TOKEN && token!==process.env.CRON_TOKEN) {
    return res.status(401).json({ ok:false, error:'Unauthorized' });
  }
  try{
    const list = uniq((process.env.DRUGS_TO_REFRESH || 'PHENELZINE').split(','));
    const results = [];
    for (const drug of list){
      const url = new URL('https://api.fda.gov/drug/event.json');
      url.searchParams.set('search', `patient.drug.medicinalproduct:${drug}`);
      url.searchParams.set('count', 'receivedate');
      url.searchParams.set('limit', '14');
      const r = await fetch(url.toString(), { headers:{ Accept:'application/json' }});
      if (!r.ok){ results.push({ drug, ok:false, error:`openFDA ${r.status}` }); continue; }
      const json = await r.json();
      const buckets = (json.results||[]).map(b=>{
        const t=String(b.time);
        const date = t.includes('-') ? t.slice(0,10) : `${t.slice(0,4)}-${t.slice(4,6)}-${t.slice(6,8)}`;
        return { date, count:Number(b.count||0) };
      });

      await withConn(async (conn)=>{
        await conn.beginTransaction();
        try{
          for (const b of buckets){
            await conn.execute(
              `INSERT INTO ae_trends_cache (drug,bucket_date,count_value)
               VALUES (?,?,?)
               ON DUPLICATE KEY UPDATE count_value=VALUES(count_value), updated_at=CURRENT_TIMESTAMP`,
              [drug, b.date, b.count]
            );
          }
          await conn.commit();
        }catch(e){ await conn.rollback(); throw e; }
      });

      const latest = await query(
        `SELECT bucket_date, count_value AS count
         FROM ae_trends_cache
         WHERE UPPER(drug)=UPPER(?)
         ORDER BY bucket_date DESC
         LIMIT 5`, [drug]
      );

      results.push({ drug, ok:true, updated:buckets.length, preview:latest });
    }
    return res.status(200).json({ ok:true, results });
  }catch(e){
    return res.status(500).json({ ok:false, error:e?.message || String(e) });
  }
}
