import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://opgzdgegxajyhnahsgtb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wZ3pkZ2VneGFqeWhuYWhzZ3RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MzQ3NjcsImV4cCI6MjA4OTIxMDc2N30.W8Fq-ltzxVpOwoYe98BWHiE4HB0kmMTSEsvMdwUJAv0";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ════════════════════════════════════════════════════════════
//  ユーティリティ
// ════════════════════════════════════════════════════════════
const fmt = (n) => n == null || isNaN(n) ? "—" : "¥" + Math.round(n).toLocaleString("ja-JP");

// カンマ付き数値表示（input用）
const fmtNum = (n) => n == null || n === "" ? "" : Number(n).toLocaleString("ja-JP");
const parseNum = (s) => {
  const v = String(s).replace(/,/g, "");
  return v === "" ? null : Number(v);
};
const pct = (a, b) => !b ? "—" : (((a / b) * 100).toFixed(1) + "%");
const MONTHS = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];
const YEARS  = [2023, 2024, 2025, 2026, 2027, 2028];
const today  = new Date();

const monthKey = (y, m) => `${y}-${String(m).padStart(2,"0")}`;
const getMonthsInRange = (sy, sm, ey, em) => {
  const result = []; let y = sy, m = sm;
  while (y < ey || (y === ey && m <= em)) {
    result.push({ year: y, month: m, key: monthKey(y, m) });
    m++; if (m > 11) { m = 0; y++; }
  }
  return result;
};

// ════════════════════════════════════════════════════════════
//  予測パターン定義
// ════════════════════════════════════════════════════════════
const PRESET_SCENARIOS = [
  { id: "patternA", name: "予測A", color: "#60b0f0",
    startYear: today.getFullYear(), startMonth: today.getMonth(),
    endYear: today.getFullYear(), endMonth: Math.min(today.getMonth()+2, 11) },
  { id: "patternB", name: "予測B", color: "#f8d060",
    startYear: today.getFullYear(), startMonth: today.getMonth(),
    endYear: today.getFullYear(), endMonth: Math.min(today.getMonth()+2, 11) },
];

// ════════════════════════════════════════════════════════════
//  SVG イラスト（高品質版）
// ════════════════════════════════════════════════════════════
const UnagiIllustration = () => (
  <svg viewBox="0 0 340 92" xmlns="http://www.w3.org/2000/svg" style={{width:"100%",height:"100%",display:"block"}}>
    <defs>
      <radialGradient id="ug-bowl" cx="50%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#4a2510"/><stop offset="60%" stopColor="#2a1208"/><stop offset="100%" stopColor="#140802"/>
      </radialGradient>
      <radialGradient id="ug-rice" cx="50%" cy="20%" r="80%">
        <stop offset="0%" stopColor="#fdf4dc"/><stop offset="60%" stopColor="#ede4c4"/><stop offset="100%" stopColor="#d4c8a0"/>
      </radialGradient>
      <linearGradient id="ug-unagi" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#d4860a"/><stop offset="30%" stopColor="#a85e04"/><stop offset="70%" stopColor="#7a3e02"/><stop offset="100%" stopColor="#5a2c00"/>
      </linearGradient>
      <linearGradient id="ug-tare" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#8b3a00" stopOpacity="0.9"/><stop offset="100%" stopColor="#3a1200" stopOpacity="0.7"/>
      </linearGradient>
      <filter id="ug-shadow"><feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000" floodOpacity="0.5"/></filter>
      <filter id="ug-glow"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    {/* 影 */}
    <ellipse cx="170" cy="87" rx="145" ry="6" fill="#000" opacity="0.4"/>
    {/* 重箱外枠 */}
    <rect x="18" y="8" width="304" height="76" rx="6" fill="#1a0a02" stroke="#6a3810" strokeWidth="2"/>
    <rect x="22" y="12" width="296" height="68" rx="4" fill="#2a1408"/>
    {/* 重箱内側 */}
    <rect x="26" y="16" width="288" height="60" rx="3" fill="url(#ug-bowl)"/>
    {/* ご飯 */}
    <rect x="26" y="42" width="288" height="34" rx="3" fill="url(#ug-rice)"/>
    {/* ご飯の粒感 */}
    {Array.from({length:32}).map((_,i)=>{
      const x = 38 + (i % 8) * 34 + (i % 3) * 4;
      const y = 48 + Math.floor(i / 8) * 7 + (i % 2) * 3;
      return <ellipse key={i} cx={x} cy={y} rx="4" ry="2.2" fill="rgba(255,255,255,0.28)" opacity="0.8"/>;
    })}
    {/* 鰻の蒲焼き本体 */}
    <path d="M32 44 Q60 24 120 28 Q180 32 240 24 Q285 18 308 36 Q300 58 268 62 Q210 68 170 66 Q120 64 78 68 Q48 70 32 58 Z" fill="url(#ug-unagi)" filter="url(#ug-shadow)"/>
    {/* 鰻の焼き色・質感 */}
    <path d="M45 42 Q100 28 165 31 Q215 34 260 26 Q290 22 305 38 Q295 50 265 54 Q215 59 170 57 Q118 55 80 59 Q55 61 45 52 Z" fill="#c07010" opacity="0.45"/>
    {/* 鰻の縦筋（炭火焼きグリル跡） */}
    {[70,105,140,175,210,245,278].map((x,i)=>(
      <path key={i} d={`M${x} 28 Q${x+3} 46 ${x+1} 62`} fill="none" stroke="#3a1400" strokeWidth="2.5" opacity="0.5" strokeLinecap="round"/>
    ))}
    {/* タレ（照り感） */}
    <path d="M50 40 Q120 28 190 32 Q240 35 295 40 Q285 48 255 51 Q200 56 165 54 Q110 52 70 55 Q50 56 48 48 Z" fill="url(#ug-tare)" opacity="0.6"/>
    {/* 照りハイライト */}
    <path d="M75 31 Q145 23 220 26 Q262 28 288 36" fill="none" stroke="rgba(255,210,80,0.55)" strokeWidth="5" strokeLinecap="round"/>
    <path d="M85 27 Q155 20 225 23" fill="none" stroke="rgba(255,230,120,0.35)" strokeWidth="3" strokeLinecap="round"/>
    {/* 山椒（緑の粒） */}
    {[{x:95,y:33},{x:132,y:29},{x:172,y:31},{x:215,y:27},{x:255,y:30},{x:280,y:38},{x:78,y:40},{x:250,y:42}].map((p,i)=>(
      <g key={i}>
        <circle cx={p.x} cy={p.y} r="3.8" fill="#3a8a10" stroke="#1a5a04" strokeWidth="0.8"/>
        <circle cx={p.x-1.2} cy={p.y-1.2} r="1.4" fill="rgba(180,255,120,0.6)"/>
      </g>
    ))}
    {/* 湯気 */}
    {[{x:110,h:14,op:0.22},{x:170,h:16,op:0.18},{x:230,h:13,op:0.2}].map((s,i)=>(
      <g key={i} opacity={s.op}>
        <path d={`M${s.x} 22 Q${s.x-6} 14 ${s.x} 8 Q${s.x+6} 14 ${s.x} 22`} fill="none" stroke="#fff8e0" strokeWidth="2.5" strokeLinecap="round"/>
        <path d={`M${s.x+8} 20 Q${s.x+2} 12 ${s.x+8} 6 Q${s.x+14} 12 ${s.x+8} 20`} fill="none" stroke="#fff8e0" strokeWidth="2" strokeLinecap="round"/>
      </g>
    ))}
    {/* 重箱の縁の光沢 */}
    <rect x="18" y="8" width="304" height="4" rx="2" fill="rgba(255,255,255,0.08)"/>
    <rect x="18" y="8" width="4" height="76" rx="2" fill="rgba(255,255,255,0.06)"/>
  </svg>
);

const AjiIllustration = () => (
  <svg viewBox="0 0 340 92" xmlns="http://www.w3.org/2000/svg" style={{width:"100%",height:"100%",display:"block"}}>
    <defs>
      <radialGradient id="aj-plate" cx="50%" cy="25%" r="75%">
        <stop offset="0%" stopColor="#f0ece0"/><stop offset="60%" stopColor="#d8d2c0"/><stop offset="100%" stopColor="#b8b0a0"/>
      </radialGradient>
      <radialGradient id="aj-fry1" cx="30%" cy="20%" r="70%">
        <stop offset="0%" stopColor="#f0c040"/><stop offset="40%" stopColor="#d09018"/><stop offset="80%" stopColor="#a06008"/><stop offset="100%" stopColor="#704000"/>
      </radialGradient>
      <radialGradient id="aj-fry2" cx="30%" cy="20%" r="70%">
        <stop offset="0%" stopColor="#e8b838"/><stop offset="40%" stopColor="#c88818"/><stop offset="80%" stopColor="#985808"/><stop offset="100%" stopColor="#683800"/>
      </radialGradient>
      <filter id="aj-shadow"><feDropShadow dx="2" dy="4" stdDeviation="5" floodColor="#000" floodOpacity="0.45"/></filter>
    </defs>
    {/* 影 */}
    <ellipse cx="170" cy="88" rx="150" ry="5" fill="#000" opacity="0.35"/>
    {/* 白い丸皿 */}
    <ellipse cx="170" cy="76" rx="158" ry="14" fill="#c8c0b0" opacity="0.5"/>
    <ellipse cx="170" cy="74" rx="156" ry="14" fill="url(#aj-plate)" stroke="#c0b8a8" strokeWidth="1.5"/>
    <ellipse cx="170" cy="72" rx="144" ry="10" fill="rgba(255,255,255,0.2)"/>
    {/* キャベツ千切り */}
    {[
      {x:52,y:64,rx:28,ry:7,rot:-18,c:"#4a9a28"},{x:38,y:58,rx:22,ry:6,rot:-25,c:"#5aaa32"},
      {x:68,y:68,rx:24,ry:6,rot:-10,c:"#3a8820"},{x:44,y:70,rx:18,ry:5,rot:-30,c:"#60b038"},
      {x:30,y:65,rx:16,ry:5,rot:-20,c:"#48a028"},{x:72,y:62,rx:20,ry:5,rot:-8,c:"#2a7818"},
    ].map((k,i)=>(
      <ellipse key={i} cx={k.x} cy={k.y} rx={k.rx} ry={k.ry} fill={k.c} opacity={0.85} transform={`rotate(${k.rot},${k.x},${k.y})`}/>
    ))}
    {/* レモン */}
    <ellipse cx="295" cy="60" rx="26" ry="16" fill="#f8e840" stroke="#d8c820" strokeWidth="1.2" opacity="0.92"/>
    <ellipse cx="295" cy="60" rx="20" ry="11" fill="#faf280" opacity="0.5"/>
    {[0,60,120,180,240,300].map((a,i)=>(
      <line key={i} x1="295" y1="60" x2={295+18*Math.cos(a*Math.PI/180)} y2={60+10*Math.sin(a*Math.PI/180)}
        stroke="#e8d010" strokeWidth="0.8" opacity="0.6"/>
    ))}
    <ellipse cx="295" cy="60" rx="4" ry="3" fill="#e8c800" opacity="0.6"/>
    {/* アジフライ2枚目（奥） */}
    <g filter="url(#aj-shadow)">
      <path d="M95 62 Q110 22 195 18 Q255 16 280 38 Q275 65 240 70 Q190 76 140 72 Q100 70 95 62Z" fill="url(#aj-fry2)" opacity="0.88"/>
      {Array.from({length:18}).map((_,i)=>{
        const x=118+(i%6)*24+(i%3)*3, y=28+Math.floor(i/6)*13+(i%2)*4;
        return <circle key={i} cx={x} cy={y} r={2.5+i%3*0.8} fill="rgba(60,20,0,0.35)" opacity="0.6"/>;
      })}
      <path d="M100 58 Q145 30 210 26 Q255 23 278 42" fill="none" stroke="rgba(255,200,80,0.3)" strokeWidth="3" strokeLinecap="round"/>
    </g>
    {/* アジフライ1枚目（手前） */}
    <g filter="url(#aj-shadow)">
      <path d="M82 68 Q92 24 185 14 Q250 10 278 30 Q282 58 248 66 Q196 74 138 72 Q95 72 82 68Z" fill="url(#aj-fry1)"/>
      {/* パン粉の凸凹テクスチャ */}
      {Array.from({length:26}).map((_,i)=>{
        const x=105+(i%7)*24+(i%4)*5, y=22+Math.floor(i/7)*14+(i%3)*4;
        return <circle key={i} cx={x} cy={y} r={3+i%4*0.7} fill="rgba(50,20,0,0.32)" opacity="0.55"/>;
      })}
      {/* ハイライト */}
      <path d="M100 46 Q155 22 220 18 Q255 16 275 30" fill="none" stroke="rgba(255,220,100,0.45)" strokeWidth="5" strokeLinecap="round"/>
      <path d="M110 40 Q168 18 228 15" fill="none" stroke="rgba(255,240,160,0.3)" strokeWidth="3" strokeLinecap="round"/>
      {/* 尻尾部分 */}
      <path d="M82 68 Q75 62 72 54 Q74 46 82 48 Q90 50 90 60 Z" fill="#8a5010" opacity="0.9"/>
      <path d="M72 54 Q65 48 68 40 Q74 36 80 42" fill="none" stroke="#704008" strokeWidth="2.5" strokeLinecap="round"/>
    </g>
    {/* タルタルソース */}
    <path d="M135 66 Q158 60 180 63 Q170 72 148 72 Z" fill="#f8f4e0" opacity="0.88" stroke="#e0d8c0" strokeWidth="0.8"/>
    <circle cx="148" cy="67" r="2" fill="#4a9020" opacity="0.7"/>
    <circle cx="160" cy="65" r="1.8" fill="#4a9020" opacity="0.7"/>
    {/* 皿の光沢 */}
    <ellipse cx="130" cy="70" rx="30" ry="4" fill="rgba(255,255,255,0.18)"/>
  </svg>
);

const HoshiimoIllustration = () => (
  <svg viewBox="0 0 340 92" xmlns="http://www.w3.org/2000/svg" style={{width:"100%",height:"100%",display:"block"}}>
    <defs>
      <linearGradient id="im-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e8c878"/><stop offset="35%" stopColor="#d4a848"/><stop offset="70%" stopColor="#a87828"/><stop offset="100%" stopColor="#7a5010"/>
      </linearGradient>
      <linearGradient id="im-bg2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#dfc070"/><stop offset="35%" stopColor="#c9a040"/><stop offset="70%" stopColor="#9e7020"/><stop offset="100%" stopColor="#6e4808"/>
      </linearGradient>
      <linearGradient id="im-bg3" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f0d080"/><stop offset="35%" stopColor="#dab048"/><stop offset="70%" stopColor="#b08028"/><stop offset="100%" stopColor="#886018"/>
      </linearGradient>
      <linearGradient id="im-side" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#c89040"/><stop offset="100%" stopColor="#7a5010"/>
      </linearGradient>
      <filter id="im-shadow"><feDropShadow dx="3" dy="5" stdDeviation="5" floodColor="#000" floodOpacity="0.4"/></filter>
      <filter id="im-shadow2"><feDropShadow dx="2" dy="3" stdDeviation="4" floodColor="#000" floodOpacity="0.3"/></filter>
    </defs>
    {/* 背景影 */}
    <ellipse cx="170" cy="87" rx="148" ry="5" fill="#000" opacity="0.3"/>
    {/* 干し芋3枚（重なり表現） */}
    {/* 奥の1枚 */}
    <g transform="rotate(14,268,46)" filter="url(#im-shadow2)" opacity="0.85">
      <rect x="222" y="10" width="92" height="70" rx="14" fill="url(#im-bg2)"/>
      <rect x="222" y="10" width="92" height="70" rx="14" fill="none" stroke="#f0c050" strokeWidth="1.5" opacity="0.5"/>
      {/* 繊維の筋 */}
      {[18,28,38,48,58,68,76].map((y,i)=>(
        <path key={i} d={`M226 ${y} Q268 ${y-1} 310 ${y+1}`} fill="none" stroke="rgba(90,40,0,0.28)" strokeWidth="1.2"/>
      ))}
      {/* 干し芋の白い粉（糖分） */}
      {[{x:240,y:20},{x:265,y:15},{x:290,y:24},{x:248,y:42},{x:278,y:55},{x:258,y:68},{x:302,y:36}].map((p,i)=>(
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4+i%3} fill="rgba(255,255,255,0.45)"/>
          <circle cx={p.x-1} cy={p.y-1} r={1.8} fill="rgba(255,255,255,0.75)"/>
        </g>
      ))}
      {/* 端のカット面 */}
      <rect x="222" y="10" width="6" height="70" rx="3" fill="url(#im-side)" opacity="0.7"/>
    </g>
    {/* 真ん中の1枚 */}
    <g transform="rotate(-4,162,46)" filter="url(#im-shadow)">
      <rect x="116" y="7" width="92" height="74" rx="14" fill="url(#im-bg)"/>
      <rect x="116" y="7" width="92" height="74" rx="14" fill="none" stroke="#f8d060" strokeWidth="2" opacity="0.65"/>
      {[16,26,36,46,56,66,76].map((y,i)=>(
        <path key={i} d={`M120 ${y} Q162 ${y-1.5} 204 ${y+1}`} fill="none" stroke="rgba(80,35,0,0.3)" strokeWidth="1.3"/>
      ))}
      {[{x:132,y:17},{x:158,y:12},{x:180,y:22},{x:140,y:40},{x:168,y:53},{x:152,y:70},{x:190,y:36},{x:128,y:58}].map((p,i)=>(
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4.5+i%3*0.8} fill="rgba(255,255,255,0.5)"/>
          <circle cx={p.x-1.2} cy={p.y-1.2} r={2} fill="rgba(255,255,255,0.82)"/>
        </g>
      ))}
      {/* ハイライト（表面の照り） */}
      <path d="M124 18 Q162 12 200 20" fill="none" stroke="rgba(255,230,120,0.4)" strokeWidth="4" strokeLinecap="round"/>
      <rect x="116" y="7" width="7" height="74" rx="3" fill="url(#im-side)" opacity="0.65"/>
    </g>
    {/* 手前の1枚 */}
    <g transform="rotate(-14,58,48)" filter="url(#im-shadow)">
      <rect x="14" y="4" width="88" height="78" rx="14" fill="url(#im-bg3)"/>
      <rect x="14" y="4" width="88" height="78" rx="14" fill="none" stroke="#fce870" strokeWidth="2" opacity="0.75"/>
      {[14,24,34,44,54,64,74,82].map((y,i)=>(
        <path key={i} d={`M18 ${y} Q58 ${y-1.5} 98 ${y+1}`} fill="none" stroke="rgba(70,30,0,0.28)" strokeWidth="1.3"/>
      ))}
      {[{x:30,y:14},{x:56,y:9},{x:78,y:19},{x:36,y:36},{x:66,y:50},{x:48,y:66},{x:84,y:32},{x:24,y:54},{x:72,y:76}].map((p,i)=>(
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={5+i%4*0.7} fill="rgba(255,255,255,0.55)"/>
          <circle cx={p.x-1.4} cy={p.y-1.4} r={2.2} fill="rgba(255,255,255,0.9)"/>
        </g>
      ))}
      <path d="M20 16 Q58 10 96 18" fill="none" stroke="rgba(255,235,130,0.45)" strokeWidth="5" strokeLinecap="round"/>
      <path d="M22 12 Q60 6 94 13" fill="none" stroke="rgba(255,245,160,0.3)" strokeWidth="3" strokeLinecap="round"/>
      <rect x="14" y="4" width="7" height="78" rx="3" fill="url(#im-side)" opacity="0.6"/>
    </g>
  </svg>
);

// 汎用デフォルトイラスト（商品名から自動生成）
const DefaultIllustration = ({label=""}) => {
  // ラベルからシード値を生成
  const seed = label.split("").reduce((a,c)=>a+c.charCodeAt(0),0);
  const rng = (n) => ((seed * 9301 + n * 49297) % 233280) / 233280;
  const hue = Math.floor(rng(1) * 360);
  const c1 = `hsl(${hue},60%,55%)`;
  const c2 = `hsl(${(hue+30)%360},55%,38%)`;
  const c3 = `hsl(${(hue+60)%360},50%,25%)`;
  return (
    <svg viewBox="0 0 340 92" xmlns="http://www.w3.org/2000/svg" style={{width:"100%",height:"100%",display:"block"}}>
      <defs>
        <linearGradient id="df-g1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c1}/><stop offset="50%" stopColor={c2}/><stop offset="100%" stopColor={c3}/>
        </linearGradient>
        <radialGradient id="df-plate" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.15)"/><stop offset="100%" stopColor="rgba(255,255,255,0)"/>
        </radialGradient>
        <filter id="df-shadow"><feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#000" floodOpacity="0.4"/></filter>
      </defs>
      <ellipse cx="170" cy="87" rx="148" ry="5" fill="#000" opacity="0.3"/>
      {/* 皿 */}
      <ellipse cx="170" cy="74" rx="155" ry="14" fill={c3} opacity="0.5"/>
      <ellipse cx="170" cy="72" rx="152" ry="13" fill="url(#df-g1)" filter="url(#df-shadow)"/>
      <ellipse cx="170" cy="70" rx="140" ry="9" fill="url(#df-plate)"/>
      {/* 装飾的な模様（商品に依存しない幾何学） */}
      {Array.from({length:8}).map((_,i)=>{
        const angle = (i/8)*Math.PI*2 + rng(i)*0.5;
        const r = 40 + rng(i+10)*50;
        const cx = 170 + r*Math.cos(angle)*0.9;
        const cy = 46 + r*0.35*Math.sin(angle);
        const radius = 6 + rng(i+20)*12;
        return (
          <circle key={i} cx={cx} cy={cy} r={radius}
            fill={`hsla(${(hue+i*45)%360},65%,70%,0.35)`}
            stroke={`hsla(${(hue+i*45)%360},65%,80%,0.5)`}
            strokeWidth="1"/>
        );
      })}
      {/* ハイライト */}
      <path d="M60 58 Q170 44 280 58" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="5" strokeLinecap="round"/>
      <path d="M80 52 Q170 40 260 52" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" strokeLinecap="round"/>
      {/* テキスト */}
      <text x="170" y="50" textAnchor="middle" fill="rgba(255,255,255,0.7)"
        fontSize="18" fontFamily="'Noto Sans JP',sans-serif" fontWeight="700"
        style={{letterSpacing:"0.1em"}}>
        {label.length > 6 ? label.slice(0,6)+"…" : label}
      </text>
    </svg>
  );
};

// ════════════════════════════════════════════════════════════
//  テーマ定義
// ════════════════════════════════════════════════════════════
const THEMES = {
  unagi:    { bg:"#180c00", bg2:"#2d1500", accent:"#f0a040", dim:"#a06020", hdr:"linear-gradient(90deg,#5a2000,#a83e08,#5a2000)", tabAct:"#3d1a05", border:"#5a2e10", inp:"#2a1204", illus:<UnagiIllustration/> },
  aji:      { bg:"#001525", bg2:"#002840", accent:"#48c8f8", dim:"#1870a0", hdr:"linear-gradient(90deg,#003060,#006898,#003060)", tabAct:"#002040", border:"#104870", inp:"#001828", illus:<AjiIllustration/> },
  hoshiimo: { bg:"#181000", bg2:"#2d2005", accent:"#e0b040", dim:"#906818", hdr:"linear-gradient(90deg,#402800,#7a5008,#402800)", tabAct:"#382508", border:"#503808", inp:"#221508", illus:<HoshiimoIllustration/> },
  _total:   { bg:"#080820", bg2:"#101038", accent:"#9888f8", dim:"#504898", hdr:"linear-gradient(90deg,#141040,#3020a8,#141040)", tabAct:"#181240", border:"#28205a", inp:"#0e0c28", illus:null },
  default:  { bg:"#0f0f20", bg2:"#181830", accent:"#a898e0", dim:"#504888", hdr:"linear-gradient(90deg,#201850,#4830a0,#201850)", tabAct:"#1e1640", border:"#302860", inp:"#140e30", illus:null },
};
const getTheme = (id, label="") => {
  if (THEMES[id]) return THEMES[id];
  return { ...THEMES.default, illus: <DefaultIllustration label={label}/> };
};

// ════════════════════════════════════════════════════════════
//  CSS
// ════════════════════════════════════════════════════════════
const makeCSS = (t) => `
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;600;700&family=Noto+Sans+JP:wght@400;500;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Noto Sans JP',sans-serif;background:#100800;color:#f0e0c0;min-height:100vh;font-size:15px;line-height:1.6;}
.app{min-height:100vh;background:linear-gradient(140deg,${t.bg} 0%,${t.bg2} 50%,${t.bg} 100%);transition:background 0.5s;}

/* ヘッダー */
.hdr{background:${t.hdr};padding:0 28px;display:flex;align-items:stretch;border-bottom:2.5px solid ${t.accent};box-shadow:0 4px 28px rgba(0,0,0,0.7);min-height:94px;transition:background 0.5s,border-color 0.5s;}
.hdr-left{display:flex;flex-direction:column;justify-content:center;flex:1;gap:4px;}
.hdr-title{font-family:'Noto Serif JP',serif;font-size:24px;font-weight:700;color:#fff8e8;letter-spacing:0.07em;text-shadow:0 1px 8px rgba(0,0,0,0.6);}
.hdr-sub{font-size:13px;color:${t.accent};opacity:0.95;font-weight:500;}
.hdr-illus{width:340px;height:94px;flex-shrink:0;}
.hdr-actions{display:flex;align-items:center;gap:10px;margin:0 16px;}

/* タブバー */
.tab-bar{display:flex;align-items:center;gap:3px;padding:12px 24px 0;background:rgba(0,0,0,0.42);border-bottom:2px solid ${t.border};overflow-x:auto;transition:border-color 0.5s;}
.tab-btn{padding:10px 20px;border:none;background:transparent;color:${t.dim};font-family:'Noto Sans JP',sans-serif;font-size:14px;font-weight:500;cursor:pointer;border-radius:8px 8px 0 0;transition:all 0.2s;white-space:nowrap;border-bottom:3px solid transparent;}
.tab-btn:hover{background:${t.tabAct};color:${t.accent};}
.tab-btn.active{background:${t.tabAct};color:${t.accent};border-bottom:3px solid ${t.accent};font-weight:700;}
.tab-btn.total-tab{color:#7868b8;} .tab-btn.total-tab.active{color:#9888f8;border-bottom-color:#9888f8;}
.tab-add{padding:8px 14px;background:${t.tabAct};border:1.5px dashed ${t.dim};color:${t.dim};border-radius:8px 8px 0 0;cursor:pointer;font-size:20px;transition:all 0.2s;}
.tab-add:hover{border-color:${t.accent};color:${t.accent};}
.tab-btn-wrap{display:flex;align-items:center;border-radius:8px 8px 0 0;}
.tab-btn-wrap.active .tab-btn{background:${t.tabAct};color:${t.accent};border-bottom:3px solid ${t.accent};font-weight:700;}
.tab-del{background:transparent;border:none;color:${t.dim};font-size:12px;cursor:pointer;padding:2px 4px 2px 0;opacity:0;transition:opacity 0.15s,color 0.15s;line-height:1;}
.tab-btn-wrap:hover .tab-del{opacity:1;}
.tab-del:hover{color:#f07070;}
.save-badge{font-size:12px;color:${t.dim};display:flex;align-items:center;gap:4px;margin-left:auto;white-space:nowrap;padding-right:4px;}

/* メイン */
.main{padding:24px;}

/* 期間バー */
.range-bar{display:flex;align-items:center;gap:10px;margin-bottom:16px;padding:14px 20px;background:rgba(255,255,255,0.05);border:1px solid ${t.border};border-radius:12px;flex-wrap:wrap;transition:border-color 0.5s;}
.range-bar-label{font-size:13px;color:${t.accent};font-weight:700;white-space:nowrap;}
.month-sel-wrap{display:flex;gap:4px;align-items:center;}
.msel{background:${t.inp};border:1.5px solid ${t.border};color:#f0e0c0;padding:7px 10px;border-radius:7px;font-family:'Noto Sans JP',sans-serif;font-size:14px;cursor:pointer;font-weight:500;transition:border-color 0.2s,background 0.5s;}
.msel:focus{outline:none;border-color:${t.accent};}
.range-sep{font-size:18px;color:${t.dim};font-weight:700;padding:0 2px;}
.range-info{font-size:12.5px;color:${t.dim};background:rgba(255,255,255,0.05);padding:6px 12px;border-radius:6px;border:1px solid ${t.border};white-space:nowrap;}
.qbtn{padding:6px 12px;background:${t.tabAct};color:${t.accent};border:1.5px solid ${t.dim};border-radius:6px;font-size:12.5px;font-weight:600;cursor:pointer;font-family:'Noto Sans JP',sans-serif;transition:all 0.2s;white-space:nowrap;}
.qbtn:hover{border-color:${t.accent};}

/* 予測パターンバー */
.scenario-bar{display:flex;align-items:center;gap:8px;margin-bottom:20px;padding:12px 18px;background:rgba(255,255,255,0.04);border:1px solid ${t.border};border-radius:12px;flex-wrap:wrap;transition:border-color 0.5s;}
.scenario-bar-label{font-size:13px;color:${t.accent};font-weight:700;white-space:nowrap;margin-right:4px;}
.sc-btn{padding:7px 16px;border:2px solid;border-radius:8px;font-family:'Noto Sans JP',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.2s;white-space:nowrap;}
.sc-btn:hover{opacity:0.85;transform:translateY(-1px);}
.sc-del{background:transparent;border:none;color:#804040;cursor:pointer;font-size:13px;padding:0 2px;line-height:1;transition:color 0.2s;}
.sc-del:hover{color:#f07070;}
.sc-add-btn{padding:7px 14px;background:${t.tabAct};color:${t.dim};border:1.5px dashed ${t.dim};border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:'Noto Sans JP',sans-serif;transition:all 0.2s;white-space:nowrap;}
.sc-add-btn:hover{border-color:${t.accent};color:${t.accent};}
.sc-compare-btn{padding:7px 14px;background:rgba(255,255,255,0.06);color:#b0a8e8;border:1.5px solid #504888;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:'Noto Sans JP',sans-serif;transition:all 0.2s;margin-left:auto;white-space:nowrap;}
.sc-compare-btn:hover{border-color:#9888f8;color:#9888f8;}
.sc-compare-btn.active{background:rgba(90,70,150,0.2);border-color:#9888f8;color:#9888f8;}

/* 比較テーブル */
.compare-box{background:rgba(255,255,255,0.04);border:1px solid ${t.border};border-radius:14px;overflow:hidden;margin-bottom:24px;}
.compare-box-title{padding:14px 20px;font-family:'Noto Serif JP',serif;font-size:16px;font-weight:600;color:${t.accent};border-bottom:1px solid ${t.border};background:rgba(255,255,255,0.03);}
.cmp-t{width:100%;border-collapse:collapse;}
.cmp-t th{padding:10px 16px;font-size:13px;font-weight:700;text-align:right;border-bottom:1.5px solid ${t.border};white-space:nowrap;}
.cmp-t th:first-child{text-align:left;color:${t.dim};}
.cmp-t td{padding:9px 16px;font-size:14px;text-align:right;border-bottom:1px solid rgba(255,255,255,0.05);font-variant-numeric:tabular-nums;}
.cmp-t td:first-child{text-align:left;color:rgba(255,255,255,0.75);font-size:13px;}
.cmp-t tr:last-child td{border-bottom:none;font-weight:700;font-size:15px;}
.cmp-t tr:hover td{background:rgba(255,255,255,0.025);}
.best-val{font-weight:700;}

/* KPI */
.kpi-row{display:grid;grid-template-columns:repeat(auto-fill,minmax(185px,1fr));gap:14px;margin-bottom:24px;}
.kpi-card{background:rgba(255,255,255,0.05);border:1px solid ${t.border};border-radius:12px;padding:16px 20px;transition:border-color 0.5s;}
.kpi-label{font-size:12px;color:${t.dim};margin-bottom:6px;font-weight:500;letter-spacing:0.02em;}
.kpi-f{font-size:14px;font-weight:500;color:#7ec8f8;font-variant-numeric:tabular-nums;}
.kpi-a{font-size:22px;color:#7ef880;margin-top:4px;font-variant-numeric:tabular-nums;font-weight:700;}
.kpi-d{font-size:12px;color:${t.dim};margin-top:3px;}

/* PLグリッド */
.pl-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;}
@media(max-width:920px){.pl-grid{grid-template-columns:1fr;}}
.panel{background:rgba(255,255,255,0.04);border:1px solid ${t.border};border-radius:14px;overflow:hidden;}
.ph{padding:14px 20px;font-family:'Noto Serif JP',serif;font-size:16px;font-weight:600;display:flex;align-items:center;gap:10px;}
.ph.fc{background:linear-gradient(90deg,#1a3860,#10284a);border-bottom:1.5px solid #305890;color:#88d0f8;}
.ph.ac{background:linear-gradient(90deg,#183818,#102810);border-bottom:1.5px solid #288828;color:#80f088;}
.pl-t{width:100%;border-collapse:collapse;}
.pl-t tr{border-bottom:1px solid rgba(255,255,255,0.06);}
.pl-t tr:last-child{border-bottom:none;}
.pl-t tr:hover{background:rgba(255,255,255,0.03);}
.pl-t td{padding:10px 18px;font-size:14px;}
.pl-t td:last-child{text-align:right;font-variant-numeric:tabular-nums;}
.pl-t .sh td{background:rgba(255,255,255,0.06);font-weight:700;color:${t.accent};font-size:12px;padding:7px 18px;letter-spacing:0.05em;}
.pl-t .r-tot td{font-weight:700;font-size:16px;color:#fff;}
.pl-t .r-sub td{font-weight:600;color:#e8d0a0;font-size:15px;}
.pl-t .r-g td{color:#7ef880;font-weight:700;}
.pl-t .r-r td{color:#f87870;font-weight:700;}
.pc{font-size:12px;color:${t.dim};margin-left:6px;}

/* セクション */
.sec{margin-bottom:24px;}
.sec-ttl{font-family:'Noto Serif JP',serif;font-size:17px;font-weight:600;color:${t.accent};margin-bottom:13px;padding-bottom:10px;border-bottom:1.5px solid ${t.border};display:flex;align-items:center;justify-content:space-between;}

/* 入力テーブル */
.it{width:100%;border-collapse:collapse;}
.it th{text-align:left;font-size:13px;color:${t.accent};font-weight:700;padding:8px 10px;border-bottom:1.5px solid ${t.border};background:rgba(255,255,255,0.04);letter-spacing:0.02em;}
.it td{padding:6px 6px;border-bottom:1px solid rgba(255,255,255,0.05);}
.it tr:hover td{background:rgba(255,255,255,0.025);}
.inp{background:${t.inp};border:1.5px solid ${t.border};color:#f0e0c0;padding:7px 11px;border-radius:6px;font-size:14px;width:100%;font-family:'Noto Sans JP',sans-serif;font-weight:500;transition:border-color 0.2s,background 0.5s;}
.inp:focus{outline:none;border-color:${t.accent};}
.inp.sm{width:92px;text-align:right;} .inp.md{width:128px;} .inp.nm{width:150px;}

/* ボタン */
.btn{padding:7px 15px;border:none;border-radius:7px;cursor:pointer;font-size:13px;font-family:'Noto Sans JP',sans-serif;font-weight:600;transition:all 0.2s;}
.btn-a{background:${t.tabAct};color:${t.accent};border:1.5px solid ${t.dim};}
.btn-a:hover{border-color:${t.accent};}
.btn-d{background:transparent;color:#c04040;border:1.5px solid #702020;padding:5px 10px;}
.btn-d:hover{background:#502020;color:#f88080;}
.btn-export{padding:9px 18px;background:linear-gradient(90deg,${t.dim},${t.accent});color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;font-family:'Noto Sans JP',sans-serif;font-weight:700;transition:opacity 0.2s;display:flex;align-items:center;gap:7px;white-space:nowrap;}
.btn-export:hover{opacity:0.85;}

/* BEP */
.bep-box{background:rgba(255,255,255,0.04);border:1px solid ${t.border};border-radius:14px;padding:20px 24px;margin-bottom:24px;}
.bep-title{font-family:'Noto Serif JP',serif;font-size:17px;font-weight:600;color:${t.accent};margin-bottom:16px;}
.bep-meters{display:flex;flex-wrap:wrap;gap:20px;}
.bep-item{flex:1;min-width:190px;}
.bep-item-label{font-size:13px;color:${t.dim};margin-bottom:7px;font-weight:500;}
.bep-item-val{font-size:17px;font-weight:700;color:#fff;margin-bottom:9px;font-variant-numeric:tabular-nums;}
.bep-bar-bg{height:10px;background:rgba(255,255,255,0.1);border-radius:5px;overflow:hidden;}
.bep-bar-fg{height:10px;border-radius:5px;transition:width 0.4s ease;}
.bep-note{font-size:13px;margin-top:6px;font-weight:500;}

/* サマリー */
.summary-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px;margin-bottom:24px;}
.sum-card{background:rgba(255,255,255,0.04);border:1px solid #28204a;border-radius:12px;padding:16px 20px;}
.sum-card-title{font-size:14px;color:#6858a8;margin-bottom:12px;font-family:'Noto Serif JP',serif;font-weight:600;}
.sum-row{display:flex;justify-content:space-between;font-size:14px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.06);}
.sum-row:last-child{border-bottom:none;}
.sum-row.highlight{font-weight:700;color:#fff;font-size:15px;}
.sum-row.green{color:#7ef880;} .sum-row.red{color:#f87870;}

/* 情報行 */
.info-row{display:flex;gap:10px;font-size:13px;color:${t.dim};padding:6px 0;align-items:center;}
.tag{display:inline-block;padding:3px 10px;border-radius:5px;font-size:12px;font-weight:600;}
.tag-fc{background:#1a3860;color:#88d0f8;} .tag-ac{background:#183818;color:#80f088;}

/* モーダル */
.modal-ov{position:fixed;inset:0;background:rgba(0,0,0,0.82);display:flex;align-items:center;justify-content:center;z-index:200;}
.modal{background:${t.inp};border:1.5px solid ${t.dim};border-radius:16px;padding:30px;width:400px;max-width:95vw;box-shadow:0 24px 70px rgba(0,0,0,0.8);}
.modal h3{font-family:'Noto Serif JP',serif;font-size:20px;font-weight:700;color:${t.accent};margin-bottom:18px;}
.modal label{display:block;font-size:14px;color:${t.dim};margin-bottom:5px;margin-top:14px;font-weight:500;}
.modal-btns{display:flex;gap:12px;margin-top:22px;justify-content:flex-end;}
.btn-ok{background:${t.accent};color:#000;padding:9px 22px;border:none;border-radius:8px;cursor:pointer;font-size:15px;font-weight:700;}
.btn-ok:hover{opacity:0.85;}
.btn-cancel{background:${t.tabAct};color:${t.dim};padding:9px 18px;border:1.5px solid ${t.dim};border-radius:8px;cursor:pointer;font-size:15px;font-weight:500;}

/* カラーピッカーグリッド */
.color-grid{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;}
.color-chip{width:32px;height:32px;border-radius:8px;border:2px solid transparent;cursor:pointer;transition:all 0.15s;}
.color-chip.selected{border-color:#fff;transform:scale(1.2);}

/* %トグルボタン */
.pct-toggle{padding:3px 8px;border-radius:4px;font-size:11px;font-weight:600;cursor:pointer;border:1.5px solid;transition:all 0.15s;}
.pct-toggle.off{background:transparent;color:${t.dim};border-color:${t.dim};}
.pct-toggle.on{background:#7a5800;color:#f8d060;border-color:#f8d060;}

/* 貢献利益セクション */
.contrib-section{margin-bottom:24px;}
.contrib-set{background:rgba(255,255,255,0.04);border:1px solid ${t.border};border-radius:12px;overflow:hidden;margin-bottom:14px;}
.contrib-set-hdr{padding:10px 16px;font-size:14px;font-weight:700;color:${t.accent};background:rgba(255,255,255,0.05);border-bottom:1px solid ${t.border};display:flex;align-items:center;gap:8px;}
.contrib-t{width:100%;border-collapse:collapse;}
.contrib-t th{padding:8px 14px;font-size:12px;font-weight:700;text-align:right;border-bottom:1px solid ${t.border};background:rgba(255,255,255,0.03);}
.contrib-t th:first-child{text-align:left;}
.contrib-t td{padding:8px 14px;font-size:13px;text-align:right;border-bottom:1px solid rgba(255,255,255,0.05);font-variant-numeric:tabular-nums;}
.contrib-t td:first-child{text-align:left;color:rgba(255,255,255,0.8);}
.contrib-t .contrib-sub td{color:${t.dim};font-size:12px;padding-left:24px;}
.contrib-t .contrib-sub td:first-child{color:${t.dim};}
.contrib-t .contrib-subtotal td{font-weight:600;color:#e8d080;border-top:1px solid rgba(255,255,255,0.1);}
.contrib-t .contrib-result td{font-weight:700;font-size:15px;border-top:2px solid rgba(255,255,255,0.2);}
.contrib-rate{font-size:11px;margin-left:6px;opacity:0.8;}
`;

// ════════════════════════════════════════════════════════════
//  データ生成
// ════════════════════════════════════════════════════════════
const makeScenarioData = (costRatio) => ({
  sets: [{id:1,name:"セット1"},{id:2,name:"セット2"},{id:3,name:"セット3"}],
  setPrices: {1:0,2:0,3:0},
  forecastSales: {1:0,2:0,3:0},
  actualSales:   {1:0,2:0,3:0},
  // 予測販売数モード: "manual"=手動, "ratio"=全体件数×割合
  forecastMode: "manual",
  forecastTotal: 0,       // 割合モード時の全体件数
  forecastRatios: {},     // {setId: ratio(0-100)}
  // セット内訳: {setId: [{id, itemName, qty}]}
  setBreakdown: {},
  // セット別原価: {setId: {isPercent, rate, amount}}
  setCosts: {1:{isPercent:true,rate:costRatio,amount:0}, 2:{isPercent:true,rate:costRatio,amount:0}, 3:{isPercent:true,rate:costRatio,amount:0}},
  fixedCosts: [
    {id:1,account:"固定費1",forecast:0,actual:0},
    {id:2,account:"固定費2",forecast:0,actual:0},
  ],
  variableCosts: [
    {id:1,account:"変動費1",unitCost:0,forecastQty:null,actualQty:null,isPercent:false,pctRate:0},
    {id:2,account:"変動費2",unitCost:0,forecastQty:null,actualQty:null,isPercent:false,pctRate:0},
  ],
  costRatio,
});

// 月ごとに複数シナリオを持つ構造
// actuals = 実績専用（予測タブに依存しない）
const makeMonthActuals = () => ({
  actualSales:    {},   // {setId: qty}
  fixedActuals:   {},   // {fixedCostId: amount}
  varActualQtys:  {},   // {varCostId: qty}
});

const makeMonth = (costRatio, scenarioIds) => {
  const scenarios = {};
  scenarioIds.forEach(id => { scenarios[id] = makeScenarioData(costRatio); });
  return { scenarios, actuals: makeMonthActuals() };
};

const makeProduct = (id, label, emoji, costRatio, scenarioDefs) => {
  const defs = scenarioDefs || PRESET_SCENARIOS;
  const months = {};
  for (let y = 2023; y <= 2028; y++) {
    for (let m = 0; m < 12; m++) {
      months[monthKey(y, m)] = makeMonth(costRatio, defs.map(s=>s.id));
    }
  }
  return { id, label, emoji, months, scenarioDefs: defs };
};

const INITIAL_SCENARIO_DEFS = [...PRESET_SCENARIOS];
const INITIAL_PRODUCTS = [
  makeProduct("unagi",    "鰻の蒲焼き","🐟",0.52, INITIAL_SCENARIO_DEFS),
  makeProduct("aji",      "アジフライ", "🍱",0.45, INITIAL_SCENARIO_DEFS),
  makeProduct("hoshiimo", "干し芋",    "🍠",0.38, INITIAL_SCENARIO_DEFS),
];

// ════════════════════════════════════════════════════════════
//  計算
// ════════════════════════════════════════════════════════════
const calcRevenue = (sets,prices,sales) => sets.reduce((s,x)=>s+(prices[x.id]||0)*(sales[x.id]||0),0);
const calcFixed   = (fc,key) => fc.reduce((s,r)=>s+(parseFloat(r[key])||0),0);
const calcVar = (vc, revenue, qk, sd) => vc.reduce((s,r) => {
  if (r.isPercent) return s + revenue * r.pctRate;
  let qty = r[qk];
  if (qty === null || qty === undefined || qty === -1 || qty === "") {
    // 空欄の場合は販売数合計を使用
    if (sd) qty = sd.sets.reduce((t,x) => {
      const sk = qk === "forecastQty" ? "forecastSales" : "actualSales";
      return t + (sd[sk][x.id] || 0);
    }, 0);
    else qty = 0;
  }
  return s + r.unitCost * (parseFloat(qty) || 0);
}, 0);

// セット別原価合計を計算
const calcSetCogs = (sd, sales) => {
  if (!sd) return 0;
  return sd.sets.reduce((total, s) => {
    const price = sd.setPrices[s.id] || 0;
    const qty   = (sales[s.id]) || 0;
    const rev   = price * qty;
    const sc    = sd.setCosts?.[s.id];
    if (!sc) return total + rev * (sd.costRatio || 0);
    return total + (sc.isPercent ? rev * sc.rate : sc.amount * qty);
  }, 0);
};

// 予測PL計算
const calcForecastPL = (sd) => {
  if (!sd) return {revenue:0,cogs:0,grossProfit:0,fixedTotal:0,variableTotal:0,sgaTotal:0,operatingProfit:0};
  const revenue = calcRevenue(sd.sets, sd.setPrices, sd.forecastSales);
  const cogs = calcSetCogs(sd, sd.forecastSales);
  const grossProfit = revenue - cogs;
  const fixedTotal = calcFixed(sd.fixedCosts, "forecast");
  const variableTotal = calcVar(sd.variableCosts, revenue, "forecastQty", sd);
  const sgaTotal = fixedTotal + variableTotal;
  return {revenue, cogs, grossProfit, fixedTotal, variableTotal, sgaTotal, operatingProfit: grossProfit - sgaTotal};
};

// 実績PL計算（月のactualsと予測sdの設定を組み合わせる）
const calcActualPL = (sd, actuals) => {
  if (!sd) return {revenue:0,cogs:0,grossProfit:0,fixedTotal:0,variableTotal:0,sgaTotal:0,operatingProfit:0};
  const sales = actuals?.actualSales || {};
  const revenue = calcRevenue(sd.sets, sd.setPrices, sales);
  const cogs = calcSetCogs(sd, sales);
  const grossProfit = revenue - cogs;
  // 固定費実績: fixedActualsに値があればそれ、なければforecastを使用
  const fixedTotal = sd.fixedCosts.reduce((s,r) => {
    const v = actuals?.fixedActuals?.[r.id];
    return s + (v != null ? v : r.forecast);
  }, 0);
  // 変動費実績
  const totalActQty = sd.sets.reduce((s,x) => s + (sales[x.id] || 0), 0);
  const variableTotal = sd.variableCosts.reduce((s,r) => {
    if (r.isPercent) return s + revenue * r.pctRate;
    const qty = actuals?.varActualQtys?.[r.id] != null ? actuals.varActualQtys[r.id] : totalActQty;
    return s + r.unitCost * qty;
  }, 0);
  const sgaTotal = fixedTotal + variableTotal;
  return {revenue, cogs, grossProfit, fixedTotal, variableTotal, sgaTotal, operatingProfit: grossProfit - sgaTotal};
};

// 後方互換用
const calcPL = (sd, isF) => isF ? calcForecastPL(sd) : calcActualPL(sd, null);

const calcRangePL = (product, monthsInRange, scenarioId, isF) => {
  const totals={revenue:0,cogs:0,grossProfit:0,fixedTotal:0,variableTotal:0,sgaTotal:0,operatingProfit:0};
  monthsInRange.forEach(({key})=>{
    const sd = product.months[key]?.scenarios?.[scenarioId];
    if (!sd) return;
    const pl = isF
      ? calcForecastPL(sd)
      : calcActualPL(sd, product.months[key]?.actuals);
    Object.keys(totals).forEach(k=>{ totals[k]+=pl[k]; });
  });
  return totals;
};

const calcBEP = (sd) => {
  if (!sd) return {bepRevenue:Infinity,fixedTotal:0,contributionRatio:0};
  const revenue=calcRevenue(sd.sets,sd.setPrices,sd.forecastSales);
  const cogs=calcSetCogs(sd,sd.forecastSales);
  const cogsRatio=revenue>0?cogs/revenue:0;
  const varRatio=revenue>0?calcVar(sd.variableCosts,revenue,"forecastQty",sd)/revenue:0;
  const contributionRatio=(1-cogsRatio)-varRatio;
  const fixedTotal=calcFixed(sd.fixedCosts,"forecast");
  return {bepRevenue:contributionRatio>0?fixedTotal/contributionRatio:Infinity, fixedTotal, contributionRatio};
};

// ════════════════════════════════════════════════════════════
//  ローカルストレージ
// ════════════════════════════════════════════════════════════
const STORAGE_KEY = "ec_pl_sim_v26";

// 旧バージョンのキャッシュをクリア（構造変更による競合防止）
["ec_pl_sim_v1","ec_pl_sim_v2","ec_pl_sim_v3","ec_pl_sim_v4","ec_pl_sim_v5","ec_pl_sim_v6","ec_pl_sim_v7","ec_pl_sim_v8","ec_pl_sim_v9","ec_pl_sim_v10","ec_pl_sim_v11","ec_pl_sim_v12","ec_pl_sim_v13","ec_pl_sim_v14","ec_pl_sim_v15","ec_pl_sim_v16","ec_pl_sim_v17","ec_pl_sim_v18","ec_pl_sim_v19","ec_pl_sim_v20","ec_pl_sim_v21","ec_pl_sim_v22","ec_pl_sim_v23","ec_pl_sim_v24","ec_pl_sim_v25"].forEach(k=>{
  try{localStorage.removeItem(k);}catch{}
});

const isValidSave = (p) => {
  if (!Array.isArray(p) || p.length===0) return false;
  if (!p[0].months) return false;
  const firstMK = Object.keys(p[0].months)[0];
  return firstMK && p[0].months[firstMK]?.scenarios != null;
};

const migrateData = (d) => {
  d.products = d.products.map(p => ({
    ...p,
    months: Object.fromEntries(Object.entries(p.months).map(([k, m]) => [
      k, m.actuals ? m : { ...m, actuals: makeMonthActuals() }
    ]))
  }));
  return d;
};

const loadState = () => {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (!s) return null;
    const d = JSON.parse(s);
    if (!isValidSave(d.products)) { localStorage.removeItem(STORAGE_KEY); return null; }
    return migrateData(d);
  } catch { return null; }
};
const saveState = (data) => {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({...data, savedAt:new Date().toISOString()}));
  } catch {}
};
// Supabaseへの保存（非同期）
const saveToSupabase = async (data) => {
  try {
    await supabase.from("pl_simulator_data").upsert({
      id: "main",
      data: data,
      updated_at: new Date().toISOString()
    });
  } catch(e) { console.warn("Supabase save error:", e); }
};
// Supabaseからの読み込み（非同期）
const loadFromSupabase = async () => {
  try {
    const { data, error } = await supabase
      .from("pl_simulator_data")
      .select("data")
      .eq("id", "main")
      .single();
    if (error || !data) return null;
    const d = data.data;
    if (!isValidSave(d.products)) return null;
    return migrateData(d);
  } catch(e) { console.warn("Supabase load error:", e); return null; }
};

// ════════════════════════════════════════════════════════════
//  CSV エクスポート
// ════════════════════════════════════════════════════════════
const exportCSV = (product, monthsInRange, sy, sm, ey, em) => {
  const label = `${sy}年${MONTHS[sm]}〜${ey}年${MONTHS[em]}`;
  const lines = [`EC販売 PLシミュレーター,${label}`,`商品,${product.emoji} ${product.label}`,""];
  lines.push(`【${product.label}】`);
  const scenarioCols = product.scenarioDefs.map(s=>s.name);
  lines.push(["項目",...scenarioCols,"実績"].join(","));
  const rowLabels=["売上","原価","粗利","固定費","変動費","販管費合計","営業利益"];
  const rowKeys=["revenue","cogs","grossProfit","fixedTotal","variableTotal","sgaTotal","operatingProfit"];
  const scenarioPLs = product.scenarioDefs.map(s=>calcRangePL(product,monthsInRange,s.id,true));
  const actualPL = calcRangePL(product,monthsInRange,"patternA",false);
  rowLabels.forEach((l,i)=>{
    const vals = scenarioPLs.map(pl=>Math.round(pl[rowKeys[i]]));
    lines.push([l,...vals,Math.round(actualPL[rowKeys[i]])].join(","));
  });
  const blob=new Blob(["\uFEFF"+lines.join("\n")],{type:"text/csv;charset=utf-8;"});
  const url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url; a.download=`PL_${product.label}_${label.replace(/[年月〜]/g,"_")}.csv`; a.click(); URL.revokeObjectURL(url);
};

// ════════════════════════════════════════════════════════════
//  モーダル
// ════════════════════════════════════════════════════════════
const PRESET_COLORS = ["#60b0f0","#60e888","#f07878","#f8d060","#c878f8","#f8a040","#60d8d0","#f878b8","#a0e870","#8898f8"];

function AddScenarioModal({onClose, onAdd}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [sy, setSy] = useState(today.getFullYear());
  const [sm, setSm] = useState(today.getMonth());
  const [ey, setEy] = useState(today.getFullYear());
  const [em, setEm] = useState(Math.min(today.getMonth()+2, 11));
  return (
    <div className="modal-ov" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()} style={{width:460}}>
        <h3>予測パターンを追加</h3>
        <label>パターン名</label>
        <input className="inp" value={name} onChange={e=>setName(e.target.value)} placeholder="例: 強気予測・値上げ後など"/>
        <label>予測期間</label>
        <div style={{display:"flex",alignItems:"center",gap:6,marginTop:6,flexWrap:"wrap"}}>
          <select className="msel" value={sy} onChange={e=>setSy(Number(e.target.value))}>{YEARS.map(y=><option key={y} value={y}>{y}年</option>)}</select>
          <select className="msel" value={sm} onChange={e=>setSm(Number(e.target.value))}>{MONTHS.map((m,i)=><option key={i} value={i}>{m}</option>)}</select>
          <span style={{color:"rgba(255,255,255,0.5)"}}>〜</span>
          <select className="msel" value={ey} onChange={e=>setEy(Number(e.target.value))}>{YEARS.map(y=><option key={y} value={y}>{y}年</option>)}</select>
          <select className="msel" value={em} onChange={e=>setEm(Number(e.target.value))}>{MONTHS.map((m,i)=><option key={i} value={i}>{m}</option>)}</select>
        </div>
        <label>カラー</label>
        <div className="color-grid">
          {PRESET_COLORS.map(c=>(
            <div key={c} className={`color-chip ${c===color?"selected":""}`}
              style={{background:c}} onClick={()=>setColor(c)}/>
          ))}
        </div>
        <div style={{marginTop:12,display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:20,height:20,borderRadius:4,background:color}}/>
          <input className="inp" value={color} onChange={e=>setColor(e.target.value)} style={{width:120}}/>
        </div>
        <div className="modal-btns">
          <button className="btn-cancel" onClick={onClose}>キャンセル</button>
          <button className="btn-ok" style={{background:color}} onClick={()=>{
            if(!name.trim())return;
            onAdd(name.trim(),color,sy,sm,ey,em); onClose();
          }}>追加</button>
        </div>
      </div>
    </div>
  );
}

function AddProductModal({onClose, onAdd}) {
  const [label,setLabel]=useState(""); const [emoji,setEmoji]=useState("🛒"); const [cr,setCr]=useState(50);
  return (
    <div className="modal-ov" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <h3>新しい商品タブを追加</h3>
        <label>商品名</label>
        <input className="inp" value={label} onChange={e=>setLabel(e.target.value)} placeholder="例: 牡蠣の燻製"/>
        <label>絵文字</label>
        <input className="inp" value={emoji} onChange={e=>setEmoji(e.target.value)} style={{width:80}}/>
        <label>原価率 (%)</label>
        <input className="inp" type="number" value={cr} onChange={e=>setCr(Number(e.target.value))} style={{width:110}}/>
        <div className="modal-btns">
          <button className="btn-cancel" onClick={onClose}>キャンセル</button>
          <button className="btn-ok" onClick={()=>{if(!label.trim())return;onAdd(label.trim(),emoji,cr/100);onClose();}}>追加</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  PLTable / KPIRow / BEP
// ════════════════════════════════════════════════════════════
function PLTable({pl, label, cls, scColor}) {
  const {revenue,cogs,grossProfit,fixedTotal,variableTotal,sgaTotal,operatingProfit}=pl;
  const headerStyle = scColor ? {background:`linear-gradient(90deg,${scColor}22,${scColor}11)`, borderBottom:`1.5px solid ${scColor}66`, color:scColor} : {};
  return (
    <div className="panel">
      <div className={cls==="fc"||cls==="ac"?`ph ${cls}`:"ph fc"} style={scColor?headerStyle:{}}>
        {cls==="ac"?<span className="tag tag-ac">実績</span>:<span className="tag tag-fc">{label}</span>}
        損益計算書
      </div>
      <table className="pl-t"><tbody>
        <tr className="sh"><td colSpan={2}>売上高</td></tr>
        <tr className="r-tot"><td>売上合計</td><td>{fmt(revenue)}</td></tr>
        <tr className="sh"><td colSpan={2}>売上原価</td></tr>
        <tr><td>原価</td><td>{fmt(cogs)}<span className="pc">{pct(cogs,revenue)}</span></td></tr>
        <tr className="r-sub"><td>売上総利益（粗利）</td><td>{fmt(grossProfit)}<span className="pc">{pct(grossProfit,revenue)}</span></td></tr>
        <tr className="sh"><td colSpan={2}>販管費</td></tr>
        <tr><td>固定費合計</td><td>{fmt(fixedTotal)}</td></tr>
        <tr><td>変動費合計</td><td>{fmt(variableTotal)}<span className="pc">{pct(variableTotal,revenue)}</span></td></tr>
        <tr className="r-sub"><td>販管費合計</td><td>{fmt(sgaTotal)}<span className="pc">{pct(sgaTotal,revenue)}</span></td></tr>
        <tr className="sh"><td colSpan={2}>営業利益</td></tr>
        <tr className={`r-tot ${operatingProfit>=0?"r-g":"r-r"}`}>
          <td>営業利益</td><td>{fmt(operatingProfit)}<span className="pc">{pct(operatingProfit,revenue)}</span></td>
        </tr>
      </tbody></table>
    </div>
  );
}

function KPIRow({forecast, actual, sd, actuals}) {
  const diff=(a,b)=>{const d=a-b;return(d>=0?"+":"")+"¥"+Math.round(d).toLocaleString("ja-JP");};
  const items=[
    {label:"売上",f:forecast.revenue,a:actual.revenue},
    {label:"粗利",f:forecast.grossProfit,a:actual.grossProfit},
    {label:"粗利率",fStr:pct(forecast.grossProfit,forecast.revenue),aStr:pct(actual.grossProfit,actual.revenue)},
    {label:"営業利益",f:forecast.operatingProfit,a:actual.operatingProfit},
    {label:"営業利益率",fStr:pct(forecast.operatingProfit,forecast.revenue),aStr:pct(actual.operatingProfit,actual.revenue)},
  ];

  // 袋数・商品別数量（セット内訳が登録されている場合）
  const bagCards = [];
  if(sd && actuals) {
    const totalFBags = sd.sets.reduce((s,x)=>s+(sd.forecastSales[x.id]||0),0);
    const totalABags = sd.sets.reduce((s,x)=>s+(actuals.actualSales?.[x.id]||0),0);
    bagCards.push(
      <div className="kpi-card" key="bags" style={{borderColor:"rgba(248,208,96,0.25)"}}>
        <div className="kpi-label">📦 販売袋数</div>
        <div className="kpi-a">{totalABags > 0 ? totalABags.toLocaleString("ja-JP")+" 袋" : "—"}</div>
        <div className="kpi-f">予測: {totalFBags.toLocaleString("ja-JP")} 袋</div>
        {totalABags > 0 && <div className="kpi-d">差異: {(totalABags-totalFBags>=0?"+":"")+(totalABags-totalFBags).toLocaleString("ja-JP")} 袋</div>}
      </div>
    );
    // 商品別
    const itemTotals = {};
    sd.sets.forEach(s=>{
      const bd = (sd.setBreakdown||{})[s.id]||[];
      const fQty = sd.forecastSales[s.id]||0;
      const aQty = actuals.actualSales?.[s.id]||0;
      bd.forEach(item=>{
        const k = item.itemName||"未設定";
        if(!itemTotals[k]) itemTotals[k]={f:0,a:0};
        itemTotals[k].f += item.qty * fQty;
        itemTotals[k].a += item.qty * aQty;
      });
    });
    Object.entries(itemTotals).forEach(([name,v])=>{
      bagCards.push(
        <div className="kpi-card" key={name} style={{borderColor:"rgba(160,232,200,0.25)"}}>
          <div className="kpi-label">🐟 {name}</div>
          <div className="kpi-a">{v.a > 0 ? v.a.toLocaleString("ja-JP")+" 尾/個" : "—"}</div>
          <div className="kpi-f">予測: {v.f.toLocaleString("ja-JP")} 尾/個</div>
          {v.a > 0 && <div className="kpi-d">差異: {(v.a-v.f>=0?"+":"")+(v.a-v.f).toLocaleString("ja-JP")} 尾/個</div>}
        </div>
      );
    });
  }

  return (
    <div className="kpi-row">
      {items.map((it,i)=>(
        <div className="kpi-card" key={i}>
          <div className="kpi-label">{it.label}</div>
          <div className="kpi-a">{it.aStr??fmt(it.a)}</div>
          <div className="kpi-f">予測: {it.fStr??fmt(it.f)}</div>
          {it.f!=null&&<div className="kpi-d">差異: {diff(it.a,it.f)}</div>}
        </div>
      ))}
      {bagCards}
    </div>
  );
}

function BEPSection({sd}) {
  const fc=calcPL(sd,true), ac=calcPL(sd,false);
  const {bepRevenue,fixedTotal,contributionRatio}=calcBEP(sd);
  if(!bepRevenue||bepRevenue===Infinity||bepRevenue===0) return null;
  const barColor=(p)=>p>=100?"#7ef880":p>=70?"#f8d030":"#f87870";
  return (
    <div className="bep-box">
      <div className="bep-title">📊 損益分岐点 分析</div>
      <div className="bep-meters">
        <div className="bep-item">
          <div className="bep-item-label">損益分岐点売上</div>
          <div className="bep-item-val">{fmt(bepRevenue)}</div>
          <div className="bep-item-label" style={{fontSize:12}}>限界利益率: {(contributionRatio*100).toFixed(1)}%　固定費: {fmt(fixedTotal)}</div>
        </div>
        {[{l:"予測達成率",rev:fc.revenue},{l:"実績達成率",rev:ac.revenue}].map((it,i)=>{
          const bp=Math.min((it.rev/bepRevenue)*100,150), surplus=it.rev-bepRevenue;
          return (
            <div className="bep-item" key={i}>
              <div className="bep-item-label">{it.l}</div>
              <div className="bep-item-val" style={{color:barColor(bp)}}>
                {bp.toFixed(1)}%
                <span style={{fontSize:13,marginLeft:10,fontWeight:500,color:surplus>=0?"#7ef880":"#f87870"}}>
                  ({surplus>=0?"+":""}{fmt(surplus)})
                </span>
              </div>
              <div className="bep-bar-bg"><div className="bep-bar-fg" style={{width:`${Math.min(bp,100)}%`,background:barColor(bp)}}/></div>
              <div className="bep-note" style={{color:barColor(bp)}}>{bp>=100?"✅ 黒字圏":"⚠️ あと"+fmt(bepRevenue-it.rev)+"必要"}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  パターン比較テーブル
// ════════════════════════════════════════════════════════════
function ScenarioCompareTable({product, monthsInRange}) {
  const defs = product.scenarioDefs;
  const pls = defs.map(s=>({...s, pl:calcRangePL(product,monthsInRange,s.id,true)}));
  const actual = calcRangePL(product,monthsInRange,defs[0].id,false);
  const rows = [
    {l:"売上",k:"revenue"},{l:"原価",k:"cogs"},{l:"粗利",k:"grossProfit"},
    {l:"固定費",k:"fixedTotal"},{l:"変動費",k:"variableTotal"},{l:"販管費合計",k:"sgaTotal"},
    {l:"営業利益",k:"operatingProfit",highlight:true},
  ];
  return (
    <div className="compare-box">
      <div className="compare-box-title">📊 予測パターン 比較</div>
      <div style={{overflowX:"auto"}}>
        <table className="cmp-t">
          <thead>
            <tr>
              <th style={{textAlign:"left",width:120}}>項目</th>
              {pls.map(s=><th key={s.id} style={{color:s.color}}>{s.name}</th>)}
              <th style={{color:"#80f088"}}>実績</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r=>{
              const vals = pls.map(s=>s.pl[r.k]);
              const best = r.k==="operatingProfit"||r.k==="grossProfit"||r.k==="revenue" ? Math.max(...vals) : null;
              return (
                <tr key={r.l} style={r.highlight?{background:"rgba(255,255,255,0.04)"}:{}}>
                  <td style={{fontWeight:r.highlight?700:400,color:r.highlight?"#fff":"rgba(255,255,255,0.75)"}}>{r.l}</td>
                  {pls.map(s=>(
                    <td key={s.id} style={{
                      color: r.k==="operatingProfit" ? (s.pl[r.k]>=0?"#7ef880":"#f87870") : "rgba(255,255,255,0.9)",
                      fontWeight: best!==null&&s.pl[r.k]===best ? 700 : 400,
                    }}>
                      {fmt(s.pl[r.k])}
                      {best!==null&&s.pl[r.k]===best&&<span style={{marginLeft:4,fontSize:11,color:"#f8d060"}}>★</span>}
                    </td>
                  ))}
                  <td style={{color:r.k==="operatingProfit"?(actual[r.k]>=0?"#7ef880":"#f87870"):"rgba(255,255,255,0.7)"}}>{fmt(actual[r.k])}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  ProductTab
// ════════════════════════════════════════════════════════════
function ProductTab({product, monthsInRange, activeScenarioId, showCompare, onChange}) {
  const firstKey = monthsInRange[0]?.key;
  const sd = product.months[firstKey]?.scenarios?.[activeScenarioId];

  // 予測・設定系：全月に共通で適用
  const upd = useCallback((field, value) => {
    const newMonths = { ...product.months };
    monthsInRange.forEach(({key}) => {
      if (!newMonths[key]) return;
      const newScenarios = { ...newMonths[key].scenarios };
      if (newScenarios[activeScenarioId]) {
        newScenarios[activeScenarioId] = { ...newScenarios[activeScenarioId], [field]: value };
      }
      newMonths[key] = { ...newMonths[key], scenarios: newScenarios };
    });
    onChange({ ...product, months: newMonths });
  }, [product, monthsInRange, activeScenarioId, onChange]);

  // 実績系：月のactualsに書き込む（予測タブと完全独立）
  const updActual = useCallback((field, value) => {
    const newMonths = { ...product.months };
    if (!newMonths[firstKey]) return;
    const prev = newMonths[firstKey].actuals || makeMonthActuals();
    newMonths[firstKey] = { ...newMonths[firstKey], actuals: { ...prev, [field]: value } };
    onChange({ ...product, months: newMonths });
  }, [product, firstKey, onChange]);

  // 現在の月の実績データ
  const actuals = product.months[firstKey]?.actuals || makeMonthActuals();

  if (!sd) return <div style={{padding:40,textAlign:"center",color:"rgba(255,255,255,0.4)"}}>データがありません</div>;

  const addSet=()=>{
    const id=Date.now();
    upd("sets",[...sd.sets,{id,name:`セット${sd.sets.length+1}`}]);
    upd("setPrices",{...sd.setPrices,[id]:0});
    upd("forecastSales",{...sd.forecastSales,[id]:0});
    // actualSalesはactualsに管理（upd不要）
    upd("setCosts",{...(sd.setCosts||{}),[id]:{isPercent:true,rate:sd.costRatio||0.5,amount:0}});
  };
  const delSet=id=>upd("sets",sd.sets.filter(s=>s.id!==id));
  const updSet=(id,k,v)=>upd("sets",sd.sets.map(s=>s.id===id?{...s,[k]:v}:s));
  const updPrice=(id,v)=>upd("setPrices",{...sd.setPrices,[id]:Number(v)});
  const updFC=(id,v)=>upd("forecastSales",{...sd.forecastSales,[id]:Number(v)});
  const updAC=(id,v)=>updActual("actualSales",{...(actuals.actualSales||{}),[id]:Number(v)});
  const addFixed=()=>upd("fixedCosts",[...sd.fixedCosts,{id:Date.now(),account:"",forecast:0,actual:0}]);
  const delFixed=id=>upd("fixedCosts",sd.fixedCosts.filter(r=>r.id!==id));
  const updFixed=(id,k,v)=>{
    if(k==="actual") updActual("fixedActuals",{...(actuals.fixedActuals||{}),[id]:Number(v)});
    else upd("fixedCosts",sd.fixedCosts.map(r=>r.id===id?{...r,[k]:v}:r));
  };
  const addVar=()=>upd("variableCosts",[...sd.variableCosts,{id:Date.now(),account:"",unitCost:0,forecastQty:null,actualQty:null,isPercent:false,pctRate:0}]);
  const delVar=id=>upd("variableCosts",sd.variableCosts.filter(r=>r.id!==id));
  const updVar=(id,k,v)=>{
    if(k==="actualQty") updActual("varActualQtys",{...(actuals.varActualQtys||{}),[id]:v===null?null:Number(v)});
    else upd("variableCosts",sd.variableCosts.map(r=>r.id===id?{...r,[k]:v}:r));
  };
  const updSetCost=(id,k,v)=>upd("setCosts",{...(sd.setCosts||{}),[id]:{...(sd.setCosts?.[id]||{isPercent:true,rate:0.5,amount:0}),[k]:v}});

  // 割合モード用（updを1回にまとめて二重上書きを防ぐ）
  const updMulti = useCallback((patches) => {
    const newMonths = { ...product.months };
    monthsInRange.forEach(({key}) => {
      if (!newMonths[key]) return;
      const newScenarios = { ...newMonths[key].scenarios };
      if (newScenarios[activeScenarioId]) {
        newScenarios[activeScenarioId] = { ...newScenarios[activeScenarioId], ...patches };
      }
      newMonths[key] = { ...newMonths[key], scenarios: newScenarios };
    });
    onChange({ ...product, months: newMonths });
  }, [product, monthsInRange, activeScenarioId, onChange]);

  const updForecastRatio=(id,v)=>{
    const newRatios = {...(sd.forecastRatios||{}),[id]:Number(v)};
    const total = sd.forecastTotal||0;
    const newForecastSales = {};
    sd.sets.forEach(s=>{ newForecastSales[s.id] = Math.round(total*(newRatios[s.id]||0)/100); });
    updMulti({forecastRatios: newRatios, forecastSales: newForecastSales});
  };
  const updForecastTotal=(v)=>{
    const total = Number(String(v).replace(/,/g,""));
    const newForecastSales = {};
    sd.sets.forEach(s=>{ newForecastSales[s.id] = Math.round(total*((sd.forecastRatios||{})[s.id]||0)/100); });
    updMulti({forecastTotal: total, forecastSales: newForecastSales});
  };

  // セット内訳用
  const addBreakdownItem=(setId)=>{
    const prev = (sd.setBreakdown||{})[setId] || [];
    upd("setBreakdown",{...(sd.setBreakdown||{}),[setId]:[...prev,{id:Date.now(),itemName:"",qty:1}]});
  };
  const updBreakdownItem=(setId,itemId,k,v)=>{
    const prev = (sd.setBreakdown||{})[setId] || [];
    upd("setBreakdown",{...(sd.setBreakdown||{}),[setId]:prev.map(x=>x.id===itemId?{...x,[k]:v}:x)});
  };
  const delBreakdownItem=(setId,itemId)=>{
    const prev = (sd.setBreakdown||{})[setId] || [];
    upd("setBreakdown",{...(sd.setBreakdown||{}),[setId]:prev.filter(x=>x.id!==itemId)});
  };

  const scDef = product.scenarioDefs.find(s=>s.id===activeScenarioId);
  const forecast = calcRangePL(product, monthsInRange, activeScenarioId, true);
  const actual   = calcRangePL(product, monthsInRange, activeScenarioId, false);

  // 月別進捗データ計算
  const monthlyProgress = monthsInRange.map(({key, year, month}) => {
    const msd = product.months[key]?.scenarios?.[activeScenarioId];
    const fPL = calcPL(msd, true);
    const aPL = calcPL(msd, false);
    return { key, year, month, fPL, aPL };
  });

  // 達成見通し計算（このペースだと期間終了時にいくら？）
  const elapsedMonths = monthlyProgress.filter(m => m.aPL.revenue > 0).length;
  const remainMonths = monthsInRange.length - elapsedMonths;
  const avgActualRev = elapsedMonths > 0 ? actual.revenue / elapsedMonths : 0;
  const avgActualOp  = elapsedMonths > 0 ? actual.operatingProfit / elapsedMonths : 0;
  const projectedRev = actual.revenue + avgActualRev * remainMonths;
  const projectedOp  = actual.operatingProfit + avgActualOp * remainMonths;

  return (
    <div>
      {/* パターン比較（展開時） */}
      {showCompare && <ScenarioCompareTable product={product} monthsInRange={monthsInRange}/>}

      <KPIRow forecast={forecast} actual={actual} sd={sd} actuals={actuals}/>

      {/* 累積進捗セクション（複数月選択時のみ表示） */}
      {monthsInRange.length > 1 && (
        <div className="bep-box" style={{marginBottom:24}}>
          <div className="bep-title">📈 累積進捗（{monthsInRange.length}ヶ月）</div>

          {/* 累積比較表 */}
          <div style={{overflowX:"auto",marginBottom:20}}>
            <table className="cmp-t">
              <thead>
                <tr>
                  <th style={{textAlign:"left"}}>項目</th>
                  <th style={{color: product.scenarioDefs.find(s=>s.id==="patternA")?.color||"#60b0f0"}}>
                    {product.scenarioDefs.find(s=>s.id==="patternA")?.name||"予測A"}
                  </th>
                  <th style={{color: product.scenarioDefs.find(s=>s.id==="patternB")?.color||"#f8d060"}}>
                    {product.scenarioDefs.find(s=>s.id==="patternB")?.name||"予測B"}
                  </th>
                  <th style={{color:"#7ef880"}}>実績</th>
                  <th style={{color:"rgba(255,255,255,0.4)"}}>達成率(A比)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {l:"売上",       k:"revenue"},
                  {l:"粗利",       k:"grossProfit"},
                  {l:"変動費",     k:"variableTotal"},
                  {l:"固定費",     k:"fixedTotal"},
                  {l:"営業利益",   k:"operatingProfit", hl:true},
                ].map(r=>{
                  const plA = calcRangePL(product, monthsInRange, "patternA", true);
                  const plB = calcRangePL(product, monthsInRange, "patternB", true);
                  const rate = plA[r.k] !== 0 ? (actual[r.k] / plA[r.k] * 100) : null;
                  const rateColor = rate == null ? "rgba(255,255,255,0.3)" : rate >= 100 ? "#7ef880" : rate >= 70 ? "#f8d060" : "#f87870";
                  return (
                    <tr key={r.l} style={r.hl?{background:"rgba(255,255,255,0.04)"}:{}}>
                      <td style={{fontWeight:r.hl?700:400,color:r.hl?"#fff":"rgba(255,255,255,0.75)"}}>{r.l}</td>
                      <td style={{color:"rgba(255,255,255,0.9)"}}>{fmt(plA[r.k])}</td>
                      <td style={{color:"rgba(255,255,255,0.9)"}}>{fmt(plB[r.k])}</td>
                      <td style={{color:r.hl?(actual[r.k]>=0?"#7ef880":"#f87870"):"rgba(255,255,255,0.85)",fontWeight:r.hl?700:400}}>{fmt(actual[r.k])}</td>
                      <td style={{color:rateColor,fontWeight:600}}>{rate!=null?rate.toFixed(1)+"%":"—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 達成率バー（売上・営業利益） */}
          <div className="bep-row" style={{display:"flex",flexWrap:"wrap",gap:20,marginBottom:20}}>
            {[
              {l:"売上達成率（vs 予測A）", act:actual.revenue,       tgt:calcRangePL(product,monthsInRange,"patternA",true).revenue},
              {l:"営業利益達成率（vs 予測A）", act:actual.operatingProfit, tgt:calcRangePL(product,monthsInRange,"patternA",true).operatingProfit},
            ].map((it,i)=>{
              const p = it.tgt > 0 ? Math.min((it.act/it.tgt)*100, 150) : 0;
              const surplus = it.act - it.tgt;
              const bc = p>=100?"#7ef880":p>=70?"#f8d060":"#f87870";
              return (
                <div className="bep-item" key={i} style={{flex:1,minWidth:200}}>
                  <div className="bep-item-label">{it.l}</div>
                  <div className="bep-item-val" style={{color:bc}}>
                    {p.toFixed(1)}%
                    <span style={{fontSize:12,marginLeft:8,color:surplus>=0?"#7ef880":"#f87870"}}>
                      ({surplus>=0?"+":""}{fmt(surplus)})
                    </span>
                  </div>
                  <div className="bep-bar-bg"><div className="bep-bar-fg" style={{width:`${Math.min(p,100)}%`,background:bc}}/></div>
                </div>
              );
            })}
          </div>

          {/* 達成見通し */}
          {elapsedMonths > 0 && (
            <div style={{padding:"12px 16px",background:"rgba(255,255,255,0.04)",borderRadius:10,border:"1px solid rgba(255,255,255,0.1)"}}>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.5)",marginBottom:8}}>
                📊 このペースでの期間終了時見通し（経過{elapsedMonths}ヶ月 / 残り{remainMonths}ヶ月）
              </div>
              <div style={{display:"flex",gap:24,flexWrap:"wrap"}}>
                <div>
                  <span style={{fontSize:12,color:"rgba(255,255,255,0.45)"}}>売上見通し: </span>
                  <span style={{fontSize:15,fontWeight:700,color:"#7ec8f8"}}>{fmt(projectedRev)}</span>
                  <span style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginLeft:6}}>
                    (予測A: {fmt(calcRangePL(product,monthsInRange,"patternA",true).revenue)})
                  </span>
                </div>
                <div>
                  <span style={{fontSize:12,color:"rgba(255,255,255,0.45)"}}>営業利益見通し: </span>
                  <span style={{fontSize:15,fontWeight:700,color:projectedOp>=0?"#7ef880":"#f87870"}}>{fmt(projectedOp)}</span>
                  <span style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginLeft:6}}>
                    (予測A: {fmt(calcRangePL(product,monthsInRange,"patternA",true).operatingProfit)})
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 月別進捗バー（複数月選択時のみ表示） */}
      {monthsInRange.length > 1 && (
        <div className="bep-box" style={{marginBottom:24}}>
          <div className="bep-title">📅 月別進捗</div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",minWidth:500}}>
              <thead>
                <tr>
                  <th style={{textAlign:"left",padding:"6px 10px",fontSize:12,color:"rgba(255,255,255,0.5)",fontWeight:600}}>月</th>
                  <th style={{textAlign:"right",padding:"6px 10px",fontSize:12,color:"#60b0f0",fontWeight:600}}>予測A売上</th>
                  <th style={{textAlign:"right",padding:"6px 10px",fontSize:12,color:"#7ef880",fontWeight:600}}>実績売上</th>
                  <th style={{padding:"6px 10px",fontSize:12,color:"rgba(255,255,255,0.5)",fontWeight:600,width:160}}>達成率</th>
                  <th style={{textAlign:"right",padding:"6px 10px",fontSize:12,color:"#60b0f0",fontWeight:600}}>予測A営利</th>
                  <th style={{textAlign:"right",padding:"6px 10px",fontSize:12,color:"#7ef880",fontWeight:600}}>実績営利</th>
                </tr>
              </thead>
              <tbody>
                {monthlyProgress.map(({key,year,month,fPL,aPL})=>{
                  const plA = calcPL(product.months[key]?.scenarios?.["patternA"], true);
                  const rate = plA.revenue > 0 ? Math.min((aPL.revenue/plA.revenue)*100,150) : 0;
                  const bc = rate>=100?"#7ef880":rate>=70?"#f8d060":"#f87870";
                  const hasData = aPL.revenue > 0;
                  return (
                    <tr key={key} style={{borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                      <td style={{padding:"8px 10px",fontSize:13,color:"rgba(255,255,255,0.7)",fontWeight:600,whiteSpace:"nowrap"}}>
                        {year}年{MONTHS[month]}
                      </td>
                      <td style={{textAlign:"right",padding:"8px 10px",fontSize:13,color:"rgba(255,255,255,0.6)",fontVariantNumeric:"tabular-nums"}}>{fmt(plA.revenue)}</td>
                      <td style={{textAlign:"right",padding:"8px 10px",fontSize:13,color:hasData?"#7ef880":"rgba(255,255,255,0.2)",fontVariantNumeric:"tabular-nums",fontWeight:hasData?600:400}}>
                        {hasData?fmt(aPL.revenue):"—"}
                      </td>
                      <td style={{padding:"8px 10px"}}>
                        {hasData?(
                          <div style={{display:"flex",alignItems:"center",gap:6}}>
                            <div style={{flex:1,height:8,background:"rgba(255,255,255,0.1)",borderRadius:4,overflow:"hidden"}}>
                              <div style={{width:`${Math.min(rate,100)}%`,height:"100%",background:bc,borderRadius:4}}/>
                            </div>
                            <span style={{fontSize:12,color:bc,fontWeight:600,whiteSpace:"nowrap",minWidth:40}}>{rate.toFixed(0)}%</span>
                          </div>
                        ):<span style={{fontSize:11,color:"rgba(255,255,255,0.2)"}}>未入力</span>}
                      </td>
                      <td style={{textAlign:"right",padding:"8px 10px",fontSize:13,color:"rgba(255,255,255,0.6)",fontVariantNumeric:"tabular-nums"}}>{fmt(plA.operatingProfit)}</td>
                      <td style={{textAlign:"right",padding:"8px 10px",fontSize:13,color:hasData?(aPL.operatingProfit>=0?"#7ef880":"#f87870"):"rgba(255,255,255,0.2)",fontVariantNumeric:"tabular-nums",fontWeight:hasData?600:400}}>
                        {hasData?fmt(aPL.operatingProfit):"—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className="pl-grid">
        <PLTable pl={forecast} label={scDef?.name ?? "予測"} cls="fc" scColor={scDef?.color}/>
        <PLTable pl={actual}   label="実績" cls="ac"/>
      </div>
      <BEPSection sd={sd}/>

      {/* セット設定 */}
      <div className="sec">
        <div className="sec-ttl">
          <span>① セット・価格設定</span>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {/* 予測販売数モード切り替え */}
            <div style={{display:"flex",gap:0,borderRadius:6,overflow:"hidden",border:"1px solid rgba(255,255,255,0.2)"}}>
              {[["manual","手動入力"],["ratio","全体×割合"]].map(([m,l])=>(
                <button key={m} onClick={()=>upd("forecastMode",m)}
                  style={{padding:"4px 10px",fontSize:11,fontWeight:600,border:"none",cursor:"pointer",fontFamily:"'Noto Sans JP',sans-serif",
                    background:(sd.forecastMode||"manual")===m?"#c8a020":"rgba(255,255,255,0.06)",
                    color:(sd.forecastMode||"manual")===m?"#000":"rgba(255,255,255,0.5)"}}>
                  {l}
                </button>
              ))}
            </div>
            {(sd.forecastMode||"manual")==="ratio" && (
              <div style={{display:"flex",alignItems:"center",gap:4}}>
                <span style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>全体:</span>
                <input className="inp sm" type="text" value={fmtNum(sd.forecastTotal||0)}
                  onChange={e=>updForecastTotal(e.target.value)}
                  style={{width:80}}/>
                <span style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>件</span>
              </div>
            )}
            <button className="btn btn-a" onClick={addSet}>+ セット追加</button>
          </div>
        </div>
        <table className="it">
          <thead>
            <tr>
              <th>セット名</th><th>販売価格（¥）</th>
              <th>予測販売数{(sd.forecastMode||"manual")==="ratio"&&<span style={{color:"#f8d060",fontSize:10,marginLeft:4}}>（割合%）</span>}</th>
              <th>実績販売数</th>
              <th>予測売上</th><th>実績売上</th>
              <th style={{color:"#a0e8c8"}}>予測貢献利益</th><th style={{color:"#a0e8c8"}}>予測1件利益</th>
              <th style={{color:"#c8e8a0"}}>実績貢献利益</th><th style={{color:"#c8e8a0"}}>実績1件利益</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sd.sets.map(s=>{
              const price=sd.setPrices[s.id]||0;
              const fQty=sd.forecastSales[s.id]||0;
              const aQty = actuals.actualSales?.[s.id] || 0;
              // 変動費単価合計（固定率のものは販売価格ベースで計算）
              const varUnitCost = sd.variableCosts.reduce((sum,r)=>{
                if(r.isPercent) return sum + price*r.pctRate;
                const qty = fQty > 0 ? (r.forecastQty||0)/fQty : 0;
                return sum + r.unitCost * qty;
              }, 0);
              const aVarUnitCost = sd.variableCosts.reduce((sum,r)=>{
                if(r.isPercent) return sum + price*r.pctRate;
                const aqty = actuals.varActualQtys?.[r.id] != null ? actuals.varActualQtys[r.id] : aQty;
                const qty = aQty > 0 ? aqty/aQty : 0;
                return sum + r.unitCost * qty;
              }, 0);
              const fCostRatio = sd.setCosts?.[s.id]?.isPercent !== false
                ? (sd.setCosts?.[s.id]?.rate ?? sd.costRatio)
                : (price > 0 ? (sd.setCosts[s.id].amount / price) : sd.costRatio);
              const fUnitProfit = price*(1-fCostRatio) - varUnitCost;
              const aUnitProfit = price*(1-fCostRatio) - aVarUnitCost;
              const fContrib = fUnitProfit * fQty;
              const aContrib = aUnitProfit * aQty;
              return (
                <tr key={s.id}>
                  <td><input className="inp nm" value={s.name} onChange={e=>updSet(s.id,"name",e.target.value)}/></td>
                  <td><input className="inp sm" type="text" value={fmtNum(price)} onChange={e=>updPrice(s.id,String(e.target.value).replace(/,/g,""))}/></td>
                  <td>
                    {(sd.forecastMode||"manual")==="ratio" ? (
                      <div style={{display:"flex",alignItems:"center",gap:3}}>
                        <input className="inp sm" type="text" value={(sd.forecastRatios||{})[s.id]||0}
                          onChange={e=>updForecastRatio(s.id,e.target.value)}
                          style={{width:48}}/>
                        <span style={{fontSize:11,color:"#f8d060"}}>%</span>
                        <span style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginLeft:2}}>=</span>
                        <span style={{fontSize:12,color:"#7ec8f8",fontWeight:600}}>{fmtNum(fQty)}件</span>
                      </div>
                    ) : (
                      <input className="inp sm" type="text" value={fmtNum(fQty)} onChange={e=>updFC(s.id,String(e.target.value).replace(/,/g,""))}/>
                    )}
                  </td>
                  <td><input className="inp sm" type="text" value={fmtNum(aQty)} onChange={e=>updAC(s.id,String(e.target.value).replace(/,/g,""))}/></td>
                  <td style={{color:"#7ec8f8",fontVariantNumeric:"tabular-nums",fontSize:14,fontWeight:600}}>{fmt(price*fQty)}</td>
                  <td style={{color:"#7ef880",fontVariantNumeric:"tabular-nums",fontSize:14,fontWeight:600}}>{fmt(price*aQty)}</td>
                  <td style={{color:fContrib>=0?"#a0e8c8":"#f87870",fontVariantNumeric:"tabular-nums",fontSize:14,fontWeight:700}}>{fmt(fContrib)}</td>
                  <td style={{color:fUnitProfit>=0?"#a0e8c8":"#f87870",fontVariantNumeric:"tabular-nums",fontSize:13,fontWeight:600}}>{fmt(fUnitProfit)}</td>
                  <td style={{color:aContrib>=0?"#c8e8a0":"#f87870",fontVariantNumeric:"tabular-nums",fontSize:14,fontWeight:700}}>{fmt(aContrib)}</td>
                  <td style={{color:aUnitProfit>=0?"#c8e8a0":"#f87870",fontVariantNumeric:"tabular-nums",fontSize:13,fontWeight:600}}>{fmt(aUnitProfit)}</td>
                  <td><button className="btn btn-d" onClick={()=>delSet(s.id)}>✕</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ①-B セット内訳（商品別数量管理） */}
      <div className="sec">
        <div className="sec-ttl"><span>①-B セット内訳（商品別数量）</span></div>
        <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
          {sd.sets.map(s=>{
            const breakdown = (sd.setBreakdown||{})[s.id] || [];
            const fQty = sd.forecastSales[s.id]||0;
            const aQty = actuals.actualSales?.[s.id]||0;
            return (
              <div key={s.id} style={{flex:"1 1 220px",minWidth:200,background:"rgba(255,255,255,0.04)",
                border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,padding:"12px 14px"}}>
                <div style={{fontSize:13,fontWeight:700,color:"#e8d080",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span>{s.name}</span>
                  <button className="btn btn-a" style={{fontSize:11,padding:"3px 8px"}}
                    onClick={()=>addBreakdownItem(s.id)}>+ 追加</button>
                </div>
                {breakdown.length === 0
                  ? <div style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>内訳未登録</div>
                  : breakdown.map(item=>(
                    <div key={item.id} style={{display:"flex",alignItems:"center",gap:5,marginBottom:5}}>
                      <input className="inp" value={item.itemName}
                        onChange={e=>updBreakdownItem(s.id,item.id,"itemName",e.target.value)}
                        placeholder="商品名（例:鰻の蒲焼き）"
                        style={{flex:1,fontSize:12,padding:"4px 7px"}}/>
                      <input className="inp sm" type="text" value={fmtNum(item.qty)}
                        onChange={e=>updBreakdownItem(s.id,item.id,"qty",Number(String(e.target.value).replace(/,/g,"")))}
                        style={{width:48,fontSize:12,padding:"4px 6px"}}/>
                      <span style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>尾/個</span>
                      <button className="btn btn-d" style={{padding:"3px 7px",fontSize:11}}
                        onClick={()=>delBreakdownItem(s.id,item.id)}>✕</button>
                    </div>
                  ))
                }
                {breakdown.length > 0 && (
                  <div style={{marginTop:6,paddingTop:6,borderTop:"1px solid rgba(255,255,255,0.08)",fontSize:12,lineHeight:1.7}}>
                    <div>
                      <span style={{color:"rgba(255,255,255,0.4)"}}>予測: </span>
                      {breakdown.map((x,i)=>(
                        <span key={i} style={{color:"#7ec8f8",fontWeight:600,marginRight:6}}>
                          {x.itemName||"?"}×{(x.qty*fQty).toLocaleString("ja-JP")}
                        </span>
                      ))}
                    </div>
                    {aQty > 0 && (
                      <div>
                        <span style={{color:"rgba(255,255,255,0.4)"}}>実績: </span>
                        {breakdown.map((x,i)=>(
                          <span key={i} style={{color:"#7ef880",fontWeight:600,marginRight:6}}>
                            {x.itemName||"?"}×{(x.qty*aQty).toLocaleString("ja-JP")}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 商品別合計サマリー */}
        {(()=>{
          const totals = {};
          sd.sets.forEach(s=>{
            const bd = (sd.setBreakdown||{})[s.id]||[];
            const fQty = sd.forecastSales[s.id]||0;
            const aQty = actuals.actualSales?.[s.id]||0;
            bd.forEach(item=>{
              const k = item.itemName||"未設定";
              if(!totals[k]) totals[k]={f:0,a:0};
              totals[k].f += item.qty*fQty;
              totals[k].a += item.qty*aQty;
            });
          });
          const entries = Object.entries(totals);
          if(!entries.length) return null;
          return (
            <div style={{marginTop:14,padding:"12px 16px",background:"rgba(255,255,255,0.06)",borderRadius:10,border:"1px solid rgba(255,255,255,0.12)"}}>
              <div style={{fontSize:13,fontWeight:700,color:"#e8d080",marginBottom:10}}>📦 商品別合計数量</div>
              <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
                {entries.map(([name,v])=>(
                  <div key={name} style={{display:"flex",alignItems:"baseline",gap:6,flexWrap:"wrap"}}>
                    <span style={{fontSize:13,color:"rgba(255,255,255,0.7)",fontWeight:600}}>{name}:</span>
                    <span style={{fontSize:14,color:"#7ec8f8",fontWeight:700}}>{v.f.toLocaleString("ja-JP")} <span style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>予測</span></span>
                    {v.a > 0 && <span style={{fontSize:14,color:"#7ef880",fontWeight:700}}>{v.a.toLocaleString("ja-JP")} <span style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>実績</span></span>}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* ①.5 セット別原価設定 */}
      <div className="sec">
        <div className="sec-ttl"><span>①-② セット別原価設定</span></div>
        <table className="it">
          <thead>
            <tr>
              <th>セット名</th>
              <th>原価入力方式</th>
              <th>原価率 / 原価額（1個）</th>
              <th>予測 原価合計</th>
              <th>実績 原価合計</th>
              <th>予測 粗利</th>
              <th>実績 粗利</th>
            </tr>
          </thead>
          <tbody>
            {sd.sets.map(s=>{
              const price  = sd.setPrices[s.id] || 0;
              const fQty   = sd.forecastSales[s.id] || 0;
              const aQty   = actuals.actualSales?.[s.id] || 0;
              const sc     = sd.setCosts?.[s.id] || {isPercent:true, rate:sd.costRatio||0.5, amount:0};
              const fRev   = price * fQty;
              const aRev   = price * aQty;
              const fCogs  = sc.isPercent ? fRev * sc.rate : sc.amount * fQty;
              const aCogs  = sc.isPercent ? aRev * sc.rate : sc.amount * aQty;
              const fGp    = fRev - fCogs;
              const aGp    = aRev - aCogs;
              const dispRate = sc.isPercent ? (sc.rate*100).toFixed(1) : price>0?((sc.amount/price)*100).toFixed(1):"—";
              return (
                <tr key={s.id}>
                  <td style={{color:"rgba(255,255,255,0.8)",fontWeight:600}}>{s.name}</td>
                  <td>
                    <button className={`pct-toggle ${sc.isPercent?"on":"off"}`}
                      onClick={()=>updSetCost(s.id,"isPercent",!sc.isPercent)}
                      style={{minWidth:36}}>
                      {sc.isPercent ? "%" : "¥"}
                    </button>
                  </td>
                  <td>
                    {sc.isPercent ? (
                      <span style={{display:"flex",alignItems:"center",gap:4}}>
                        <input className="inp sm" type="number" step="0.1"
                          value={Math.round(sc.rate*1000)/10}
                          onChange={e=>updSetCost(s.id,"rate",Number(e.target.value)/100)}
                          style={{width:72}}/>
                        <span style={{fontSize:12,color:"#f8d060"}}>%</span>
                        <span style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginLeft:2}}>
                          ({fmt(price>0?price*sc.rate:0)}/個)
                        </span>
                      </span>
                    ) : (
                      <span style={{display:"flex",alignItems:"center",gap:4}}>
                        <input className="inp sm" type="text"
                          value={fmtNum(sc.amount)}
                          onChange={e=>updSetCost(s.id,"amount",String(e.target.value).replace(/,/g,""))}
                          style={{width:92}}/>
                        <span style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>
                          ({dispRate}%)
                        </span>
                      </span>
                    )}
                  </td>
                  <td style={{color:"#7ec8f8",fontWeight:600,fontVariantNumeric:"tabular-nums"}}>{fmt(fCogs)}</td>
                  <td style={{color:"#7ef880",fontWeight:600,fontVariantNumeric:"tabular-nums"}}>{fmt(aCogs)}</td>
                  <td style={{color:fGp>=0?"#a0e8c8":"#f87870",fontWeight:700,fontVariantNumeric:"tabular-nums"}}>{fmt(fGp)}</td>
                  <td style={{color:aGp>=0?"#c8e8a0":"#f87870",fontWeight:700,fontVariantNumeric:"tabular-nums"}}>{fmt(aGp)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {/* 合計行 */}
        {(() => {
          const totFCogs = sd.sets.reduce((t,s)=>{
            const price=sd.setPrices[s.id]||0, fQty=sd.forecastSales[s.id]||0;
            const sc=sd.setCosts?.[s.id]||{isPercent:true,rate:sd.costRatio||0.5,amount:0};
            return t+(sc.isPercent?price*fQty*sc.rate:sc.amount*fQty);
          },0);
          const totACogs = sd.sets.reduce((t,s)=>{
            const price=sd.setPrices[s.id]||0, aQty=actuals.actualSales?.[s.id]||0;
            const sc=sd.setCosts?.[s.id]||{isPercent:true,rate:sd.costRatio||0.5,amount:0};
            return t+(sc.isPercent?price*aQty*sc.rate:sc.amount*aQty);
          },0);
          const totFRev = sd.sets.reduce((t,s)=>{const p=sd.setPrices[s.id]||0,q=sd.forecastSales[s.id]||0;return t+p*q;},0);
          const totARev = sd.sets.reduce((t,s)=>{const p=sd.setPrices[s.id]||0,q=actuals.actualSales?.[s.id]||0;return t+p*q;},0);
          return (
            <div style={{display:"flex",gap:20,marginTop:10,padding:"10px 12px",background:"rgba(255,255,255,0.04)",borderRadius:8,flexWrap:"wrap"}}>
              <span style={{fontSize:13,color:"rgba(255,255,255,0.5)"}}>合計:</span>
              <span style={{fontSize:13}}>予測原価 <strong style={{color:"#7ec8f8"}}>{fmt(totFCogs)}</strong></span>
              <span style={{fontSize:13}}>予測粗利 <strong style={{color:"#a0e8c8"}}>{fmt(totFRev-totFCogs)}</strong>
                <span style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginLeft:4}}>({totFRev>0?((totFRev-totFCogs)/totFRev*100).toFixed(1):0}%)</span>
              </span>
              <span style={{fontSize:13}}>実績原価 <strong style={{color:"#7ef880"}}>{fmt(totACogs)}</strong></span>
              <span style={{fontSize:13}}>実績粗利 <strong style={{color:"#c8e8a0"}}>{fmt(totARev-totACogs)}</strong>
                <span style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginLeft:4}}>({totARev>0?((totARev-totACogs)/totARev*100).toFixed(1):0}%)</span>
              </span>
            </div>
          );
        })()}
      </div>

      {/* 変動費（②） */}
      <div className="sec">
        <div className="sec-ttl"><span>② 変動費（販管費）</span><button className="btn btn-a" onClick={addVar}>+ 行追加</button></div>
        <table className="it">
          <thead>
            <tr>
              <th>勘定科目</th><th>単価/率</th><th>%?</th>
              <th>予測件数</th><th>実績件数</th>
              <th>予測計</th><th>実績計</th><th></th>
            </tr>
          </thead>
          <tbody>
            {sd.variableCosts.map(r=>{
              // 空白(null/undefined/-1)なら①の合計販売数を使用
              const totalFcastQty = sd.sets.reduce((s,x)=>s+(sd.forecastSales[x.id]||0),0);
              // 実績はactualsから取得（予測タブ独立）
              const totalActQty   = sd.sets.reduce((s,x)=>s+(actuals.actualSales?.[x.id]||0),0);
              const effFcastQty = (r.forecastQty==null||r.forecastQty===""||r.forecastQty===-1) ? totalFcastQty : r.forecastQty;
              const effActQty   = (r.actualQty==null||r.actualQty===""||r.actualQty===-1) ? totalActQty   : r.actualQty;
              // 実績売上を単月データから計算
              const actualRevenue = sd.sets.reduce((s,x)=>s+(sd.setPrices[x.id]||0)*(actuals.actualSales?.[x.id]||0),0);
              const fTotal = r.isPercent ? forecast.revenue*r.pctRate : r.unitCost*effFcastQty;
              const aTotal = r.isPercent ? actualRevenue*r.pctRate   : r.unitCost*effActQty;
              return (
                <tr key={r.id}>
                  <td><input className="inp md" value={r.account} onChange={e=>updVar(r.id,"account",e.target.value)} placeholder="勘定科目"/></td>
                  <td>
                    {r.isPercent
                      ? <span style={{display:"flex",alignItems:"center",gap:4}}>
                          <input className="inp sm" type="number" value={(r.pctRate*100).toFixed(1)} step="0.1"
                            onChange={e=>updVar(r.id,"pctRate",Number(e.target.value)/100)}
                            style={{width:60}}/>
                          <span style={{fontSize:12,color:"#f8d060"}}>%</span>
                        </span>
                      : <input className="inp sm" type="text" value={fmtNum(r.unitCost)}
                          onChange={e=>updVar(r.id,"unitCost",String(e.target.value).replace(/,/g,""))}/>
                    }
                  </td>
                  <td>
                    <button className={`pct-toggle ${r.isPercent?"on":"off"}`}
                      onClick={()=>updVar(r.id,"isPercent",!r.isPercent)}>
                      {r.isPercent?"%":"¥"}
                    </button>
                  </td>
                  {r.isPercent ? (
                    <>
                      <td style={{color:"rgba(255,255,255,0.3)",fontSize:11}}>—</td>
                      <td style={{color:"rgba(255,255,255,0.3)",fontSize:11}}>—</td>
                    </>
                  ) : (
                    <>
                      <td>
                        <input className="inp sm" type="number"
                          value={(r.forecastQty==null||r.forecastQty===-1)?"":r.forecastQty}
                          placeholder={String(totalFcastQty)}
                          onChange={e=>updVar(r.id,"forecastQty", e.target.value===""?null:Number(e.target.value))}/>
                      </td>
                      <td>
                        <input className="inp sm" type="number"
                          value={(actuals.varActualQtys?.[r.id]==null)?"":actuals.varActualQtys[r.id]}
                          placeholder={String(totalActQty)}
                          onChange={e=>updVar(r.id,"actualQty", e.target.value===""?null:Number(e.target.value))}/>
                      </td>
                    </>
                  )}
                  <td style={{color:"#7ec8f8",fontSize:13,fontWeight:600}}>{fmt(fTotal)}</td>
                  <td style={{color:"#7ef880",fontSize:13,fontWeight:600}}>{fmt(aTotal)}</td>
                  <td><button className="btn btn-d" onClick={()=>delVar(r.id)}>✕</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginTop:6,paddingLeft:4}}>
          ※ 予測件数・実績件数を空欄にすると①の販売数合計が自動連動します
        </div>
      </div>

      {/* 固定費（③） */}
      <div className="sec">
        <div className="sec-ttl"><span>③ 固定費（販管費）</span><button className="btn btn-a" onClick={addFixed}>+ 行追加</button></div>
        <table className="it">
          <thead><tr><th>勘定科目</th><th>予測（¥）</th><th>実績（¥）</th><th></th></tr></thead>
          <tbody>
            {sd.fixedCosts.map(r=>(
              <tr key={r.id}>
                <td><input className="inp md" value={r.account} onChange={e=>updFixed(r.id,"account",e.target.value)} placeholder="勘定科目"/></td>
                <td><input className="inp sm" type="text" value={fmtNum(r.forecast)} onChange={e=>updFixed(r.id,"forecast",String(e.target.value).replace(/,/g,""))}/></td>
                <td><input className="inp sm" type="text" value={fmtNum(actuals.fixedActuals?.[r.id]??r.forecast)} onChange={e=>updFixed(r.id,"actual",String(e.target.value).replace(/,/g,""))}/></td>
                <td><button className="btn btn-d" onClick={()=>delFixed(r.id)}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ④ 貢献利益（セット別） */}
      <div className="sec">
        <div className="sec-ttl"><span>④ 貢献利益（セット別）</span></div>
        <div className="contrib-section">
          {sd.sets.map(s=>{
            const price  = sd.setPrices[s.id]||0;
            const fQty   = sd.forecastSales[s.id]||0;
            const aQty   = actuals.actualSales?.[s.id]||0;
            const fRev   = price * fQty;
            const aRev   = price * aQty;
            const sc2    = sd.setCosts?.[s.id];
            const cRatio = sc2 ? (sc2.isPercent ? sc2.rate : (price>0?sc2.amount/price:sd.costRatio)) : sd.costRatio;
            const fCogs  = fRev * cRatio;
            const aCogs  = aRev * cRatio;
            const fGP    = fRev - fCogs;
            const aGP    = aRev - aCogs;
            const totalFcastQty = sd.sets.reduce((sum,x)=>sum+(sd.forecastSales[x.id]||0),0);
            const totalActQty   = sd.sets.reduce((sum,x)=>sum+(actuals.actualSales?.[x.id]||0),0);
            // 変動費の各行をセット別に按分計算
            const varRows = sd.variableCosts.map(r=>{
              let fAmt, aAmt;
              if(r.isPercent){
                fAmt = fRev * r.pctRate;
                aAmt = aRev * r.pctRate;  // 実績売上に対して%計算
              } else {
                const effFQ = (r.forecastQty==null||r.forecastQty===""||r.forecastQty===-1) ? totalFcastQty : r.forecastQty;
                const effAQ = (r.actualQty==null||r.actualQty===""||r.actualQty===-1)     ? totalActQty   : r.actualQty;
                // セット割合で按分
                const fShare = totalFcastQty>0 ? fQty/totalFcastQty : (fQty>0?1:0);
                const aShare = totalActQty>0   ? aQty/totalActQty   : (aQty>0?1:0);
                fAmt = r.unitCost * effFQ * fShare;
                aAmt = r.unitCost * effAQ * aShare;
              }
              return {account:r.account, fAmt, aAmt};
            });
            const fVarTotal = varRows.reduce((s,r)=>s+r.fAmt,0);
            const aVarTotal = varRows.reduce((s,r)=>s+r.aAmt,0);
            const fContrib  = fGP - fVarTotal;
            const aContrib  = aGP - aVarTotal;
            const fRate = fRev>0 ? fContrib/fRev : 0;
            const aRate = aRev>0 ? aContrib/aRev : 0;
            return (
              <div className="contrib-set" key={s.id}>
                <div className="contrib-set-hdr">
                  <span>{s.name}</span>
                  <span style={{fontSize:12,color:fQty>0?"rgba(255,255,255,0.5)":"#f87870"}}>予測 {fQty}件</span>
                  <span style={{fontSize:12,color:aQty>0?"rgba(255,255,255,0.5)":"#f87870"}}>実績 {aQty}件</span>
                </div>
                <table className="contrib-t">
                  <thead>
                    <tr>
                      <th style={{textAlign:"left",width:"40%"}}>項目</th>
                      <th style={{color:"#7ec8f8"}}>予測</th>
                      <th style={{color:"#7ef880"}}>実績</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td>売上</td><td style={{color:"#7ec8f8",fontWeight:600}}>{fmt(fRev)}</td><td style={{color:"#7ef880",fontWeight:600}}>{fmt(aRev)}</td></tr>
                    <tr><td>原価</td><td style={{color:"rgba(255,255,255,0.65)"}}>△{fmt(fCogs)}</td><td style={{color:"rgba(255,255,255,0.65)"}}>△{fmt(aCogs)}</td></tr>
                    <tr className="contrib-subtotal"><td>粗利</td><td style={{color:"#b8d8f8"}}>{fmt(fGP)}</td><td style={{color:"#b8f8b0"}}>{fmt(aGP)}</td></tr>
                    <tr><td colSpan={3} style={{padding:"6px 14px 2px",fontSize:11,color:"rgba(255,255,255,0.4)",textAlign:"left"}}>─ 変動費内訳 ─</td></tr>
                    {varRows.map((r,i)=>(
                      <tr key={i} className="contrib-sub">
                        <td>{r.account||"（科目名未設定）"}</td>
                        <td style={{color:"rgba(200,220,255,0.8)"}}>△{fmt(r.fAmt)}</td>
                        <td style={{color:"rgba(180,255,180,0.8)"}}>△{fmt(r.aAmt)}</td>
                      </tr>
                    ))}
                    <tr className="contrib-subtotal">
                      <td>変動費合計</td>
                      <td style={{color:"#e8c880"}}>△{fmt(fVarTotal)}</td>
                      <td style={{color:"#c8e880"}}>△{fmt(aVarTotal)}</td>
                    </tr>
                    <tr className="contrib-result">
                      <td>貢献利益</td>
                      <td style={{color:fContrib>=0?"#7ef880":"#f87870"}}>
                        {fmt(fContrib)}
                        <span className="contrib-rate">({(fRate*100).toFixed(1)}%)</span>
                      </td>
                      <td style={{color:aContrib>=0?"#7ef880":"#f87870"}}>
                        {fmt(aContrib)}
                        <span className="contrib-rate">({(aRate*100).toFixed(1)}%)</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  SummaryTab
// ════════════════════════════════════════════════════════════
function SummaryTab({products, monthsInRange, activeScenarioId}) {
  const pls = products.map(p=>({
    label:p.label,emoji:p.emoji,
    fc:calcRangePL(p,monthsInRange,activeScenarioId,true),
    ac:calcRangePL(p,monthsInRange,activeScenarioId,false),
  }));
  const sumFC={revenue:0,cogs:0,grossProfit:0,fixedTotal:0,variableTotal:0,sgaTotal:0,operatingProfit:0};
  const sumAC={...sumFC};
  pls.forEach(p=>{Object.keys(sumFC).forEach(k=>{sumFC[k]+=p.fc[k];sumAC[k]+=p.ac[k];});});
  const rows=[{l:"売上",k:"revenue"},{l:"原価",k:"cogs"},{l:"粗利",k:"grossProfit",sub:true},{l:"固定費",k:"fixedTotal"},{l:"変動費",k:"variableTotal"},{l:"販管費合計",k:"sgaTotal",sub:true},{l:"営業利益",k:"operatingProfit",profit:true}];
  return (
    <div>
      <div className="kpi-row">
        {[{l:"全体売上（予測）",v:fmt(sumFC.revenue)},{l:"全体売上（実績）",v:fmt(sumAC.revenue)},{l:"全体粗利（予測）",v:fmt(sumFC.grossProfit)},{l:"全体粗利率",v:pct(sumFC.grossProfit,sumFC.revenue)},{l:"営業利益（予測）",v:fmt(sumFC.operatingProfit),c:sumFC.operatingProfit},{l:"営業利益（実績）",v:fmt(sumAC.operatingProfit),c:sumAC.operatingProfit}].map((it,i)=>(
          <div className="kpi-card" key={i}>
            <div className="kpi-label">{it.l}</div>
            <div className="kpi-f" style={it.c!=null?{color:it.c>=0?"#7ef880":"#f87870"}:{}}>{it.v}</div>
          </div>
        ))}
      </div>
      <div style={{marginBottom:14,fontFamily:"'Noto Serif JP',serif",fontSize:17,color:"#9888f8",fontWeight:600}}>商品別 PL比較</div>
      <div className="summary-grid">
        {pls.map((p,i)=>(
          <div className="sum-card" key={i}>
            <div className="sum-card-title">{p.emoji} {p.label}</div>
            {rows.map(r=>(
              <div key={r.l} className={`sum-row ${r.profit?(p.fc[r.k]>=0?"green":"red"):""}`}>
                <span style={{fontSize:13,color:"rgba(255,255,255,0.65)"}}>{r.l}</span>
                <span><span style={{color:"#7ec8f8",marginRight:10,fontWeight:600}}>{fmt(p.fc[r.k])}</span><span style={{color:"#7ef880",fontSize:13}}>{fmt(p.ac[r.k])}</span></span>
              </div>
            ))}
          </div>
        ))}
        <div className="sum-card" style={{border:"1px solid #483880",background:"rgba(80,60,140,0.1)"}}>
          <div className="sum-card-title" style={{color:"#9888f8"}}>📊 合計</div>
          {rows.map(r=>(
            <div key={r.l} className={`sum-row ${r.profit?"highlight":""} ${r.profit?(sumFC[r.k]>=0?"green":"red"):""}`}>
              <span style={{fontSize:13,color:"rgba(255,255,255,0.75)"}}>{r.l}</span>
              <span><span style={{color:"#7ec8f8",marginRight:10,fontWeight:600}}>{fmt(sumFC[r.k])}</span><span style={{color:"#7ef880",fontSize:13}}>{fmt(sumAC[r.k])}</span></span>
            </div>
          ))}
        </div>
      </div>
      <div style={{marginBottom:14,fontFamily:"'Noto Serif JP',serif",fontSize:17,color:"#9888f8",fontWeight:600}}>全体 損益計算書</div>
      <div className="pl-grid">
        <PLTable pl={sumFC} label="予測（全商品合計）" cls="fc"/>
        <PLTable pl={sumAC} label="実績（全商品合計）" cls="ac"/>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  App
// ════════════════════════════════════════════════════════════
function PasswordGate({children}) {
  const PW = "sakura1058food";
  const [input, setInput] = useState("");
  const [authed, setAuthed] = useState(()=>sessionStorage.getItem("pl_authed")==="1");
  const [error, setError] = useState(false);
  const submit = () => {
    if(input === PW) { sessionStorage.setItem("pl_authed","1"); setAuthed(true); }
    else { setError(true); setTimeout(()=>setError(false),1500); }
  };
  if(authed) return children;
  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",
      background:"linear-gradient(135deg,#0f0f20,#1a1035)"}}>
      <div style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",
        borderRadius:16,padding:"48px 40px",width:340,textAlign:"center",boxShadow:"0 20px 60px rgba(0,0,0,0.5)"}}>
        <div style={{fontSize:40,marginBottom:16}}>🔒</div>
        <div style={{fontSize:20,fontWeight:700,color:"#fff8e8",marginBottom:6,fontFamily:"'Noto Sans JP',sans-serif"}}>
          EC販売 PLシミュレーター
        </div>
        <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",marginBottom:28}}>パスワードを入力してください</div>
        <input
          type="password"
          value={input}
          onChange={e=>{setInput(e.target.value);}}
          onKeyDown={e=>e.key==="Enter"&&submit()}
          placeholder="パスワード"
          style={{width:"100%",padding:"12px 16px",borderRadius:8,border:`1px solid ${error?"#f87870":"rgba(255,255,255,0.2)"}`,
            background:"rgba(255,255,255,0.08)",color:"#fff",fontSize:15,outline:"none",
            boxSizing:"border-box",fontFamily:"'Noto Sans JP',sans-serif",
            transition:"border 0.2s"}}
        />
        {error && <div style={{color:"#f87870",fontSize:12,marginTop:8}}>パスワードが違います</div>}
        <button onClick={submit}
          style={{marginTop:16,width:"100%",padding:"12px",borderRadius:8,border:"none",
            background:"linear-gradient(90deg,#c8a020,#e8c040)",color:"#000",fontSize:15,
            fontWeight:700,cursor:"pointer",fontFamily:"'Noto Sans JP',sans-serif"}}>
          入力
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const saved = loadState();

  const [products,         setProducts]         = useState(saved?.products ?? INITIAL_PRODUCTS);
  const [activeId,         setActiveId]         = useState(saved?.activeId ?? INITIAL_PRODUCTS[0].id);
  const [startYear,        setStartYear]        = useState(saved?.startYear  ?? today.getFullYear());
  const [startMonth,       setStartMonth]       = useState(saved?.startMonth ?? today.getMonth());
  const [endYear,          setEndYear]          = useState(saved?.endYear    ?? today.getFullYear());
  const [endMonth,         setEndMonth]         = useState(saved?.endMonth   ?? today.getMonth());
  const [activeScenarioId, setActiveScenarioId] = useState(saved?.activeScenarioId ?? "patternA");
  const [showCompare,      setShowCompare]      = useState(false);
  const [isSummary,        setIsSummary]        = useState(false);
  const [showAddProduct,   setShowAddProduct]   = useState(false);
  const [showAddScenario,  setShowAddScenario]  = useState(false);
  const [savedAt,          setSavedAt]          = useState(saved?.savedAt ?? null);
  const [syncing,          setSyncing]          = useState(false);

  const monthsInRange = useMemo(()=>getMonthsInRange(startYear,startMonth,endYear,endMonth),[startYear,startMonth,endYear,endMonth]);

  // 起動時にSupabaseからデータを読み込む
  useEffect(()=>{
    (async()=>{
      setSyncing(true);
      const remote = await loadFromSupabase();
      if(remote){
        setProducts(remote.products);
        setActiveId(remote.activeId ?? INITIAL_PRODUCTS[0].id);
        setStartYear(remote.startYear ?? today.getFullYear());
        setStartMonth(remote.startMonth ?? today.getMonth());
        setEndYear(remote.endYear ?? today.getFullYear());
        setEndMonth(remote.endMonth ?? today.getMonth());
        setActiveScenarioId(remote.activeScenarioId ?? "patternA");
        setSavedAt(remote.savedAt ?? null);
      }
      setSyncing(false);
    })();
  },[]);

  const saveTimer = useRef(null);
  useEffect(()=>{
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(()=>{
      const data = {products,activeId,startYear,startMonth,endYear,endMonth,activeScenarioId};
      saveState(data);
      saveToSupabase(data);
      setSavedAt(new Date().toISOString());
    },900);
    return ()=>clearTimeout(saveTimer.current);
  },[products,activeId,startYear,startMonth,endYear,endMonth,activeScenarioId]);

  // theme は activeProduct 宣言後に定義（下記参照）
  const handleChange = useCallback((updated)=>setProducts(prev=>prev.map(p=>p.id===updated.id?updated:p)),[]);

  const addProduct = (label, emoji, costRatio) => {
    const id = "product_"+Date.now();
    const defs = INITIAL_SCENARIO_DEFS;
    setProducts(prev=>[...prev, makeProduct(id,label,emoji,costRatio,defs)]);
    setActiveId(id); setIsSummary(false);
  };

  const deleteProduct = (id) => {
    setProducts(prev => {
      const next = prev.filter(p => p.id !== id);
      if (next.length === 0) return prev; // 最後の1個は消せない
      return next;
    });
    if (activeId === id) {
      const next = products.filter(p => p.id !== id);
      if (next.length > 0) setActiveId(next[0].id);
      setIsSummary(false);
    }
  };


  const addScenario = (name, color, sy, sm, ey, em) => {
    const id = "sc_"+Date.now();
    setProducts(prev=>prev.map(p=>{
      const newDefs = [...p.scenarioDefs, {id,name,color,
        startYear:sy??today.getFullYear(), startMonth:sm??today.getMonth(),
        endYear:ey??today.getFullYear(), endMonth:em??Math.min(today.getMonth()+2,11)}];
      const newMonths = {...p.months};
      Object.keys(newMonths).forEach(key=>{
        const base = newMonths[key].scenarios["patternA"] ?? makeScenarioData(0.52);
        newMonths[key] = {...newMonths[key], scenarios:{...newMonths[key].scenarios,[id]:JSON.parse(JSON.stringify(base))}};
      });
      return {...p, months:newMonths, scenarioDefs:newDefs};
    }));
    setActiveScenarioId(id);
  };

  const updScenarioPeriod = (scId, field, value) => {
    setProducts(prev=>prev.map(p=>({
      ...p,
      scenarioDefs: p.scenarioDefs.map(s=>s.id===scId?{...s,[field]:value}:s)
    })));
  };

  const deleteScenario = (scId) => {
    if(scId==="patternA"||scId==="patternB") return;
    setProducts(prev=>prev.map(p=>{
      const newMonths={...p.months};
      Object.keys(newMonths).forEach(key=>{
        const {[scId]:_,...rest}=newMonths[key].scenarios;
        newMonths[key]={...newMonths[key],scenarios:rest};
      });
      return {...p,months:newMonths,scenarioDefs:p.scenarioDefs.filter(s=>s.id!==scId)};
    }));
    if(activeScenarioId===scId) setActiveScenarioId("patternA");
  };

  const activeProduct  = products.find(p=>p.id===activeId);
  const theme = getTheme(isSummary ? "_total" : activeId, activeProduct?.label ?? "");
  const scenarioDefs   = activeProduct?.scenarioDefs ?? INITIAL_SCENARIO_DEFS;

  const setStart=(y,m)=>{setStartYear(y);setStartMonth(m);if(y>endYear||(y===endYear&&m>endMonth)){setEndYear(y);setEndMonth(m);}};
  const setEnd=(y,m)=>{setEndYear(y);setEndMonth(m);if(y<startYear||(y===startYear&&m<startMonth)){setStartYear(y);setStartMonth(m);}};

  const rangeLabel = monthsInRange.length===1
    ? `実績: ${startYear}年${MONTHS[startMonth]}`
    : `実績: ${startYear}年${MONTHS[startMonth]} 〜 ${endYear}年${MONTHS[endMonth]}（${monthsInRange.length}ヶ月）`;

  return (
    <PasswordGate>
    <div className="app">
      <style>{makeCSS(theme)}</style>
      {showAddProduct  && <AddProductModal  onClose={()=>setShowAddProduct(false)}  onAdd={addProduct}/>}
      {showAddScenario && <AddScenarioModal onClose={()=>setShowAddScenario(false)} onAdd={addScenario}/>}

      {/* ヘッダー */}
      <div className="hdr">
        <div className="hdr-left">
          <div className="hdr-title">📊 EC販売 PLシミュレーター</div>
          <div className="hdr-sub">予測 vs 実績 損益計算書 — {rangeLabel}</div>
        </div>
        <div className="hdr-actions">
          <button className="btn-export" onClick={()=>{ if(!isSummary&&activeProduct) exportCSV(activeProduct,monthsInRange,startYear,startMonth,endYear,endMonth); }}>
            ⬇ CSVエクスポート
          </button>
        </div>
        {!isSummary&&theme.illus
          ?<div className="hdr-illus">{theme.illus}</div>
          :<div className="hdr-illus" style={{display:"flex",alignItems:"center",justifyContent:"center",fontSize:52,opacity:0.4}}>📊</div>
        }
      </div>

      {/* 商品タブバー */}
      <div className="tab-bar">
        {products.map(p=>(
          <div key={p.id} className={`tab-btn-wrap${!isSummary&&p.id===activeId?" active":""}`}>
            <button className={`tab-btn${!isSummary&&p.id===activeId?" active":""}`}
              onClick={()=>{setActiveId(p.id);setIsSummary(false);}}>
              {p.emoji} {p.label}
            </button>
            {products.length > 1 && (
              <button className="tab-del" onClick={e=>{e.stopPropagation();deleteProduct(p.id);}} title="タブを削除">×</button>
            )}
          </div>
        ))}
        <button className={`tab-btn total-tab ${isSummary?"active":""}`} onClick={()=>setIsSummary(true)}>
          📊 全体サマリー
        </button>
        <button className="tab-add" onClick={()=>setShowAddProduct(true)}>＋</button>
        {syncing&&<div className="save-badge" style={{background:"rgba(100,180,255,0.2)"}}>🔄 同期中...</div>}{!syncing&&savedAt&&<div className="save-badge">☁️ {new Date(savedAt).toLocaleTimeString("ja-JP",{hour:"2-digit",minute:"2-digit"})} 同期済</div>}
      </div>

      <div className="main">
        {/* 期間バー（月単位ドロップダウン） */}
        <div className="range-bar">
          <span className="range-bar-label">📊 実績期間:</span>
          <div className="month-sel-wrap">
            <select className="msel" value={startYear} onChange={e=>setStart(Number(e.target.value),startMonth)}>
              {YEARS.map(y=><option key={y} value={y}>{y}年</option>)}
            </select>
            <select className="msel" value={startMonth} onChange={e=>setStart(startYear,Number(e.target.value))}>
              {MONTHS.map((m,i)=><option key={i} value={i}>{m}</option>)}
            </select>
          </div>
          <span className="range-sep">〜</span>
          <div className="month-sel-wrap">
            <select className="msel" value={endYear} onChange={e=>setEnd(Number(e.target.value),endMonth)}>
              {YEARS.map(y=><option key={y} value={y}>{y}年</option>)}
            </select>
            <select className="msel" value={endMonth} onChange={e=>setEnd(endYear,Number(e.target.value))}>
              {MONTHS.map((m,i)=><option key={i} value={i}>{m}</option>)}
            </select>
          </div>
          <div className="range-info">{monthsInRange.length}ヶ月間</div>
          {[
            {l:"今月",  fn:()=>{setStart(today.getFullYear(),today.getMonth());     setEnd(today.getFullYear(),today.getMonth());}},
            {l:"今Q",   fn:()=>{const q=Math.floor(today.getMonth()/3)*3; setStart(today.getFullYear(),q); setEnd(today.getFullYear(),Math.min(q+2,11));}},
            {l:"上半期",fn:()=>{setStart(today.getFullYear(),0); setEnd(today.getFullYear(),5);}},
            {l:"下半期",fn:()=>{setStart(today.getFullYear(),6); setEnd(today.getFullYear(),11);}},
            {l:"今年",  fn:()=>{setStart(today.getFullYear(),0); setEnd(today.getFullYear(),11);}},
          ].map((b,i)=><button key={i} className="qbtn" onClick={b.fn}>{b.l}</button>)}
        </div>

        {/* 予測パターンバー */}
        {!isSummary && (
          <div className="scenario-bar">
            <span className="scenario-bar-label">🎯 予測:</span>
            <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",flex:1}}>
              {scenarioDefs.map(sc=>{
                const isActive = sc.id===activeScenarioId;
                const sy = sc.startYear ?? today.getFullYear();
                const sm2 = sc.startMonth ?? today.getMonth();
                const ey = sc.endYear ?? today.getFullYear();
                const em2 = sc.endMonth ?? today.getMonth();
                const mc = getMonthsInRange(sy,sm2,ey,em2).length;
                const periodLabel = sy===ey
                  ? `${sy}年${MONTHS[sm2]}〜${MONTHS[em2]}`
                  : `${sy}年${MONTHS[sm2]}〜${ey}年${MONTHS[em2]}`;
                return (
                  <div key={sc.id} style={{display:"flex",alignItems:"center",gap:2}}>
                    <button className="sc-btn" onClick={()=>setActiveScenarioId(sc.id)}
                      style={{color:isActive?"#000":sc.color, borderColor:sc.color,
                        background:isActive?sc.color:"transparent",
                        boxShadow:isActive?`0 0 12px ${sc.color}60`:"none",
                        display:"flex",flexDirection:"column",alignItems:"center",gap:1,
                        padding:"6px 14px",lineHeight:1.2}}>
                      <span style={{fontSize:13}}>{sc.name}</span>
                      <span style={{fontSize:10,opacity:0.75,fontWeight:400}}>
                        {periodLabel}（{mc}ヶ月）
                      </span>
                    </button>
                    {sc.id!=="patternA"&&sc.id!=="patternB"&&(
                      <button className="sc-del" onClick={()=>deleteScenario(sc.id)} title="削除">✕</button>
                    )}
                  </div>
                );
              })}
              <button className="sc-add-btn" onClick={()=>setShowAddScenario(true)}>＋ 予測追加</button>
            </div>
            <button className={`sc-compare-btn ${showCompare?"active":""}`} onClick={()=>setShowCompare(v=>!v)}>
              {showCompare?"▲ 比較を閉じる":"▼ パターン比較"}
            </button>
          </div>
        )}

        {isSummary
          ?<SummaryTab products={products} monthsInRange={monthsInRange} activeScenarioId={activeScenarioId}/>
          :activeProduct&&(
              <ProductTab
                key={`${activeProduct.id}_${activeScenarioId}_${monthsInRange[0]?.key}_${monthsInRange.length}`}
                product={activeProduct}
                monthsInRange={monthsInRange}
                activeScenarioId={activeScenarioId}
                showCompare={showCompare}
                onChange={handleChange}
              />
            )
        }
      </div>
    </div>
    </PasswordGate>
  );
}
