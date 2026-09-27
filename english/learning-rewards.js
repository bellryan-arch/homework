/* Bell Pass v1
 * A tiny, account-free handoff between Bell's learning tools and Chore Quest.
 * Pending passes are stored in a short-lived parent-domain cookie and may also
 * travel in a Chore Quest link. Chore Quest must deduplicate IDs on import.
 */
(function(root){
  "use strict";
  const COOKIE = "bells_pending_rewards";
  const VERSION = 1;
  const MAX_PENDING = 6;
  const MAX_AGE_MS = 48 * 60 * 60 * 1000;
  const FAMILY_COOKIE = "bells_family_names_v1";

  function familyNames(){
    try{
      const row = document.cookie.split("; ").find(part => part.startsWith(FAMILY_COOKIE + "="));
      if (!row) return [];
      const value = JSON.parse(decodeURIComponent(row.slice(FAMILY_COOKIE.length + 1)));
      return Array.isArray(value) ? value.slice(0,4).map(name => String(name).trim().slice(0,40)) : [];
    }catch(_error){ return []; }
  }

  function randomId(){
    if (root.crypto && root.crypto.getRandomValues){
      const bytes = new Uint32Array(2);
      root.crypto.getRandomValues(bytes);
      return Array.from(bytes, n => n.toString(16)).join("");
    }
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  function toBase64Url(value){
    const bytes = new TextEncoder().encode(JSON.stringify(value));
    let binary = "";
    bytes.forEach(byte => { binary += String.fromCharCode(byte); });
    return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");
  }

  function fromBase64Url(value){
    const padded = String(value).replace(/-/g,"+").replace(/_/g,"/").padEnd(Math.ceil(value.length/4)*4,"=");
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  }

  function readCookie(){
    const row = document.cookie.split("; ").find(part => part.startsWith(COOKIE + "="));
    if (!row) return [];
    try{
      const items = fromBase64Url(row.slice(COOKIE.length + 1));
      return Array.isArray(items) ? items.filter(isValid) : [];
    }catch(_error){ return []; }
  }

  function writeCookie(items){
    const secure = location.protocol === "https:" ? "; Secure" : "";
    const domain = location.hostname.endsWith("bellstuff.net") ? "; Domain=.bellstuff.net" : "";
    document.cookie = `${COOKIE}=${toBase64Url(items)}; Max-Age=${MAX_AGE_MS/1000}; Path=/; SameSite=Lax${secure}${domain}`;
  }

  function isValid(pass){
    const now = Date.now();
    return Boolean(pass && pass.v === VERSION && typeof pass.id === "string" &&
      ["bells-math","bells-english"].includes(pass.source) && pass.kind === "learning_session" &&
      Number.isInteger(pass.child) && pass.child >= 0 && pass.child <= 3 &&
      Number.isFinite(pass.xp) && pass.xp >= 5 && pass.xp <= 35 &&
      Number.isFinite(pass.issuedAt) && now - pass.issuedAt < MAX_AGE_MS && pass.issuedAt <= now + 60000);
  }

  function create(details){
    const accuracy = Math.max(0, Math.min(100, Math.round(Number(details.initialAccuracy) || 0)));
    const itemCount = Math.max(1, Math.min(20, Math.round(Number(details.itemCount) || 1)));
    const correctionBonus = details.correctedAll ? 5 : 0;
    const xp = Math.min(35, 10 + Math.min(10,itemCount) + Math.round(accuracy/10) + correctionBonus);
    return {
      v: VERSION,
      id: randomId(),
      source: details.source,
      kind: "learning_session",
      activity: String(details.activity || "practice").slice(0,32),
      grade: String(details.grade || "").slice(0,8),
      child: Math.max(0,Math.min(3,Number(details.child)||0)),
      itemCount,
      initialAccuracy: accuracy,
      correctedAll: Boolean(details.correctedAll),
      xp,
      stars: accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : 1,
      issuedAt: Date.now(),
      expiresAt: Date.now() + MAX_AGE_MS
    };
  }

  function publish(pass){
    if (!isValid(pass) || !pass.correctedAll) throw new Error("A valid, fully corrected Bell Pass is required.");
    const pending = readCookie().filter(item => item.id !== pass.id && item.expiresAt > Date.now());
    pending.push(pass);
    writeCookie(pending.slice(-MAX_PENDING));
    return pass;
  }

  function claimUrl(pass){
    if (!isValid(pass)) throw new Error("Invalid Bell Pass.");
    return `https://chores.bellstuff.net/?bellReward=${encodeURIComponent(toBase64Url(pass))}`;
  }

  root.BellLearningRewards = {VERSION, create, publish, claimUrl, isValid, decode:fromBase64Url, encode:toBase64Url, familyNames};
})(window);
