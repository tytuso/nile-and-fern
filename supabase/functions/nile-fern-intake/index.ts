import { createClient } from 'npm:@supabase/supabase-js@2.118.0';
import { validateEnquiry } from './domain.ts';
const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
const reply=(status:number,data:unknown)=>new Response(JSON.stringify(data),{status,headers:cors});
const text=(input:unknown)=>typeof input==='string'?input.trim():'';
const hash=async(input:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(input))),byte=>byte.toString(16).padStart(2,'0')).join('');
Deno.serve(async req=>{
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  if(req.method!=='POST')return reply(405,{error:'Use POST for travel enquiries.'});
  try{
    if(!req.headers.get('content-type')?.includes('application/json'))return reply(415,{error:'Send a JSON request.'});
    const reader=req.body?.getReader();if(!reader)return reply(400,{error:'A request body is required.'});
    const chunks:Uint8Array[]=[];let size=0;
    while(true){const next=await reader.read();if(next.done)break;size+=next.value.byteLength;if(size>32768){await reader.cancel();return reply(413,{error:'This request is too large.'});}chunks.push(next.value);}
    const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
    let input:Record<string,unknown>;try{input=JSON.parse(new TextDecoder().decode(bytes));}catch{return reply(400,{error:'The request could not be read.'});}
    if(!input||typeof input!=='object'||Array.isArray(input))return reply(400,{error:'Invalid request.'});
    const action=text(input.action);if(!['enquire','track'].includes(action))return reply(400,{error:'Unknown travel request.'});
    if(text(input.website))return reply(400,{error:'The request could not be accepted.'});
    const ip=req.headers.get('cf-connecting-ip')||req.headers.get('x-real-ip')||req.headers.get('x-forwarded-for')?.split(',').pop()?.trim()||'shared';
    const bucket=action+':'+await hash('nile-fern-v1:'+ip);
    const limit=await db.rpc('nft_consume_intake_limit',{p_bucket:bucket,p_limit:action==='track'?30:5,p_seconds:action==='track'?60:900});
    if(limit.error){console.error('Nile Fern intake limit unavailable',limit.error.code);return reply(503,{error:'The enquiry service is temporarily unavailable. Please try again.'});}
    if(!limit.data)return reply(429,{error:'Too many requests. Please wait a few minutes before trying again.'});
    if(action==='enquire'){
      const invalid=validateEnquiry(input);if(invalid)return reply(400,{error:invalid});
      const token=crypto.randomUUID().replaceAll('-','')+crypto.randomUUID().replaceAll('-','');
      const reference='NF-'+new Date().getUTCFullYear()+'-'+crypto.randomUUID().replaceAll('-','').slice(0,10).toUpperCase();
      const question=input.kind==='question';
      const record={reference,receipt_token_hash:await hash(token),kind:input.kind,journey:question?'custom':text(input.journey),destinations:question?[]:input.destinations,month:question||input.flexible?'':text(input.month),flexible:question?true:input.flexible,days:question?4:input.days,adults:question?2:input.adults,children:question?0:input.children,budget:question?'Still exploring':text(input.budget),comfort:question?'Help me choose':text(input.comfort),name:text(input.name),email:text(input.email).toLowerCase(),phone:text(input.phone),country:text(input.country),message:text(input.message),status:'New',is_demo:true};
      const result=await db.from('nft_enquiries').insert(record).select('reference,status,created_at').single();
      if(result.error){console.error('Nile Fern enquiry write failed',result.error.code);return reply(503,{error:'Your enquiry has not been saved. Please try again.'});}
      return reply(201,{...result.data,access_code:token});
    }
    const reference=text(input.reference),token=text(input.access_code);
    if(!/^NF-[0-9]{4}-[A-F0-9]{10}$/.test(reference)||!/^[a-f0-9]{64}$/.test(token))return reply(404,{error:'No enquiry matches that reference and private code.'});
    const result=await db.from('nft_enquiries').select('reference,status,journey,kind,public_summary,created_at,updated_at').eq('reference',reference).eq('receipt_token_hash',await hash(token)).maybeSingle();
    if(result.error)return reply(503,{error:'The enquiry status could not be checked. Please try again.'});
    if(!result.data)return reply(404,{error:'No enquiry matches that reference and private code.'});
    return reply(200,result.data);
  }catch(error){console.error('Nile Fern intake error',error instanceof Error?error.name:'Unknown');return reply(500,{error:'The request could not be completed. Please try again.'});}
});
