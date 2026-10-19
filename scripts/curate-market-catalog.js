"use strict";
const {z}=require("zod");
function options(args){
  const unknown=args.filter(arg=>arg!=="--apply"&&!arg.startsWith("--limit=")&&!arg.startsWith("--restore-batch="));
  if(unknown.length)throw Error("Opção desconhecida: "+unknown.join(", "));
  return z.object({apply:z.boolean(),limit:z.coerce.number().int().min(1).max(10),restore:z.string().uuid().optional()}).parse({
    apply:args.includes("--apply"),limit:args.find(a=>a.startsWith("--limit="))?.split("=")[1]??3,
    restore:args.find(a=>a.startsWith("--restore-batch="))?.split("=")[1]
  });
}
async function run(args=process.argv.slice(2)){
  const opts=options(args),{getPool,provider}=require("../server/database");
  if(provider!=="postgresql")throw Error("Curadoria global exige PostgreSQL; o banco local não será alterado.");
  const pool=getPool();let client;
  try{
    client=await pool.connect();
    if(!opts.restore){
      const result=await client.query("SELECT zuz_market_curate_catalog($1,$2) AS summary",[opts.limit,!opts.apply]);
      console.log(JSON.stringify(result.rows[0].summary,null,2));return;
    }
    const found=await client.query("SELECT COUNT(*)::int AS records FROM zuz_market_catalog_archive WHERE batch_id=$1",[opts.restore]);
    if(!opts.apply){console.log(JSON.stringify({dryRun:true,batchId:opts.restore,restore:found.rows[0].records}));return;}
    await client.query("BEGIN");
    try{
      await client.query("SET LOCAL zuz.catalog_restore='on'");
      const restored=await client.query("INSERT INTO zuz_market_catalog SELECT (jsonb_populate_record(NULL::zuz_market_catalog,row_data)).* FROM zuz_market_catalog_archive WHERE batch_id=$1 ON CONFLICT DO NOTHING RETURNING id",[opts.restore]);
      if(restored.rowCount!==found.rows[0].records)throw Error("Conflito de restauração; nenhuma alteração aplicada.");
      await client.query("DELETE FROM zuz_market_catalog_archive WHERE batch_id=$1",[opts.restore]);
      await client.query("COMMIT");
      console.log(JSON.stringify({restored:restored.rowCount,batchId:opts.restore}));
    }catch(error){await client.query("ROLLBACK");throw error;}
  }finally{client?.release();await pool.end();}
}
if(require.main===module)run().catch(error=>{console.error(error.message);process.exitCode=1;});
module.exports={options};
