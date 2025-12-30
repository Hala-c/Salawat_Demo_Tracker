 
const city = "Cairo";
const country = "EG";
const method = 5; 
const prayers = ["الفجر", "الظهر", "العصر", "المغرب", "العشاء"];
const ayat = [
  { text: "وَأَقِمِ الصَّلَاةَ لِذِكْرِي", ref: "سورة طه: 14" },
  { text: "إِنَّ الصَّلَاةَ تَنْهَىٰ عَنِ الْفَحْشَاءِ وَالْمُنكَرِ", ref: "سورة العنكبوت: 45" },
  { text: "قَدْ أَفْلَحَ الْمُؤْمِنُونَ * الَّذِينَ هُمْ فِي صَلَاتِهِمْ خَاشِعُونَ", ref: "سورة المؤمنون: 1-2" },
  { text: "وَالَّذِينَ هُمْ عَلَىٰ صَلَوَاتِهِمْ يُحَافِظُونَ", ref: "سورة المعارج: 34" },
  { text: "حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَىٰ", ref: "سورة البقرة: 238" },
  { text: "الصلاة عماد الدين، من أقامها فقد أقام الدين، ومن هدمها فقد هدم الدين", ref: "حديث شريف" },
  { text: "بين الرجل وبين الشرك والكفر ترك الصلاة", ref: "رواه مسلم" },
  { text: "أول ما يحاسب عليه العبد يوم القيامة الصلاة، فإن صلحت صلح سائر عمله", ref: "رواه الطبراني" },
  { text: "من حافظ عليها كانت له نورًا وبرهانًا ونجاة يوم القيامة", ref: "رواه أحمد" },
  { text: "ليس بين العبد والجنة إلا الصلاة", ref: "حديث شريف" }
];

const heatmap = document.getElementById("heatmap");
const tooltip = document.getElementById("tooltip");
const monthsHeader = document.getElementById("monthsHeader");
const year = new Date().getFullYear();

let userName = localStorage.getItem("userName");
if(!userName){
  userName = prompt("من فضلك أدخل اسمك 🙂");
  if(userName && userName.trim() !== ""){
    localStorage.setItem("userName", userName.trim());
  } else {
    userName = "ضيف";
  }
}
document.getElementById("welcomeText").textContent = `مرحبًا بك، ${userName} 🌸`;

// --- دالة جلب أوقات الصلاة ---
async function getPrayerTimes() {
  try {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}`;
    const url = `https://api.aladhan.com/v1/timingsByCity/${dateStr}?city=${city}&country=${country}&method=${method}`;
    const res = await fetch(url);
    const data = await res.json();
    const timings = data.data.timings;
    return {
      "الفجر": timings.Fajr,
      "الظهر": timings.Dhuhr,
      "العصر": timings.Asr,
      "المغرب": timings.Maghrib,
      "العشاء": timings.Isha
    };
  } catch (error) {
    console.error("خطأ في جلب أوقات الصلاة:", error);
    return null;
  }
}


function timeStrToMinutes(timeStr) {
  if (!timeStr) return 0;
  timeStr = timeStr.replace(/[^0-9:]/g, "");
  let [hour, minute] = timeStr.split(":").map(Number);
  return hour * 60 + minute;
}


async function recordPrayer(dateKeyLocal) {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  let lvl = parseInt(localStorage.getItem(dateKeyLocal) || 0);

  const prayersTimesObj = await getPrayerTimes();
  if(!prayersTimesObj) return;

  const prayerPeriods = [
    { name: "الفجر", start: timeStrToMinutes(prayersTimesObj["الفجر"]), end: timeStrToMinutes(prayersTimesObj["الظهر"]) },
    { name: "الظهر", start: timeStrToMinutes(prayersTimesObj["الظهر"]), end: timeStrToMinutes(prayersTimesObj["العصر"]) },
    { name: "العصر", start: timeStrToMinutes(prayersTimesObj["العصر"]), end: timeStrToMinutes(prayersTimesObj["المغرب"]) },
    { name: "المغرب", start: timeStrToMinutes(prayersTimesObj["المغرب"]), end: timeStrToMinutes(prayersTimesObj["العشاء"]) },
    { name: "العشاء", start: timeStrToMinutes(prayersTimesObj["العشاء"]), end: 24*60 + timeStrToMinutes(prayersTimesObj["الفجر"]) }
  ];

  let currentPrayerIndex = -1;
  for (let i=0; i<prayerPeriods.length; i++) {
    const p = prayerPeriods[i];
    if (p.name !== "العشاء" && nowMinutes >= p.start && nowMinutes < p.end) {
      currentPrayerIndex = i; break;
    }
    if (p.name === "العشاء" && (nowMinutes >= p.start || nowMinutes < timeStrToMinutes(prayersTimesObj["الفجر"]))) {
      currentPrayerIndex = i; break;
    }
  }

  if(currentPrayerIndex === -1){
    alert("⏳ لا يمكنك تسجيل أي صلاة الآن."); return;
  }

  if(lvl > currentPrayerIndex){
    alert(`✔️ لقد سجلت صلوات لاحقة بالفعل، لا يمكن تسجيل هذه الصلاة.`); return;
  }

  lvl = currentPrayerIndex + 1;
  localStorage.setItem(dateKeyLocal, lvl);
  renderCell(dateKeyLocal, lvl);

  if(lvl === 5){
    const ayah = ayat[Math.floor(Math.random() * ayat.length)];
    document.getElementById("overlayText").textContent = `"${ayah.text}"`;
    document.getElementById("overlayRef").textContent = ayah.ref;
    document.getElementById("overlayAyah").style.display = "flex";
  }

  tooltip.style.opacity = 1;
  const timeString = now.toLocaleTimeString("ar-EG",{hour:"2-digit",minute:"2-digit"});
  tooltip.innerHTML = `<strong>تم تسجيل صلاة</strong><br>${prayers[currentPrayerIndex]}<br>🕒 ${timeString}`;
  updateStats();
}

// --- فحص الصلوات الفائتة ---
async function checkMissedPrayers(){
  const prayersTimesObj = await getPrayerTimes();
  if(!prayersTimesObj) return;
  const now = new Date();
  const todayKey = now.toISOString().split("T")[0];
  const missed = [];
  const nowMinutes = now.getHours()*60 + now.getMinutes();

  prayers.forEach((prayer, index)=>{
    const level = parseInt(localStorage.getItem(todayKey)||0);
    const prayerTime = timeStrToMinutes(prayersTimesObj[prayer]);
    if(index >= level && nowMinutes > prayerTime){
      missed.push(prayer);
    }
  });

  if(missed.length > 0){
    alert(`⚠️ لم تسجل الصلوات التالية اليوم: ${missed.join(", ")}`);
  }
}
setInterval(checkMissedPrayers, 10*60*1000);


const months = [
  { name: "يناير", days: 31 },
  { name: "فبراير", days: (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 29 : 28 },
  { name: "مارس", days: 31 },
  { name: "أبريل", days: 30 },
  { name: "مايو", days: 31 },
  { name: "يونيو", days: 30 },
  { name: "يوليو", days: 31 },
  { name: "أغسطس", days: 31 },
  { name: "سبتمبر", days: 30 },
  { name: "أكتوبر", days: 31 },
  { name: "نوفمبر", days: 30 },
  { name: "ديسمبر", days: 31 }
];

let currentDate = new Date();
let weekColumns = [];
let currentWeek = [];
let startDay = currentDate.getDay();
let startOffset = startDay === 6 ? 0 : startDay + 1;

for(let i=0;i<startOffset;i++){
  const emptyCell = document.createElement("div");
  emptyCell.className="day empty-day";
  currentWeek.push(emptyCell);
}

months.forEach((month, mIndex)=>{
  for(let i=0;i<month.days;i++){
    const cell = document.createElement("div");
    cell.className="day";
    const dateKey = currentDate.toISOString().split("T")[0];
    let level = parseInt(localStorage.getItem(dateKey)||0);

    renderCell(dateKey, level, cell);

    cell.addEventListener("click", ()=> recordPrayer(dateKey));

    cell.dataset.date = dateKey;
    cell.addEventListener("mouseenter", ()=>{
      const level = parseInt(localStorage.getItem(dateKey)||0);
      tooltip.style.opacity = 1;
      const date = new Date(dateKey);
      const dayName = date.toLocaleDateString("ar-EG", {weekday:'long'});
      const dayNum = date.toLocaleDateString("ar-EG", {day:'numeric'});
      const monthName = date.toLocaleDateString("ar-EG", {month:'long'});

      let prayerText = "";
      if(level === 0) prayerText = "لا توجد صلوات مسجلة";
      else if(level === 1) prayerText = "صلاة واحدة";
      else if(level === 2) prayerText = "صلاتان";
      else if(level === 3) prayerText = "3 صلوات";
      else if(level === 4) prayerText = "4 صلوات";
      else if(level === 5) prayerText = "5 صلوات ✓";

      tooltip.innerHTML=`<strong>${dayName} ${dayNum} ${monthName}</strong><br>${prayerText}`;
    });
    cell.addEventListener("mousemove",(e)=>{
      tooltip.style.left=e.pageX+10+"px";
      tooltip.style.top=e.pageY+10+"px";
    });
    cell.addEventListener("mouseleave",()=>{tooltip.style.opacity=0;});

    currentWeek.push(cell);
    if(currentWeek.length===7){
      weekColumns.push(currentWeek);
      currentWeek=[];
    }
    currentDate.setDate(currentDate.getDate()+1);
  }
});

if(currentWeek.length>0){
  while(currentWeek.length<7){
    const emptyCell = document.createElement("div");
    emptyCell.className="day empty-day";
    currentWeek.push(emptyCell);
  }
  weekColumns.push(currentWeek);
}

weekColumns.forEach(week=>{
  const weekCol=document.createElement("div");
  weekCol.className="week-column";
  week.forEach(day=>weekCol.appendChild(day));
  heatmap.appendChild(weekCol);
});

// --- دوال مساعدة ---
function renderCell(dateKey, level, cell=null){
  if(!cell){
    cell = [...document.querySelectorAll(".day")].find(c=>c.dataset.date===dateKey);
  }
  if(!cell) return;
  cell.className="day";
  if(level>0) cell.classList.add("l"+level);
}

function updateStats() {
  let totalPrayers = 0;
  let perfectDays = 0;
  let currentStreak = 0;
  const today = new Date();
  let checkDate = new Date(`${year}-01-01`);
  while(checkDate <= today){
    const dateKey = checkDate.toISOString().split("T")[0];
    const level = parseInt(localStorage.getItem(dateKey) || 0);
    totalPrayers += level;
    if(level === 5){ perfectDays++; currentStreak++; }
    else if(checkDate < today){ currentStreak = 0; }
    checkDate.setDate(checkDate.getDate()+1);
  }
  document.getElementById('totalPrayers').textContent = totalPrayers;
  document.getElementById('perfectDays').textContent = perfectDays;
  document.getElementById('currentStreak').textContent = currentStreak;
}

function resetData(){
  if(confirm("هل أنت متأكد من مسح جميع البيانات؟")){
    localStorage.clear();
    location.reload();
  }
}

function closeOverlay() {
  document.getElementById("overlayAyah").style.display = "none";
}

updateStats();
checkMissedPrayers();

