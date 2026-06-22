import { useState, useRef, useEffect } from "react";
import { supabase } from './supabase.js'

const C={blue:"#185FA5",blueBg:"#E6F1FB",blueLt:"#B5D4F4",teal:"#0F6E56",tealBg:"#E1F5EE",tealLt:"#9FE1CB",purple:"#534AB7",purpleBg:"#EEEDFE",success:"#3B6D11",successBg:"#EAF3DE",warn:"#854F0B",warnBg:"#FAEEDA",danger:"#A32D2D",dangerBg:"#FCEBEB",gray:"#5F5E5A",grayBg:"#F1EFE8"};
const INDUSTRIES=["카페/베이커리","식당/요식업","소매/유통","서비스업(미용/학원)","제조/가공업","기타"];
const SIZES=["1인(사장님 혼자)","2~5인","5~10인","10인 이상"];
const AI_LEVELS=["초급(처음)","중급(ChatGPT 써봤음)","고급(API/자동화 경험)"];
const PAIN_TYPES=["반복업무 자동화","정보 부족/분석","고객 응대 자동화"];
const BUDGETS=["무료~10만원","10~50만원","50~200만원","200만원+"];
const TIMELINES=["1주 이내","2~4주","1~3개월","3개월+"];
const HYPO={"카페/베이커리":["재고 수기 관리","발주 타이밍 놓침","SNS 포스팅 시간 없음","매출 분석 안됨"],"식당/요식업":["예약 전화 놓침","메뉴 원가 파악 안됨","직원 스케줄 복잡","단골 관리 없음"],"소매/유통":["재고 파악 어려움","가격 비교 귀찮음","매출 데이터 없음","반품 처리 번거로움"],"서비스업(미용/학원)":["예약 관리 복잡","재방문율 낮음","홍보 방법 모름","출석/이력 관리 번거로움"],"제조/가공업":["납기 관리 어려움","원자재 재고 파악 안됨","견적서 작성 오래 걸림","품질 불량 추적 안됨"],"기타":["반복 업무 많음","데이터 정리 안됨","고객 응대 부담","비용 파악 안됨"]};
const SPRINT_STATUS=["백로그","진행중","완료","보류"];
const ROLES=["컨설턴트(본인)","고객(사장님)","외주 개발자","기타"];
const PRIORITY=["긴급","높음","보통","낮음"];
const STATUS_COLOR={"백로그":{bg:"var(--color-background-secondary)",c:"var(--color-text-secondary)"},"진행중":{bg:"#E6F1FB",c:"#185FA5"},"완료":{bg:"#EAF3DE",c:"#3B6D11"},"보류":{bg:"#FAEEDA",c:"#854F0B"}};
const PRI_C={"긴급":{bg:"#FCEBEB",c:"#A32D2D"},"높음":{bg:"#FAEEDA",c:"#854F0B"},"보통":{bg:"#E6F1FB",c:"#185FA5"},"낮음":{bg:"#F1EFE8",c:"#5F5E5A"}};

async function claude(sys,usr,maxTok=1500,retries=2){
  for(let i=0;i<=retries;i++){
    try{
      const r=await fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({system:sys,user:usr,max_tokens:maxTok})});
      if(!r.ok){const d=await r.json();throw new Error(d.error||`HTTP ${r.status}`);}
      const d=await r.json();
      const text=d.text||"";
      if(!text)throw new Error("빈 응답");
      return text;
    }catch(e){
      if(i===retries)throw e;
      await new Promise(res=>setTimeout(res,1000*(i+1)));
    }
  }
}

// ── UI 원자 컴포넌트 ──
const FL=({c,mt=12})=><div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:4,marginTop:mt,fontWeight:500}}>{c}</div>;
const Inp=({value,onChange,placeholder,style={}})=><input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{width:"100%",fontSize:13,padding:"8px 10px",borderRadius:8,border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-primary)",color:"var(--color-text-primary)",boxSizing:"border-box",fontFamily:"inherit",...style}}/>;
const TA=({value,onChange,placeholder,rows=4})=><textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{width:"100%",fontSize:13,padding:"8px 10px",borderRadius:8,border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-primary)",color:"var(--color-text-primary)",resize:"vertical",boxSizing:"border-box",fontFamily:"inherit"}}/>;
const Sel=({value,onChange,options,placeholder})=><select value={value} onChange={e=>onChange(e.target.value)} style={{width:"100%",fontSize:13,padding:"8px 10px",borderRadius:8,border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-primary)",color:"var(--color-text-primary)",boxSizing:"border-box",fontFamily:"inherit"}}><option value="">{placeholder||"선택"}</option>{options.map(o=><option key={o} value={o}>{o}</option>)}</select>;

function Btn({children,onClick,v="def",disabled,sm,style={}}){
  const vs={def:{background:"transparent",color:"var(--color-text-primary)",border:"0.5px solid var(--color-border-secondary)"},blue:{background:C.blue,color:"#fff",border:`1px solid ${C.blue}`},teal:{background:C.teal,color:"#fff",border:`1px solid ${C.teal}`},purple:{background:C.purple,color:"#fff",border:`1px solid ${C.purple}`},success:{background:C.success,color:"#fff",border:`1px solid ${C.success}`},ghost:{background:"var(--color-background-secondary)",color:"var(--color-text-secondary)",border:"0.5px solid var(--color-border-tertiary)"},danger:{background:C.danger,color:"#fff",border:`1px solid ${C.danger}`}};
  return <button onClick={disabled?undefined:onClick} style={{padding:sm?"5px 10px":"8px 16px",borderRadius:8,fontSize:sm?12:13,cursor:disabled?"not-allowed":"pointer",display:"inline-flex",alignItems:"center",gap:6,fontFamily:"inherit",opacity:disabled?0.5:1,...vs[v],...style}}>{children}</button>;
}
function Tag({label,selected,color=C.blue,bg=C.blueBg,brd=C.blueLt,onClick}){return <span onClick={onClick} style={{padding:"4px 11px",borderRadius:20,fontSize:12,cursor:"pointer",border:`0.5px solid ${selected?brd:"var(--color-border-secondary)"}`,background:selected?bg:"var(--color-background-primary)",color:selected?color:"var(--color-text-secondary)",display:"inline-block",margin:"2px"}}>{label}</span>;}
function Chip({label,color=C.blue,bg=C.blueBg}){return <span style={{display:"inline-flex",padding:"2px 8px",borderRadius:10,fontSize:11,background:bg,color,margin:"0 2px",fontWeight:500}}>{label}</span>;}
function Panel({title,icon,children,accent,bl,style={}}){return <div style={{background:accent||"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderLeft:bl?`4px solid ${bl}`:undefined,borderRadius:12,padding:"1.1rem 1.25rem",marginBottom:"1rem",...style}}>{title&&<div style={{fontSize:14,fontWeight:500,marginBottom:12,display:"flex",alignItems:"center",gap:7}}>{icon&&<span style={{fontSize:16}}>{icon}</span>}{title}</div>}{children}</div>;}
function ChkItem({label,sub,checked,onChange}){return <label onClick={onChange} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"9px 12px",borderRadius:8,border:`0.5px solid ${checked?"var(--color-border-success)":"var(--color-border-tertiary)"}`,background:checked?"var(--color-background-success)":"var(--color-background-primary)",cursor:"pointer",marginBottom:6}}><input type="checkbox" checked={checked} onChange={onChange} onClick={e=>e.stopPropagation()} style={{marginTop:2,accentColor:C.blue,flexShrink:0}}/><div><div style={{fontSize:13,textDecoration:checked?"line-through":"none",opacity:checked?0.6:1}}>{label}</div>{sub&&<div style={{fontSize:11,color:"var(--color-text-secondary)",marginTop:2}}>{sub}</div>}</div></label>;}
function AIBox({loading,result,error,onRetry,color=C.teal}){
  if(loading) return <div style={{display:"flex",alignItems:"center",gap:8,padding:14,color:"var(--color-text-secondary)",fontSize:13,marginTop:10,background:"var(--color-background-secondary)",borderRadius:8}}>⟳ AI 분석 중...</div>;
  if(error) return <div style={{borderLeft:`3px solid ${C.danger}`,background:C.dangerBg,borderRadius:"0 8px 8px 0",padding:"12px 14px",marginTop:10,fontSize:13,color:C.danger}}>⚠ 분석 실패. <button onClick={onRetry} style={{color:C.blue,background:"none",border:"none",cursor:"pointer",fontSize:13,textDecoration:"underline"}}>다시 시도</button></div>;
  if(!result) return null;
  return <div style={{borderLeft:`3px solid ${color}`,background:"var(--color-background-secondary)",borderRadius:"0 8px 8px 0",padding:"12px 14px",marginTop:10,fontSize:13,lineHeight:1.8,whiteSpace:"pre-wrap"}}><div style={{fontSize:12,fontWeight:500,color,marginBottom:6}}>✦ AI 완료</div>{result}</div>;
}
function InfoBanner({phase,step,color,bg,children}){return <div style={{background:bg,border:`0.5px solid ${color}30`,borderRadius:10,padding:"10px 14px",marginBottom:"1rem"}}><div style={{fontSize:12,color,fontWeight:500,marginBottom:3}}>{phase} · {step}</div><div style={{fontSize:13}}>{children}</div></div>;}

// ── 신규 기능 1: 사전조사 패널 ──
function ResearchPanel({cl,upd}){
  const [sL,setSL]=useState(false);
  const [qL,setQL]=useState(false);
  const [direct,setDirect]=useState(cl.directInfo||"");
  const [copied,setCopied]=useState(false);

  const runSearch=async()=>{
    if(!cl.name||!cl.industry){alert("고객명과 업종을 먼저 입력하세요.");return;}
    setSL(true);
    try{
      const r=await claude(
        "소상공인 AI 컨설턴트. 업체 사전 조사 리포트 작성.\n반드시 아래 형식으로:\n[업체 기본 정보]\n• 예상 운영 형태:\n• 주요 고객층:\n• 경쟁 환경:\n\n[업종 트렌드 & 디지털화 수준]\n•\n•\n\n[예상 Pain Point Top 3]\n1.\n2.\n3.\n\n[첫 미팅 주의사항]\n•",
        `상호명:${cl.name} / 업종:${cl.industry} / 지역:${cl.region||"미입력"} / 규모:${cl.size||"미입력"}\n추가정보:${direct||"없음"}`
      );
      upd({researchResult:r,directInfo:direct});
    }catch(e){alert("조사 실패. 다시 시도해 주세요.");}
    setSL(false);
  };

  const genQ=async()=>{
    if(!cl.researchResult&&!direct&&!(cl.hypothesis||[]).length){alert("사전 조사 또는 직접 입력 정보가 필요합니다.");return;}
    setQL(true);
    try{
      const r=await claude(
        "소상공인 첫 미팅 인터뷰 질문지 작성.\n형식:\n[필수 질문 - 반드시 물어볼 것]\nQ1. (하루 일과)\nQ2. (시간/실수 낭비)\nQ3. (걱정/고민)\n\n[심화 질문 - 상황에 따라 선택]\nQ4. (업종 특화)\nQ5. (Pain Point 검증)\nQ6. (예산/의사결정)\n\n[현장 팁]\n• 이 고객에게 특히 주의할 점",
        `상호:${cl.name} / 업종:${cl.industry}\n사전조사:${cl.researchResult||"없음"}\n직접수집:${direct||"없음"}\n가설PP:${(cl.hypothesis||[]).join(",")||"없음"}`
      );
      upd({interviewQ:r,directInfo:direct});
    }catch(e){alert("생성 실패.");}
    setQL(false);
  };

  const copy=()=>{navigator.clipboard.writeText(cl.interviewQ||"").then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);});};

  return <>
    {/* ① AI 자동 조사 */}
    <Panel title="① AI 자동 사전 조사" icon="🔍">
      <div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:12}}>고객명·업종 기반으로 AI가 업종 특성, 트렌드, 예상 Pain Point를 정리합니다.</div>
      <Btn v="blue" onClick={runSearch} disabled={sL}>{sL?"⟳ 조사 중...":"🔍 AI 자동 사전 조사 실행"}</Btn>
      {sL&&<AIBox loading={true}/>}
      {cl.researchResult&&!sL&&(
        <div style={{borderLeft:`3px solid ${C.blue}`,background:"var(--color-background-secondary)",borderRadius:"0 8px 8px 0",padding:"12px 14px",marginTop:10,fontSize:13,lineHeight:1.8,whiteSpace:"pre-wrap"}}>
          <div style={{fontSize:12,fontWeight:500,color:C.blue,marginBottom:6}}>✦ 사전 조사 완료</div>
          {cl.researchResult}
        </div>
      )}
    </Panel>

    {/* ② 직접 입력 */}
    <Panel title="② 직접 수집 정보 입력" icon="✍️">
      <div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:8}}>네이버 플레이스, SNS, 지인 정보 등 직접 조사한 내용을 자유롭게 입력하세요.</div>
      <TA value={direct} onChange={setDirect} rows={5} placeholder="예: 네이버 플레이스 별점 4.2점 리뷰 87개. 인스타 팔로워 320명. 경쟁 카페 3곳 반경 200m. 최근 키오스크 도입 고려 중..."/>
      <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
        {["[네이버 플레이스] ","[SNS 분석] ","[경쟁사 정보] ","[지인 정보] "].map(t=><Btn key={t} sm v="ghost" onClick={()=>setDirect(d=>d+t)}>{t.trim()}</Btn>)}
      </div>
    </Panel>

    {/* ③ 가설 Pain Point */}
    <Panel title="③ 가설 Pain Point 선택" icon="💡">
      <div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:8}}>업종별 자동 추천 — 복수 선택 가능</div>
      <div>{cl.industry?(HYPO[cl.industry]||HYPO["기타"]).map(h=><Tag key={h} label={h} selected={(cl.hypothesis||[]).includes(h)} onClick={()=>upd({hypothesis:(cl.hypothesis||[]).includes(h)?(cl.hypothesis||[]).filter(x=>x!==h):[...(cl.hypothesis||[]),h]})}/>):<span style={{fontSize:12,color:"var(--color-text-secondary)"}}>업종을 먼저 선택하세요</span>}</div>
      {(cl.hypothesis||[]).length>0&&<div style={{marginTop:8,padding:"6px 10px",background:C.blueBg,borderRadius:8,fontSize:12,color:C.blue}}>선택: {(cl.hypothesis||[]).join(" · ")}</div>}
    </Panel>

    {/* ④ 질문지 생성 */}
    <Panel title="④ 인터뷰 질문지 자동 생성" icon="📋">
      <div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:10}}>사전 조사 + 직접 입력 + 가설 Pain Point를 종합해서 맞춤형 질문지를 생성합니다.</div>
      <Btn v="blue" onClick={genQ} disabled={qL}>{qL?"⟳ 질문지 생성 중...":"✨ 인터뷰 질문지 자동 생성"}</Btn>
      {qL&&<AIBox loading={true} color={C.blue}/>}
      {cl.interviewQ&&!qL&&<>
        <TA value={cl.interviewQ} onChange={v=>upd({interviewQ:v})} rows={14} style={{marginTop:10}}/>
        <div style={{display:"flex",gap:8,marginTop:8}}><Btn onClick={copy}>{copied?"✓ 복사됨":"📋 질문지 복사"}</Btn><Btn v="ghost" onClick={genQ} disabled={qL}>🔄 재생성</Btn></div>
      </>}
    </Panel>
  </>;
}

// ── 신규 기능 2: 솔루션 다중 선택 + 통합 합성 ──
function SolutionPanel({cl,upd,aiGet,runAI}){
  const [mergeL,setMergeL]=useState(false);
  const validPPs=(cl.painPoints||[]).filter(p=>p.title);
  const selected=cl.selectedSols||[];

  const toggle=(i)=>{const cur=cl.selectedSols||[];const next=cur.includes(i)?cur.filter(x=>x!==i):[...cur,i];upd({selectedSols:next,selectedSol:next[0]??null});};

  const merge=async()=>{
    if(selected.length<2){alert("2개 이상 선택해 주세요.");return;}
    setMergeL(true);
    const chosen=selected.map(i=>(cl.solutions||[])[i]).filter(Boolean);
    try{
      const r=await claude(
        "소상공인 AI 솔루션 통합 합성. 형식:\n[통합 솔루션명]\n[핵심 개요] 2줄\n[구성 요소] 각 솔루션 통합 방식\n[사용 도구] 전체 목록\n[예상 기간] 통합 기준\n[예상 비용] 통합 기준\n[기대 효과] 수치 포함\n[구현 순서] 단계별",
        `고객:${cl.name} 업종:${cl.industry}\nPP:${validPPs.map(p=>p.title).join(",")}\n선택솔루션:\n${chosen.map((s,i)=>`${i+1}.${s.title}(${s.type})-${s.desc}/도구:${s.tool}`).join("\n")}`
      );
      upd({mergedSolution:{title:`통합 솔루션 (${chosen.length}개 합성)`,desc:r,components:chosen}});
    }catch(e){alert("합성 실패.");}
    setMergeL(false);
  };

  return <>
    <Panel title="고객 조건" icon="⚖️">
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div><FL c="예산 범위" mt={0}/><Sel value={cl.budget||""} onChange={v=>upd({budget:v})} options={BUDGETS} placeholder="예산 선택"/></div>
        <div><FL c="희망 일정" mt={0}/><Sel value={cl.timeline||""} onChange={v=>upd({timeline:v})} options={TIMELINES} placeholder="일정 선택"/></div>
      </div>
    </Panel>

    <Panel title="AI 솔루션 자동 설계 (3안) — 복수 선택 가능" icon="⚙️">
      <div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:10}}>여러 개 선택 → 아래에서 하나의 통합 솔루션으로 합성됩니다.</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>{validPPs.map((p,i)=><Chip key={i} label={`#${i+1} ${p.title}`} color={C.teal} bg={C.tealBg}/>)}</div>
      <Btn v="teal" onClick={()=>runAI("dg_sol",
        "소상공인 Pain Point용 AI 솔루션 3개. 순수 JSON만 출력.\n{\"solutions\":[{\"rank\":1,\"title\":\"명\",\"type\":\"유형\",\"desc\":\"설명1줄\",\"why\":\"이유1줄\",\"tool\":\"도구\",\"effort\":\"기간\",\"cost\":\"비용\"}]}",
        `고객:${cl.name} 업종:${cl.industry} AI친숙도:${cl.aiLevel||""}\nPP:${validPPs.map(p=>`${p.title}(${p.type})`).join(",")}\n예산:${cl.budget||""} 일정:${cl.timeline||""}`
      )} disabled={aiGet("dg_sol").loading||!validPPs.length}>
        {aiGet("dg_sol").loading?"⟳ 설계 중...":"✨ AI 솔루션 3개 자동 생성"}
      </Btn>
      {aiGet("dg_sol").result&&!aiGet("dg_sol").error&&(()=>{
        let p=null;try{p=JSON.parse(aiGet("dg_sol").result.replace(/```json|```/g,"").trim());}catch{}
        if(p?.solutions&&!(cl.solutions||[]).every(s=>s.title)){setTimeout(()=>upd({solutions:p.solutions.map(s=>({title:s.title||"",type:s.type||"",desc:s.desc||"",why:s.why||"",tool:s.tool||"",effort:s.effort||"",cost:s.cost||""}))}),0);}
        return <div style={{fontSize:12,color:C.teal,marginTop:8,fontWeight:500}}>✦ 생성 완료 — 카드를 클릭해서 선택하세요 (복수 선택 가능)</div>;
      })()}
    </Panel>

    {/* 솔루션 카드 - 다중 선택 */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:"1rem"}}>
      {(cl.solutions||[]).slice(0,3).map((sol,i)=>{
        const isSel=selected.includes(i);
        return <div key={i} onClick={()=>toggle(i)} style={{border:`${isSel?"2px":"0.5px"} solid ${isSel?C.teal:"var(--color-border-tertiary)"}`,borderRadius:12,padding:"12px",cursor:"pointer",background:isSel?C.tealBg:"var(--color-background-primary)",position:"relative"}}>
          {isSel&&<div style={{position:"absolute",top:-1,left:8,background:C.teal,color:"#fff",fontSize:10,padding:"2px 8px",borderRadius:"0 0 6px 6px",fontWeight:500}}>✓ 선택 {selected.indexOf(i)+1}</div>}
          <div style={{fontSize:11,fontWeight:500,color:C.teal,marginBottom:4,marginTop:isSel?8:0}}>옵션 {i+1}</div>
          <div style={{fontSize:13,fontWeight:500,marginBottom:6}}>{sol.title||<span style={{color:"var(--color-text-secondary)"}}>솔루션 {i+1}</span>}</div>
          {sol.type&&<Chip label={sol.type} color={C.teal} bg={C.tealBg}/>}
          {sol.desc&&<div style={{fontSize:12,color:"var(--color-text-secondary)",marginTop:6,lineHeight:1.5}}>{sol.desc}</div>}
          {sol.tool&&<div style={{fontSize:11,marginTop:6}}>🔧 {sol.tool}</div>}
          <div style={{display:"flex",gap:4,marginTop:8,flexWrap:"wrap"}}>
            {sol.effort&&<span style={{fontSize:11,background:C.warnBg,color:C.warn,padding:"2px 6px",borderRadius:6}}>⏱ {sol.effort}</span>}
            {sol.cost&&<span style={{fontSize:11,background:C.purpleBg,color:C.purple,padding:"2px 6px",borderRadius:6}}>💰 {sol.cost}</span>}
          </div>
          {sol.why&&<div style={{fontSize:11,color:C.teal,marginTop:8,fontStyle:"italic",lineHeight:1.5}}>→ {sol.why}</div>}
        </div>;
      })}
    </div>

    {/* 선택 현황 + 통합 합성 */}
    {selected.length>0&&<Panel title="선택 솔루션 통합" icon="🔗" accent={C.tealBg}>
      <div style={{fontSize:13,marginBottom:12}}>
        <span style={{fontWeight:500,color:C.teal}}>{selected.length}개 선택:</span>{" "}
        {selected.map(i=>(cl.solutions||[])[i]?.title).filter(Boolean).join(" + ")}
      </div>
      {selected.length>=2&&<Btn v="teal" onClick={merge} disabled={mergeL}>{mergeL?"⟳ 통합 합성 중...":"🔗 통합 솔루션 자동 합성"}</Btn>}
      {mergeL&&<AIBox loading={true} color={C.teal}/>}
      {cl.mergedSolution&&!mergeL&&<div style={{borderLeft:`3px solid ${C.teal}`,background:"var(--color-background-primary)",borderRadius:"0 8px 8px 0",padding:"12px 14px",marginTop:10,fontSize:13,lineHeight:1.8,whiteSpace:"pre-wrap"}}>
        <div style={{fontSize:12,fontWeight:500,color:C.teal,marginBottom:6}}>✦ 통합 솔루션</div>
        <div style={{fontWeight:500,fontSize:14,marginBottom:8}}>{cl.mergedSolution.title}</div>
        {cl.mergedSolution.desc}
      </div>}
    </Panel>}
  </>;
}

// ── 신규 기능 3: Agile PM (스프린트 보드 + 간트 + 번다운 + 리소스) ──
const newTask=(sid)=>({id:Date.now()+Math.random(),sid,title:"",assignee:"컨설턴트(본인)",priority:"보통",status:"백로그",pts:3});
const newSprint=(n)=>({id:Date.now()+Math.random(),num:n,name:`Sprint ${n}`,goal:"",start:"",end:"",tasks:[]});

function PMPanel({cl,upd}){
  const [view,setView]=useState("board");
  const [planL,setPlanL]=useState(false);
  const pm=cl.pm||{sprints:[newSprint(1)],resources:[{id:1,name:"컨설턴트(본인)",role:"컨설턴트(본인)",avail:100}],velocity:20,pjName:cl.name+" AI 솔루션"};
  const updPM=p=>upd({pm:{...cl.pm,...p}});
  const updSprints=fn=>upd({pm:{...cl.pm,sprints:fn((cl.pm||{}).sprints||[newSprint(1)])}});

  // ── AI 프로젝트 플랜 자동 생성 ──
  const genPlan=async()=>{
    setPlanL(true);
    const validPPs=(cl.painPoints||[]).filter(p=>p.title);
    const chosenSols=(cl.selectedSols||[]).map(i=>(cl.solutions||[])[i]).filter(Boolean);
    const solDesc=cl.mergedSolution?cl.mergedSolution.title:chosenSols.map(s=>s.title).join("+");
    const tools=(cl.buildTool)||(chosenSols.map(s=>s.tool).filter(Boolean).join(", "))||"미정";
    const effort=(cl.buildEffort)||(chosenSols[0]?.effort)||cl.timeline||"2~4주";
    try{
      const r=await claude(
        `당신은 Agile PM 전문가입니다. 소상공인 AI 솔루션 개발 프로젝트 플랜을 생성하세요.
반드시 순수 JSON만 출력 (마크다운 백틱 없이, 설명 없이, JSON만):
{"projectName":"프로젝트명","sprints":[{"name":"Sprint 1","goal":"목표","daysFromStart":0,"durationDays":14,"tasks":[{"title":"태스크명","assignee":"컨설턴트(본인)","priority":"보통","status":"백로그","pts":3}]}],"resources":[{"name":"컨설턴트(본인)","role":"컨설턴트(본인)"}],"velocity":20}
규칙: 스프린트 2~3개, 태스크 스프린트당 4~6개, pts 1~5`,
        `고객:${cl.name||"고객"} 업종:${cl.industry||"미정"} AI친숙도:${cl.aiLevel||"초급"}
Pain Point:${validPPs.map(p=>p.title).join(", ")||"미입력"}
솔루션:${solDesc||"AI 솔루션"} 도구:${tools} 예상기간:${effort}
예산:${cl.budget||"미정"}`,
        2000
      );
      let parsed=null;
      // 1차: 전체 텍스트 파싱
      try{ parsed=JSON.parse(r.replace(/```json|```/g,"").trim()); }catch{}
      // 2차: 중괄호 추출 후 파싱
      if(!parsed?.sprints){
        const m=r.match(/\{[\s\S]*\}/);
        if(m){ try{ parsed=JSON.parse(m[0]); }catch{} }
      }
      if(parsed?.sprints){
        const today=new Date();
        const sprints=parsed.sprints.map((sp,i)=>{
          const start=new Date(today); start.setDate(start.getDate()+(sp.daysFromStart||i*14));
          const end=new Date(start); end.setDate(end.getDate()+(sp.durationDays||14)-1);
          const fmt=d=>d.toISOString().split("T")[0];
          return {
            id:Date.now()+Math.random(), num:i+1,
            name:sp.name||`Sprint ${i+1}`, goal:sp.goal||"",
            start:fmt(start), end:fmt(end),
            tasks:(sp.tasks||[]).map(t=>({
              id:Date.now()+Math.random(), sid:0,
              title:t.title||"", assignee:t.assignee||"컨설턴트(본인)",
              priority:t.priority||"보통", status:t.status||"백로그", pts:t.pts||3
            }))
          };
        });
        const resources=(parsed.resources||[]).map((r,i)=>({id:Date.now()+i,name:r.name||"",role:r.role||"컨설턴트(본인)",avail:100}));
        upd({pm:{
          ...cl.pm,
          sprints,
          resources:resources.length?resources:(cl.pm?.resources||[{id:1,name:"컨설턴트(본인)",role:"컨설턴트(본인)",avail:100}]),
          velocity:parsed.velocity||20,
          pjName:parsed.projectName||cl.name+" AI 솔루션"
        }});
      } else {
        alert("플랜 생성 실패 — AI 응답을 파싱할 수 없습니다. 다시 시도해 주세요.");
      }
    }catch(e){ console.error(e); alert("오류: "+e.message); }
    setPlanL(false);
  };

  const allTasks=pm.sprints.flatMap(s=>s.tasks||[]);
  const doneTasks=allTasks.filter(t=>t.status==="완료");
  const totalPts=allTasks.reduce((a,t)=>a+(t.pts||0),0);
  const donePts=doneTasks.reduce((a,t)=>a+(t.pts||0),0);
  const prog=totalPts>0?Math.round(donePts/totalPts*100):0;

  // 스프린트 보드
  const Board=()=><div>{pm.sprints.map((sp,si)=><div key={sp.id} style={{border:"0.5px solid var(--color-border-tertiary)",borderRadius:12,padding:"1rem",marginBottom:"1rem"}}>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,flexWrap:"wrap"}}>
      <span style={{fontSize:14,fontWeight:500,color:C.purple}}>{sp.name}</span>
      <Inp value={sp.goal} onChange={v=>updSprints(ss=>ss.map((s,i)=>i===si?{...s,goal:v}:s))} placeholder="스프린트 목표" style={{flex:1,minWidth:120,fontSize:12}}/>
      <input type="date" value={sp.start} onChange={e=>{const v=e.target.value;updSprints(ss=>ss.map((s,i)=>i===si?{...s,start:v}:s));}} style={{fontSize:12,padding:"4px 8px",borderRadius:6,border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-primary)",color:"var(--color-text-primary)"}}/>
      <span style={{fontSize:12,color:"var(--color-text-secondary)"}}>~</span>
      <input type="date" value={sp.end} onChange={e=>{const v=e.target.value;updSprints(ss=>ss.map((s,i)=>i===si?{...s,end:v}:s));}} style={{fontSize:12,padding:"4px 8px",borderRadius:6,border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-primary)",color:"var(--color-text-primary)"}}/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>
      {SPRINT_STATUS.map(st=>{
        const tasks=(sp.tasks||[]).filter(t=>t.status===st);
        const sc=STATUS_COLOR[st]||{bg:"var(--color-background-secondary)",c:"var(--color-text-secondary)"};
        return <div key={st} style={{background:"var(--color-background-secondary)",borderRadius:8,padding:8,minHeight:100}}>
          <div style={{fontSize:11,fontWeight:500,color:sc.c,background:sc.bg,padding:"2px 8px",borderRadius:10,display:"inline-block",marginBottom:8}}>{st}({tasks.length})</div>
          {tasks.map(task=><div key={task.id} style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:6,padding:"7px",marginBottom:5}}>
            <div style={{fontSize:12,fontWeight:500,marginBottom:3}}>{task.title||"(제목없음)"}</div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <span style={{fontSize:10,background:PRI_C[task.priority]?.bg,color:PRI_C[task.priority]?.c,padding:"1px 5px",borderRadius:6}}>{task.priority}</span>
              <span style={{fontSize:11,color:"var(--color-text-secondary)"}}>{task.pts}pt</span>
            </div>
            <div style={{fontSize:11,color:"var(--color-text-secondary)",marginBottom:5}}>{task.assignee}</div>
            <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
              {SPRINT_STATUS.filter(s=>s!==st).map(s=><button key={s} onClick={()=>updSprints(ss=>ss.map((sp2,i)=>i===si?{...sp2,tasks:(sp2.tasks||[]).map(t=>t.id===task.id?{...t,status:s}:t)}:sp2))} style={{fontSize:9,padding:"1px 4px",borderRadius:4,border:"0.5px solid var(--color-border-secondary)",background:"transparent",cursor:"pointer",fontFamily:"inherit"}}>→{s}</button>)}
              <button onClick={()=>updSprints(ss=>ss.map((sp2,i)=>i===si?{...sp2,tasks:(sp2.tasks||[]).filter(t=>t.id!==task.id)}:sp2))} style={{fontSize:9,padding:"1px 4px",borderRadius:4,border:`0.5px solid ${C.danger}`,background:"transparent",cursor:"pointer",color:C.danger,fontFamily:"inherit"}}>✕</button>
            </div>
          </div>)}
          <button onClick={()=>{const t=prompt("태스크 제목:");if(!t)return;updSprints(ss=>ss.map((sp2,i)=>i===si?{...sp2,tasks:[...(sp2.tasks||[]),{...newTask(sp.id),title:t,status:st}]}:sp2));}} style={{width:"100%",padding:"4px",border:"0.5px dashed var(--color-border-secondary)",borderRadius:6,background:"transparent",cursor:"pointer",fontSize:11,color:"var(--color-text-secondary)",fontFamily:"inherit",marginTop:4}}>+ 추가</button>
        </div>;
      })}
    </div>
    {/* 태스크 편집 */}
    {(sp.tasks||[]).length>0&&<details style={{marginTop:8}}><summary style={{fontSize:12,color:C.purple,cursor:"pointer"}}>태스크 상세 편집 ({sp.tasks.length}개)</summary>
      <div style={{marginTop:8}}>{(sp.tasks||[]).map(task=><div key={task.id} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 60px",gap:5,marginBottom:5,alignItems:"center"}}>
        <Inp value={task.title} onChange={v=>updSprints(ss=>ss.map((sp2,i)=>i===si?{...sp2,tasks:(sp2.tasks||[]).map(t=>t.id===task.id?{...t,title:v}:t)}:sp2))} placeholder="태스크 제목" style={{fontSize:12}}/>
        <Sel value={task.assignee} onChange={v=>updSprints(ss=>ss.map((sp2,i)=>i===si?{...sp2,tasks:(sp2.tasks||[]).map(t=>t.id===task.id?{...t,assignee:v}:t)}:sp2))} options={ROLES}/>
        <Sel value={task.priority} onChange={v=>updSprints(ss=>ss.map((sp2,i)=>i===si?{...sp2,tasks:(sp2.tasks||[]).map(t=>t.id===task.id?{...t,priority:v}:t)}:sp2))} options={PRIORITY}/>
        <Sel value={task.status} onChange={v=>updSprints(ss=>ss.map((sp2,i)=>i===si?{...sp2,tasks:(sp2.tasks||[]).map(t=>t.id===task.id?{...t,status:v}:t)}:sp2))} options={SPRINT_STATUS}/>
        <input type="number" value={task.pts} min={1} max={13} onChange={e=>updSprints(ss=>ss.map((sp2,i)=>i===si?{...sp2,tasks:(sp2.tasks||[]).map(t=>t.id===task.id?{...t,pts:Number(e.target.value)}:t)}:sp2))} style={{width:"100%",padding:"6px",borderRadius:6,border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-primary)",color:"var(--color-text-primary)",fontSize:12,fontFamily:"inherit"}}/>
      </div>)}</div>
    </details>}
    <div style={{display:"flex",gap:8,marginTop:8}}>
      <Btn sm v="ghost" onClick={()=>updSprints(ss=>ss.map((sp2,i)=>i===si?{...sp2,tasks:[...(sp2.tasks||[]),newTask(sp.id)]}:sp2))}>+ 태스크</Btn>
      {si===pm.sprints.length-1&&<Btn sm v="ghost" onClick={()=>updPM({sprints:[...pm.sprints,newSprint(pm.sprints.length+1)]})}>+ 스프린트</Btn>}
      {pm.sprints.length>1&&si===pm.sprints.length-1&&<Btn sm v="ghost" style={{color:C.danger,borderColor:C.danger}} onClick={()=>updPM({sprints:pm.sprints.slice(0,-1)})}>삭제</Btn>}
    </div>
  </div>)}</div>;

  // 간트차트
  const Gantt=()=>{
    const swd=pm.sprints.filter(s=>s.start&&s.end);
    if(!swd.length) return <div style={{padding:"2rem",textAlign:"center",color:"var(--color-text-secondary)",fontSize:13}}>스프린트에 시작일/종료일을 입력하면 간트차트가 표시됩니다.</div>;
    const allD=swd.flatMap(s=>[new Date(s.start),new Date(s.end)]);
    const mn=new Date(Math.min(...allD)),mx=new Date(Math.max(...allD));
    const tot=Math.max(1,(mx-mn)/86400000+1);
    const today=new Date();
    const todayL=Math.min(100,Math.max(0,(today-mn)/86400000/tot*100));
    const COLS=[C.blue,C.teal,C.purple,C.warn];
    return <div style={{overflowX:"auto"}}><div style={{minWidth:480}}>
      <div style={{display:"flex",marginBottom:8}}>
        <div style={{width:130,flexShrink:0,fontSize:12,fontWeight:500,color:"var(--color-text-secondary)"}}>스프린트</div>
        <div style={{flex:1,position:"relative",height:16}}>
          <div style={{position:"absolute",left:`${todayL}%`,top:-2,fontSize:10,color:C.danger,fontWeight:500,transform:"translateX(-50%)"}}>오늘</div>
        </div>
      </div>
      {swd.map((s,i)=>{
        const l=Math.max(0,(new Date(s.start)-mn)/86400000/tot*100);
        const w=Math.max(1,(new Date(s.end)-new Date(s.start))/86400000/tot*100);
        const done=(s.tasks||[]).filter(t=>t.status==="완료").length;
        const col=COLS[i%COLS.length];
        return <div key={s.id} style={{display:"flex",alignItems:"center",marginBottom:10}}>
          <div style={{width:130,flexShrink:0,fontSize:12,fontWeight:500,paddingRight:8}}>
            {s.name}<div style={{fontSize:11,color:"var(--color-text-secondary)",fontWeight:400}}>{done}/{(s.tasks||[]).length} 완료</div>
          </div>
          <div style={{flex:1,position:"relative",height:28,background:"var(--color-background-secondary)",borderRadius:4}}>
            <div style={{position:"absolute",left:`${todayL}%`,top:0,bottom:0,borderLeft:`1.5px dashed ${C.danger}`,zIndex:2}}/>
            <div style={{position:"absolute",left:`${l}%`,width:`${w}%`,top:4,height:20,background:col,borderRadius:4,display:"flex",alignItems:"center",paddingLeft:6,minWidth:4}}>
              {w>12&&<span style={{fontSize:11,color:"#fff",fontWeight:500,whiteSpace:"nowrap",overflow:"hidden"}}>{s.goal||s.name}</span>}
            </div>
          </div>
        </div>;
      })}
      <div style={{display:"flex",gap:12,marginTop:8,flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:C.danger}}><div style={{width:14,borderTop:`2px dashed ${C.danger}`}}/>오늘</div>
        {COLS.slice(0,swd.length).map((c,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:4,fontSize:11}}><div style={{width:14,height:8,background:c,borderRadius:2}}/>{swd[i]?.name}</div>)}
      </div>
    </div></div>;
  };

  // 번다운 차트
  const Burndown=()=>{
    const sp=pm.sprints[0];
    if(!sp||!sp.start||!sp.end) return <div style={{padding:"2rem",textAlign:"center",color:"var(--color-text-secondary)",fontSize:13}}>Sprint 1에 시작일/종료일을 입력하면 번다운 차트가 표시됩니다.</div>;
    const start=new Date(sp.start),end=new Date(sp.end),today=new Date();
    const totalDays=Math.max(1,Math.round((end-start)/86400000));
    const elapsed=Math.min(totalDays,Math.max(0,Math.round((today-start)/86400000)));
    const tPts=(sp.tasks||[]).reduce((a,t)=>a+(t.pts||0),0);
    const dPts=(sp.tasks||[]).filter(t=>t.status==="완료").reduce((a,t)=>a+(t.pts||0),0);
    const W=560,H=200,P={t:20,r:20,b:36,l:44};
    const IW=W-P.l-P.r,IH=H-P.t-P.b;
    const px=d=>P.l+d/totalDays*IW;
    const py=p=>P.t+IH-(p/Math.max(tPts,1))*IH;
    const idealPath=Array.from({length:totalDays+1},(_,i)=>`${i===0?"M":"L"}${px(i)} ${py(tPts-tPts*i/totalDays)}`).join(" ");
    const actualPts=Array.from({length:elapsed+1},(_,i)=>i===0?tPts:i===elapsed?tPts-dPts:tPts-dPts*(i/Math.max(elapsed,1)));
    const actualPath=actualPts.map((p,i)=>`${i===0?"M":"L"}${px(i)} ${py(p)}`).join(" ");
    return <div>
      <div style={{fontSize:13,marginBottom:12,display:"flex",gap:16,flexWrap:"wrap"}}>
        <span>총 <strong>{tPts}pt</strong></span>
        <span>완료 <strong style={{color:C.success}}>{dPts}pt</strong></span>
        <span>잔여 <strong style={{color:C.warn}}>{tPts-dPts}pt</strong></span>
        <span>진행률 <strong style={{color:C.blue}}>{prog}%</strong></span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%"}}>
        {[0,0.25,0.5,0.75,1].map(r=>{const y=P.t+IH*r;const v=Math.round(tPts*(1-r));return <g key={r}><line x1={P.l} y1={y} x2={P.l+IW} y2={y} stroke="var(--color-border-tertiary)" strokeWidth="0.5"/><text x={P.l-4} y={y+4} textAnchor="end" fontSize="10" fill="var(--color-text-secondary)">{v}</text></g>;})}
        <path d={idealPath} fill="none" stroke={C.gray} strokeWidth="1.5" strokeDasharray="5 3"/>
        <path d={actualPath} fill="none" stroke={C.blue} strokeWidth="2"/>
        <line x1={px(elapsed)} y1={P.t} x2={px(elapsed)} y2={P.t+IH} stroke={C.danger} strokeWidth="1" strokeDasharray="4 2"/>
        <text x={px(elapsed)} y={P.t-4} textAnchor="middle" fontSize="10" fill={C.danger}>오늘</text>
        <line x1={P.l} y1={P.t} x2={P.l} y2={P.t+IH} stroke="var(--color-border-secondary)" strokeWidth="0.5"/>
        <line x1={P.l} y1={P.t+IH} x2={P.l+IW} y2={P.t+IH} stroke="var(--color-border-secondary)" strokeWidth="0.5"/>
        <text x={P.l+IW} y={P.t+IH+14} textAnchor="end" fontSize="10" fill="var(--color-text-secondary)">{totalDays}일</text>
        <line x1={P.l+IW-100} y1={P.t+8} x2={P.l+IW-82} y2={P.t+8} stroke={C.gray} strokeWidth="1.5" strokeDasharray="5 3"/>
        <text x={P.l+IW-77} y={P.t+12} fontSize="10" fill="var(--color-text-secondary)">이상선</text>
        <line x1={P.l+IW-40} y1={P.t+8} x2={P.l+IW-22} y2={P.t+8} stroke={C.blue} strokeWidth="2"/>
        <text x={P.l+IW-17} y={P.t+12} fontSize="10" fill="var(--color-text-secondary)">실제</text>
      </svg>
    </div>;
  };

  // 리소스 관리
  const Resources=()=>{
    const res=pm.resources||[];
    const updRes=(id,patch)=>updPM({resources:res.map(r=>r.id===id?{...r,...patch}:r)});
    const byName={};allTasks.forEach(t=>{if(!byName[t.assignee])byName[t.assignee]=[];byName[t.assignee].push(t);});
    return <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:500}}>리소스 ({res.length}명)</div>
        <Btn sm v="ghost" onClick={()=>updPM({resources:[...res,{id:Date.now(),name:"",role:"컨설턴트(본인)",avail:100}]})}>+ 추가</Btn>
      </div>
      {res.map(r=>{
        const tasks=byName[r.name]||byName[r.role]||[];
        const aPts=tasks.reduce((a,t)=>a+(t.pts||0),0);
        const dPts2=tasks.filter(t=>t.status==="완료").reduce((a,t)=>a+(t.pts||0),0);
        const load=pm.velocity>0?Math.round(aPts/pm.velocity*100):0;
        const lc=load>100?C.danger:load>80?C.warn:C.success;
        return <div key={r.id} style={{border:"0.5px solid var(--color-border-tertiary)",borderRadius:10,padding:"12px",marginBottom:10}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 80px",gap:8,marginBottom:8}}>
            <div><FL c="이름" mt={0}/><Inp value={r.name} onChange={v=>updRes(r.id,{name:v})} placeholder="담당자 이름"/></div>
            <div><FL c="역할" mt={0}/><Sel value={r.role} onChange={v=>updRes(r.id,{role:v})} options={ROLES}/></div>
            <div><FL c="가용률%" mt={0}/><input type="number" value={r.avail} min={0} max={100} onChange={e=>updRes(r.id,{avail:Number(e.target.value)})} style={{width:"100%",padding:"8px 6px",borderRadius:8,border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-primary)",color:"var(--color-text-primary)",fontSize:13,fontFamily:"inherit",boxSizing:"border-box"}}/></div>
          </div>
          <div style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap",marginBottom:6}}>
            <span style={{fontSize:12}}>할당 <strong>{aPts}pt</strong></span>
            <span style={{fontSize:12}}>완료 <strong style={{color:C.success}}>{dPts2}pt</strong></span>
            <span style={{fontSize:12}}>부하 <strong style={{color:lc}}>{load}%</strong></span>
            {load>100&&<span style={{fontSize:11,background:C.dangerBg,color:C.danger,padding:"2px 8px",borderRadius:10}}>⚠ 과부하</span>}
          </div>
          <div style={{height:6,background:"var(--color-background-secondary)",borderRadius:3,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${Math.min(load,100)}%`,background:lc,borderRadius:3}}/>
          </div>
          {tasks.length>0&&<div style={{marginTop:8,display:"flex",flexWrap:"wrap",gap:4}}>{tasks.map(t=><span key={t.id} style={{fontSize:11,padding:"2px 7px",borderRadius:10,background:STATUS_COLOR[t.status]?.bg||"var(--color-background-secondary)",color:STATUS_COLOR[t.status]?.c||"var(--color-text-secondary)"}}>{t.title||"(없음)"}({t.pts}pt)</span>)}</div>}
          {res.length>1&&<button onClick={()=>updPM({resources:res.filter(r2=>r2.id!==r.id)})} style={{marginTop:8,fontSize:11,color:C.danger,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>삭제</button>}
        </div>;
      })}
      <Panel title="팀 속도 (Velocity)" icon="⚡" style={{marginTop:8}}>
        <div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:8}}>스프린트당 처리 가능한 스토리 포인트 기준값</div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <input type="range" min={5} max={100} step={5} value={pm.velocity} onChange={e=>updPM({velocity:Number(e.target.value)})} style={{flex:1}}/>
          <span style={{fontSize:14,fontWeight:500,color:C.purple,minWidth:48}}>{pm.velocity}pt</span>
        </div>
      </Panel>
    </div>;
  };

  return <div>
    {/* AI 프로젝트 플랜 자동 생성 */}
    <Panel title="AI 프로젝트 플랜 자동 생성" icon="🤖" accent={C.purpleBg}>
      <div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:12,lineHeight:1.6}}>
        Diagnosis에서 확정된 솔루션·Pain Point·도구·기간을 바탕으로<br/>
        스프린트 계획 · 태스크 목록 · 일정 · 리소스를 AI가 자동으로 생성합니다.
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
        {(cl.selectedSols||[]).map(i=>(cl.solutions||[])[i]).filter(Boolean).map((s,i)=>(
          <span key={i} style={{fontSize:12,background:C.purpleBg,color:C.purple,padding:"3px 10px",borderRadius:10,border:`0.5px solid ${C.purpleLt}`}}>🔧 {s.title}</span>
        ))}
        {cl.mergedSolution&&<span style={{fontSize:12,background:C.tealBg,color:C.teal,padding:"3px 10px",borderRadius:10}}>통합 솔루션 적용</span>}
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        <Btn v="purple" onClick={genPlan} disabled={planL}>
          {planL?"⟳ AI 플랜 생성 중...":"✨ AI 프로젝트 플랜 자동 생성"}
        </Btn>
        {allTasks.length>0&&<span style={{fontSize:12,color:C.success,fontWeight:500}}>✓ 플랜 생성됨 ({allTasks.length}개 태스크)</span>}
      </div>
      {planL&&<div style={{display:"flex",alignItems:"center",gap:8,padding:14,color:"var(--color-text-secondary)",fontSize:13,marginTop:10,background:"var(--color-background-secondary)",borderRadius:8}}>⟳ 솔루션 정보를 분석해서 스프린트와 태스크를 생성하고 있습니다...</div>}
    </Panel>

    {/* 프로젝트 개요 */}
    <Panel title="프로젝트 개요" icon="📊">
      <div style={{marginBottom:10}}><FL c="프로젝트명" mt={0}/><Inp value={pm.pjName||""} onChange={v=>updPM({pjName:v})} placeholder="프로젝트명"/></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
        {[["전체 태스크",allTasks.length+"개",C.blue,C.blueBg],["완료",doneTasks.length+"개",C.success,C.successBg],["진행중",allTasks.filter(t=>t.status==="진행중").length+"개",C.warn,C.warnBg],["진행률",prog+"%",C.purple,C.purpleBg]].map(([l,v,c,bg])=><div key={l} style={{background:bg,borderRadius:8,padding:"8px 12px"}}><div style={{fontSize:11,color:"var(--color-text-secondary)",marginBottom:2}}>{l}</div><div style={{fontSize:15,fontWeight:500,color:c}}>{v}</div></div>)}
      </div>
      <div style={{marginTop:10,height:5,background:"var(--color-background-secondary)",borderRadius:3,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${prog}%`,background:C.purple,borderRadius:3,transition:"width 0.4s"}}/>
      </div>
    </Panel>
    {/* 뷰 탭 */}
    <div style={{display:"flex",border:"0.5px solid var(--color-border-tertiary)",borderRadius:10,overflow:"hidden",marginBottom:"1rem"}}>
      {[["board","📋 스프린트 보드"],["gantt","📅 간트차트"],["burndown","📉 번다운"],["resources","👥 리소스"]].map(([v,l])=><button key={v} onClick={()=>setView(v)} style={{flex:1,padding:"8px 4px",fontSize:12,border:"none",borderRight:"0.5px solid var(--color-border-tertiary)",background:view===v?C.purpleBg:"transparent",color:view===v?C.purple:"var(--color-text-secondary)",cursor:"pointer",fontFamily:"inherit",fontWeight:view===v?500:400}}>{l}</button>)}
    </div>
    {view==="board"&&<Board/>}
    {view==="gantt"&&<Gantt/>}
    {view==="burndown"&&<Burndown/>}
    {view==="resources"&&<Resources/>}
  </div>;
}

// ── 데이터 초기화 ──
const PHASES=[
  {id:0,key:"discovery",label:"Discovery",sub:"고객 발굴 & Pain Point 확정",color:C.blue,bg:C.blueBg,steps:["사전 준비","아이스브레이킹","현황 인터뷰","AI 분석","확정 & 전달"]},
  {id:1,key:"diagnosis",label:"Diagnosis",sub:"솔루션 설계 & 제안서 작성",color:C.teal,bg:C.tealBg,steps:["문제 재확인","솔루션 설계","실현 가능성","제안서 작성","발표 & 컨펌"]},
  {id:2,key:"build",label:"Build",sub:"구현 & 이관",color:C.purple,bg:C.purpleBg,steps:["개발 착수","MVP 구현","파일럿 테스트","이관 & 완료"]},
];

const initClient=()=>({
  id:Date.now(),name:"",industry:"",size:"",region:"",aiLevel:"",
  status:"discovery",phase:0,step:0,phasesDone:[false,false,false],
  updatedAt:new Date().toISOString(),
  hypothesis:[],directInfo:"",researchResult:"",interviewQ:"",
  prepCheck:{},iceCheck:{},iceMemo:"",
  notes:{q1:"",q2:"",q3:"",extra:""},audioFileName:"",transcribing:false,transcript:"",
  painPoints:[{title:"",type:"",impact:"",solution:""}],finalCheck:{},
  reconfirmNotes:"",additionalPP:"",reconfirmCheck:{},
  budget:"",timeline:"",
  solutions:[{title:"",type:"",desc:"",why:"",tool:"",effort:"",cost:""}],
  selectedSol:null,selectedSols:[],mergedSolution:null,
  feasCheck:{},riskNote:"",selectedRecommendations:"",recOptions:{},proposalDraft:"",proposalText:"",propCheck:{},
  presentCheck:{},objection:"",contractNote:"",
  testNotes:"",manualText:"",buildCheck:{},handoverCheck:{},caseStudy:"",
  buildTool:"",buildEffort:"",buildCost:"",
  pm:{sprints:[newSprint(1)],resources:[{id:1,name:"컨설턴트(본인)",role:"컨설턴트(본인)",avail:100}],velocity:20,pjName:""},
});

// ── 메인 앱 ──
export default function App(){
  const [clients,setClients]=useState([]);
  const [activeId,setActiveId]=useState(null);
  const [view,setView]=useState("home");
  const [aiSt,setAiSt]=useState({});
  const [copied,setCopied]=useState("");
  const [dbLoading,setDbLoading]=useState(true);
  const fileRef=useRef();

  // ── Supabase 연동 ──
  useEffect(()=>{
    supabase.from('clients')
      .select('id, data')
      .order('created_at',{ascending:false})
      .then(({data,error})=>{
        if(!error&&data) setClients(data.map(row=>({...row.data,id:row.id})));
        setDbLoading(false);
      });
  },[]);

  const saveClient = (client) => {
    const row={
      id:client.id,
      name:client.name||'',
      industry:client.industry||'',
      size:client.size||'',
      region:client.region||'',
      ai_level:client.aiLevel||'',
      status:client.status||'discovery',
      phase:client.phase||0,
      step:client.step||0,
      phases_done:client.phasesDone||[false,false,false],
      data:client,
    };
    supabase.from('clients').upsert(row,{onConflict:'id'})
      .then(({error})=>{if(error)console.error('저장 실패:',error);});
  };

  const deleteClient = async (id) => {
    const {error}=await supabase.from('clients').delete().eq('id',id);
    if(error)console.error('삭제 실패:',error);
  };

  const active=clients.find(c=>c.id===activeId);
  const upd = p => {
    setClients(cs => {
      const next = cs.map(c => {
        if(c.id!==activeId) return c;
        const updated={...c,...p,updatedAt:new Date().toISOString()};
        saveClient(updated);
        return updated;
      });
      return next;
    });
  };
  const updN=(k,p)=>setClients(cs=>cs.map(c=>c.id===activeId?{...c,[k]:{...c[k],...p}}:c));
  const aiGet=k=>aiSt[k]||{loading:false,result:null,error:false};
  const aiSet=(k,p)=>setAiSt(a=>({...a,[k]:{...a[k],...p}}));
  const runAI=async(k,sys,usr)=>{aiSet(k,{loading:true,result:null,error:false});try{aiSet(k,{loading:false,result:await claude(sys,usr),error:false});}catch{aiSet(k,{loading:false,result:null,error:true});}};

  const addClient = async () => {
    const c=initClient();
    const row={id:c.id,name:c.name||'',industry:c.industry||'',size:c.size||'',region:c.region||'',ai_level:c.aiLevel||'',status:c.status||'discovery',phase:c.phase||0,step:c.step||0,phases_done:c.phasesDone||[false,false,false],data:c};
    await supabase.from('clients').insert(row);
    setClients(cs=>[...cs,c]);
    setActiveId(c.id);
    setView("client");
  };
  const pc=ph=>[C.blue,C.teal,C.purple][ph]||C.blue;
  const pb=ph=>[C.blueBg,C.tealBg,C.purpleBg][ph]||C.blueBg;

  const next=ns=>{
    if(!active)return;
    const max=PHASES[active.phase].steps.length-1;
    if(ns>max){
      const nd=[...active.phasesDone];nd[active.phase]=true;
      const np=active.phase+1;
      if(np<PHASES.length)upd({phasesDone:nd,phase:np,step:0,status:PHASES[np].key});
      else upd({phasesDone:nd,status:"complete"});
    }else upd({step:ns});
  };

  const copyT=(t,k)=>{navigator.clipboard.writeText(t).then(()=>{setCopied(k);setTimeout(()=>setCopied(""),2000);});};
  const chosenSol=active?(active.selectedSols?.length>0?(active.mergedSolution||active.solutions[active.selectedSols[0]]):(active.selectedSol!=null?active.solutions[active.selectedSol]:null)):null;
  const validPPs=(active?.painPoints||[]).filter(p=>p.title);
  const effectiveTool=(active?.buildTool)||chosenSol?.tool||"";
  const effectiveEffort=(active?.buildEffort)||chosenSol?.effort||"";
  const effectiveCost=(active?.buildCost)||chosenSol?.cost||"";

  // 로딩 화면
  if(dbLoading) return <div style={{maxWidth:760,margin:"0 auto",padding:"3rem 0",textAlign:"center",color:"var(--color-text-secondary)",fontFamily:"var(--font-sans)"}}><div style={{fontSize:32,marginBottom:12}}>⟳</div><div style={{fontSize:14}}>데이터 불러오는 중...</div></div>;

  // 홈
  if(view==="home") return <div style={{maxWidth:760,margin:"0 auto",padding:"1rem 0",fontFamily:"var(--font-sans)"}}>
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:"1.5rem",paddingBottom:"1rem",borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
      <div style={{width:46,height:46,borderRadius:12,background:C.blueBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>🤝</div>
      <div style={{flex:1}}>
        <div style={{fontSize:18,fontWeight:500}}>AI 컨설팅 시스템 v3</div>
        <div style={{fontSize:13,color:"var(--color-text-secondary)",marginTop:2}}>Discovery · Diagnosis · Build & Handover 통합 관리</div>
      </div>
      <Btn v="blue" onClick={addClient}>+ 신규 고객 등록</Btn>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:"1.5rem"}}>
      {PHASES.map(p=><div key={p.id} style={{background:p.bg,border:`0.5px solid ${p.color}30`,borderRadius:12,padding:"12px 14px"}}>
        <div style={{fontSize:12,fontWeight:500,color:p.color,marginBottom:4}}>Phase {p.id+1}</div>
        <div style={{fontSize:14,fontWeight:500,marginBottom:4}}>{p.label}</div>
        <div style={{fontSize:11,color:"var(--color-text-secondary)",lineHeight:1.5}}>{p.sub}</div>
      </div>)}
    </div>
    {clients.length===0?<div style={{textAlign:"center",padding:"3rem 0",color:"var(--color-text-secondary)"}}>
      <div style={{fontSize:40,marginBottom:12}}>👤</div>
      <div style={{fontSize:14,marginBottom:16}}>등록된 고객이 없습니다</div>
      <Btn v="blue" onClick={addClient}>+ 첫 고객 등록하기</Btn>
    </div>:clients.map(c=>{
      const ph=PHASES[c.phase]||PHASES[0];const col=pc(c.phase);const bg=pb(c.phase);
      const completedSteps=c.phasesDone.reduce((acc,done,i)=>acc+(done?PHASES[i].steps.length:(c.phase===i?c.step:0)),0);
      const prg=c.status==="complete"?100:Math.round(completedSteps/14*100);
      return <div key={c.id} onClick={()=>{setActiveId(c.id);setView("client");}}
        style={{border:"0.5px solid var(--color-border-tertiary)",borderRadius:12,padding:"14px 16px",marginBottom:8,cursor:"pointer",background:"var(--color-background-primary)"}}
        onMouseEnter={e=>e.currentTarget.style.background="var(--color-background-secondary)"}
        onMouseLeave={e=>e.currentTarget.style.background="var(--color-background-primary)"}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:40,height:40,borderRadius:10,background:bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{c.status==="complete"?"🏆":["🔍","🔬","🔨"][c.phase]}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
              <span style={{fontSize:14,fontWeight:500}}>{c.name||"(이름 미입력)"}</span>
              {c.industry&&<Chip label={c.industry} color={col} bg={bg}/>}
            </div>
            <div style={{fontSize:12,color:col,fontWeight:500}}>{c.status==="complete"?"✓ 전체 완료":`${ph.label} · ${ph.steps[c.step]||""}`}</div>
            {c.updatedAt&&<div style={{fontSize:11,color:"var(--color-text-secondary)",marginTop:3}}>{new Date(c.updatedAt).toLocaleDateString('ko-KR',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})} 수정</div>}
          </div>
          <div style={{textAlign:"right",flexShrink:0}}>
            <div style={{fontSize:12,fontWeight:500,color:col,marginBottom:4}}>{prg}%</div>
            <div style={{width:60,height:3,background:"var(--color-background-secondary)",borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:`${prg}%`,background:col,borderRadius:2}}/></div>
          </div>
          <button
            onClick={e=>{e.stopPropagation();if(window.confirm(`${c.name||"이 고객"}을 삭제할까요?`)){deleteClient(c.id);setClients(cs=>cs.filter(x=>x.id!==c.id));}}}
            style={{fontSize:11,color:C.danger,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",marginLeft:8,flexShrink:0}}
          >✕</button>
        </div>
      </div>;
    })}
  </div>;

  if(!active) return null;
  const ph=PHASES[active.phase]||PHASES[0];
  const col=pc(active.phase),bg=pb(active.phase),steps=ph.steps;
  const completedSteps2=active.phasesDone.reduce((acc,done,i)=>acc+(done?PHASES[i].steps.length:(active.phase===i?active.step:0)),0);
  const prg2=active.status==="complete"?100:Math.round(completedSteps2/14*100);

  return <div style={{maxWidth:760,margin:"0 auto",padding:"1rem 0",fontFamily:"var(--font-sans)"}}>
    {/* 상단 네비 */}
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:"1rem"}}>
      <button onClick={()=>setView("home")} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:"var(--color-text-secondary)",fontFamily:"inherit",padding:0}}>← 목록</button>
      <span style={{color:"var(--color-text-secondary)"}}>·</span>
      <span style={{fontSize:13,fontWeight:500}}>{active.name||"신규 고객"}</span>
      <span style={{marginLeft:"auto",fontSize:12,color:col,fontWeight:500}}>{prg2}% 완료</span>
    </div>
    {/* Phase 표시 */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:"1.25rem"}}>
      {PHASES.map(p=>{const ia=active.phase===p.id,id=active.phasesDone[p.id],pc2=pc(p.id),pb2=pb(p.id);
        return <div key={p.id} onClick={()=>{if(id||ia)upd({phase:p.id,step:0,status:p.key});}} style={{borderRadius:10,padding:"10px 12px",background:id||ia?pb2:"var(--color-background-secondary)",border:`${ia?"2px":"0.5px"} solid ${ia||id?pc2+"50":"var(--color-border-tertiary)"}`,opacity:!ia&&!id?0.5:1,cursor:id||ia?"pointer":"default"}}>
          <div style={{fontSize:11,color:pc2,fontWeight:500}}>Phase {p.id+1}</div>
          <div style={{fontSize:13,fontWeight:500,marginTop:2}}>{p.label}</div>
          {id&&<div style={{fontSize:11,color:pc2,marginTop:2}}>✓ 완료</div>}
          {ia&&!id&&<div style={{fontSize:11,color:pc2,marginTop:2}}>{p.steps[active.step]}</div>}
        </div>;
      })}
    </div>
    {/* Step 탭 */}
    <div style={{display:"flex",border:"0.5px solid var(--color-border-tertiary)",borderRadius:12,overflow:"hidden",marginBottom:"1.25rem"}}>
      {steps.map((s,i)=>{const ia=active.step===i&&!active.phasesDone[active.phase],id=i<active.step||active.phasesDone[active.phase];
        return <button key={i} onClick={()=>upd({step:i})} style={{flex:1,padding:"7px 3px",fontSize:10,border:"none",borderRight:i<steps.length-1?"0.5px solid var(--color-border-tertiary)":"none",background:ia?bg:id?"var(--color-background-success)":"transparent",color:ia?col:id?C.success:"var(--color-text-secondary)",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,fontFamily:"inherit",fontWeight:ia?500:400,position:"relative"}}>
          {id&&<span style={{position:"absolute",top:3,right:4,fontSize:9,color:C.success}}>✓</span>}
          <span style={{fontSize:9,opacity:0.7}}>STEP {i+1}</span>
          <span style={{lineHeight:1.3,textAlign:"center"}}>{s}</span>
        </button>;
      })}
    </div>

    {/* ═══ PHASE 1 DISCOVERY ═══ */}
    {active.phase===0&&<>
      {/* D1 사전 준비 */}
      {active.step===0&&<>
        <InfoBanner phase="Discovery" step="STEP 1" color={C.blue} bg={C.blueBg}>AI 자동 조사 + 직접 입력 → 맞춤형 인터뷰 질문지 자동 생성</InfoBanner>
        <Panel title="고객 기본 정보" icon="🏪">
          <FL c="상호명 / 고객명" mt={0}/><Inp value={active.name} onChange={v=>upd({name:v})} placeholder="예: 종로 스윗베이커리"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div><FL c="업종"/><Sel value={active.industry} onChange={v=>upd({industry:v,hypothesis:[]})} options={INDUSTRIES}/></div>
            <div><FL c="규모"/><Sel value={active.size} onChange={v=>upd({size:v})} options={SIZES}/></div>
            <div><FL c="지역"/><Inp value={active.region} onChange={v=>upd({region:v})} placeholder="예: 서울 마포구"/></div>
            <div><FL c="AI 친숙도"/><Sel value={active.aiLevel} onChange={v=>upd({aiLevel:v})} options={AI_LEVELS}/></div>
          </div>
        </Panel>
        <ResearchPanel cl={active} upd={upd}/>
        <Panel title="사전 준비 체크리스트" icon="✅">
          {["고객 기본 정보 입력 완료","AI 자동 조사 실행 완료","직접 수집 정보 입력 완료","가설 Pain Point 2개 이상 선택","인터뷰 질문지 생성 완료"].map((t,i)=><ChkItem key={i} label={t} checked={!!active.prepCheck[i]} onChange={()=>updN("prepCheck",{[i]:!active.prepCheck[i]})}/>)}
        </Panel>
        <div style={{display:"flex",justifyContent:"flex-end",marginTop:"0.5rem"}}><Btn v="blue" onClick={()=>next(1)}>준비 완료 → 아이스브레이킹 →</Btn></div>
      </>}

      {/* D2 아이스브레이킹 */}
      {active.step===1&&<>
        <InfoBanner phase="Discovery" step="STEP 2" color={C.blue} bg={C.blueBg}>미팅 첫 10~15분 — AI 얘기는 아직 하지 마세요.</InfoBanner>
        <Panel title="오프닝 스크립트" icon="💬">
          {[["추천 오프닝",'"안녕하세요, 먼저 충분히 들을게요. 요즘 사업하시면서 어떤 부분이 제일 피부로 느껴지세요?"'],["AI 친숙도 파악",'"혹시 ChatGPT나 클로드 같은 거 써보신 적 있으세요?"'],["기대 수준 정렬",'"오늘은 충분히 들을게요. 어떤 도움이 가능한지 다음에 알려드릴게요."']].map(([l,t])=><div key={l} style={{border:"0.5px solid var(--color-border-tertiary)",borderRadius:8,padding:"10px 12px",marginBottom:8,background:"var(--color-background-secondary)"}}><div style={{fontSize:11,fontWeight:500,color:C.blue,marginBottom:4}}>{l}</div><div style={{fontSize:13}}>{t}</div></div>)}
          <div style={{height:1,background:"var(--color-border-tertiary)",margin:"12px 0"}}/>
          <FL c="실제 확인한 AI 친숙도" mt={0}/>
          <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:4}}>{AI_LEVELS.map(l=><Tag key={l} label={l} selected={active.aiLevel===l} onClick={()=>upd({aiLevel:l})}/>)}</div>
          <FL c="특이사항 메모"/><TA value={active.iceMemo} onChange={v=>upd({iceMemo:v})} placeholder="특이사항..." rows={3}/>
        </Panel>
        <Panel title="체크리스트" icon="✅">
          {["인사 및 자기소개 완료","분위기 완화 완료","AI 친숙도 확인","기대 수준 정렬","편한 분위기 형성"].map((t,i)=><ChkItem key={i} label={t} checked={!!active.iceCheck[i]} onChange={()=>updN("iceCheck",{[i]:!active.iceCheck[i]})}/>)}
        </Panel>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:"0.5rem"}}><Btn v="ghost" onClick={()=>upd({step:0})}>← 이전</Btn><Btn v="blue" onClick={()=>next(2)}>완료 →</Btn></div>
      </>}

      {/* D3 현황 인터뷰 */}
      {active.step===2&&<>
        <InfoBanner phase="Discovery" step="STEP 3" color={C.blue} bg={C.blueBg}>핵심 40~50분 — 80% 듣고 20% 말하기</InfoBanner>
        {active.interviewQ&&<Panel title="생성된 질문지 참고" icon="📋" accent={C.blueBg}>
          <div style={{fontSize:12,color:C.blue,marginBottom:6}}>Step 1에서 생성된 맞춤형 질문지</div>
          <div style={{fontSize:12,lineHeight:1.7,whiteSpace:"pre-wrap",color:"var(--color-text-secondary)",maxHeight:180,overflowY:"auto",background:"var(--color-background-primary)",borderRadius:8,padding:"10px 12px"}}>{active.interviewQ}</div>
        </Panel>}
        <Panel title="핵심 3질문 메모" icon="❓">
          {[["1","하루 일과를 말씀해 주세요. 아침부터 문 닫을 때까지 어떻게 흘러가나요?","q1"],["2","시간이 제일 많이 걸리는 일, 실수가 잦은 일은 뭔가요?","q2"],["3","자다가 걱정되는 일, 월말에 골치 아픈 일이 있나요?","q3"]].map(([n,q,k])=><div key={k} style={{border:"0.5px solid var(--color-border-tertiary)",borderRadius:8,padding:"10px 12px",marginBottom:10,background:"var(--color-background-secondary)"}}><div style={{fontSize:11,fontWeight:500,color:C.warn,marginBottom:4}}>Q{n}</div><div style={{fontSize:13,marginBottom:8,lineHeight:1.5}}>"{q}"</div><TA value={active.notes[k]} onChange={v=>updN("notes",{[k]:v})} placeholder="고객 답변 메모..." rows={3}/></div>)}
          <FL c="추가 탐색 메모"/><TA value={active.notes.extra} onChange={v=>updN("notes",{extra:v})} placeholder="예산, 도구, 직원 관련..." rows={3}/>
        </Panel>
        <Panel title="녹음 파일 업로드" icon="🎙">
          {!active.audioFileName?<div onClick={()=>fileRef.current?.click()} style={{border:"1.5px dashed var(--color-border-secondary)",borderRadius:12,padding:"1.5rem",textAlign:"center",cursor:"pointer",background:"var(--color-background-secondary)"}}><div style={{fontSize:28,marginBottom:6}}>⬆</div><div style={{fontSize:13,color:"var(--color-text-secondary)"}}>녹음 파일 업로드 (MP3, M4A, WAV)</div></div>:<div style={{display:"flex",alignItems:"center",gap:10,padding:12,background:C.successBg,borderRadius:8}}><span style={{fontSize:20}}>🎵</span><div style={{flex:1}}><div style={{fontSize:13,fontWeight:500,color:C.success}}>{active.audioFileName}</div></div><button onClick={()=>upd({audioFileName:""})} style={{background:"none",border:"none",cursor:"pointer",fontSize:16}}>✕</button></div>}
          {active.transcribing && (
            <div style={{display:"flex",alignItems:"center",gap:8,padding:12,
              background:"#f9fafb",borderRadius:8,marginTop:8,fontSize:13,color:"#6b7280"}}>
              ⟳ Whisper AI가 음성을 텍스트로 변환하고 있습니다...
            </div>
          )}
          {active.transcript && !active.transcribing && (
            <div style={{marginTop:10}}>
              <div style={{fontSize:12,fontWeight:500,color:"#111",marginBottom:6}}>
                📝 음성 변환 결과 (자동 생성)
              </div>
              <div style={{background:"#1a1a2e",borderRadius:8,padding:"12px 14px",
                fontSize:13,color:"#90ee90",lineHeight:1.8,whiteSpace:"pre-wrap",
                maxHeight:200,overflowY:"auto"}}>
                {active.transcript}
              </div>
              <div style={{fontSize:12,color:"#6b7280",marginTop:6}}>
                💡 위 내용이 STEP 4 AI 분석에 자동으로 활용됩니다.
              </div>
            </div>
          )}
          <input ref={fileRef} type="file" accept="audio/*,video/*" style={{display:"none"}}
            onChange={async e => {
              const file = e.target.files[0]
              if (!file) return
              upd({ audioFileName: file.name, transcribing: true, transcript: '' })

              try {
                const formData = new FormData()
                const ext = file.name.split('.').pop() || 'mp3'
                formData.append('audio', file, `audio.${ext}`)

                const res = await fetch('/api/transcribe', {
                  method: 'POST',
                  body: formData,
                })
                const data = await res.json()

                if (data.text) {
                  upd({ transcript: data.text, transcribing: false })
                } else {
                  upd({ transcribing: false })
                  alert('변환 실패: ' + (data.error || '알 수 없는 오류'))
                }
              } catch (err) {
                upd({ transcribing: false })
                alert('변환 중 오류 발생: ' + err.message)
              }
            }}
          />
        </Panel>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:"0.5rem"}}><Btn v="ghost" onClick={()=>upd({step:1})}>← 이전</Btn><Btn v="blue" onClick={()=>next(3)}>완료 → AI 분석 →</Btn></div>
      </>}

      {/* D4 AI 분석 */}
      {active.step===3&&<>
        <Panel title="AI Pain Point 분석" icon="🤖">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
            {[["고객",active.name],["업종",active.industry],["AI 친숙도",active.aiLevel],["녹음파일",active.audioFileName||"없음"]].map(([l,v])=><div key={l} style={{background:"var(--color-background-secondary)",borderRadius:8,padding:"8px 12px"}}><div style={{fontSize:11,color:"var(--color-text-secondary)",marginBottom:2}}>{l}</div><div style={{fontSize:13,fontWeight:500}}>{v||"미입력"}</div></div>)}
          </div>
          <Btn v="blue" onClick={()=>runAI("d_an","소상공인 인터뷰 분석. 순수 JSON만 출력.\n{\"painPoints\":[{\"rank\":1,\"title\":\"제목\",\"type\":\"반복업무자동화|정보부족분석|고객응대자동화\",\"impact\":\"영향1줄\",\"solution\":\"솔루션방향1줄\"}],\"summary\":\"요약2줄\",\"nextAction\":\"권고1줄\"}",
            `고객:${active.name} 업종:${active.industry} AI친숙도:${active.aiLevel}\n가설:${(active.hypothesis||[]).join(",")}\nQ1:${active.notes.q1}\nQ2:${active.notes.q2}\nQ3:${active.notes.q3}\n추가:${active.notes.extra}\n${active.transcript?"[녹음 파일 변환 텍스트]\n"+active.transcript:""}`
          )} disabled={aiGet("d_an").loading}>{aiGet("d_an").loading?"⟳ 분석 중...":"✨ AI 분석 실행"}</Btn>
          {(()=>{const a=aiGet("d_an");if(a.loading)return <AIBox loading={true} color={C.blue}/>;if(a.error)return <AIBox error={true} color={C.blue}/>;if(a.result){let p=null;try{p=JSON.parse(a.result.replace(/```json|```/g,"").trim());}catch{}if(p?.painPoints){if(active.painPoints.every(pp=>!pp.title))setTimeout(()=>upd({painPoints:p.painPoints.map(pp=>({title:pp.title||"",type:pp.type||"",impact:pp.impact||"",solution:pp.solution||""}))}),0);return <div style={{borderLeft:`3px solid ${C.blue}`,background:"var(--color-background-secondary)",borderRadius:"0 8px 8px 0",padding:"12px 14px",marginTop:10,fontSize:13,lineHeight:1.8}}><div style={{fontSize:12,fontWeight:500,color:C.blue,marginBottom:8}}>✦ AI 분석 완료</div>{p.summary&&<div style={{marginBottom:10,paddingBottom:10,borderBottom:"0.5px solid var(--color-border-tertiary)"}}>{p.summary}</div>}{p.painPoints.map((pp,i)=><div key={i} style={{marginBottom:8,padding:"8px 10px",background:"var(--color-background-primary)",borderRadius:8}}><div style={{fontSize:12,fontWeight:500,marginBottom:2}}>#{pp.rank} {pp.title} <Chip label={pp.type} color={C.blue} bg={C.blueBg}/></div><div style={{fontSize:12,color:"var(--color-text-secondary)"}}>영향: {pp.impact}</div><div style={{fontSize:12,color:C.success}}>→ {pp.solution}</div></div>)}{p.nextAction&&<div style={{fontSize:12,color:C.warn,marginTop:6}}>→ {p.nextAction}</div>}</div>;}return <AIBox loading={false} result={a.result} error={false} color={C.blue}/>;}return null;})()}
        </Panel>
        <Panel title="Pain Point 편집" icon="📋">
          {(active.painPoints||[]).map((pp,i)=><div key={i} style={{border:"0.5px solid var(--color-border-tertiary)",borderRadius:8,padding:"12px",marginBottom:10,position:"relative"}}>
            <div style={{position:"absolute",top:8,right:10,fontSize:11,background:C.blueBg,color:C.blue,padding:"2px 8px",borderRadius:10}}>#{i+1}</div>
            <FL c="제목" mt={0}/><Inp value={pp.title} onChange={v=>upd({painPoints:active.painPoints.map((p,j)=>j===i?{...p,title:v}:p)})} placeholder="예: 재고 수기 관리"/>
            <FL c="유형"/><div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:4}}>{PAIN_TYPES.map(t=><Tag key={t} label={t} selected={pp.type===t} onClick={()=>upd({painPoints:active.painPoints.map((p,j)=>j===i?{...p,type:t}:p)})}/>)}</div>
            <FL c="현재 영향"/><Inp value={pp.impact} onChange={v=>upd({painPoints:active.painPoints.map((p,j)=>j===i?{...p,impact:v}:p)})} placeholder="예: 하루 1시간 낭비"/>
          </div>)}
          <Btn onClick={()=>upd({painPoints:[...(active.painPoints||[]),{title:"",type:"",impact:"",solution:""}]})}>+ 추가</Btn>
        </Panel>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:"0.5rem"}}><Btn v="ghost" onClick={()=>upd({step:2})}>← 이전</Btn><Btn v="blue" onClick={()=>next(4)}>완료 →</Btn></div>
      </>}

      {/* D5 확정 & 전달 */}
      {active.step===4&&<>
        <Panel title="Pain Point 요약 문서" icon="📄">
          <div style={{background:"var(--color-background-secondary)",borderRadius:8,padding:"14px 16px",fontSize:13,lineHeight:1.8}}>
            <div style={{fontSize:12,fontWeight:500,color:C.blue,marginBottom:6}}>고객 현황 요약</div>
            <div>• 상호: <strong>{active.name||"미입력"}</strong> / 업종: {active.industry||"미입력"} / 규모: {active.size||"미입력"}</div>
            <div>• AI 친숙도: <Chip label={active.aiLevel||"미확인"}/></div>
            <div style={{height:1,background:"var(--color-border-tertiary)",margin:"10px 0"}}/>
            <div style={{fontSize:12,fontWeight:500,color:C.blue,marginBottom:6}}>확인된 Pain Point</div>
            {validPPs.length?validPPs.map((pt,i)=><div key={i} style={{padding:"8px 10px",borderRadius:8,border:"0.5px solid var(--color-border-tertiary)",marginBottom:6,background:"var(--color-background-primary)"}}><div style={{fontSize:13,fontWeight:500}}>#{i+1} {pt.title} <Chip label={pt.type}/></div>{pt.impact&&<div style={{fontSize:12,color:"var(--color-text-secondary)"}}>영향: {pt.impact}</div>}</div>):<div style={{fontSize:13,color:"var(--color-text-secondary)"}}>Pain Point 미입력</div>}
          </div>
          <Btn onClick={()=>copyT(validPPs.map((pt,i)=>`#${i+1} ${pt.title}\n영향: ${pt.impact}`).join("\n\n"),"sum")} style={{marginTop:10}}>{copied==="sum"?"✓ 복사됨":"📋 복사"}</Btn>
        </Panel>
        <Panel title="완료 체크리스트" icon="✅">
          {["요약 문서 고객 전달","고객 컨펌 수령","다음 미팅 일정 확정"].map((t,i)=><ChkItem key={i} label={t} checked={!!active.finalCheck[i]} onChange={()=>updN("finalCheck",{[i]:!active.finalCheck[i]})}/>)}
        </Panel>
        <div style={{marginTop:14}}><Btn v="blue" onClick={()=>next(5)}>✓ Discovery 완료 → Diagnosis →</Btn></div>
        <div style={{marginTop:"0.5rem"}}><Btn v="ghost" onClick={()=>upd({step:3})}>← 이전</Btn></div>
      </>}
    </>}

    {/* ═══ PHASE 2 DIAGNOSIS ═══ */}
    {active.phase===1&&<>
      {active.step===0&&<>
        <InfoBanner phase="Diagnosis" step="STEP 1" color={C.teal} bg={C.tealBg}>Discovery 결과를 재확인하고 예산·의사결정 구조를 파악합니다.</InfoBanner>
        <Panel title="Discovery 결과" icon="📥" accent={C.tealBg}>
          {validPPs.length?validPPs.map((pt,i)=><div key={i} style={{padding:"8px 10px",borderRadius:8,border:"0.5px solid var(--color-border-tertiary)",marginBottom:6,background:"var(--color-background-primary)"}}><div style={{fontSize:13,fontWeight:500}}>#{i+1} {pt.title} <Chip label={pt.type} color={C.teal} bg={C.tealBg}/></div><div style={{fontSize:12,color:"var(--color-text-secondary)"}}>영향: {pt.impact}</div></div>):<div style={{fontSize:13,color:"var(--color-text-secondary)"}}>Pain Point 없음 — Discovery 재확인 필요</div>}
        </Panel>
        <Panel title="2차 미팅 재확인" icon="🔎">
          <FL c="추가 파악 내용" mt={0}/><TA value={active.additionalPP} onChange={v=>upd({additionalPP:v})} placeholder="2차 미팅 추가 내용..." rows={3}/>
          <FL c="예산·의사결정 메모"/><TA value={active.reconfirmNotes} onChange={v=>upd({reconfirmNotes:v})} placeholder="예산 범위, 의사결정자..." rows={3}/>
          <Btn v="teal" onClick={()=>runAI("dg_rc","Discovery 결과 Diagnosis 재검토. 추가 확인 포인트 200자 이내.",`고객:${active.name} 업종:${active.industry} PP:${validPPs.map(p=>p.title).join(",")}\n추가:${active.additionalPP}`)} disabled={aiGet("dg_rc").loading} style={{marginTop:10}}>{aiGet("dg_rc").loading?"⟳ 분석 중...":"🤖 AI 추가 확인 포인트"}</Btn>
          <AIBox loading={aiGet("dg_rc").loading} result={aiGet("dg_rc").result} error={aiGet("dg_rc").error} color={C.teal}/>
        </Panel>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:"0.5rem"}}><Btn v="ghost" onClick={()=>upd({phase:0,step:4,status:"discovery"})}>← Discovery로</Btn><Btn v="teal" onClick={()=>next(1)}>완료 →</Btn></div>
      </>}

      {/* DG2 솔루션 설계 */}
      {active.step===1&&<>
        <InfoBanner phase="Diagnosis" step="STEP 2" color={C.teal} bg={C.tealBg}>
          솔루션 선택 → 제안서 초안 자동 생성 → STEP 3 실현 가능성 평가 순서로 진행하세요.
        </InfoBanner>
        <SolutionPanel cl={active} upd={upd} aiGet={aiGet} runAI={runAI}/>

        {/* 제안서 초안 자동 생성 — STEP 3 실현 가능성 평가 전에 필요 */}
        {(active.selectedSols||[]).length>0&&<>
          <Panel title="제안서 초안 자동 생성" icon="📋" bl={C.teal}>
            <div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:12,lineHeight:1.6}}>
              선택된 솔루션을 바탕으로 제안서 초안을 생성합니다.<br/>
              이 내용을 바탕으로 STEP 3에서 실현 가능성을 평가할 수 있습니다.
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
              {[["고객",active.name],["솔루션",chosenSol?.title||"미선택"],["예산",active.budget||"미입력"],["일정",active.timeline||"미입력"]].map(([l,v])=>(
                <div key={l} style={{background:"var(--color-background-secondary)",borderRadius:8,padding:"8px 12px"}}>
                  <div style={{fontSize:11,color:"var(--color-text-secondary)",marginBottom:2}}>{l}</div>
                  <div style={{fontSize:13,fontWeight:500}}>{v||"미입력"}</div>
                </div>
              ))}
            </div>
            <Btn v="teal" onClick={async()=>{
              aiSet("dg_proposal_draft",{loading:true,result:null,error:false});
              try{
                const solDesc=(active.mergedSolution?.title)||(active.selectedSols||[]).map(i=>(active.solutions||[])[i]?.title).filter(Boolean).join(" + ")||"미선택";
                const tools=(active.selectedSols||[]).map(i=>(active.solutions||[])[i]?.tool).filter(Boolean).join(", ")||"미정";
                const r=await claude(
                  `당신은 IT 컨설턴트입니다. 소상공인 고객을 위한 AI 솔루션 제안서 초안을 작성하세요.
반드시 아래 6개 항목을 모두 포함하세요:

[1. 제안 솔루션 (TO-BE)]
• 시스템 개요 및 아키텍처
• 주요 기능 설명 (3~5개)
• 기술 스택
• 차별화 포인트

[2. 구축 범위]
• 포함 범위 (In-Scope)
• 제외 범위 (Out-of-Scope)
• 인터페이스/연동 대상

[3. 추진 일정 (WBS)]
• 단계별 일정 (착수→분석→설계→개발→테스트→오픈)
• 마일스톤

[4. 추진 조직 및 역할]
• 제안사 투입 인력 및 역할
• 고객사 협조 사항

[5. 사업비 (견적)]
• 항목별 비용 내역
• 유지보수 비용
• 지급 조건

[6. 기대 효과]
• 정량적 효과 (비용 절감, 처리 시간 단축 등)
• 정성적 효과 (업무 편의성, 데이터 가시성 등)
• ROI`,
                  `고객: ${active.name||"미입력"} / 업종: ${active.industry||"미입력"} / 규모: ${active.size||"미입력"}
AI친숙도: ${active.aiLevel||"미입력"}
핵심 Pain Point: ${validPPs.map((p,i)=>`#${i+1} ${p.title}(영향:${p.impact})`).join(" / ")||"미입력"}
제안 솔루션: ${solDesc}
사용 도구/기술: ${tools}
예산 범위: ${active.budget||"미정"} / 구축 기간: ${active.timeline||"미정"}`,
                  4000
                );
                upd({proposalDraft:r});
                aiSet("dg_proposal_draft",{loading:false,result:"완료",error:false});
              }catch(e){
                aiSet("dg_proposal_draft",{loading:false,result:null,error:true});
              }
            }} disabled={aiGet("dg_proposal_draft").loading||!chosenSol?.title}>
              {aiGet("dg_proposal_draft").loading?"⟳ 제안서 초안 생성 중...":"✨ 제안서 초안 자동 생성 (6개 항목)"}
            </Btn>
            {aiGet("dg_proposal_draft").error&&<AIBox loading={false} result={null} error={true} color={C.teal}/>}
            {(active.proposalDraft||aiGet("dg_proposal_draft").loading)&&!aiGet("dg_proposal_draft").error&&(
              aiGet("dg_proposal_draft").loading
                ?<div style={{display:"flex",alignItems:"center",gap:8,padding:14,color:"var(--color-text-secondary)",fontSize:13,marginTop:10,background:"var(--color-background-secondary)",borderRadius:8}}>⟳ 6개 항목 제안서를 작성하고 있습니다...</div>
                :<>
                  <div style={{fontSize:12,color:C.teal,fontWeight:500,marginTop:10,marginBottom:6}}>✦ 제안서 초안 완성 — 내용을 확인하고 STEP 3으로 진행하세요</div>
                  <TA value={active.proposalDraft||""} onChange={v=>upd({proposalDraft:v})} rows={20}/>
                  <div style={{display:"flex",gap:8,marginTop:8}}>
                    <Btn onClick={()=>{navigator.clipboard.writeText(active.proposalDraft||"");}}> 📋 복사</Btn>
                    <Btn v="ghost" onClick={async()=>{
                      aiSet("dg_proposal_draft",{loading:true,result:null,error:false});
                      const solDesc=(active.mergedSolution?.title)||(active.selectedSols||[]).map(i=>(active.solutions||[])[i]?.title).filter(Boolean).join(" + ")||"미선택";
                      const tools=(active.selectedSols||[]).map(i=>(active.solutions||[])[i]?.tool).filter(Boolean).join(", ")||"미정";
                      try{
                        const r=await claude("IT 컨설턴트. 소상공인 AI 솔루션 제안서 초안. [1.제안솔루션(TO-BE)] [2.구축범위] [3.추진일정WBS] [4.추진조직및역할] [5.사업비견적] [6.기대효과ROI] 6개 항목 모두 포함.",
                          `고객:${active.name} 업종:${active.industry} PP:${validPPs.map(p=>p.title).join(",")} 솔루션:${solDesc} 도구:${tools} 예산:${active.budget} 일정:${active.timeline}`,
                          4000
                        );
                        upd({proposalDraft:r});
                        aiSet("dg_proposal_draft",{loading:false,result:"완료",error:false});
                      }catch{aiSet("dg_proposal_draft",{loading:false,result:null,error:true});}
                    }} disabled={aiGet("dg_proposal_draft").loading}>🔄 재생성</Btn>
                  </div>
                </>
            )}
          </Panel>
        </>}

        <div style={{display:"flex",justifyContent:"space-between",marginTop:"0.5rem"}}>
          <Btn v="ghost" onClick={()=>upd({step:0})}>← 이전</Btn>
          <Btn v="teal" onClick={()=>next(2)} disabled={!(active.selectedSols||[]).length||!active.proposalDraft}>
            {!(active.selectedSols||[]).length?"솔루션을 선택하세요":!active.proposalDraft?"제안서 초안을 먼저 생성하세요":"제안서 초안 완료 → 실현 가능성 평가 →"}
          </Btn>
        </div>
      </>}

      {/* DG3 실현 가능성 */}
      {active.step===2&&(()=>{
        const selSols=(active.selectedSols||[]).map(i=>(active.solutions||[])[i]).filter(Boolean);
        const hasMerged=!!active.mergedSolution;
        const evalTargets=hasMerged
          ?[{...active.mergedSolution,isMerged:true}]
          :selSols.length>0?selSols:[chosenSol].filter(Boolean);
        return <>
          <InfoBanner phase="Diagnosis" step="STEP 3" color={C.teal} bg={C.tealBg}>
            STEP 2에서 생성된 제안서 초안을 바탕으로 실현 가능성을 평가합니다.
          </InfoBanner>

          {/* 제안서 초안 요약 참조 */}
          {active.proposalDraft&&(
            <Panel title="STEP 2 제안서 초안 요약" icon="📋" accent={C.tealBg}>
              <div style={{fontSize:12,color:C.teal,marginBottom:8,fontWeight:500}}>
                아래 제안서 내용을 참고해서 실현 가능성을 평가하세요.
              </div>
              <div style={{background:"var(--color-background-primary)",borderRadius:8,padding:"12px 14px",fontSize:12,lineHeight:1.8,whiteSpace:"pre-wrap",maxHeight:200,overflowY:"auto",color:"var(--color-text-secondary)"}}>
                {active.proposalDraft}
              </div>
            </Panel>
          )}
          {!active.proposalDraft&&(
            <div style={{padding:"12px 14px",background:C.warnBg,borderRadius:8,fontSize:13,color:C.warn,marginBottom:"1rem",display:"flex",alignItems:"center",gap:8}}>
              <span>⚠</span>
              <div>
                <div style={{fontWeight:500,marginBottom:2}}>제안서 초안이 없습니다</div>
                <div style={{fontSize:12}}>STEP 2로 돌아가서 제안서 초안을 먼저 생성해 주세요.</div>
              </div>
              <Btn sm v="teal" onClick={()=>upd({step:1})} style={{marginLeft:"auto"}}>← STEP 2로</Btn>
            </div>
          )}

          {/* 선택 솔루션 전체 표시 */}
          <Panel title="평가 대상 솔루션" icon="🎯" accent={C.tealBg}>
            {evalTargets.length===0
              ?<div style={{fontSize:13,color:"var(--color-text-secondary)"}}>STEP 2에서 솔루션을 선택해 주세요.</div>
              :evalTargets.map((sol,i)=><div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 12px",borderRadius:8,border:`0.5px solid ${C.tealLt}`,background:"var(--color-background-primary)",marginBottom:8}}>
                <div style={{width:22,height:22,borderRadius:"50%",background:C.teal,color:"#fff",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontWeight:500}}>{i+1}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:500,marginBottom:4}}>{sol.title||"(제목없음)"}</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {sol.type&&<Chip label={sol.type} color={C.teal} bg={C.tealBg}/>}
                    {sol.tool&&<span style={{fontSize:11,color:"var(--color-text-secondary)"}}>🔧 {sol.tool}</span>}
                    {sol.effort&&<span style={{fontSize:11,background:C.warnBg,color:C.warn,padding:"2px 6px",borderRadius:6}}>⏱ {sol.effort}</span>}
                    {sol.cost&&<span style={{fontSize:11,background:C.purpleBg,color:C.purple,padding:"2px 6px",borderRadius:6}}>💰 {sol.cost}</span>}
                    {sol.isMerged&&<span style={{fontSize:11,background:C.tealBg,color:C.teal,padding:"2px 8px",borderRadius:6,fontWeight:500}}>통합 솔루션</span>}
                  </div>
                </div>
              </div>)
            }
          </Panel>

          {/* 솔루션별 AI 실현 가능성 평가 */}
          {evalTargets.map((sol,i)=>{
            const aiKey=`dg_fs_${i}`;
            return <Panel key={i} title={`솔루션 ${i+1} 실현 가능성 평가`} icon="🔍" bl={C.teal}>
              <div style={{fontSize:13,fontWeight:500,color:C.teal,marginBottom:10}}>{sol.title}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:12}}>
                {[["체크","스마트폰 운영 가능",!!active.feasCheck[`${i}_0`],`${i}_0`],
                  ["체크","기존 도구 연동 검토",!!active.feasCheck[`${i}_1`],`${i}_1`],
                  ["체크","예산 범위 내",!!active.feasCheck[`${i}_2`],`${i}_2`],
                  ["체크","고객 혼자 운영 가능",!!active.feasCheck[`${i}_3`],`${i}_3`],
                  ["체크","2주 내 MVP 가능",!!active.feasCheck[`${i}_4`],`${i}_4`],
                ].map(([,label,checked,key])=>(
                  <label key={key} onClick={()=>updN("feasCheck",{[key]:!active.feasCheck[key]})}
                    style={{display:"flex",alignItems:"center",gap:6,padding:"7px 10px",borderRadius:8,
                      border:`0.5px solid ${checked?"var(--color-border-success)":"var(--color-border-tertiary)"}`,
                      background:checked?"var(--color-background-success)":"var(--color-background-primary)",cursor:"pointer"}}>
                    <input type="checkbox" checked={checked} onChange={()=>{}} onClick={e=>e.stopPropagation()} style={{accentColor:C.teal}}/>
                    <span style={{fontSize:12,textDecoration:checked?"line-through":"none",opacity:checked?0.6:1}}>{label}</span>
                  </label>
                ))}
              </div>
              <Btn v="teal" sm onClick={()=>runAI(aiKey,
                "소상공인 AI 솔루션 실현 가능성 평가. 제안서 초안을 참고해서 아래 4가지를 간결하게:\n✅ 강점(1~2줄)\n⚠️ 리스크(1~2줄)\n💡 성공 조건(1줄)\n📌 권고(1줄)",
                `솔루션:${sol.title}(${sol.type||""}) 도구:${sol.tool||""}\n기간:${sol.effort||""} 비용:${sol.cost||""}\n고객:${active.name} AI친숙도:${active.aiLevel}\n예산:${active.budget} 리스크메모:${active.riskNote||"없음"}\n\n[제안서 초안 참조]\n${(active.proposalDraft||"없음").substring(0,800)}`
              )} disabled={aiGet(aiKey).loading}>
                {aiGet(aiKey).loading?"⟳ 평가 중...":"🤖 AI 실현 가능성 평가"}
              </Btn>
              <AIBox loading={aiGet(aiKey).loading} result={aiGet(aiKey).result} error={aiGet(aiKey).error} onRetry={()=>runAI(aiKey,"","")} color={C.teal}/>
            </Panel>;
          })}

          {/* 공통 리스크 메모 */}
          <Panel title="공통 리스크 메모" icon="⚠️">
            <TA value={active.riskNote} onChange={v=>upd({riskNote:v})} placeholder="전체 솔루션에 공통으로 적용되는 리스크나 제약 조건..." rows={3}/>
          </Panel>

          {/* 권고 사항 선택 → 제안서 반영 */}
          <Panel title="권고 사항 선택 → 제안서 반영" icon="✅" bl={C.teal}>
            <div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:12,lineHeight:1.6}}>
              위 AI 평가에서 나온 권고 사항을 직접 입력하거나 선택해서 제안서 초안에 반영할 수 있습니다.
            </div>
            <FL c="반영할 권고 사항 (AI 평가 결과에서 복사해서 입력)" mt={0}/>
            <TA
              value={active.selectedRecommendations||""}
              onChange={v=>upd({selectedRecommendations:v})}
              placeholder={`예:\n• 초기 2주는 재고 수기 병행 운영 권장\n• 카카오 알림톡 사전 채널 개설 필요\n• 포스 API 연동 가능 여부 사전 확인 필요`}
              rows={5}
            />
            <FL c="제안서에 반영할 항목 선택"/>
            <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:4}}>
              {[
                ["rec_risk","⚠️ 리스크 완화 방안을 구축 범위에 추가"],
                ["rec_schedule","📅 권고 일정 조정 사항을 WBS에 반영"],
                ["rec_cost","💰 추가 비용 항목을 사업비에 반영"],
                ["rec_role","👤 고객사 협조 사항을 추진 조직에 추가"],
                ["rec_effect","📊 성공 조건을 기대 효과 ROI에 반영"],
              ].map(([key,label])=>(
                <label key={key} onClick={()=>updN("recOptions",{[key]:!active.recOptions?.[key]})}
                  style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:8,
                    border:`0.5px solid ${active.recOptions?.[key]?"var(--color-border-success)":"var(--color-border-tertiary)"}`,
                    background:active.recOptions?.[key]?"var(--color-background-success)":"var(--color-background-primary)",
                    cursor:"pointer"}}>
                  <input type="checkbox" checked={!!active.recOptions?.[key]} onChange={()=>{}} onClick={e=>e.stopPropagation()} style={{accentColor:C.teal}}/>
                  <span style={{fontSize:13,textDecoration:active.recOptions?.[key]?"line-through":"none",opacity:active.recOptions?.[key]?0.6:1}}>{label}</span>
                </label>
              ))}
            </div>
            {(active.selectedRecommendations||Object.values(active.recOptions||{}).some(Boolean))&&(
              <div style={{marginTop:14}}>
                <Btn v="teal" onClick={async()=>{
                  aiSet("dg_proposal_revised",{loading:true,result:null,error:false});
                  const solDesc=(active.mergedSolution?.title)||(active.selectedSols||[]).map(i=>(active.solutions||[])[i]?.title).filter(Boolean).join(" + ")||"미선택";
                  const tools=(active.selectedSols||[]).map(i=>(active.solutions||[])[i]?.tool).filter(Boolean).join(", ")||"미정";
                  const selectedOpts=Object.entries(active.recOptions||{}).filter(([,v])=>v).map(([k])=>({
                    rec_risk:"리스크 완화 방안 → 구축 범위 반영",
                    rec_schedule:"일정 조정 → WBS 반영",
                    rec_cost:"추가 비용 항목 → 사업비 반영",
                    rec_role:"고객사 협조 사항 → 추진 조직 반영",
                    rec_effect:"성공 조건 → 기대 효과 ROI 반영",
                  }[k])).filter(Boolean);
                  try{
                    const r=await claude(
                      `당신은 IT 컨설턴트입니다. 기존 제안서 초안에 실현 가능성 평가의 권고 사항을 반영해서 제안서를 개선하세요.
반드시 아래 6개 항목을 모두 포함하세요:
[1. 제안 솔루션 (TO-BE)] 시스템 개요, 주요 기능, 기술 스택, 차별화 포인트
[2. 구축 범위] In-Scope, Out-of-Scope, 연동 대상
[3. 추진 일정 (WBS)] 단계별 일정, 마일스톤
[4. 추진 조직 및 역할] 투입 인력, 고객사 협조 사항
[5. 사업비 (견적)] 항목별 비용, 유지보수, 지급 조건
[6. 기대 효과] 정량적 효과, 정성적 효과, ROI`,
                      `고객:${active.name} 업종:${active.industry} 규모:${active.size}
PP:${validPPs.map(p=>`${p.title}(영향:${p.impact})`).join(" / ")||"미입력"}
솔루션:${solDesc} 도구:${tools}
예산:${active.budget} 일정:${active.timeline}

[기존 제안서 초안]
${(active.proposalDraft||"없음").substring(0,600)}

[반영할 권고 사항]
${active.selectedRecommendations||"없음"}

[반영 항목]
${selectedOpts.join("\n")||"없음"}

위 권고 사항과 반영 항목을 적극적으로 제안서에 녹여서 개선해주세요.`,
                      4000
                    );
                    upd({proposalDraft:r});
                    aiSet("dg_proposal_revised",{loading:false,result:"완료",error:false});
                  }catch{
                    aiSet("dg_proposal_revised",{loading:false,result:null,error:true});
                  }
                }} disabled={aiGet("dg_proposal_revised").loading}>
                  {aiGet("dg_proposal_revised").loading?"⟳ 권고 사항 반영해서 재생성 중...":"🔄 선택한 권고 사항 반영 → 제안서 재생성"}
                </Btn>
                {aiGet("dg_proposal_revised").loading&&(
                  <div style={{display:"flex",alignItems:"center",gap:8,padding:12,color:"var(--color-text-secondary)",fontSize:13,marginTop:10,background:"var(--color-background-secondary)",borderRadius:8}}>
                    ⟳ 권고 사항을 반영해서 제안서를 개선하고 있습니다...
                  </div>
                )}
                {aiGet("dg_proposal_revised").result==="완료"&&!aiGet("dg_proposal_revised").loading&&(
                  <div style={{fontSize:12,color:C.success,fontWeight:500,marginTop:8}}>
                    ✓ 제안서가 업데이트되었습니다. STEP 4에서 최종 확인하세요.
                  </div>
                )}
                {aiGet("dg_proposal_revised").error&&<AIBox loading={false} result={null} error={true} color={C.teal}/>}
              </div>
            )}
          </Panel>

          <div style={{display:"flex",justifyContent:"space-between",marginTop:"0.5rem"}}>
            <Btn v="ghost" onClick={()=>upd({step:1})}>← 이전</Btn>
            <Btn v="teal" onClick={()=>next(3)}>평가 완료 → 제안서 최종 확인 →</Btn>
          </div>
        </>;
      })()}

      {/* DG4 제안서 최종 확인 & 전달 */}
      {active.step===3&&<>
        <InfoBanner phase="Diagnosis" step="STEP 4" color={C.teal} bg={C.tealBg}>
          STEP 2~3을 거쳐 완성된 제안서를 최종 확인하고 고객에게 전달하세요.
        </InfoBanner>
        <Panel title="최종 제안서 확인 & 편집" icon="📝">
          {active.proposalDraft
            ?<>
              <div style={{fontSize:12,color:C.teal,marginBottom:8}}>
                {aiGet("dg_proposal_revised").result==="완료"
                  ?"✦ 권고 사항이 반영된 개선 버전입니다."
                  :"✦ STEP 2에서 생성된 제안서 초안입니다."}
              </div>
              <TA value={active.proposalDraft} onChange={v=>upd({proposalDraft:v})} rows={20}/>
              <div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap"}}>
                <Btn onClick={()=>copyT(active.proposalDraft,"proposal_final")}>{copied==="proposal_final"?"✓ 복사됨":"📋 전체 복사"}</Btn>
                <Btn v="ghost" onClick={()=>upd({step:1})}>← STEP 2에서 재생성</Btn>
                <Btn v="ghost" onClick={()=>upd({step:2})}>← STEP 3에서 권고 반영</Btn>
              </div>
            </>
            :<div style={{padding:"2rem",textAlign:"center",color:"var(--color-text-secondary)",fontSize:13}}>
              <div style={{fontSize:24,marginBottom:8}}>📋</div>
              <div style={{marginBottom:12}}>제안서 초안이 없습니다.</div>
              <Btn v="teal" onClick={()=>upd({step:1})}>← STEP 2로 돌아가기</Btn>
            </div>
          }
        </Panel>
        <Panel title="제안서 완료 체크리스트" icon="✅">
          {[
            ["제안 솔루션(TO-BE) 내용 확인","시스템 개요, 기능, 기술스택 포함 여부"],
            ["구축 범위 In/Out-Scope 명확히 기재","고객이 기대하는 것과 차이 없는지"],
            ["추진 일정(WBS) 현실적인지 검토","고객 일정과 맞는지"],
            ["사업비 항목별 내역 정확한지 확인","유지보수 비용 포함 여부"],
            ["기대 효과 수치 근거 있는지 확인","ROI 계산 포함 여부"],
          ].map(([t,s],i)=>(
            <ChkItem key={i} label={t} sub={s} checked={!!active.propCheck?.[i]} onChange={()=>updN("propCheck",{[i]:!active.propCheck?.[i]})}/>
          ))}
        </Panel>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:"0.5rem"}}>
          <Btn v="ghost" onClick={()=>upd({step:2})}>← 이전</Btn>
          <Btn v="teal" onClick={()=>next(4)}>제안서 완료 → 발표 & 컨펌 →</Btn>
        </div>
      </>}

      {/* DG5 발표 & 컨펌 */}
      {active.step===4&&<>
        <InfoBanner phase="Diagnosis" step="STEP 5" color={C.teal} bg={C.tealBg}>제안서를 발표하고 최종 컨펌을 받습니다.</InfoBanner>
        <Panel title="반론 대응 AI 도우미" icon="💬">
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>{["비용이 부담돼요","어렵게 느껴져요","나중에 생각해볼게요","직접 못 쓸 것 같아요"].map(q=><Tag key={q} label={q} selected={active.objection===q} color={C.teal} bg={C.tealBg} brd={C.tealLt} onClick={()=>upd({objection:active.objection===q?"":q})}/>)}</div>
          <TA value={active.objection} onChange={v=>upd({objection:v})} placeholder="고객 반론 입력..." rows={2}/>
          <Btn v="teal" onClick={()=>runAI("dg_ob","고객 반론 대응 답변 200자 이내.",`반론:${active.objection}\n솔루션:${chosenSol?.title}`)} disabled={aiGet("dg_ob").loading||!active.objection} style={{marginTop:10}}>{aiGet("dg_ob").loading?"⟳ 생성 중...":"🤖 AI 대응 답변"}</Btn>
          <AIBox loading={aiGet("dg_ob").loading} result={aiGet("dg_ob").result} error={aiGet("dg_ob").error} color={C.teal}/>
        </Panel>
        <Panel title="컨펌 체크리스트" icon="✅">
          {["제안서 전달 완료","솔루션 방향 합의","일정 및 비용 합의","착수 조건 확정"].map((t,i)=><ChkItem key={i} label={t} checked={!!active.presentCheck[i]} onChange={()=>updN("presentCheck",{[i]:!active.presentCheck[i]})}/>)}
        </Panel>
        <Panel title="계약 메모" icon="📋"><TA value={active.contractNote} onChange={v=>upd({contractNote:v})} placeholder="착수금, 일정, 특이사항..." rows={3}/></Panel>
        <div style={{marginTop:14}}><Btn v="teal" onClick={()=>next(5)}>✓ Diagnosis 완료 → Build →</Btn></div>
        <div style={{marginTop:"0.5rem"}}><Btn v="ghost" onClick={()=>upd({step:3})}>← 이전</Btn></div>
      </>}
    </>}

    {/* ═══ PHASE 3 BUILD ═══ */}
    {active.phase===2&&<>
      {/* B1 개발 착수 + Agile PM */}
      {active.step===0&&<>
        <InfoBanner phase="Build" step="STEP 1" color={C.purple} bg={C.purpleBg}>Agile 방식으로 프로젝트를 계획하고 착수합니다.</InfoBanner>
        <Panel title="솔루션 착수 요약" icon="🚀" accent={C.purpleBg}>
          {/* 솔루션 미선택 경고 */}
          {!chosenSol?.title&&(
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:C.warnBg,borderRadius:8,marginBottom:12,fontSize:13,color:C.warn}}>
              <span style={{fontSize:18}}>⚠</span>
              <div>
                <div style={{fontWeight:500,marginBottom:2}}>선택된 솔루션이 없습니다</div>
                <div style={{fontSize:12}}>Diagnosis STEP 2에서 솔루션을 선택하거나, 아래에서 직접 입력하세요.</div>
              </div>
            </div>
          )}
          {/* 읽기 전용 — Diagnosis에서 넘어온 값 */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
            {[["고객",active.name],["솔루션",chosenSol?.title]].map(([l,v])=>(
              <div key={l} style={{background:"var(--color-background-primary)",borderRadius:8,padding:"8px 12px"}}>
                <div style={{fontSize:11,color:"var(--color-text-secondary)",marginBottom:2}}>{l}</div>
                <div style={{fontSize:13,fontWeight:500,color:v?"var(--color-text-primary)":C.warn}}>{v||"미입력"}</div>
              </div>
            ))}
          </div>
          {/* 직접 편집 가능 항목 */}
          <div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:8,fontWeight:500}}>
            도구 · 기간 · 비용 — 직접 확인 후 수정하세요
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
            {[
              ["🔧 사용 도구","buildTool",chosenSol?.tool||"","예: Make.com, Claude API"],
              ["⏱ 예상 기간","buildEffort",chosenSol?.effort||"","예: 보통(1~2주)"],
              ["💰 예상 비용","buildCost",chosenSol?.cost||"","예: 10~50만원"],
            ].map(([label,key,defaultVal,ph])=>(
              <div key={key}>
                <div style={{fontSize:11,color:"var(--color-text-secondary)",marginBottom:4}}>{label}</div>
                <Inp
                  value={active[key]!==undefined && active[key]!==null ? active[key] : defaultVal}
                  onChange={v=>upd({[key]:v})}
                  placeholder={ph}
                  style={{fontSize:12,background:"var(--color-background-primary)",
                    border:`0.5px solid ${(!active[key]&&!defaultVal)?C.warn:"var(--color-border-secondary)"}`,
                  }}
                />
              </div>
            ))}
          </div>
          {/* Pain Point 요약 */}
          {validPPs.length>0&&(
            <div style={{marginTop:12,padding:"8px 12px",background:"var(--color-background-primary)",borderRadius:8}}>
              <div style={{fontSize:11,color:"var(--color-text-secondary)",marginBottom:4}}>해결할 Pain Point</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                {validPPs.map((p,i)=><Chip key={i} label={`#${i+1} ${p.title}`} color={C.purple} bg={C.purpleBg}/>)}
              </div>
            </div>
          )}
          {/* Diagnosis로 돌아가기 링크 */}
          <div style={{marginTop:10,fontSize:12,color:C.teal}}>
            <button onClick={()=>upd({phase:1,step:1,status:"diagnosis"})}
              style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:C.teal,fontFamily:"inherit",textDecoration:"underline",padding:0}}>
              ← Diagnosis STEP 2에서 솔루션 수정하기
            </button>
          </div>
        </Panel>
        <PMPanel cl={active} upd={upd}/>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:"0.5rem"}}><Btn v="ghost" onClick={()=>upd({phase:1,step:4,status:"diagnosis"})}>← Diagnosis로</Btn><Btn v="purple" onClick={()=>next(1)}>착수 완료 → MVP 구현 →</Btn></div>
      </>}

      {/* B2 MVP 구현 */}
      {active.step===1&&<>
        <InfoBanner phase="Build" step="STEP 2" color={C.purple} bg={C.purpleBg}>MVP를 구현하고 프로젝트를 관리합니다.</InfoBanner>
        <PMPanel cl={active} upd={upd}/>
        <Panel title="개발 메모 & 이슈" icon="📝"><TA value={active.testNotes||""} onChange={v=>upd({testNotes:v})} placeholder="개발 메모, 이슈..." rows={4}/></Panel>
        <Panel title="AI 개발 조언" icon="🤖">
          <Btn v="purple" onClick={()=>runAI("b_rv",`시니어 AI 개발자. 소상공인용 ${chosenSol?.type||"AI"} 솔루션 개발 조언. 실용적으로 250자 이내.`,`솔루션:${chosenSol?.title} 도구:${effectiveTool}\n기간:${effectiveEffort}\n메모:${active.testNotes||"없음"}`)} disabled={aiGet("b_rv").loading}>{aiGet("b_rv").loading?"⟳ 분석 중...":"🤖 AI 개발 조언"}</Btn>
          <AIBox loading={aiGet("b_rv").loading} result={aiGet("b_rv").result} error={aiGet("b_rv").error} color={C.purple}/>
        </Panel>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:"0.5rem"}}><Btn v="ghost" onClick={()=>upd({step:0})}>← 이전</Btn><Btn v="purple" onClick={()=>next(2)}>MVP 완료 → 파일럿 →</Btn></div>
      </>}

      {/* B3 파일럿 테스트 */}
      {active.step===2&&<>
        <InfoBanner phase="Build" step="STEP 3" color={C.purple} bg={C.purpleBg}>고객과 함께 2주 파일럿을 진행합니다.</InfoBanner>
        <Panel title="파일럿 체크리스트" icon="🧪">
          {["MVP 사용법 안내 완료","1주차 파일럿 + 중간 피드백","버그/불편 수정 완료","2주차 파일럿 + 최종 피드백","고객 만족도 확인"].map((t,i)=><ChkItem key={i} label={t} checked={!!active.buildCheck[`p${i}`]} onChange={()=>updN("buildCheck",{[`p${i}`]:!active.buildCheck[`p${i}`]})}/>)}
        </Panel>
        <Panel title="피드백 기록" icon="📋"><TA value={active.testNotes||""} onChange={v=>upd({testNotes:v})} placeholder="고객 피드백 내용..." rows={4}/></Panel>
        <Panel title="AI 사용 설명서 생성" icon="📖">
          <Btn v="purple" onClick={async()=>{aiSet("b_mn",{loading:true,result:null,error:false});try{const r=await claude("소상공인용 AI 솔루션 사용 설명서. 스마트폰 기준. 1.시작하기 2.매일 하는 일 3.문제 생겼을 때 4.문의 방법",`솔루션:${chosenSol?.title} 도구:${effectiveTool}\n고객:${active.name}(${active.industry}, AI친숙도:${active.aiLevel})`);upd({manualText:r});aiSet("b_mn",{loading:false,result:"완료",error:false});}catch{aiSet("b_mn",{loading:false,result:null,error:true});}}} disabled={aiGet("b_mn").loading}>{aiGet("b_mn").loading?"⟳ 생성 중...":"✨ AI 사용 설명서 생성"}</Btn>
          {active.manualText&&<><TA value={active.manualText} onChange={v=>upd({manualText:v})} rows={10} style={{marginTop:10}}/><Btn onClick={()=>copyT(active.manualText,"mn")} style={{marginTop:8}}>{copied==="mn"?"✓ 복사됨":"📋 복사"}</Btn></>}
        </Panel>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:"0.5rem"}}><Btn v="ghost" onClick={()=>upd({step:1})}>← 이전</Btn><Btn v="purple" onClick={()=>next(3)}>파일럿 완료 → 이관 →</Btn></div>
      </>}

      {/* B4 이관 & 완료 */}
      {active.step===3&&<>
        <InfoBanner phase="Build" step="STEP 4" color={C.purple} bg={C.purpleBg}>최종 이관 — 고객이 혼자 운영할 수 있도록 넘겨주세요.</InfoBanner>
        <Panel title="이관 체크리스트" icon="🎁">
          {[["최종 사용 설명서 전달","1페이지+스크린샷"],["사용법 영상 1개 전달","3분 이내"],["계정 정리 문서 전달","공유 노션"],["고객 혼자 1회 실습","옆에서 보조"],["30일 A/S 채널 안내","카카오 오픈채팅"]].map(([t,s],i)=><ChkItem key={i} label={t} sub={s} checked={!!active.handoverCheck[i]} onChange={()=>updN("handoverCheck",{[i]:!active.handoverCheck[i]})}/>)}
        </Panel>
        <Panel title="케이스 스터디 기록" icon="📚">
          <Btn v="purple" onClick={async()=>{aiSet("b_cs",{loading:true,result:null,error:false});try{const r=await claude("AI 컨설팅 케이스 스터디.\n[케이스 스터디]\n업종/규모:\n핵심 문제:\n적용 솔루션:\n사용 도구:\n구현 기간:\n주요 성과:\n고객 피드백:\n핵심 인사이트:",`고객:${active.name} 업종:${active.industry}\nPP:${validPPs.map(p=>p.title).join(",")}\n솔루션:${chosenSol?.title}`);upd({caseStudy:r});aiSet("b_cs",{loading:false,result:"완료",error:false});}catch{aiSet("b_cs",{loading:false,result:null,error:true});}}} disabled={aiGet("b_cs").loading}>{aiGet("b_cs").loading?"⟳ 작성 중...":"✨ AI 케이스 스터디 작성"}</Btn>
          {active.caseStudy&&<><TA value={active.caseStudy} onChange={v=>upd({caseStudy:v})} rows={10} style={{marginTop:10}}/><Btn onClick={()=>copyT(active.caseStudy,"cs")} style={{marginTop:8}}>{copied==="cs"?"✓ 복사됨":"📋 복사"}</Btn></>}
        </Panel>
        <Panel title="프로젝트 최종 완료" icon="🏆" style={{background:[0,1,2,3,4].every(i=>active.handoverCheck[i])?C.successBg:undefined}}>
          <Btn v="success" onClick={()=>{next(4);upd({status:"complete"});}}>🎉 프로젝트 완료 확정</Btn>
        </Panel>
        <div style={{marginTop:"0.5rem"}}><Btn v="ghost" onClick={()=>upd({step:2})}>← 이전</Btn></div>
      </>}
    </>}

    {active.status==="complete"&&<Panel title="🎉 프로젝트 완료!" style={{background:C.successBg,border:`1px solid ${C.success}40`}}>
      <div style={{fontSize:13,lineHeight:1.8,marginBottom:16}}><strong>{active.name}</strong> 고객의 AI 컨설팅 프로젝트가 모두 완료되었습니다.</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><Btn v="success" onClick={()=>setView("home")}>← 고객 목록으로</Btn><Btn v="blue" onClick={addClient}>+ 신규 고객 등록</Btn></div>
    </Panel>}
  </div>;
}
