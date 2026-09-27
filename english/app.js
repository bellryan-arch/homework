"use strict";

const $ = id => document.getElementById(id);
const STORAGE_KEY = "bells_english_v1";
const MAX_HISTORY = 80;

const gradeSelect = $("gradeSelect");
const modeSelect = $("modeSelect");
const countSelect = $("countSelect");
const childSelect = $("childSelect");
const spellingSetup = $("spellingSetup");
const spellingWords = $("spellingWords");
const startBtn = $("startBtn");
const quickStartBtn = $("quickStartBtn");
const resetBtn = $("resetBtn");
const listenBtn = $("listenBtn");
const checkBtn = $("checkBtn");
const printBtn = $("printBtn");
const dashboardBtn = $("dashboardBtn");
const closeDashboardBtn = $("closeDashboardBtn");
const dashboardModal = $("dashboardModal");
const dashboardContent = $("dashboardContent");
const exportBtn = $("exportBtn");
const importFile = $("importFile");
const clearBtn = $("clearBtn");
const timerEl = $("timer");
const scoreEl = $("score");
const streakEl = $("streak");
const xpPreview = $("xpPreview");
const sheetTitle = $("sheetTitle");
const sheetMeta = $("sheetMeta");
const emptyState = $("emptyState");
const passageArea = $("passageArea");
const questionsEl = $("questions");
const feedbackEl = $("feedback");
const rewardCard = $("rewardCard");
const rewardTitle = $("rewardTitle");
const rewardText = $("rewardText");
const claimRewardBtn = $("claimRewardBtn");

const MODE_LABELS = {mixed:"Daily Mix",editing:"Fix the Sentence",vocabulary:"Word Power",reading:"Reading Sprint",spelling:"Spelling Studio"};

const editingBank = {
  3:[
    ["my brother and i planted three seeds","My brother and I planted three seeds.","Begin with a capital, capitalize I, and add end punctuation."],
    ["the puppy chase the red ball","The puppy chases the red ball.","The singular subject puppy needs a matching present-tense verb."],
    ["on monday we visited the library","On Monday, we visited the library.","Capitalize the day and use a comma after the opening phrase."],
    ["where did you put my blue pencil","Where did you put my blue pencil?","A direct question ends with a question mark."],
    ["sam packed apples crackers and cheese","Sam packed apples, crackers, and cheese.","Use capitals, commas in a list, and end punctuation."],
    ["the birds was singing in the tree","The birds were singing in the tree.","A plural subject takes were."],
    ["i dont know the answer yet","I don't know the answer yet.","Capitalize I and add the apostrophe in don't."],
    ["we seen a rainbow after the storm","We saw a rainbow after the storm.","Use the past-tense form saw."],
    ["maya said this book is funny","Maya said, “This book is funny.”","Capitalize the name and punctuate the speaker's exact words."],
    ["our class have two new fish","Our class has two new fish.","Treat class as a singular subject here."],
    ["the tiny mouse ran quick across the floor","The tiny mouse ran quickly across the floor.","Use an adverb to describe how the mouse ran."],
    ["can me and leo play too","Can Leo and I play too?","Put the other person first and use the subject pronoun I."]
  ],
  4:[
    ["after lunch we walked to the science room","After lunch, we walked to the science room.","Use a comma after an introductory phrase."],
    ["the basket of apples were on the counter","The basket of apples was on the counter.","The subject is basket, not apples."],
    ["its going to rain before soccer practice","It's going to rain before soccer practice.","Use the contraction for it is."],
    ["ava asked can we build the model today","Ava asked, “Can we build the model today?”","Punctuate a direct quotation and the question inside it."],
    ["we brought sandwiches juice and oranges","We brought sandwiches, juice, and oranges.","Separate items in a series with commas."],
    ["my friend and me finished the poster","My friend and I finished the poster.","Use the subject pronoun I."],
    ["the rabbit moved silent through the garden","The rabbit moved silently through the garden.","Use an adverb to describe the verb moved."],
    ["each of the players have a water bottle","Each of the players has a water bottle.","The subject each is singular."],
    ["yesterday we go to the community pool","Yesterday, we went to the community pool.","Use past tense and a comma after the opening word."],
    ["did you remember your hat mittens and boots","Did you remember your hat, mittens, and boots?","Add a capital, list commas, and question mark."],
    ["there dog likes to sleep by the window","Their dog likes to sleep by the window.","Use the possessive word their."],
    ["the team practised hard but they was nervous","The team practised hard, but they were nervous.","Join the two complete thoughts with a comma and use were."]
  ],
  5:[
    ["although the trail was muddy we continued hiking","Although the trail was muddy, we continued hiking.","Use a comma after the dependent opening clause."],
    ["neither of the answers are completely correct","Neither of the answers is completely correct.","Neither is singular in formal written English."],
    ["the students finished there experiments carefully","The students finished their experiments carefully.","Use the possessive word their."],
    ["the wind howled the windows rattled","The wind howled, and the windows rattled.","Repair the run-on by joining the complete thoughts correctly."],
    ["we should of checked the map before leaving","We should have checked the map before leaving.","Use should have, not should of."],
    ["the documentary was interesting it was also surprising","The documentary was interesting; it was also surprising.","A semicolon can join closely related complete thoughts."],
    ["maya who loves astronomy found saturn first","Maya, who loves astronomy, found Saturn first.","Set off extra information and capitalize proper nouns."],
    ["if the rain stops we can practise outside","If the rain stops, we can practise outside.","Use a comma after an opening dependent clause."],
    ["the instructions were more clearer after the example","The instructions were clearer after the example.","Avoid a double comparison."],
    ["our group chose the topic because its relevant","Our group chose the topic because it's relevant.","Use the contraction for it is."],
    ["walking through the museum the fossils amazed us","Walking through the museum, we were amazed by the fossils.","Make the person walking the subject of the main clause."],
    ["the coach said that we done our best","The coach said that we did our best.","Use did for the simple past tense."]
  ],
  6:[
    ["despite the delay the team completed its presentation","Despite the delay, the team completed its presentation.","Use a comma after an introductory phrase."],
    ["the evidence suggest that the habitat is changing","The evidence suggests that the habitat is changing.","The singular subject evidence needs suggests."],
    ["the novel was suspenseful however the ending felt rushed","The novel was suspenseful; however, the ending felt rushed.","Use a semicolon before and comma after the conjunctive adverb."],
    ["between you and i the second plan is stronger","Between you and me, the second plan is stronger.","A preposition takes the object pronoun me."],
    ["each student should revise their paragraph careful","Each student should revise their paragraph carefully.","Use an adverb to modify revise."],
    ["the report includes maps charts and a glossary","The report includes maps, charts, and a glossary.","Use commas to separate items in a series."],
    ["having finished the experiment the results were recorded","Having finished the experiment, we recorded the results.","The person who finished must be the subject that follows."],
    ["the committee have reached it's decision","The committee has reached its decision.","Use singular agreement and the possessive its."],
    ["because the source was unreliable we looked for another","Because the source was unreliable, we looked for another.","Use a comma after an opening dependent clause."],
    ["the two explanations are different then each other","The two explanations are different from each other.","Use different from in formal writing."],
    ["she asked whether the data was accurate?","She asked whether the data was accurate.","An indirect question usually ends with a period."],
    ["the article that we read yesterday it described the discovery","The article that we read yesterday described the discovery.","Remove the repeated subject it."]
  ]
};

const vocabularyBank = {
  3:[
    ["Which word means almost the same as enormous?",["tiny","huge","quiet","smooth"],"huge","Enormous and huge both mean very large."],
    ["In “The path was narrow,” what does narrow mean?",["not wide","very long","brightly lit","full of turns"],"not wide","Context tells us the path has little width."],
    ["Which prefix changes happy to its opposite?",["re-","un-","pre-","mis-"],"un-","The prefix un- can mean not."],
    ["Which word is a verb?",["jump","blue","friend","slow"],"jump","A verb names an action or state."],
    ["What does reread mean?",["read again","read before","read badly","not read"],"read again","The prefix re- means again."],
    ["Choose the best word: The glass ornament was __, so we carried it carefully.",["fragile","massive","ordinary","distant"],"fragile","Fragile means easily broken."],
    ["Which pair are antonyms?",["begin / start","rapid / fast","ancient / modern","silent / quiet"],"ancient / modern","Antonyms have opposite meanings."],
    ["The suffix -ful in helpful means:",["without","full of","one who","again"],"full of","Helpful means full of help or providing help."],
    ["Which word belongs with ocean, lake, and river?",["water","forest","desert","mountain"],"water","All three are bodies of water."],
    ["What does predict mean?",["tell what may happen","explain the past","copy exactly","ask a question"],"tell what may happen","To predict is to say what you think will happen."],
    ["Choose the more precise verb: The eagle __ above the trees.",["went","soared","did","was"],"soared","Soared describes smooth, high flight."],
    ["Which word has the base word care?",["careless","carpet","scared","carry"],"careless","Careless is care plus the suffix -less."]
  ],
  4:[
    ["What does the prefix inter- mean in international?",["between or among","before","against","under"],"between or among","Inter- often means between or among."],
    ["Choose the best meaning of reluctant: Priya was reluctant to enter the dark cave.",["eager","unwilling","unable","prepared"],"unwilling","The dark cave makes hesitation likely."],
    ["Which word is the strongest replacement for said?",["whispered","made","went","felt"],"whispered","Whispered tells how the words were spoken."],
    ["Which pair are synonyms?",["observe / notice","scarce / plentiful","permit / refuse","expand / shrink"],"observe / notice","Both mean to see or become aware of something."],
    ["The suffix -less in harmless means:",["full of","without","able to","one who"],"without","Harmless means without harm."],
    ["In “Water was scarce after weeks without rain,” scarce means:",["dirty","hard to find","flowing","cold"],"hard to find","The lack of rain makes water limited."],
    ["Which word has a Greek or Latin root meaning to look or see?",["inspect","transport","audible","rewrite"],"inspect","The root spect relates to seeing or looking."],
    ["Choose the best transition: The first design was heavy. __, the new design was light.",["For example","In contrast","Meanwhile","Because"],"In contrast","The second sentence shows an opposite quality."],
    ["What does autobiography mean?",["a life story written by that person","a made-up adventure","a list of facts","a poem about nature"],"a life story written by that person","Auto means self and biography is a life story."],
    ["Which word is most specific?",["vehicle","car","electric hatchback","machine"],"electric hatchback","It names the narrowest category."],
    ["The word misjudge most nearly means:",["judge again","judge wrongly","avoid judging","judge early"],"judge wrongly","The prefix mis- means wrongly or badly."],
    ["Which word completes the analogy: kitten is to cat as calf is to __?",["cow","horse","sheep","goat"],"cow","A kitten is a young cat; a calf is a young cow."]
  ],
  5:[
    ["In “The scientist's explanation was concise,” concise means:",["brief and clear","long and confusing","loud and forceful","new and surprising"],"brief and clear","Concise writing uses few words clearly."],
    ["What does the root struct mean in construction?",["build","hear","write","carry"],"build","Struct relates to building or arranging."],
    ["Which transition best introduces a result?",["Consequently","Similarly","For instance","Meanwhile"],"Consequently","Consequently signals a result."],
    ["Which word has the most positive connotation?",["determined","stubborn","rigid","obstinate"],"determined","Determined usually praises persistence."],
    ["The prefix sub- in submarine means:",["under","across","before","many"],"under","A submarine travels under water."],
    ["Choose the best meaning: The crowd dispersed after the concert.",["gathered","spread apart","cheered","waited"],"spread apart","Dispersed means moved in different directions."],
    ["Which pair shows cause and effect?",["erosion / worn rock","winter / summer","question / answer","author / reader"],"erosion / worn rock","Erosion causes rock to wear away."],
    ["What does biodegradable mean?",["able to break down naturally","made of metal","harmful to plants","used only once"],"able to break down naturally","Bio relates to life and degradable means able to break down."],
    ["Which is the most precise verb? The river __ through the canyon.",["meandered","went","was","did"],"meandered","Meandered describes a winding path."],
    ["The suffix -ology most often means:",["study of","fear of","able to","without"],"study of","For example, biology is the study of life."],
    ["Which word is an antonym of abundant?",["scarce","ample","plentiful","generous"],"scarce","Scarce means in short supply."],
    ["Infer the meaning of nocturnal: Owls are nocturnal and hunt after sunset.",["active at night","unable to fly","living underground","awake all day"],"active at night","The clue after sunset points to nighttime activity."]
  ],
  6:[
    ["What does the root cred mean in credible?",["believe","write","move","measure"],"believe","Cred relates to belief or trust."],
    ["In “Her claim was plausible but unproven,” plausible means:",["seemingly reasonable","certainly false","already proven","hard to hear"],"seemingly reasonable","A plausible idea could be true based on what is known."],
    ["Which transition concedes a point before contrasting it?",["Admittedly","Therefore","For example","Likewise"],"Admittedly","Admittedly acknowledges a point before another is made."],
    ["Which word has the most neutral connotation?",["thin","scrawny","slender","gaunt"],"thin","Thin is the least emotionally loaded choice."],
    ["What does counterargument mean?",["a reason opposing a claim","a repeated conclusion","an unrelated example","a source citation"],"a reason opposing a claim","Counter- signals opposition."],
    ["The suffix -ity in visibility changes visible into:",["a noun","a verb","an adverb","a preposition"],"a noun","Visibility names the state of being visible."],
    ["Which word best replaces very important?",["essential","interesting","noticeable","ordinary"],"essential","Essential means absolutely necessary or extremely important."],
    ["In science writing, to synthesize sources means to:",["combine ideas into a new understanding","copy one source","list titles alphabetically","reject every opinion"],"combine ideas into a new understanding","Synthesis connects ideas across sources."],
    ["What does the root chron mean in chronological?",["time","place","sound","light"],"time","Chron relates to time."],
    ["Which pair are closest in meaning?",["verify / confirm","imply / state","expand / reduce","bias / fairness"],"verify / confirm","Both mean to establish that something is accurate."],
    ["Which phrase is an example of figurative language?",["the city never sleeps","the city has streets","the city is crowded","the city grew"],"the city never sleeps","The city is given a human action."],
    ["Infer ambiguous: The directions were ambiguous, so each group interpreted them differently.",["open to more than one meaning","perfectly clear","written quickly","missing a title"],"open to more than one meaning","Different interpretations signal unclear or multiple meanings."]
  ]
};

const passages = {
  3:[
    {title:"The Balcony Garden",text:"Mina wanted to grow food, but her apartment had no yard. She placed three pots on the sunny balcony and planted lettuce seeds. Every morning, she checked the soil with one finger. If it felt dry, she added a little water. Two weeks later, pale green leaves pushed through the soil. Mina measured them on Sundays and drew each change in a notebook.",questions:[
      ["Why did Mina use pots?",["Her apartment had no yard","She disliked gardens","The soil was frozen","The pots were gifts"],"Her apartment had no yard","The first sentence explains the problem."],
      ["What did Mina do when the soil felt dry?",["Added water","Moved the pots inside","Picked the leaves","Changed the soil"],"Added water","The passage states this directly."],
      ["What does measured mean in the passage?",["Found the size","Guessed the colour","Counted the pots","Smelled the leaves"],"Found the size","Mina tracked how much the leaves grew."]]},
    {title:"A Shortcut Home",text:"Eli usually walked home along Maple Street. One afternoon, he followed a narrow path beside the creek instead. A fallen branch blocked the trail, and the rocks were slippery from rain. Eli slowed down, stepped around the branch, and tested each rock before moving forward. The shortcut took longer than his usual route, but he discovered a quiet place where tiny fish flashed in the water.",questions:[
      ["Why were the rocks slippery?",["It had rained","Fish covered them","The creek was frozen","Eli spilled water"],"It had rained","The passage says the rocks were slippery from rain."],
      ["How did Eli move safely?",["He tested each rock","He ran quickly","He jumped over the creek","He turned off the path"],"He tested each rock","This action is stated directly."],
      ["What did Eli discover?",["A quiet place with fish","A new Maple Street","A lost backpack","A bridge home"],"A quiet place with fish","The final sentence describes the discovery."]]}
  ],
  4:[
    {title:"The Library Seed Swap",text:"The neighbourhood library usually lent books, but this spring it also lent an idea. Staff placed labelled envelopes of vegetable seeds beside the checkout desk. Visitors could take one envelope, grow the plants, and return seeds after harvest. Mr. Chen chose beans because they would climb the railing outside his window. By August, his vines formed a green screen and produced enough beans to share with two neighbours.",questions:[
      ["How was the seed swap meant to continue?",["Growers returned seeds after harvest","Visitors paid for each envelope","Staff planted every garden","Neighbours traded books"],"Growers returned seeds after harvest","Returning seeds replenishes the shared supply."],
      ["Why did Mr. Chen choose beans?",["They could climb his railing","They grew without sunlight","They needed no water","They were the only seeds left"],"They could climb his railing","The passage gives this reason."],
      ["What does produced mean here?",["Grew or yielded","Purchased","Cooked","Delivered"],"Grew or yielded","The vines created beans that could be shared."]]},
    {title:"Listening for Frogs",text:"At dusk, Nia and her grandfather carried a clipboard to the pond. They were helping a community science project count frog calls. Instead of looking for frogs, they listened for different patterns. One species made a sound like a finger moving across a comb. Another gave a single deep note. Nia recorded the time, weather, and number of calls. The information would help scientists notice changes in the pond habitat.",questions:[
      ["How did Nia identify the frogs?",["By their call patterns","By catching them","By their footprints","By their nests"],"By their call patterns","They listened instead of looking."],
      ["Why did Nia record the weather?",["To give scientists useful context","To predict her walk home","To choose a coat","To name the frogs"],"To give scientists useful context","Weather can affect calls and helps interpret the observations."],
      ["The project is best described as:",["community science","a music lesson","a fishing contest","a weather report"],"community science","Volunteers collected observations for scientific use."]]}
  ],
  5:[
    {title:"The Cooler Roof",text:"During hot afternoons, the school’s flat roof absorbed sunlight and warmed the rooms below. A student eco-team wondered whether a lighter surface could help. They placed identical boxes under black, silver, and white sheets, then measured the air inside each box every five minutes. The box under the white sheet stayed coolest. Their test was small, but it gave the principal evidence to investigate reflective roof materials before the next repair.",questions:[
      ["What variable did the students change?",["The colour of the sheet","The size of each box","The measuring time","The outdoor temperature"],"The colour of the sheet","The boxes and timing stayed the same."],
      ["Why is the test described as small?",["It used boxes rather than a whole roof","The sheets were hard to see","Few students knew about it","The roof was already repaired"],"It used boxes rather than a whole roof","The model offered evidence but was not a full-scale trial."],
      ["What conclusion was best supported?",["A light surface may reduce heating","Black roofs never need repair","Silver always costs less","Classrooms need more windows"],"A light surface may reduce heating","The white-covered box stayed coolest."]]},
    {title:"A Map Made of Sound",text:"When Theo joined the forest walk, he expected to sketch trees. Instead, the guide asked everyone to make a sound map. Theo marked his location at the centre of a page. For five quiet minutes, he added symbols around it: three quick lines for a woodpecker, a spiral for wind in the leaves, and a dotted arc for an airplane fading west. Comparing maps later showed that each person had noticed a different layer of the same place.",questions:[
      ["What did the symbols show?",["Sounds and their directions","Tree species and ages","Distances walked","Weather changes"],"Sounds and their directions","Theo placed sound symbols around his location."],
      ["What is a central idea of the passage?",["People notice different details in one place","Drawing trees is always difficult","Airplanes disturb every forest","Guides should speak quietly"],"People notice different details in one place","The comparison revealed different layers noticed by each person."],
      ["What does fading suggest about the airplane?",["Its sound became weaker","It landed nearby","It changed colour","It flew in circles"],"Its sound became weaker","A receding sound fades as it becomes quieter."]]}
  ],
  6:[
    {title:"The Repair Café",text:"On the first Saturday of each month, volunteers transformed the community hall into a repair café. Residents arrived with lamps, torn backpacks, and small appliances that might otherwise be discarded. The volunteers did not promise every item could be saved. Instead, they explained each diagnosis and invited owners to help with safe repairs. The event reduced waste, but its larger effect was harder to measure: people left with the confidence to investigate the next broken object before replacing it.",questions:[
      ["What does diagnosis mean in this context?",["Identification of the problem","Price of a replacement","History of the object","Promise of success"],"Identification of the problem","The volunteers explained what was wrong before attempting repairs."],
      ["Which outcome was harder to measure?",["People's growing confidence","The number of lamps","The hall's size","The date of each event"],"People's growing confidence","The passage explicitly contrasts waste reduction with confidence."],
      ["Which theme is best supported?",["Shared skills can make a community more resourceful","Every broken item should be repaired","New products are always wasteful","Experts should work alone"],"Shared skills can make a community more resourceful","Owners participate and gain confidence from volunteers."]]},
    {title:"A Darker Night",text:"A town council considered replacing bright white streetlights with warmer, shielded lamps. Supporters argued that directing light downward would preserve visibility while reducing glare and helping migrating birds. Some residents worried that dimmer-looking streets would feel unsafe. The council began a three-month pilot on two blocks and asked residents to report visibility concerns. It also partnered with a local astronomy club to measure sky brightness before and after the change.",questions:[
      ["Why did the council run a pilot?",["To gather evidence before a wider change","To avoid speaking with residents","To close the streets","To help the astronomy club sell lamps"],"To gather evidence before a wider change","The limited trial collects both resident and brightness data."],
      ["What competing concerns appear in the passage?",["Reducing glare and maintaining safety","Saving birds and closing roads","Astronomy and electricity prices","Warm lamps and cold weather"],"Reducing glare and maintaining safety","Supporters and concerned residents emphasize these two goals."],
      ["Which evidence would best evaluate the pilot?",["Visibility reports and sky-brightness measurements","The colour of nearby houses","The number of council members","Old photographs of the town"],"Visibility reports and sky-brightness measurements","Both measures directly test the stated goals and concerns."]]}
  ]
};

const spellingBank = {
  3:["because","people","friend","beautiful","different","thought","enough","every","country","school","really","favourite"],
  4:["separate","believe","necessary","surprise","favourite","neighbour","through","probably","calendar","knowledge","straight","different"],
  5:["environment","community","temperature","responsible","opportunity","dictionary","immediately","especially","physical","rhythm","excellent","curious"],
  6:["accommodate","conscience","exaggerate","independent","perspective","privilege","recommend","relevant","sufficient","threshold","vocabulary","committee"]
};

function defaultProgress(){return {version:1,history:[],skills:{editing:{sessions:0,total:0,correct:0},vocabulary:{sessions:0,total:0,correct:0},reading:{sessions:0,total:0,correct:0},spelling:{sessions:0,total:0,correct:0}},completedDates:{},selectedChild:0,customWords:""};}
function loadProgress(){try{const raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");if(!raw||raw.version!==1)return defaultProgress();return {...defaultProgress(),...raw,skills:{...defaultProgress().skills,...(raw.skills||{})}};}catch(_error){return defaultProgress();}}
function saveProgress(){localStorage.setItem(STORAGE_KEY,JSON.stringify(progress));}
let progress=loadProgress();
let session=null;
let startedAt=0;
let timerHandle=null;

function shuffle(items){const copy=[...items];for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;}
function sample(items,count){return shuffle(items).slice(0,Math.min(count,items.length));}
function normalize(value){return String(value||"").normalize("NFKC").replace(/[“”]/g,'"').replace(/[‘’]/g,"'").replace(/\s+/g," ").replace(/\s+([,.!?;:])/g,"$1").trim();}
function answerMatches(question,value){if(question.type==="choice")return value===question.answer;if(question.type==="spelling")return normalize(value).toLocaleLowerCase("en-CA")===question.answer.toLocaleLowerCase("en-CA");return normalize(value)===normalize(question.answer);}
function uid(){if(crypto&&crypto.getRandomValues){const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0].toString(16);}return Math.random().toString(36).slice(2);}
function elapsed(){return Math.max(0,Date.now()-startedAt);}
function formatTime(ms){const total=Math.floor(ms/1000);return `${String(Math.floor(total/60)).padStart(2,"0")}:${String(total%60).padStart(2,"0")}`;}
function isoDate(){return new Date().toISOString().slice(0,10);}
function dailyStreak(){let streak=0;const d=new Date();while(progress.completedDates[d.toISOString().slice(0,10)]){streak++;d.setDate(d.getDate()-1);}return streak;}

function makeEditing(grade,count){return sample(editingBank[grade],count).map((item,index)=>({id:uid(),skill:"editing",type:"text",prompt:item[0],answer:item[1],hint:item[2],label:`Rewrite the sentence correctly`,number:index+1,value:"",correct:false}));}
function makeVocabulary(grade,count){return sample(vocabularyBank[grade],count).map((item,index)=>({id:uid(),skill:"vocabulary",type:"choice",prompt:item[0],options:shuffle(item[1]),answer:item[2],hint:item[3],number:index+1,value:"",correct:false}));}
function makeReading(grade,count){const passage=sample(passages[grade],1)[0];const bank=sample(passage.questions,count);return {passage,questions:bank.map((item,index)=>({id:uid(),skill:"reading",type:"choice",prompt:item[0],options:shuffle(item[1]),answer:item[2],hint:item[3],number:index+1,value:"",correct:false}))};}
function parseSpellingWords(grade){const custom=spellingWords.value.split(/[\n,]+/).map(w=>w.trim()).filter(Boolean).filter(w=>/^[a-zA-ZÀ-ÿ'’-]+$/.test(w));return custom.length?Array.from(new Set(custom.map(w=>w.toLocaleLowerCase("en-CA")))):spellingBank[grade];}
function makeSpelling(grade,count){const words=sample(parseSpellingWords(grade),count);return words.map((word,index)=>({id:uid(),skill:"spelling",type:"spelling",prompt:`Word ${index+1}`,answer:word,hint:`Listen again, then type the whole word.`,number:index+1,value:"",correct:false}));}
function makeMixed(grade,count){const readingCount=count>=8?2:1;const editCount=Math.ceil((count-readingCount)/2);const vocabCount=count-readingCount-editCount;const reading=makeReading(grade,readingCount);const questions=[...makeEditing(grade,editCount),...makeVocabulary(grade,vocabCount),...reading.questions];return {passage:reading.passage,questions:shuffle(questions).map((q,index)=>({...q,number:index+1}))};}

function startSession(forceMixed=false){
  const grade=Number(gradeSelect.value);const mode=forceMixed?"mixed":modeSelect.value;const count=Number(countSelect.value);let built;
  if(mode==="editing")built={passage:null,questions:makeEditing(grade,count)};
  else if(mode==="vocabulary")built={passage:null,questions:makeVocabulary(grade,count)};
  else if(mode==="reading")built=makeReading(grade,Math.min(count,6));
  else if(mode==="spelling")built={passage:null,questions:makeSpelling(grade,count)};
  else built=makeMixed(grade,count);
  if(!built.questions.length){showFeedback("Add at least one valid spelling word.","warning");return;}
  session={id:uid(),grade,mode,child:Number(childSelect.value),childName:childSelect.selectedOptions[0].textContent,questions:built.questions,passage:built.passage,initialAccuracy:null,firstChecked:false,completed:false,reward:null};
  childSelect.disabled=true;
  startedAt=Date.now();clearInterval(timerHandle);timerHandle=setInterval(()=>timerEl.textContent=formatTime(elapsed()),1000);timerEl.textContent="00:00";scoreEl.textContent="—";xpPreview.textContent="Up to 35";
  emptyState.classList.add("hidden");rewardCard.classList.add("hidden");feedbackEl.className="feedback";sheetTitle.textContent=MODE_LABELS[mode];sheetMeta.textContent=`Grade ${grade} · ${built.questions.length} items · ${MODE_LABELS[mode]}`;
  renderPassage();renderQuestions();checkBtn.disabled=false;listenBtn.disabled=mode!=="spelling";document.getElementById("practice-area").scrollIntoView({behavior:"smooth",block:"start"});
}

function renderPassage(){if(!session||!session.passage){passageArea.classList.add("hidden");passageArea.innerHTML="";return;}passageArea.classList.remove("hidden");passageArea.innerHTML=`<h3>📖 ${escapeHtml(session.passage.title)}</h3><p>${escapeHtml(session.passage.text)}</p>`;}
function escapeHtml(value){return String(value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));}
function renderQuestions(){
  questionsEl.innerHTML=session.questions.map(q=>{
    const state=q.correct?"correct":q.checked?"wrong":"";
    let answer="";
    if(q.type==="choice")answer=`<div class="choices">${q.options.map(option=>`<label class="choice"><input type="radio" name="q-${q.id}" value="${escapeHtml(option)}" ${q.value===option?"checked":""} ${q.correct?"disabled":""}><span>${escapeHtml(option)}</span></label>`).join("")}</div>`;
    else if(q.type==="spelling")answer=`<div class="spelling-prompt"><button class="listen-word" type="button" data-listen="${q.id}">🔊 Hear word</button><input class="answer-input" data-answer="${q.id}" autocomplete="off" spellcheck="false" value="${escapeHtml(q.value)}" ${q.correct?"disabled":""} aria-label="Type spelling word ${q.number}"></div>`;
    else answer=`<input id="answer-${q.id}" class="answer-input" data-answer="${q.id}" autocomplete="off" spellcheck="true" value="${escapeHtml(q.value)}" ${q.correct?"disabled":""} aria-label="Corrected sentence ${q.number}">`;
    const correction=q.checked?`<div class="correction ${q.correct?"good":"fix"}">${q.correct?"✓ Correct":`✎ Correct answer: <strong>${escapeHtml(q.answer)}</strong> — ${escapeHtml(q.hint)}`}</div>`:"";
    return `<article class="question-card ${state}" data-id="${q.id}"><div class="question-head"><span class="question-number">${q.number}</span><div class="question-copy">${q.type==="text"?`<label for="answer-${q.id}">${escapeHtml(q.label)}</label><p class="question-note">Sentence to edit: <strong>${escapeHtml(q.prompt)}</strong></p>`:`<div class="prompt">${escapeHtml(q.prompt)}</div>`}${answer}${correction}</div></div></article>`;
  }).join("");
  questionsEl.querySelectorAll("[data-answer]").forEach(input=>input.addEventListener("input",event=>{const q=session.questions.find(item=>item.id===event.target.dataset.answer);if(q)q.value=event.target.value;}));
  questionsEl.querySelectorAll("input[type=radio]").forEach(input=>input.addEventListener("change",event=>{const id=event.target.name.slice(2);const q=session.questions.find(item=>item.id===id);if(q)q.value=event.target.value;}));
  questionsEl.querySelectorAll("[data-listen]").forEach(button=>button.addEventListener("click",()=>speakQuestion(button.dataset.listen)));
}

function speakQuestion(id){const q=session&&session.questions.find(item=>item.id===id);if(!q||!("speechSynthesis" in window))return;window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(q.answer);utterance.lang="en-CA";utterance.rate=.8;window.speechSynthesis.speak(utterance);}
function listenNext(){if(!session)return;const next=session.questions.find(q=>q.type==="spelling"&&!q.correct);if(next)speakQuestion(next.id);}
function showFeedback(message,type="info"){feedbackEl.innerHTML=message;feedbackEl.className=`feedback show ${type}`;}

function checkAnswers(){
  if(!session||session.completed)return;
  const missing=session.questions.find(q=>!normalize(q.value));
  if(missing){showFeedback(`Please answer every item. The first missing answer is <strong>#${missing.number}</strong>.`,"warning");return;}
  let correct=0;
  session.questions.forEach(q=>{q.checked=true;q.correct=answerMatches(q,q.value);if(q.correct)correct++;});
  const total=session.questions.length;const pct=Math.round(correct/total*100);
  if(!session.firstChecked){session.firstChecked=true;session.initialAccuracy=pct;}
  scoreEl.textContent=`${correct}/${total} (${pct}%)`;renderQuestions();
  if(correct===total)completeSession();
  else showFeedback(`${total-correct} ${total-correct===1?"answer needs":"answers need"} fixing. Use the feedback under each item, correct the highlighted answers, then check again.`,"warning");
}

function completeSession(){
  session.completed=true;clearInterval(timerHandle);const total=session.questions.length;const ms=elapsed();progress.completedDates[isoDate()]=true;
  const skillCounts={};session.questions.forEach(q=>{skillCounts[q.skill]??={total:0,correct:0};skillCounts[q.skill].total++;skillCounts[q.skill].correct+=q.checked&&q.correct?1:0;});
  Object.entries(skillCounts).forEach(([skill,stats])=>{progress.skills[skill].sessions++;progress.skills[skill].total+=stats.total;progress.skills[skill].correct+=stats.correct;});
  progress.history.push({id:session.id,date:isoDate(),at:new Date().toISOString(),grade:session.grade,mode:session.mode,items:total,initialAccuracy:session.initialAccuracy,correctedAll:true,ms});if(progress.history.length>MAX_HISTORY)progress.history=progress.history.slice(-MAX_HISTORY);
  progress.selectedChild=session.child;progress.customWords=spellingWords.value;saveProgress();updateHeaderStats();childSelect.disabled=false;
  const pass=BellLearningRewards.create({source:"bells-english",activity:session.mode,grade:session.grade,child:session.child,itemCount:total,initialAccuracy:session.initialAccuracy,correctedAll:true});BellLearningRewards.publish(pass);session.reward=pass;
  xpPreview.textContent=`+${pass.xp} ready`;rewardTitle.textContent=`${"★".repeat(pass.stars)} You earned ${pass.xp} Chore Quest points!`;rewardText.textContent=`Every answer is corrected. This Bell Pass is ready for ${session.childName} and expires in 48 hours.`;claimRewardBtn.href=BellLearningRewards.claimUrl(pass);rewardCard.classList.remove("hidden");showFeedback("✅ Learning quest complete. Every answer has been corrected.","success");rewardCard.scrollIntoView({behavior:"smooth",block:"nearest"});
}

function updateHeaderStats(){streakEl.textContent=String(dailyStreak());}
function resetSession(){session=null;childSelect.disabled=false;clearInterval(timerHandle);questionsEl.innerHTML="";passageArea.innerHTML="";passageArea.classList.add("hidden");emptyState.classList.remove("hidden");rewardCard.classList.add("hidden");feedbackEl.className="feedback";sheetTitle.textContent="Ready for today's quest?";sheetMeta.textContent=`Grade ${gradeSelect.value} · ${MODE_LABELS[modeSelect.value]}`;timerEl.textContent="00:00";scoreEl.textContent="—";xpPreview.textContent="Up to 35";checkBtn.disabled=true;listenBtn.disabled=true;}
function toggleSpellingSetup(){spellingSetup.classList.toggle("hidden",modeSelect.value!=="spelling");countSelect.disabled=modeSelect.value==="reading";document.getElementById("readingNote").classList.toggle("hidden",modeSelect.value!=="reading");sheetMeta.textContent=`Grade ${gradeSelect.value} · ${MODE_LABELS[modeSelect.value]}`;}

function renderDashboard(){
  const history=[...progress.history].reverse();const totalSessions=history.length;const avg=totalSessions?Math.round(history.reduce((sum,item)=>sum+item.initialAccuracy,0)/totalSessions):0;const totalMinutes=Math.round(history.reduce((sum,item)=>sum+item.ms,0)/60000);
  const rows=history.slice(0,12).map(item=>`<tr><td>${escapeHtml(item.date)}</td><td>Grade ${item.grade}</td><td>${MODE_LABELS[item.mode]||item.mode}</td><td>${item.initialAccuracy}%</td><td>${Math.round(item.ms/60000)} min</td></tr>`).join("");
  dashboardContent.innerHTML=`<div class="dashboard-grid"><div class="dash-stat"><small>COMPLETED QUESTS</small><strong>${totalSessions}</strong></div><div class="dash-stat"><small>FIRST-TRY AVERAGE</small><strong>${avg}%</strong></div><div class="dash-stat"><small>PRACTICE TIME</small><strong>${totalMinutes} min</strong></div></div><h3>Recent practice</h3>${rows?`<div style="overflow:auto"><table class="history-table"><thead><tr><th>Date</th><th>Grade</th><th>Type</th><th>First try</th><th>Time</th></tr></thead><tbody>${rows}</tbody></table></div>`:"<p>No completed English quests yet.</p>"}`;
}
function openDashboard(){renderDashboard();dashboardModal.classList.remove("hidden");}
function closeDashboard(){dashboardModal.classList.add("hidden");}
function downloadBackup(){const blob=new Blob([JSON.stringify(progress,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`bells-english-backup-${isoDate()}.json`;a.click();URL.revokeObjectURL(url);}
function importBackup(file){const reader=new FileReader();reader.onload=()=>{try{const parsed=JSON.parse(reader.result);if(!parsed||parsed.version!==1||!Array.isArray(parsed.history))throw new Error("Invalid backup");progress={...defaultProgress(),...parsed};saveProgress();updateHeaderStats();renderDashboard();alert("Bell's English backup imported.");}catch(_error){alert("That file is not a valid Bell's English backup.");}};reader.readAsText(file);}
function clearData(){if(!confirm("Clear all Bell's English progress and custom spelling words on this device?"))return;localStorage.removeItem(STORAGE_KEY);progress=defaultProgress();spellingWords.value="";updateHeaderStats();renderDashboard();resetSession();}

modeSelect.addEventListener("change",toggleSpellingSetup);gradeSelect.addEventListener("change",toggleSpellingSetup);childSelect.addEventListener("change",()=>{progress.selectedChild=Number(childSelect.value);saveProgress();});spellingWords.addEventListener("change",()=>{progress.customWords=spellingWords.value;saveProgress();});
startBtn.addEventListener("click",()=>startSession(false));quickStartBtn.addEventListener("click",()=>{modeSelect.value="mixed";toggleSpellingSetup();startSession(true);});resetBtn.addEventListener("click",resetSession);checkBtn.addEventListener("click",checkAnswers);listenBtn.addEventListener("click",listenNext);printBtn.addEventListener("click",()=>window.print());dashboardBtn.addEventListener("click",openDashboard);closeDashboardBtn.addEventListener("click",closeDashboard);dashboardModal.addEventListener("click",event=>{if(event.target===dashboardModal)closeDashboard();});exportBtn.addEventListener("click",downloadBackup);importFile.addEventListener("change",event=>{if(event.target.files[0])importBackup(event.target.files[0]);});clearBtn.addEventListener("click",clearData);
document.addEventListener("keydown",event=>{if(event.key==="Escape")closeDashboard();});

const familyNames=BellLearningRewards.familyNames();
if(familyNames.length){
  [...childSelect.options].forEach((option,index)=>{option.textContent=familyNames[index]||`Child ${index+1}`;option.hidden=index>=familyNames.length;});
  document.getElementById("familyConnectText").textContent="Family names connected on this browser. Choose the right child below to earn points; practice progress stays here.";
}
childSelect.value=String(familyNames.length?Math.min(progress.selectedChild||0,familyNames.length-1):(progress.selectedChild||0));
const mathHandoffParams=new URLSearchParams(location.search);
if(mathHandoffParams.get("fromMath")==="1"){
  const mathGrade=Number(mathHandoffParams.get("grade"));
  if(Number.isInteger(mathGrade) && mathGrade>=1 && mathGrade<=8){
    const englishGrade=Math.max(3,Math.min(6,mathGrade));
    gradeSelect.value=String(englishGrade);
    const banner=$("mathHandoff");banner.classList.remove("hidden");
    banner.textContent=mathGrade===englishGrade
      ? `Math Grade ${mathGrade} is selected for English. Choose the grade, practice type and length, then tap Start Practice.`
      : `English currently offers Grades 3–6, so Grade ${englishGrade} is selected after Math Grade ${mathGrade}. You can change the grade, practice type and length before starting.`;
  }
}
spellingWords.value=progress.customWords||"";toggleSpellingSetup();updateHeaderStats();resetSession();
