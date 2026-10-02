'use strict';
const defaults={
 studentTitle:'Learning dashboard',studentHeading:'What will you learn today?',studentDescription:'Your space to learn, build and connect with students across Pakistan.',
 memberTitle:'Society workspace',memberHeading:'Make your next contribution.',memberDescription:'Work with the society, share your ideas and follow opportunities.',
 cabinetTitle:'Cabinet workspace',cabinetHeading:'Lead your team with clarity.',cabinetDescription:'Follow society updates, contribute to programmes and keep your team moving.',
 ambassadorTitle:'Campus workspace',ambassadorHeading:'Bring your campus together.',ambassadorDescription:'Lead your campus. Share opportunities. Help your community grow.',
 studentLibraryEnabled:true,studentEventsEnabled:true,memberLibraryEnabled:true,memberEventsEnabled:true,memberContributionsEnabled:true,
 cabinetLibraryEnabled:true,cabinetEventsEnabled:true,cabinetContributionsEnabled:true,ambassadorLibraryEnabled:true,ambassadorEventsEnabled:true,ambassadorContributionsEnabled:true,ambassadorActivitiesEnabled:true
};
function adminLink(value){try{return /^\/(?:admin(?:\.html|\/|-login\.html)?|build(?:\.html|\/)?)$/i.test(new URL(String(value),'https://dss.local/').pathname);}catch{return false;}}
function normalizeContent(content){
 content.portal={...defaults,...content.portal};
 if(content.collections?.navigation)content.collections.navigation=content.collections.navigation.filter(item=>!adminLink(item.link));
 return content;
}
module.exports={defaults,adminLink,normalizeContent};
