"use strict";(()=>{var b="dockState",E="reddprowl-dock-host",L="reddprowl-dock-frame";var w=null;chrome.runtime.onMessage.addListener((e,n,t)=>e.type==="TOGGLE_DOCK"?(P().then(()=>t({ok:!0})).catch(r=>{console.error("[ReddProwl] TOGGLE_DOCK error",r),t({ok:!1})}),!0):e.type==="POLL_INBOX"?(_().then(r=>t(r)).catch(r=>{console.error("[ReddProwl] POLL_INBOX error",r),t([])}),!0):e.type==="SCRAPE_THREAD"?(A(e.postUrl,{firstLevelOnly:e.firstLevelOnly,skipPostAuthor:e.skipPostAuthor}).then(r=>t(r)).catch(r=>{console.error("[ReddProwl] SCRAPE_THREAD error",r),t([])}),!0):e.type==="GET_REDDIT_CONTEXT"?(I().then(r=>t(r)).catch(r=>{console.error("[ReddProwl] GET_REDDIT_CONTEXT error",r),t({pageType:"other",url:window.location.href,subredditName:null,postTitle:null,postUrl:null,redditUsername:null,loggedIn:!1})}),!0):e.type==="FETCH_SUBREDDIT_POSTS"?(M(e.subreddit,e.keywords,e.minScore,e.after).then(r=>t(r)).catch(r=>{console.error("[ReddProwl] FETCH_SUBREDDIT_POSTS error",r),t({authors:[],after:null})}),!0):!1);var a=null;function D(){if(a?.host.isConnected)return a;let e=document.getElementById(E);e instanceof HTMLDivElement&&e!==a?.host&&(e.remove(),a=null);let n=document.createElement("div");n.id=E,n.style.all="initial",n.style.position="fixed",n.style.zIndex="2147483647",n.style.top="0",n.style.right="0",n.style.pointerEvents="none";let t=n.attachShadow({mode:"open"});t.innerHTML=`
    <style>
      :host { all: initial; }
      .panel {
        position: fixed;
        top: 16px;
        right: 16px;
        bottom: 16px;
        width: min(420px, calc(100vw - 32px));
        border-radius: 22px;
        background: rgba(255, 255, 255, 0.96);
        border: 1px solid rgba(224, 112, 0, 0.18);
        box-shadow: 0 22px 70px rgba(25, 24, 23, 0.24);
        overflow: hidden;
        pointer-events: auto;
        backdrop-filter: blur(14px);
      }
      .panel.hidden { display: none; }
      .toolbar {
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 12px 8px 14px;
        background: linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,243,236,0.95) 100%);
        border-bottom: 1px solid #EFE8DE;
      }
      .brand {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 12px;
        font-weight: 800;
        color: #9A6841;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .actions {
        display: flex;
        gap: 8px;
      }
      .icon-btn {
        width: 28px;
        height: 28px;
        border-radius: 999px;
        border: 1px solid #E7DED2;
        background: #FFF;
        color: #6B6B6E;
        font: inherit;
        font-size: 16px;
        line-height: 1;
        cursor: pointer;
      }
      .icon-btn:hover {
        background: #F6F2EB;
      }
      .frame {
        width: 100%;
        height: calc(100% - 44px);
        border: 0;
        background: transparent;
      }
      .launcher {
        position: fixed;
        top: 50%;
        right: 12px;
        transform: translateY(-50%);
        writing-mode: vertical-rl;
        text-orientation: mixed;
        border: 0;
        border-radius: 16px 0 0 16px;
        padding: 14px 10px;
        background: linear-gradient(180deg, #E07000 0%, #B85500 100%);
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        box-shadow: 0 18px 40px rgba(224, 112, 0, 0.3);
        pointer-events: auto;
        cursor: pointer;
      }
      .launcher.hidden { display: none; }
      @media (max-width: 520px) {
        .panel {
          top: 8px;
          right: 8px;
          bottom: 8px;
          width: calc(100vw - 16px);
        }
        .launcher {
          right: 4px;
        }
      }
    </style>
    <div id="reddprowl-panel" class="panel hidden">
      <div class="toolbar">
        <div class="brand">ReddProwl</div>
        <div class="actions">
          <button id="reddprowl-minimize" class="icon-btn" aria-label="Minimize panel">\u2212</button>
          <button id="reddprowl-close" class="icon-btn" aria-label="Close panel">\xD7</button>
        </div>
      </div>
      <iframe id="${L}" class="frame" src="${chrome.runtime.getURL("sidepanel.html")}"></iframe>
    </div>
    <button id="reddprowl-launcher" class="launcher hidden" aria-label="Open ReddProwl panel">ReddProwl</button>
  `,document.documentElement.appendChild(n);let r=t.getElementById("reddprowl-panel"),o=t.getElementById("reddprowl-launcher"),s=t.getElementById("reddprowl-minimize"),i=t.getElementById("reddprowl-close");if(!(r instanceof HTMLDivElement)||!(o instanceof HTMLButtonElement))throw new Error("Failed to initialize dock");return o.addEventListener("click",()=>{g("open")}),s?.addEventListener("click",()=>{g("minimized")}),i?.addEventListener("click",()=>{g("closed")}),a={host:n,panel:r,launcher:o},a}function k(){a?.host.isConnected&&a.host.remove(),a=null}function R(e){let{panel:n,launcher:t}=D();n.classList.toggle("hidden",e!=="open"),t.classList.toggle("hidden",e!=="minimized")}async function g(e){if(chrome.storage.local.set({[b]:e}).catch(n=>{console.error("[ReddProwl] failed to persist dock state",n)}),e==="closed"){k();return}R(e)}async function S(){let n=(await chrome.storage.local.get([b]))[b];return n==="open"||n==="minimized"||n==="closed"?n:"closed"}async function P(){if(await S()==="open"){await g("minimized");return}k(),await g("open")}S().then(e=>{D(),R(e)});var T=new Set(["[deleted]","AutoModerator"]);async function M(e,n,t,r){let o=new URLSearchParams({limit:"100",sort:"new"});r&&o.set("after",r);let s=await fetch(`https://www.reddit.com/r/${encodeURIComponent(e)}/new.json?${o}`,{credentials:"include",headers:{Accept:"application/json"}});if(!s.ok)return{authors:[],after:null};let i=await s.json(),c=i?.data?.children??[],x=i?.data?.after??null,m=n.map(u=>u.toLowerCase()),h=new Set;for(let u of c){if(u.kind!=="t3")continue;let{author:d,title:l,selftext:p,score:U}=u.data;if(!(!d||T.has(d)||d.toLowerCase().endsWith("bot"))&&!(U<t)){if(m.length>0){let v=`${l} ${p}`.toLowerCase();if(!m.some(C=>v.includes(C)))continue}h.add(d)}}return{authors:[...h],after:x}}async function A(e,n){let r=`${e.split("?")[0].replace(/\/$/,"")}.json?limit=500&depth=10`,o=await fetch(r,{credentials:"include",headers:{Accept:"application/json"}});if(!o.ok)return[];let s=await o.json();if(!Array.isArray(s)||s.length<2)return[];let i=s[0],c=s[1],x=i?.data?.children?.[0]?.kind==="t3"?i.data.children[0].data.author??null:null,m=new Set;function h(u){for(let d of u){if(d.kind!=="t1")continue;let{author:l,replies:p}=d.data;l&&!T.has(l)&&!l.toLowerCase().endsWith("bot")&&(!n?.skipPostAuthor||l!==x)&&m.add(l),!n?.firstLevelOnly&&p&&typeof p=="object"&&p.data?.children&&h(p.data.children)}}return h(c.data.children),[...m]}async function _(){let e=await fetch("https://www.reddit.com/message/inbox.json?limit=25&mark=false",{credentials:"include",headers:{Accept:"application/json"}});return e.ok?((await e.json())?.data?.children??[]).filter(r=>r.kind==="t4"&&!r.data.was_comment).map(r=>({redditMessageId:r.data.id,fromUsername:r.data.author,body:r.data.body,receivedAt:new Date(r.data.created_utc*1e3).toISOString()})):[]}async function I(){let e=window.location.href,n=window.location.pathname,t=n.match(/^\/r\/([^/]+)\/comments\/([^/]+)/i),r=n.match(/^\/r\/([^/]+)/i),o=n.match(/^\/(?:user|u)\/([^/]+)/i),s=t?.[1]??r?.[1]??null,i=t?e.split("?")[0]:null,c=await B();return{pageType:t?"thread":r?"subreddit":"other",url:e,subredditName:s,postTitle:t?O():null,postUrl:i,redditUsername:c.username,loggedIn:!!c.username}}function O(){let e=["shreddit-title","[data-test-id='post-content'] h1","h1","faceplate-screen-reader-content","meta[property='og:title']"];for(let n of e){let t=document.querySelector(n);if(!t)continue;let o=(t instanceof HTMLMetaElement?t.content:t.textContent)?.trim();if(o)return o.replace(/\s+/g," ")}return document.title.replace(/\s*\|\s*Reddit.*$/i,"").trim()||null}async function B(){let e=Date.now(),n=y(window.location.pathname);if(w&&w.expiresAt>e)return{username:w.value??n,profilePathUsername:n,domUsername:null,pageDataUsername:null,scriptRegexUsername:null};let t=F(),r=await H(),o=r.pageDataUsername,s=r.scriptRegexUsername,i=n??t??o??s;return w={value:i,expiresAt:e+3e5},{username:i,profilePathUsername:n,domUsername:t,pageDataUsername:o,scriptRegexUsername:s}}function F(){let e=["header shreddit-user-account-menu a[href^='/user/']","header shreddit-user-account-menu a[href^='/u/']","header a[id*='profile'][href^='/user/']","header a[id*='profile'][href^='/u/']","header nav a[href^='/user/']","header nav a[href^='/u/']","header a[aria-label*='profile' i][href]","header a[aria-label*='account' i][href]"];for(let n of e){let t=document.querySelector(n),r=z(t);if(r)return r}return null}async function H(){try{let t=await N();if(t)return{pageDataUsername:t,scriptRegexUsername:null}}catch(t){console.debug("[ReddProwl] page context username lookup failed",t)}let e=Array.from(document.scripts).map(t=>t.textContent??"").filter(Boolean),n=[/"loggedInAccount"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"/s,/"currentUser"\s*:\s*\{[^}]*"account"\s*:\s*\{[^}]*"displayText"\s*:\s*"([^"]+)"/s,/"session"\s*:\s*\{[^}]*"user"\s*:\s*\{[^}]*"account"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"/s,/"accounts"\s*:\s*\{\s*"([^"]+)":/s];for(let t of e)for(let r of n){let o=t.match(r),s=f(o?.[1]);if(s)return{pageDataUsername:null,scriptRegexUsername:s}}return{pageDataUsername:null,scriptRegexUsername:null}}function z(e){if(!e)return null;if(e instanceof HTMLAnchorElement){let t=y(e.getAttribute("href"));if(t)return t}let n=[e.getAttribute("href"),e.getAttribute("aria-label"),e.getAttribute("title"),e.getAttribute("data-testid")];for(let t of n){let r=f(t);if(r)return r;let o=y(t);if(o)return o}return f(e.textContent)}function y(e){if(!e)return null;let n=e.match(/\/(?:user|u)\/([^/?#]+)/i);return f(n?.[1])}function f(e){if(typeof e!="string")return null;let n=e.trim().replace(/^u\//i,"").replace(/^@/,"");return/^[A-Za-z0-9_-]{3,32}$/.test(n)?n:null}async function N(){return new Promise(e=>{let n=`reddprowl:username:${Math.random().toString(36).slice(2)}`,t=()=>{window.removeEventListener(n,r),o.remove()},r=s=>{let i=s;t(),e(f(i.detail?.username))};window.addEventListener(n,r,{once:!0});let o=document.createElement("script");o.src=chrome.runtime.getURL("page-context.js"),o.dataset.reddprowlEvent=n,(document.head??document.documentElement).appendChild(o),window.setTimeout(()=>{t(),e(null)},250)})}})();
