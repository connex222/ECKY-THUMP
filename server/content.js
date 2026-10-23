'use strict';
// Original, starter-only prototype material; requires editorial and legal review before sale.
const cardPrompts = {
  clean: [
    'The town council has unveiled a statue honouring _____.',
    'The secret ingredient in this award-winning soup is _____.',
    'Scientists have finally trained a robot to understand _____.',
    'My most regrettable impulse purchase was _____.',
    'The mayor insists the new tourist attraction is _____.',
    'A very confused wizard has accidentally summoned _____.',
    'The school replaced its sports day with _____.',
    'This year’s must-have kitchen gadget is _____.',
    'The museum’s most unpopular exhibition is called “_____”.',
    'The next big reality TV show is based entirely on _____.',
    'The ship’s captain said we could survive anything except _____.',
    'The office emergency plan has just one instruction: _____.',
    'The hotel promises every guest a complimentary _____.',
    'A famous detective’s only clue was _____.',
    'The village fête was cancelled because of _____.',
    'After years of research, archaeologists discovered _____.',
    'The world’s first entirely unnecessary theme park celebrates _____.',
    'The new national sport is competitive _____.',
    'The government’s plan to improve Mondays involves _____.',
    'The winner of the innovation award invented _____.',
  ],
  cheeky: [
    'A terrible first date became even worse when someone mentioned _____.',
    'The neighbours have complained about late-night _____.',
    'The politician’s secret expense claim listed _____.',
    'The spa charges an extra £50 for _____.',
    'The office party ended abruptly after _____.',
    'A dating profile should never mention _____.',
  ],
  adult: [
    'The hen party’s least sensible purchase was _____.',
    'A divorce lawyer advises clients to hide _____.',
    'The hotel minibar now stocks _____.',
    'The most scandalous item at the charity auction was _____.',
    'My midlife crisis began with _____.',
  ],
};
const witPrompts = {
  clean: [
    'Invent a slogan for a hotel that has completely given up.',
    'What would be the worst possible name for a royal yacht?',
    'Write the warning label for a suspiciously confident toaster.',
    'What headline would make the local paper instantly sell out?',
    'Name a perfume that should never have passed quality control.',
    'Write an apology from a supermarket to its shopping trolleys.',
    'Invent a terrible slogan for a space tourism company.',
    'What is the least reassuring thing a pilot could announce?',
    'What should a terrible motivational poster say?',
    'Invent the world’s most unnecessary app.',
    'Give a rejected name for a luxury cruise ship.',
    'What should the robot say just before it quits?',
    'Write a slogan for a theme park with no rides.',
    'Invent a ridiculous award someone could win at work.',
    'What is the worst password hint ever written?',
    'Write a tagline for a documentary about garden gnomes.',
    'What would a deeply unhelpful weather forecast say?',
    'Invent a terrible catchphrase for a superhero.',
    'What could a museum sign say that would terrify visitors?',
    'Name a brand-new holiday nobody asked for.',
  ],
  cheeky: [
    'Invent a dating app slogan that would send everyone running.',
    'Write a wildly inappropriate but harmless office award title.',
    'What would a disastrous best man say into the microphone?',
    'Invent a luxury product nobody should admit to owning.',
    'What is a deeply suspicious compliment from your boss?',
  ],
  adult: [
    'Invent a terrible slogan for a very discreet adult hotel.',
    'What would an absolutely disastrous speed-dating coach say?',
    'Write an awkwardly revealing message on a personalised cake.',
    'Invent the least romantic title for a steamy novel.',
    'What would be the worst pitch for an adults-only cruise?',
  ],
};
const cleanResponses = [
  'a deeply offended parking meter','a ceremonial traffic cone','three pigeons in a waistcoat','an emotionally exhausted teapot',
  'a suspiciously organised potato','the world’s least ambitious dragon','an extremely confident ferret','a trombone with unresolved issues',
  'a cheese sandwich with a five-year plan','a dramatic reading of the bus timetable','a tiny council of bewildered ducks',
  'the ghost of last Tuesday','a portable queue for one person','the ceremonial spoon of destiny','an apologetic foghorn',
  'a very expensive cardboard castle','a haunted office stapler','a committee of competitive snails','a surprise inspection by otters',
  'a thousand tiny paper crowns','the mayor’s emergency accordion','a badly trained motivational goose','an invisible pair of wellies',
  'a furious garden ornament','the national biscuit emergency','a suspiciously glamorous wheelie bin','a world championship in sighing',
  'a retired pirate with a spreadsheet','the great marmalade incident','a life-size statue of a typo','a queue that leads to another queue',
  'a goose with diplomatic immunity','a decorative emergency cucumber','the last remaining sensible umbrella',
  'an ancient prophecy about custard','an opera performed by lawnmowers','a surprisingly judgmental toaster',
  'the Ministry of Unnecessary Meetings','a lost sock’s autobiography','a robot trained only to shrug',
  'a luxury holiday inside a cupboard','a ceremonial high-five','a magnificent failure of planning',
  'the world’s smallest brass band','a tax return written in glitter','a nervous penguin in charge',
  'an emergency supply of tiny hats','a competitive knitting scandal','a handbag full of rubber ducks',
  'a very slow parade of wheelbarrows','the annual festival of almost','the sound of one confused kazoo',
  'a council-approved imaginary friend','an overqualified sandwich artist','a cucumber with political ambitions',
  'a dramatic misunderstanding about jam','a town hall made of waffles','an alarm clock with stage fright',
  'a detective who suspects the kettle','the last sensible person on the bus','a board meeting conducted by squirrels',
  'an unusually ambitious coat hanger','a glitter cannon with no off switch','a pensioner on a hoverboard',
  'a deeply average magic trick','a very polite volcanic eruption','a brass plaque commemorating nothing',
  'a carrot disguised as a lawyer','a suspicious parcel of marshmallows','a vacuum cleaner with a podcast',
  'the country’s official backup pigeon','a cardboard submarine of hope','the secret society of lost teaspoons',
  'a man dressed as a regional roundabout','a heroic attempt to fold a fitted sheet',
  'an avalanche of promotional keyrings','an award for turning up eventually','a council meeting held underwater',
  'an owl in a three-piece suit','an international shortage of commas','a surprisingly punctual tortoise',
  'a faulty machine that only says perhaps','a passport photograph of a pumpkin',
  'an elaborate plan involving one biscuit','a banjo duel at sunrise','a cardboard cut-out of the deputy mayor',
  'a traffic warden on a unicycle','an exceptionally loud library whisper',
  'a kettle that demands a promotion','a trophy for best use of a staircase',
  'the magnificent pigeon of bureaucracy','a formal complaint from the moon',
  'a sandwich wearing a tiny monocle','a haunted customer feedback form',
  'an unlicensed parade of garden chairs','a local legend about a missing spork',
  'a miniature rollercoaster for carrots','the royal ceremonial rubber stamp',
  'a very serious investigation into toast','an embarrassing quantity of novelty mugs',
  'a mildly enchanted parking ticket','the world’s first indoor rain festival',
  'a confetti cannon stuck on repeat','an exhausted marching band of two',
  'a badly timed victory dance','a mysterious cupboard full of hats',
];
const responses = {
  clean: cleanResponses,
  cheeky: [
    'an aggressively awkward office flirt','an accidentally public love letter',
    'the world’s worst chat-up line','a very revealing karaoke performance',
    'an unfortunate wardrobe misunderstanding','the suspiciously enthusiastic stag party',
    'a dating profile written by your mum','an accountant with a secret nightclub',
    'an extremely embarrassing tattoo','a disastrous couples yoga class',
    'the afterparty nobody will discuss','a romantic meal in a motorway lay-by',
  ],
  adult: [
    'a terrible decision after midnight','an extremely indiscreet honeymoon suite',
    'a painfully honest dating history','a scandalous purchase with no receipt',
    'a spectacularly failed attempt at seduction','an adults-only bingo catastrophe',
    'the morning after a questionable hen party','a completely inappropriate anniversary present',
    'a relationship counsellor with a hangover','a very unfortunate bedroom nickname',
  ],
};
const contextPrompts={
  clean:[
    'Write something completely innocent you could say at breakfast.',
    'Write an ordinary message you might send to a neighbour.',
    'Write an unremarkable sentence from a work meeting.',
    'Write a harmless sentence about your weekend.',
    'Write an everyday message from a family group chat.',
    'Write something mundane you might tell the delivery driver.'
  ],
  cheeky:[
    'Write an innocent message you could send after a terrible first date.',
    'Write a completely ordinary text that might appear in a group chat.'
  ],
  adult:[
    'Write a surprisingly innocent message someone could send after a wild night out.',
    'Write a harmless message you might send after a disastrous party.'
  ]
};
const doublePrompts={
  clean:[
    'Sell a hopeless product in one irresistible advert.',
    'Create a television advert nobody could possibly approve.',
    'Pitch the worst luxury upgrade ever invented.',
    'Invent a public-service announcement that makes everything worse.'
  ],
  cheeky:[
    'Pitch an embarrassingly inappropriate office perk.',
    'Create an advert for a truly awful dating service.'
  ],
  adult:[
    'Sell the worst possible adults-only holiday experience.',
    'Advertise a very suspicious romantic service.'
  ]
};
const finalPrompts={
  clean:[
    'You have ten seconds on live television to explain why you should rule the world. What do you say?',
    'Deliver the worst possible acceptance speech for an award you absolutely did not deserve.',
    'You are caught red-handed at a ridiculous crime scene. Give your final excuse.',
    'The entire nation is listening. Announce the most absurd new law you can imagine.',
    'You have been made prime minister of nonsense. Give your opening statement.'
  ],
  cheeky:[
    'Your disastrous dating life is now a reality show. Announce its opening line.',
    'Give the most catastrophically inappropriate best-man toast possible.'
  ],
  adult:[
    'You must explain the previous night on live television without revealing any names.',
    'Your scandalous autobiography is out tomorrow. What is its first sentence?'
  ]
};
const seedFallbacks=[
  'I should have been there at nine.', 'That is not what I ordered.',
  'We need to talk about the garden.', 'It was fine until Tuesday.',
  'Please put it back where you found it.', 'I thought everybody knew already.',
  'I have checked the cupboard twice.', 'It really looked bigger online.',
  'The neighbours have noticed.', 'I can explain the missing biscuits.',
  'I thought the invitation was optional.', 'I may have pressed the wrong button.'
];
const contract = 'Make your answer sound like an official government announcement.';
function getPool(source, rating) {
  const tiers = ['clean', ...(rating === 'cheeky' || rating === 'adult' ? ['cheeky'] : []), ...(rating === 'adult' ? ['adult'] : [])];
  return tiers.flatMap(t => source[t]);
}
// Curated editorial draft: 1,200 ORIGINAL additions, grouped by challenge and rating.
// All text is stored locally. No scraped or third-party licensed card decks.
const expansion=require('./packs/after-dark-v09.json');
// User-approved replacements and additions; the old pack remains immutable for audit.
const approvedPack=require('./packs/social-club-approved-v1.json');
const premiumOnly=/^(?:1|true)$/i.test(process.env.PREMIUM_CONTENT_ONLY||'');
const finalWords={clean:['custard','pigeon','marmalade','banjo','wombat','toaster','rubber duck','traffic cone'],cheeky:[],adult:[]};
const contracts={clean:[contract],cheeky:[],adult:[]};
const buckets={cardPrompts,witPrompts,contextPrompts,doublePrompts,finalPrompts,responses,finalWords,contracts};
const approvedIds=new Set();
const approvedText=new Set();
for (const item of approvedPack.entries) {
  const pool=buckets[item.kind];
  if (!pool || !pool[item.rating] || !item.id || item.editorialStatus!=='approved')
    throw Error('Approved card has invalid schema/status: '+item.id);
  if (approvedIds.has(item.id)) throw Error('Repeated approved ID '+item.id);
  approvedIds.add(item.id);
  const text=item.text;
  if (typeof text!=='string' || !text.trim() || text!==text.trim()) throw Error('Empty/invalid approved text '+item.id);
  if (item.kind==='responses' && (text.length>45 || text.includes(':'))) throw Error('Overlong response/colon '+item.id);
  if (item.kind==='cardPrompts' && (text.length>90 || (text.match(/_____/g)||[]).length!==1))
    throw Error('Prompt must have exactly one blank '+item.id);
  const normal=text.toLocaleLowerCase('en-GB').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  if (approvedText.has(normal)) throw Error('Duplicate approved card text '+item.id);
  approvedText.add(normal);
}
for (const item of expansion.entries) {
  const pool=buckets[item.kind];
  if (!pool || !pool[item.rating] || !item.text || !item.id) throw Error('Invalid expansion content '+item.id);
  // Preserve the existing v1 pack, but never deal a superseded or unapproved
  // expansion entry when the approved-only content switch is enabled.
  if (premiumOnly || approvedIds.has(item.id)) continue;
  pool[item.rating].push(item.text);
}
for (const item of approvedPack.entries) buckets[item.kind][item.rating].push(item.text);
module.exports = { cardPrompts, witPrompts, contextPrompts, doublePrompts, finalPrompts, seedFallbacks, responses, finalWords, contracts, expansion, approvedPack, contract, getPool };
