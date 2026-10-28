export const destinationIds=['bwindi','murchison','queen-elizabeth','kibale','jinja','bunyonyi'] as const;
export const journeyIds=['forest-and-lake','wild-heart','along-the-nile','jinja-unhurried','primate-paths','lakeside-pause'] as const;
export const budgets=['Still exploring','Under US$1,500','US$1,500–3,000','US$3,000–5,000','US$5,000+'] as const;
export const comfortLevels=['Comfortable','Boutique','Luxury','Help me choose'] as const;
export const enquiryStatuses=['New','In planning','Proposal ready','Closed'] as const;
export type EnquiryInput={kind:'trip'|'question';journey:string;destinations:string[];month:string;flexible:boolean;days:number;adults:number;children:number;budget:string;comfort:string;name:string;email:string;phone:string;country:string;message:string;consent:boolean;website:string};
const value=(v:unknown)=>typeof v==='string'?v.trim():'';
export function validateEnquiry(input:Record<string,unknown>,now=new Date()):string {
  if(!['trip','question'].includes(value(input.kind)))return 'Choose a trip enquiry or general question.';
  if(value(input.website))return 'This request could not be accepted.';
  if(value(input.name).length<2||value(input.name).length>100)return 'Enter a name between 2 and 100 characters.';
  if(value(input.email).length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value(input.email)))return 'Enter a valid email address.';
  if(value(input.phone).length>30||(value(input.phone)&&!/^\+?[\d\s().-]{7,30}$/.test(value(input.phone))))return 'Enter a valid phone number, or leave it blank.';
  if(value(input.country).length>80)return 'Keep the country or region under 80 characters.';
  if(value(input.message).length>2000)return 'Keep your message under 2,000 characters.';
  if(input.consent!==true)return 'Please confirm that you understand this is a demo enquiry.';
  if(input.kind==='question')return value(input.message).length<10?'Please add a question of at least 10 characters.':'';
  if(value(input.journey)!=='custom'&&!journeyIds.includes(value(input.journey) as typeof journeyIds[number]))return 'Choose a journey or a custom trip.';
  if(!Array.isArray(input.destinations)||input.destinations.length<1||input.destinations.length>6||new Set(input.destinations).size!==input.destinations.length||!input.destinations.every(id=>destinationIds.includes(id as typeof destinationIds[number])))return 'Choose at least one destination from the list.';
  if(typeof input.flexible!=='boolean')return 'Tell us whether your travel dates are flexible.';
  if(!input.flexible){const month=value(input.month);const current=now.toISOString().slice(0,7);if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)||month<current||Number(month.slice(0,4))>now.getUTCFullYear()+3)return 'Choose a travel month from now through the next three years, or select flexible dates.';}
  if(!Number.isInteger(input.days)||Number(input.days)<2||Number(input.days)>21)return 'Choose a trip length between 2 and 21 days.';
  if(!Number.isInteger(input.adults)||Number(input.adults)<1||Number(input.adults)>16)return 'Choose between 1 and 16 adults.';
  if(!Number.isInteger(input.children)||Number(input.children)<0||Number(input.children)>8)return 'Choose between 0 and 8 children.';
  if(!budgets.includes(value(input.budget) as typeof budgets[number]))return 'Choose a budget range or select Still exploring.';
  if(!comfortLevels.includes(value(input.comfort) as typeof comfortLevels[number]))return 'Choose a stay style or select Help me choose.';
  return '';
}
export function csvCell(input:unknown) {let text=String(input??'');if(/^[\s]*[=+@\-\t\r]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';}
export function resourceId(){const secure=globalThis.crypto as Crypto&{randomUUID?:()=>string};if(typeof secure?.randomUUID==='function')return secure.randomUUID();const bytes=new Uint8Array(16);crypto.getRandomValues(bytes);return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');}
