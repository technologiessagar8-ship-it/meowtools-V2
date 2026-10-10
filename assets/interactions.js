(()=>{'use strict';
const reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
// Accessible responsive navigation: all category links remain direct menu items on compact screens.
const header=$('.site-header'),mainNav=$('.main-nav',header||document),menuToggle=$('.mobile-menu-toggle',header||document);
if(header&&mainNav&&menuToggle){
  if(!mainNav.id)mainNav.id='main-navigation';
  menuToggle.setAttribute('aria-controls',mainNav.id);
  const mobileNav=()=>window.matchMedia('(max-width: 1300px)').matches;
  const setMenu=(open)=>{header.classList.toggle('nav-open',!!open);menuToggle.setAttribute('aria-expanded',open?'true':'false');menuToggle.setAttribute('aria-label',open?'Close navigation menu':'Open navigation menu');menuToggle.innerHTML=open?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';};
  setMenu(false);
  menuToggle.addEventListener('click',()=>setMenu(!header.classList.contains('nav-open')));
  mainNav.addEventListener('click',e=>{if(e.target.closest('a')&&mobileNav())setMenu(false)});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&header.classList.contains('nav-open')){setMenu(false);menuToggle.focus()}});
  document.addEventListener('click',e=>{if(mobileNav()&&header.classList.contains('nav-open')&&!header.contains(e.target))setMenu(false)});
  window.addEventListener('resize',()=>{if(!mobileNav())setMenu(false)});
}
// Scroll reveal: only animate after observer support; otherwise content remains visible.
if(!reduce&&'IntersectionObserver'in window){const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');io.unobserve(e.target)}}),{threshold:.08,rootMargin:'0px 0px -35px 0px'});$$('.tool-category,.value-card,.steps-grid article,.faq-list details,.support-section,.directory-grid .card,.category-bottom').forEach((el,i)=>{el.classList.add('js-reveal');el.style.transitionDelay=Math.min(i%4,3)*55+'ms';io.observe(el)})}
// Add tasteful icons to cards and set hover tilt for pointer devices only.
const glyphs={'image-tools':'▧','pdf-tools':'▤','calculator-tools':'∑','converter-tools':'⇄','text-tools':'Aa','developer-tools':'⌘'};$$('.tool-category .card').forEach(card=>{if(!$('.tool-card-icon',card)){const section=card.closest('.tool-category');const glyph=glyphs[section?.id]||'✦';const icon=document.createElement('span');icon.className='tool-card-icon';icon.setAttribute('aria-hidden','true');icon.textContent=glyph;card.prepend(icon)}});
if(!reduce&&window.matchMedia('(hover:hover) and (pointer:fine)').matches){$$('.tool-category .card,.directory-grid .card').forEach(card=>{card.addEventListener('pointermove',e=>{const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;card.style.transform=`translateY(-7px) rotateX(${(-y*3).toFixed(2)}deg) rotateY(${(x*3).toFixed(2)}deg)`});card.addEventListener('pointerleave',()=>{card.style.transform=''})})}
// Gentle pointer ambient light on desktop.
if(!reduce&&window.matchMedia('(hover:hover) and (pointer:fine)').matches){let raf=0;document.addEventListener('pointermove',e=>{if(raf)return;raf=requestAnimationFrame(()=>{document.documentElement.style.setProperty('--pointer-x',e.clientX+'px');document.documentElement.style.setProperty('--pointer-y',e.clientY+'px');raf=0})},{passive:true})}
// Homepage live search and clear state.
const q=$('#q'),status=$('#search-status'),clear=$('.search-clear');if(q){const cards=$$('.tool-category .card'),sections=$$('.tool-category');const update=()=>{const query=q.value.trim().toLowerCase();let count=0;cards.forEach(c=>{const match=!query||c.textContent.toLowerCase().includes(query);c.hidden=!match;if(match)count++});sections.forEach(s=>{const visible=$$('.card',s).some(c=>!c.hidden);s.hidden=!visible});if(status)status.textContent=query?(count?`${count} matching tool${count===1?'':'s'} found`:'No matching tools. Try another search.') :'';if(clear)clear.hidden=!query};q.addEventListener('input',update);clear?.addEventListener('click',()=>{q.value='';update();q.focus()});q.addEventListener('keydown',e=>{if(e.key==='Escape'){q.value='';update()}if(e.key==='Enter'){const first=$('.tool-category .card:not([hidden])');if(first&&q.value.trim())first.click()}})}
// All-tools directory search and category filters.
const dq=$('#directory-q');if(dq){const cards=$$('.directory-grid .card'),pills=$$('.filter-pill'),count=$('.directory-count');let active='all';const update=()=>{const query=dq.value.trim().toLowerCase();let n=0;cards.forEach(c=>{const okText=!query||c.textContent.toLowerCase().includes(query),okCat=active==='all'||c.dataset.category===active,show=okText&&okCat;c.hidden=!show;if(show)n++});if(count)count.textContent=`Showing ${n} of ${cards.length} tools`;};dq.addEventListener('input',update);pills.forEach(p=>p.addEventListener('click',()=>{active=p.dataset.filter;pills.forEach(x=>x.classList.toggle('active',x===p));update()}));update();document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();dq.focus()}})}
// Current-page navigation affordance and external anchors stay untouched.
$$('a[href^="#"]').forEach(a=>a.addEventListener('click',()=>{const id=a.getAttribute('href');if(id&&id.length>1){const target=$(id);if(target){target.classList.add('anchor-arrival');setTimeout(()=>target.classList.remove('anchor-arrival'),900)}}}));
})();