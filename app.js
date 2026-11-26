'use strict';
const pageTitle=document.title;
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const videoRelease='https://github.com/ChenzhaoNju/R3Agent/releases/download/filmroom-media/';
const media=v=>{
  if(typeof v!=='string')return '';
  if(/^media\/[a-f0-9]{64}\.(png|jpg|jpeg|webp|wav|mp3|m4a|ogg|flac)$/.test(v))return v;
  const name=v.startsWith(videoRelease)?v.slice(videoRelease.length):'';
  return /^[a-f0-9]{64}\.(mp4|webm)$/.test(name)?v:'';
};
const state={films:[],recreations:[],filter:'all',query:'',selected:null};
const room=$('screening-room');const mainVideo=$('main-video');const imageRoom=$('reference-view');
const han=/\p{Script=Han}/u;
const dialogueLanguage=f=>f.language==='Chinese'?'Mandarin dialogue':'English dialogue';
const filmTitles=f=>{
  const names=[f.title,f.subtitle].filter(Boolean);
  return {
    english:names.find(name=>!han.test(name))||f.slug,
    chinese:names.find(name=>han.test(name))||'',
  };
};
function coverDuration(value){
  if(!Number.isFinite(value)||value<0)return '';
  const seconds=Math.floor(value);
  return Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
}
function card(f){
  const image=media(f.poster_url);
  const {english,chinese}=filmTitles(f);
  const recreation=Boolean(f.edition);
  const refs=f.references||{images:[],audio:[]};
  const images=refs.images.length;
  const voices=refs.audio.length;
  const clips=refs.audio_samples?.length||0;
  const length=coverDuration(f.seconds);
  const referenceCount=[images&&`${images} image${images===1?'':'s'}`,
    voices&&`${voices} audio reference${voices===1?'':'s'}`,
    clips&&`${clips} native audio clip${clips===1?'':'s'}`].filter(Boolean).join(' · ');
  return `<button type="button" class="film-card" data-film="${esc(f.slug)}" aria-label="Play ${esc(english)}">
    <div class="card-art${recreation && f.width > f.height ? ' landscape-art' : ''}">
      ${image?`<img src="${image}" alt="Frame from ${esc(english)}" loading="lazy" width="${f.width>f.height?640:360}" height="${f.width>f.height?360:640}">`:''}
      ${recreation?'':`<span class="card-index">STORY ${String(f.index).padStart(2,'0')}</span>`}
      <span class="card-play" aria-hidden="true">▷</span>
      ${length?`<span class="card-duration">${length}</span>`:''}
    </div>
    <div class="card-info">
      <h3>${esc(english)}</h3>
      <p class="subtitle" lang="zh">${esc(chinese)}</p>
      <div class="card-meta">
        <span>${dialogueLanguage(f)}</span>
        <span class="refs-label">${referenceCount||'Watch film'} ↗</span>
      </div>
    </div>
  </button>`;
}
function wireCards(root){root.querySelectorAll('[data-film]').forEach(b=>b.addEventListener('click',()=>openFilm(b.dataset.film)));}
function render(){const visible=state.films.filter(f=>(state.filter==='all'||f.language===state.filter)&&(!state.query||(f.title+' '+f.subtitle+' '+f.slug).toLowerCase().includes(state.query)));$('film-grid').innerHTML=visible.length?visible.map(f=>card(f)).join(''):'<div class="empty">No films match this search.</div>';$('result-count').textContent=`${visible.length} / ${state.films.length} films`;wireCards($('film-grid'));document.querySelectorAll('[data-filter]').forEach(b=>{const active=b.dataset.filter===state.filter;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});}
function renderRecreations(){
  const grid=$('recreation-grid');
  if(!grid)return;
  grid.innerHTML=state.recreations.map(card).join('');
  $('recreations').hidden=!state.recreations.length;
  wireCards(grid);
}
function renderInputs(id,films,inputs){
  const panel=$(id);
  if(!panel)return;
  const options=films.filter(f=>typeof inputs[f.slug]?.text==='string');
  if(!options.length)return;
  const selector=$(id+'-select');
  const text=$(id+'-text');
  selector.replaceChildren(...options.map(f=>new Option(filmTitles(f).english,f.slug)));
  function showInput(){
    const film=options[selector.selectedIndex];
    text.lang=film.language==='Chinese'?'zh-CN':'en';
    text.textContent=inputs[film.slug].text;
    text.scrollTop=0;
  }
  selector.addEventListener('change',showInput);
  showInput();
  panel.hidden=false;
}
function pauseAll(){document.querySelectorAll('audio,video').forEach(x=>x.pause());}
const referenceNames={
  '许姓渔人':'Fisherman Xu','河岸夜钓处':'Riverside fishing spot at night',
  '王六郎':'Wang Liulang','六郎':'Wang Liulang','妇人':'Woman','婴儿':'Infant',
  '白日河段':'River by day','许某':'Fisherman Xu',
  '宁采臣':'Ning Caichen','古寺院落':'Old temple courtyard','燕赤霞':'Yan Chixia',
  '聂小倩':'Nie Xiaoqian','客舍内景':'Guest room','金锭':'Gold ingot','夜袭妖物':'Night demon',
  '剑匣飞剑':'Sword and case','寺北荒坟':'Abandoned grave north of the temple','骨殖布包':'Cloth bundle of remains',
  '王生':'Wang Sheng','暮色城外土路':'Road outside town at dusk','女子／恶鬼':'Woman and demon',
  '王家书斋':'Wang family study','王妻':'Wang Sheng’s wife','王家内室':'Wang family interior','道士':'Taoist priest',
  '白日街市':'Market by day','人皮与彩笔':'Painted skin and brush','道观堂内':'Taoist temple hall',
  '拂尘':'Fly whisk','月下荒林':'Woodland in moonlight',
  '官差':'Officer','成名家中':'Cheng Ming’s home','官府名册':'Official register','成名':'Cheng Ming',
  '成名妻子':'Cheng Ming’s wife','虫笼':'Cricket cage','健壮大蟋蟀':'Large cricket','儿子':'Son',
  '屋外井边':'Well outside the house','瘦小蟋蟀':'Small cricket','验虫处':'Cricket inspection area',
  '马骥':'Ma Ji','荒岸与残船':'Deserted shore and wrecked ship','异国街市':'Foreign market',
  '执戟郎':'Halberd officer','执戟郎宅夜宴厅':'Officer’s banquet hall at night','铜镜与灶煤':'Bronze mirror and stove coal',
  '国王':'King','朝堂':'Royal court','官员代表':'Court official',
  '旅店主人':'Innkeeper','邯郸旅舍堂内':'Handan inn hall','卢生':'Lu Sheng','吕翁':'Elder Lü',
  '黄粱陶锅':'Pot of millet','青瓷枕':'Celadon pillow','梦中喜堂':'Wedding hall in the dream','梦中官员':'Official in the dream',
  '梦中官署大殿':'Government hall in the dream','梦中公堂':'Courtroom in the dream','贬途风雪荒路':'Snowbound road to exile',
  '暮年空府':'Empty residence in old age','病榻':'Sickbed',
  '王家屋内':'Wang family interior','王生之妻':'Wang Sheng’s wife','木工工具与木料':'Carpentry tools and lumber',
  '包袱与扁担水桶':'Bundle, carrying pole, and buckets','山道石阶':'Mountain stone steps','道观院门':'Taoist temple gate',
  '道观堂内夜':'Taoist temple hall at night','王家院落与院墙':'Wang family courtyard and wall','小木凳':'Small wooden stool','妻子':'Wife',
  '柳毅':'Liu Yi','龙女牧羊装':'Dragon Princess in shepherd’s attire','寒风荒野':'Windy wilderness',
  '求救信与玉环':'Letter for help and jade ring','洞庭湖岸古树':'Old tree on Lake Dongting','水开之路':'Path through parted waters',
  '龙宫大殿':'Dragon Palace hall','洞庭君':'Lord of Dongting','钱塘君':'Lord of Qiantang','风雷巨影':'Giant silhouette in thunder',
  '龙女素雅装':'Dragon Princess in simple attire','龙宫宴席':'Dragon Palace banquet','春水湖岸':'Lakeshore in spring',
  '花间春景':'Spring blossoms','王子服':'Wang Zifu','婴宁':'Yingning','花枝与花籽':'Flower branch and seeds',
  '山村院落':'Mountain village courtyard','老妇':'Elderly woman','王母':'Wang Zifu’s mother','王家宅院':'Wang family residence',
  '绣帕与铃铛木匣':'Embroidered handkerchief and a bell box','仆人':'Servant','山后荒坟':'Abandoned grave behind the hill',
  '坟前瓷片':'Porcelain shard at the grave','春日轻快配乐':'Light spring music','婴宁画外笑声SFX':'Yingning’s offscreen laugh',
  '山径脚步SFX':'Footsteps on the mountain path','深情哀婉配乐':'Mournful music','木匣开盖SFX':'Wooden box opening',
  '拂土培土SFX':'Brushing and piling soil','锹土SFX':'Shoveling soil',
};
function englishText(value){
  return typeof value==='string'&&!han.test(value)?value.trim():'';
}
function referenceLabel(reference,kind,index){
  const original=reference.label||'';
  if(englishText(original))return original;
  const [name,variant]=original.split(' · ');
  const key=name.replace(/音色$|(?:人物|角色)参考$/u,'');
  if(referenceNames[key]){
    const title=referenceNames[key]+(name.endsWith('音色')?' voice':'');
    return [title,englishText(variant)].filter(Boolean).join(' · ');
  }
  const frame=name.match(/^(clip_\d+)实际末帧$/u);
  if(frame)return `Final frame of ${frame[1]}`;
  return [`${kind} ${index+1}`,englishText(variant)].filter(Boolean).join(' · ');
}
const assetTags=reference=>reference.asset_ids.map(englishText).filter(Boolean).map(esc).join(' · ');
function shotUsage(count){return `Used in ${count} selected shot${count===1?'':'s'}`;}
function renderReferences(f){
  const refs=f.references||{images:[],audio:[]};
  const sounds=[...refs.audio,...(refs.audio_samples||[])];
  const imageLabels=refs.images.map((r,i)=>referenceLabel(r,'Image reference',i));
  $('reference-note').textContent=refs.audio.length
    ?'Reference assets are grouped across the selected shots.'
    :'Image references and any available native audio excerpts from the selected shots.';
  $('audio-heading').textContent=refs.audio.length?'Audio references':'Native audio excerpts';
  $('reference-section').hidden=!(refs.images.length||sounds.length);
  $('images-heading').hidden=!refs.images.length;
  $('audio-heading').hidden=!sounds.length;
  $('reference-images').innerHTML=refs.images.map((r,i)=>{
    const label=esc(imageLabels[i]);
    const description=englishText(r.description);
    const tags=assetTags(r);
    return `<article class="reference-card">
      <button type="button" data-reference="${i}" aria-label="Enlarge ${label}"><img src="${media(r.url)}" alt="${label}" loading="lazy"></button>
      <div class="reference-body"><strong>${label}</strong>${description?`<p>${esc(description)}</p>`:''}
        <details><summary>Usage and checksum</summary><p>${tags?tags+' · ':''}${shotUsage(r.used_shots.length)}</p><code>SHA256 ${esc(r.sha256)}</code></details>
      </div>
    </article>`;
  }).join('');
  $('reference-audio').innerHTML=sounds.map((r,i)=>{
    const excerpt=r.usage_type==='native_excerpt';
    const label=esc(referenceLabel(r,excerpt?'Native audio excerpt':'Audio reference',i));
    const tags=assetTags(r);
    return `<article class="audio-card">
      <h5>${label}</h5><p>${excerpt?'Excerpt from the film soundtrack':shotUsage(r.used_shots.length)}</p>
      <audio controls preload="none" aria-label="${label}" src="${media(r.url)}"></audio>
      <details><summary>Usage and checksum</summary>${tags?`<p>${tags}</p>`:''}<code>SHA256 ${esc(r.sha256)}</code></details>
    </article>`;
  }).join('');
  $('reference-images').querySelectorAll('[data-reference]').forEach(button=>button.addEventListener('click',()=>{
    const index=Number(button.dataset.reference);
    $('large-reference').src=media(refs.images[index].url);
    $('large-reference').alt=imageLabels[index];
    $('large-reference-label').textContent=imageLabels[index];
    imageRoom.showModal();
  }));
  $('reference-audio').querySelectorAll('audio').forEach(audio=>audio.addEventListener('play',()=>{
    document.querySelectorAll('audio,video').forEach(other=>{if(other!==audio)other.pause();});
  }));
}
function openFilm(slug,updateHash=true){
  const f=state.recreations.find(x=>x.slug===slug)||state.films.find(x=>x.slug===slug||String(x.index)===slug);
  if(!f)return;
  const {english,chinese}=filmTitles(f);
  pauseAll();
  state.selected=f.slug;
  const collection=f.edition?'SHORT DRAMA':`STORY ${String(f.index).padStart(2,'0')}`;
  $('player-kicker').textContent=`${collection} · ${dialogueLanguage(f).toUpperCase()}`;
  $('player-title').textContent=english;
  $('player-subtitle').textContent=chinese;
  mainVideo.src=media(f.video_url);
  mainVideo.poster=media(f.poster_url);
  mainVideo.classList.toggle('is-portrait',f.height>f.width);
  mainVideo.preload='metadata';
  $('player-facts').innerHTML=`<span>${esc(f.fps)} fps</span><span>${Number(f.frames).toLocaleString('en-US')} frames</span><span>Native audio</span><span>${esc(f.edition||'Research sample')}</span>`;
  renderReferences(f);
  const referenceNote=f.edition?'':' Production references are tied to the selected shots.';
  $('provenance').innerHTML=`<p>Selected version ${esc(f.run_id)}</p><p>The final video checksum matches the delivery report.${referenceNote}</p><code>VIDEO SHA256 ${esc(f.sha256)}</code>`;
  $('film-permalink').href='#film='+encodeURIComponent(f.slug);
  if(!room.open)room.showModal();
  room.scrollTop=0;
  document.title=english+' · R³ Filmroom';
  if(updateHash)history.replaceState(null,'','#film='+encodeURIComponent(f.slug));
}
function selectedCollection(){return state.recreations.some(f=>f.slug===state.selected)?state.recreations:state.films;}
function moveFilm(step){
  const films=selectedCollection();
  const index=films.findIndex(f=>f.slug===state.selected);
  if(index>=0)openFilm(films[(index+step+films.length)%films.length].slug);
}
function closeFilm(updateHash=true){
  const section=selectedCollection()===state.recreations?'#recreations':'#collection';
  pauseAll();
  if(imageRoom.open)imageRoom.close();
  mainVideo.removeAttribute('src');
  mainVideo.load();
  $('reference-audio').replaceChildren();
  $('reference-images').replaceChildren();
  if(room.open)room.close();
  state.selected=null;
  document.title=pageTitle;
  if(updateHash&&location.hash.startsWith('#film=')){
    history.replaceState(null,'',section);
    $(section.slice(1)).scrollIntoView({block:'start'});
  }
}
function fromHash(){if(location.hash.startsWith('#film=')){try{openFilm(decodeURIComponent(location.hash.slice(6)),false);}catch{}}else if(room.open)closeFilm(false);}
document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{state.filter=b.dataset.filter;render();}));$('search').addEventListener('input',e=>{state.query=e.target.value.trim().toLowerCase();render();});$('close-player').addEventListener('click',()=>closeFilm());room.addEventListener('cancel',e=>{e.preventDefault();closeFilm();});room.addEventListener('click',e=>{if(e.target!==room)return;const r=room.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeFilm();});$('close-reference').addEventListener('click',()=>imageRoom.close());imageRoom.addEventListener('close',()=>{$('large-reference').removeAttribute('src');});$('method-from-player').addEventListener('click',e=>{e.preventDefault();closeFilm(false);location.hash='method';$('method').scrollIntoView({behavior:'smooth'});});$('previous-film').addEventListener('click',()=>moveFilm(-1));$('next-film').addEventListener('click',()=>moveFilm(1));window.addEventListener('hashchange',fromHash);
mainVideo.addEventListener('play',()=>{document.querySelectorAll('audio').forEach(a=>a.pause());});
async function init(){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),15000);
  try{
    const response=await fetch('data.json',{cache:'no-store',signal:controller.signal});
    if(!response.ok)throw new Error('The catalog is temporarily unavailable.');
    const catalog=await response.json();
    if(!Array.isArray(catalog.films)||catalog.films.length!==20)throw new Error('The catalog should contain 20 films.');
    state.films=catalog.films.sort((a,b)=>a.index-b.index);
    state.recreations=Array.isArray(catalog.recreations)?catalog.recreations:[];
    $('film-count').textContent=String(state.films.length);
    render();
    renderRecreations();
    renderInputs('benchmark-inputs',state.films,catalog.inputs||{});
    renderInputs('recreation-inputs',state.recreations,catalog.inputs||{});
    if(location.hash==='#recreations'&&state.recreations.length)$('recreations').scrollIntoView();
    fromHash();
  }catch(error){
    $('load-error').hidden=false;
    $('load-error').textContent='The catalog could not be loaded. '+String(error.message||error);
  }finally{
    clearTimeout(timer);
  }
}
init();
