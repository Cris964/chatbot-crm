import dotenv from 'dotenv';
dotenv.config({ path: '.env.vercel.local' });
import { createClient } from '@supabase/supabase-js';

async function run() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    // Trazzos
    const tokenTrazzos = 'EAAcDxCANIDoBRhduZCpo8bzVzZBRUdpe8hA77J2RRgXnCSxteghrjFSBvAFWsZBbrKqxGdWd00dNfYluUeRS7xS0Ouwo9OsfN3ghLZCQJj4NdtB0Y0HZAPcISyHrPfMTjkB1oYYP2xWVPRSDdNdRyIA3nbfYZC7hXkV3yDxwmXnX6kZBiGFibHf64iH9WORHTBeiQZDZD';
    await supabase.from('clients').update({ whatsapp_token: tokenTrazzos }).ilike('name', '%Trazzos%');
    
    // Vitaplena
    const tokenVitaplena = 'EAAbnQCKABMUBRubDMfGMTNT1XBNR3aPzrsnLB2z3MFBHnr6aLnOZC6jiaTCLcSpZANG1IgPKwbmZAu4fSVIWOVstQYV69aD0BUUufqhK0JLCy2OKquQ6Wd1oiQ18bCZBWKtZB7sf1HYYnL4l2kOEIy9va7OjpQvqgZClvka3WuPZB7i0vvg0Bjna2ox13eAZCfatLgZDZD';
    await supabase.from('clients').update({ whatsapp_token: tokenVitaplena }).ilike('name', '%Vitaplena%');
    
    // Samaritana
    const tokenSamaritana = 'EAAWr0cfZBOz8BRpvLxsJiYaTHIpkBZAR2WZCAoaZA8NGgYZC4I7sqxpsQ98JZByQZANHtjVyF8KFEHPZCw5loWUk7N8of2ztoMivb0VKNUbfMsEaIKwKlgF207dWEZCVz4d5e9pqYkOdfTiSxjRqy47LXA7Q6BPzZBNGPuzDxLcZCdpkujuYTLlvTwHrJGsc4m8oPH5QwZDZD';
    await supabase.from('clients').update({ whatsapp_token: tokenSamaritana }).ilike('name', '%Samaritana%');
    
    console.log("Tokens updated in the database!");
}
run();
