'use strict';
const roadmap = [
 {id:'python',title:'Get comfortable with Python',level:'Beginner',duration:'30 minutes',prerequisites:'None',outcome:'Create a list and calculate an average.',resourceId:'learn-python'},
 {id:'dataset',title:'Explore your first dataset',level:'Beginner',duration:'25 minutes',prerequisites:'Python basics',outcome:'Spot missing values and ask a useful question.',resourceId:'learn-dataset'},
 {id:'charts',title:'Tell a story with a chart',level:'Beginner',duration:'25 minutes',prerequisites:'A small dataset',outcome:'Choose a chart and explain what it shows.',resourceId:'learn-charts'},
 {id:'project',title:'Build a small project',level:'Beginner',duration:'60 minutes',prerequisites:'Steps 1–3',outcome:'Write a short report with a question, chart and limitation.',resourceId:'learn-project'},
 {id:'ml',title:'Try your first prediction',level:'Intermediate',duration:'45 minutes',prerequisites:'Python and a finished small project',outcome:'Explain training data, test data and a baseline.',resourceId:'learn-ml'}
];
const lessons = [
 {id:'learn-python',title:'Python: your first five lines',desc:'Learn variables, lists and averages with a small practice example.',body:'Start with a question: what is the average number of hours spent studying?\n\nCreate a list in Python: hours = [2, 3, 1, 4, 5]. Then calculate average = sum(hours) / len(hours). Use print(average) to see the result: 3.0.\n\nPractice: add a new day with 6 hours. Calculate the average again. Compare the two answers.\n\nAn average can hide differences. The days are not identical, even if one number summarises them. Do not invent observations or collect classmates’ private information.'},
 {id:'learn-dataset',title:'A dataset is a collection of questions',desc:'Read rows, check missing values, and separate evidence from guesses.',body:'Use this fictional practice dataset: Monday, 2 hours; Tuesday, 3 hours; Wednesday, missing; Thursday, 4 hours; Friday, 5 hours.\n\nEach row is a day. Each column is a property, such as hours studied. A missing value is unknown. It is not automatically zero.\n\nCount the rows. Count the missing values. Calculate the average using the four known values. State that one day is missing.\n\nPractice: what changes if the missing value is 0? What changes if it is 6? Explain why filling it without evidence can mislead.\n\nBefore using a real dataset, check its source, permission, units, date range and personal information.'},
 {id:'learn-charts',title:'Choose a chart that answers the question',desc:'Turn five fictional observations into a readable chart.',body:'Use the fictional values Monday 2, Tuesday 3, Wednesday 1, Thursday 4 and Friday 5 study hours.\n\nA bar chart compares days. Put days on the horizontal axis and hours on the vertical axis. Start the bar chart at zero. Label the units.\n\nA line chart is useful for change across time. A scatter plot is useful for comparing two numeric measurements. A pie chart rarely helps with many categories.\n\nPractice: draw a bar chart on paper or in a notebook. Write one sentence describing the largest value and one explaining a limitation. Five fictional days do not prove a pattern for all students.'},
 {id:'learn-project',title:'Your first data project: question to conclusion',desc:'A practical checklist for a short, honest student project.',body:'Choose a small question you can answer with data you are allowed to use. For practice, use the fictional study-hours data in the earlier lessons.\n\nWrite your question first. Describe where the data came from. Check duplicates, missing values and units. Calculate a summary and create one readable chart.\n\nWrite three parts: what you found, what the data cannot tell you, and what you would investigate next.\n\nYour finished output should include the question, dataset description, one chart, one calculation, a limitation and a short README.\n\nShare your work for feedback through your society workspace when you become a member. Never upload identity documents or classmates’ personal details as a project dataset.'},
 {id:'learn-ml',title:'Machine learning starts with a baseline',desc:'Understand predictions before choosing a complicated model.',body:'Suppose you want to predict a future numeric value. A baseline might predict the average of earlier values every time. It is simple, but gives you something to compare against.\n\nSeparate training data from test data before fitting a model. Training data teaches the model; test data estimates how it performs on unseen examples.\n\nFor time-based questions, keep later observations for testing. Do not use future information while training. That is data leakage.\n\nCompare prediction errors against the baseline using the same test data. A complex model is only useful if its improvement is meaningful for the question.\n\nPractice: predict the next fictional study day using the earlier average. Explain why five observations are too few to trust a real-world prediction.'}
].map((r,i)=>({...r,type:'DSS practice lesson',level:i===4?'Intermediate':'Beginner',duration:roadmap[i].duration,prerequisites:roadmap[i].prerequisites,outcome:roadmap[i].outcome,requiresAuth:false,length:roadmap[i].duration,link:'',fileUrl:''}));
const faq=[
 {id:'who',title:'Who can join DSS?',body:'DSS is an independent student society for learners across Pakistan. You do not need to belong to a particular university or already know machine learning.'},
 {id:'roles',title:'What are the three community modes?',body:'Normal members use the learning dashboard. Society members contribute and receive feedback. Ambassadors organise activities for their student communities. Cabinet positions are responsibilities assigned to society members by an administrator.'},
 {id:'applications',title:'How do applications work?',body:'Applications appear only while an administrator opens a recruitment window. Sign in, complete the current questions and submit. Your existing account stays available during review. Track the decision and feedback in your dashboard.'},
 {id:'fees',title:'Is there a membership fee?',body:'Any membership fee or event charge must be stated in the current application or confirmed event details. Contact the society before making a payment; do not assume an unannounced fee.'},
 {id:'commitment',title:'How much time will I need?',body:'Learn at your own pace as a normal member. For society roles, check the responsibilities and weekly commitment in the current application. Cabinet members and ambassadors see assigned work and deadlines in their workspace.'},
 {id:'help',title:'I am new to data science. Where do I begin?',body:'Open Start here and follow the five-step learning path. The first lessons need no advanced maths. You can practise on paper as well as in a Python notebook.'},
 {id:'privacy',title:'Why does an application ask for personal information?',body:'Application questions are set by the society administrator for review. Share only what is requested for that purpose. Ask the society about any sensitive question before submitting. Do not put identity documents in public projects or reports.'}
];
function improveContent(content){
 content.collections ||= {};
 content.collections.showcase ||= [];
 content.collections.roadmap ||= structuredClone(roadmap);
 content.collections.faq ||= structuredClone(faq).map(q=>({...q,requiresAuth:false}));
 if(content._studentExperienceVersion===1)return;
 const original=require('../website/content-seed.json').collections;
 for(const key of ['resources','projects','blogs','papers','events','team']){
  for(const item of content.collections[key]||[]){
   const sample=original[key]?.find(s=>String(s.id)===String(item.id));
   if(!sample)continue;
   for(const field of ['fileUrl','fileName','fileSize','image','stars','forks'])if(item[field]===sample[field])item[field]='';
   if(item.link===sample.link&&/data-science-society|dss\./.test(item.link))item.link='';
   if(key==='events'&&!item.startDate)item.status ||= 'planned';

   if(key==='papers'&&item.title===sample.title){
    const readings=[
     ['Scaling Laws for Neural Language Models','Jared Kaplan et al.','https://arxiv.org/abs/2001.08361'],
     ['Attention Is All You Need','Ashish Vaswani et al.','https://arxiv.org/abs/1706.03762'],
     ['An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale','Authors listed in the original paper','https://arxiv.org/abs/2010.11929'],
     ['Optimization Methods for Large-Scale Machine Learning','Authors listed in the original paper','https://arxiv.org/abs/1606.04838']
    ];
    const reading=readings[Number(sample.id)-1];if(reading)Object.assign(item,{title:reading[0],authors:reading[1],link:reading[2],journal:'External research reading · arXiv',level:'Advanced',excerpt:'An external paper for deeper study. Begin with the question and figures, then identify the assumptions and limitations. This is a reading recommendation, not a DSS publication.',body:'Read the original paper through the publication link below. Start with its research question, experimental setup and main figures.\n\nWrite down one finding, one assumption and one question you would ask the authors. Check the original paper for its full author list and citation details.\n\nIf the mathematics feels unfamiliar, return to the beginner learning path first.',fileUrl:''});
   }
   if(key==='resources'&&item.title===sample.title){Object.assign(item,{...lessons[Number(sample.id)-1],id:item.id});}
   if(key==='projects'&&item.title===sample.title){
    const names=['Study-hours explorer','Campus waste audit','Public transport comparison','Student budget visualiser'];
    Object.assign(item,{title:names[Number(sample.id)-1],type:'Practice project',stage:'Practice brief',level:'Beginner',desc:'A learning brief you can build yourself. No completed society project is claimed.',problem:'Choose a small question about '+names[Number(sample.id)-1].toLowerCase()+'. Use fictional or properly licensed data.',outcome:'One clear chart, a reproducible calculation, and a short explanation of limitations.',contributors:'Open practice brief',helpWanted:'Build your own version and submit it for feedback.',body:'Define the question before collecting data. Use a small fictional dataset to start. State the units and source. Check for missing values. Create a chart and explain one finding.\n\nFinish with a README describing your method, result and limitations. These are practice briefs, not records of completed DSS work.',link:'',fileUrl:''});
   }
   if(key==='blogs'&&(item.title===sample.title||item.title==='my'))Object.assign(item,{title:['Ask a better data question','Missing is not zero','What makes a chart useful','Keep personal data out of projects','A small project you can finish'][Number(sample.id)-1],tag:'STUDENT FIELD NOTES',author:'DSS learning notes',date:'',image:'',link:'',fileUrl:'',body:lessons[(Number(sample.id)-1)%lessons.length].body,excerpt:'A short practical note for students beginning their data-science journey.'});
  }
 }
 for(const lesson of lessons){let saved=content.collections.resources.find(r=>r.title===lesson.title||String(r.id)===lesson.id);if(!saved){saved=structuredClone(lesson);content.collections.resources.push(saved);}const step=content.collections.roadmap.find(r=>r.resourceId===lesson.id);if(step)step.resourceId=String(saved.id);}
 content.collections.navigation ||= [];
 if(!content.collections.navigation.some(n=>n.link==='start.html'))content.collections.navigation.splice(1,0,{id:'nav-start',title:'Start here',link:'start.html',requiresAuth:false});
 content.pageHeaders ||= {};
 content.pageHeaders.start ||= {title:'Your first step into data.',desc:'Five practical steps. No experience needed. Learn at your own pace.'};
 content.heroSection ||= {};
 if(['Find your place','Join the society','Join DSS','Start learning'].includes(content.heroSection.primaryCtaText)){content.heroSection.primaryCtaText='Start learning';content.heroSection.primaryCtaLink='start.html';}
 content.portal ||= {};
 Object.assign(content.portal,{...{gameHeading:'Can you spot the outlier?',gameDescription:'One point breaks the pattern. Choose it and discover why it matters.',taskHeading:'Your assigned work',taskDescription:'Daily responsibilities and event jobs appointed by the society team.',learningHeading:'Your next learning step',faqHeading:'Questions students ask'},...content.portal});
 content._studentExperienceVersion=1;
}
module.exports={improveContent};
