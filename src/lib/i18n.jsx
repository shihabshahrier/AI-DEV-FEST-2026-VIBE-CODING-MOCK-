import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const en = {
  'app.title': 'Smart Escape',
  'app.tagline': 'Evacuation Route Simulator',
  'app.disclaimer': 'Educational simulation — not a certified real-world evacuation planning tool.',

  'header.import': 'Import JSON',
  'header.sample': 'Load sample',
  'header.live': 'Live sim',
  'header.lang': 'Language',

  'empty.kicker': 'Interactive evacuation routing',
  'empty.title': 'Find the safest way out.',
  'empty.subtitle':
    'Import a building map to compute the lowest-cost route to an open exit. Add hazards and watch the route recalculate instantly.',
  'empty.drop': 'Drop building.json here or click to browse',
  'empty.trySample': 'Try the sample building',
  'empty.format': 'Expected fields: building, nodes[], edges[], initial_state',
  'empty.step1': 'Import a building map',
  'empty.step2': 'Pick a starting location',
  'empty.step3': 'Toggle hazards — route updates live',

  'mode.label': 'Click mode',
  'mode.start': 'Set start',
  'mode.hazard': 'Toggle hazard',
  'mode.hintStart': 'Click a room or junction to start there.',
  'mode.hintHazard': 'Click a room or junction to block it, an exit to close it, or a corridor to block it.',

  'status.idle': 'Select a starting location',
  'status.idleHint': 'Pick a room or junction on the map or from the list below.',
  'status.ok': 'Route found',
  'status.noRoute': 'No route available',
  'status.noRouteHint': 'No open exit can be reached from this start. Remove a hazard or reopen an exit.',
  'status.startBlocked': 'Starting location blocked',
  'status.startBlockedHint': 'Unblock this location or choose another start.',

  'route.evacuateVia': 'Evacuate via',
  'route.cost': 'Total cost',
  'route.path': 'Route',
  'route.steps': 'Step-by-step',
  'route.stepsCount': '{n} corridors',
  'route.rerouted': 'Rerouted',
  'route.alternatives': 'Other reachable exits',
  'route.noAlternatives': 'No other exit is reachable.',
  'route.start': 'Start',

  'panel.start': 'Starting location',
  'panel.startPlaceholder': 'Choose a room or junction',
  'panel.hazards': 'Hazards',
  'panel.activeHazards': '{n} active',
  'panel.nodes': 'Rooms & junctions',
  'panel.corridors': 'Corridors',
  'panel.exits': 'Exits',
  'panel.reset': 'Reset to initial state',

  'state.open': 'Open',
  'state.blocked': 'Blocked',
  'state.closed': 'Closed',

  'action.block': 'Block',
  'action.unblock': 'Unblock',
  'action.close': 'Close',
  'action.reopen': 'Reopen',

  'type.room': 'Room',
  'type.junction': 'Junction',
  'type.exit': 'Exit',

  'legend.title': 'Legend',
  'legend.room': 'Room',
  'legend.junction': 'Junction',
  'legend.exit': 'Exit',
  'legend.start': 'Start',
  'legend.route': 'Route',
  'legend.blocked': 'Blocked',
  'legend.closed': 'Closed exit',
  'legend.unusable': 'Unusable corridor',

  'map.youAreHere': 'You are here',
  'map.costFromStart': 'Cost from start',
  'map.unreachable': 'Unreachable',

  'msg.exitNotStart': 'An exit cannot be a starting location.',
  'msg.blockedNotStart': 'This location is blocked — unblock it first.',
  'msg.loaded': 'Loaded “{name}”',
  'msg.reset': 'Hazards restored to the initial state.',

  'err.title': 'Could not import this file',
  'err.read': 'The file could not be read.',
  'err.json': 'The file is not valid JSON.',
  'err.root': 'The top level must be a JSON object.',
  'err.building': '“building” must be a non-empty string.',
  'err.nodesArray': '“nodes” must be an array.',
  'err.nodesCount': 'Need 2–60 nodes (found {n}).',
  'err.edgesArray': '“edges” must be an array.',
  'err.edgesCount': 'Need 1–150 edges (found {n}).',
  'err.nodeObj': 'nodes[{i}] must be an object.',
  'err.nodeId': 'nodes[{i}].id must be a non-empty string.',
  'err.nodeDupId': 'Duplicate node id “{id}”.',
  'err.nodeLabel': 'Node “{id}” needs a non-empty label.',
  'err.nodeType': 'Node “{id}” has invalid type “{type}” (use room, junction or exit).',
  'err.nodeCoord': 'Node “{id}” needs numeric x and y.',
  'err.needRoom': 'Need at least one room or junction.',
  'err.needExit': 'Need at least one exit.',
  'err.edgeObj': 'edges[{i}] must be an object.',
  'err.edgeId': 'edges[{i}].id must be a non-empty string.',
  'err.edgeDupId': 'Duplicate edge id “{id}”.',
  'err.edgeEndpoint': 'Edge “{id}” refers to unknown node “{node}”.',
  'err.edgeSelf': 'Edge “{id}” connects a node to itself.',
  'err.edgeDupPair': 'Edge “{id}” repeats the node pair {a}–{b}.',
  'err.edgeCost': 'Edge “{id}” cost must be a positive integer.',
  'err.state': '“initial_state” must be an object.',
  'err.stateArray': 'initial_state.{field} must be an array.',
  'err.stateUnknown': 'initial_state.{field} contains unknown id “{id}”.',
  'err.stateKind': 'initial_state.{field}: “{id}” is a {type} and is not allowed here.',
  'err.more': '…and {n} more',
  'err.dismiss': 'Dismiss',
}

const bn = {
  'app.title': 'স্মার্ট এস্কেপ',
  'app.tagline': 'জরুরি নির্গমন পথ সিমুলেটর',
  'app.disclaimer': 'শিক্ষামূলক সিমুলেশন — বাস্তব জরুরি নির্গমন পরিকল্পনার জন্য প্রত্যয়িত টুল নয়।',

  'header.import': 'JSON ইমপোর্ট',
  'header.sample': 'নমুনা লোড',
  'header.live': 'লাইভ সিম',
  'header.lang': 'ভাষা',

  'empty.kicker': 'ইন্টারঅ্যাকটিভ নির্গমন পথ নির্ণয়',
  'empty.title': 'বের হওয়ার নিরাপদ পথ খুঁজুন।',
  'empty.subtitle':
    'ভবনের মানচিত্র ইমপোর্ট করুন, খোলা নির্গমন পথে যাওয়ার সর্বনিম্ন খরচের পথ বের করুন। বিপদ যোগ করুন — পথ সঙ্গে সঙ্গে নতুন করে হিসাব হবে।',
  'empty.drop': 'building.json এখানে ছেড়ে দিন বা ক্লিক করে বেছে নিন',
  'empty.trySample': 'নমুনা ভবন দেখুন',
  'empty.format': 'প্রয়োজনীয় ফিল্ড: building, nodes[], edges[], initial_state',
  'empty.step1': 'ভবনের মানচিত্র ইমপোর্ট করুন',
  'empty.step2': 'শুরুর অবস্থান বেছে নিন',
  'empty.step3': 'বিপদ চালু/বন্ধ করুন — পথ সাথে সাথে বদলাবে',

  'mode.label': 'ক্লিক মোড',
  'mode.start': 'শুরু নির্বাচন',
  'mode.hazard': 'বিপদ চালু/বন্ধ',
  'mode.hintStart': 'শুরু করতে একটি কক্ষ বা জংশনে ক্লিক করুন।',
  'mode.hintHazard': 'কক্ষ/জংশনে ক্লিক করলে অবরুদ্ধ হবে, নির্গমনে ক্লিক করলে বন্ধ হবে, করিডোরে ক্লিক করলে অবরুদ্ধ হবে।',

  'status.idle': 'শুরুর অবস্থান নির্বাচন করুন',
  'status.idleHint': 'মানচিত্র বা নিচের তালিকা থেকে একটি কক্ষ বা জংশন বেছে নিন।',
  'status.ok': 'পথ পাওয়া গেছে',
  'status.noRoute': 'কোনো পথ পাওয়া যায়নি',
  'status.noRouteHint': 'এই অবস্থান থেকে কোনো খোলা নির্গমনে পৌঁছানো যাচ্ছে না। কোনো বিপদ সরান বা নির্গমন আবার খুলুন।',
  'status.startBlocked': 'শুরুর অবস্থান অবরুদ্ধ',
  'status.startBlockedHint': 'অবস্থানটির অবরোধ তুলুন বা অন্য শুরুর অবস্থান বেছে নিন।',

  'route.evacuateVia': 'বের হওয়ার পথ',
  'route.cost': 'মোট খরচ',
  'route.path': 'পথ',
  'route.steps': 'ধাপে ধাপে',
  'route.stepsCount': '{n}টি করিডোর',
  'route.rerouted': 'পথ পরিবর্তিত',
  'route.alternatives': 'অন্যান্য পৌঁছানোযোগ্য নির্গমন',
  'route.noAlternatives': 'অন্য কোনো নির্গমনে পৌঁছানো যায় না।',
  'route.start': 'শুরু',

  'panel.start': 'শুরুর অবস্থান',
  'panel.startPlaceholder': 'একটি কক্ষ বা জংশন বেছে নিন',
  'panel.hazards': 'বিপদসমূহ',
  'panel.activeHazards': '{n}টি সক্রিয়',
  'panel.nodes': 'কক্ষ ও জংশন',
  'panel.corridors': 'করিডোর',
  'panel.exits': 'নির্গমন পথ',
  'panel.reset': 'প্রাথমিক অবস্থায় ফেরান',

  'state.open': 'খোলা',
  'state.blocked': 'অবরুদ্ধ',
  'state.closed': 'বন্ধ',

  'action.block': 'অবরুদ্ধ করুন',
  'action.unblock': 'অবরোধ তুলুন',
  'action.close': 'বন্ধ করুন',
  'action.reopen': 'আবার খুলুন',

  'type.room': 'কক্ষ',
  'type.junction': 'জংশন',
  'type.exit': 'নির্গমন',

  'legend.title': 'নির্দেশিকা',
  'legend.room': 'কক্ষ',
  'legend.junction': 'জংশন',
  'legend.exit': 'নির্গমন',
  'legend.start': 'শুরু',
  'legend.route': 'পথ',
  'legend.blocked': 'অবরুদ্ধ',
  'legend.closed': 'বন্ধ নির্গমন',
  'legend.unusable': 'ব্যবহার অযোগ্য করিডোর',

  'map.youAreHere': 'আপনি এখানে',
  'map.costFromStart': 'শুরু থেকে খরচ',
  'map.unreachable': 'পৌঁছানো যায় না',

  'msg.exitNotStart': 'নির্গমন পথ শুরুর অবস্থান হতে পারে না।',
  'msg.blockedNotStart': 'এই অবস্থানটি অবরুদ্ধ — আগে অবরোধ তুলুন।',
  'msg.loaded': '“{name}” লোড হয়েছে',
  'msg.reset': 'বিপদসমূহ প্রাথমিক অবস্থায় ফেরানো হয়েছে।',

  'err.title': 'ফাইলটি ইমপোর্ট করা যায়নি',
  'err.read': 'ফাইলটি পড়া যায়নি।',
  'err.json': 'ফাইলটি বৈধ JSON নয়।',
  'err.root': 'শীর্ষ স্তর অবশ্যই একটি JSON অবজেক্ট হতে হবে।',
  'err.building': '“building” অবশ্যই খালি নয় এমন টেক্সট হতে হবে।',
  'err.nodesArray': '“nodes” অবশ্যই একটি অ্যারে হতে হবে।',
  'err.nodesCount': '২–৬০টি নোড প্রয়োজন (পাওয়া গেছে {n}টি)।',
  'err.edgesArray': '“edges” অবশ্যই একটি অ্যারে হতে হবে।',
  'err.edgesCount': '১–১৫০টি করিডোর প্রয়োজন (পাওয়া গেছে {n}টি)।',
  'err.nodeObj': 'nodes[{i}] অবশ্যই একটি অবজেক্ট হতে হবে।',
  'err.nodeId': 'nodes[{i}].id অবশ্যই খালি নয় এমন টেক্সট হতে হবে।',
  'err.nodeDupId': 'নোড আইডি “{id}” একাধিকবার আছে।',
  'err.nodeLabel': 'নোড “{id}”-এর একটি লেবেল প্রয়োজন।',
  'err.nodeType': 'নোড “{id}”-এর ধরন “{type}” সঠিক নয় (room, junction বা exit ব্যবহার করুন)।',
  'err.nodeCoord': 'নোড “{id}”-এর x ও y সংখ্যা হতে হবে।',
  'err.needRoom': 'অন্তত একটি কক্ষ বা জংশন প্রয়োজন।',
  'err.needExit': 'অন্তত একটি নির্গমন পথ প্রয়োজন।',
  'err.edgeObj': 'edges[{i}] অবশ্যই একটি অবজেক্ট হতে হবে।',
  'err.edgeId': 'edges[{i}].id অবশ্যই খালি নয় এমন টেক্সট হতে হবে।',
  'err.edgeDupId': 'করিডোর আইডি “{id}” একাধিকবার আছে।',
  'err.edgeEndpoint': 'করিডোর “{id}” অজানা নোড “{node}” উল্লেখ করেছে।',
  'err.edgeSelf': 'করিডোর “{id}” একটি নোডকে নিজের সাথেই যুক্ত করেছে।',
  'err.edgeDupPair': 'করিডোর “{id}” একই নোড জোড়া {a}–{b} পুনরাবৃত্তি করেছে।',
  'err.edgeCost': 'করিডোর “{id}”-এর খরচ অবশ্যই ধনাত্মক পূর্ণসংখ্যা হতে হবে।',
  'err.state': '“initial_state” অবশ্যই একটি অবজেক্ট হতে হবে।',
  'err.stateArray': 'initial_state.{field} অবশ্যই একটি অ্যারে হতে হবে।',
  'err.stateUnknown': 'initial_state.{field}-এ অজানা আইডি “{id}” আছে।',
  'err.stateKind': 'initial_state.{field}: “{id}” একটি {type}, এখানে অনুমোদিত নয়।',
  'err.more': '…এবং আরও {n}টি',
  'err.dismiss': 'বন্ধ করুন',
}

const DICT = { en, bn }
const STORAGE_KEY = 'smart-escape.lang'

const I18nContext = createContext(null)

function readLang() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'bn' ? 'bn' : 'en'
  } catch {
    return 'en'
  }
}

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(readLang)

  useEffect(() => {
    document.documentElement.lang = lang
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      /* storage unavailable */
    }
  }, [lang])

  const value = useMemo(() => {
    // Bangla mode shows Bangla digits (৭, ১১); ids and labels stay as in the dataset.
    const num = (n) => (lang === 'bn' ? Number(n).toLocaleString('bn-BD') : String(n))
    const t = (key, params) => {
      const template = DICT[lang][key] ?? en[key] ?? key
      if (!params) return template
      return template.replace(/\{(\w+)\}/g, (match, name) => {
        if (!(name in params)) return match
        const v = params[name]
        if (typeof v === 'number') return num(v)
        if (name === 'type' && DICT[lang][`type.${v}`]) return DICT[lang][`type.${v}`]
        return String(v)
      })
    }
    return { lang, setLang, t, num }
  }, [lang])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>')
  return ctx
}
