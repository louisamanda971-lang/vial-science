const countryNames = ['Afghanistan','Albania','Algeria','Andorra','Angola','Argentina','Armenia','Australia','Austria','Azerbaijan','Bahamas','Bahrain','Bangladesh','Barbados','Belgium','Benin','Bolivia','Botswana','Brazil','Bulgaria','Burkina Faso','Burundi','Cambodia','Cameroon','Canada','Chile','China','Colombia','Costa Rica','Croatia','Cuba','Cyprus','Czechia','Democratic Republic of the Congo','Denmark','Dominican Republic','Ecuador','Egypt','Ethiopia','Finland','France','Gabon','Gambia','Georgia','Germany','Ghana','Greece','Guatemala','Guinea','Haiti','Hong Kong','Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy','Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kuwait','Lebanon','Liberia','Libya','Madagascar','Malawi','Malaysia','Mali','Malta','Mauritania','Mauritius','Mexico','Morocco','Mozambique','Namibia','Nepal','Netherlands','New Zealand','Niger','Nigeria','North Korea','Norway','Oman','Pakistan','Panama','Peru','Philippines','Poland','Portugal','Qatar','Republic of the Congo','Romania','Russia','Rwanda','Saudi Arabia','Senegal','Serbia','Sierra Leone','Singapore','Slovakia','Slovenia','Somalia','South Africa','South Korea','South Sudan','Spain','Sri Lanka','Sudan','Sweden','Switzerland','Syria','Taiwan','Tanzania','Thailand','Togo','Trinidad and Tobago','Tunisia','Turkey','Uganda','Ukraine','United Arab Emirates','United Kingdom','United States','Uruguay','Uzbekistan','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe'];
const countrySelect = document.querySelector('#country');
if (countrySelect) countryNames.sort((a,b)=>a.localeCompare(b)).forEach(country=>{const option=document.createElement('option');option.value=country;option.textContent=country;countrySelect.append(option)});
const year = document.querySelector('#year'); if(year) year.textContent = new Date().getFullYear();
const form = document.querySelector('#lead-form');
if(form){
  const status = document.querySelector('#form-status'); const button=form.querySelector('button[type="submit"]');
  form.addEventListener('submit', async event=>{
    event.preventDefault(); status.textContent=''; status.className='form-status';
    if(!form.reportValidity()) return;
    button.disabled=true; button.innerHTML='Submitting…';
    const payload={firstName:form.firstName.value.trim(),email:form.email.value.trim(),country:form.country.value,marketingConsent:form.marketingConsent.checked,website:form.website.value};
    try{
      const response=await fetch('/api/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const result=await response.json();
      if(!response.ok) throw new Error(result.error||'We could not process your request.');
      if(result.delivery==='not-configured'){
        status.className='form-status error'; status.textContent='Your request was accepted, but email delivery is not configured yet. The site owner must finish setup before launch.';
        button.disabled=false; button.innerHTML='Get my free guide <span aria-hidden="true">→</span>'; return;
      }
      window.location.href='/thank-you.html';
    }catch(error){status.className='form-status error';status.textContent=error.message||'Something went wrong. Please try again.';button.disabled=false;button.innerHTML='Get my free guide <span aria-hidden="true">→</span>';}
  });
}
fetch('/api/config').then(r=>r.ok?r.json():null).then(config=>{if(!config?.communityUrl)return;document.querySelectorAll('[data-community-link]').forEach(link=>{link.href=config.communityUrl;});}).catch(()=>{});
