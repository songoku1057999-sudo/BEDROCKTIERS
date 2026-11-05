const API = (window.BEDROCKTIERS_API || "").replace(/\/$/, "");
const TIERS = ["HT1","LT1","HT2","LT2","HT3","LT3","HT4","LT4","HT5","LT5"];
const MODES = ["Crystal","Sword","Axe","UHC","Pot","SMP","Netherite","Bow"];
const SKIN_PRESETS = ["Steve","Alex","Notch","jeb_","Dinnerbone","Technoblade","Dream","CaptainSparklez","Stampy","Grian","MumboJumbo","TommyInnit"];
const MODE_ICONS = {Crystal:"◇",Sword:"⚔",Axe:"♜",UHC:"♥",Pot:"◉",SMP:"▦",Netherite:"⬟",Bow:"➶"};
let players = [], adminToken = sessionStorage.getItem("bt_admin_token") || "", currentPage = "home";
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const avatar = name => `https://mc-heads.net/avatar/${encodeURIComponent(name || "Steve")}/64`;
const skin = name => `https://mc-heads.net/body/${encodeURIComponent(name || "Steve")}/180`;
const tierClass = t => `tier-${String(t||"LT5").replace(/[^A-Z0-9]/g,"")}`;
const fmt = n => Number(n||0).toLocaleString();
function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2600)}
async function request(path, options={}) {
  if(!API || API.includes("YOUR-WORKER")) throw new Error("Set your Cloudflare Worker URL in config.js first.");
  const headers={"Content-Type":"application/json",...(options.headers||{})};
  if(options.admin && adminToken) headers.Authorization=`Bearer ${adminToken}`;
  const res=await fetch(API+path,{...options,headers});
  let data={};try{data=await res.json()}catch{}
  if(!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}
async function loadPlayers(){
  try{const data=await request("/api/players");players=data.players||[];renderAll();return true}
  catch(e){console.error(e);$("homeTop").innerHTML=`<div class="empty">${esc(e.message)}<br><br>Configure your Worker URL in config.js and deploy the Worker.</div>`;$("rankTable").innerHTML="";return false}
}
const sorted=()=>[...players].sort((a,b)=>b.points-a.points || a.name.localeCompare(b.name));
function playerRow(p,i){return `<tr data-player="${esc(p.id)}"><td><span class="rank-num ${i===0?"gold":""}">#${i+1}</span></td><td><div class="player-cell"><img src="${avatar(p.skin||p.name)}" onerror="this.src='${avatar("Steve")}'"><div><b>${esc(p.name)}</b><small>Bedrock player</small></div></div></td><td><span class="tier-badge ${tierClass(p.tier)}">${esc(p.tier)}</span></td><td><span class="mode-chip">${esc(p.mode)}</span></td><td class="points">${fmt(p.points)}</td><td>${fmt(p.wins)}W / ${fmt(p.losses)}L</td></tr>`}
function tableHTML(list){if(!list.length)return `<div class="empty">No players found.</div>`;return `<table class="data-table"><thead><tr><th>RANK</th><th>PLAYER</th><th>TIER</th><th>MODE</th><th>POINTS</th><th>W / L</th></tr></thead><tbody>${list.map((p,i)=>playerRow(p,i)).join("")}</tbody></table>`}
function renderStats(){const s=sorted();$("totalPlayers").textContent=fmt(players.length);$("ht1Count").textContent=players.filter(p=>p.tier==="HT1").length;$("topScore").textContent=s.length?fmt(s[0].points):"0"}
function fillSelect(id,items,first){$(id).innerHTML=(first?`<option value="">${first}</option>`:"")+items.map(x=>`<option value="${x}">${x}</option>`).join("")}
function renderFilters(){["rankTier","playerTier"].forEach(id=>fillSelect(id,TIERS,id==="rankTier"?"All tiers":"Every tier"));["rankMode","playerMode"].forEach(id=>fillSelect(id,MODES,id==="rankMode"?"All modes":"Every mode"));fillSelect("pTier",TIERS);fillSelect("pMode",MODES)}
function renderHome(){const s=sorted();$("homeTop").innerHTML=tableHTML(s.slice(0,10));$("recentPlayers").innerHTML=[...players].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,3).map(p=>`<div class="recent-card" data-open="${esc(p.id)}"><img src="${avatar(p.skin||p.name)}"><div><b>${esc(p.name)}</b><small>Joined ${new Date(p.createdAt).toLocaleDateString()}</small></div><span class="tier-badge ${tierClass(p.tier)}">${esc(p.tier)}</span></div>`).join("")||`<div class="empty">No players yet.</div>`}
function renderRankings(){const q=$("rankSearch").value.toLowerCase(),tier=$("rankTier").value,mode=$("rankMode").value;const list=sorted().filter(p=>(!q||p.name.toLowerCase().includes(q))&&(!tier||p.tier===tier)&&(!mode||p.mode===mode));$("rankCount").textContent=`${list.length} players`; $("rankTable").innerHTML=tableHTML(list)}
function renderPlayers(){const q=$("playerSearch").value.toLowerCase(),tier=$("playerTier").value,mode=$("playerMode").value;const list=sorted().filter(p=>(!q||p.name.toLowerCase().includes(q))&&(!tier||p.tier===tier)&&(!mode||p.mode===mode));$("playerGrid").innerHTML=list.map(p=>`<div class="player-card" data-open="${esc(p.id)}"><img src="${avatar(p.skin||p.name)}"><div class="player-card-main"><b>${esc(p.name)}</b><small>#${sorted().findIndex(x=>x.id===p.id)+1} · ${fmt(p.points)} points</small><span class="tier-badge ${tierClass(p.tier)}">${esc(p.tier)}</span></div></div>`).join("")||`<div class="empty">No players match your filters.</div>`}
function renderTiers(){const descriptions=["The absolute elite of the community.","Exceptional competitive players.","Highly skilled competitors.","Experienced PvP players.","Developing players building consistency."];$("tierGrid").innerHTML=TIERS.map((t,i)=>`<div class="tier-card"><span class="tier-badge ${tierClass(t)}">${t}</span><h3>${i%2===0?"High Tier":"Low Tier"} ${5-Math.floor(i/2)}</h3><p>${descriptions[Math.floor(i/2)]}</p><strong>${players.filter(p=>p.tier===t).length}</strong><small style="color:var(--muted);font-size:9px">Players in tier</small></div>`).join("")}
function renderModes(){$("modeGrid").innerHTML=MODES.map(m=>`<div class="mode-card"><div class="mode-icon">${MODE_ICONS[m]}</div><h3>${m}</h3><p>${players.filter(p=>p.mode===m).length} ranked players</p></div>`).join("")}
function renderAll(){renderStats();renderHome();renderRankings();renderPlayers();renderTiers();renderModes();if(adminToken&&$("adminModal").classList.contains("open"))renderAdmin()}
function showPage(page){currentPage=page;document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));const el=$("page-"+page);if(el)el.classList.add("active");document.querySelectorAll(".nav-link").forEach(x=>x.classList.toggle("active",x.dataset.page===page));$("pageCrumb").textContent=({home:"Overview",rankings:"Rankings",players:"Players",profile:"Player Profile",tiers:"Tiers",modes:"Game Modes"})[page]||page;window.location.hash=page==="home"?"home":page; $("sidebar").classList.remove("open");window.scrollTo(0,0)}
function openProfile(id){const p=players.find(x=>x.id===id);if(!p)return;const rank=sorted().findIndex(x=>x.id===id)+1;$("profileContent").innerHTML=`<div class="profile-hero"><img class="profile-skin" src="${skin(p.skin||p.name)}" onerror="this.src='${avatar(p.name)}'"><div class="profile-info"><span class="tier-badge ${tierClass(p.tier)}">${esc(p.tier)}</span><h2>${esc(p.name)}</h2><p>Global rank #${rank} · ${esc(p.mode)} specialist</p><p>Member since ${new Date(p.createdAt).toLocaleDateString()}</p></div></div><div class="profile-stats"><div class="profile-stat"><small>GLOBAL RANK</small><b>#${rank}</b></div><div class="profile-stat"><small>POINTS</small><b>${fmt(p.points)}</b></div><div class="profile-stat"><small>WINS</small><b>${fmt(p.wins)}</b></div><div class="profile-stat"><small>LOSSES</small><b>${fmt(p.losses)}</b></div></div><div class="profile-detail"><h3>Player information</h3><p style="color:var(--muted);font-size:11px">PvP game mode</p><div class="profile-modes"><span class="mode-chip">${esc(p.mode)}</span></div><p style="color:var(--muted);font-size:11px;margin-top:20px">Profile ID: ${esc(p.id)}</p></div>`;showPage("profile")}
function renderAdmin(){const q=($("adminSearch").value||"").toLowerCase();$("adminPlayers").innerHTML=sorted().filter(p=>p.name.toLowerCase().includes(q)).map(p=>`<div class="admin-row"><img src="${avatar(p.skin||p.name)}"><div class="admin-row-info"><b>${esc(p.name)}</b><small>${esc(p.tier)} · ${fmt(p.points)} points · ${esc(p.mode)}</small></div><button class="mini-action" data-edit="${esc(p.id)}">Edit</button><button class="mini-action danger" data-delete="${esc(p.id)}">Delete</button></div>`).join("")||`<div class="empty">No players.</div>`}
function switchTab(tab){document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x.dataset.tab===tab));document.querySelectorAll(".admin-pane").forEach(x=>x.classList.remove("active"));$("tab-"+tab).classList.add("active")}
function resetForm(){$("playerForm").reset();$("editId").value="";$("pPoints").value=1000;$("pWins").value=0;$("pLosses").value=0;$("playerFormError").textContent=""}
function editPlayer(id){const p=players.find(x=>x.id===id);if(!p)return;switchTab("add");$("editId").value=p.id;$("pName").value=p.name;$("pSkin").value=p.skin||p.name;$("pTier").value=p.tier;$("pMode").value=p.mode;$("pPoints").value=p.points;$("pWins").value=p.wins;$("pLosses").value=p.losses}
async function adminAction(path,method,body){try{const data=await request(path,{method,body:body?JSON.stringify(body):undefined,admin:true});if(data.players)players=data.players;renderAll();renderAdmin();return data}catch(e){toast(e.message);throw e}}
async function randomPlayer(){const names=["Block","Pixel","Craft","Void","Frost","Nova","Echo","Blaze","Shadow","Lunar","Aqua","Vex","Clutch","Orbit","Quartz","Rift","Drift","Zenith","Comet","Nexus"];const used=new Set(players.map(p=>p.name.toLowerCase()));let name;do{name=names[Math.floor(Math.random()*names.length)]+["PvP","YT","MC","X","Pro","GG","_","HD","FN"][Math.floor(Math.random()*9)]+Math.floor(10+Math.random()*989)}while(used.has(name.toLowerCase()));const p={name,skin:SKIN_PRESETS[Math.floor(Math.random()*SKIN_PRESETS.length)],tier:TIERS[Math.floor(Math.random()*10)],mode:MODES[Math.floor(Math.random()*8)],points:Math.floor(500+Math.random()*8500),wins:Math.floor(Math.random()*250),losses:Math.floor(Math.random()*140)};await adminAction("/api/admin/players","POST",p);toast("Random player created")}
async function login(pass){const data=await request("/api/admin/login",{method:"POST",body:JSON.stringify({password:pass})});adminToken=data.token;sessionStorage.setItem("bt_admin_token",adminToken)}
function openLogin(){$("loginError").textContent="";$("adminPassword").value="";$("loginModal").classList.add("open")}
function openAdmin(){$("adminModal").classList.add("open");renderAdmin()}
function logout(){adminToken="";sessionStorage.removeItem("bt_admin_token");$("adminModal").classList.remove("open");toast("Logged out")}
document.addEventListener("click",async e=>{
 const nav=e.target.closest("[data-page]");if(nav){e.preventDefault();showPage(nav.dataset.page);return}
 const open=e.target.closest("[data-open]");if(open){openProfile(open.dataset.open);return}
 const edit=e.target.closest("[data-edit]");if(edit){editPlayer(edit.dataset.edit);return}
 const del=e.target.closest("[data-delete]");if(del){if(confirm("Delete this player permanently?")){try{await adminAction("/api/admin/players/"+encodeURIComponent(del.dataset.delete),"DELETE");toast("Player deleted")}catch{}}return}
 const close=e.target.closest("[data-close]");if(close){$(close.dataset.close).classList.remove("open");return}
 const tab=e.target.closest("[data-tab]");if(tab){switchTab(tab.dataset.tab);return}
});
$("adminOpen").onclick=()=>adminToken?openAdmin():openLogin();
$("mobileMenu").onclick=()=>$("sidebar").classList.toggle("open");
$("refreshBtn").onclick=async()=>{await loadPlayers();toast("Data refreshed")};
$("rankSearch").oninput=renderRankings;$("rankTier").onchange=renderRankings;$("rankMode").onchange=renderRankings;
$("playerSearch").oninput=renderPlayers;$("playerTier").onchange=renderPlayers;$("playerMode").onchange=renderPlayers;$("adminSearch").oninput=renderAdmin;
$("loginForm").onsubmit=async e=>{e.preventDefault();$("loginError").textContent="";try{await login($("adminPassword").value);$("loginModal").classList.remove("open");openAdmin();toast("Admin access granted")}catch(err){$("loginError").textContent=err.message}};
$("logoutBtn").onclick=logout;$("randomPlayerBtn").onclick=randomPlayer;
$("cancelEdit").onclick=resetForm;
$("playerForm").onsubmit=async e=>{e.preventDefault();const id=$("editId").value;const body={name:$("pName").value.trim(),skin:$("pSkin").value.trim()||$("pName").value.trim(),tier:$("pTier").value,mode:$("pMode").value,points:Number($("pPoints").value),wins:Number($("pWins").value),losses:Number($("pLosses").value)};try{await adminAction(id?"/api/admin/players/"+encodeURIComponent(id):"/api/admin/players",id?"PUT":"POST",body);resetForm();switchTab("manage");toast(id?"Player updated":"Player added")}catch(err){$("playerFormError").textContent=err.message}};
$("backPlayers").onclick=()=>showPage("players");
window.addEventListener("hashchange",()=>{const page=location.hash.slice(1);if(["home","rankings","players","tiers","modes"].includes(page))showPage(page)});
renderFilters();showPage(["home","rankings","players","tiers","modes"].includes(location.hash.slice(1))?location.hash.slice(1):"home");loadPlayers();
