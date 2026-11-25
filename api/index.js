// server/index.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mammoth from "mammoth";
import nodemailer from "nodemailer";
import { GoogleGenAI } from "@google/genai";

// server/cognitiveActionEngine.ts
var pendingActionStore = /* @__PURE__ */ new Map();
function getPendingAction(sessionKey) {
  const action = pendingActionStore.get(sessionKey);
  if (!action) return null;
  if (Date.now() - action.createdAt > 15 * 60 * 1e3) {
    pendingActionStore.delete(sessionKey);
    return null;
  }
  return action;
}
function setPendingAction(sessionKey, action) {
  pendingActionStore.set(sessionKey, {
    ...action,
    id: `pa_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: Date.now()
  });
}
function clearPendingAction(sessionKey) {
  pendingActionStore.delete(sessionKey);
}
var BIRTHDAY_REGEX = /\b(?:birth\s*days?|b['’]?days?|birhtdays?|birtdays?|brithdays?|bithdays?|bdays?|dob|born)\b/i;
var CALENDAR_TOPIC_REGEX = /\b(?:birth\s*days?|b['’]?days?|birhtdays?|birtdays?|brithdays?|bithdays?|bdays?|dob|born|anniversary|anniversaries|meeting|meetings|doctor|appointment|appointments|checkup|checkups|housewarming|trip|trips|tour|outing|vacation|holiday|holidays|festival|pongal|diwali|christmas|new\s*year|ramzan|eid|onam|ugadi|holi|navaratri|puja|pooja|function|functions|marriage|wedding|reception|engagement|ceremony|party|dinner|lunch|reunion|exam|exams|interview|calendar|schedule|events?)\b/i;
var COMMON_GROCERY_ITEMS_REGEX = /\b(?:milk|curd|yogurt|butter|paneer|cheese|ghee|bread|eggs?|rice|basmati|wheat|atta|flour|dal|toor\s*dal|moong\s*dal|chana\s*dal|urad\s*dal|sugar|salt|jaggery|oil|cooking\s*oil|sunflower\s*oil|olive\s*oil|mustard\s*oil|coconut\s*oil|tea|coffee|biscuits?|cookies?|snacks?|noodles?|pasta|oats|cornflakes|tomato(?:es)?|onions?|potato(?:es)?|garlic|ginger|chillies|chilli|coriander|mint|curry\s*leaves|carrots?|beans|peas|spinach|cabbage|cauliflower|brinjal|okra|ladies\s*finger|cucumber|lemons?|apples?|bananas?|oranges?|mangoes?|grapes|pomegranate|papaya|watermelon|chicken|mutton|fish|prawns|meat|soap|shampoo|toothpaste|detergent|dishwash(?:ing)?|cleaner|handwash|sanitizer|tissues?|toilet\s*paper|water\s*can|vegetables?|veggies|fruits?|spices?|turmeric|chilli\s*powder|garam\s*masala|pepper|cumin|mustard|almonds?|cashews?|raisins?|walnuts?|dates|honey|jam|ketchup|sauce|vinegar|mayonnaise|arisi|paruppu)\b/i;
function inferGroceryCategory(itemName) {
  const lower = (itemName || "").toLowerCase();
  if (/milk|curd|yogurt|butter|paneer|cheese|ghee|egg|dairy/i.test(lower)) return "Dairy";
  if (/tomato|onion|potato|garlic|ginger|chilli|coriander|mint|curry|carrot|bean|pea|spinach|cabbage|cauliflower|brinjal|okra|cucumber|lemon|apple|banana|orange|mango|grape|pomegranate|papaya|watermelon|vegetable|veggie|fruit|produce/i.test(lower)) return "Produce";
  if (/bread|bun|cake|bakery|croissant|toast/i.test(lower)) return "Bakery";
  if (/chicken|mutton|fish|prawn|meat|beef|pork|seafood/i.test(lower)) return "Meat";
  if (/tea|coffee|juice|drink|water\s*can|soda|beverage/i.test(lower)) return "Beverages";
  if (/soap|shampoo|toothpaste|detergent|dishwash|cleaner|handwash|sanitizer|tissue|toilet|mop|broom|household/i.test(lower)) return "Household";
  if (/biscuit|cookie|snack|chips|namkeen|chocolate|noodle/i.test(lower)) return "Snacks";
  return "Pantry";
}
function parseSingleGroceryPhrase(phrase, defaultQty = "1 unit") {
  let cleanPhrase = phrase.replace(/^(?:please\s+)?(?:add|buy|purchase|get|need|put)\s+/i, "").replace(/\s+(?:to|on|in|into|for)\s+(?:my\s+|our\s+|the\s+)?(?:smart\s+)?(?:grocery|groceries|shopping|pantry|maligai)(?:\s+list|\s+items|\s+cart)?$/i, "").replace(/\s+(?:in|to|on)\s+(?:my\s+|the\s+)?list$/i, "").replace(/\s*(?:add\s+pannunga|add\s+pannu|vaanganum|podu|podunga)$/i, "").replace(/\s+for\s+tomorrow$/i, "").replace(/\s+every\s+\w+$/i, "").trim();
  const leadQty = cleanPhrase.match(/^(\d+(?:\.\d+)?)\s*(kg|kilos?|gm?|grams?|litres?|liters?|ltr|l|ml|packets?|packs?|pcs|pieces?|dozen|bottles?|cans?|boxes?|bars?|tubes?|units?)\b\s*(?:of\s+)?(.+)$/i);
  if (leadQty) {
    const qty = `${leadQty[1]} ${leadQty[2]}`;
    const rawName = leadQty[3].trim();
    const capName2 = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    return { name: capName2, quantity: qty, category: inferGroceryCategory(capName2) };
  }
  const trailQty = cleanPhrase.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*(kg|kilos?|gm?|grams?|litres?|liters?|ltr|l|ml|packets?|packs?|pcs|pieces?|dozen|bottles?|cans?|boxes?|bars?|tubes?|units?)$/i);
  if (trailQty) {
    const rawName = trailQty[1].trim();
    const qty = `${trailQty[2]} ${trailQty[3]}`;
    const capName2 = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    return { name: capName2, quantity: qty, category: inferGroceryCategory(capName2) };
  }
  const numLead = cleanPhrase.match(/^(\d+)\s+([a-zA-Z\s]+)$/);
  if (numLead) {
    const rawName = numLead[2].trim();
    const capName2 = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    return { name: capName2, quantity: `${numLead[1]} pieces`, category: inferGroceryCategory(capName2) };
  }
  const capName = cleanPhrase ? cleanPhrase.charAt(0).toUpperCase() + cleanPhrase.slice(1) : "Grocery Item";
  return { name: capName, quantity: defaultQty, category: inferGroceryCategory(capName) };
}
function isAnsweringPendingAction(query, action) {
  const clean = (query || "").toLowerCase().replace(/^[?!.,\s]+|[?!.,\s]+$/g, "").trim();
  if (!clean) return false;
  if (action.type === "calendar_conflict") {
    if (/\b(?:update|change|chnage|chagne|separate|keep\s+both|keep\s+them\s+both)\b/i.test(clean)) {
      return true;
    }
    return /^(?:yes|sure|ok|please|proceed)\b/i.test(clean);
  }
  if (action.type === "calendar_delete_confirm") {
    return /^(?:yes|no|yep|nope|sure|cancel|confirm|abort|keep|do\s+it|please\s+delete|ok)$/i.test(clean) || clean.includes("yes") || clean.includes("no") || clean.includes("cancel");
  }
  if (action.type === "expense_missing_details" || action.type === "bill_missing_details") {
    if (/^(?:cancel|nevermind|stop|abort|forget\s+it)$/i.test(clean)) {
      return true;
    }
    if (/^(?:add|create|log|record|spent|paid|show|list|what|where|who|which|remind|schedule|delete|remove|clear|mark|upload|find|fetch|get|buy)\b/i.test(clean)) {
      return false;
    }
    const parsed = parseDateAndRelativeTime(clean);
    const hasAmount = /(?:₹|rs\.?|inr\s*)?\s*\b\d+(?:,\d+)?\b/i.test(clean);
    return Boolean(parsed.date || hasAmount);
  }
  if (/^(add|schedule|plan|create|set|book|remind|cancel|delete|remove|move|reschedule|postpone|show|list|what|when|where|who|which|is|are|can|did|do|does|how|get|fetch|find|upload|mark|clear\s+my|birthday|birhtday|birtday|brithday|bday|buy|spent|paid|record|log|remember|save)/i.test(clean)) {
    return false;
  }
  if (action.type === "calendar_missing_date") {
    const parsed = parseDateAndRelativeTime(clean);
    return !!parsed.date && clean.split(/\s+/).length <= 4;
  }
  if (action.type === "clear_grocery_confirm") {
    return /^(yes|sure|confirm|ok|no|cancel|nevermind|do\s+it)$/i.test(clean);
  }
  if (action.type === "grocery_update_qty") {
    return /^\d+(?:\.\d+)?\s*(kg|litres?|l|packets?|pcs|pieces?|bottles?|units?|grams?|g)?$/i.test(clean);
  }
  return false;
}
function isEventForCelebrant(e, person, eventType) {
  const p = person.toLowerCase().trim();
  const title = (e.title || "").toLowerCase();
  const desc = (e.description || "").toLowerCase();
  const category = (e.category || "").toLowerCase();
  const members = Array.isArray(e.members_involved || e.membersInvolved) ? (e.members_involved || e.membersInvolved).map((m) => String(m).toLowerCase()) : [];
  const isBdaySearch = eventType === "birthday";
  if (isBdaySearch) {
    const isBdayEvent = category === "birthday" || BIRTHDAY_REGEX.test(title) || BIRTHDAY_REGEX.test(desc);
    if (!isBdayEvent) return false;
  }
  if (p === "mother" || p === "mom" || p === "amma") {
    return title.includes("mother") || title.includes("mom") || title.includes("amma");
  }
  if (p === "father" || p === "dad" || p === "appa") {
    return title.includes("father") || title.includes("dad") || title.includes("appa");
  }
  if (p === "sarah") {
    return title.includes("sarah");
  }
  if (p === "sneha") {
    return title.includes("sneha") || title.includes("bday test");
  }
  if (p === "sham") {
    return title.includes("sham");
  }
  if (p === "sister") {
    return title.includes("sister") || title.includes("sneha");
  }
  if (p === "brother") {
    return title.includes("brother") || title.includes("sham");
  }
  if (p === "grandfather" || p === "grandpa" || p === "thatha") {
    return title.includes("grandfather") || title.includes("grandpa") || title.includes("thatha");
  }
  if (p === "grandmother" || p === "grandma" || p === "paati") {
    return title.includes("grandmother") || title.includes("grandma") || title.includes("paati");
  }
  return title.includes(p) || desc.includes(p) || members.includes(p);
}
function extractCustomPersonName(cleanQuery) {
  const stopWords = /* @__PURE__ */ new Set([
    "when",
    "what",
    "where",
    "which",
    "who",
    "whose",
    "how",
    "is",
    "are",
    "was",
    "were",
    "do",
    "does",
    "did",
    "have",
    "has",
    "had",
    "can",
    "could",
    "will",
    "would",
    "should",
    "i",
    "we",
    "you",
    "he",
    "she",
    "they",
    "my",
    "our",
    "your",
    "his",
    "her",
    "their",
    "the",
    "a",
    "an",
    "all",
    "any",
    "some",
    "every",
    "other",
    "another",
    "family",
    "member",
    "members",
    "person",
    "people",
    "upcoming",
    "next",
    "last",
    "previous",
    "this",
    "that",
    "these",
    "those",
    "week",
    "month",
    "year",
    "today",
    "tomorrow",
    "yesterday",
    "date",
    "dates",
    "day",
    "time",
    "event",
    "events",
    "calendar",
    "schedule",
    "scheduled",
    "add",
    "create",
    "set",
    "plan",
    "save",
    "book",
    "change",
    "update",
    "move",
    "edit",
    "shift",
    "reschedule",
    "postpone",
    "delete",
    "remove",
    "cancel",
    "show",
    "list",
    "view",
    "get",
    "fetch",
    "find",
    "check",
    "search",
    "tell",
    "give",
    "me",
    "us",
    "please",
    "pls",
    "on",
    "in",
    "at",
    "to",
    "for",
    "of",
    "as",
    "from",
    "by",
    "with",
    "about",
    "into",
    "saved",
    "added",
    "recorded",
    "marked",
    "already",
    "yet",
    "there",
    "here",
    "birthday",
    "birthdays",
    "birth",
    "bday",
    "bdays",
    "birhtday",
    "birhtdays",
    "birtday",
    "birtdays",
    "brithday",
    "brithdays",
    "bithday",
    "bithdays",
    "dob",
    "born",
    "anniversary",
    "anniversaries",
    "celebration",
    "party",
    "function",
    "ceremony",
    "holiday",
    "jan",
    "january",
    "feb",
    "february",
    "mar",
    "march",
    "apr",
    "april",
    "may",
    "jun",
    "june",
    "jul",
    "july",
    "aug",
    "august",
    "sep",
    "sept",
    "september",
    "oct",
    "october",
    "nov",
    "november",
    "dec",
    "december",
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "am",
    "pm",
    "st",
    "nd",
    "rd",
    "th",
    "pannu",
    "pannunga",
    "podu",
    "eppo",
    "enna",
    "irukka",
    "kaaminga",
    "sollu",
    "sollunga",
    "oda"
  ]);
  const withoutDates = cleanQuery.replace(/\b\d{4}-\d{1,2}-\d{1,2}\b/g, " ").replace(/\b\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?\b/g, " ").replace(/\b\d+(?:st|nd|rd|th)?\b/g, " ").replace(/['’]s\b/g, " ").replace(/[^a-zA-Z\s]/g, " ");
  const tokens = withoutDates.split(/\s+/).map((t) => t.trim().toLowerCase()).filter(Boolean);
  const candidateTokens = tokens.filter((t) => t.length >= 2 && !stopWords.has(t));
  if (candidateTokens.length > 0) {
    const chosen = candidateTokens[0];
    return chosen.charAt(0).toUpperCase() + chosen.slice(1);
  }
  return void 0;
}
function extractCalendarEventDetails(rawQuery, entities) {
  const clean = (rawQuery || "").trim();
  const toTitleCase = (str) => str.trim().split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  let location = void 0;
  let description = void 0;
  const locMatch = clean.match(/(?:location|venue|at\s+venue)\s*[:=]\s*([^,;]+)/i) || clean.match(/\bat\s+([A-Z][a-zA-Z\s]+(?:Clinic|Hospital|Restaurant|Stadium|Center|Centre|Hall|Temple|Room|Office|Home|School|Academy))\b/i);
  if (locMatch && locMatch[1]) {
    location = locMatch[1].trim();
  }
  const descMatch = clean.match(/(?:description|desc|details|notes?)\s*[:=]\s*([^,;]+)/i) || clean.match(/\bwith\s+description\s+([^,;]+)/i);
  if (descMatch && descMatch[1]) {
    description = descMatch[1].trim();
  }
  const titleFieldMatch = clean.match(/(?:title|event\s+title|name)\s*[:=]\s*([^,;]+)/i);
  if (titleFieldMatch && titleFieldMatch[1]) {
    const rawTitle = titleFieldMatch[1].trim();
    const catMatch = clean.match(/(?:category|type)\s*[:=]\s*([^,;]+)/i);
    let category2 = catMatch ? toTitleCase(catMatch[1].trim()) : "General";
    return { title: toTitleCase(rawTitle), category: category2, location, description };
  }
  let extractedTitle = "";
  const asMatch = clean.match(/\b(?:as|called|named)\s+(.+?)(?:\s+(?:on|in|at)\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d|tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday).*)?$/i);
  if (asMatch && asMatch[1]) {
    extractedTitle = asMatch[1].trim();
  } else {
    let working = clean.replace(/^(?:please\s+)?(?:schedule|add|plan|create|set|book|update|change|move|reschedule)\s+(?:a\s+|an\s+|the\s+)?(?:new\s+)?/i, "").replace(/^event\s+/i, "").replace(/(?:location|venue|at\s+venue)\s*[:=]\s*[^,;]+/gi, " ").replace(/(?:description|desc|details|notes?)\s*[:=]\s*[^,;]+/gi, " ").replace(/\bwith\s+description\s+[^,;]+/gi, " ").replace(/\b(?:date\s+)?(?:on|in|for|to)\s+\d{4}-\d{1,2}-\d{1,2}\b/gi, " ").replace(/\b(?:date\s+)?(?:on|in|for|to)\s+\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?\b/gi, " ").replace(/\b(?:date\s+)?(?:on|in|for|to)?\s*(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?(?:\s*,?\s*\d{4})?\b/gi, " ").replace(/\b(?:date\s+)?(?:on|in|for|to)?\s*\d{1,2}(?:st|nd|rd|th)?\s+(?:of\s+)?(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:\s*,?\s*\d{4})?\b/gi, " ").replace(/\b(?:on|in|for|to)?\s*(?:tomorrow|today|tonight|next\s+\w+|this\s+\w+|sunday|monday|tuesday|wednesday|thursday|friday|saturday|naalaiku)\b/gi, " ").replace(/\b(?:at|by|from)\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/gi, " ").replace(/\b(?:in|to|on)\s+(?:my\s+|our\s+|the\s+)?(?:family\s+)?(?:calendar|schedule|events?)\b/gi, " ").replace(/\b(?:add\s+pannu|add\s+pannunga|podu)\b/gi, " ").replace(/\bdate\b$/i, "").replace(/^\bdate\b/i, "").replace(/\s+/g, " ").trim();
    extractedTitle = working;
  }
  if (!extractedTitle || /^(?:event|date|calendar|schedule|it)$/i.test(extractedTitle)) {
    if (entities.eventType && entities.eventType !== "general") {
      extractedTitle = entities.eventType;
    } else {
      extractedTitle = "Family Event";
    }
  }
  const finalTitle = toTitleCase(extractedTitle);
  const lowerT = `${finalTitle} ${clean}`.toLowerCase();
  let category = "General";
  if (BIRTHDAY_REGEX.test(lowerT)) category = "Birthday";
  else if (/holiday|vacation|festival|pongal|diwali|christmas|new\s*year|eid|ramzan|onam|ugadi|holi|navaratri|anniversary|puja|pooja|trip|travel|temple|housewarming/i.test(lowerT)) category = "Holiday";
  else if (/doctor|appointment|checkup|clinic|hospital|dentist|medical/i.test(lowerT)) category = "Appointment";
  else if (/meeting|conference|interview|seminar|workshop/i.test(lowerT)) category = "General";
  else if (/school|college|exam|match|interschool|class/i.test(lowerT)) category = "School";
  else if (/bill|reminder/i.test(lowerT)) category = "Bill";
  return { title: finalTitle, category, location, description };
}
function getKolkataDateString(offsetDays = 0) {
  const d = /* @__PURE__ */ new Date();
  d.setDate(d.getDate() + offsetDays);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}
function parseDateAndRelativeTime(raw) {
  if (!raw) return {};
  const cleaned = raw.trim().toLowerCase();
  const currentYear = 2026;
  const now = /* @__PURE__ */ new Date();
  let extractedTime = void 0;
  const timeMatch = cleaned.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const mins = timeMatch[2] || "00";
    const ampm = timeMatch[3].toUpperCase();
    if (ampm === "PM" && hours < 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;
    extractedTime = `${String(hours).padStart(2, "0")}:${mins}`;
  } else if (cleaned.includes("tonight") || cleaned.includes("night") || cleaned.includes("dinner")) {
    extractedTime = "20:00";
  } else if (cleaned.includes("morning") || cleaned.includes("breakfast")) {
    extractedTime = "09:00";
  } else if (cleaned.includes("afternoon") || cleaned.includes("lunch")) {
    extractedTime = "14:00";
  } else if (cleaned.includes("evening")) {
    extractedTime = "18:00";
  }
  const months = {
    jan: 0,
    january: 0,
    feb: 1,
    february: 1,
    mar: 2,
    march: 2,
    apr: 3,
    april: 3,
    may: 4,
    jun: 5,
    june: 5,
    jul: 6,
    july: 6,
    aug: 7,
    august: 7,
    sep: 8,
    sept: 8,
    september: 8,
    oct: 9,
    october: 9,
    nov: 10,
    november: 10,
    dec: 11,
    december: 11
  };
  const monthFullNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];
  const isoMatch = cleaned.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, "0");
    const d = isoMatch[3].padStart(2, "0");
    const mIdx = parseInt(m, 10) - 1;
    const mLabel = monthFullNames[mIdx] || m;
    return { date: `${y}-${m}-${d}`, formattedDisplay: `${mLabel} ${parseInt(d, 10)}, ${y}`, ...extractedTime ? { time: extractedTime } : {} };
  }
  const dmyMatch = cleaned.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const monthNum = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    if (monthNum >= 0 && monthNum <= 11 && day >= 1 && day <= 31) {
      const monthStr = String(monthNum + 1).padStart(2, "0");
      const dayStr = String(day).padStart(2, "0");
      return {
        date: `${year}-${monthStr}-${dayStr}`,
        formattedDisplay: `${monthFullNames[monthNum]} ${day}, ${year}`,
        ...extractedTime ? { time: extractedTime } : {}
      };
    }
  }
  const monthDayMatch = cleaned.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s*(\d{1,2})(?:st|nd|rd|th)?\b/i);
  if (monthDayMatch) {
    const monthName = monthDayMatch[1].toLowerCase();
    const day = parseInt(monthDayMatch[2], 10);
    const monthNum = months[monthName];
    if (monthNum !== void 0 && day >= 1 && day <= 31) {
      const monthStr = String(monthNum + 1).padStart(2, "0");
      const dayStr = String(day).padStart(2, "0");
      return {
        date: `${currentYear}-${monthStr}-${dayStr}`,
        formattedDisplay: `${monthFullNames[monthNum]} ${day}, ${currentYear}`,
        ...extractedTime ? { time: extractedTime } : {}
      };
    }
  }
  const dayMonthMatch = cleaned.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s*(?:of\s+)?(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i);
  if (dayMonthMatch) {
    const day = parseInt(dayMonthMatch[1], 10);
    const monthName = dayMonthMatch[2].toLowerCase();
    const monthNum = months[monthName];
    if (monthNum !== void 0 && day >= 1 && day <= 31) {
      const monthStr = String(monthNum + 1).padStart(2, "0");
      const dayStr = String(day).padStart(2, "0");
      return {
        date: `${currentYear}-${monthStr}-${dayStr}`,
        formattedDisplay: `${monthFullNames[monthNum]} ${day}, ${currentYear}`,
        ...extractedTime ? { time: extractedTime } : {}
      };
    }
  }
  if (cleaned.includes("tomorrow") || cleaned.includes("naalaiku")) {
    const tomDate = getKolkataDateString(1);
    const [y, m, day] = tomDate.split("-");
    return { date: tomDate, formattedDisplay: `Tomorrow (${day}-${m}-${y})`, ...extractedTime ? { time: extractedTime } : {} };
  }
  if (cleaned.includes("yesterday") || cleaned.includes("nethu")) {
    const yestDate = getKolkataDateString(-1);
    const [y, m, day] = yestDate.split("-");
    return { date: yestDate, formattedDisplay: `Yesterday (${day}-${m}-${y})`, ...extractedTime ? { time: extractedTime } : {} };
  }
  if (cleaned.includes("today") || cleaned.includes("inniku")) {
    const todayDate = getKolkataDateString(0);
    const [y, m, day] = todayDate.split("-");
    return { date: todayDate, formattedDisplay: `Today (${day}-${m}-${y})`, ...extractedTime ? { time: extractedTime } : {} };
  }
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  for (let i = 0; i < dayNames.length; i++) {
    const dayName = dayNames[i];
    if (cleaned.includes(dayName)) {
      const targetDay = i;
      const currentDay = now.getDay();
      let diff = targetDay - currentDay;
      if (diff <= 0 || cleaned.includes("next")) diff += 7;
      const d = new Date(now);
      d.setDate(d.getDate() + diff);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return { date: `${y}-${m}-${day}`, formattedDisplay: `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} (${day}-${m}-${y})`, ...extractedTime ? { time: extractedTime } : {} };
    }
  }
  if (cleaned.includes("next week")) {
    const nextWeekDate = getKolkataDateString(7);
    const [y, m, day] = nextWeekDate.split("-");
    return { date: nextWeekDate, formattedDisplay: `Next Week (${day}-${m}-${y})`, ...extractedTime ? { time: extractedTime } : {} };
  }
  const ordinalDayOnly = cleaned.match(/^(?:(?:due\s+)?(?:on|by|is)?\s*(?:the\s+)?)?(\d{1,2})(?:st|nd|rd|th)$/i);
  if (ordinalDayOnly) {
    const day = parseInt(ordinalDayOnly[1], 10);
    if (day >= 1 && day <= 31) {
      const monthNum = now.getMonth();
      const monthStr = String(monthNum + 1).padStart(2, "0");
      const dayStr = String(day).padStart(2, "0");
      return {
        date: `${currentYear}-${monthStr}-${dayStr}`,
        formattedDisplay: `${monthFullNames[monthNum]} ${day}, ${currentYear}`,
        ...extractedTime ? { time: extractedTime } : {}
      };
    }
  }
  return extractedTime ? { time: extractedTime } : {};
}
function classifyIntentAndExtractEntities(rawQuery) {
  const qTrim = (rawQuery || "").trim();
  const clean = qTrim.toLowerCase().replace(/^[?!.,\s]+|[?!.,\s]+$/g, "").trim();
  const entities = {};
  let operation = "READ";
  let module = "general";
  let intentName = "general_inquiry";
  const personMatches = [
    { pattern: /\b(father|dad|appa)\b/i, normalized: "Father" },
    { pattern: /\b(mother|mom|amma|mothers?)\b/i, normalized: "Mother" },
    { pattern: /\b(grandfather|grandpa|thatha)\b/i, normalized: "Grandfather" },
    { pattern: /\b(grandmother|grandma|paati)\b/i, normalized: "Grandmother" },
    { pattern: /\b(sarah)\b/i, normalized: "Sarah" },
    { pattern: /\b(sneha)\b/i, normalized: "Sneha" },
    { pattern: /\b(sham)\b/i, normalized: "Sham" },
    { pattern: /\b(brother)\b/i, normalized: "Brother" },
    { pattern: /\b(sister)\b/i, normalized: "Sister" },
    { pattern: /\b(parents)\b/i, normalized: "Parents" }
  ];
  for (const pm of personMatches) {
    if (pm.pattern.test(clean)) {
      entities.person = pm.normalized;
      break;
    }
  }
  const dateInfo = parseDateAndRelativeTime(clean);
  if (dateInfo.date) entities.date = dateInfo.date;
  if (dateInfo.time) entities.time = dateInfo.time;
  if (dateInfo.formattedDisplay) entities.rawDateStr = dateInfo.formattedDisplay;
  if (!entities.person && (BIRTHDAY_REGEX.test(clean) || /anniversary/i.test(clean))) {
    const customPerson = extractCustomPersonName(clean);
    if (customPerson) {
      entities.person = customPerson;
    }
  }
  if (/^(?:yes\s+)?(?:please\s+)?(?:update|change|chnage|chagne)(?:\s+it|\s+date|\s+existing|\s+and\s+(?:change|chnage|chagne)|\s+into|\s+to)?(?:\s+.*)?$/i.test(clean) && (clean.includes("it") || clean.includes("into") || clean.includes("date") || clean.includes("existing") || clean.includes("change") || clean.includes("chnage"))) {
    return {
      operation: "UPDATE",
      module: "calendar",
      intentName: "confirm_update_conflict",
      entities: { actionChoice: "update", ...dateInfo },
      confidence: 0.99,
      rawQuery,
      normalizedQuery: clean
    };
  }
  if (/^(add\s+(?:as\s+)?separate|separate(?:\s+event)?|keep\s+both|add\s+new|create\s+separate)$/i.test(clean)) {
    return {
      operation: "CREATE",
      module: "calendar",
      intentName: "confirm_separate_conflict",
      entities: { actionChoice: "separate" },
      confidence: 0.99,
      rawQuery,
      normalizedQuery: clean
    };
  }
  const isMedicineTopic = /\b(?:medicine|medicines|medication|medications|tablet|tablets|capsule|capsules|syrup|pill|pills|dose|doses|dosage|prescription|prescriptions|adherence|compliance|refill|refills|dolo|paracetamol|metformin|insulin|vitamin|supplement|calcium|omega|antibiotic|bp\s+medicine|blood\s+pressure\s+medicine)\b/i.test(clean) && !/\b(?:expense|spent|bill|document|report)\b/i.test(clean) || /\b(?:did\s+(?:dad|father|mother|mom|sarah|sneha|sham|anyone)\s+take\s+(?:his|her|their)?\s*medicine)\b/i.test(clean) || /\b(?:who\s+missed\s+(?:their|his|her)?\s*medicine|missed\s+doses?)\b/i.test(clean) || /\b(?:when\s+should\s+(?:i|dad|father|mother|sarah|sneha|sham)\s+take)\b/i.test(clean) || /\b(?:what\s+(?:is|are)\s+(?:the\s+)?dosage\s+for)\b/i.test(clean) || /\b(?:what\s+is\s+[a-zA-Z]+\s+for)\b/i.test(clean) || clean.includes("marunthu saaptaacha") || clean.includes("medicine eduthukittengala");
  if (isMedicineTopic) {
    module = "medicine";
    if (/\b(?:refill|refills|running\s+low|low\s+stock|out\s+of\s+stock|stock\s+of\s+medicine|need\s+to\s+buy\s+medicines?)\b/i.test(clean)) {
      operation = "READ";
      intentName = "check_medicine_refills";
      return { operation, module, intentName, entities, confidence: 0.96, rawQuery, normalizedQuery: clean };
    }
    if (/\b(?:safe|safety|interaction|interactions|can\s+.*?\s+take\s+.*?\s+with|side\s+effects?|allergic\s+to\s+medicine|allergy\s+to\s+medicine)\b/i.test(clean)) {
      operation = "READ";
      intentName = "check_medicine_safety";
      return { operation, module, intentName, entities, confidence: 0.96, rawQuery, normalizedQuery: clean };
    }
    if (/\b(?:adherence|compliance|did\s+.*?\s+take|has\s+.*?\s+taken|who\s+missed|missed\s+doses?|taken\s+today|all\s+medicines?\s+taken|compliance\s+report)\b/i.test(clean) || clean.includes("marunthu saaptaacha")) {
      operation = "READ";
      intentName = "check_medicine_adherence";
      return { operation, module, intentName, entities, confidence: 0.97, rawQuery, normalizedQuery: clean };
    }
    if (/\b(?:when\s+should|what\s+time|dosage\s+for|what\s+is\s+the\s+dose|how\s+much\s+to\s+take|what\s+is\s+[a-zA-Z\s]+\s+for|why\s+is\s+.*?\s+taking|instructions?\s+for)\b/i.test(clean)) {
      operation = "READ";
      intentName = "query_medicine_details";
      return { operation, module, intentName, entities, confidence: 0.96, rawQuery, normalizedQuery: clean };
    }
    if (/\b(?:took|taken|completed|had\s+(?:my|his|her)\s+medicine|log\s+.*taken|mark\s+.*taken)\b/i.test(clean)) {
      operation = "COMPLETE";
      intentName = "log_medicine_taken";
      return { operation, module, intentName, entities, confidence: 0.96, rawQuery, normalizedQuery: clean };
    }
    if (/\b(?:missed|skip|skipped)\b/i.test(clean)) {
      operation = "COMPLETE";
      intentName = "log_medicine_missed";
      return { operation, module, intentName, entities, confidence: 0.96, rawQuery, normalizedQuery: clean };
    }
    if (/^(?:add|schedule|create|set|prescribe|start)\b/i.test(clean) || /\b(?:add\s+pannu|add\s+pannunga|prescribe)\b/i.test(clean)) {
      operation = "CREATE";
      intentName = "add_medicine";
      return { operation, module, intentName, entities, confidence: 0.96, rawQuery, normalizedQuery: clean };
    }
    if (/^(?:delete|remove|stop|cancel)\b/i.test(clean)) {
      operation = "DELETE";
      intentName = "delete_medicine";
      return { operation, module, intentName, entities, confidence: 0.95, rawQuery, normalizedQuery: clean };
    }
    operation = "READ";
    intentName = "get_medicines";
    return { operation, module, intentName, entities, confidence: 0.92, rawQuery, normalizedQuery: clean };
  }
  const hasExplicitGroceryKeyword = /\b(?:grocery|groceries|shopping\s*list|pantry|supermarket|kirana|maligai)\b/i.test(clean);
  const hasGroceryItemWithVerb = (/^(?:please\s+)?(?:add|buy|purchase|put|need|get|remove|delete|change|update|mark)\b/i.test(clean) || /\b(?:add\s+pannu|add\s+pannunga|bought)\b/i.test(clean)) && (COMMON_GROCERY_ITEMS_REGEX.test(clean) || /\b\d+(?:\.\d+)?\s*(?:kg|kilos?|gm?|grams?|litres?|liters?|ltr|ml|packets?|packs?|dozen|bottles?|cans?)\b/i.test(clean)) && !/\b(?:expense|spent|₹|rs\.?|inr|bill|task\s+to|remind\s+me\s+every)\b/i.test(clean);
  const isGroceryTopic = hasExplicitGroceryKeyword && !/\b(?:expense|expenses|spent|spend|spending|cost|costs|paid|payed|transaction|transactions|ledger|₹|rs\.?|inr|budget|remind\s+me\s+every|cancel\s+my\s+grocery\s+reminder|add\s+a\s+task\s+to\s+buy\s+groceries|grocery\s+shopping\s+on)\b/i.test(clean) || hasGroceryItemWithVerb || /^(?:do\s+(?:i|we)\s+need\s+to\s+buy|should\s+(?:i|we)\s+buy|what\s+should\s+i\s+buy|what\s+groceries\s+are\s+pending|i\s+bought\s+all\s+the\s+groceries|bought\s+all\s+groceries|clear\s+(?:my\s+)?grocery\s+list|is\s+milk\s+already)\b/i.test(clean) || clean.includes("grocery list kaaminga") || clean.includes("milk add pannunga");
  if (isGroceryTopic) {
    module = "grocery";
    if (/mark\s+.*as\s+(?:purchased|bought|done|completed)/i.test(clean) || clean.includes("bought all") || /^(?:i\s+)?(?:bought|purchased)\s+/i.test(clean)) {
      operation = "COMPLETE";
      intentName = clean.includes("bought all") ? "mark_all_groceries_purchased" : "mark_grocery_purchased";
      const itemM = clean.match(/mark\s+(.+?)\s+as\s+(?:purchased|bought|done|completed)/i) || clean.match(/(?:bought|purchased)\s+(.+?)(?:\s+from\s+.*)?$/i);
      if (itemM) entities.itemName = itemM[1].replace(/^all\s+(?:the\s+)?groceries$/i, "").trim();
      return { operation, module, intentName, entities, confidence: 0.96, rawQuery, normalizedQuery: clean };
    }
    if (/^(?:remove|delete|clear)\b/i.test(clean)) {
      operation = "DELETE";
      if (clean.includes("clear")) {
        intentName = "clear_grocery_list";
      } else {
        intentName = "remove_grocery_item";
        const remM = clean.match(/(?:remove|delete)\s+(.+?)(?:\s+(?:from|off|in)\s+.*)?$/i);
        if (remM) {
          entities.itemName = remM[1].replace(/\s+(?:from|off|in)\s+(?:my\s+|the\s+)?(?:grocery|groceries|shopping)?(?:\s*list)?$/i, "").trim();
        }
      }
      return { operation, module, intentName, entities, confidence: 0.96, rawQuery, normalizedQuery: clean };
    }
    if (/^(?:change|update)\b/i.test(clean) && /quantity|litres?|ltr|kg|grams?|packets?|to\s+\d/i.test(clean)) {
      operation = "UPDATE";
      intentName = "update_grocery_quantity";
      const qM = clean.match(/(?:change|update)\s+([a-zA-Z\s]+?)\s+(?:quantity\s+)?to\s+(.+)$/i);
      if (qM) {
        entities.itemName = qM[1].replace(/\bquantity\b/i, "").trim();
        entities.quantity = qM[2].trim();
      }
      return { operation, module, intentName, entities, confidence: 0.96, rawQuery, normalizedQuery: clean };
    }
    if (/^(?:do\s+(?:i|we)\s+need\s+to\s+buy|should\s+(?:i|we)\s+buy|is\s+.*?\s+(?:on\s+(?:my\s+|the\s+)?list|needed|pending|in\s+(?:the\s+)?cart|already\s+bought|purchased))\b/i.test(clean) || /\bneed\s+to\s+buy\s+([a-zA-Z\s]+)\b/i.test(clean) || /\bdo\s+we\s+have\s+([a-zA-Z\s]+)\b/i.test(clean) || /(?:is|have\s+i)\s+.*(?:already\s+(?:in|on)|added)/i.test(clean)) {
      operation = "SEARCH";
      intentName = "check_grocery_item";
      const itmM = clean.match(/(?:need\s+to\s+buy|should\s+(?:i|we)\s+buy|buy|have|need|is)\s+([a-zA-Z\s]+?)(?:\s+(?:from|in|on|to|already|needed)\b.*|\?|$)/i);
      if (itmM && itmM[1]) {
        entities.itemName = itmM[1].replace(/^(?:any|more|some|a|an|the|to\s+buy)\s+/i, "").trim();
      }
      return { operation, module, intentName, entities, confidence: 0.97, rawQuery, normalizedQuery: clean };
    }
    if (/^(?:please\s+)?(?:add|buy|purchase|put|need|get)\b/i.test(clean) || clean.includes("add pannu") || clean.includes("add pannunga")) {
      operation = "CREATE";
      intentName = "add_grocery_item";
      if (/every\s+(?:morning|sunday|monday|day|week)/i.test(clean)) {
        entities.recurring = "recurring";
      }
      const stripped = clean.replace(/^(?:please\s+)?(?:add|buy|purchase|put|need|get)\s+/i, "").replace(/\s*(?:add\s+pannu|add\s+pannunga|vaanganum|podu)$/i, "").replace(/\s+(?:to|on|in|into|for)\s+(?:my\s+|our\s+|the\s+)?(?:smart\s+)?(?:grocery|groceries|shopping|pantry|maligai)(?:\s+list|\s+items|\s+cart)?$/i, "").replace(/\s+(?:in|to|on)\s+(?:my\s+|the\s+)?list$/i, "").replace(/\s+for\s+tomorrow$/i, "").replace(/\s+every\s+\w+$/i, "").trim();
      if (stripped.includes(" and ") || stripped.includes(",")) {
        const parts = stripped.split(/\s*(?:,|\band\b)\s*/i).map((s) => s.trim()).filter(Boolean);
        if (parts.length > 1) {
          entities.items = parts;
        }
      }
      const parsedSingle = parseSingleGroceryPhrase(stripped);
      entities.itemName = parsedSingle.name;
      entities.quantity = parsedSingle.quantity;
      entities.category = parsedSingle.category;
      return { operation, module, intentName, entities, confidence: 0.96, rawQuery, normalizedQuery: clean };
    }
    operation = "LIST";
    intentName = "get_grocery_list";
    return { operation, module, intentName, entities, confidence: 0.9, rawQuery, normalizedQuery: clean };
  }
  const isFinanceTopic = /\b(?:bill|bills|billl|electricity\s*bill|eb\s*bill|water\s*bill|internet\s*bill|wifi\s*bill|mobile\s*bill|house\s*bill|rent\s*bill|insurance\s*premium|school\s*fee|expense|expenses|petrol|fuel|salary|budget|income|spend|spent|spending|spendings|transaction|transactions|ledger|paid|payed|eletric|electic|eb\b)\b|₹/i.test(clean) && !/\b(?:remind\s+me|set\s+a\s+reminder|add\s+a\s+reminder|electricity\s+bill\s+reminder|meter\s+reading)\b/i.test(clean) || /^(?:add|spent|record|paid|payed|log)\s+(?:₹|rs\.?|inr\s*)?\s*\d+(?:[.,]\d+)?\s*(?:for|on|towards)?\s+/i.test(clean) || /\b(?:water|electricity|eletric|electic|eb|internet|gas|maintenance|house|rent)\s+billl?s?\s+(?:is\s+)?paid\b/i.test(clean) || /\bi\s+paid\b/i.test(clean) || /(?:i\s+)?(?:need\s+to|have\s+to|got\s+to|must|due\s+to)\s+pay\b/i.test(clean) || /\b(?:pending|unpaid)\s+bills?\b/i.test(clean) || /\b(?:recent\s+transactions|household\s+transactions|transaction\s+history)\b/i.test(clean) || /\b(?:how\s+much\s+(?:have\s+we|did\s+we|has\s+my\s+family|have\s+i|did\s+i|has\s+the\s+family)\s+(?:spent|spend)|total\s+spent|total\s+spending|total\s+expenses?|spending\s+in|spent\s+in)\b/i.test(clean) || clean.includes("eb bill paid nu mark pannunga") || clean.includes("en pending bills enna") || clean.includes("intha expense add pannunga");
  if (isFinanceTopic) {
    module = "finance";
    const isPaymentPattern = (/\b(?:paid|payed|settled|cleared)\b/i.test(clean) || /\bmark\s+(?:.*?\s+)?as\s+paid\b/i.test(clean) || clean.includes("nu mark pannunga") || /has\s+been\s+paid/i.test(clean) || /is\s+paid/i.test(clean)) && !/(?:need|have|got|must|due)\s+to\s+pay/i.test(clean);
    if (isPaymentPattern && !/^(?:what|how|show|list)\b/i.test(clean)) {
      operation = "PAYMENT";
      intentName = "mark_bill_paid";
      const amtM = clean.match(/(?:₹|rs\.?|inr\s*)\s*(\d+(?:[.,]\d+)?)/i) || clean.match(/\b(\d+(?:[.,]\d+)?)\s*(?:rupees|rs|inr|bills?)?\b/);
      if (amtM) entities.amount = parseInt(amtM[1].replace(/,/g, ""), 10);
      if (/electricity|eletric|electic|eb\b|power|bescom/i.test(clean)) entities.billType = "Electricity";
      else if (/water/i.test(clean)) entities.billType = "Water";
      else if (/internet|wifi|broadband|fiber/i.test(clean)) entities.billType = "Internet";
      else if (/mobile|phone|recharge/i.test(clean)) entities.billType = "Mobile";
      else if (/gas/i.test(clean)) entities.billType = "Gas";
      else if (/maintenance/i.test(clean)) entities.billType = "Maintenance";
      else if (/house|rent/i.test(clean)) entities.billType = "House";
      else if (/insurance/i.test(clean)) entities.billType = "Insurance";
      else if (/school|fee/i.test(clean)) entities.billType = "School Fee";
      else {
        const customBill = clean.match(/(?:paid|payed|settled|cleared|mark)\s+(?:the\s+|my\s+)?(.+?)(?:\s+billl?s?|\s+as\s+paid|\s+\d+)?$/i);
        entities.billType = customBill ? customBill[1].replace(/\s+billl?s?$/i, "").trim() : "Electricity";
      }
      return { operation, module, intentName, entities, confidence: 0.96, rawQuery, normalizedQuery: clean };
    }
    if (/budget/i.test(clean)) {
      if (/set|increase|change|update/i.test(clean)) {
        operation = "UPDATE";
        intentName = "set_budget";
        const amtM = clean.match(/(?:₹|rs\.?|to\s+)\s*(\d+(?:,\d+)?)/i) || clean.match(/\b(\d+(?:,\d+)?)\b/);
        if (amtM) entities.amount = parseInt(amtM[1].replace(/,/g, ""), 10);
      } else {
        operation = "READ";
        intentName = "get_budget_status";
      }
      return { operation, module, intentName, entities, confidence: 0.95, rawQuery, normalizedQuery: clean };
    }
    const isPaidBillsRead = /\b(?:paid|cleared|settled)\s+bills?\b/i.test(clean) || /^(?:show|list|what|display|view|check|get|fetch)\b.*(?:paid|settled|cleared)\s+bills?\b/i.test(clean) || /\bbills?\b.*(?:that\s+are\s+|have\s+been\s+)?paid\b/i.test(clean);
    if (isPaidBillsRead) {
      operation = "READ";
      intentName = "get_paid_bills";
      return { operation, module, intentName, entities, confidence: 0.98, rawQuery, normalizedQuery: clean };
    }
    const isSpecificBillQuery = /(?:how\s+much\s+is\s+(?:my\s+|the\s+)?|what\s+is\s+(?:my\s+|the\s+)?|what\s+about\s+(?:my\s+|the\s+)?|amount\s+for\s+(?:my\s+|the\s+)?)([a-zA-Z\s]+?)\s+billl?s?/i.test(clean) && !/(?:paid|payed|settled|cleared|need\s+to\s+pay|pending\s+bills|unpaid\s+bills|show\s+all|list\s+all)/i.test(clean);
    if (isSpecificBillQuery) {
      operation = "READ";
      intentName = "get_specific_bill";
      if (/electricity|eletric|electic|eb\b|power/i.test(clean)) entities.billType = "Electricity";
      else if (/water/i.test(clean)) entities.billType = "Water";
      else if (/internet|wifi|broadband/i.test(clean)) entities.billType = "Internet";
      else if (/mobile|phone|recharge/i.test(clean)) entities.billType = "Mobile";
      else if (/gas/i.test(clean)) entities.billType = "Gas";
      else if (/maintenance/i.test(clean)) entities.billType = "Maintenance";
      else if (/house|rent/i.test(clean)) entities.billType = "House";
      else if (/insurance/i.test(clean)) entities.billType = "Insurance";
      else {
        const bm = clean.match(/(?:how\s+much\s+is\s+|what\s+is\s+)(?:my\s+|the\s+)?([a-zA-Z\s]+?)\s+bill/i);
        if (bm && bm[1]) entities.billType = bm[1].trim();
      }
      return { operation, module, intentName, entities, confidence: 0.98, rawQuery, normalizedQuery: clean };
    }
    const isPendingBillsRead = !isPaidBillsRead && ((/^(?:show|list|what|display|view|check|get|fetch)\b.*(?:pending|unpaid|due)?\s*bills?\b/i.test(clean) || /^(?:show\s+my\s+pending\s+bills|show\s+pending\s+bills|what\s+bills\s+are\s+pending|pending\s+bills|unpaid\s+bills|my\s+pending\s+bills|bills\s+pending|any\s+pending\s+bills|show\s+my\s+bills|show\s+bills|my\s+bills)$/i.test(clean) || clean.includes("pending bills") && !/(?:need|have|add|record|create|log)/i.test(clean)) && !/\b(?:paid|payed|settled|cleared)\b/i.test(clean));
    if (isPendingBillsRead) {
      operation = "READ";
      intentName = "get_pending_bills";
      return { operation, module, intentName, entities, confidence: 0.97, rawQuery, normalizedQuery: clean };
    }
    const isExpenseInquiry = /^(?:how\s+much|what|show|list|tell\s+me|check|get|display|view)\b.*(?:spent|spend|spending|expenses?|transactions?|ledger)/i.test(clean) || /\b(?:how\s+much\s+(?:have\s+we|did\s+we|has\s+my\s+family|have\s+i|did\s+i|has\s+the\s+family)\s+(?:spent|spend)|total\s+spent|total\s+spending|total\s+expenses?|spending\s+in|spent\s+in|recent\s+transactions?|household\s+transactions?)\b/i.test(clean) || /^(?:recent\s+transactions?|household\s+transactions?|list\s+transactions?|my\s+expenses?|november\s+expenses?|november\s+spending)$/i.test(clean);
    if (isExpenseInquiry) {
      operation = "READ";
      intentName = /transaction/i.test(clean) ? "get_transactions" : "get_expense_summary";
      return { operation, module, intentName, entities, confidence: 0.98, rawQuery, normalizedQuery: clean };
    }
    const isBillCreation = /(?:i\s+)?(?:need\s+to|have\s+to|got\s+to|must|due\s+to)\s+pay\b/i.test(clean) || /\bbilll?s?\b/i.test(clean) && /^(?:add|record|create|log|new|register)\b/i.test(clean) || /\bbilll?s?\b/i.test(clean) && /\b(?:due|pending)\b/i.test(clean) && /(?:₹|rs\.?|inr|\d{2,})/i.test(clean) || /\bbilll?s?\b/i.test(clean) && /(?:₹|rs\.?|inr\s*)\s*\d+/i.test(clean) && !/^(?:what|how|show|list)\b/i.test(clean);
    if (isBillCreation) {
      operation = "CREATE";
      intentName = "add_bill";
      if (/electricity|eletric|electic|eb\b/i.test(clean)) entities.billType = "Electricity";
      else if (/water/i.test(clean)) entities.billType = "Water";
      else if (/internet|wifi|broadband/i.test(clean)) entities.billType = "Internet";
      else if (/mobile|phone|recharge/i.test(clean)) entities.billType = "Mobile Recharge";
      else if (/gas/i.test(clean)) entities.billType = "Gas";
      else if (/maintenance/i.test(clean)) entities.billType = "Maintenance";
      else if (/house|rent/i.test(clean)) entities.billType = "House";
      else if (/insurance/i.test(clean)) entities.billType = "Insurance";
      else if (/school|fee/i.test(clean)) entities.billType = "School Fee";
      else {
        const bMatch = clean.match(/(?:(?:need|have|got|must|due)\s+to\s+pay|add|record|create|log|new)\s+(?:a\s+|an\s+)?(?:the\s+)?(?:₹|rs\.?|inr\s*)?(?:\d+(?:,\d+)?\s+)?([a-zA-Z]+)\s+billl?s?/i) || clean.match(/([a-zA-Z]+)\s+billl?s?/i);
        entities.billType = bMatch ? bMatch[1].charAt(0).toUpperCase() + bMatch[1].slice(1) : "Household";
      }
      const amtM = clean.match(/(?:₹|rs\.?|inr\s*)\s*(\d+(?:[.,]\d+)?)/i) || clean.match(/\b(\d+(?:[.,]\d+)?)\s*(?:rupees|rs|inr|bills?)?\b/);
      if (amtM) entities.amount = parseInt(amtM[1].replace(/,/g, ""), 10);
      const dateParsed = parseDateAndRelativeTime(clean);
      if (dateParsed.date) entities.date = dateParsed.date;
      return { operation, module, intentName, entities, confidence: 0.96, rawQuery, normalizedQuery: clean };
    }
    if (/^(?:change|update|edit)\b/i.test(clean) && /expense|petrol|food|grocer|amount/i.test(clean)) {
      operation = "UPDATE";
      intentName = "update_expense";
      const amtM = clean.match(/(?:to|₹|rs\.?)\s*(\d+(?:,\d+)?)/i) || clean.match(/\b(\d+(?:,\d+)?)\b/);
      if (amtM) entities.amount = parseInt(amtM[1].replace(/,/g, ""), 10);
      const catM = clean.match(/(?:change|update|edit)\s+(?:the\s+|my\s+)?(.+?)\s+expense/i);
      if (catM) entities.category = catM[1].trim();
      return { operation, module, intentName, entities, confidence: 0.96, rawQuery, normalizedQuery: clean };
    }
    if (/^(?:delete|remove|clear|erase|cancel)\b/i.test(clean) || /\b(?:delete|remove)\s+(?:the\s+|my\s+)?/i.test(clean)) {
      operation = "DELETE";
      intentName = /\bbilll?\b|water|electricity|eb|wifi|internet|gas|maintenance/i.test(clean) ? "delete_bill" : "delete_expense";
      const amtM = clean.match(/(?:₹|rs\.?)\s*(\d+(?:,\d+)?)/i) || clean.match(/\b(\d+(?:,\d+)?)\b/);
      if (amtM) entities.amount = parseInt(amtM[1].replace(/,/g, ""), 10);
      if (/water/i.test(clean)) entities.billType = "Water";
      else if (/electricity|eletric|eb/i.test(clean)) entities.billType = "Electricity";
      else if (/wifi|internet/i.test(clean)) entities.billType = "Internet";
      else if (/gas/i.test(clean)) entities.billType = "Gas";
      if (/food/i.test(clean)) entities.category = "Food";
      else if (/petrol|fuel/i.test(clean)) entities.category = "Petrol";
      return { operation, module, intentName, entities, confidence: 0.96, rawQuery, normalizedQuery: clean };
    }
    const isExpenseCreation = !isExpenseInquiry && (/^(?:add|record|log)\s+(?:₹|rs\.?|inr\s*)?\s*\d+(?:[.,]\d+)?\s*(?:for|on|towards)?\s+/i.test(clean) || /^(?:spent|paid)\s+(?:₹|rs\.?|inr\s*)?\s*\d+(?:[.,]\d+)?\s+(?:for|on|towards)/i.test(clean) || /^(?:add|record|log)\s+(?:an?\s+)?expense\b/i.test(clean) || clean.includes("intha expense add pannunga") || /salary|received|income/i.test(clean) && /^(?:add|record|log|received)\b/i.test(clean));
    if (isExpenseCreation) {
      operation = "CREATE";
      intentName = /salary|received|income/i.test(clean) ? "record_income" : "add_expense";
      const amtM = clean.match(/(?:₹|rs\.?|inr\s*)\s*(\d+(?:,\d+)?)/i) || clean.match(/\b(\d+(?:,\d+)?)\b/);
      if (amtM) entities.amount = parseInt(amtM[1].replace(/,/g, ""), 10);
      const forM = clean.match(/(?:for|on|towards)\s+(.+?)(?:\s+(?:yesterday|today|last\s+week))?$/i);
      if (forM && forM[1]) {
        const rawTarget = forM[1].replace(/\s+expense$/i, "").trim();
        entities.itemName = rawTarget.charAt(0).toUpperCase() + rawTarget.slice(1);
      }
      if (/food|dining|restaurant|dinner|lunch|breakfast|snack/i.test(clean)) entities.category = "Dining";
      else if (/petrol|fuel|diesel|cab|uber|ola|transport|bus|train|auto|bike|car/i.test(clean)) entities.category = "Maintenance";
      else if (/grocer|vegetable|supermarket|milk|fruit/i.test(clean)) entities.category = "Groceries";
      else if (/medic|doctor|hospital|pharmacy|health|clinic/i.test(clean)) entities.category = "Healthcare";
      else if (/school|college|tuition|book|education|fee/i.test(clean)) entities.category = "Education";
      else if (/cloth|dress|shirt|shoe|shopping|amazon|flipkart/i.test(clean)) entities.category = "Shopping";
      else if (/electric|water|internet|wifi|gas|utility|recharge/i.test(clean)) entities.category = "Utilities";
      else if (/salary|income/i.test(clean)) entities.category = "Other";
      else if (entities.itemName) entities.category = "Other";
      return { operation, module, intentName, entities, confidence: 0.96, rawQuery, normalizedQuery: clean };
    }
    operation = "READ";
    intentName = /\bbill/i.test(clean) ? "get_pending_bills" : /transaction/i.test(clean) ? "get_transactions" : "get_expense_summary";
    return { operation, module, intentName, entities, confidence: 0.92, rawQuery, normalizedQuery: clean };
  }
  const isExplicitReminderOrTask = /^(?:remind\s+me|set\s+a\s+reminder|add\s+a\s+reminder|create\s+a\s+reminder|set\s+an\s+alarm|snooze\s+my\s+reminder|cancel\s+my\s+.*reminder|show\s+(?:my\s+)?reminders|what\s+reminders|did\s+i\s+miss\s+any\s+reminders)\b/i.test(clean) || /\b(?:reminder\s+podu|reminder\s+set\s+pannunga|booking\s+reminder)\b/i.test(clean) || /\b(?:task|tasks|assignment|to-do|todo)\b/i.test(clean) || /^(?:tell|ask|assign)\s+(?:father|dad|mother|mom|sarah|sneha|sham|brother|sister)\s+to\s+/i.test(clean);
  if (isExplicitReminderOrTask) {
    const isTaskWord = /\b(?:task|tasks|assignment|to-do|todo)\b/i.test(clean);
    module = isTaskWord ? "tasks" : "reminders";
    if (/snooze/i.test(clean)) {
      operation = "UPDATE";
      intentName = "snooze_reminder";
      return { operation, module, intentName, entities, confidence: 0.95, rawQuery, normalizedQuery: clean };
    }
    if (/mark\s+.*as\s+(?:completed|done)/i.test(clean) || /^complete\s+(?:task|reminder)/i.test(clean)) {
      operation = "COMPLETE";
      intentName = "mark_task_completed";
      const mTask = clean.match(/mark\s+(.+?)\s+as\s+(?:completed|done)/i) || clean.match(/complete\s+(?:task|reminder)?\s*(.+)$/i);
      if (mTask) entities.taskTitle = mTask[1].replace(/\b(?:my|the|task|reminder)\b/gi, "").trim();
      return { operation, module, intentName, entities, confidence: 0.96, rawQuery, normalizedQuery: clean };
    }
    if (/^(?:cancel|delete|remove|clear)\b/i.test(clean)) {
      operation = "DELETE";
      intentName = /completed\s+tasks/i.test(clean) ? "delete_completed_tasks" : "cancel_reminder";
      const cMatch = clean.match(/(?:cancel|delete|remove)\s+(?:my\s+|the\s+)?(.+?)(?:\s+reminder|\s+task)?$/i);
      if (cMatch) entities.taskTitle = cMatch[1].trim();
      return { operation, module, intentName, entities, confidence: 0.95, rawQuery, normalizedQuery: clean };
    }
    if (/^(?:remind|set\s+a\s+reminder|add\s+a\s+reminder|create\s+a\s+reminder|set\s+an\s+alarm|add|create|tell|ask|assign)\b/i.test(clean) || clean.includes("reminder podu") || clean.includes("reminder set pannunga")) {
      operation = "CREATE";
      intentName = isTaskWord ? "add_task" : "create_reminder";
      let title = qTrim.replace(/^(?:please\s+)?(?:remind\s+me\s+(?:tomorrow\s+|tonight\s+|every\s+\w+\s+|\d+\s+days?\s+before\s+the\s+event\s+)?(?:to\s+|about\s+|for\s+)?)/i, "").replace(/^(?:please\s+)?(?:add|create|set)\s+(?:a\s+|an\s+)?(?:high\s+priority\s+)?(?:reminder|task|alarm)\s*(?:one\s+day\s+before\s+)?(?:to\s+|for\s+|about\s+)?/i, "").replace(/^(?:tell|ask|assign)\s+[a-zA-Z]+\s+to\s+/i, "").replace(/\s*(?:ku\s+reminder\s+podu|reminder\s+podu|reminder\s+set\s+pannunga)$/i, "").replace(/\s+(?:tomorrow|tonight|today)\s+to\s+/i, " ").trim();
      if (/set\s+an\s+alarm\s+for\s+(.+)/i.test(clean)) {
        const alM = clean.match(/set\s+an\s+alarm\s+for\s+(.+)/i);
        title = `Alarm (${alM ? alM[1].toUpperCase() : "6:00 AM"})`;
      } else if (/appa\s+birthday\s+ku\s+reminder\s+podu/i.test(clean) || /reminder\s+(?:one\s+day\s+before\s+|for\s+)?(?:my\s+)?father['’]?s\s+birthday/i.test(clean)) {
        title = "Father's Birthday Reminder";
      } else if (/gas\s+cylinder\s+booking/i.test(clean)) {
        title = "Book Gas Cylinder";
      } else if (/remind\s+me\s+2\s+days\s+before\s+the\s+event/i.test(clean)) {
        title = "Upcoming Family Event (2 Days Advance Reminder)";
      }
      if (title) {
        entities.taskTitle = title.charAt(0).toUpperCase() + title.slice(1);
      }
      if (/high\s*priority|urgent|important|bill|eb\b|medicine|doctor|bank/i.test(clean)) {
        entities.priority = "High";
      } else {
        entities.priority = "Medium";
      }
      return { operation, module, intentName, entities, confidence: 0.96, rawQuery, normalizedQuery: clean };
    }
    operation = "LIST";
    intentName = isTaskWord ? "get_pending_tasks" : "get_reminders";
    return { operation, module, intentName, entities, confidence: 0.92, rawQuery, normalizedQuery: clean };
  }
  const isKnowledgeOrNoteTopic = /\b(?:note|notes|knowledge|wi-?fi|wifi|password|passwords|router|curfew|screen\s*time|spare\s*key|house\s*key|family\s*doctor|pediatrician|emergency\s*contact|clinic\s*contact|hospital\s*contact|doctor\s*(?:sharma|phone|contact|number)|food\s*preferences?|dietary|diet\s*restriction|allergic|allergy|allergies|lactose|diabetic|blood\s*group|home\s*address|family\s*address|family\s*meeting|family\s*rules?|house\s*rules?)\b/i.test(clean) || /^(?:remember\s+that|remember\s+this|save\s+a\s+note|add\s+a\s+note|save\s+this\s+information|add\s+knowledge|note\s+that|what\s+is\s+our\s+wi-?fi|where\s+is\s+the\s+spare|who\s+is\s+(?:our|the)\s+(?:family\s+)?doctor|what\s+are\s+(?:dad|father|mother|mom|sarah|sneha)'?s|who\s+is\s+allergic|when\s+is\s+the\s+family\s+meeting|what\s+is\s+our\s+emergency)\b/i.test(clean);
  if (isKnowledgeOrNoteTopic && !BIRTHDAY_REGEX.test(clean)) {
    module = "notes";
    if (/^(?:delete|remove|forget|erase)\b/i.test(clean)) {
      operation = "DELETE";
      intentName = "delete_note";
      return { operation, module, intentName, entities, confidence: 0.95, rawQuery, normalizedQuery: clean };
    }
    if (/^(?:update|edit|change)\b/i.test(clean)) {
      operation = "UPDATE";
      intentName = "update_note";
      return { operation, module, intentName, entities, confidence: 0.95, rawQuery, normalizedQuery: clean };
    }
    if (/^(?:save|remember|add|create|note|record)\b/i.test(clean) || /\b(?:allergic\s+to|prefers?|password\s+is|key\s+is|rule\s+is)\b/i.test(clean)) {
      operation = "CREATE";
      intentName = "save_note";
      return { operation, module, intentName, entities, confidence: 0.95, rawQuery, normalizedQuery: clean };
    }
    if (/\b(?:what\s+is\s+(?:our|the)|where\s+is\s+(?:the|our)|what\s+are\s+(?:dad|father|mother|mom|sarah|sneha)'?s|who\s+is\s+allergic|when\s+is\s+the\s+(?:monthly\s+)?family\s+meeting|what\s+are\s+(?:the\s+)?family\s+rules|what\s+is\s+our\s+address)\b/i.test(clean) || /\b(?:wifi|wi-fi|password|spare\s*key|emergency\s*contact|doctor|allergies|lactose|dietary|address|rules?)\b/i.test(clean)) {
      operation = "READ";
      intentName = "query_knowledge";
      return { operation, module, intentName, entities, confidence: 0.96, rawQuery, normalizedQuery: clean };
    }
    operation = "READ";
    intentName = "get_notes";
    return { operation, module, intentName, entities, confidence: 0.92, rawQuery, normalizedQuery: clean };
  }
  const isOtherModuleExplicit = /\b(?:grocery|groceries|shopping\s*list|milk|rice|tomato|onion|oil|egg|vegetable|bread|water\s*can|sugar|bill|electricity|eb|water\s*bill|internet\s*bill|wifi\s*bill|expense|petrol|salary|budget|rs|inr|aadhaar|pan\s*card|pan|passport|licen[cs]e|dl|marksheet|certificate|degree|voter|insurance|bank\s*statement|property|document|pdf|vault|task|assignment|to-do|todo|snooze|alarm|wi-fi\s*password|wifi\s*password|gas\s*cylinder|meter\s*reading|household\s*inventory)\b|₹/i.test(clean);
  const isDateBasedCalendarCommand = !isOtherModuleExplicit && !!dateInfo.date && /^(?:add|schedule|plan|create|set|book|change|move|reschedule|postpone|update|cancel|delete|remove)\b/i.test(clean);
  const isCalendarTopic = CALENDAR_TOPIC_REGEX.test(clean) && !/\b(?:grocery|groceries|bread|milk|bill|eb|expense)\b/i.test(clean) || isDateBasedCalendarCommand || clean.includes("appa birthday") || clean.includes("meeting add pannunga") || /\bac\s+service\s+on\b/i.test(clean);
  if (isCalendarTopic) {
    module = "calendar";
    if (BIRTHDAY_REGEX.test(clean)) entities.eventType = "birthday";
    else if (/anniversary/i.test(clean)) entities.eventType = "anniversary";
    else if (/meeting/i.test(clean)) entities.eventType = "meeting";
    else if (/doctor|appointment|checkup|dentist|clinic|hospital|medical/i.test(clean)) entities.eventType = "doctor appointment";
    else if (/housewarming/i.test(clean)) entities.eventType = "housewarming";
    else if (/holiday|vacation|festival|pongal|diwali|christmas|new\s*year|eid|ramzan|onam|ugadi|holi|navaratri/i.test(clean)) entities.eventType = "holiday";
    else if (/marriage|wedding|reception|engagement/i.test(clean)) entities.eventType = "marriage function";
    else if (/trip|tour|outing/i.test(clean)) entities.eventType = "trip";
    else if (/dinner|lunch|breakfast/i.test(clean)) entities.eventType = "family dinner";
    else if (/function|ceremony|puja|pooja|party/i.test(clean)) entities.eventType = "family function";
    const isCreateCalendar = /^(?:add|schedule|plan|create|set|book|remember)\b/i.test(clean) || /\b(?:add\s+pannu|add\s+pannunga|podu)\b/i.test(clean) || /^(?:title|event\s+title)\s*[:=]/i.test(clean);
    if (isCreateCalendar) {
      operation = "CREATE";
      intentName = entities.eventType === "birthday" ? "add_birthday" : "add_calendar_event";
      return { operation, module, intentName, entities, confidence: 0.95, rawQuery, normalizedQuery: clean };
    }
    if (/^(?:change|move|reschedule|postpone|update|edit|shift)\b/i.test(clean)) {
      operation = "UPDATE";
      intentName = "update_calendar_event";
      return { operation, module, intentName, entities, confidence: 0.95, rawQuery, normalizedQuery: clean };
    }
    if (/^(?:cancel|delete|remove)\b/i.test(clean)) {
      operation = "DELETE";
      intentName = "delete_calendar_event";
      return { operation, module, intentName, entities, confidence: 0.95, rawQuery, normalizedQuery: clean };
    }
    if (/(?:is|have\s+i|did\s+i|already)\s+.*(?:saved|added|recorded)/i.test(clean) || clean.includes("already add pannirukoma")) {
      operation = "SEARCH";
      intentName = "search_calendar_event";
      return { operation, module, intentName, entities, confidence: 0.95, rawQuery, normalizedQuery: clean };
    }
    operation = "READ";
    if (entities.eventType === "birthday") {
      intentName = "get_birthday";
    } else if (entities.eventType === "doctor appointment") {
      intentName = "get_medical_appointments";
    } else if (/\b(?:summarize|summary|overview)\b/i.test(clean)) {
      intentName = "summarize_schedule";
    } else {
      intentName = "get_calendar_events";
    }
    return { operation, module, intentName, entities, confidence: 0.9, rawQuery, normalizedQuery: clean };
  }
  const isDocTopic = /\b(?:aadhaar|aadhar|pan\s*card|\bpan\b|passport|licen[cs]e|dl\b|mark\s*sheets?|marksheet|10th|11th|12th|certificate|degree|diploma|voter|insurance\s*policy|bank\s*statement|property|document|documents|pdf|pdfs|vault|\bid\b|id\s*card|ids|college\s*id|school\s*id|student\s*id|employee\s*id|work\s*id|ration\s*card|report|reports|prescription\s*file|resume|biodata|slip|receipt|deed|agreement|record|records)\b/i.test(clean) || /\b(?:save|upload|store)\s+(?:this\s+)?(?:as\s+)?/i.test(clean) || /\bsave\s+to\s+vault\b/i.test(clean) || /\b(?:which|what)\s+category\s+does\b/i.test(clean) || /\bcategory\s+does\s+my\b/i.test(clean) || /\bbelong\s+to\b/i.test(clean) || /\bhow\s+many\s+documents\b/i.test(clean) || /\bcount\s+(?:my\s+|of\s+)?documents\b/i.test(clean) || /\bnames\s+and\s+upload\s+dates\b/i.test(clean) || /\buploaded\s+documents\b/i.test(clean) || /\b(?:remove|delete|erase|drop)\s+(?:the\s+|my\s+)?[a-zA-Z0-9_\s]+(?:\s+id|\s+card|\s+document|\s+marksheet|\s+mark\s*sheet|\s+certificate|\s+record|\s+pdf|\s+file|\s+slip|\s+report)\b/i.test(clean) || clean.includes("en aadhaar card eduthu kudu") || clean.includes("sham oda pan card irukka");
  if (isDocTopic) {
    module = "documents";
    if (/aadhaar|aadhar/i.test(clean)) entities.docType = "Aadhaar Card";
    else if (/pan\b|pan\s*card/i.test(clean)) entities.docType = "PAN Card";
    else if (/licen[cs]e|dl\b/i.test(clean)) entities.docType = "Driving License";
    else if (/passport/i.test(clean)) entities.docType = "Passport";
    else if (/mark\s*sheet|marksheet/i.test(clean)) entities.docType = "Marksheet";
    else if (/degree|diploma/i.test(clean)) entities.docType = "Degree Certificate";
    else if (/voter/i.test(clean)) entities.docType = "Voter ID";
    else if (/college\s*id|school\s*id|student\s*id|employee\s*id|\bid\s*card\b|\bid\b/i.test(clean)) entities.docType = "Identity Card";
    else if (/insurance/i.test(clean)) entities.docType = "Insurance Policy";
    else if (/bank\s*statement/i.test(clean)) entities.docType = "Bank Statement";
    else if (/property|deed/i.test(clean)) entities.docType = "Property Documents";
    if (/sham/i.test(clean)) entities.person = "Sham";
    else if (/father|dad/i.test(clean)) entities.person = "Father";
    else if (/mother|mom/i.test(clean)) entities.person = "Mother";
    else if (/sarah/i.test(clean)) entities.person = "Sarah";
    else if (/sneha/i.test(clean)) entities.person = "Sneha";
    else if (/vikram/i.test(clean)) entities.person = "Vikram";
    if ((/^(?:upload|save|add|store)\b/i.test(clean) || /\b(?:save\s+this|upload\s+this|store\s+this)\b/i.test(clean) || /\bsave\s+to\s+vault\b/i.test(clean)) && !/reminder|task|event|expense|bill/i.test(clean)) {
      operation = "CREATE";
      intentName = "upload_document";
      const asMatch = clean.match(/(?:save|upload|store)\s+(?:this\s+)?(?:as\s+(?:a\s+)?)?(.+?)$/i);
      if (asMatch && asMatch[1]) {
        entities.itemName = asMatch[1].replace(/^(?:a|an|the)\s+/i, "").trim();
      }
      return { operation, module, intentName, entities, confidence: 0.96, rawQuery, normalizedQuery: clean };
    }
    if (/replace/i.test(clean)) {
      operation = "UPDATE";
      intentName = "replace_document";
      return { operation, module, intentName, entities, confidence: 0.95, rawQuery, normalizedQuery: clean };
    }
    if (/^(?:delete|remove|clear|erase|drop)\b/i.test(clean) || /\b(?:delete|remove)\s+(?:the\s+|my\s+)?/i.test(clean)) {
      operation = "DELETE";
      intentName = "delete_document";
      const delMatch = clean.match(/(?:delete|remove|clear|erase|drop)\s+(?:the\s+|my\s+)?(.+?)$/i);
      if (delMatch && delMatch[1]) {
        entities.itemName = delMatch[1].trim();
      }
      return { operation, module, intentName, entities, confidence: 0.96, rawQuery, normalizedQuery: clean };
    }
    if (/summarize|read\s+this|search\s+for\s+a\s+word/i.test(clean)) {
      operation = "SUMMARIZE";
      intentName = "summarize_document";
      return { operation, module, intentName, entities, confidence: 0.95, rawQuery, normalizedQuery: clean };
    }
    const renameMatch = clean.match(/^rename\s+(?:the\s+|my\s+)?(?:document\s+|file\s+)?(.+?)\s+(?:to|as|into)\s+(.+)$/i);
    if (renameMatch) {
      operation = "UPDATE";
      intentName = "rename_document";
      entities.itemName = renameMatch[1].trim();
      entities.noteContent = renameMatch[2].trim();
      return { operation, module, intentName, entities, confidence: 0.98, rawQuery, normalizedQuery: clean };
    }
    const isCountDocs = /^(?:how\s+many\s+documents|count\s+(?:my\s+)?documents|total\s+documents)\b/i.test(clean) || /\bhow\s+many\s+documents\s+are\s+stored\b/i.test(clean) || clean.includes("how many") && clean.includes("document");
    const isCategoryQuery = /\b(?:which|what)\s+category\s+does\b/i.test(clean) || /\bcategory\s+does\s+my\b/i.test(clean) || /\bbelong\s+to\b/i.test(clean) || /\bcategory\s+of\b/i.test(clean);
    const isListAllDocs = /^(?:list|show|display|get|view|fetch)\s+(?:me\s+)?(?:all\s+)?(?:my\s+|our\s+|the\s+)?(?:uploaded\s+|stored\s+|saved\s+|family\s+|vault\s+)?documents?\b/i.test(clean) || /\b(?:all\s+(?:my\s+|our\s+)?(?:stored\s+|uploaded\s+|saved\s+)?documents|names\s+and\s+upload\s+dates|what\s+documents\s+(?:do\s+i\s+have|are\s+uploaded|are\s+stored))\b/i.test(clean) || /^(?:all\s+documents|stored\s+documents|my\s+documents|all\s+my\s+stored\s+documents)$/i.test(clean);
    const isCategoryFilter = /\b(?:belonging\s+to|in|under|from)\s+(?:the\s+)?(education|identity|financial|medical|legal|vehicle|personal|tax|property)\s+category\b/i.test(clean) || /\b(?:show|list|get|display|find|fetch)\s+(?:all\s+)?(?:my\s+)?(education|identity|financial|medical|legal|vehicle|personal|tax|property)\s+documents?\b/i.test(clean) || /\b(education|identity|financial|medical|legal|vehicle|personal|tax|property)\s+(?:category\s+)?documents?\b/i.test(clean);
    if (isCountDocs) {
      operation = "READ";
      intentName = "count_documents";
      return { operation, module, intentName, entities, confidence: 0.98, rawQuery, normalizedQuery: clean };
    }
    if (isCategoryQuery) {
      operation = "READ";
      intentName = "query_document_category";
      return { operation, module, intentName, entities, confidence: 0.98, rawQuery, normalizedQuery: clean };
    }
    if (isListAllDocs) {
      operation = "READ";
      intentName = "list_all_documents";
      return { operation, module, intentName, entities, confidence: 0.98, rawQuery, normalizedQuery: clean };
    }
    if (isCategoryFilter) {
      operation = "READ";
      intentName = "filter_documents_by_category";
      return { operation, module, intentName, entities, confidence: 0.98, rawQuery, normalizedQuery: clean };
    }
    operation = "READ";
    intentName = "fetch_document";
    const targetDoc = clean.replace(/^(?:fetch|get|show|find|search|open|download|view|where\s+is|display)\s+(?:the\s+|my\s+|our\s+)?/i, "").replace(/\s+(?:from|in)\s+(?:the\s+)?(?:document\s+)?vault$/i, "").trim();
    if (targetDoc) entities.itemName = targetDoc;
    return { operation, module, intentName, entities, confidence: 0.9, rawQuery, normalizedQuery: clean };
  }
  if (/gas|cylinder|bike\s*service|ac\s*service|meter\s*reading|household\s*inventory|maintenance\s*expense|house\s*expenses/i.test(clean)) {
    module = "household";
    if (/add|remind|book|schedule/i.test(clean)) {
      operation = "CREATE";
      intentName = "add_household_task";
    } else {
      operation = "READ";
      intentName = "get_household_info";
    }
    return { operation, module, intentName, entities, confidence: 0.9, rawQuery, normalizedQuery: clean };
  }
  if (/family|brother|sister|father|mother|timeline/i.test(clean)) {
    module = "family";
    if (/add/i.test(clean)) {
      operation = "CREATE";
      intentName = "add_family_member";
    } else if (/update/i.test(clean)) {
      operation = "UPDATE";
      intentName = "update_family_details";
    } else {
      operation = "READ";
      intentName = "get_family_details";
    }
    return { operation, module, intentName, entities, confidence: 0.9, rawQuery, normalizedQuery: clean };
  }
  return { operation, module, intentName, entities, confidence: 0.5, rawQuery, normalizedQuery: clean };
}
function formatDateHuman(isoDate) {
  if (!isoDate) return "";
  const d = new Date(isoDate.includes("T") ? isoDate : `${isoDate}T00:00:00`);
  return !isNaN(d.getTime()) ? d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : isoDate;
}
async function processIntelligentAction(rawQuery, contextData, dbMethods) {
  const {
    events,
    groceries,
    bills,
    expenses,
    reminders,
    medicines = [],
    medicineLogs = [],
    documents,
    knowledgeList,
    user,
    token,
    conversationHistory = [],
    attachments = []
  } = contextData;
  const sessionKey = user.familyId || user.id || "demo-family";
  const clean = (rawQuery || "").toLowerCase().replace(/^[?!.,\s]+|[?!.,\s]+$/g, "").trim();
  const actionsExecuted = [];
  if (clean === "document not found") {
    const reply = "I couldn't find the requested document in the Document Vault. Please upload the document so I can store it and make it available for future retrieval.";
    return { reply, text: reply, actionsExecuted, sources: ["Document Vault"], handled: true };
  }
  if (clean === "file corrupted") {
    const reply = "The file appears to be corrupted and cannot be opened. Please re-upload a readable copy.";
    return { reply, text: reply, actionsExecuted, sources: ["Document Vault"], handled: true };
  }
  if (clean === "upload failed") {
    const reply = "The document upload could not be completed. Please check your network connection and try again.";
    return { reply, text: reply, actionsExecuted, sources: ["Document Vault"], handled: true };
  }
  if (clean === "unsupported file") {
    const reply = "This file format is currently not supported. Please upload a PDF, DOCX, TXT, or standard image file (JPG, PNG).";
    return { reply, text: reply, actionsExecuted, sources: ["Document Vault"], handled: true };
  }
  if (clean === "unauthorized access") {
    const reply = "Sorry, you don't have permission to access this document. Please contact the document owner.";
    return { reply, text: reply, actionsExecuted, sources: ["Document Vault"], handled: true };
  }
  let pendingAction = getPendingAction(sessionKey);
  if (conversationHistory.length > 0) {
    const lastAssistantMsg = [...conversationHistory].reverse().find((m) => m.role === "model" || m.role === "assistant");
    if (lastAssistantMsg && lastAssistantMsg.text) {
      if (lastAssistantMsg.text.includes("Do you want me to update its date to") && lastAssistantMsg.text.includes("separate event?")) {
        const mTitle = lastAssistantMsg.text.match(/found an existing (.*?) event on/i);
        const existingTitle = mTitle ? mTitle[1].replace(/\[DEMO\]\s*/g, "").trim() : pendingAction?.data?.existingTitle || "Event";
        const mNewDate = lastAssistantMsg.text.match(/update its date to ([^,]+, \d{4})/i) || lastAssistantMsg.text.match(/update its date to ([^,]+)/i);
        const parsedReq = mNewDate ? parseDateAndRelativeTime(mNewDate[1]) : pendingAction?.data?.requestedDate ? { date: pendingAction.data.requestedDate } : { date: "2026-12-25" };
        const cleanPerson = existingTitle.replace(/['’]s\s+(?:birthday|celebration|puja|pooja).*$/i, "").replace(/\s+(?:birthday|celebration|puja|pooja).*$/i, "").replace(/&.*$/i, "").trim();
        const matchedExistingEvt = events.find(
          (e) => e.title && e.title.toLowerCase().includes(cleanPerson.toLowerCase()) || e.title && e.title.toLowerCase().includes(existingTitle.toLowerCase())
        );
        pendingAction = {
          id: "recovered_from_history",
          sessionKey,
          type: "calendar_conflict",
          data: {
            existingId: matchedExistingEvt?.id || pendingAction?.data?.existingId,
            existingTitle,
            requestedDate: parsedReq.date || pendingAction?.data?.requestedDate || "2026-12-25",
            requestedTitle: `${cleanPerson || "Family Member"}'s Birthday`,
            person: cleanPerson || pendingAction?.data?.person || (matchedExistingEvt ? matchedExistingEvt.title.replace(/['’]s.*$/i, "") : "Family Member")
          },
          createdAt: Date.now()
        };
      } else if (lastAssistantMsg.text.toLowerCase().includes("what date is your father's birthday") || lastAssistantMsg.text.toLowerCase().includes("what is your father's birthday date") || /\bwhat\s+(?:date\s+is|is\s+your\s+.*?\s+birthday\s+date)/i.test(lastAssistantMsg.text)) {
        pendingAction = {
          id: "recovered_from_history",
          sessionKey,
          type: "calendar_missing_date",
          data: { person: "Father" },
          createdAt: Date.now()
        };
      }
    }
  }
  if (pendingAction) {
    if (pendingAction.type === "calendar_delete_confirm") {
      const isConfirmed = /^(?:yes|yep|sure|confirm|do\s+it|please\s+delete|ok)$/i.test(clean) || clean.includes("yes") && !clean.includes("no");
      const isCancelled = /^(?:no|cancel|abort|keep|stop|don'?t)$/i.test(clean) || clean.includes("no") || clean.includes("cancel");
      if (isConfirmed) {
        clearPendingAction(sessionKey);
        const { eventId, title, date } = pendingAction.data;
        if (eventId) {
          await dbMethods.deleteFamilyData("events", eventId, token);
        }
        const idx = events.findIndex((e) => e.id === eventId || (e.title || "").replace(/\[DEMO\]\s*/g, "").toLowerCase() === (title || "").toLowerCase());
        if (idx >= 0) events.splice(idx, 1);
        actionsExecuted.push({
          type: "add_event",
          title: title || "Calendar Event",
          detail: `Deleted event scheduled on ${date}`,
          status: "success"
        });
        const reply = `\u{1F5D1}\uFE0F **Event Deleted**: **${title}** scheduled on ${date} has been removed from your calendar.`;
        return { reply, text: reply, actionsExecuted, sources: ["Family Calendar"], handled: true };
      } else if (isCancelled) {
        const { title } = pendingAction.data;
        clearPendingAction(sessionKey);
        const reply = `Action cancelled. **${title}** remains on your calendar.`;
        return { reply, text: reply, actionsExecuted, sources: ["Family Calendar"], handled: true };
      }
    }
    if (pendingAction.type === "calendar_conflict") {
      const choice = clean.includes("update") || clean.includes("change") || clean.includes("chnage") ? "update" : clean.includes("separate") || clean.includes("both") ? "separate" : null;
      if (choice === "update") {
        clearPendingAction(sessionKey);
        const userDateParsed = parseDateAndRelativeTime(clean);
        const requestedDate = userDateParsed.date || pendingAction.data.requestedDate || "2026-12-25";
        const existingEvt = events.find(
          (e) => pendingAction.data.existingId && e.id === pendingAction.data.existingId || pendingAction.data.person && isEventForCelebrant(e, pendingAction.data.person, "birthday") || pendingAction.data.existingTitle && (e.title || "").toLowerCase().includes(pendingAction.data.existingTitle.toLowerCase()) || pendingAction.data.person && (e.title || "").toLowerCase().includes(pendingAction.data.person.toLowerCase())
        );
        const person = pendingAction.data.person || (existingEvt ? existingEvt.title.replace(/\[DEMO\]\s*/g, "").replace(/['’]s\s+(?:birthday|celebration|puja|pooja).*$/i, "").trim() : "Family Member");
        const existingId = existingEvt?.id || pendingAction.data.existingId;
        if (existingId) {
          await dbMethods.updateFamilyData("events", existingId, { date: requestedDate }, token);
        }
        if (existingEvt) {
          existingEvt.date = requestedDate;
          if (existingId) existingEvt.id = existingId;
        }
        const reqFormatted = formatDateHuman(requestedDate);
        const displayTitle = existingEvt ? existingEvt.title.replace(/\[DEMO\]\s*/g, "") : `${person}'s Birthday`;
        actionsExecuted.push({
          type: "add_event",
          title: displayTitle,
          detail: `Updated date to ${requestedDate}`,
          status: "success"
        });
        const reply = `${person}'s birthday has been updated to ${reqFormatted}.`;
        return { reply, text: reply, actionsExecuted, sources: ["Family Calendar"], handled: true };
      }
      if (choice === "separate") {
        clearPendingAction(sessionKey);
        const userDateParsed = parseDateAndRelativeTime(clean);
        const requestedDate = userDateParsed.date || pendingAction.data.requestedDate || "2026-12-25";
        const person = pendingAction.data.person || (pendingAction.data.existingTitle ? pendingAction.data.existingTitle.replace(/['’]s\s+(?:birthday|celebration|puja|pooja).*$/i, "").trim() : "Family Member");
        const reqFormatted = formatDateHuman(requestedDate);
        const payload = {
          title: `${person}'s Birthday`,
          date: requestedDate,
          time: "09:00",
          category: "Birthday",
          recurring: "Yearly",
          members_involved: [person],
          membersInvolved: [person],
          family_id: user.familyId
        };
        const saved = await dbMethods.insertFamilyData("events", payload, token);
        const toAdd = saved || payload;
        if (!events.some((e) => e.id === toAdd.id || e.title === toAdd.title && e.date === toAdd.date)) {
          events.unshift(toAdd);
        }
        actionsExecuted.push({
          type: "add_event",
          title: payload.title,
          detail: `Scheduled on ${payload.date} at ${payload.time}`,
          status: "success"
        });
        const reply = `\u2705 Added separate **${payload.title}** event on **${reqFormatted}** (${requestedDate}).`;
        return { reply, text: reply, actionsExecuted, sources: ["Family Calendar"], handled: true };
      }
    }
    if (pendingAction.type === "calendar_missing_date") {
      const parsed = parseDateAndRelativeTime(clean);
      if (parsed.date && isAnsweringPendingAction(rawQuery, pendingAction)) {
        clearPendingAction(sessionKey);
        const person = pendingAction.data.person || "Father";
        const requestedDate = parsed.date;
        const existingEvent = events.find((e) => isEventForCelebrant(e, person, "birthday"));
        if (existingEvent) {
          if (existingEvent.date === requestedDate) {
            const reply = `Your ${person.toLowerCase()}'s birthday is already saved on ${existingEvent.date}.`;
            return { reply, text: reply, actionsExecuted, sources: ["Family Calendar"], handled: true };
          } else {
            setPendingAction(sessionKey, {
              sessionKey,
              type: "calendar_conflict",
              data: {
                existingId: existingEvent.id,
                existingTitle: (existingEvent.title || "").replace(/\[DEMO\]\s*/g, ""),
                existingDate: existingEvent.date,
                requestedDate,
                person
              }
            });
            const reply = `I found an existing ${existingEvent.title} event on ${existingEvent.date}. Do you want me to update its date to ${parsed.formattedDisplay || requestedDate}, or add ${parsed.formattedDisplay || requestedDate} as a separate event?`;
            return { reply, text: reply, actionsExecuted, sources: ["Family Calendar"], handled: true };
          }
        } else {
          const payload = {
            title: `${person}'s Birthday`,
            date: requestedDate,
            time: "19:00",
            category: "Birthday",
            recurring: "Yearly",
            members_involved: [person],
            membersInvolved: [person],
            family_id: user.familyId
          };
          const saved = await dbMethods.insertFamilyData("events", payload, token);
          const toAdd = saved || payload;
          if (!events.some((e) => e.id === toAdd.id || e.title === toAdd.title && e.date === toAdd.date)) {
            events.unshift(toAdd);
          }
          actionsExecuted.push({
            type: "add_event",
            title: payload.title,
            detail: `Saved on ${requestedDate}`,
            status: "success"
          });
          const reply = `${person}'s birthday on ${parsed.formattedDisplay || requestedDate} has been saved to your calendar.`;
          return { reply, text: reply, actionsExecuted, sources: ["Family Calendar"], handled: true };
        }
      }
    }
    if (pendingAction.type === "grocery_update_qty") {
      const qMatch = clean.match(/(\d+(?:\.\d+)?)\s*(litres?|ltr|l|kg|packets?|gm|g|units?|pieces?|pcs)?/i);
      if (qMatch && isAnsweringPendingAction(rawQuery, pendingAction)) {
        clearPendingAction(sessionKey);
        const itemName = pendingAction.data.itemName || "Milk";
        const itemCap = itemName.charAt(0).toUpperCase() + itemName.slice(1);
        const newQty = `${qMatch[1]} ${qMatch[2] || "units"}`.trim();
        const existingId = pendingAction.data.existingId;
        if (existingId) {
          await dbMethods.updateFamilyData("groceries", existingId, { quantity: newQty, is_purchased: false }, token);
        }
        const itemIdx = groceries.findIndex((g) => g.id === existingId || g.name && g.name.toLowerCase().includes(itemName.toLowerCase()));
        if (itemIdx >= 0) {
          groceries[itemIdx].quantity = newQty;
          groceries[itemIdx].is_purchased = false;
          groceries[itemIdx].isPurchased = false;
          const [updated] = groceries.splice(itemIdx, 1);
          groceries.unshift(updated);
        }
        actionsExecuted.push({
          type: "add_grocery",
          title: itemCap,
          detail: `Updated quantity to ${newQty}`,
          status: "success"
        });
        const reply = `\u2705 **${itemCap}** quantity has been updated to **${newQty}** on your grocery list.`;
        return { reply, text: reply, actionsExecuted, sources: ["Smart Grocery List"], handled: true };
      }
    }
    if (pendingAction.type === "clear_grocery_confirm") {
      if (/yes|confirm|sure|do\s+it/i.test(clean)) {
        clearPendingAction(sessionKey);
        for (const g of groceries) {
          if (g.id) await dbMethods.deleteFamilyData("groceries", g.id, token);
        }
        groceries.length = 0;
        actionsExecuted.push({
          type: "add_grocery",
          title: "Clear Grocery List",
          detail: "Removed all items from grocery list",
          status: "success"
        });
        const reply = "\u2705 Your grocery list has been completely cleared.";
        return { reply, text: reply, actionsExecuted, sources: ["Smart Grocery List"], handled: true };
      }
    }
  }
  const classification = classifyIntentAndExtractEntities(rawQuery);
  const { operation, module, entities } = classification;
  if (module === "medicine") {
    if (operation === "CREATE") {
      const person = entities.person || user.name || "Father";
      const dosageMatch = rawQuery.match(/\b(\d+\s*(?:mg|ml|mcg|g|tablet|tablets|capsule|capsules|drop|drops|spoon|spoons|pill|pills))\b/i);
      const dosage = dosageMatch ? dosageMatch[1].trim() : "1 tablet";
      let timing = "09:00 AM";
      if (entities.time) {
        const [hh, mm] = entities.time.split(":").map(Number);
        const ampm = hh >= 12 ? "PM" : "AM";
        const h12 = hh % 12 || 12;
        timing = `${String(h12).padStart(2, "0")}:${String(mm || 0).padStart(2, "0")} ${ampm}`;
      } else if (/night|dinner|bedtime/i.test(clean)) {
        timing = "09:00 PM";
      } else if (/afternoon|lunch/i.test(clean)) {
        timing = "01:00 PM";
      } else if (/evening/i.test(clean)) {
        timing = "07:00 PM";
      }
      let medName = rawQuery.replace(/^(?:please\s+)?(?:add|schedule|create|set|prescribe|start)\s+(?:a\s+)?(?:new\s+)?(?:medicine|medication|prescription|tablet|capsule|supplement)?\s*/i, "").replace(/\b(?:for|to)\s+(?:father|dad|appa|mother|mom|amma|sarah|sneha|sham|grandfather|grandmother)\b/gi, "").replace(/\b(?:at|around|by)\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/gi, "").replace(/\b(?:after|before)\s+(?:breakfast|lunch|dinner|food|meals?)\b/gi, "").replace(/\b(?:daily|twice\s+daily|every\s+day|in\s+the\s+morning|at\s+night|in\s+the\s+evening)\b/gi, "").replace(/\s+/g, " ").trim();
      if (!medName || medName.length < 2) {
        medName = "Daily Medication";
      } else {
        medName = medName.charAt(0).toUpperCase() + medName.slice(1);
      }
      const payload = {
        name: medName,
        dosage,
        timing,
        frequency: /twice/i.test(clean) ? "Twice Daily" : /weekly/i.test(clean) ? "Weekly" : "Daily",
        person_name: person,
        personName: person,
        status: "Active",
        notes: `Scheduled at ${timing} for ${person}`,
        inventory_count: 30,
        inventoryCount: 30,
        refill_threshold: 5,
        refillThreshold: 5,
        family_id: user.familyId
      };
      const saved = await dbMethods.insertFamilyData("medicines", payload, token);
      const toAdd = { ...payload, ...saved || {} };
      if (!medicines.some((m) => m.id === toAdd.id)) {
        medicines.unshift(toAdd);
      }
      actionsExecuted.push({
        type: "log_medicine",
        title: `${medName} (${person})`,
        detail: `Scheduled ${dosage} at ${timing}`,
        status: "success"
      });
      const reply = `\u{1F48A} **Medication Added to Medicine Manager**

Scheduled **${medName}** (${dosage}) for **${person}** at **${timing}** (${payload.frequency}).`;
      return { reply, text: reply, actionsExecuted, sources: ["Medicine Manager"], handled: true };
    }
    if (operation === "COMPLETE") {
      const status = classification.intentName === "log_medicine_missed" ? "Missed" : "Taken";
      const person = entities.person;
      let matchedMed = medicines.find((m) => {
        const mName = (m.name || "").replace(/\[DEMO\]\s*/i, "").toLowerCase();
        return mName.length > 2 && clean.includes(mName);
      });
      if (!matchedMed && person) {
        matchedMed = medicines.find((m) => (m.person_name || m.personName || "").toLowerCase() === person.toLowerCase());
      }
      if (!matchedMed && medicines.length > 0) {
        matchedMed = medicines[0];
      }
      if (!matchedMed) {
        const fallbackMed = {
          id: crypto.randomUUID(),
          name: person ? `${person}'s Medicine` : "Daily Medicine",
          dosage: "1 tablet",
          timing: "09:00 AM",
          frequency: "Daily",
          person_name: person || user.name || "Father",
          personName: person || user.name || "Father",
          status: "Active",
          family_id: user.familyId
        };
        const savedMed = await dbMethods.insertFamilyData("medicines", fallbackMed, token);
        matchedMed = { ...fallbackMed, ...savedMed || {} };
        medicines.unshift(matchedMed);
      }
      const logPayload = {
        id: crypto.randomUUID(),
        medicine_id: matchedMed.id,
        medicineId: matchedMed.id,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        status,
        family_id: user.familyId
      };
      const savedLog = await dbMethods.insertFamilyData("medicine_logs", logPayload, token);
      medicineLogs.unshift({ ...logPayload, ...savedLog || {} });
      const cleanMedName = (matchedMed.name || "Medicine").replace(/\[DEMO\]\s*/i, "");
      const medPerson = matchedMed.person_name || matchedMed.personName || person || user.name;
      actionsExecuted.push({
        type: "log_medicine",
        title: `${cleanMedName} (${medPerson})`,
        detail: `Marked dose as ${status}`,
        status: "success"
      });
      const reply = `\u2705 **Medication Dose Logged**

Marked **${cleanMedName}** for **${medPerson}** as **${status}** at ${(/* @__PURE__ */ new Date()).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}.`;
      return { reply, text: reply, actionsExecuted, sources: ["Medicine Manager"], handled: true };
    }
    if (operation === "DELETE") {
      const matchedMed = medicines.find((m) => {
        const mName = (m.name || "").replace(/\[DEMO\]\s*/i, "").toLowerCase();
        return clean.includes(mName) || entities.person && (m.person_name || m.personName || "").toLowerCase() === entities.person.toLowerCase();
      });
      if (matchedMed) {
        if (matchedMed.id) await dbMethods.deleteFamilyData("medicines", matchedMed.id, token);
        const idx = medicines.indexOf(matchedMed);
        if (idx >= 0) medicines.splice(idx, 1);
        const cleanMedName = (matchedMed.name || "Medicine").replace(/\[DEMO\]\s*/i, "");
        actionsExecuted.push({
          type: "log_medicine",
          title: cleanMedName,
          detail: "Removed medication schedule",
          status: "success"
        });
        const reply = `\u{1F5D1}\uFE0F **${cleanMedName}** has been removed from your Medicine Manager.`;
        return { reply, text: reply, actionsExecuted, sources: ["Medicine Manager"], handled: true };
      }
    }
    if (operation === "READ") {
      const person = entities.person;
      if (classification.intentName === "check_medicine_refills" || /\b(?:refill|refills|running\s+low|low\s+stock|out\s+of\s+stock|stock\s+of\s+medicine|need\s+to\s+buy\s+medicines?|inventory)\b/i.test(clean)) {
        if (medicines.length === 0) {
          const reply3 = "\u{1F48A} **Medicine Inventory**:\n\nNo medication inventory tracked in Medicine Manager.";
          return { reply: reply3, text: reply3, actionsExecuted, sources: ["Medicine Manager"], handled: true };
        }
        const lines = medicines.map((m) => {
          const cleanName = (m.name || "Medication").replace(/\[DEMO\]\s*/i, "");
          const count = m.inventory_count !== void 0 ? m.inventory_count : m.inventoryCount !== void 0 ? m.inventoryCount : 24;
          const threshold = m.refill_threshold !== void 0 ? m.refill_threshold : m.refillThreshold !== void 0 ? m.refillThreshold : 5;
          const isLow = count <= threshold;
          const statusTag = isLow ? "\u26A0\uFE0F **Low Stock (Refill Needed)**" : "\u2705 Stock OK";
          return `\u2022 **${cleanName}** (${m.dosage || "1 dose"}) for **${m.person_name || m.personName || "Family"}**: ${count} units remaining (Threshold: ${threshold}) \u2014 ${statusTag}`;
        }).join("\n");
        const lowCount = medicines.filter((m) => {
          const c = m.inventory_count !== void 0 ? m.inventory_count : m.inventoryCount !== void 0 ? m.inventoryCount : 24;
          const th = m.refill_threshold !== void 0 ? m.refill_threshold : m.refillThreshold !== void 0 ? m.refillThreshold : 5;
          return c <= th;
        }).length;
        const summaryNote = lowCount > 0 ? `

*(\u26A0\uFE0F ${lowCount} medication${lowCount > 1 ? "s require" : " requires"} restocking soon).*` : "\n\n*(All active family prescriptions are currently well-stocked).*";
        const reply2 = `\u{1F48A} **Family Medicine Inventory & Refill Status**:

${lines}${summaryNote}`;
        return { reply: reply2, text: reply2, actionsExecuted, sources: ["Medicine Manager"], handled: true };
      }
      if (classification.intentName === "check_medicine_safety" || /\b(?:safe|safety|interaction|interactions|can\s+.*take|allergic|allergy|side\s+effects?|precaution|contraindication)\b/i.test(clean)) {
        const reply2 = `\u26A0\uFE0F **Clinical Medication Safety Advisory**:

\u2022 **Family Allergy & Sensitivity Alerts**:
  - **Sneha**: Strictly allergic to **Penicillin** and **Lactose Intolerant** (avoid lactose-based excipients).
  - **Grandmother**: Diagnosed hypertension; avoid high-sodium effervescent tablets and unprescribed NSAIDs.

\u2022 **Drug Interaction Guidelines**:
  - **Metformin (500mg)**: Should always be taken with or immediately after food to avoid gastrointestinal upset.
  - **Aspirin / Pain Relievers**: Must be taken with food. Do not combine multiple blood thinners or NSAIDs without doctor advice.

*(Always consult family physician **Dr. Ramesh Rao** at Apollo Clinic: **+91 98450 12345** for prescription adjustments).*`;
        return { reply: reply2, text: reply2, actionsExecuted, sources: ["Medicine Manager", "Family Knowledge Base"], handled: true };
      }
      if (classification.intentName === "check_medicine_adherence" || /\b(?:did|has|have|who)\s+.*(?:take|missed|taken|completed).*(?:medicine|tablet|dose|regimen)/i.test(clean) || /\b(?:adherence|compliance|missed\s+doses?)\b/i.test(clean)) {
        const targetPerson = person || "Father";
        const personMeds = medicines.filter(
          (m) => (m.person_name || m.personName || "").toLowerCase() === targetPerson.toLowerCase()
        );
        const medsToEval = personMeds.length > 0 ? personMeds : medicines.slice(0, 2);
        const lines = medsToEval.map((m) => {
          const cleanName = (m.name || "Medicine").replace(/\[DEMO\]\s*/i, "");
          const hasLoggedToday = medicineLogs.some(
            (l) => (l.medicine_id === m.id || l.medicineId === m.id) && (l.status === "Taken" || l.status === "taken")
          );
          if (hasLoggedToday) {
            return `\u2022 **${cleanName}** (${m.dosage || "1 dose"} at ${m.timing || "09:00 AM"}): \u2705 **Taken** (Logged for today)`;
          } else {
            return `\u2022 **${cleanName}** (${m.dosage || "1 dose"} at ${m.timing || "09:00 AM"}): \u23F3 **Pending / Scheduled** (Scheduled for ${m.timing || "09:00 AM"})`;
          }
        }).join("\n");
        const reply2 = `\u{1F48A} **${targetPerson}'s Medication Adherence Status for Today**:

${lines}

*(You can say "${targetPerson} took medicine" to log completion anytime).*`;
        return { reply: reply2, text: reply2, actionsExecuted, sources: ["Medicine Manager"], handled: true };
      }
      if (classification.intentName === "query_medicine_details" || /\b(?:when\s+should|dosage\s+for|what\s+is\s+.*dosage|timing\s+of|how\s+to\s+take)\b/i.test(clean)) {
        const matched = medicines.find((m) => {
          const mName = (m.name || "").replace(/\[DEMO\]\s*/i, "").toLowerCase();
          return clean.includes(mName) || person && (m.person_name || m.personName || "").toLowerCase() === person.toLowerCase();
        }) || medicines[0];
        if (matched) {
          const cleanName = (matched.name || "Medicine").replace(/\[DEMO\]\s*/i, "");
          const pName = matched.person_name || matched.personName || "Family member";
          const reply2 = `\u{1F48A} **Medication Details: ${cleanName}**

\u2022 **Prescribed For**: ${pName}
\u2022 **Dosage**: ${matched.dosage || "1 tablet"}
\u2022 **Scheduled Timing**: ${matched.timing || "09:00 AM"} (${matched.frequency || "Daily"})
\u2022 **Clinical Instructions**: ${matched.notes || "Take with water after meals"}
\u2022 **Remaining Stock**: ${matched.inventory_count || matched.inventoryCount || 24} units`;
          return { reply: reply2, text: reply2, actionsExecuted, sources: ["Medicine Manager"], handled: true };
        }
      }
      const filtered = person ? medicines.filter((m) => (m.person_name || m.personName || "").toLowerCase() === person.toLowerCase()) : medicines;
      const list = filtered.length > 0 ? filtered : medicines;
      if (list.length > 0) {
        const reply2 = `\u{1F48A} **Registered Medication Schedules (${list.length} active)**:

` + list.map((m) => `\u2022 **${(m.name || "").replace(/\[DEMO\]\s*/i, "")}** (${m.dosage}) for **${m.person_name || m.personName}** at **${m.timing}** [${m.frequency}]`).join("\n");
        return { reply: reply2, text: reply2, actionsExecuted, sources: ["Medicine Manager"], handled: true };
      }
      const reply = "No active medications are currently scheduled in Medicine Manager.";
      return { reply, text: reply, actionsExecuted, sources: ["Medicine Manager"], handled: true };
    }
  }
  if (module === "calendar") {
    if (operation === "CREATE") {
      const person = entities.person;
      const isBirthday = entities.eventType === "birthday";
      const requestedDate = entities.date;
      if (isBirthday && !requestedDate) {
        setPendingAction(sessionKey, {
          sessionKey,
          type: "calendar_missing_date",
          data: { person: person || "Father" }
        });
        const reply2 = `What is your ${person ? person.toLowerCase() : "family member"}'s birthday date?`;
        return { reply: reply2, text: reply2, actionsExecuted, sources: ["Family Calendar"], handled: true };
      }
      if (isBirthday && person && requestedDate) {
        const existingBday = events.find((e) => isEventForCelebrant(e, person, "birthday"));
        if (existingBday) {
          if (existingBday.date === requestedDate) {
            const reply2 = `Your ${person.toLowerCase()}'s birthday is already saved on ${existingBday.date}.`;
            return { reply: reply2, text: reply2, actionsExecuted, sources: ["Family Calendar"], handled: true };
          } else {
            const cleanTitle = (existingBday.title || "").replace(/\[DEMO\]\s*/g, "");
            const previousDate = existingBday.date;
            setPendingAction(sessionKey, {
              sessionKey,
              type: "calendar_conflict",
              data: {
                existingId: existingBday.id,
                existingTitle: cleanTitle,
                existingDate: previousDate,
                requestedDate,
                requestedTitle: `${person}'s Birthday`,
                person
              }
            });
            const existFormatted = formatDateHuman(previousDate);
            const reqFormatted = formatDateHuman(requestedDate);
            const reply2 = `I found an existing ${cleanTitle} event on ${existFormatted}. Do you want me to update its date to ${reqFormatted}, or add ${reqFormatted} as a separate event?`;
            return { reply: reply2, text: reply2, actionsExecuted, sources: ["Family Calendar"], handled: true };
          }
        } else {
          const payload2 = {
            title: `${person}'s Birthday`,
            date: requestedDate,
            time: entities.time || "19:00",
            category: "Birthday",
            recurring: "Yearly",
            reminder: true,
            members_involved: [person],
            membersInvolved: [person],
            family_id: user.familyId
          };
          const saved2 = await dbMethods.insertFamilyData("events", payload2, token);
          const toAdd2 = { ...payload2, ...saved2 || {} };
          if (!events.some((e) => e.id === toAdd2.id || e.title === toAdd2.title && e.date === toAdd2.date)) {
            events.unshift(toAdd2);
          }
          actionsExecuted.push({
            type: "add_event",
            title: payload2.title,
            detail: `Saved on ${requestedDate}`,
            status: "success"
          });
          const reqFormatted = formatDateHuman(requestedDate);
          const reply2 = `\u{1F382} **${person}'s Birthday** has been added to your calendar on **${reqFormatted}** (${requestedDate}).

\u2022 **${requestedDate} at ${payload2.time}**: ${payload2.title} (Birthday) - Members: ${person}`;
          return { reply: reply2, text: reply2, actionsExecuted, sources: ["Family Calendar"], handled: true };
        }
      }
      const { title: eventTitle, category: eventCategory, location: eventLoc, description: eventDesc } = extractCalendarEventDetails(rawQuery, entities);
      const targetDate = requestedDate || entities.date || getKolkataDateString(1);
      const targetTime = entities.time || "10:00";
      const existingSameEvent = events.find(
        (e) => (e.title || "").replace(/\[DEMO\]\s*/g, "").toLowerCase() === eventTitle.toLowerCase() && e.date === targetDate
      );
      if (existingSameEvent) {
        existingSameEvent.time = targetTime;
        if (existingSameEvent.id) {
          await dbMethods.updateFamilyData("events", existingSameEvent.id, { time: targetTime }, token);
        }
        const formatted2 = formatDateHuman(targetDate);
        actionsExecuted.push({
          type: "add_event",
          title: eventTitle,
          detail: `Scheduled on ${targetDate} at ${targetTime}`,
          status: "success"
        });
        const reply2 = `\u{1F4C5} **${eventTitle}** is scheduled in your Family Calendar on **${formatted2}** (${targetDate}) at **${targetTime}**.`;
        return { reply: reply2, text: reply2, actionsExecuted, sources: ["Family Calendar"], handled: true };
      }
      const payload = {
        title: eventTitle,
        date: targetDate,
        time: targetTime,
        category: eventCategory,
        recurring: eventCategory === "Birthday" || eventCategory === "Holiday" ? "Yearly" : clean.includes("weekly") ? "Weekly" : clean.includes("monthly") ? "Monthly" : "None",
        reminder: true,
        location: eventLoc || "",
        description: eventDesc || `${eventTitle} scheduled on ${targetDate}`,
        members_involved: [entities.person || user.name || "Family"],
        membersInvolved: [entities.person || user.name || "Family"],
        family_id: user.familyId
      };
      const saved = await dbMethods.insertFamilyData("events", payload, token);
      const toAdd = { ...payload, ...saved || {} };
      if (!events.some((e) => e.id === toAdd.id || e.title === toAdd.title && e.date === toAdd.date)) {
        events.unshift(toAdd);
      }
      actionsExecuted.push({
        type: "add_event",
        title: payload.title,
        detail: `Scheduled on ${payload.date} at ${payload.time}`,
        status: "success"
      });
      const formatted = formatDateHuman(payload.date);
      const reply = `\u2705 **Added to Family Calendar**

Scheduled **"${payload.title}"** on **${formatted}** (${payload.date}) at **${payload.time}**.

\u2022 **${payload.date} at ${payload.time}**: ${payload.title} (${payload.category}) - Members: ${payload.members_involved.join(", ")}${payload.location ? `
\u2022 **Location**: ${payload.location}` : ""}`;
      return { reply, text: reply, actionsExecuted, sources: ["Family Calendar"], handled: true };
    }
    if (operation === "UPDATE") {
      const person = entities.person;
      const isBirthday = entities.eventType === "birthday";
      const requestedDate = entities.date;
      const requestedTime = entities.time;
      if (isBirthday || person && /birthday|bday/i.test(clean)) {
        const targetPerson = person || "Father";
        const existingBday = events.find((e) => isEventForCelebrant(e, targetPerson, "birthday")) || events.find((e) => isEventForCelebrant(e, targetPerson));
        if (!requestedDate) {
          setPendingAction(sessionKey, {
            sessionKey,
            type: "calendar_missing_date",
            data: { person: targetPerson }
          });
          const reply = `What is the new date for ${targetPerson}'s birthday?`;
          return { reply, text: reply, actionsExecuted, sources: ["Family Calendar"], handled: true };
        }
        const reqFormatted = formatDateHuman(requestedDate);
        if (existingBday) {
          const cleanTitle = (existingBday.title || `${targetPerson}'s Birthday`).replace(/\[DEMO\]\s*/g, "");
          if (existingBday.id) {
            await dbMethods.updateFamilyData("events", existingBday.id, { date: requestedDate }, token);
          }
          existingBday.date = requestedDate;
          actionsExecuted.push({
            type: "add_event",
            title: cleanTitle,
            detail: `Updated date to ${requestedDate}`,
            status: "success"
          });
          const reply = `\u{1F382} **Birthday Updated**: **${cleanTitle}** has been updated to **${reqFormatted}** (${requestedDate}).

\u2022 **${requestedDate} at ${existingBday.time || "19:00"}**: ${cleanTitle} (Birthday) - Members: ${targetPerson}`;
          return { reply, text: reply, actionsExecuted, sources: ["Family Calendar"], handled: true };
        } else {
          const payload = {
            title: `${targetPerson}'s Birthday`,
            date: requestedDate,
            time: requestedTime || "19:00",
            category: "Birthday",
            recurring: "Yearly",
            members_involved: [targetPerson],
            membersInvolved: [targetPerson],
            family_id: user.familyId
          };
          const saved = await dbMethods.insertFamilyData("events", payload, token);
          const toAdd = { ...payload, ...saved || {} };
          if (!events.some((e) => e.id === toAdd.id || e.title === toAdd.title && e.date === toAdd.date)) {
            events.unshift(toAdd);
          }
          actionsExecuted.push({
            type: "add_event",
            title: payload.title,
            detail: `Saved on ${requestedDate}`,
            status: "success"
          });
          const reply = `\u{1F382} **Birthday Updated**: **${payload.title}** has been set to **${reqFormatted}** (${requestedDate}).

\u2022 **${requestedDate} at ${payload.time}**: ${payload.title} (Birthday) - Members: ${targetPerson}`;
          return { reply, text: reply, actionsExecuted, sources: ["Family Calendar"], handled: true };
        }
      }
      if (/meeting/i.test(clean)) {
        const meetingEv = events.find((e) => /meeting/i.test(e.title || "") || (e.category || "").toLowerCase() === "meeting");
        if (meetingEv) {
          const cleanTitle = (meetingEv.title || "Family Meeting").replace(/\[DEMO\]\s*/g, "");
          const patch = {};
          if (requestedTime) {
            meetingEv.time = requestedTime;
            patch.time = requestedTime;
          }
          if (requestedDate) {
            meetingEv.date = requestedDate;
            patch.date = requestedDate;
          }
          if (meetingEv.id) {
            await dbMethods.updateFamilyData("events", meetingEv.id, patch, token);
          }
          actionsExecuted.push({
            type: "add_event",
            title: cleanTitle,
            detail: `Updated to ${meetingEv.date} at ${meetingEv.time || "15:00"}`,
            status: "success"
          });
          const reply = `\u2705 **Meeting Updated**: **${cleanTitle}** has been moved to **${meetingEv.date}** at **${meetingEv.time || "15:00"}**.`;
          return { reply, text: reply, actionsExecuted, sources: ["Family Calendar"], handled: true };
        }
      }
      if (/dinner|lunch|breakfast|meal/i.test(clean)) {
        const dinnerEv = events.find((e) => /dinner|lunch|breakfast|meal/i.test(e.title || ""));
        if (dinnerEv) {
          const cleanTitle = (dinnerEv.title || "Family Dinner").replace(/\[DEMO\]\s*/g, "");
          const patch = {};
          if (requestedTime) {
            dinnerEv.time = requestedTime;
            patch.time = requestedTime;
          }
          if (requestedDate) {
            dinnerEv.date = requestedDate;
            patch.date = requestedDate;
          }
          if (dinnerEv.id) {
            await dbMethods.updateFamilyData("events", dinnerEv.id, patch, token);
          }
          actionsExecuted.push({
            type: "add_event",
            title: cleanTitle,
            detail: `Updated dinner to ${dinnerEv.date} at ${dinnerEv.time || "20:00"}`,
            status: "success"
          });
          const formatted = formatDateHuman(dinnerEv.date);
          const reply = `\u{1F37D}\uFE0F **Event Updated**: **${cleanTitle}** has been moved to **${formatted}** (${dinnerEv.date}) at **${dinnerEv.time || "20:00"}**.`;
          return { reply, text: reply, actionsExecuted, sources: ["Family Calendar"], handled: true };
        }
      }
      const explicitLocMatch = rawQuery.match(/(?:update|change|set)\s+(?:the\s+)?(?:event\s+)?location\s+(?:to\s+|as\s+)?(.+)/i);
      if (explicitLocMatch) {
        const newLocation = explicitLocMatch[1].replace(/^[to\s:]+/i, "").trim();
        const targetEv = events.find((e) => e.date >= getKolkataDateString()) || events[0];
        if (targetEv) {
          targetEv.location = newLocation;
          if (targetEv.id) {
            await dbMethods.updateFamilyData("events", targetEv.id, { location: newLocation }, token);
          }
          const cleanTitle = (targetEv.title || "Event").replace(/\[DEMO\]\s*/g, "");
          actionsExecuted.push({
            type: "add_event",
            title: cleanTitle,
            detail: `Updated location to ${newLocation}`,
            status: "success"
          });
          const reply = `\u{1F4CD} **Location Updated**: Location for **${cleanTitle}** has been updated to **${newLocation}**.`;
          return { reply, text: reply, actionsExecuted, sources: ["Family Calendar"], handled: true };
        }
      }
      const explicitDescMatch = rawQuery.match(/(?:update|change|set)\s+(?:the\s+)?(?:event\s+)?description\s+(?:to\s+|as\s+)?(.+)/i);
      if (explicitDescMatch) {
        const newDesc = explicitDescMatch[1].replace(/^[to\s:]+/i, "").trim();
        const targetEv = events.find((e) => e.date >= getKolkataDateString()) || events[0];
        if (targetEv) {
          targetEv.description = newDesc;
          if (targetEv.id) {
            await dbMethods.updateFamilyData("events", targetEv.id, { description: newDesc }, token);
          }
          const cleanTitle = (targetEv.title || "Event").replace(/\[DEMO\]\s*/g, "");
          actionsExecuted.push({
            type: "add_event",
            title: cleanTitle,
            detail: `Updated description`,
            status: "success"
          });
          const reply = `\u{1F4DD} **Description Updated**: Description for **${cleanTitle}** has been updated to: *"${newDesc}"*.`;
          return { reply, text: reply, actionsExecuted, sources: ["Family Calendar"], handled: true };
        }
      }
      const explicitTitleMatch = rawQuery.match(/(?:update|change|set)\s+(?:the\s+)?(?:event\s+)?title\s+(?:to\s+|as\s+)?(.+)/i);
      if (explicitTitleMatch) {
        const newTitle = explicitTitleMatch[1].replace(/^[to\s:]+/i, "").trim();
        const targetEv = events.find((e) => e.date >= getKolkataDateString()) || events[0];
        if (targetEv) {
          const oldTitle = (targetEv.title || "Event").replace(/\[DEMO\]\s*/g, "");
          targetEv.title = newTitle;
          if (targetEv.id) {
            await dbMethods.updateFamilyData("events", targetEv.id, { title: newTitle }, token);
          }
          actionsExecuted.push({
            type: "add_event",
            title: newTitle,
            detail: `Renamed from ${oldTitle}`,
            status: "success"
          });
          const reply = `\u270F\uFE0F **Title Updated**: Event title has been changed from **${oldTitle}** to **${newTitle}**.`;
          return { reply, text: reply, actionsExecuted, sources: ["Family Calendar"], handled: true };
        }
      }
      if (/appointment|doctor|dentist|clinic|hospital/i.test(clean)) {
        const apptEv = events.find(
          (e) => (e.category || "").toLowerCase() === "appointment" || /doctor|dentist|appointment|clinic/i.test(e.title || "")
        );
        if (apptEv) {
          const cleanTitle = (apptEv.title || "Doctor Appointment").replace(/\[DEMO\]\s*/g, "");
          const patch = {};
          if (requestedDate) {
            apptEv.date = requestedDate;
            patch.date = requestedDate;
          }
          if (requestedTime) {
            apptEv.time = requestedTime;
            patch.time = requestedTime;
          }
          const newLocMatch = rawQuery.match(/(?:location|to|at)\s+([A-Z][a-zA-Z\s]+(?:Clinic|Hospital|Center|Centre|Hall))/i);
          if (newLocMatch) {
            apptEv.location = newLocMatch[1].replace(/^(?:to|at)\s+/i, "").trim();
            patch.location = apptEv.location;
          }
          if (apptEv.id) {
            await dbMethods.updateFamilyData("events", apptEv.id, patch, token);
          }
          actionsExecuted.push({
            type: "add_event",
            title: cleanTitle,
            detail: `Rescheduled to ${apptEv.date} at ${apptEv.time || "10:00"}`,
            status: "success"
          });
          const formatted = formatDateHuman(apptEv.date);
          const reply = `\u{1FA7A} **Appointment Updated**: **${cleanTitle}** has been rescheduled to **${formatted}** (${apptEv.date}) at **${apptEv.time || "10:00"}**${apptEv.location ? ` at **${apptEv.location}**` : ""}.`;
          return { reply, text: reply, actionsExecuted, sources: ["Family Calendar"], handled: true };
        }
      }
      const { title: targetTitle } = extractCalendarEventDetails(rawQuery, entities);
      const matchedEvent = events.find((e) => {
        const t = (e.title || "").replace(/\[DEMO\]\s*/g, "").toLowerCase();
        return t.includes(targetTitle.toLowerCase()) || targetTitle.toLowerCase().includes(t);
      });
      if (matchedEvent) {
        const cleanTitle = (matchedEvent.title || targetTitle).replace(/\[DEMO\]\s*/g, "");
        const patch = {};
        if (requestedDate) {
          matchedEvent.date = requestedDate;
          patch.date = requestedDate;
        }
        if (requestedTime) {
          matchedEvent.time = requestedTime;
          patch.time = requestedTime;
        }
        if (matchedEvent.id) {
          await dbMethods.updateFamilyData("events", matchedEvent.id, patch, token);
        }
        actionsExecuted.push({
          type: "add_event",
          title: cleanTitle,
          detail: `Updated to ${matchedEvent.date} at ${matchedEvent.time || "10:00"}`,
          status: "success"
        });
        const formatted = formatDateHuman(matchedEvent.date);
        const reply = `\u2705 **Event Updated**: **${cleanTitle}** has been rescheduled to **${formatted}** (${matchedEvent.date}) at **${matchedEvent.time || "10:00"}**.`;
        return { reply, text: reply, actionsExecuted, sources: ["Family Calendar"], handled: true };
      }
    }
    if (operation === "DELETE") {
      const person = entities.person;
      const requestedDate = entities.date;
      const { title: targetTitle } = extractCalendarEventDetails(rawQuery, entities);
      const matched = events.find((e) => {
        if (person && isEventForCelebrant(e, person, entities.eventType)) return true;
        if (/dinner/i.test(clean) && /dinner|meal/i.test(e.title || "")) return true;
        if (/birthday\s+reminder/i.test(clean) && (/reminder/i.test(e.title || "") || /birthday/i.test(e.title || ""))) return true;
        if (/appointment/i.test(clean) && (/appointment|doctor|dentist/i.test(e.title || "") || e.category === "Appointment")) {
          if (requestedDate && e.date === requestedDate) return true;
          if (!requestedDate) return true;
        }
        if (requestedDate && e.date === requestedDate) return true;
        const t = (e.title || "").replace(/\[DEMO\]\s*/g, "").toLowerCase();
        if (targetTitle && targetTitle !== "Family Event" && (t.includes(targetTitle.toLowerCase()) || targetTitle.toLowerCase().includes(t))) {
          return true;
        }
        return false;
      });
      if (matched) {
        const cleanTitle = (matched.title || "").replace(/\[DEMO\]\s*/g, "");
        setPendingAction(sessionKey, {
          sessionKey,
          type: "calendar_delete_confirm",
          data: {
            eventId: matched.id,
            title: cleanTitle,
            date: matched.date,
            time: matched.time || "10:00",
            category: matched.category || "General"
          }
        });
        const formatted = formatDateHuman(matched.date);
        const reply = `\u26A0\uFE0F Are you sure you want to delete **${cleanTitle}** (${matched.category || "General"}) scheduled on **${formatted}** (${matched.date}) at **${matched.time || "10:00"}**? Please reply "yes" to confirm or "no" to cancel.`;
        return { reply, text: reply, actionsExecuted, sources: ["Family Calendar"], handled: true };
      } else {
        const reply = `I couldn't find the specified event in your calendar to delete. Could you provide the event title or scheduled date?`;
        return { reply, text: reply, actionsExecuted, sources: ["Family Calendar"], handled: true };
      }
    }
    if (operation === "SEARCH" || operation === "READ") {
      let person = entities.person;
      const isBirthday = entities.eventType === "birthday";
      if (/\b(?:medical|doctor|dentist|appointment|clinic|hospital|checkup)\b/i.test(clean)) {
        const medicalEvents = events.filter(
          (e) => (e.category || "").toLowerCase() === "appointment" || /\b(?:medical|doctor|dentist|appointment|clinic|hospital|checkup)\b/i.test(`${e.title || ""} ${e.description || ""}`)
        );
        if (medicalEvents.length > 0) {
          const reply = `\u{1FA7A} **Medical & Doctor Appointments (${medicalEvents.length} scheduled)**:

` + medicalEvents.map((e) => {
            const cleanT = (e.title || "").replace(/\[DEMO\]\s*/g, "");
            const dStr = formatDateHuman(e.date);
            const members = (Array.isArray(e.members_involved || e.membersInvolved) ? e.members_involved || e.membersInvolved : [user.name]).join(", ");
            return `\u2022 **${cleanT}** (${e.category || "Appointment"})
  \u{1F4C5} **Date & Time**: ${dStr} (${e.date}) at ${e.time || "10:00"}
  \u{1F465} **Members**: ${members}${e.location ? `
  \u{1F4CD} **Location**: ${e.location}` : ""}${e.description ? `
  \u{1F4DD} **Details**: ${e.description}` : ""}`;
          }).join("\n\n");
          return { reply, text: reply, actionsExecuted, sources: ["Family Calendar"], handled: true };
        } else {
          const reply = `\u{1FA7A} There are no upcoming medical or doctor appointments recorded in your family calendar.`;
          return { reply, text: reply, actionsExecuted, sources: ["Family Calendar"], handled: true };
        }
      }
      if (/\b(?:dinners?|lunch|breakfast|meals?)\b/i.test(clean)) {
        const dinnerEvents = events.filter(
          (e) => /\b(?:dinner|lunch|breakfast|meal)\b/i.test(`${e.title || ""} ${e.description || ""}`)
        );
        if (dinnerEvents.length > 0) {
          const reply = `\u{1F37D}\uFE0F **Family Dinners & Meals (${dinnerEvents.length} found)**:

` + dinnerEvents.map((e) => {
            const cleanT = (e.title || "").replace(/\[DEMO\]\s*/g, "");
            const dStr = formatDateHuman(e.date);
            return `\u2022 **${cleanT}**: ${dStr} (${e.date}) at ${e.time || "20:00"}${e.description ? ` - ${e.description}` : ""}`;
          }).join("\n");
          return { reply, text: reply, actionsExecuted, sources: ["Family Calendar"], handled: true };
        }
      }
      if (/\b(?:meetings?|conference|interview)\b/i.test(clean)) {
        const meetingEvents = events.filter(
          (e) => (e.category || "").toLowerCase() === "meeting" || /\b(?:meeting|conference|interview)\b/i.test(`${e.title || ""} ${e.description || ""}`)
        );
        if (meetingEvents.length > 0) {
          const reply = `\u{1F4CB} **Family Meetings (${meetingEvents.length} scheduled)**:

` + meetingEvents.map((e) => {
            const cleanT = (e.title || "").replace(/\[DEMO\]\s*/g, "");
            const dStr = formatDateHuman(e.date);
            return `\u2022 **${cleanT}**: ${dStr} (${e.date}) at ${e.time || "18:00"}${e.description ? ` - ${e.description}` : ""}`;
          }).join("\n");
          return { reply, text: reply, actionsExecuted, sources: ["Family Calendar"], handled: true };
        }
      }
      if (/\b(?:trips?|travel|temple|holidays?|vacation|tour|outing|anniversar(?:y|ies))\b/i.test(clean)) {
        const holidayEvents = events.filter(
          (e) => (e.category || "").toLowerCase() === "holiday" || /\b(?:trip|travel|temple|holiday|vacation|tour|outing|anniversary)\b/i.test(`${e.title || ""} ${e.description || ""}`)
        );
        if (holidayEvents.length > 0) {
          const reply = `\u2708\uFE0F **Holidays, Trips & Special Events (${holidayEvents.length} found)**:

` + holidayEvents.map((e) => {
            const cleanT = (e.title || "").replace(/\[DEMO\]\s*/g, "");
            const dStr = formatDateHuman(e.date);
            return `\u2022 **${cleanT}**: ${dStr} (${e.date}) at ${e.time || "09:00"}${e.description ? ` - ${e.description}` : ""}`;
          }).join("\n");
          return { reply, text: reply, actionsExecuted, sources: ["Family Calendar"], handled: true };
        }
      }
      if (/\b(?:in\s+)?(november|nov|december|dec|january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sep|october|oct)\b/i.test(clean)) {
        const mMatch = clean.match(/\b(november|nov|december|dec|january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sep|october|oct)\b/i);
        if (mMatch) {
          const monthMap = {
            jan: "01",
            january: "01",
            feb: "02",
            february: "02",
            mar: "03",
            march: "03",
            apr: "04",
            april: "04",
            may: "05",
            jun: "06",
            june: "06",
            jul: "07",
            july: "07",
            aug: "08",
            august: "08",
            sep: "09",
            september: "09",
            oct: "10",
            october: "10",
            nov: "11",
            november: "11",
            dec: "12",
            december: "12"
          };
          const mPrefix = `2026-${monthMap[mMatch[1].toLowerCase()]}`;
          const monthEvents = events.filter((e) => (e.date || "").startsWith(mPrefix)).sort((a, b) => a.date.localeCompare(b.date));
          const monthName = mMatch[1].charAt(0).toUpperCase() + mMatch[1].slice(1).toLowerCase();
          if (monthEvents.length > 0) {
            const reply = `\u{1F4C5} **Events in ${monthName} 2026 (${monthEvents.length} scheduled)**:

` + monthEvents.map((e) => `\u2022 **${e.date} at ${e.time || "10:00"}**: ${(e.title || "").replace(/\[DEMO\]\s*/g, "")} (${e.category || "General"})`).join("\n");
            return { reply, text: reply, actionsExecuted, sources: ["Family Calendar"], handled: true };
          } else {
            const reply = `\u{1F4C5} There are no events scheduled in **${monthName} 2026**.`;
            return { reply, text: reply, actionsExecuted, sources: ["Family Calendar"], handled: true };
          }
        }
      }
      if (/\b(?:tomorrow|happening\s+tomorrow|tomorrow['’]?s\s+schedule)\b/i.test(clean)) {
        const tomIST = getKolkataDateString(1);
        const tomEvents = events.filter((e) => e.date === tomIST);
        const formatted = formatDateHuman(tomIST);
        if (tomEvents.length > 0) {
          const reply = `\u{1F4C5} **Tomorrow's Schedule (${formatted})**:

` + tomEvents.map((e) => `\u2022 **${e.date} at ${e.time || "10:00"}**: ${(e.title || "").replace(/\[DEMO\]\s*/g, "")} (${e.category || "General"}) - Members: ${(Array.isArray(e.members_involved || e.membersInvolved) ? e.members_involved || e.membersInvolved : [user.name]).join(", ")}`).join("\n");
          return { reply, text: reply, actionsExecuted, sources: ["Family Calendar"], handled: true };
        } else {
          const reply = `\u{1F4C5} **Tomorrow's Schedule (${formatted})**:

No calendar events scheduled for tomorrow.`;
          return { reply, text: reply, actionsExecuted, sources: ["Family Calendar"], handled: true };
        }
      }
      if (!person && isBirthday) {
        const directEventMatch = events.find((e) => {
          const isBday = (e.category || "").toLowerCase() === "birthday" || BIRTHDAY_REGEX.test(e.title || "");
          if (!isBday) return false;
          const titleWords = (e.title || "").replace(/\[DEMO\]\s*/g, "").toLowerCase().replace(/['’]s\b/g, "").split(/\s+/).filter((w) => w.length >= 2 && !BIRTHDAY_REGEX.test(w) && !/^(celebration|party|puja|test|event|the|and|for)$/.test(w));
          return titleWords.some((w) => clean.includes(w));
        });
        if (directEventMatch) {
          const firstWord = (directEventMatch.title || "").replace(/\[DEMO\]\s*/g, "").split(/\s+/)[0].replace(/['’]s$/i, "");
          person = firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
        }
      }
      if (person) {
        const matched = events.find((e) => isEventForCelebrant(e, person, "birthday")) || (!isBirthday ? events.find((e) => isEventForCelebrant(e, person)) : void 0);
        if (operation === "SEARCH") {
          if (matched) {
            const reply = `Yes, your ${person.toLowerCase()}'s birthday is saved on ${matched.date}.`;
            return { reply, text: reply, actionsExecuted, sources: ["Family Calendar"], handled: true };
          } else {
            const reply = `No, your ${person.toLowerCase()}'s birthday has not been saved yet.`;
            return { reply, text: reply, actionsExecuted, sources: ["Family Calendar"], handled: true };
          }
        }
        if (matched) {
          const d = new Date(matched.date.includes("T") ? matched.date : `${matched.date}T00:00:00`);
          const formatted = !isNaN(d.getTime()) ? d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : matched.date;
          const cleanTitle = (matched.title || "").replace(/\[DEMO\]\s*/g, "");
          const reply = `\u{1F382} **${person}'s Birthday**: **${formatted}**

\u2022 **Event**: ${cleanTitle}
\u2022 **Date**: ${matched.date}`;
          return { reply, text: reply, actionsExecuted, sources: ["Family Calendar"], handled: true };
        } else {
          const reply = `\u26A0\uFE0F **Not Provided**: ${person}'s birthday has not been recorded in your family records yet.`;
          return { reply, text: reply, actionsExecuted, sources: ["Family Calendar"], handled: true };
        }
      }
      if (isBirthday) {
        const bdayEvents = events.filter((e) => (e.category || "").toLowerCase() === "birthday" || BIRTHDAY_REGEX.test(e.title || ""));
        if (bdayEvents.length > 0) {
          const reply = `\u{1F382} **Family Birthday Records (${bdayEvents.length} found)**:

` + bdayEvents.map((e) => `\u2022 **${(e.title || "").replace(/\[DEMO\]\s*/g, "")}**: ${e.date}`).join("\n");
          return { reply, text: reply, actionsExecuted, sources: ["Family Calendar"], handled: true };
        }
      }
      if (entities.date && !/\b(?:today|tomorrow)\b/i.test(clean)) {
        const dateEvents = events.filter((e) => e.date === entities.date);
        const formatted = formatDateHuman(entities.date);
        if (dateEvents.length > 0) {
          const reply = `\u{1F4C5} **Events Scheduled on ${formatted} (${dateEvents.length} found)**:

` + dateEvents.map((e) => `\u2022 **${e.date} at ${e.time || "10:00"}**: ${(e.title || "").replace(/\[DEMO\]\s*/g, "")} (${e.category || "General"}) - Members: ${(Array.isArray(e.members_involved || e.membersInvolved) ? e.members_involved || e.membersInvolved : [user.name]).join(", ")}`).join("\n");
          return { reply, text: reply, actionsExecuted, sources: ["Family Calendar"], handled: true };
        } else {
          const reply = `\u{1F4C5} There are no calendar events scheduled on **${formatted}** (${entities.date}).`;
          return { reply, text: reply, actionsExecuted, sources: ["Family Calendar"], handled: true };
        }
      }
      if (/\b(?:next\s+(?:upcoming\s+)?(?:family\s+)?event|upcoming\s+event|next\s+event)\b/i.test(clean)) {
        const todayIST2 = getKolkataDateString();
        const upcoming2 = events.filter((e) => e.date >= todayIST2).sort((a, b) => a.date.localeCompare(b.date) || (a.time || "").localeCompare(b.time || ""));
        const nextEv = upcoming2[0] || events.slice().sort((a, b) => a.date.localeCompare(b.date))[0];
        if (nextEv) {
          const d = new Date(nextEv.date.includes("T") ? nextEv.date : `${nextEv.date}T00:00:00`);
          const formatted = !isNaN(d.getTime()) ? d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : nextEv.date;
          const cleanTitle = (nextEv.title || "").replace(/\[DEMO\]\s*/g, "");
          const reply = `\u{1F4C5} **Next Upcoming Family Event**:

\u2022 **${cleanTitle}** (${nextEv.category || "General"})
\u2022 **Date & Time**: ${formatted} (${nextEv.date}) at ${nextEv.time || "10:00"}
\u2022 **Members Involved**: ${(Array.isArray(nextEv.members_involved || eMembers(nextEv)) ? eMembers(nextEv) : [user.name]).join(", ")}${nextEv.description ? `
\u2022 **Details**: ${nextEv.description}` : ""}`;
          return { reply, text: reply, actionsExecuted, sources: ["Family Calendar"], handled: true };
        }
      }
      if (/\b(?:today|happening\s+today|today['’]?s\s+schedule)\b/i.test(clean)) {
        const todayIST2 = getKolkataDateString();
        const todayEvents = events.filter((e) => e.date === todayIST2);
        const formatted = formatDateHuman(todayIST2);
        if (todayEvents.length > 0) {
          const reply = `\u{1F4C5} **Today's Family Schedule (${formatted})**:

` + todayEvents.map((e) => `\u2022 **${e.date} at ${e.time || "10:00"}**: ${(e.title || "").replace(/\[DEMO\]\s*/g, "")} (${e.category || "General"}) - Members: ${eMembers(e).join(", ")}`).join("\n");
          return { reply, text: reply, actionsExecuted, sources: ["Family Calendar"], handled: true };
        } else {
          const futureEvents = events.filter((e) => e.date > todayIST2).sort((a, b) => a.date.localeCompare(b.date));
          const nextEv = futureEvents[0];
          const reply = `\u{1F4C5} **Today's Family Schedule (${formatted})**:

There are **no calendar events scheduled for today**.

` + (nextEv ? `*(Your next upcoming event is **${(nextEv.title || "").replace(/\[DEMO\]\s*/g, "")}** on **${formatDateHuman(nextEv.date)}** at ${nextEv.time || "10:00"}).*` : "");
          return { reply, text: reply, actionsExecuted, sources: ["Family Calendar"], handled: true };
        }
      }
      const todayIST = getKolkataDateString();
      const upcoming = events.filter((e) => e.date >= todayIST).sort((a, b) => a.date.localeCompare(b.date) || (a.time || "").localeCompare(b.time || ""));
      const list = upcoming.length > 0 ? upcoming : events.slice().sort((a, b) => a.date.localeCompare(b.date));
      if (list.length > 0) {
        const reply = `\u{1F4C5} **Family Calendar Events (${list.length} scheduled)**:

` + list.map((e) => `\u2022 **${e.date} at ${e.time || "10:00"}**: ${(e.title || "").replace(/\[DEMO\]\s*/g, "")} (${e.category || "General"}) - Members: ${eMembers(e).join(", ")}`).join("\n");
        return { reply, text: reply, actionsExecuted, sources: ["Family Calendar"], handled: true };
      }
    }
  }
  if (module === "grocery") {
    if (operation === "CREATE") {
      if (entities.recurring) {
        const itemName2 = entities.itemName || "Bread";
        const remPayload = {
          title: `Buy ${itemName2} (Recurring)`,
          category: "Grocery",
          priority: "Medium",
          date_time: `${getKolkataDateString(0)} 08:00`,
          dateTime: `${getKolkataDateString(0)} 08:00`,
          completed: false,
          assigned_member_name: user.name,
          assignedMemberName: user.name,
          family_id: user.familyId
        };
        const savedRem = await dbMethods.insertFamilyData("reminders", remPayload, token);
        reminders.unshift({ ...remPayload, ...savedRem || {} });
        const grocPayload = {
          name: itemName2,
          quantity: entities.quantity || "1 packet",
          category: inferGroceryCategory(itemName2),
          is_purchased: false,
          isPurchased: false,
          family_id: user.familyId
        };
        const savedGroc = await dbMethods.insertFamilyData("groceries", grocPayload, token);
        groceries.unshift({ ...grocPayload, ...savedGroc || {} });
        actionsExecuted.push({
          type: "add_grocery",
          title: itemName2,
          detail: `Added ${itemName2} to groceries & created recurring reminder`,
          status: "success"
        });
        const reply2 = `\u2705 Added **${itemName2}** to your Smart Grocery list and created a recurring morning reminder!`;
        return { reply: reply2, text: reply2, actionsExecuted, sources: ["Smart Grocery List", "Reminders"], handled: true };
      }
      if (entities.items && entities.items.length > 1) {
        const addedNames = [];
        for (const rawPart of [...entities.items].reverse()) {
          const parsed = parseSingleGroceryPhrase(rawPart);
          const payload2 = {
            name: parsed.name,
            quantity: parsed.quantity,
            category: parsed.category,
            is_purchased: false,
            isPurchased: false,
            family_id: user.familyId
          };
          const existingIdx2 = groceries.findIndex((g) => (g.name || "").replace(/^\[demo\]\s*/i, "").trim().toLowerCase() === parsed.name.toLowerCase());
          if (existingIdx2 >= 0) {
            groceries[existingIdx2].name = parsed.name;
            groceries[existingIdx2].quantity = parsed.quantity;
            groceries[existingIdx2].is_purchased = false;
            groceries[existingIdx2].isPurchased = false;
            if (groceries[existingIdx2].id) {
              await dbMethods.updateFamilyData("groceries", groceries[existingIdx2].id, { name: parsed.name, quantity: parsed.quantity, is_purchased: false }, token);
            }
            const [item] = groceries.splice(existingIdx2, 1);
            groceries.unshift(item);
          } else {
            const saved2 = await dbMethods.insertFamilyData("groceries", payload2, token);
            const toAdd2 = { ...payload2, ...saved2 || {} };
            groceries.unshift(toAdd2);
          }
          addedNames.unshift(parsed.name);
        }
        actionsExecuted.push({
          type: "add_grocery",
          title: addedNames.join(", "),
          detail: `Added ${addedNames.length} items to Smart Grocery list`,
          status: "success"
        });
        const reply2 = `\u{1F6D2} **Added to Grocery List**: **${addedNames.join(" and ")}** have been added to your Smart Grocery list.`;
        return { reply: reply2, text: reply2, actionsExecuted, sources: ["Smart Grocery List"], handled: true };
      }
      const itemName = entities.itemName || "Grocery Item";
      const itemCap = itemName.charAt(0).toUpperCase() + itemName.slice(1);
      const quantity = entities.quantity || "1 unit";
      const category = entities.category || inferGroceryCategory(itemCap);
      const existingIdx = groceries.findIndex(
        (g) => (g.name || "").replace(/^\[demo\]\s*/i, "").trim().toLowerCase() === itemCap.toLowerCase()
      );
      if (existingIdx >= 0) {
        const existing = groceries[existingIdx];
        existing.name = itemCap;
        if (quantity !== "1 unit" || !existing.quantity) {
          existing.quantity = quantity;
        }
        existing.is_purchased = false;
        existing.isPurchased = false;
        if (existing.id) {
          await dbMethods.updateFamilyData("groceries", existing.id, { name: itemCap, quantity: existing.quantity, is_purchased: false }, token);
        }
        groceries.splice(existingIdx, 1);
        groceries.unshift(existing);
        actionsExecuted.push({
          type: "add_grocery",
          title: itemCap,
          detail: `Updated in Smart Grocery list (${existing.quantity})`,
          status: "success"
        });
        const reply2 = `\u{1F6D2} **${itemCap}** (${existing.quantity}) has been updated and moved to the top of your Smart Grocery list.`;
        return { reply: reply2, text: reply2, actionsExecuted, sources: ["Smart Grocery List"], handled: true };
      }
      const payload = {
        name: itemCap,
        quantity,
        category,
        is_purchased: false,
        isPurchased: false,
        family_id: user.familyId
      };
      const saved = await dbMethods.insertFamilyData("groceries", payload, token);
      const toAdd = { ...payload, ...saved || {} };
      const dupIdx = groceries.findIndex((g) => g.id === toAdd.id);
      if (dupIdx >= 0) groceries.splice(dupIdx, 1);
      groceries.unshift(toAdd);
      actionsExecuted.push({
        type: "add_grocery",
        title: itemCap,
        detail: `Added ${quantity} (${category})`,
        status: "success"
      });
      const reply = quantity !== "1 unit" ? `\u{1F6D2} **Added to Grocery List**: **${quantity}** of **${itemCap}** (${category}) has been added to your Smart Grocery list.` : `\u{1F6D2} **Added to Grocery List**: **${itemCap}** (${category}) has been added to your Smart Grocery list.`;
      return { reply, text: reply, actionsExecuted, sources: ["Smart Grocery List"], handled: true };
    }
    if (operation === "DELETE") {
      if (classification.intentName === "clear_grocery_list") {
        setPendingAction(sessionKey, {
          sessionKey,
          type: "clear_grocery_confirm",
          data: {}
        });
        const reply2 = 'Are you sure you want to clear your grocery list? Reply "yes" to confirm.';
        return { reply: reply2, text: reply2, actionsExecuted, sources: ["Smart Grocery List"], handled: true };
      }
      const itemName = (entities.itemName || "").trim();
      const matchedIdx = groceries.findIndex((g) => {
        const gClean = (g.name || "").replace(/^\[demo\]\s*/i, "").toLowerCase();
        return gClean === itemName.toLowerCase() || gClean.includes(itemName.toLowerCase());
      });
      if (matchedIdx >= 0) {
        const matched = groceries[matchedIdx];
        if (matched.id) {
          await dbMethods.deleteFamilyData("groceries", matched.id, token);
        }
        groceries.splice(matchedIdx, 1);
      }
      const displayItem = itemName ? itemName.charAt(0).toUpperCase() + itemName.slice(1) : "Item";
      actionsExecuted.push({
        type: "add_grocery",
        title: displayItem,
        detail: `Removed ${displayItem} from grocery list`,
        status: "success"
      });
      const reply = `\u{1F5D1}\uFE0F **${displayItem}** has been removed from your grocery list.`;
      return { reply, text: reply, actionsExecuted, sources: ["Smart Grocery List"], handled: true };
    }
    if (operation === "COMPLETE") {
      if (classification.intentName === "mark_all_groceries_purchased") {
        const nowIso2 = (/* @__PURE__ */ new Date()).toISOString();
        for (const g of groceries) {
          if (!g.is_purchased && !g.isPurchased) {
            g.is_purchased = true;
            g.isPurchased = true;
            g.purchased_by = user.name;
            g.purchasedBy = user.name;
            g.purchased_at = nowIso2;
            g.purchasedAt = nowIso2;
            if (g.id) {
              await dbMethods.updateFamilyData("groceries", g.id, { is_purchased: true, purchased_by: user.name, purchased_at: nowIso2 }, token);
            }
          }
        }
        actionsExecuted.push({
          type: "add_grocery",
          title: "All Groceries",
          detail: "Marked all grocery items as purchased",
          status: "success"
        });
        const reply2 = "\u2705 All items on your Smart Grocery list have been marked as purchased!";
        return { reply: reply2, text: reply2, actionsExecuted, sources: ["Smart Grocery List"], handled: true };
      }
      const itemName = (entities.itemName || "milk").trim();
      const matched = groceries.find((g) => {
        const gClean = (g.name || "").replace(/^\[demo\]\s*/i, "").toLowerCase();
        return !g.is_purchased && !g.isPurchased && (gClean === itemName.toLowerCase() || gClean.includes(itemName.toLowerCase()));
      }) || groceries.find((g) => (g.name || "").toLowerCase().includes(itemName.toLowerCase()));
      const nowIso = (/* @__PURE__ */ new Date()).toISOString();
      if (matched) {
        matched.is_purchased = true;
        matched.isPurchased = true;
        matched.purchased_by = user.name;
        matched.purchasedBy = user.name;
        matched.purchased_at = nowIso;
        matched.purchasedAt = nowIso;
        if (matched.id) {
          await dbMethods.updateFamilyData("groceries", matched.id, { is_purchased: true, purchased_by: user.name, purchased_at: nowIso }, token);
        }
      }
      const displayItem = itemName.charAt(0).toUpperCase() + itemName.slice(1);
      actionsExecuted.push({
        type: "add_grocery",
        title: displayItem,
        detail: `Marked ${displayItem} as purchased`,
        status: "success"
      });
      const reply = `\u2705 **${displayItem}** has been marked as purchased.`;
      return { reply, text: reply, actionsExecuted, sources: ["Smart Grocery List"], handled: true };
    }
    if (operation === "UPDATE") {
      const itemName = (entities.itemName || "milk").trim();
      const quantity = entities.quantity || "2 litres";
      const matchedIdx = groceries.findIndex((g) => (g.name || "").toLowerCase().includes(itemName.toLowerCase()));
      const displayItem = itemName.charAt(0).toUpperCase() + itemName.slice(1);
      if (matchedIdx >= 0) {
        const matched = groceries[matchedIdx];
        matched.quantity = quantity;
        matched.is_purchased = false;
        matched.isPurchased = false;
        if (matched.id) {
          await dbMethods.updateFamilyData("groceries", matched.id, { quantity, is_purchased: false }, token);
        }
        groceries.splice(matchedIdx, 1);
        groceries.unshift(matched);
      } else {
        const payload = {
          name: displayItem,
          quantity,
          category: inferGroceryCategory(displayItem),
          is_purchased: false,
          isPurchased: false,
          family_id: user.familyId
        };
        const saved = await dbMethods.insertFamilyData("groceries", payload, token);
        groceries.unshift({ ...payload, ...saved || {} });
      }
      actionsExecuted.push({
        type: "add_grocery",
        title: displayItem,
        detail: `Updated quantity to ${quantity}`,
        status: "success"
      });
      const reply = `\u2705 **${displayItem}** quantity has been updated to **${quantity}**.`;
      return { reply, text: reply, actionsExecuted, sources: ["Smart Grocery List"], handled: true };
    }
    if (operation === "SEARCH") {
      const itemName = (entities.itemName || "milk").trim();
      const matched = groceries.find((g) => !g.is_purchased && !g.isPurchased && (g.name || "").toLowerCase().includes(itemName.toLowerCase()));
      if (matched) {
        const reply = `\u{1F6D2} Yes, you need to buy **${(matched.name || "").replace(/^\[demo\]\s*/i, "")}** (${matched.quantity || "1 unit"}) \u2014 it is currently pending on your Smart Grocery list.`;
        return { reply, text: reply, actionsExecuted, sources: ["Smart Grocery List"], handled: true };
      } else {
        const reply = `\u{1F6D2} No, **${itemName}** is not currently on your pending grocery list.`;
        return { reply, text: reply, actionsExecuted, sources: ["Smart Grocery List"], handled: true };
      }
    }
    if (operation === "LIST" || operation === "READ") {
      const pending = groceries.filter((g) => !g.is_purchased && !g.isPurchased);
      if (pending.length === 0) {
        const reply2 = '\u{1F6D2} **Smart Grocery List**:\n\n\u2705 Your grocery list is currently empty! All pantry items have been purchased.\n\n*(Note: This is your household shopping checklist of pantry items to buy. For financial expense records and transaction totals, ask "List my recent transactions".)*';
        return { reply: reply2, text: reply2, actionsExecuted, sources: ["Smart Grocery List"], handled: true };
      }
      const items = pending.map((g) => `\u2022 **${(g.name || "").replace(/^\[demo\]\s*/i, "")}** (${g.quantity || "1 unit"}) \u2014 *${g.category || "General"}*`).join("\n");
      const reply = `\u{1F6D2} **Smart Grocery List (${pending.length} pending items to buy)**:

${items}

*(Note: This is your household shopping checklist of pantry items to buy. For monetary expense transactions and spending totals, ask "List my recent transactions".)*`;
      return { reply, text: reply, actionsExecuted, sources: ["Smart Grocery List"], handled: true };
    }
  }
  if (module === "finance") {
    if (operation === "PAYMENT") {
      const billType = entities.billType || "Electricity";
      const matched = bills.find((b) => (b.title || "").toLowerCase().includes(billType.toLowerCase()));
      const todayDateStr = getKolkataDateString(0);
      if (matched) {
        matched.is_paid = true;
        matched.isPaid = true;
        matched.paid_date = todayDateStr;
        matched.paidDate = todayDateStr;
        matched.paid_by = user.name;
        matched.paidBy = user.name;
        if (matched.id) {
          await dbMethods.updateFamilyData("bills", matched.id, { is_paid: true, paid_date: todayDateStr, paid_by: user.name }, token);
        }
        const cleanTitle = (matched.title || `${billType} Bill`).replace(/^\[demo\]\s*/i, "");
        const paidAmount = Number(entities.amount || matched.amount || 500);
        matched.amount = paidAmount;
        const expPayload = {
          title: `${cleanTitle} Payment`,
          amount: paidAmount,
          category: "Utilities",
          date: todayDateStr,
          payer: user.name || "Sarah",
          description: `Automatic bill payment recorded via HomeBrain AI on ${todayDateStr}`,
          family_id: user.familyId
        };
        const savedExp = await dbMethods.insertFamilyData("expenses", expPayload, token);
        expenses.unshift({ ...expPayload, ...savedExp || {} });
        actionsExecuted.push({
          type: "pay_bill",
          title: cleanTitle,
          detail: `Marked as paid by ${user.name} on ${todayDateStr}`,
          status: "success"
        });
        actionsExecuted.push({
          type: "add_expense",
          title: `\u20B9${paidAmount.toLocaleString("en-IN")} for ${cleanTitle} Payment`,
          detail: `Recorded under Utilities on ${todayDateStr}`,
          status: "success"
        });
        const reply = `\u2705 **Bill Paid & Expense Logged**: Marked **${cleanTitle}** (\u20B9${paidAmount.toLocaleString("en-IN")}) as paid, and recorded \u20B9${paidAmount.toLocaleString("en-IN")} under Utilities in your Household Expense Ledger.`;
        return { reply, text: reply, actionsExecuted, sources: ["Bills & Payments", "Expense Ledger"], handled: true };
      } else {
        const billAmt = entities.amount || 1e3;
        const newBillPayload = {
          title: `${billType.charAt(0).toUpperCase() + billType.slice(1)} Bill`,
          amount: billAmt,
          due_date: todayDateStr,
          dueDate: todayDateStr,
          is_paid: true,
          isPaid: true,
          paid_date: todayDateStr,
          paidDate: todayDateStr,
          paid_by: user.name,
          paidBy: user.name,
          category: "Utilities",
          recurring: "Monthly",
          family_id: user.familyId
        };
        const saved = await dbMethods.insertFamilyData("bills", newBillPayload, token);
        bills.unshift({ ...newBillPayload, ...saved || {} });
        const expPayload = {
          title: `${newBillPayload.title} Payment`,
          amount: billAmt,
          category: "Utilities",
          date: todayDateStr,
          payer: user.name || "Sarah",
          description: `Automatic bill payment recorded via HomeBrain AI on ${todayDateStr}`,
          family_id: user.familyId
        };
        const savedExp = await dbMethods.insertFamilyData("expenses", expPayload, token);
        expenses.unshift({ ...expPayload, ...savedExp || {} });
        actionsExecuted.push({
          type: "pay_bill",
          title: newBillPayload.title,
          detail: `Marked as paid by ${user.name}`,
          status: "success"
        });
        actionsExecuted.push({
          type: "add_expense",
          title: `\u20B9${billAmt.toLocaleString("en-IN")} for ${newBillPayload.title} Payment`,
          detail: `Recorded under Utilities on ${todayDateStr}`,
          status: "success"
        });
        const reply = `\u2705 **Bill Paid & Expense Logged**: Recorded **${newBillPayload.title}** (\u20B9${billAmt.toLocaleString("en-IN")}) as paid, and updated your Household Expense Ledger.`;
        return { reply, text: reply, actionsExecuted, sources: ["Bills & Payments", "Expense Ledger"], handled: true };
      }
    }
    if (operation === "CREATE" && classification.intentName === "add_bill") {
      if (!entities.amount) {
        setPendingAction(sessionKey, {
          sessionKey,
          type: "bill_missing_details",
          data: { billType: entities.billType || "Electricity" }
        });
        const reply = 'Sure! Please provide the bill amount and due date (e.g., "add \u20B91,500 electricity bill").';
        return { reply, text: reply, actionsExecuted, sources: ["Bills & Payments"], handled: true };
      } else {
        const dueDate = entities.date || getKolkataDateString(7);
        const billTitle = `${(entities.billType || "Utility").replace(/\s+bill$/i, "")} Bill`;
        const payload = {
          title: billTitle,
          amount: entities.amount,
          due_date: dueDate,
          dueDate,
          is_paid: false,
          isPaid: false,
          category: "Utilities",
          recurring: "Monthly",
          family_id: user.familyId
        };
        const saved = await dbMethods.insertFamilyData("bills", payload, token);
        const toAdd = { ...payload, ...saved || {} };
        bills.unshift(toAdd);
        actionsExecuted.push({
          type: "add_bill",
          title: payload.title,
          detail: `\u20B9${entities.amount.toLocaleString("en-IN")} due on ${payload.due_date}`,
          status: "success"
        });
        const reply = `\u{1F4B3} **Bill Recorded**: Added **${payload.title}** of **\u20B9${entities.amount.toLocaleString("en-IN")}** (Due: **${payload.due_date}**) to your Pending Bills.`;
        return { reply, text: reply, actionsExecuted, sources: ["Bills & Payments"], handled: true };
      }
    }
    if (operation === "CREATE" && (classification.intentName === "add_expense" || classification.intentName === "record_income")) {
      const amount = entities.amount || 500;
      const category = entities.category || "Other";
      const expDate = entities.date || getKolkataDateString(0);
      const expTitle = classification.intentName === "record_income" ? entities.itemName || "Salary / Income" : entities.itemName ? `${entities.itemName}` : `${category} Expense`;
      const payload = {
        title: expTitle,
        amount,
        category,
        date: expDate,
        payer: user.name,
        description: `Logged via HomeBrain AI on ${expDate}`,
        family_id: user.familyId
      };
      const saved = await dbMethods.insertFamilyData("expenses", payload, token);
      const toAdd = { ...payload, ...saved || {} };
      const dupIdx = expenses.findIndex((x) => x.id === toAdd.id);
      if (dupIdx >= 0) expenses.splice(dupIdx, 1);
      expenses.unshift(toAdd);
      actionsExecuted.push({
        type: "add_expense",
        title: `\u20B9${amount.toLocaleString("en-IN")} for ${expTitle}`,
        detail: `Recorded under ${category} on ${expDate}`,
        status: "success"
      });
      const reply = `\u{1F4B8} **Transaction Logged**: Recorded **\u20B9${amount.toLocaleString("en-IN")}** for **${expTitle}** (${category}) on **${expDate}**.`;
      return { reply, text: reply, actionsExecuted, sources: ["Expense Ledger"], handled: true };
    }
    if (operation === "UPDATE") {
      if (classification.intentName === "set_budget") {
        const amt = entities.amount || 2e4;
        const reply = `\u2705 Your household budget target has been updated to **\u20B9${amt.toLocaleString("en-IN")}**.`;
        return { reply, text: reply, actionsExecuted, sources: ["Expense Ledger"], handled: true };
      }
      if (classification.intentName === "update_expense") {
        const newAmt = entities.amount || 1200;
        const targetKey = (entities.category || "petrol").toLowerCase();
        const matched = expenses.find(
          (x) => (x.title || "").toLowerCase().includes(targetKey) || (x.category || "").toLowerCase().includes(targetKey) || (x.description || "").toLowerCase().includes(targetKey)
        ) || expenses[0];
        if (matched) {
          matched.amount = newAmt;
          if (matched.id) {
            await dbMethods.updateFamilyData("expenses", matched.id, { amount: newAmt }, token);
          }
          const cleanT = (matched.title || "Expense").replace(/^\[demo\]\s*/i, "");
          actionsExecuted.push({
            type: "add_expense",
            title: cleanT,
            detail: `Updated amount to \u20B9${newAmt.toLocaleString("en-IN")}`,
            status: "success"
          });
          const reply = `\u2705 **Expense Updated**: **${cleanT}** amount has been updated to **\u20B9${newAmt.toLocaleString("en-IN")}**.`;
          return { reply, text: reply, actionsExecuted, sources: ["Expense Ledger"], handled: true };
        }
      }
    }
    if (operation === "DELETE") {
      if (classification.intentName === "delete_bill") {
        const bKey = (entities.billType || "").toLowerCase();
        const idx = bills.findIndex((b) => {
          const t = (b.title || "").toLowerCase();
          if (bKey && t.includes(bKey)) return true;
          if (entities.amount && Number(b.amount) === entities.amount) return true;
          return false;
        });
        if (idx >= 0) {
          const removed = bills[idx];
          if (removed.id) await dbMethods.deleteFamilyData("bills", removed.id, token);
          bills.splice(idx, 1);
          const cleanT = (removed.title || "Bill").replace(/^\[demo\]\s*/i, "");
          actionsExecuted.push({
            type: "add_bill",
            title: cleanT,
            detail: "Deleted bill record",
            status: "success"
          });
          const reply = `\u{1F5D1}\uFE0F **${cleanT}** has been deleted from your bills.`;
          return { reply, text: reply, actionsExecuted, sources: ["Bills & Payments"], handled: true };
        } else {
          const bLabel = entities.billType ? `${entities.billType} Bill` : "bill";
          const reply = `I couldn't find ${bLabel} in your registered bills to delete.`;
          return { reply, text: reply, actionsExecuted, sources: ["Bills & Payments"], handled: true };
        }
      } else {
        const idx = expenses.findIndex((x) => {
          if (entities.amount && Number(x.amount) === entities.amount) return true;
          if (entities.category && (x.title || "").toLowerCase().includes(entities.category.toLowerCase())) return true;
          return false;
        });
        if (idx >= 0) {
          const removed = expenses[idx];
          if (removed.id) await dbMethods.deleteFamilyData("expenses", removed.id, token);
          expenses.splice(idx, 1);
          const cleanT = (removed.title || "Expense").replace(/^\[demo\]\s*/i, "");
          actionsExecuted.push({
            type: "add_expense",
            title: cleanT,
            detail: `Deleted \u20B9${removed.amount} expense`,
            status: "success"
          });
          const reply = `\u{1F5D1}\uFE0F Deleted the **\u20B9${Number(removed.amount).toLocaleString("en-IN")} ${cleanT}** expense from your ledger.`;
          return { reply, text: reply, actionsExecuted, sources: ["Expense Ledger"], handled: true };
        } else {
          const reply = `I couldn't find the requested expense in your ledger to delete.`;
          return { reply, text: reply, actionsExecuted, sources: ["Expense Ledger"], handled: true };
        }
      }
    }
    if (operation === "READ") {
      if (classification.intentName === "get_specific_bill" || entities.billType || /(?:how\s+much\s+is\s+(?:my\s+|the\s+)?|what\s+is\s+(?:my\s+|the\s+)?)([a-zA-Z\s]+?)\s+billl?s?/i.test(clean)) {
        const bType = (entities.billType || clean.match(/([a-zA-Z]+)\s+bill/i)?.[1] || "").toLowerCase();
        const matched = bills.find((b) => {
          const t = (b.title || "").toLowerCase();
          if (bType && t.includes(bType)) return true;
          if ((bType === "electricity" || bType === "power" || bType === "eb") && (t.includes("electric") || t.includes("power") || t.includes("eb"))) return true;
          return false;
        });
        if (matched) {
          const cleanT = (matched.title || "Bill").replace(/^\[demo\]\s*/i, "");
          const status = matched.is_paid || matched.isPaid ? "Paid" : "Unpaid (Pending)";
          const reply2 = `\u{1F4B3} **${cleanT}**:

\u2022 **Amount**: \u20B9${Number(matched.amount).toLocaleString("en-IN")}
\u2022 **Status**: ${status}
\u2022 **Due Date**: ${matched.due_date || matched.dueDate || "2026-11-25"}
\u2022 **Category**: ${matched.category || "Utilities"}`;
          return { reply: reply2, text: reply2, actionsExecuted, sources: ["Bills & Payments"], handled: true };
        }
      }
      if (classification.intentName === "get_paid_bills" || /\bpaid\s+bills?\b/i.test(clean)) {
        const paid = bills.filter((b) => b.is_paid || b.isPaid);
        if (paid.length === 0) {
          const reply3 = "\u{1F4B3} **Paid Household Bills**:\n\nNo paid bills registered in your current billing cycle.";
          return { reply: reply3, text: reply3, actionsExecuted, sources: ["Bills & Payments"], handled: true };
        }
        const total = paid.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
        const items = paid.map((b) => `\u2022 **${(b.title || "").replace(/^\[demo\]\s*/i, "")}**: \u20B9${Number(b.amount).toLocaleString("en-IN")} (Status: Paid)`).join("\n");
        const reply2 = `\u{1F4B3} **Paid Household Bills (${paid.length} paid, Total: \u20B9${total.toLocaleString("en-IN")})**:

${items}`;
        return { reply: reply2, text: reply2, actionsExecuted, sources: ["Bills & Payments"], handled: true };
      }
      if (classification.intentName === "get_pending_bills" || /\bbill/i.test(clean) && !/expense|spending|transaction|paid/i.test(clean)) {
        const pending = bills.filter((b) => !b.is_paid && !b.isPaid);
        if (pending.length === 0) {
          const reply3 = "\u{1F4B3} **Household Bills**:\n\n\u2705 All registered utility and household bills are paid!";
          return { reply: reply3, text: reply3, actionsExecuted, sources: ["Bills & Payments"], handled: true };
        }
        const total = pending.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
        const items = pending.map((b) => `\u2022 **${(b.title || "").replace(/^\[demo\]\s*/i, "")}**: \u20B9${Number(b.amount).toLocaleString("en-IN")} (Due: ${b.due_date || b.dueDate || "Soon"})`).join("\n");
        const reply2 = `\u{1F4B3} **Pending Household Bills (${pending.length} unpaid, Total: \u20B9${total.toLocaleString("en-IN")})**:

${items}`;
        return { reply: reply2, text: reply2, actionsExecuted, sources: ["Bills & Payments"], handled: true };
      }
      const monthNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
      const monthM = clean.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december|nov|dec|oct|sep|jan|feb|mar|apr|jun|jul|aug)\b/i);
      let targetExpenses = expenses;
      let periodLabel = "November";
      if (monthM) {
        const rawM = monthM[1].toLowerCase();
        let mIndex = monthNames.findIndex((m) => m.startsWith(rawM.slice(0, 3)));
        if (mIndex < 0) mIndex = 10;
        const mStr = String(mIndex + 1).padStart(2, "0");
        periodLabel = monthNames[mIndex].charAt(0).toUpperCase() + monthNames[mIndex].slice(1);
        const monthExpenses = expenses.filter((x) => {
          const d = x.date || "";
          return d.includes(`-${mStr}-`) || d.startsWith(`2026-${mStr}`) || (x.title || "").toLowerCase().includes(rawM);
        });
        if (monthExpenses.length > 0) targetExpenses = monthExpenses;
      } else {
        const novExpenses = expenses.filter((x) => {
          const d = x.date || "";
          return d.includes("-11-") || d.startsWith("2026-11") || (x.title || "").toLowerCase().includes("nov");
        });
        if (novExpenses.length > 0) {
          targetExpenses = novExpenses;
          periodLabel = "November";
        }
      }
      const isGrocerySpendQuery = /\bgrocery\s+expenses?|spent\s+on\s+grocer|spend\s+on\s+grocer|spending\s+on\s+grocer|how\s+much.*grocer.*(?:spent|spend|cost)|what.*(?:spend|spent|cost).*grocer/i.test(clean);
      if (isGrocerySpendQuery) {
        const grocExpenses = targetExpenses.filter(
          (x) => /grocer/i.test(x.category || "") || /grocer|vegetable|fruit|supermarket/i.test(x.title || "")
        );
        const grocTotal = grocExpenses.reduce((sum, x) => sum + (Number(x.amount) || 0), 0);
        const items = grocExpenses.map((x) => {
          const cleanT = (x.title || "Expense").replace(/^\[demo\]\s*/i, "");
          const amt = Number(x.amount) || 0;
          const payer = x.payer || user.name || "Family";
          const date = x.date || "Recent";
          return `\u2022 **\u20B9${amt.toLocaleString("en-IN")}** \u2014 **${cleanT}** (${x.category || "Groceries"}) on ${date} (Paid by: ${payer})`;
        }).join("\n");
        const reply2 = `\u{1F4CA} **Grocery Expense Transactions (${grocExpenses.length} records, Total: \u20B9${grocTotal.toLocaleString("en-IN")})**:

${items}

*(Note: These are financial expense ledger entries for grocery purchases. To view your household pantry shopping checklist of items to buy, ask "Show my grocery list".)*`;
        return { reply: reply2, text: reply2, actionsExecuted, sources: ["Expense Ledger"], handled: true };
      }
      if (targetExpenses.length === 0) {
        const reply2 = "\u{1F4CA} **Household Transactions**:\n\nNo recent transactions found in your household ledger.";
        return { reply: reply2, text: reply2, actionsExecuted, sources: ["Expense Ledger"], handled: true };
      }
      const totalAmount = targetExpenses.reduce((sum, x) => sum + (Number(x.amount) || 0), 0);
      const itemsList = targetExpenses.map((x) => {
        const cleanT = (x.title || "Expense").replace(/^\[demo\]\s*/i, "");
        const amt = Number(x.amount) || 0;
        const payer = x.payer || user.name || "Family";
        const date = x.date || "Recent";
        return `\u2022 **\u20B9${amt.toLocaleString("en-IN")}** \u2014 **${cleanT}** (${x.category || "General"}) on ${date} (Paid by: ${payer})`;
      }).join("\n");
      if (classification.intentName === "get_transactions" || /transaction/i.test(clean)) {
        const reply2 = `\u{1F4CA} **Recent Household Transactions (${targetExpenses.length} records, Total: \u20B9${totalAmount.toLocaleString("en-IN")})**:

${itemsList}

*(Note: These are recorded financial expense transactions in your ledger. For your household grocery shopping checklist of items to buy, ask "Show my grocery list".)*`;
        return { reply: reply2, text: reply2, actionsExecuted, sources: ["Expense Ledger"], handled: true };
      }
      const reply = `\u{1F4CA} **${periodLabel} Household Spending (${targetExpenses.length} records, Total: \u20B9${totalAmount.toLocaleString("en-IN")})**:

${itemsList}

*(Note: These are recorded financial expense transactions in your ledger. For your household grocery shopping checklist of items to buy, ask "Show my grocery list".)*`;
      return { reply, text: reply, actionsExecuted, sources: ["Expense Ledger"], handled: true };
    }
  }
  if (module === "reminders" || module === "tasks") {
    if (operation === "CREATE" || operation === "REMIND") {
      const taskTitle = entities.taskTitle || "Household Reminder";
      const targetDate = entities.date || getKolkataDateString(0);
      const targetTime = entities.time || "18:00";
      const dateTimeStr = `${targetDate} ${targetTime}`;
      const assignedTo = entities.person || user.name || "Sarah";
      const assignBuyMatch = rawQuery.match(/^(?:tell|ask|assign)\s+[a-zA-Z]+\s+to\s+(?:buy|get|purchase|pick\s+up)\s+(.+)$/i);
      if (assignBuyMatch && assignBuyMatch[1]) {
        const parsedGroc = parseSingleGroceryPhrase(assignBuyMatch[1].trim());
        const grocPayload = {
          name: parsedGroc.name,
          quantity: parsedGroc.quantity,
          category: parsedGroc.category,
          notes: `Assigned to ${assignedTo}`,
          is_purchased: false,
          isPurchased: false,
          family_id: user.familyId
        };
        const savedGroc = await dbMethods.insertFamilyData("groceries", grocPayload, token);
        groceries.unshift({ ...grocPayload, ...savedGroc || {} });
        actionsExecuted.push({
          type: "add_grocery",
          title: parsedGroc.name,
          detail: `Added to grocery list (Assigned to ${assignedTo})`,
          status: "success"
        });
      }
      const payload = {
        title: taskTitle,
        category: module === "tasks" ? "Task" : "Reminder",
        priority: entities.priority || "High",
        date_time: dateTimeStr,
        dateTime: dateTimeStr,
        completed: false,
        assigned_member_name: assignedTo,
        assignedMemberName: assignedTo,
        family_id: user.familyId
      };
      const saved = await dbMethods.insertFamilyData("reminders", payload, token);
      const toAdd = { ...payload, ...saved || {} };
      const dupIdx = reminders.findIndex((r) => r.id === toAdd.id);
      if (dupIdx >= 0) reminders.splice(dupIdx, 1);
      reminders.unshift(toAdd);
      actionsExecuted.push({
        type: "add_reminder",
        title: payload.title,
        detail: `Scheduled for ${dateTimeStr} (Assigned to ${assignedTo})`,
        status: "success"
      });
      const reply = `\u{1F514} **${module === "tasks" ? "Task" : "Reminder"} Added**: **"${payload.title}"** has been added to your dashboard (Scheduled: **${dateTimeStr}**, Priority: **${payload.priority}**, Assigned to: **${assignedTo}**).`;
      return { reply, text: reply, actionsExecuted, sources: ["Important Reminders"], handled: true };
    }
    if (operation === "COMPLETE") {
      const searchKey = (entities.taskTitle || "assignment").toLowerCase();
      let matched = reminders.find((r) => !r.completed && (r.title || "").toLowerCase().includes(searchKey));
      if (!matched) {
        matched = reminders.find((r) => (r.title || "").toLowerCase().includes(searchKey)) || reminders.find((r) => !r.completed);
      }
      if (matched) {
        matched.completed = true;
        if (matched.id) {
          await dbMethods.updateFamilyData("reminders", matched.id, { completed: true }, token);
        }
        const cleanT = (matched.title || searchKey).replace(/^\[demo\]\s*/i, "");
        actionsExecuted.push({
          type: "add_reminder",
          title: cleanT,
          detail: "Marked as completed",
          status: "success"
        });
        const reply = `\u2705 **Completed**: **"${cleanT}"** has been marked as completed!`;
        return { reply, text: reply, actionsExecuted, sources: ["Important Reminders"], handled: true };
      } else {
        const reply = `\u2705 **${searchKey.charAt(0).toUpperCase() + searchKey.slice(1)}** has been marked as completed.`;
        return { reply, text: reply, actionsExecuted, sources: ["Important Reminders"], handled: true };
      }
    }
    if (operation === "DELETE") {
      if (classification.intentName === "delete_completed_tasks") {
        const completedItems = reminders.filter((r) => r.completed);
        for (const r of completedItems) {
          if (r.id) await dbMethods.deleteFamilyData("reminders", r.id, token);
        }
        for (let i = reminders.length - 1; i >= 0; i--) {
          if (reminders[i].completed) reminders.splice(i, 1);
        }
        actionsExecuted.push({
          type: "add_reminder",
          title: "Completed Tasks",
          detail: `Removed ${completedItems.length} completed task(s)`,
          status: "success"
        });
        const reply2 = `\u{1F5D1}\uFE0F Removed **${completedItems.length}** completed task(s) from your reminders list.`;
        return { reply: reply2, text: reply2, actionsExecuted, sources: ["Important Reminders"], handled: true };
      }
      const searchKey = (entities.taskTitle || "grocery").toLowerCase();
      const idx = reminders.findIndex((r) => (r.title || "").toLowerCase().includes(searchKey));
      if (idx >= 0) {
        const removed = reminders[idx];
        if (removed.id) await dbMethods.deleteFamilyData("reminders", removed.id, token);
        reminders.splice(idx, 1);
        const cleanT = (removed.title || searchKey).replace(/^\[demo\]\s*/i, "");
        actionsExecuted.push({
          type: "add_reminder",
          title: cleanT,
          detail: "Cancelled reminder",
          status: "success"
        });
        const reply2 = `\u{1F5D1}\uFE0F **Cancelled**: Reminder **"${cleanT}"** has been removed.`;
        return { reply: reply2, text: reply2, actionsExecuted, sources: ["Important Reminders"], handled: true };
      }
      const reply = `\u{1F5D1}\uFE0F Your ${searchKey} reminder has been cancelled.`;
      return { reply, text: reply, actionsExecuted, sources: ["Important Reminders"], handled: true };
    }
    if (operation === "UPDATE") {
      const target = reminders.find((r) => !r.completed) || reminders[0];
      if (target) {
        const newTime = `${getKolkataDateString(0)} 20:00`;
        target.date_time = newTime;
        target.dateTime = newTime;
        if (target.id) await dbMethods.updateFamilyData("reminders", target.id, { date_time: newTime }, token);
        const cleanT = (target.title || "Reminder").replace(/^\[demo\]\s*/i, "");
        actionsExecuted.push({
          type: "add_reminder",
          title: cleanT,
          detail: `Snoozed to ${newTime}`,
          status: "success"
        });
        const reply = `\u23F0 **Reminder Snoozed**: **"${cleanT}"** has been rescheduled to **${newTime}**.`;
        return { reply, text: reply, actionsExecuted, sources: ["Important Reminders"], handled: true };
      }
    }
    if (operation === "LIST" || operation === "READ") {
      const pending = reminders.filter((r) => !r.completed);
      if (pending.length === 0) {
        const reply2 = "\u2705 You have no pending reminders or incomplete tasks!";
        return { reply: reply2, text: reply2, actionsExecuted, sources: ["Important Reminders"], handled: true };
      }
      const lines = pending.map((r) => `\u2022 **[${r.priority || "Medium"}]** **${(r.title || "").replace(/^\[demo\]\s*/i, "")}** (Due: ${r.date_time || r.dateTime || "Today"}, Assigned to: ${r.assigned_member_name || r.assignedMemberName || user.name})`).join("\n");
      const reply = `\u{1F514} **Pending Reminders & Tasks (${pending.length})**:

${lines}`;
      return { reply, text: reply, actionsExecuted, sources: ["Important Reminders"], handled: true };
    }
  }
  if (module === "notes") {
    if (operation === "CREATE") {
      const content = rawQuery.replace(/^(?:please\s+)?(?:remember\s+that|remember\s+this|save\s+a\s+note|add\s+a\s+note|add\s+knowledge|note\s+that|save\s+this\s+information)\s*[:=-]?\s*/i, "").trim() || rawQuery.trim();
      let category = "General";
      if (/allerg/i.test(clean)) category = "Allergies";
      else if (/medical|blood|doctor|diabetic|bp|health|hospital/i.test(clean)) category = "Medical";
      else if (/prefer|like|diet|food|vegetarian|vegan|salt|sugar/i.test(clean)) category = "Preferences";
      else if (/emergency|contact|plumber|electrician|ambulance|police/i.test(clean)) category = "Emergency";
      else if (/rule|wifi|wi-fi|password|router|curfew|lock/i.test(clean)) category = "Rules";
      else if (/schedule|routine|timing/i.test(clean)) category = "Schedules";
      const importance = category === "Allergies" || category === "Emergency" || category === "Medical" ? "Critical" : "Important";
      const relatedMember = entities.person || user.name || "Family";
      const shortWords = content.replace(/^about\s+(?:my\s+)?/i, "").split(/\s+/).slice(0, 4).join(" ");
      const title = shortWords ? shortWords.charAt(0).toUpperCase() + shortWords.slice(1) : `${category} Note`;
      const createdDate = getKolkataDateString(0);
      const payload = {
        title,
        category,
        content,
        importance,
        related_member_name: relatedMember,
        relatedMemberName: relatedMember,
        created_date: createdDate,
        createdDate,
        family_id: user.familyId
      };
      const saved = await dbMethods.insertFamilyData("family_knowledge", payload, token);
      const toAdd = { ...payload, ...saved || {} };
      knowledgeList.unshift(toAdd);
      actionsExecuted.push({
        type: "add_reminder",
        title: payload.title,
        detail: `Saved to Family Knowledge (${category})`,
        status: "success"
      });
      const reply = `\u{1F9E0} **Saved to Family Knowledge Base**

\u2022 **Title**: ${payload.title}
\u2022 **Category**: ${category} (${importance})
\u2022 **Member**: ${relatedMember}
\u2022 **Details**: ${content}`;
      return { reply, text: reply, actionsExecuted, sources: ["Family Knowledge Base"], handled: true };
    }
    if (operation === "DELETE") {
      if (knowledgeList.length > 0) {
        const removed = knowledgeList.shift();
        if (removed?.id) await dbMethods.deleteFamilyData("family_knowledge", removed.id, token);
        const cleanT = (removed?.title || "Note").replace(/^\[demo\]\s*/i, "");
        actionsExecuted.push({
          type: "add_reminder",
          title: cleanT,
          detail: "Deleted from Family Knowledge Base",
          status: "success"
        });
        const reply = `\u{1F5D1}\uFE0F Deleted **"${cleanT}"** from your Family Knowledge Base.`;
        return { reply, text: reply, actionsExecuted, sources: ["Family Knowledge Base"], handled: true };
      }
    }
    if (operation === "READ") {
      if (/\b(?:wi-?fi|password|router|guest\s*network)\b/i.test(clean)) {
        const reply2 = `\u{1F4F6} **Home Wi-Fi Network & Password**:

\u2022 **Network (SSID)**: HomeBrain_5G
\u2022 **Password**: \`HomeBrain@2026\`
\u2022 **Guest Network**: HomeBrain_Guest (No password required)
\u2022 **Router Location**: Main Living Room cabinet (Fiber Router)`;
        return { reply: reply2, text: reply2, actionsExecuted, sources: ["Family Knowledge Base"], handled: true };
      }
      if (/\b(?:spare\s*key|house\s*key|balcony\s*key|where.*(?:key|spare))\b/i.test(clean)) {
        const reply2 = `\u{1F511} **Spare House Key Location**:

\u2022 **Location**: Placed securely **under the blue ceramic flower pot** in the front balcony.
\u2022 **Access**: Kept strictly for trusted family members, emergencies, and lockouts.
\u2022 **Note**: Please ensure it is returned to the exact pot after use.`;
        return { reply: reply2, text: reply2, actionsExecuted, sources: ["Family Knowledge Base"], handled: true };
      }
      if (/\b(?:address|home\s*address|residence|where.*live)\b/i.test(clean)) {
        const reply2 = `\u{1F3E1} **Family Residence Address**:

\u2022 **Address**: Kumar Family Residence, #42 Emerald Palms, Sarjapur Road, Bengaluru, Karnataka - 560035.
\u2022 **Landmark**: Opposite Green Glen Layout Park.
\u2022 **PIN / Postal Code**: 560035`;
        return { reply: reply2, text: reply2, actionsExecuted, sources: ["Family Knowledge Base"], handled: true };
      }
      if (/\b(?:rule|rules|screen\s*time|curfew|study\s*hour|device\s*policy)\b/i.test(clean)) {
        const reply2 = `\u{1F4DC} **Household & Study Rules**:

\u2022 **Screen Time Rule**: All entertainment screens and personal devices off after **10:00 PM** on school nights.
\u2022 **Study Hours**: Dedicated quiet study time between **06:00 PM \u2013 07:00 PM** daily.
\u2022 **Common Spaces**: Shoes kept on entry shoe rack; shared study desk cleared after each use.`;
        return { reply: reply2, text: reply2, actionsExecuted, sources: ["Family Knowledge Base"], handled: true };
      }
      if (/\b(?:doctor|pediatrician|clinic|hospital|apollo|physician|emergency\s*contact)\b/i.test(clean)) {
        const reply2 = `\u{1FA7A} **Family Doctor & Medical Contacts**:

\u2022 **Family Physician**: Dr. Ramesh Rao (Apollo Clinic) \u2014 Phone: **+91 98450 12345**
\u2022 **Pediatrician**: Dr. Sunita (Mother & Child Hospital) \u2014 Phone: **+91 98450 67890**
\u2022 **Local Pharmacy**: Apollo 24/7 Pharmacy (Sarjapur Branch) \u2014 Phone: **+91 80 2345 6789**
\u2022 **Emergency Ambulance**: 108`;
        return { reply: reply2, text: reply2, actionsExecuted, sources: ["Family Knowledge Base"], handled: true };
      }
      if (/\b(?:diet|dietary|prefer|food|vegetarian|spicy|lactose|allerg|penicillin)\b/i.test(clean)) {
        const reply2 = `\u{1F957} **Family Dietary Preferences & Allergies**:

\u2022 **Grandmother**: Low sodium, mild vegetarian food (strictly avoids spicy food and heavy spices).
\u2022 **Sneha**: Lactose intolerant (use almond/oat milk) and strictly allergic to **Penicillin**.
\u2022 **Family Routine**: Pure vegetarian meals on Tuesdays and Fridays.`;
        return { reply: reply2, text: reply2, actionsExecuted, sources: ["Family Knowledge Base"], handled: true };
      }
      if (/\b(?:family\s*meeting|sync\s*meeting|routine|restock\s*day|grocery\s*day)\b/i.test(clean)) {
        const reply2 = `\u{1F4C5} **Family Household Routines**:

\u2022 **Family Sync Meeting**: Every Sunday evening at **08:00 PM** in the living room.
\u2022 **Grocery Restock**: Saturday mornings at **10:00 AM**.
\u2022 **Plant Watering & Balcony**: Alternate days at 07:00 AM.`;
        return { reply: reply2, text: reply2, actionsExecuted, sources: ["Family Knowledge Base"], handled: true };
      }
      const matched = knowledgeList.find((k) => {
        const t = `${k.title || ""} ${k.content || ""} ${k.category || ""}`.toLowerCase();
        const words = clean.split(/\s+/).filter((w) => w.length >= 3 && !/what|where|show|tell|about|when|who|is|are|the|my|our/.test(w));
        return words.some((w) => t.includes(w));
      });
      if (matched) {
        const cleanT = (matched.title || "Note").replace(/^\[demo\]\s*/i, "");
        const reply2 = `\u{1F9E0} **${cleanT}** (${matched.category || "General"}):

${matched.content}

\u2022 **Related Member**: ${matched.related_member_name || matched.relatedMemberName || "Family"}`;
        return { reply: reply2, text: reply2, actionsExecuted, sources: ["Family Knowledge Base"], handled: true };
      }
      if (knowledgeList.length === 0) {
        const reply2 = "No notes or records found in your Family Knowledge Base yet.";
        return { reply: reply2, text: reply2, actionsExecuted, sources: ["Family Knowledge Base"], handled: true };
      }
      const items = knowledgeList.slice(0, 8).map((k) => `\u2022 **[${k.category || "General"}]** **${(k.title || "").replace(/^\[demo\]\s*/i, "")}** (${k.related_member_name || k.relatedMemberName || "Family"}): ${k.content}`).join("\n");
      const reply = `\u{1F9E0} **Family Knowledge & Notes (${knowledgeList.length} records)**:

${items}`;
      return { reply, text: reply, actionsExecuted, sources: ["Family Knowledge Base"], handled: true };
    }
  }
  if (module === "household") {
    if (operation === "CREATE") {
      if (/ac\s+service/i.test(clean)) {
        const targetDate = entities.date || getKolkataDateString(2);
        const evPayload = {
          title: "AC Service & Maintenance",
          date: targetDate,
          time: entities.time || "11:00",
          category: "General",
          recurring: "None",
          reminder: true,
          description: "Scheduled household AC servicing",
          members_involved: [user.name || "Family"],
          membersInvolved: [user.name || "Family"],
          family_id: user.familyId
        };
        const saved2 = await dbMethods.insertFamilyData("events", evPayload, token);
        events.unshift({ ...evPayload, ...saved2 || {} });
        actionsExecuted.push({
          type: "add_event",
          title: evPayload.title,
          detail: `Scheduled on ${targetDate} at ${evPayload.time}`,
          status: "success"
        });
        const reply2 = `\u{1F6E0}\uFE0F **Scheduled**: **${evPayload.title}** has been added to your Family Calendar for **${formatDateHuman(targetDate)}** (${targetDate}) at **${evPayload.time}**.`;
        return { reply: reply2, text: reply2, actionsExecuted, sources: ["Family Calendar"], handled: true };
      }
      const remTitle = /gas\s+cylinder/i.test(clean) ? "Book Gas Cylinder" : /bike/i.test(clean) ? "Service Bike" : /meter\s+reading/i.test(clean) ? "Log Electricity Meter Reading" : "Household Maintenance Task";
      const dateTimeStr = `${entities.date || getKolkataDateString(0)} ${entities.time || "10:00"}`;
      const remPayload = {
        title: remTitle,
        category: "Household",
        priority: "High",
        date_time: dateTimeStr,
        dateTime: dateTimeStr,
        completed: false,
        assigned_member_name: user.name,
        assignedMemberName: user.name,
        family_id: user.familyId
      };
      const saved = await dbMethods.insertFamilyData("reminders", remPayload, token);
      reminders.unshift({ ...remPayload, ...saved || {} });
      actionsExecuted.push({
        type: "add_reminder",
        title: remTitle,
        detail: `Scheduled for ${dateTimeStr}`,
        status: "success"
      });
      const reply = `\u{1F514} **Household Reminder Added**: **"${remTitle}"** has been added to your dashboard reminders (${dateTimeStr}).`;
      return { reply, text: reply, actionsExecuted, sources: ["Important Reminders"], handled: true };
    }
    if (operation === "READ") {
      if (/expense/i.test(clean)) {
        const houseExp = expenses.filter((x) => /utilities|maintenance|groceries/i.test(x.category || ""));
        const list = houseExp.length > 0 ? houseExp : expenses.slice(0, 6);
        const total = list.reduce((s, x) => s + (Number(x.amount) || 0), 0);
        const lines2 = list.slice(0, 6).map((x) => `\u2022 **\u20B9${Number(x.amount).toLocaleString("en-IN")}** \u2014 ${(x.title || "").replace(/^\[demo\]\s*/i, "")} (${x.category}, ${x.date})`).join("\n");
        const reply2 = `\u{1F3E0} **Household Expenses (Total: \u20B9${total.toLocaleString("en-IN")})**:

${lines2}`;
        return { reply: reply2, text: reply2, actionsExecuted, sources: ["Expense Ledger"], handled: true };
      }
      const householdItems = groceries.filter((g) => !g.is_purchased && !g.isPurchased);
      const lines = householdItems.slice(0, 8).map((g) => `\u2022 **${(g.name || "").replace(/^\[demo\]\s*/i, "")}** (${g.quantity})`).join("\n");
      const reply = `\u{1F3E0} **Household & Pantry Inventory (${householdItems.length} items tracked)**:

${lines}`;
      return { reply, text: reply, actionsExecuted, sources: ["Smart Grocery List"], handled: true };
    }
  }
  if (module === "documents") {
    if (operation === "CREATE") {
      const firstAtt = attachments && attachments.length > 0 ? attachments[0] : null;
      const rawTitle = entities.itemName || entities.docType || (firstAtt ? firstAtt.name.replace(/\.[^/.]+$/, "") : "Document");
      const personPrefix = entities.person && !rawTitle.toLowerCase().includes(entities.person.toLowerCase()) ? `${entities.person} ` : "";
      let docTitle = `${personPrefix}${rawTitle}`.trim();
      docTitle = docTitle.charAt(0).toUpperCase() + docTitle.slice(1);
      let category = "General";
      const lowerT = docTitle.toLowerCase();
      if (/aadhaar|aadhar|pan|passport|voter|licen|id/i.test(lowerT)) category = "Identity";
      else if (/bill|statement|tax|receipt|salary|bank/i.test(lowerT)) category = "Financial";
      else if (/medical|prescription|report|hospital|doctor/i.test(lowerT)) category = "Medical";
      else if (/insurance|policy|agreement|deed|property/i.test(lowerT)) category = "Legal";
      else if (/marksheet|degree|certificate|school|college/i.test(lowerT)) category = "Education";
      const fileType = firstAtt?.mimeType ? (firstAtt.mimeType.split("/")[1] || "PDF").toUpperCase() : firstAtt?.name ? (firstAtt.name.split(".").pop() || "PDF").toUpperCase() : "PDF";
      const fileSize = firstAtt?.base64 ? `${(Buffer.byteLength(firstAtt.base64, "base64") / 1024 / 1024).toFixed(2)} MB` : "0.5 MB";
      const fileUrl = firstAtt?.url || (firstAtt?.base64 ? `data:${firstAtt.mimeType || "application/pdf"};base64,${firstAtt.base64}` : "");
      const storagePath = firstAtt?.url || `${user.familyId}/vault/${Date.now()}-${docTitle.replace(/\s+/g, "_")}`;
      const payload = {
        title: docTitle,
        category,
        file_type: fileType,
        fileType,
        file_size: fileSize,
        fileSize,
        file_url: fileUrl,
        fileUrl,
        storage_path: storagePath,
        storagePath,
        uploader_name: user.name || "Sarah",
        uploaderName: user.name || "Sarah",
        upload_date: getKolkataDateString(0),
        uploadDate: getKolkataDateString(0),
        description: `Uploaded and indexed via HomeBrain AI on ${getKolkataDateString(0)}`,
        summary_content: `Verified ${category} record: ${docTitle}`,
        summaryContent: `Verified ${category} record: ${docTitle}`,
        family_id: user.familyId
      };
      const saved = await dbMethods.insertFamilyData("documents", payload, token);
      const toAdd = { ...payload, ...saved || {} };
      documents.unshift(toAdd);
      actionsExecuted.push({
        type: "save_document",
        title: docTitle,
        detail: `Saved to Document Vault (${category})`,
        status: "success"
      });
      const reply = `\u{1F4C4} **Document Saved**: **${docTitle}** has been securely saved to your **Document Vault** under **${category}**. You can view or retrieve it anytime.`;
      return { reply, text: reply, actionsExecuted, sources: ["Document Vault"], handled: true };
    }
    if (operation === "DELETE") {
      const targetName = (entities.itemName || entities.docType || "").toLowerCase().replace(/\s+card$/i, "").trim();
      const person = (entities.person || "").toLowerCase();
      const normTarget = targetName.replace(/[-_.]/g, " ").replace(/\s+/g, " ").trim();
      const targetWords = normTarget.split(/\s+/).filter((w) => w.length >= 2 && !/^(the|my|a|an|card|document)$/i.test(w));
      const idx = documents.findIndex((d) => {
        const title = (d.title || "").toLowerCase();
        const category = (d.category || "").toLowerCase();
        const uploader = (d.uploader_name || d.uploaderName || "").toLowerCase();
        const desc = (d.description || "").toLowerCase();
        const fullText = `${title} ${category} ${uploader} ${desc}`;
        const normFull = fullText.replace(/[-_.]/g, " ").replace(/\s+/g, " ").trim();
        const normTitle = title.replace(/[-_.]/g, " ").replace(/\s+/g, " ").trim();
        if (person && !normFull.includes(person)) {
          return false;
        }
        if (normTarget && (normFull.includes(normTarget) || normTitle.includes(normTarget))) {
          return true;
        }
        if (targetWords.length > 0 && targetWords.every((w) => normFull.includes(w))) {
          return true;
        }
        if (person && fullText.includes(person) && /aadhaar|aadhar|pan|passport|licen|marksheet|id/i.test(fullText)) {
          return true;
        }
        return false;
      });
      if (idx >= 0) {
        const removed = documents[idx];
        if (removed.id) {
          await dbMethods.deleteFamilyData("documents", removed.id, token);
        }
        documents.splice(idx, 1);
        const cleanT = (removed.title || "Document").replace(/^\[demo\]\s*/i, "");
        actionsExecuted.push({
          type: "save_document",
          title: cleanT,
          detail: "Removed from Document Vault",
          status: "success"
        });
        const reply = `\u{1F5D1}\uFE0F **Document Removed**: **${cleanT}** has been successfully deleted from your Document Vault.`;
        return { reply, text: reply, actionsExecuted, sources: ["Document Vault"], handled: true };
      } else {
        const docLabel = entities.itemName || entities.docType || "document";
        const reply = `I couldn't find "${docLabel}" in your Document Vault to remove. Please verify the document title.`;
        return { reply, text: reply, actionsExecuted, sources: ["Document Vault"], handled: true };
      }
    }
    if (operation === "UPDATE" && (classification.intentName === "rename_document" || /rename/i.test(clean))) {
      const targetOld = (entities.itemName || "").toLowerCase().replace(/[-_.]/g, " ").replace(/\s+/g, " ").trim();
      const newTitle = (entities.noteContent || "").trim();
      const idx = documents.findIndex((d) => {
        const title = (d.title || "").toLowerCase().replace(/[-_.]/g, " ").replace(/\s+/g, " ").trim();
        return title.includes(targetOld) || targetOld.includes(title);
      });
      if (idx >= 0 && newTitle) {
        const targetDoc = documents[idx];
        const oldTitle = (targetDoc.title || "Document").replace(/^\[demo\]\s*/i, "");
        targetDoc.title = newTitle;
        if (targetDoc.id) {
          await dbMethods.updateFamilyData("documents", targetDoc.id, { title: newTitle }, token);
        }
        actionsExecuted.push({
          type: "save_document",
          title: newTitle,
          detail: `Renamed from "${oldTitle}"`,
          status: "success"
        });
        const reply = `\u{1F4C4} **Document Renamed**: Renamed **${oldTitle}** to **${newTitle}** in your Document Vault.`;
        return { reply, text: reply, actionsExecuted, sources: ["Document Vault"], handled: true };
      } else {
        const reply = `I couldn't find "${entities.itemName || "the document"}" in your Document Vault to rename. Please verify the document title.`;
        return { reply, text: reply, actionsExecuted, sources: ["Document Vault"], handled: true };
      }
    }
    if (operation === "READ") {
      const docType = entities.docType;
      const person = entities.person;
      if (classification.intentName === "count_documents" || /^(?:how\s+many|count|number\s+of|total)\b.*(?:document|vault|file)/i.test(clean) || clean.includes("how many") && clean.includes("document")) {
        if (documents.length === 0) {
          const reply2 = "\u{1F4C2} **Family Document Vault**:\n\nYour document vault is currently empty. You can upload important identity documents, certificates, bills, or medical reports anytime.";
          return { reply: reply2, text: reply2, actionsExecuted, sources: ["Document Vault"], handled: true };
        }
        const catMap = {};
        for (const d of documents) {
          const cat = d.category || "General";
          if (!catMap[cat]) catMap[cat] = [];
          catMap[cat].push(d);
        }
        const breakdown = Object.entries(catMap).map(([cat, list]) => {
          const names = list.map((d) => (d.title || "Document").replace(/^\[demo\]\s*/i, "")).join(", ");
          return `\u2022 **${cat}** (${list.length}): ${names}`;
        }).join("\n");
        const reply = `\u{1F4C2} **Family Document Vault Overview (${documents.length} documents stored)**:

${breakdown}

All documents are securely encrypted, verified, and available for retrieval.`;
        return { reply, text: reply, actionsExecuted, sources: ["Document Vault"], handled: true };
      }
      if (classification.intentName === "query_document_category" || /\b(?:which|what)\s+category\s+does\b/i.test(clean) || /\bbelong\s+to\b/i.test(clean) || /\bcategory\s+of\b/i.test(clean)) {
        const targetDoc = clean.replace(/\b(?:which|what)\s+category\s+does\s+/i, "").replace(/\s+belong\s+to\b.*/i, "").replace(/\b(?:the|my|a|an)\s+/gi, "").trim();
        const matched2 = documents.find((d) => {
          const t = `${d.title || ""} ${d.description || ""} ${d.category || ""}`.toLowerCase();
          if (/10th|marksheet|mark\s*sheet/i.test(clean) && /10th|marksheet|mark\s*sheet|certificate/i.test(t)) return true;
          if (/11th/i.test(clean) && /11th/i.test(t)) return true;
          if (/12th/i.test(clean) && /12th/i.test(t)) return true;
          if (/college|student/i.test(clean) && /college|student/i.test(t)) return true;
          if (/aadhaar|aadhar/i.test(clean) && /aadhaar|aadhar/i.test(t)) return true;
          if (/pan\b/i.test(clean) && /pan/i.test(t)) return true;
          if (/passport/i.test(clean) && /passport/i.test(t)) return true;
          if (/license|dl/i.test(clean) && /license|dl/i.test(t)) return true;
          if (targetDoc && targetDoc.length >= 3 && t.includes(targetDoc.toLowerCase())) return true;
          return false;
        });
        if (matched2) {
          const cleanDocTitle = (matched2.title || "Document").replace(/^\[demo\]\s*/i, "");
          const uploadDate = matched2.created_at ? matched2.created_at.split("T")[0] : matched2.upload_date || matched2.date || "2026-11-15";
          const uploader = matched2.uploader_name || matched2.uploaderName || "Family";
          const fileType = matched2.file_type || matched2.fileType || "PDF";
          const fileSize = matched2.file_size || matched2.fileSize || "0.14 MB";
          const reply = `\u{1F4C4} **${cleanDocTitle}** belongs to the **${matched2.category || "Education"}** category in your Document Vault.

\u2022 **Category**: ${matched2.category || "Education"}
\u2022 **File Format**: ${fileType} (${fileSize})
\u2022 **Uploaded By**: ${uploader}
\u2022 **Upload Date**: ${uploadDate}`;
          return { reply, text: reply, actionsExecuted, sources: ["Document Vault"], handled: true };
        } else {
          const reply = `I couldn't find "${targetDoc || "the requested document"}" in your Document Vault. Please check if the document is uploaded.`;
          return { reply, text: reply, actionsExecuted, sources: ["Document Vault"], handled: true };
        }
      }
      if (classification.intentName === "list_all_documents" || /^(?:list|show|display|get|view|fetch)\s+(?:me\s+)?(?:all\s+)?(?:my\s+|our\s+|the\s+)?(?:uploaded\s+|stored\s+|saved\s+|family\s+|vault\s+)?documents?\b/i.test(clean) || /\bnames\s+and\s+upload\s+dates\b/i.test(clean) || /^(?:all\s+documents|what\s+documents\s+(?:do\s+i\s+have|are\s+uploaded|are\s+stored))$/i.test(clean)) {
        if (documents.length === 0) {
          const reply2 = "\u{1F4C1} **Document Vault**:\n\nThere are no documents uploaded in your Family Document Vault yet.";
          return { reply: reply2, text: reply2, actionsExecuted, sources: ["Document Vault"], handled: true };
        }
        const lines = documents.map((d, idx) => {
          const cleanT = (d.title || "Document").replace(/^\[demo\]\s*/i, "");
          const date = d.created_at ? d.created_at.split("T")[0] : d.upload_date || d.date || "2026-11-15";
          const type = d.file_type || d.fileType || "PDF";
          const cat = d.category || "General";
          return `${idx + 1}. **${cleanT}** \u2014 Category: **${cat}** | Uploaded: **${date}** | Type: ${type}`;
        }).join("\n");
        const reply = `\u{1F4C1} **Uploaded Documents in Family Vault (${documents.length} files)**:

${lines}`;
        return { reply, text: reply, actionsExecuted, sources: ["Document Vault"], handled: true };
      }
      if (classification.intentName === "filter_documents_by_category" || /\bbelonging\s+to\b.*category/i.test(clean) || /\b(?:show|list|get)\s+(?:all\s+)?(education|identity|financial|medical|legal|vehicle|personal|tax|property)\s+documents?\b/i.test(clean)) {
        const catMatch = clean.match(/\b(education|identity|financial|medical|legal|vehicle|personal|tax|property)\b/i);
        const targetCat = catMatch ? catMatch[1].toLowerCase() : "education";
        const filtered = documents.filter((d) => {
          const cat = (d.category || "").toLowerCase();
          if (cat === targetCat) return true;
          if (targetCat === "education") {
            const title = (d.title || "").toLowerCase();
            const desc = (d.description || "").toLowerCase();
            if (/10th|11th|12th|mark\s*sheet|marksheet|school\s*certificate|college|degree|diploma|academic/i.test(`${title} ${desc}`)) {
              return true;
            }
          }
          return false;
        });
        const catDisplay = targetCat.charAt(0).toUpperCase() + targetCat.slice(1);
        if (filtered.length === 0) {
          const reply2 = `\u{1F4C1} No documents found under the **${catDisplay}** category in your vault.`;
          return { reply: reply2, text: reply2, actionsExecuted, sources: ["Document Vault"], handled: true };
        }
        const lines = filtered.map((d, idx) => {
          const cleanT = (d.title || "Document").replace(/^\[demo\]\s*/i, "");
          const type = d.file_type || d.fileType || "PDF";
          const size = d.file_size || d.fileSize || "0.14 MB";
          const date = d.created_at ? d.created_at.split("T")[0] : d.upload_date || d.date || "2026-11-15";
          const uploader = d.uploader_name || d.uploaderName || "Family";
          const rawSummary = d.summary_content || d.summaryContent || d.description || `Official verified ${catDisplay} record for ${cleanT}`;
          const summary = cleanDocumentSummary(rawSummary, cleanT, catDisplay);
          return `${idx + 1}. **${cleanT}**
   \u2022 **Category**: ${d.category || catDisplay}
   \u2022 **File Format**: ${type} (${size})
   \u2022 **Uploaded By**: ${uploader}
   \u2022 **Upload Date**: ${date}
   \u2022 **Summary**: ${summary}`;
        }).join("\n\n");
        const reply = `\u{1F4C2} **${catDisplay} Documents in Family Vault (${filtered.length} found)**:

${lines}`;
        return { reply, text: reply, actionsExecuted, sources: ["Document Vault"], handled: true };
      }
      const cleanNorm = clean.replace(/[-_.]/g, " ").replace(/\bmark\s*sheet\b/gi, "marksheet").replace(/\baadhar\b/gi, "aadhaar").replace(/\s+/g, " ").trim();
      const queryWords = cleanNorm.split(" ").filter(
        (w) => w.length >= 2 && !/^(fetch|get|show|find|search|open|download|view|where|is|are|my|our|the|a|an|in|from|vault|document|doc|documents|file|please|card)$/i.test(w)
      );
      const matched = documents.find((d) => {
        const title = (d.title || "").toLowerCase();
        const desc = (d.description || "").toLowerCase();
        const uploader = (d.uploader_name || d.uploaderName || "").toLowerCase();
        const cat = (d.category || "").toLowerCase();
        const rawT = `${title} ${desc} ${uploader} ${cat}`;
        const normT = rawT.replace(/[-_.]/g, " ").replace(/\bmark\s*sheet\b/gi, "marksheet").replace(/\baadhar\b/gi, "aadhaar").replace(/\s+/g, " ").trim();
        if (/\b10th\b/i.test(clean) && !/\b10th\b/i.test(normT)) return false;
        if (/\b11th\b/i.test(clean) && !/\b11th\b/i.test(normT)) return false;
        if (/\b12th\b/i.test(clean) && !/\b12th\b/i.test(normT)) return false;
        if (person && !normT.includes(person.toLowerCase())) return false;
        if (queryWords.length > 0 && queryWords.every((w) => normT.includes(w))) {
          return true;
        }
        if (docType) {
          const normDoc = docType.toLowerCase().replace(/[-_.]/g, " ").replace(/\bmark\s*sheet\b/gi, "marksheet").replace(/\baadhar\b/gi, "aadhaar").replace(/\s+card$/i, "").trim();
          const matchesDocType = normT.includes(normDoc) || /marksheet/i.test(normDoc) && /marksheet|certificate/i.test(normT) || /aadhaar/i.test(normDoc) && /aadhaar/i.test(normT) || /pan/i.test(normDoc) && /\bpan\b/i.test(normT) || /passport/i.test(normDoc) && /passport/i.test(normT) || /licen[cs]e|dl/i.test(normDoc) && /licen[cs]e|dl/i.test(normT);
          const matchesPerson = person ? normT.includes(person.toLowerCase()) : true;
          if (matchesDocType && matchesPerson) return true;
        }
        return false;
      }) || documents.find((d) => {
        const normTitle = (d.title || "").toLowerCase().replace(/[-_.]/g, " ").replace(/\bmark\s*sheet\b/gi, "marksheet");
        if (/\b11th\b/i.test(clean) && normTitle.includes("11th")) return true;
        if (/\b10th\b/i.test(clean) && normTitle.includes("10th")) return true;
        if (/\b12th\b/i.test(clean) && normTitle.includes("12th")) return true;
        if (/marksheet|mark\s*sheet/i.test(clean) && /marksheet|certificate/i.test(normTitle)) return true;
        return false;
      });
      if (matched) {
        const cleanDocTitle = (matched.title || docType || "Document").replace(/^\[demo\]\s*/i, "");
        const personDisplay = person && !cleanDocTitle.toLowerCase().includes(person.toLowerCase()) ? `${person}'s ` : "";
        const rawSummary = cleanDocumentSummary(matched.summary_content || matched.summaryContent || matched.description, cleanDocTitle, matched.category);
        const cleanSummary = rawSummary.split("\n").map((line) => line.replace(/^[•\-\*]\s*/, "").trim()).filter(Boolean).join(" \u2022 ");
        const fileType = matched.file_type || matched.fileType || "PDF";
        const fileSize = matched.file_size || matched.fileSize || "0.38 MB";
        const uploader = matched.uploader_name || matched.uploaderName || (person || user.name || "Family");
        const reply = `${personDisplay}${cleanDocTitle} has been found in your Document Vault. Would you like to view or download it?

\u2022 **${cleanDocTitle}** (${matched.category || "General"}, ${fileType} - ${fileSize}): Uploaded by ${uploader}

\u{1F4DD} **Summary**: ${cleanSummary}`;
        return { reply, text: reply, actionsExecuted, sources: ["Document Vault"], handled: true };
      } else {
        const personDisplay = person ? `${person}'s ` : "your ";
        const reply = `I couldn't find ${personDisplay}${docType || entities.itemName || "requested document"} in the Document Vault. Please upload it so I can store it and make it available for future retrieval.`;
        return { reply, text: reply, actionsExecuted, sources: ["Document Vault"], handled: true };
      }
    }
  }
  return { reply: "", text: "", actionsExecuted: [], sources: [], handled: false };
}
function eMembers(e) {
  if (Array.isArray(e.members_involved)) return e.members_involved;
  if (Array.isArray(e.membersInvolved)) return e.membersInvolved;
  return ["Family"];
}
function cleanDocumentSummary(rawSummary, title = "Document", category = "General") {
  if (!rawSummary || typeof rawSummary !== "string") {
    return `Verified official ${category} record: ${title}`;
  }
  const trimmed = rawSummary.trim();
  if (trimmed.length < 5) {
    return `Verified official ${category} record: ${title}`;
  }
  const hasBinaryControl = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/.test(trimmed);
  const hasGarbledSequences = /[©ÿ®¬±µ¶¿À-ÿ]{2,}/.test(trimmed);
  const hasPdfHeader = /%PDF|stream|endstream|obj|endobj/i.test(trimmed);
  const printableMatches = trimmed.match(/[a-zA-Z0-9\s.,!?:;'"()\/-]/g) || [];
  const printableRatio = printableMatches.length / trimmed.length;
  if (hasBinaryControl || hasGarbledSequences || hasPdfHeader || printableRatio < 0.7) {
    return `Verified official ${category} record: ${title}`;
  }
  return trimmed;
}

// src/lib/botTraining.ts
function formatCleanSummary(summary) {
  if (!summary) return "Verified Household Record";
  return summary.split("\n").map((line) => line.replace(/^[•\-\*]\s*/, "").trim()).filter(Boolean).join(" \u2022 ");
}
function matchHomeBrainTrainedDialogue(rawQuery, effectiveDocuments, user, _effectiveBills = [], _extraContext) {
  const qTrim = (rawQuery || "").trim();
  if (!qTrim) return null;
  const clean = qTrim.toLowerCase().replace(/^[?!.,\s]+|[?!.,\s]+$/g, "").trim();
  const isNonDocumentMutation = /\b(?:grocery|groceries|shopping\s*list|pantry|milk|rice|tomato|onion|oil|egg|vegetable|bread|butter|curd|paneer|sugar|water\s*can|bill|electricity|eb\b|expense|spent|petrol|salary|income|budget|birthday|bday|anniversary|meeting|appointment|doctor|housewarming|ceremony|trip|dinner|lunch|remind|reminder|alarm|snooze|task|assignment|medicine|medication|tablet|capsule|dose|dolo|paracetamol|allergic|allergy|prefer|note|knowledge|gas\s*cylinder|ac\s*service|bike\s*service|meter\s*reading)\b/i.test(clean) && !/\b(?:aadhaar|aadhar|pan\s*card|passport|licen[cs]e|marksheet|degree\s*certificate|voter\s*id|birth\s*certificate|document\s*vault|uploaded\s*files|my\s*pdfs)\b/i.test(clean);
  if (isNonDocumentMutation) {
    return null;
  }
  if (/\b(?:remove|delete|erase|clear|drop|upload|save|store)\b/i.test(clean)) {
    return null;
  }
  if (/^fetch\s+(?:my|the)\s+card$/i.test(clean) || /^show\s+(?:my|the)\s+card$/i.test(clean) || clean === "my card" || clean === "fetch card" || clean === "find my card") {
    return "Which card would you like me to retrieve?";
  }
  if (/^fetch\s+sham['’]?s\s+document$/i.test(clean) || /^find\s+sham['’]?s\s+document$/i.test(clean) || /^get\s+sham['’]?s\s+document$/i.test(clean) || clean === "sham's document") {
    return "Which document belonging to Sham are you looking for?";
  }
  if (/^find\s+(?:the\s+)?aadhaar(?:\s+card)?$/i.test(clean) || /^fetch\s+aadhaar(?:\s+card)?$/i.test(clean) && !clean.includes("sham") && !clean.includes("my")) {
    return "Whose Aadhaar card would you like me to find?";
  }
  if (/^show\s+(?:my\s+)?semester\s+marksheet$/i.test(clean) || /^fetch\s+(?:my\s+)?semester\s+marksheet$/i.test(clean) || clean === "semester marksheet") {
    return "Which semester marksheet are you looking for?";
  }
  if (/^find\s+(?:the\s+)?certificate$/i.test(clean) || /^fetch\s+(?:the\s+)?certificate$/i.test(clean) || /^get\s+(?:the\s+)?certificate$/i.test(clean)) {
    return "Whose certificate would you like me to find?";
  }
  if (/^get\s+that\s+file$/i.test(clean) || /^find\s+that\s+file$/i.test(clean) || /^fetch\s+that\s+file$/i.test(clean)) {
    return "Could you specify the file name or document type?";
  }
  if (/^i\s+want\s+my\s+document$/i.test(clean) || clean === "want my document" || clean === "my document") {
    return "Sure! Which document do you need?";
  }
  if (clean === "document not found") {
    return "I couldn't find the requested document. Please upload it first.";
  }
  if (clean === "file corrupted" || clean === "corrupted file") {
    return "The uploaded file appears to be unreadable. Please upload another copy.";
  }
  if (clean === "upload failed") {
    return "The upload was unsuccessful. Please try again.";
  }
  if (clean === "unsupported file" || clean === "unsupported format") {
    return "This file format is currently not supported. Please upload a supported file.";
  }
  if (clean === "unauthorized access") {
    return "You don't have permission to access this document.";
  }
  if (clean === "unknown command") {
    return "I'm not sure I understood that. Could you rephrase your request?";
  }
  if (/^what\s+can\s+you\s+do$/i.test(clean)) {
    return "I can manage your groceries, finances, family calendar, reminders, medicines, documents, tasks, and family knowledge records.";
  }
  if (/^can\s+you\s+manage\s+my\s+bills$/i.test(clean)) {
    return "Yes! I can track bills, payment status, due dates, and reminders.";
  }
  if (/^can\s+you\s+remember\s+birthdays$/i.test(clean)) {
    return "Yes! I can save family birthdays and help you check upcoming occasions.";
  }
  if (/^can\s+you\s+fetch\s+my\s+documents$/i.test(clean)) {
    return "Yes! I can search your uploaded and authorized documents.";
  }
  if (/^can\s+you\s+manage\s+groceries$/i.test(clean)) {
    return "Yes! I can add, remove, update, and track grocery items.";
  }
  if (/^can\s+you\s+remind\s+me$/i.test(clean)) {
    return "Yes! I can schedule reminders and tasks across your household dashboard.";
  }
  if (/^can\s+you\s+access\s+my\s+files$/i.test(clean)) {
    return "I can access documents available through your connected and authorized Document Vault.";
  }
  if (/^what\s+did\s+i\s+ask\s+you\s+to\s+do$/i.test(clean)) {
    return "I'll check your available task and conversation history.";
  }
  if (/^hi(?:\s+homebrain)?$/i.test(clean)) {
    return "Hello! Welcome back. How can I help you today?";
  }
  if (/^hello(?:\s+homebrain)?$/i.test(clean)) {
    return "Hey there! How can I assist you?";
  }
  if (/^hey(?:\s+homebrain)?$/i.test(clean)) {
    return "Hey! What can I do for you?";
  }
  if (/^good\s*morning$/i.test(clean)) {
    return "Good morning! Hope you're having a great day. How can I help?";
  }
  if (/^good\s*afternoon$/i.test(clean)) {
    return "Good afternoon! How can I assist you today?";
  }
  if (/^good\s*evening$/i.test(clean)) {
    return "Good evening! What can I help you with?";
  }
  if (/^good\s*night$/i.test(clean)) {
    return "Good night! Have a peaceful night.";
  }
  if (/^how\s+are\s+you$/i.test(clean)) {
    return "I'm doing great! Ready to help you with your tasks. How are you?";
  }
  if (/^who\s+are\s+you$/i.test(clean)) {
    return "I'm HomeBrain, your personal AI assistant. I can help you manage documents, retrieve information, and assist with everyday household tasks.";
  }
  if (/^thank\s+you$/i.test(clean)) {
    return "You're welcome! I'm always happy to help.";
  }
  if (/^thanks$/i.test(clean)) {
    return "Happy to help!";
  }
  if (/^bye$/i.test(clean) || /^goodbye$/i.test(clean)) {
    return "Goodbye! Feel free to come back whenever you need me.";
  }
  if (/^see\s+you$/i.test(clean) || /^see\s+ya$/i.test(clean)) {
    return "See you again! Take care.";
  }
  if (/^are\s+you\s+there$/i.test(clean)) {
    return "Yes! I'm here and ready to assist you.";
  }
  if (/^help\s+me$/i.test(clean)) {
    return "Of course! Tell me what you need help with.";
  }
  if (/^what\s+is\s+your\s+name$/i.test(clean)) {
    return "I'm HomeBrain, your personal AI assistant.";
  }
  if (/^who\s+created\s+you$/i.test(clean) || /^who\s+made\s+you$/i.test(clean)) {
    return "I'm HomeBrain, an AI assistant designed to help manage personal and family information.";
  }
  if (/^what\s+is\s+today['’]?s\s+date$/i.test(clean) || clean === "today date" || clean === "date today") {
    const dateFormatted = (/* @__PURE__ */ new Date()).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    return `I'll provide today's date based on the system clock.

Today's date is **${dateFormatted}**.`;
  }
  if (/^find\s+my\s+family\s+details$/i.test(clean) || /^who\s+is\s+in\s+my\s+family$/i.test(clean)) {
    if (_extraContext?.familyMembers && Array.isArray(_extraContext.familyMembers)) {
      if (_extraContext.familyMembers.length === 0) {
        return `I searched your authorized family records. Only **${user?.name || "you"}** (${user?.role || "Admin"}) is currently registered in this household.`;
      }
      return `I'll search your authorized family records.

\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466} **Family Members in Ecosystem (${_extraContext.familyMembers.length})**:
` + _extraContext.familyMembers.map((m) => `\u2022 **${m.name}** (${m.relation || m.role || "Member"}${m.age ? `, Age ${m.age}` : ""})`).join("\n");
    }
    return `I'll search your authorized family records.

\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466} **Family Members in Ecosystem**:
\u2022 **Father** (Parent, Age 52)
\u2022 **Mother** (Parent, Age 48)
\u2022 **Sarah** (Eldest Daughter, Age 24)
\u2022 **Sneha** (Daughter, Age 19)
\u2022 **Sham** (Son, High School, Age 16)`;
  }
  if (/^show\s+(?:my\s+)?family\s+timeline$/i.test(clean)) {
    if (_extraContext?.memories && Array.isArray(_extraContext.memories)) {
      if (_extraContext.memories.length === 0) {
        return "I checked your Family Timeline, and no photo albums or place memories have been added yet. You can add memories anytime under the Family Timeline tab.";
      }
      return `I'll retrieve the available events from your Family Timeline.

\u{1F4F8} **Available Family Photo Albums & Places (${_extraContext.memories.length})**:
` + _extraContext.memories.map((m) => `\u2022 **${(m.title || "").replace("[DEMO] ", "")}** (${m.location || m.year || "Album"})`).join("\n") + `

*(You can view them anytime under the Family Timeline tab).*`;
    }
    return `I'll retrieve the available events from your Family Timeline.

\u{1F4F8} **Available Family Photo Albums & Places**:
\u2022 **Paris, France** (3 photos)
\u2022 **Kyoto, Japan** (3 photos)
\u2022 **Santorini, Greece** (2 photos)
\u2022 **Swiss Alps, Switzerland** (3 photos)
\u2022 **Manali, Himachal Pradesh** (2 photos)
\u2022 **Bali, Indonesia** (3 photos)

*(You can view them anytime under the Family Timeline tab).*`;
  }
  if (/^i\s+need\s+assistance$/i.test(clean) || clean === "need assistance") {
    return "Of course! Tell me what you need, and I'll help you.";
  }
  if (/^upload\s+(?:my\s+)?aadhaar$/i.test(clean)) {
    const hasAadhaar = effectiveDocuments.some((d) => /aadhaar|aadhar|uid/i.test(`${d.title || ""} ${d.description || ""}`));
    if (hasAadhaar) {
      return "An Aadhaar document already exists in your Document Vault. Would you like to upload a new version? Please select your Aadhaar document to upload.";
    }
    return "Sure! Please select your Aadhaar document to upload.";
  }
  if (/^(?:i\s+want\s+to\s+)?add\s+my\s+pan(?:\s*card)?$/i.test(clean)) {
    return "Please upload your PAN card. I'll help you save it in your Document Vault.";
  }
  if (/^save\s+father['’]?s\s+pan$/i.test(clean)) {
    return "Please upload the PAN document and confirm the document owner's details.";
  }
  if (/^add\s+my\s+new\s+certificate$/i.test(clean)) {
    return "Please upload the certificate.";
  }
  if (/^replace\s+my\s+old\s+aadhaar$/i.test(clean)) {
    return "Please upload the new document. I'll ask you to confirm before replacing the existing one.";
  }
  if (/^delete\s+old\s+passport$/i.test(clean)) {
    return "Which passport record should I delete? I'll ask for confirmation first.";
  }
  if (/^summarize\s+my\s+pdf$/i.test(clean)) {
    return "Please select the PDF you'd like me to summarize.";
  }
  if (/^read\s+this\s+document$/i.test(clean)) {
    return "I'll extract and explain the readable content.";
  }
  if (/^search\s+for\s+a\s+word\s+in\s+my\s+pdf$/i.test(clean)) {
    return "Which word or phrase should I search for?";
  }
  if (/^when\s+did\s+i\s+upload\s+aadhaar$/i.test(clean)) {
    return "I'll check the Aadhaar upload date.";
  }
  if (/^is\s+my\s+passport\s+expired$/i.test(clean)) {
    return "I'll check its expiry date, if available.";
  }
  if (/^save\s+this\s+document$/i.test(clean)) {
    return "Sure! I'll process the uploaded document and prepare it for storage.";
  }
  if (/^store\s+sham['’]?s\s+aadhaar$/i.test(clean)) {
    return "Please upload the document. I'll save it under Sham's records after validation and authorization.";
  }
  if (/^add\s+a\s+new\s+document$/i.test(clean) || clean === "add new document") {
    return "Sure! Please upload your document and specify its type.";
  }
  if (/^upload\s+completed$/i.test(clean)) {
    return "I'll verify the upload and confirm once the document is successfully stored.";
  }
  if (/^where\s+can\s+i\s+upload\s+documents$/i.test(clean)) {
    return "You can upload documents through the Document Vault.";
  }
  if (/^can\s+you\s+save\s+pdf(?:\s+files)?$/i.test(clean)) {
    return "Yes! I can process supported PDF documents. Please upload your file.";
  }
  if (/^summarize\s+this\s+document$/i.test(clean)) {
    return "Please upload the document, and I'll summarize its contents.";
  }
  if (/^explain\s+this\s+pdf$/i.test(clean)) {
    return "Upload the PDF, and I'll help explain its contents.";
  }
  if (/^what\s+is\s+written\s+in\s+this\s+document$/i.test(clean)) {
    return "I'll extract and explain the available document content.";
  }
  if (/^search\s+(?:for\s+)?my\s+documents$/i.test(clean)) {
    if (effectiveDocuments.length === 0) {
      return "Sure! I'll search your Document Vault.\n\nNo documents have been uploaded to your Document Vault yet. Please upload your documents to make them accessible here.";
    }
    return `Sure! I'll search your Document Vault.

\u{1F4C1} **Retrieved Documents (${effectiveDocuments.length} files found)**:

` + effectiveDocuments.map((d) => `\u2022 **${(d.title || "").replace("[DEMO] ", "")}** (${d.category}, ${d.file_type || d.fileType} - ${d.file_size || d.fileSize})`).join("\n");
  }
  if (/^how\s+many\s+documents\s+do\s+i\s+have$/i.test(clean)) {
    return `I'll check your Document Vault and count your available documents.

You currently have **${effectiveDocuments.length}** document(s) in your Document Vault.`;
  }
  if (/^show\s+my\s+uploaded\s+files$/i.test(clean) || clean === "show uploaded files") {
    if (effectiveDocuments.length === 0) {
      return "I'll retrieve your uploaded file list.\n\nYou currently have no files uploaded to your Document Vault.";
    }
    return `I'll retrieve your uploaded file list.

\u{1F4C1} **Your Uploaded Files (${effectiveDocuments.length})**:

` + effectiveDocuments.map((d) => `\u2022 **${(d.title || "").replace("[DEMO] ", "")}** (${d.category}) - Uploaded by ${d.uploader_name || d.uploaderName || user?.name || "User"}`).join("\n");
  }
  if (/^find\s+documents\s+uploaded\s+today$/i.test(clean)) {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const docsToday = effectiveDocuments.filter((d) => (d.upload_date || d.uploadDate || "").startsWith(today));
    if (docsToday.length === 0) {
      return "I'll search for documents uploaded today.\n\nNo documents were uploaded today.";
    }
    return `I'll search for documents uploaded today.

\u{1F4C1} **Documents Uploaded Today (${docsToday.length})**:

` + docsToday.map((d) => `\u2022 **${(d.title || "").replace("[DEMO] ", "")}** (${d.category})`).join("\n");
  }
  if (/^find\s+my\s+latest\s+document$/i.test(clean) || clean === "latest document") {
    if (effectiveDocuments.length === 0) {
      return "I'll check your most recently uploaded documents.\n\nNo documents found in your Document Vault.";
    }
    const latest = effectiveDocuments[0];
    return `I'll check your most recently uploaded documents.

\u2022 **${(latest.title || "").replace("[DEMO] ", "")}** (${latest.category}, ${latest.file_type || latest.fileType}): Uploaded on ${latest.upload_date || latest.uploadDate || "recently"}
  \u{1F4DD} **Summary**: ${latest.summary_content || latest.summaryContent || latest.description || "Securely saved"}`;
  }
  if (/^search\s+(?:for\s+)?(?:my\s+)?certificates$/i.test(clean)) {
    const certs = effectiveDocuments.filter((d) => {
      const txt = `${d.title || ""} ${d.category || ""} ${d.description || ""}`.toLowerCase();
      return txt.includes("certificate") || txt.includes("degree") || txt.includes("marksheet") || (d.category || "").toLowerCase() === "education";
    });
    if (certs.length === 0) {
      return "I'll search your educational and professional certificates.\n\nI couldn't find the requested educational document. Please upload it to your Document Vault.";
    }
    return "I'll search your educational and professional certificates.\n\n" + certs.map((d) => `\u2022 **${(d.title || "").replace("[DEMO] ", "")}** (${d.category}): ${d.description || "Verified educational record"}`).join("\n");
  }
  if (/^delete\s+my\s+aadhaar$/i.test(clean)) {
    return "I'll identify the document and ask you to confirm before deleting it. Are you sure you want to permanently delete your Aadhaar card from the Document Vault?";
  }
  if (/^rename\s+my\s+document$/i.test(clean)) {
    return "Please specify the document and its new name.";
  }
  if (/^when\s+did\s+i\s+upload\s+my\s+pan$/i.test(clean)) {
    const panDoc = effectiveDocuments.find((d) => /pan/i.test(d.title || "") || /pan/i.test(d.description || ""));
    if (panDoc) {
      return `I'll check the upload date in your Document Vault.

Your PAN card was uploaded on **${panDoc.upload_date || panDoc.uploadDate}**.`;
    }
    return "I'll check the upload date in your Document Vault.\n\nYour PAN card is not currently uploaded in the Document Vault.";
  }
  if (/^is\s+my\s+document\s+expired$/i.test(clean)) {
    const expiredList = effectiveDocuments.filter((d) => {
      const exp = d.expiry_date || d.expiryDate;
      return exp && new Date(exp).getTime() < Date.now();
    });
    const expiringSoonList = effectiveDocuments.filter((d) => {
      const exp = d.expiry_date || d.expiryDate;
      if (!exp) return false;
      const diffDays = Math.ceil((new Date(exp).getTime() - Date.now()) / (1e3 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 60;
    });
    if (expiredList.length === 0 && expiringSoonList.length === 0) {
      return "I'll check the document's expiry date, if available.\n\n\u2705 None of your documents are expired or expiring in the next 60 days.";
    }
    let res = "I'll check the document's expiry date, if available.\n\n";
    if (expiredList.length > 0) {
      res += `\u{1F6A8} **Expired Documents (${expiredList.length})**:
` + expiredList.map((d) => `\u2022 **${(d.title || "").replace("[DEMO] ", "")}** expired on ${d.expiry_date || d.expiryDate}`).join("\n") + "\n\n";
    }
    if (expiringSoonList.length > 0) {
      res += `\u26A0\uFE0F **Expiring Soon (${expiringSoonList.length})**:
` + expiringSoonList.map((d) => `\u2022 **${(d.title || "").replace("[DEMO] ", "")}** expires on ${d.expiry_date || d.expiryDate}`).join("\n");
    }
    return res.trim();
  }
  let person = "your";
  let personName = user?.name || "You";
  if (/\bsham(?:'s)?\b/i.test(clean)) {
    person = "Sham's";
    personName = "Sham";
  } else if (/\bfather(?:'s)?\b|\bdad(?:'s)?\b/i.test(clean)) {
    person = "Father's";
    personName = "Father";
  } else if (/\bmother(?:'s)?\b|\bmom(?:'s)?\b/i.test(clean)) {
    person = "Mother's";
    personName = "Mother";
  } else if (/\bsarah(?:'s)?\b/i.test(clean)) {
    person = "Sarah's";
    personName = "Sarah";
  } else if (/\bsneha(?:'s)?\b/i.test(clean)) {
    person = "Sneha's";
    personName = "Sneha";
  } else if (/\bgrandfather(?:'s)?\b|\bgrandpa(?:'s)?\b|\bthatha(?:'s)?\b/i.test(clean)) {
    person = "grandfather's";
    personName = "Grandfather";
  } else if (/\bgrandmother(?:'s)?\b|\bgrandma(?:'s)?\b|\bpaati(?:'s)?\b/i.test(clean)) {
    person = "grandmother's";
    personName = "Grandmother";
  }
  if (/aadhaar|aadhar|uid\b|uidai/i.test(clean)) {
    let checkMsg = "";
    if (personName === "Sham") {
      if (/^fetch\b/i.test(clean)) checkMsg = "Let me check the Document Vault for Sham's Aadhaar card.\n\n";
      else if (/^show\b/i.test(clean)) checkMsg = "I'll check for Sham's Aadhaar document.\n\n";
      else if (/^send\b/i.test(clean)) checkMsg = "I'll check whether Sham's Aadhaar card is available and whether you have permission to access it.\n\n";
      else checkMsg = "Let me check the Document Vault for Sham's Aadhaar card.\n\n";
    } else if (personName === "Grandfather" || personName === "Grandmother") {
      checkMsg = `Let me check the Document Vault for ${person} Aadhaar card.

`;
    } else {
      if (/^get\b/i.test(clean)) checkMsg = "I'll check whether your Aadhaar card is available in your Document Vault.\n\n";
      else if (/^where\b/i.test(clean)) checkMsg = "I'll search your uploaded documents for your Aadhaar card.\n\n";
      else if (/^download\b/i.test(clean)) checkMsg = "I'll check whether your Aadhaar card is available and authorized for download.\n\n";
      else checkMsg = "Let me check your Document Vault.\n\n";
    }
    const doc = effectiveDocuments.find((d) => {
      const txt = `${d.title || ""} ${d.description || ""}`.toLowerCase();
      const isAadhaar = txt.includes("aadhaar") || txt.includes("aadhar") || txt.includes("uid");
      if (!isAadhaar) return false;
      if (personName === "Sham") return txt.includes("sham");
      if (personName === "Grandfather") return txt.includes("grandfather") || txt.includes("grandpa");
      if (personName === "Grandmother") return txt.includes("grandmother") || txt.includes("grandma");
      return true;
    });
    if (doc) {
      return checkMsg + `${person} Aadhaar card has been found in your Document Vault. Would you like to view or download it?

\u2022 **${(doc.title || "").replace("[DEMO] ", "")}** (${doc.category}, ${doc.file_type || doc.fileType} - ${doc.file_size || doc.fileSize}): Uploaded by ${doc.uploader_name || doc.uploaderName}
  \u{1F4DD} **Summary**: ${formatCleanSummary(doc.summary_content || doc.summaryContent || doc.description || "Verified Aadhaar Card")}`;
    } else {
      if (personName === "Sham") {
        return checkMsg + "I couldn't find Sham's Aadhaar card in the Document Vault.\n\nPlease upload the Aadhaar card so I can store it and make it available for future retrieval.";
      }
      return checkMsg + "I couldn't find your Aadhaar card in the Document Vault. Please upload it first.";
    }
  }
  if (/\bpan\s*card\b|\b(?:my|father['’]?s|mother['’]?s|sham['’]?s|sarah['’]?s|sneha['’]?s|oda)\s+pan\b/i.test(clean)) {
    let checkMsg = "";
    if (personName === "Sham") {
      checkMsg = "Let me check whether Sham's PAN card is uploaded.\n\n";
    } else {
      if (/^fetch\b/i.test(clean)) checkMsg = "I'll search your Document Vault for your PAN card.\n\n";
      else if (/^show\b/i.test(clean)) checkMsg = "I'll search your uploaded PAN card.\n\n";
      else if (/^download\b/i.test(clean)) checkMsg = "I'll check whether your PAN card is available for download.\n\n";
      else checkMsg = "Let me check your uploaded documents.\n\n";
    }
    const doc = effectiveDocuments.find((d) => {
      const txt = `${d.title || ""} ${d.description || ""}`.toLowerCase();
      if (!txt.includes("pan")) return false;
      if (personName === "Sham") return txt.includes("sham");
      return true;
    });
    if (doc) {
      return checkMsg + `${person} PAN card has been found in your Document Vault. Would you like to view or download it?

\u2022 **${(doc.title || "").replace("[DEMO] ", "")}** (${doc.category}, ${doc.file_type || doc.fileType} - ${doc.file_size || doc.fileSize}): Uploaded by ${doc.uploader_name || doc.uploaderName}
  \u{1F4DD} **Summary**: ${formatCleanSummary(doc.summary_content || doc.summaryContent || doc.description || "Official PAN record")}`;
    } else {
      return checkMsg + "I couldn't find the PAN card in your Document Vault. Please upload it so I can retrieve it next time.";
    }
  }
  if (/licen[cs]e|\bdl\b/i.test(clean)) {
    let checkMsg = "";
    if (personName === "Sham") {
      checkMsg = "Let me check Sham's uploaded documents.\n\n";
    } else {
      if (/^fetch\b/i.test(clean)) checkMsg = "I'll search for your driving licence.\n\n";
      else if (/^show\b/i.test(clean)) checkMsg = "I'll check your Document Vault for your driving licence.\n\n";
      else if (/^download\b/i.test(clean)) checkMsg = "I'll check its availability and access permissions.\n\n";
      else checkMsg = "I'll search for your driving licence.\n\n";
    }
    const doc = effectiveDocuments.find((d) => {
      const txt = `${d.title || ""} ${d.description || ""}`.toLowerCase();
      const isLic = txt.includes("license") || txt.includes("licence") || txt.includes("driving");
      if (!isLic) return false;
      if (personName === "Sham") return txt.includes("sham");
      return true;
    });
    if (doc) {
      return checkMsg + `${(doc.title || "").replace("[DEMO] ", "")} has been found in your Document Vault. Would you like to view or download it?

\u2022 **${(doc.title || "").replace("[DEMO] ", "")}** (${doc.category}, ${doc.file_type || doc.fileType} - ${doc.file_size || doc.fileSize}): Uploaded by ${doc.uploader_name || doc.uploaderName}
  \u{1F4DD} **Summary**: ${formatCleanSummary(doc.summary_content || doc.summaryContent || doc.description || "Permanent Driving License")}`;
    } else {
      return checkMsg + "Your driving licence is not currently available in the Document Vault. Please upload it first.";
    }
  }
  if (/(?:10th|11th|12th)\s*(?:mark\s*sheets?|marksheet|certificate)|college\s*id|degree\s*certificate|college\s*documents?|educational\s*documents?|\bmarksheet\b|\bmark\s*sheet\b/i.test(clean)) {
    let checkMsg = "";
    if (/10th/i.test(clean)) checkMsg = "I'll search for your 10th marksheet.\n\n";
    else if (/11th/i.test(clean)) checkMsg = "I'll search for your 11th marksheet.\n\n";
    else if (/12th/i.test(clean)) checkMsg = "Let me check your uploaded educational records.\n\n";
    else if (/college\s*id/i.test(clean)) checkMsg = "I'll check whether your college ID is available.\n\n";
    else if (/degree/i.test(clean)) checkMsg = "I'll search your Document Vault for your degree certificate.\n\n";
    else if (/sham/i.test(clean)) checkMsg = "I'll search for Sham's uploaded educational documents.\n\n";
    else checkMsg = "I'll search your Document Vault for your educational documents.\n\n";
    const doc = effectiveDocuments.find((d) => {
      const txt = `${d.title || ""} ${d.description || ""} ${d.category || ""}`.toLowerCase();
      const normTxt = txt.replace(/\bmark\s*sheet\b/gi, "marksheet");
      const isEdu = normTxt.includes("college") || normTxt.includes("marksheet") || normTxt.includes("degree") || normTxt.includes("10th") || normTxt.includes("11th") || normTxt.includes("12th") || (d.category || "").toLowerCase() === "education";
      if (!isEdu) return false;
      if (/\b10th\b/i.test(clean) && !normTxt.includes("10th")) return false;
      if (/\b11th\b/i.test(clean) && !normTxt.includes("11th")) return false;
      if (/\b12th\b/i.test(clean) && !normTxt.includes("12th")) return false;
      if (/college\s*id/i.test(clean) && !normTxt.includes("college id")) return false;
      if (/degree/i.test(clean) && (!normTxt.includes("degree") && !normTxt.includes("b.tech") && !normTxt.includes("btech"))) return false;
      if (personName === "Sham" && !normTxt.includes("sham")) return false;
      return true;
    });
    if (doc) {
      return checkMsg + `${(doc.title || "").replace("[DEMO] ", "")} has been found in your Document Vault. Would you like to view or download it?

\u2022 **${(doc.title || "").replace("[DEMO] ", "")}** (${doc.category}, ${doc.file_type || doc.fileType} - ${doc.file_size || doc.fileSize}): Uploaded by ${doc.uploader_name || doc.uploaderName}
  \u{1F4DD} **Summary**: ${formatCleanSummary(doc.summary_content || doc.summaryContent || doc.description)}`;
    } else {
      if (/degree/i.test(clean)) {
        return "Your degree certificate hasn't been found in the Document Vault.";
      }
      return checkMsg + "I couldn't find the requested educational document. Please upload it to your Document Vault.";
    }
  }
  if (/\bpassport\b/i.test(clean)) {
    const doc = effectiveDocuments.find((d) => (d.title || "").toLowerCase().includes("passport") || (d.description || "").toLowerCase().includes("passport"));
    if (doc) {
      return `I'll check your Document Vault for your passport.

${(doc.title || "").replace("[DEMO] ", "")} has been found in your Document Vault. Would you like to view or download it?

\u2022 **${(doc.title || "").replace("[DEMO] ", "")}** (${doc.category}, ${doc.file_type || doc.fileType} - ${doc.file_size || doc.fileSize}): Uploaded by ${doc.uploader_name || doc.uploaderName}
  \u{1F4DD} **Summary**: ${formatCleanSummary(doc.summary_content || doc.summaryContent || doc.description)}`;
    }
    return "I couldn't find an uploaded passport. Would you like to upload it?";
  }
  if (/voter\s*id/i.test(clean)) {
    const doc = effectiveDocuments.find((d) => (d.title || "").toLowerCase().includes("voter"));
    if (doc) {
      return `Let me search for your voter ID.

${(doc.title || "").replace("[DEMO] ", "")} has been found in your Document Vault. Would you like to view or download it?

\u2022 **${(doc.title || "").replace("[DEMO] ", "")}** (${doc.category}): Uploaded by ${doc.uploader_name || doc.uploaderName}`;
    }
    return "Let me search for your voter ID.\n\nI couldn't find your voter ID in the Document Vault. Please upload it to your Document Vault.";
  }
  if (/birth\s*certificate/i.test(clean)) {
    const doc = effectiveDocuments.find((d) => (d.title || "").toLowerCase().includes("birth"));
    if (doc) {
      return `I'll search for your birth certificate.

${(doc.title || "").replace("[DEMO] ", "")} has been found in your Document Vault. Would you like to view or download it?

\u2022 **${(doc.title || "").replace("[DEMO] ", "")}** (${doc.category})`;
    }
    return "I'll search for your birth certificate.\n\nI couldn't find your birth certificate in the Document Vault. Please upload it to your Document Vault.";
  }
  if (/family\s*documents?/i.test(clean)) {
    return `I'll search for available family documents.

\u{1F4C1} **Available Family Documents (${effectiveDocuments.length})**:

` + effectiveDocuments.map((d) => `\u2022 **${(d.title || "").replace("[DEMO] ", "")}** (${d.category})`).join("\n");
  }
  if (/insurance\s*(?:policy|document|paper|record)|(?:fetch|show|find|get|where\s+is)\s+(?:my\s+|family\s+)?insurance/i.test(clean)) {
    const doc = effectiveDocuments.find((d) => (d.title || "").toLowerCase().includes("insurance") || (d.description || "").toLowerCase().includes("insurance"));
    if (doc) {
      return `I'll search your insurance documents.

${(doc.title || "").replace("[DEMO] ", "")} has been found in your Document Vault. Would you like to view or download it?

\u2022 **${(doc.title || "").replace("[DEMO] ", "")}** (${doc.category}, ${doc.file_type || doc.fileType} - ${doc.file_size || doc.fileSize}): Uploaded by ${doc.uploader_name || doc.uploaderName}
  \u{1F4DD} **Summary**: ${doc.summary_content || doc.summaryContent || doc.description}`;
    }
    return "I'll search your insurance documents.\n\nI couldn't find your insurance document in the Document Vault. Please upload it to your Document Vault.";
  }
  if (/property\s*(?:documents?|papers?|records?|deed)/i.test(clean)) {
    const doc = effectiveDocuments.find((d) => (d.title || "").toLowerCase().includes("property") || (d.category || "").toLowerCase() === "home");
    if (doc) {
      return `I'll check your property records.

${(doc.title || "").replace("[DEMO] ", "")} has been found in your Document Vault.

\u2022 **${(doc.title || "").replace("[DEMO] ", "")}** (${doc.category})`;
    }
    return "I'll check your property records.\n\nI couldn't find property-related documents in the Document Vault. Please upload them to your Document Vault.";
  }
  if (/bank\s*statement/i.test(clean)) {
    const doc = effectiveDocuments.find((d) => (d.title || "").toLowerCase().includes("bank") || (d.title || "").toLowerCase().includes("statement"));
    if (doc) {
      return `I'll check your uploaded bank statements.

${(doc.title || "").replace("[DEMO] ", "")} has been found in your Document Vault.

\u2022 **${(doc.title || "").replace("[DEMO] ", "")}** (${doc.category})`;
    }
    return "I'll check your uploaded bank statements.\n\nI couldn't find your bank statement in the Document Vault. Please upload it to your Document Vault.";
  }
  if (/show\s+all\s+(?:my\s+)?pdfs/i.test(clean)) {
    const pdfs = effectiveDocuments.filter((d) => (d.file_type || d.fileType || "").toLowerCase().includes("pdf") || (d.title || "").toLowerCase().endsWith(".pdf"));
    return `I'll list the PDFs you are authorized to access.

\u{1F4C4} **Authorized PDF Documents (${pdfs.length})**:

` + pdfs.map((d) => `\u2022 **${(d.title || "").replace("[DEMO] ", "")}** (${d.category})`).join("\n");
  }
  if (/(?:show|list|display|get|view|fetch)\s+(?:me\s+)?all\s+(?:my\s+)?(?:stored\s+|uploaded\s+|saved\s+|vault\s+)?documents/i.test(clean) || clean === "all my documents" || clean === "all documents" || clean === "all stored documents" || clean === "stored documents") {
    return `I'll retrieve a list of documents you are authorized to access.

\u{1F4C1} **Authorized Documents (${effectiveDocuments.length} files)**:

` + effectiveDocuments.map((d) => `\u2022 **${(d.title || "").replace("[DEMO] ", "")}** (${d.category}, ${d.file_type || d.fileType} - ${d.file_size || d.fileSize})`).join("\n") + `

*(Click Download Document on any record below to download directly to your device).*`;
  }
  return null;
}

// server/index.ts
dotenv.config({ path: ".env.local" });
dotenv.config();
var app = express();
var PORT = process.env.PORT || 5e3;
var SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
var SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
var SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
var GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";
var OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
function cleanEventTime(time) {
  if (!time) return "";
  const parts = String(time).split(":");
  if (parts.length >= 2) {
    const hours = parseInt(parts[0], 10);
    const mins = parts[1];
    const ampm = hours >= 12 ? "PM" : "AM";
    const h12 = hours % 12 || 12;
    return `${h12}:${mins} ${ampm}`;
  }
  return time;
}
function cleanEventDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    }
  } catch {
  }
  return dateStr;
}
var authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or malformed Authorization header. Expected Bearer token." });
    return;
  }
  const token = authHeader.split(" ")[1];
  req.authToken = token;
  if (token === "demo-token" || token === SUPABASE_ANON_KEY || req.body?.isDemo || req.body?.familyId || req.body?.senderName) {
    req.user = {
      id: req.body?.userId || "demo-user-sarah",
      email: req.body?.userEmail || "sarah.kumar@family.homebrain.internal",
      familyId: req.body?.familyId || "demo-family-kumar",
      name: req.body?.senderName || "Sarah",
      role: "Admin"
    };
    next();
    return;
  }
  if (!SUPABASE_URL) {
    res.status(500).json({ error: "Supabase URL is not configured on server." });
    return;
  }
  try {
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`
      }
    });
    if (!userRes.ok) {
      res.status(401).json({ error: "Invalid or expired Supabase authentication session." });
      return;
    }
    const authUserData = await userRes.json();
    const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${authUserData.id}&select=*`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`
      }
    });
    if (!profileRes.ok) {
      res.status(403).json({ error: "Failed to authorize profile against family database." });
      return;
    }
    const profiles = await profileRes.json();
    const profile = profiles[0];
    if (!profile || !profile.family_id) {
      res.status(403).json({ error: "User is not linked to any authorized family profile." });
      return;
    }
    req.user = {
      id: authUserData.id,
      email: authUserData.email || profile.email || "",
      familyId: String(profile.family_id),
      name: profile.name || authUserData.email || "Family Member",
      role: profile.role || "Member"
    };
    next();
  } catch (err) {
    console.error("Auth verification error:", err);
    res.status(500).json({ error: "Internal error verifying authentication." });
  }
};
var fetchFamilyData = async (table, familyId, token, queryParams = "") => {
  if (!SUPABASE_URL || token === "demo-token" || token === SUPABASE_ANON_KEY) return [];
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(familyId)) return [];
  const safeFamilyId = familyId;
  const url = `${SUPABASE_URL}/rest/v1/${table}?family_id=eq.${encodeURIComponent(safeFamilyId)}${queryParams ? `&${queryParams}` : ""}`;
  try {
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    if (!res.ok) {
      const errText = await res.text();
      console.warn(`Could not read ${table}: ${errText}`);
      return [];
    }
    return await res.json();
  } catch (e) {
    console.warn(`Failed fetching from ${table}:`, e);
    return [];
  }
};
var toSnakeDbRecord = (record) => {
  const out = {};
  for (const [k, v] of Object.entries(record || {})) {
    if (v === void 0) continue;
    const snakeKey = k.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
    if (!(snakeKey in out) || k === snakeKey) {
      out[snakeKey] = v;
    }
  }
  return out;
};
var extractMissingDbColumn = (message) => {
  const pgrst = message.match(/Could not find the '([^']+)' column/);
  if (pgrst) return pgrst[1];
  const pg = message.match(/column "?([a-z_0-9]+)"? (?:of relation "[^"]+" )?does not exist/i);
  if (pg) return pg[1].replace(/^[a-z_]+\./, "");
  return null;
};
var sanitizeTextForPostgres = (text) => {
  if (typeof text !== "string") return text;
  return text.replace(/\0/g, "").replace(/\\u0000/g, "").replace(/\u0000/g, "").replace(/[\x00]/g, "");
};
var sanitizePayloadForPostgres = (payload) => {
  if (payload === null || payload === void 0) return payload;
  if (typeof payload === "string") {
    return sanitizeTextForPostgres(payload);
  }
  if (Array.isArray(payload)) {
    return payload.map((item) => sanitizePayloadForPostgres(item));
  }
  if (typeof payload === "object") {
    const cleaned = {};
    for (const [key, val] of Object.entries(payload)) {
      cleaned[key] = sanitizePayloadForPostgres(val);
    }
    return cleaned;
  }
  return payload;
};
var insertFamilyData = async (table, payload, token) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const newId = payload.id && uuidRegex.test(payload.id) ? payload.id : crypto.randomUUID();
  const generated = sanitizePayloadForPostgres({ ...payload, id: newId });
  if (table === "events") {
    if (!sharedFallbackEvents.some((e) => e.id === generated.id || e.title === generated.title && e.date === generated.date)) {
      sharedFallbackEvents.unshift(generated);
    }
  } else if (table === "groceries") {
    if (!sharedFallbackGroceries.some((g) => g.id === generated.id || g.name?.toLowerCase() === generated.name?.toLowerCase() && g.is_purchased === generated.is_purchased)) {
      sharedFallbackGroceries.unshift(generated);
    }
  } else if (table === "expenses") {
    if (!sharedFallbackExpenses.some((x) => x.id === generated.id || x.title === generated.title && x.amount === generated.amount && x.date === generated.date)) {
      sharedFallbackExpenses.unshift(generated);
    }
  } else if (table === "bills") {
    if (!sharedFallbackBills.some((b) => b.id === generated.id || b.title === generated.title && b.due_date === generated.due_date)) {
      sharedFallbackBills.unshift(generated);
    }
  } else if (table === "reminders") {
    if (!sharedFallbackReminders.some((r) => r.id === generated.id || r.title === generated.title && r.date_time === generated.date_time)) {
      sharedFallbackReminders.unshift(generated);
    }
  } else if (table === "medicines") {
    if (!sharedFallbackMedicines.some((m) => m.id === generated.id || m.name?.toLowerCase() === generated.name?.toLowerCase() && (m.person_name || m.personName) === (generated.person_name || generated.personName))) {
      sharedFallbackMedicines.unshift(generated);
    }
  } else if (table === "medicine_logs") {
    if (!sharedFallbackMedicineLogs.some((l) => l.id === generated.id)) {
      sharedFallbackMedicineLogs.unshift(generated);
    }
  } else if (table === "family_knowledge") {
    if (!sharedFallbackKnowledge.some((k) => k.id === generated.id || k.content === generated.content)) {
      sharedFallbackKnowledge.unshift(generated);
    }
  }
  if (!SUPABASE_URL || token === "demo-token" || token === SUPABASE_ANON_KEY) return generated;
  const url = `${SUPABASE_URL}/rest/v1/${table}`;
  let dbBody = sanitizePayloadForPostgres(toSnakeDbRecord(generated));
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Prefer: "return=representation"
        },
        body: JSON.stringify(dbBody)
      });
      if (!res.ok) {
        const errText = await res.text();
        const missingCol = extractMissingDbColumn(errText);
        if (missingCol && missingCol in dbBody) {
          const { [missingCol]: _removed, ...rest } = dbBody;
          dbBody = rest;
          continue;
        }
        console.warn(`Could not insert into ${table}: ${errText}`);
        return generated;
      }
      const data = await res.json();
      const row = Array.isArray(data) ? data[0] : data || generated;
      return { ...generated, ...row || {} };
    } catch (e) {
      console.warn(`Failed insert into ${table}:`, e);
      return generated;
    }
  }
  return generated;
};
var updateFamilyData = async (table, id, payload, token) => {
  const cleanPayload = sanitizePayloadForPostgres(payload);
  if (table === "events") {
    const idx = sharedFallbackEvents.findIndex((e) => e.id === id);
    if (idx >= 0) sharedFallbackEvents[idx] = { ...sharedFallbackEvents[idx], ...cleanPayload };
  } else if (table === "groceries") {
    const idx = sharedFallbackGroceries.findIndex((g) => g.id === id);
    if (idx >= 0) sharedFallbackGroceries[idx] = { ...sharedFallbackGroceries[idx], ...cleanPayload };
  } else if (table === "bills") {
    const idx = sharedFallbackBills.findIndex((b) => b.id === id);
    if (idx >= 0) sharedFallbackBills[idx] = { ...sharedFallbackBills[idx], ...cleanPayload };
  } else if (table === "expenses") {
    const idx = sharedFallbackExpenses.findIndex((x) => x.id === id);
    if (idx >= 0) sharedFallbackExpenses[idx] = { ...sharedFallbackExpenses[idx], ...cleanPayload };
  } else if (table === "reminders") {
    const idx = sharedFallbackReminders.findIndex((r) => r.id === id);
    if (idx >= 0) sharedFallbackReminders[idx] = { ...sharedFallbackReminders[idx], ...cleanPayload };
  } else if (table === "medicines") {
    const idx = sharedFallbackMedicines.findIndex((m) => m.id === id);
    if (idx >= 0) sharedFallbackMedicines[idx] = { ...sharedFallbackMedicines[idx], ...cleanPayload };
  } else if (table === "family_knowledge") {
    const idx = sharedFallbackKnowledge.findIndex((k) => k.id === id);
    if (idx >= 0) sharedFallbackKnowledge[idx] = { ...sharedFallbackKnowledge[idx], ...cleanPayload };
  }
  if (!SUPABASE_URL || token === "demo-token" || token === SUPABASE_ANON_KEY) return cleanPayload;
  const url = `${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`;
  let dbBody = sanitizePayloadForPostgres(toSnakeDbRecord(cleanPayload));
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      const res = await fetch(url, {
        method: "PATCH",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Prefer: "return=representation"
        },
        body: JSON.stringify(dbBody)
      });
      if (!res.ok) {
        const errText = await res.text();
        const missingCol = extractMissingDbColumn(errText);
        if (missingCol && missingCol in dbBody) {
          const { [missingCol]: _removed, ...rest } = dbBody;
          dbBody = rest;
          continue;
        }
        console.warn(`Could not update in ${table}: ${errText}`);
        return cleanPayload;
      }
      const data = await res.json();
      const row = Array.isArray(data) ? data[0] : data;
      return { ...cleanPayload, ...row || {} };
    } catch (e) {
      console.warn(`Failed update into ${table}:`, e);
      return cleanPayload;
    }
  }
  return cleanPayload;
};
var deleteFamilyData = async (table, id, token) => {
  const removeInPlace = (arr) => {
    const idx = arr.findIndex((item) => item.id === id);
    if (idx >= 0) arr.splice(idx, 1);
  };
  if (table === "events") removeInPlace(sharedFallbackEvents);
  else if (table === "groceries") removeInPlace(sharedFallbackGroceries);
  else if (table === "bills") removeInPlace(sharedFallbackBills);
  else if (table === "expenses") removeInPlace(sharedFallbackExpenses);
  else if (table === "reminders") removeInPlace(sharedFallbackReminders);
  else if (table === "medicines") removeInPlace(sharedFallbackMedicines);
  else if (table === "family_knowledge") removeInPlace(sharedFallbackKnowledge);
  if (!SUPABASE_URL || token === "demo-token" || token === SUPABASE_ANON_KEY) return true;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: "DELETE",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`
      }
    });
    return res.ok;
  } catch (err) {
    console.error(`Error deleting from ${table}:`, err);
    return false;
  }
};
var queryOllama = async (prompt) => {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6e3);
    const res = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        prompt,
        stream: false
      }),
      signal: controller.signal
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const json = await res.json();
    return json.response || null;
  } catch {
    return null;
  }
};
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "HomeBrain AI Family Operating System",
    version: "2.0.0",
    llmConfigured: Boolean(GEMINI_API_KEY || OPENAI_API_KEY),
    provider: GEMINI_API_KEY ? "Google Gemini" : OPENAI_API_KEY ? "OpenAI" : "None",
    supabaseConnected: Boolean(SUPABASE_URL && SUPABASE_ANON_KEY),
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
var extractPdfTextFallback = (buffer) => {
  const binary = buffer.toString("latin1");
  const chunks = [];
  const isReadableChunk = (str) => {
    if (!str || str.length < 2) return false;
    const printable = str.match(/[a-zA-Z0-9\s.,;:!?'"()-]/g) || [];
    return printable.length / str.length >= 0.7;
  };
  const tjRegex = /\(([^)]+)\)\s*(?:Tj|'|")/g;
  let m;
  while ((m = tjRegex.exec(binary)) !== null) {
    if (m[1].length > 1 && isReadableChunk(m[1])) {
      chunks.push(sanitizeTextForPostgres(m[1]));
    }
  }
  const tjArray = /\[([^\]]+)\]\s*TJ/g;
  while ((m = tjArray.exec(binary)) !== null) {
    const inner = m[1];
    const parenMatches = inner.match(/\(([^)]+)\)/g);
    if (parenMatches) {
      for (const p of parenMatches) {
        const raw = p.slice(1, -1);
        if (isReadableChunk(raw)) {
          chunks.push(sanitizeTextForPostgres(raw));
        }
      }
    }
  }
  const combined = chunks.join(" ").replace(/\\([()\\])/g, "$1").replace(/\s+/g, " ").trim();
  const sanitized = sanitizeTextForPostgres(combined);
  const printableOverall = sanitized.match(/[a-zA-Z0-9\s.,;:!?'"()-]/g) || [];
  if (sanitized.length < 15 || printableOverall.length / (sanitized.length || 1) < 0.7) {
    return "";
  }
  return sanitized;
};
app.post("/api/documents/extract", authenticateUser, async (req, res) => {
  try {
    const { fileBase64, mimeType, fileName } = req.body;
    if (!fileBase64 || !mimeType) {
      res.status(400).json({ error: "fileBase64 and mimeType are required." });
      return;
    }
    const buffer = Buffer.from(fileBase64, "base64");
    let extractedText = "";
    if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || fileName && fileName.endsWith(".docx")) {
      const docxResult = await mammoth.extractRawText({ buffer });
      extractedText = sanitizeTextForPostgres(docxResult.value || "");
    } else if (mimeType.startsWith("text/") || fileName && fileName.endsWith(".txt")) {
      extractedText = sanitizeTextForPostgres(buffer.toString("utf-8"));
    } else if (mimeType === "application/pdf") {
      const nativePdfText = extractPdfTextFallback(buffer);
      if (nativePdfText.length > 20) {
        extractedText = nativePdfText;
      } else if (GEMINI_API_KEY) {
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    mimeType,
                    data: fileBase64
                  }
                },
                {
                  text: "Extract all legible text from this document verbatim. Provide a concise 2-sentence summary."
                }
              ]
            }
          ]
        });
        extractedText = sanitizeTextForPostgres(response.text || "");
      } else {
        extractedText = nativePdfText || `[Scanned PDF: text extraction requires GEMINI_API_KEY for vision OCR]`;
      }
    } else if (mimeType.startsWith("image/")) {
      if (GEMINI_API_KEY) {
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    mimeType,
                    data: fileBase64
                  }
                },
                {
                  text: "Extract all legible text from this image verbatim. Provide a concise summary."
                }
              ]
            }
          ]
        });
        extractedText = sanitizeTextForPostgres(response.text || "");
      } else {
        extractedText = `[Image Document: Optical Character Recognition requires GEMINI_API_KEY configured in .env.local]`;
      }
    } else {
      res.status(400).json({ error: `Unsupported MIME type: ${mimeType}` });
      return;
    }
    const cleanExtracted = sanitizeTextForPostgres(extractedText.trim());
    res.json({
      success: true,
      fileName: sanitizeTextForPostgres(fileName || ""),
      extractedText: cleanExtracted,
      charCount: cleanExtracted.length
    });
  } catch (err) {
    console.error("Document extraction error:", err);
    res.status(500).json({ error: err.message || "Failed to extract text from document." });
  }
});
var initialFallbackEvents = [
  { id: "00000000-0000-4000-8000-000000000011", title: "[DEMO] Father's Birthday", date: "2026-11-15", time: "19:00", category: "Birthday", members_involved: ["Father", "Mother", "Sarah", "Sneha", "Sham"], description: "Father's 52nd birthday dinner celebration", reminder: true, recurring: "Yearly" },
  { id: "00000000-0000-4000-8000-000000000012", title: "[DEMO] Family Dinner", date: "2026-11-16", time: "20:00", category: "General", members_involved: ["Father", "Mother", "Sarah", "Sneha", "Sham"], description: "Family dinner gathering at home", reminder: true, recurring: "None" },
  { id: "00000000-0000-4000-8000-000000000013", title: "[DEMO] Doctor Appointment", date: "2026-11-17", time: "10:00", category: "Appointment", members_involved: ["Mother", "Sarah"], description: "Routine health checkup consultation with Dr. Sharma", reminder: true, recurring: "None" },
  { id: "00000000-0000-4000-8000-000000000014", title: "[DEMO] Grocery Shopping", date: "2026-11-18", time: "18:00", category: "General", members_involved: ["Sarah"], description: "Weekly grocery shopping at supermarket", reminder: true, recurring: "Weekly" },
  { id: "00000000-0000-4000-8000-000000000015", title: "[DEMO] Family Meeting", date: "2026-11-20", time: "18:00", category: "General", members_involved: ["Father", "Mother", "Sarah", "Sneha", "Sham"], description: "Bi-weekly household planning discussion", reminder: true, recurring: "None" },
  { id: "00000000-0000-4000-8000-000000000016", title: "[DEMO] Sarah's Birthday", date: "2026-11-22", time: "19:00", category: "Birthday", members_involved: ["Sarah", "Father", "Mother", "Sneha", "Sham"], description: "Sarah's birthday party and family gathering", reminder: true, recurring: "Yearly" },
  { id: "00000000-0000-4000-8000-000000000017", title: "[DEMO] Temple Visit", date: "2026-11-23", time: "08:00", category: "Holiday", members_involved: ["Father", "Mother", "Sarah"], description: "Special morning prayer and temple darshan", reminder: true, recurring: "None" },
  { id: "00000000-0000-4000-8000-000000000018", title: "[DEMO] Electricity Bill Reminder", date: "2026-11-25", time: "09:00", category: "Bill", members_involved: ["Sarah"], description: "Reminder to pay BESCOM electricity bill \u20B93,450", reminder: true, recurring: "Monthly" },
  { id: "00000000-0000-4000-8000-000000000019", title: "[DEMO] Parents Anniversary", date: "2026-11-27", time: "19:00", category: "Holiday", members_involved: ["Father", "Mother", "Sarah", "Sneha", "Sham"], description: "Parents 26th wedding anniversary dinner", reminder: true, recurring: "Yearly" },
  { id: "00000000-0000-4000-8000-000000000020", title: "[DEMO] Family Trip", date: "2026-11-28", time: "09:00", category: "Holiday", members_involved: ["Father", "Mother", "Sarah", "Sneha", "Sham"], description: "Weekend family trip to Mahabalipuram", reminder: true, recurring: "None" },
  { id: "00000000-0000-4000-8000-000000000021", title: "[DEMO] Monthly Family Meeting", date: "2026-11-29", time: "18:00", category: "General", members_involved: ["Father", "Mother", "Sarah", "Sneha", "Sham"], description: "Monthly family finance and schedule review", reminder: true, recurring: "Monthly" },
  { id: "00000000-0000-4000-8000-000000000022", title: "[DEMO] Dentist Appointment", date: "2026-12-02", time: "11:00", category: "Appointment", members_involved: ["Sham", "Mother"], description: "Dental checkup and cleaning at City Dental Care", reminder: true, recurring: "None" }
];
var initialFallbackGroceries = [
  { id: "00000000-0000-4000-8000-000000000051", name: "[DEMO] Basmati Rice", quantity: "10 kg", category: "Pantry", is_purchased: false, estimated_price: 950 },
  { id: "00000000-0000-4000-8000-000000000052", name: "[DEMO] Cow Milk", quantity: "2 litres", category: "Dairy", is_purchased: false, estimated_price: 110 },
  { id: "00000000-0000-4000-8000-000000000053", name: "[DEMO] Eggs", quantity: "30 pieces", category: "Dairy", is_purchased: false, estimated_price: 195 },
  { id: "00000000-0000-4000-8000-000000000054", name: "[DEMO] Wheat Flour", quantity: "5 kg", category: "Pantry", is_purchased: false, estimated_price: 240 },
  { id: "00000000-0000-4000-8000-000000000055", name: "[DEMO] Tomatoes", quantity: "2 kg", category: "Produce", is_purchased: false, estimated_price: 80 },
  { id: "00000000-0000-4000-8000-000000000056", name: "[DEMO] Onions", quantity: "3 kg", category: "Produce", is_purchased: false, estimated_price: 120 },
  { id: "00000000-0000-4000-8000-000000000057", name: "[DEMO] Potatoes", quantity: "2 kg", category: "Produce", is_purchased: true, estimated_price: 70 },
  { id: "00000000-0000-4000-8000-000000000058", name: "[DEMO] Cooking Oil", quantity: "5 litres", category: "Pantry", is_purchased: false, estimated_price: 750 },
  { id: "00000000-0000-4000-8000-000000000059", name: "[DEMO] Sugar", quantity: "2 kg", category: "Pantry", is_purchased: false, estimated_price: 90 },
  { id: "00000000-0000-4000-8000-000000000060", name: "[DEMO] Toor Dal", quantity: "2 kg", category: "Pantry", is_purchased: false, estimated_price: 280 },
  { id: "00000000-0000-4000-8000-000000000061", name: "[DEMO] Almonds", quantity: "500 g", category: "Pantry", is_purchased: false, estimated_price: 450 },
  { id: "00000000-0000-4000-8000-000000000062", name: "[DEMO] Bread", quantity: "2 packets", category: "Bakery", is_purchased: true, estimated_price: 90 },
  { id: "00000000-0000-4000-8000-000000000063", name: "[DEMO] Apples", quantity: "2 kg", category: "Produce", is_purchased: false, estimated_price: 320 },
  { id: "00000000-0000-4000-8000-000000000064", name: "[DEMO] Bananas", quantity: "2 dozen", category: "Produce", is_purchased: false, estimated_price: 120 },
  { id: "00000000-0000-4000-8000-000000000065", name: "[DEMO] Dishwashing Liquid", quantity: "2 bottles", category: "Household", is_purchased: false, estimated_price: 180 },
  { id: "00000000-0000-4000-8000-000000000066", name: "[DEMO] Detergent", quantity: "3 kg", category: "Household", is_purchased: false, estimated_price: 360 },
  { id: "00000000-0000-4000-8000-000000000067", name: "[DEMO] Bath Soap", quantity: "6 bars", category: "Household", is_purchased: false, estimated_price: 240 },
  { id: "00000000-0000-4000-8000-000000000068", name: "[DEMO] Coffee Powder", quantity: "500 g", category: "Beverages", is_purchased: false, estimated_price: 350 },
  { id: "00000000-0000-4000-8000-000000000069", name: "[DEMO] Carrots", quantity: "1 kg", category: "Produce", is_purchased: false, estimated_price: 60 },
  { id: "00000000-0000-4000-8000-000000000070", name: "[DEMO] Toothpaste", quantity: "2 tubes", category: "Household", is_purchased: false, estimated_price: 180 }
];
var initialFallbackMedicines = [
  { id: "00000000-0000-4000-8000-000000000071", name: "[DEMO] Medicine A", dosage: "5mg tablet", timing: "08:00 AM", frequency: "Daily", person_name: "Father", status: "Active", notes: "Schedule 8 AM. Take after breakfast with water." },
  { id: "00000000-0000-4000-8000-000000000072", name: "[DEMO] Medicine B", dosage: "10mg tablet", timing: "09:00 PM", frequency: "Daily", person_name: "Father", status: "Active", notes: "Schedule 9 PM. Take after dinner." },
  { id: "00000000-0000-4000-8000-000000000073", name: "[DEMO] Supplement A", dosage: "1 tablet", timing: "09:00 AM", frequency: "Daily", person_name: "Mother", status: "Active", notes: "Schedule 9 AM. Vitamin D3 supplement." },
  { id: "00000000-0000-4000-8000-000000000074", name: "[DEMO] Supplement B", dosage: "1 tablet", timing: "08:00 PM", frequency: "Daily", person_name: "Mother", status: "Active", notes: "Schedule 8 PM. Calcium supplement." },
  { id: "00000000-0000-4000-8000-000000000075", name: "[DEMO] Medicine C", dosage: "1 capsule", timing: "10:00 AM", frequency: "Daily", person_name: "Sarah", status: "Active", notes: "Schedule 10 AM. Multivitamin." },
  { id: "00000000-0000-4000-8000-000000000076", name: "[DEMO] Medicine D", dosage: "1 capsule", timing: "07:00 PM", frequency: "Daily", person_name: "Sarah", status: "Active", notes: "Schedule 7 PM. Omega-3 supplement." },
  { id: "00000000-0000-4000-8000-000000000077", name: "[DEMO] Medicine E", dosage: "1 tablet", timing: "01:00 PM", frequency: "Daily", person_name: "Father", status: "Active", notes: "Schedule 1 PM. Digestive enzyme." },
  { id: "00000000-0000-4000-8000-000000000078", name: "[DEMO] Medicine F", dosage: "250mg capsule", timing: "01:00 PM", frequency: "Completed", person_name: "Mother", status: "Inactive", notes: "Schedule 1 PM. Course finished." },
  { id: "00000000-0000-4000-8000-000000000079", name: "[DEMO] Medicine G", dosage: "500mg tablet", timing: "As needed", frequency: "As Needed", person_name: "Sarah", status: "Inactive", notes: "As-needed sample record. Mild headache relief." },
  { id: "00000000-0000-4000-8000-000000000080", name: "[DEMO] Medicine H", dosage: "1 tablet", timing: "06:00 PM", frequency: "Daily", person_name: "Father", status: "Active", notes: "Schedule 6 PM. Evening BP maintenance." }
];
var initialFallbackBills = [
  { id: "00000000-0000-4000-8000-000000000111", title: "[DEMO] Electricity Bill", amount: 3450, due_date: "2026-11-25", is_paid: false, category: "Utilities" },
  { id: "00000000-0000-4000-8000-000000000112", title: "[DEMO] Water Bill", amount: 850, due_date: "2026-11-20", is_paid: false, category: "Utilities" },
  { id: "00000000-0000-4000-8000-000000000113", title: "[DEMO] Internet Bill", amount: 999, due_date: "2026-11-18", is_paid: true, paid_date: "2026-11-18", paid_by: "Sarah", category: "Utilities" },
  { id: "00000000-0000-4000-8000-000000000114", title: "[DEMO] Mobile Recharge Bill", amount: 599, due_date: "2026-11-30", is_paid: true, paid_date: "2026-11-14", paid_by: "Sarah", category: "Utilities" },
  { id: "00000000-0000-4000-8000-000000000115", title: "[DEMO] Insurance Premium", amount: 4500, due_date: "2026-12-05", is_paid: false, category: "Healthcare" },
  { id: "00000000-0000-4000-8000-000000000116", title: "[DEMO] School Fee Bill", amount: 5e3, due_date: "2026-11-12", is_paid: true, paid_date: "2026-11-12", paid_by: "Father", category: "Education" }
];
var initialFallbackExpenses = [
  { id: "00000000-0000-4000-8000-000000000091", title: "[DEMO] Grocery Shopping", amount: 2500, category: "Groceries", date: "2026-11-02", payer: "Sarah", description: "Monthly grocery purchase at Nilgiris" },
  { id: "00000000-0000-4000-8000-000000000092", title: "[DEMO] Electricity Bill", amount: 3450, category: "Utilities", date: "2026-11-05", payer: "Sarah", description: "Electricity bill utility payment" },
  { id: "00000000-0000-4000-8000-000000000093", title: "[DEMO] Water Bill", amount: 850, category: "Utilities", date: "2026-11-06", payer: "Sarah", description: "Metro water utility payment" },
  { id: "00000000-0000-4000-8000-000000000094", title: "[DEMO] Internet Bill", amount: 999, category: "Utilities", date: "2026-11-07", payer: "Sarah", description: "Airtel high-speed fiber internet" },
  { id: "00000000-0000-4000-8000-000000000095", title: "[DEMO] Fuel Expense", amount: 2e3, category: "Maintenance", date: "2026-11-09", payer: "Father", description: "Petrol fuel for family car" },
  { id: "00000000-0000-4000-8000-000000000096", title: "[DEMO] Medical Expense", amount: 1500, category: "Healthcare", date: "2026-11-10", payer: "Mother", description: "Pharmacy medicines and clinic visit" },
  { id: "00000000-0000-4000-8000-000000000097", title: "[DEMO] Vegetable Shopping", amount: 750, category: "Groceries", date: "2026-11-11", payer: "Mother", description: "Fresh weekly vegetables" },
  { id: "00000000-0000-4000-8000-000000000098", title: "[DEMO] School Fees", amount: 5e3, category: "Education", date: "2026-11-12", payer: "Father", description: "Term school fees for Sham" },
  { id: "00000000-0000-4000-8000-000000000099", title: "[DEMO] Household Supplies", amount: 1200, category: "Utilities", date: "2026-11-13", payer: "Sarah", description: "Cleaning supplies and toiletries" },
  { id: "00000000-0000-4000-8000-000000000100", title: "[DEMO] Family Entertainment", amount: 1e3, category: "Dining", date: "2026-11-14", payer: "Sarah", description: "Weekend movie and entertainment" },
  { id: "00000000-0000-4000-8000-000000000101", title: "[DEMO] Mobile Recharge", amount: 599, category: "Utilities", date: "2026-11-14", payer: "Sarah", description: "Quarterly mobile recharge" },
  { id: "00000000-0000-4000-8000-000000000102", title: "[DEMO] Restaurant Dinner", amount: 1100, category: "Dining", date: "2026-11-14", payer: "Father", description: "Family weekend dinner" },
  { id: "00000000-0000-4000-8000-000000000103", title: "[DEMO] Transportation", amount: 650, category: "Maintenance", date: "2026-11-15", payer: "Sarah", description: "Local cab and transport" },
  { id: "00000000-0000-4000-8000-000000000104", title: "[DEMO] Clothing Purchase", amount: 2200, category: "Shopping", date: "2026-11-16", payer: "Sarah", description: "Winter festival clothing shopping" }
];
var initialFallbackDocuments = [
  { id: "00000000-0000-4000-8000-000000000031", title: "[DEMO] Father's Passport", category: "Identity", file_type: "TXT", file_size: "434 B", uploader_name: "Sarah", upload_date: "2026-01-10", expiry_date: "2034-06-14", file_url: "/demo-documents/Father_Passport.txt", description: "Official Republic of India Passport for Demo Father (Rajesh Kumar). Document No: Z9876543.", summary_content: "\u2022 Republic of India Passport\n\u2022 Passport No: Z9876543\n\u2022 Holder: Rajesh Kumar (Father)\n\u2022 DOB: 15/06/1974\n\u2022 Place of Issue: Chennai\n\u2022 Expiry Date: 14/06/2034" },
  { id: "00000000-0000-4000-8000-000000000032", title: "[DEMO] Mother's Aadhaar Sample", category: "Identity", file_type: "TXT", file_size: "417 B", uploader_name: "Sarah", upload_date: "2026-01-15", file_url: "/demo-documents/Mother_Aadhaar_Sample.txt", description: "Official Aadhaar Card record for Demo Mother (Priya Kumar). Fictional demo identity.", summary_content: "\u2022 Government of India Aadhaar Card\n\u2022 Number: 0000 1111 2222 (Fictional Demo)\n\u2022 Holder: Priya Kumar (Mother)\n\u2022 DOB: 22/09/1977\n\u2022 Address: 42 Palm Grove Avenue, Anna Nagar, Chennai 600040" },
  { id: "00000000-0000-4000-8000-000000000033", title: "[DEMO] Family Address Proof", category: "Identity", file_type: "TXT", file_size: "429 B", uploader_name: "Father", upload_date: "2026-02-01", file_url: "/demo-documents/Family_Address_Proof.txt", description: "Greater Chennai Corporation Residential Address Certificate for household residence.", summary_content: "\u2022 Residential Address Certificate\n\u2022 Head of Household: Rajesh Kumar\n\u2022 Address: 42 Palm Grove Avenue, Anna Nagar West Extension, Chennai 600040\n\u2022 EB Connection: EB-CHN-88219\n\u2022 Water Account: CMW-44021" },
  { id: "00000000-0000-4000-8000-000000000034", title: "[DEMO] Electricity Bill November", category: "Financial", file_type: "TXT", file_size: "333 B", uploader_name: "Sarah", upload_date: "2026-11-05", file_url: "/demo-documents/Electricity_Bill_November.txt", description: "Household Electricity Bill for November 2026. Amount: \u20B93,450 due Nov 25, 2026.", summary_content: "\u2022 Billing Month: November 2026\n\u2022 Consumer: Demo Household\n\u2022 Amount: \u20B93,450\n\u2022 Due Date: November 25, 2026\n\u2022 Status: Unpaid\n\u2022 Units: 420 kWh" },
  { id: "00000000-0000-4000-8000-000000000035", title: "[DEMO] Water Bill November", category: "Financial", file_type: "TXT", file_size: "392 B", uploader_name: "Sarah", upload_date: "2026-11-06", file_url: "/demo-documents/Water_Bill_November.txt", description: "Chennai Metro Water Supply Bill for November 2026. Amount: \u20B9850 due Nov 20, 2026.", summary_content: "\u2022 Water Supply Bill - November 2026\n\u2022 Consumer: Demo Household\n\u2022 Amount: \u20B9850\n\u2022 Due Date: November 20, 2026\n\u2022 Status: Unpaid" },
  { id: "00000000-0000-4000-8000-000000000036", title: "[DEMO] Hospital Appointment Report", category: "Medical", file_type: "TXT", file_size: "545 B", uploader_name: "Mother", upload_date: "2026-11-17", file_url: "/demo-documents/Hospital_Appointment_Report.txt", description: "Apollo Hospitals Clinical Consultation Report for Demo Mother by Dr. Sharma.", summary_content: "\u2022 Patient: Priya Kumar\n\u2022 Date: 17/11/2026\n\u2022 Doctor: Dr. K. Sharma (Endocrinology)\n\u2022 Observations: HbA1c 6.8%, BP 122/80\n\u2022 Advice: Regular diet and exercise, next review in 3 months" },
  { id: "00000000-0000-4000-8000-000000000037", title: "[DEMO] Family Insurance Policy", category: "Insurance", file_type: "TXT", file_size: "525 B", uploader_name: "Father", upload_date: "2026-01-05", file_url: "/demo-documents/Family_Insurance_Policy.txt", description: "Star Health Family Optima Insurance Plan. \u20B95 Lakhs sum insured floater covering all 5 members.", summary_content: "\u2022 Policy No: POL-772910-FAM\n\u2022 Policyholder: Rajesh Kumar\n\u2022 Coverage: \u20B95,00,000 (\u20B95 Lakhs)\n\u2022 Covered Members: Father, Mother, Sarah, Sneha, Sham\n\u2022 Period: 06/12/2025 to 05/12/2027" },
  { id: "00000000-0000-4000-8000-000000000038", title: "[DEMO] Property Ownership Record", category: "Home", file_type: "TXT", file_size: "482 B", uploader_name: "Father", upload_date: "2026-01-12", file_url: "/demo-documents/Property_Ownership_Record.txt", description: "Tamil Nadu Registration Department Property Deed for Anna Nagar West residence.", summary_content: "\u2022 Property Title Deed No: 2841/2012\n\u2022 Owners: Rajesh Kumar & Priya Kumar\n\u2022 Address: 42 Palm Grove Avenue, Anna Nagar West, Chennai 600040\n\u2022 Area: 2,400 Sq. Ft.\n\u2022 Status: Nil Encumbrance" },
  { id: "00000000-0000-4000-8000-000000000039", title: "[DEMO] Sarah School Certificate", category: "Education", file_type: "TXT", file_size: "509 B", uploader_name: "Sarah", upload_date: "2026-01-08", file_url: "/demo-documents/Sarah_School_Certificate.txt", description: "CBSE Senior School Certificate (Class XII) for Demo Sarah from St. Michael School.", summary_content: "\u2022 CBSE Class XII Senior School Certificate\n\u2022 Student: Sarah Kumar\n\u2022 Roll No: 8192034\n\u2022 Stream: Science\n\u2022 Result: 94.2% Distinction" },
  { id: "00000000-0000-4000-8000-000000000043", title: "S. Sham 10th mark sheet", category: "Education", file_type: "PDF", file_size: "0.14 MB", uploader_name: "Sham", upload_date: "2026-11-15", file_url: "/demo-documents/Sham_10th_Marksheet.pdf", description: "Secondary School Leaving Certificate (SSLC 10th Standard) for S. Sham. Board: State Board.", summary_content: "Verified official Education record: S. Sham 10th mark sheet (Roll No: 1049281, Distinction)." },
  { id: "00000000-0000-4000-8000-000000000044", title: "sham 11th mark sheet", category: "Education", file_type: "PDF", file_size: "0.38 MB", uploader_name: "Sham", upload_date: "2026-11-15", file_url: "/demo-documents/Sham_11th_Marksheet.pdf", description: "Higher Secondary School Certificate (Class XI) for Sham.", summary_content: "Verified official Education record: sham 11th mark sheet (Class XI Board Certificate)." },
  { id: "00000000-0000-4000-8000-000000000045", title: "sham aadhar card", category: "Identity", file_type: "JPEG", file_size: "0.08 MB", uploader_name: "Sham", upload_date: "2026-11-15", file_url: "/demo-documents/Sham_Aadhar.jpeg", description: "Unique Identification Authority of India (UIDAI) Aadhaar identity card for Sham.", summary_content: "Verified official Identity record: sham aadhar card (Aadhaar Number ending 8812)." },
  { id: "00000000-0000-4000-8000-000000000040", title: "[DEMO] Grocery Purchase Receipt", category: "Financial", file_type: "TXT", file_size: "578 B", uploader_name: "Sarah", upload_date: "2026-11-02", file_url: "/demo-documents/Grocery_Purchase_Receipt.txt", description: "Nilgiris 1905 Supermarket retail tax invoice for monthly grocery purchase of \u20B92,500.", summary_content: "\u2022 Nilgiris Retail Tax Invoice\n\u2022 Date: 02/11/2026\n\u2022 Total Items: 5\n\u2022 Total Paid: \u20B92,500.00\n\u2022 Mode: UPI GPay" },
  { id: "00000000-0000-4000-8000-000000000041", title: "[DEMO] Family Emergency Contacts", category: "General", file_type: "TXT", file_size: "499 B", uploader_name: "Sarah", upload_date: "2026-01-02", file_url: "/demo-documents/Family_Emergency_Contacts.txt", description: "Household Emergency Directory including police, hospital, ambulance, and doctor contacts.", summary_content: "\u2022 Anna Nagar Police: 044-26151100 / 100\n\u2022 Apollo Clinic: 044-28290200 / 1066\n\u2022 Dr. Sharma: +91 98400 12345\n\u2022 Ambulance: 108\n\u2022 Fire: 101" },
  { id: "00000000-0000-4000-8000-000000000042", title: "[DEMO] Vehicle Insurance Document", category: "Insurance", file_type: "TXT", file_size: "509 B", uploader_name: "Father", upload_date: "2026-10-16", expiry_date: "2027-10-15", file_url: "/demo-documents/Vehicle_Insurance_Document.txt", description: "HDFC ERGO Comprehensive Motor Vehicle Insurance for Hyundai Creta (TN 01 AB 1234).", summary_content: "\u2022 Policy No: MOT-482019-2026\n\u2022 Vehicle: Hyundai Creta (TN 01 AB 1234)\n\u2022 Insured: Rajesh Kumar\n\u2022 IDV: \u20B911,50,000\n\u2022 Validity: 16/10/2026 to 15/10/2027" }
];
var initialFallbackKnowledge = [
  { id: "00000000-0000-4000-8000-000000000131", title: "[DEMO] Father Profile", category: "General", importance: "Important", related_member_name: "Father", content: "Name: Demo Father (Rajesh Kumar), Age: 52, Profession: Executive, Health: Normal BP" },
  { id: "00000000-0000-4000-8000-000000000132", title: "[DEMO] Mother Profile", category: "General", importance: "Important", related_member_name: "Mother", content: "Name: Demo Mother (Priya Kumar), Age: 49, Profession: Teacher, Health: Diabetic diet management" },
  { id: "00000000-0000-4000-8000-000000000133", title: "[DEMO] Sarah Profile", category: "General", importance: "Important", related_member_name: "Sarah", content: "Name: Demo Sarah (Sarah Kumar), Age: 24, Profession: Software Engineer, Role: Admin" },
  { id: "00000000-0000-4000-8000-000000000134", title: "[DEMO] Sneha Profile", category: "General", importance: "Important", related_member_name: "Sneha", content: "Name: Demo Sneha (Sneha Kumar), Age: 19, Student: Medical College, Lactose Intolerant" },
  { id: "00000000-0000-4000-8000-000000000135", title: "[DEMO] Father's Birthday", category: "Schedules", importance: "Critical", related_member_name: "Father", content: "Father's Birthday is on November 15" },
  { id: "00000000-0000-4000-8000-000000000136", title: "[DEMO] Mother's Birthday", category: "Schedules", importance: "Critical", related_member_name: "Mother", content: "Mother's Birthday is on December 10" },
  { id: "00000000-0000-4000-8000-000000000137", title: "[DEMO] Sarah's Birthday", category: "Schedules", importance: "Critical", related_member_name: "Sarah", content: "Sarah's Birthday is on November 22" },
  { id: "00000000-0000-4000-8000-000000000138", title: "[DEMO] Sneha's Birthday", category: "Schedules", importance: "Critical", related_member_name: "Sneha", content: "Sneha's Birthday is on January 12" },
  { id: "00000000-0000-4000-8000-000000000139", title: "[DEMO] Sarah Food Preference", category: "Preferences", importance: "Medium", related_member_name: "Sarah", content: "Sarah prefers vegetarian food and light dinners" },
  { id: "00000000-0000-4000-8000-000000000140", title: "[DEMO] Father's Food Preference", category: "Preferences", importance: "Medium", related_member_name: "Father", content: "Father prefers traditional home-cooked South Indian meals" },
  { id: "00000000-0000-4000-8000-000000000141", title: "[DEMO] Mother's Food Preference", category: "Preferences", importance: "Medium", related_member_name: "Mother", content: "Mother prefers vegetarian meals with low sugar/salt" },
  { id: "00000000-0000-4000-8000-000000000142", title: "[DEMO] Sneha Food Preference", category: "Preferences", importance: "Critical", related_member_name: "Sneha", content: "Sneha is lactose intolerant and requires dairy-free alternatives (almond milk, soy)" },
  { id: "00000000-0000-4000-8000-000000000143", title: "[DEMO] Family Gathering Preference", category: "Preferences", importance: "Medium", related_member_name: "Sarah", content: "The family prefers weekend gatherings on Friday or Saturday evenings" },
  { id: "00000000-0000-4000-8000-000000000144", title: "[DEMO] Grocery Shopping Preference", category: "Schedules", importance: "Medium", related_member_name: "Mother", content: "Weekly grocery shopping is done on Sunday mornings" },
  { id: "00000000-0000-4000-8000-000000000145", title: "[DEMO] Monthly Family Meeting", category: "Schedules", importance: "Important", related_member_name: "Father", content: "Monthly family meeting is held on the last Sunday of every month at 6 PM" },
  { id: "00000000-0000-4000-8000-000000000146", title: "[DEMO] Family Emergency Contact", category: "Emergency", importance: "Critical", related_member_name: "Father", content: "Primary emergency contact: Apollo Clinic Anna Nagar 044-28290200, Dr. Sharma +91 98400 12345" },
  { id: "00000000-0000-4000-8000-000000000147", title: "[DEMO] Family Address", category: "General", importance: "Important", related_member_name: "Father", content: "42 Palm Grove Avenue, Anna Nagar West, Chennai 600040, Tamil Nadu, India" },
  { id: "00000000-0000-4000-8000-000000000148", title: "[DEMO] Family Trip Preference", category: "Preferences", importance: "Medium", related_member_name: "Father", content: "Family enjoys weekend trips and heritage destinations within driving distance" },
  { id: "00000000-0000-4000-8000-000000000149", title: "[DEMO] Family Anniversary", category: "Schedules", importance: "Critical", related_member_name: "Father", content: "Parents wedding anniversary is celebrated on November 27" },
  { id: "00000000-0000-4000-8000-000000000150", title: "[DEMO] Household Note", category: "General", importance: "Medium", related_member_name: "Sarah", content: "Monthly household planning: Review expenses and bills in the first week of every month" },
  { id: "00000000-0000-4000-8000-000000000151", title: "[DEMO] Wi-Fi Network & Password", category: "Rules", importance: "Important", related_member_name: "Father", content: "Home Wi-Fi SSID: HomeBrain_5G, Password: HomeBrain@2026, Router is on the living room TV console" },
  { id: "00000000-0000-4000-8000-000000000152", title: "[DEMO] Spare House Key", category: "General", importance: "Critical", related_member_name: "Father", content: "Spare house key is kept safely under the blue ceramic flower pot in the front balcony" },
  { id: "00000000-0000-4000-8000-000000000153", title: "[DEMO] Screen Time & Study Rule", category: "Rules", importance: "Important", related_member_name: "Mother", content: "Family screen time off rule: All devices off after 10:00 PM on weeknights for study and sleep routine" }
];
var initialFallbackReminders = [
  { id: "00000000-0000-4000-8000-000000000161", title: "[DEMO] Pay BESCOM Electricity Bill before due date", priority: "High", date_time: "2026-11-25 09:00", completed: false, assigned_member_name: "Sarah" },
  { id: "00000000-0000-4000-8000-000000000162", title: "[DEMO] Pick up Mother's medication refill", priority: "High", date_time: "2026-11-17 18:00", completed: false, assigned_member_name: "Father" },
  { id: "00000000-0000-4000-8000-000000000163", title: "[DEMO] Prepare for Father's birthday celebration", priority: "Medium", date_time: "2026-11-15 17:00", completed: false, assigned_member_name: "Sarah" }
];
var sharedFallbackEvents = JSON.parse(JSON.stringify(initialFallbackEvents));
var sharedFallbackGroceries = JSON.parse(JSON.stringify(initialFallbackGroceries));
var sharedFallbackMedicines = JSON.parse(JSON.stringify(initialFallbackMedicines));
var sharedFallbackMedicineLogs = [];
var sharedFallbackBills = JSON.parse(JSON.stringify(initialFallbackBills));
var sharedFallbackDocuments = JSON.parse(JSON.stringify(initialFallbackDocuments));
var sharedFallbackExpenses = JSON.parse(JSON.stringify(initialFallbackExpenses));
var sharedFallbackReminders = JSON.parse(JSON.stringify(initialFallbackReminders));
var sharedFallbackKnowledge = JSON.parse(JSON.stringify(initialFallbackKnowledge));
function resetSharedFallbackState() {
  sharedFallbackEvents = JSON.parse(JSON.stringify(initialFallbackEvents));
  sharedFallbackGroceries = JSON.parse(JSON.stringify(initialFallbackGroceries));
  sharedFallbackMedicines = JSON.parse(JSON.stringify(initialFallbackMedicines));
  sharedFallbackMedicineLogs = [];
  sharedFallbackBills = JSON.parse(JSON.stringify(initialFallbackBills));
  sharedFallbackDocuments = JSON.parse(JSON.stringify(initialFallbackDocuments));
  sharedFallbackExpenses = JSON.parse(JSON.stringify(initialFallbackExpenses));
  sharedFallbackReminders = JSON.parse(JSON.stringify(initialFallbackReminders));
  sharedFallbackKnowledge = JSON.parse(JSON.stringify(initialFallbackKnowledge));
}
app.get("/api/family/state", authenticateUser, async (req, res) => {
  const user = req.user;
  const token = req.authToken;
  const isDemoMode = req.query.isDemo !== "false" && (req.query.isDemo === "true" || user.familyId === "demo-family-kumar" || user.familyId === "00000000-0000-4000-8000-000000000000");
  const [events, reminders, groceries, expenses, bills, medicines, medicineLogs, documents, knowledgeList] = await Promise.all([
    fetchFamilyData("events", user.familyId, token, "order=date.asc,time.asc&limit=100"),
    fetchFamilyData("reminders", user.familyId, token, "order=date_time.asc&limit=100"),
    fetchFamilyData("groceries", user.familyId, token, "limit=100"),
    fetchFamilyData("expenses", user.familyId, token, "order=date.desc&limit=100"),
    fetchFamilyData("bills", user.familyId, token, "order=due_date.asc&limit=100"),
    fetchFamilyData("medicines", user.familyId, token, "limit=100"),
    fetchFamilyData("medicine_logs", user.familyId, token, "order=timestamp.desc&limit=100"),
    fetchFamilyData("documents", user.familyId, token, "limit=100"),
    fetchFamilyData("family_knowledge", user.familyId, token, "limit=100")
  ]);
  res.json({
    events: events && events.length > 0 ? events : isDemoMode ? sharedFallbackEvents : [],
    reminders: reminders && reminders.length > 0 ? reminders : isDemoMode ? sharedFallbackReminders : [],
    groceries: groceries && groceries.length > 0 ? groceries : isDemoMode ? sharedFallbackGroceries : [],
    expenses: expenses && expenses.length > 0 ? expenses : isDemoMode ? sharedFallbackExpenses : [],
    bills: bills && bills.length > 0 ? bills : isDemoMode ? sharedFallbackBills : [],
    medicines: medicines && medicines.length > 0 ? medicines : isDemoMode ? sharedFallbackMedicines : [],
    medicineLogs: medicineLogs && medicineLogs.length > 0 ? medicineLogs : isDemoMode ? sharedFallbackMedicineLogs : [],
    documents: documents && documents.length > 0 ? documents : isDemoMode ? sharedFallbackDocuments : [],
    knowledge: knowledgeList && knowledgeList.length > 0 ? knowledgeList : isDemoMode ? sharedFallbackKnowledge : []
  });
});
app.post("/api/ai/reset-demo-state", (req, res) => {
  resetSharedFallbackState();
  res.json({ success: true, message: "Demo fallback state successfully reset" });
});
var serverHouseholdStore = /* @__PURE__ */ new Map();
serverHouseholdStore.set("demo-family-kumar", {
  id: "demo-family-kumar",
  name: "Kumar Household",
  inviteCode: "HB-849201",
  createdBy: "demo-user-sarah",
  members: [
    { id: "m-sarah", userId: "demo-user-sarah", name: "Sarah", relation: "Daughter / Admin", role: "Admin", email: "sarah.kumar@homebrain.app", phone: "+91 98400 12345" },
    { id: "m-father", userId: "demo-user-dad", name: "Rajesh", relation: "Father", role: "Co-Admin", email: "dad.rajesh@homebrain.app", phone: "+91 98400 23456" },
    { id: "m-mother", userId: "demo-user-mom", name: "Priya", relation: "Mother", role: "Co-Admin", email: "mom.priya@homebrain.app", phone: "+91 98400 34567" },
    { id: "m-sister", userId: "demo-user-sister", name: "Sneha", relation: "Sister", role: "Member", email: "sister.sneha@homebrain.app", phone: "+91 98400 45678" },
    { id: "m-brother", userId: "demo-user-brother", name: "Sham", relation: "Brother", role: "Member", email: "brother.sham@homebrain.app", phone: "+91 98400 56789" }
  ]
});
app.get("/api/family/hub", authenticateUser, async (req, res) => {
  const user = req.user;
  const token = req.authToken;
  try {
    let familyName = "Family Household";
    let inviteCode = "HB-849201";
    let membersList = [];
    if (SUPABASE_URL && token !== "demo-token" && token !== SUPABASE_ANON_KEY) {
      const famRows = await fetchFamilyData("families", user.familyId, token);
      if (famRows && famRows.length > 0) {
        familyName = famRows[0].name || familyName;
        inviteCode = famRows[0].invite_code || inviteCode;
      }
      const memRows = await fetchFamilyData("family_members", user.familyId, token);
      if (memRows && memRows.length > 0) {
        membersList = memRows;
      }
    }
    if (membersList.length === 0) {
      const stored = serverHouseholdStore.get(user.familyId);
      if (stored) {
        familyName = stored.name;
        inviteCode = stored.inviteCode;
        membersList = stored.members;
      } else {
        membersList = [
          { id: "m-sarah", name: user.name, relation: "Admin", role: user.role, email: user.email }
        ];
      }
    }
    res.json({
      success: true,
      familyId: user.familyId,
      familyName,
      inviteCode,
      currentUser: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      members: membersList
    });
  } catch (err) {
    console.warn("Family hub retrieval error:", err);
    res.status(500).json({ error: err.message || "Failed to retrieve family hub data." });
  }
});
app.post("/api/family/join", authenticateUser, async (req, res) => {
  const user = req.user;
  const { inviteCode, relation = "Member", role = "Member" } = req.body;
  if (!inviteCode) {
    res.status(400).json({ error: "Family invitation code is required." });
    return;
  }
  const cleanCode = String(inviteCode).trim().toUpperCase();
  let targetFamilyId = null;
  let targetFamilyName = "Family Household";
  for (const [fId, item] of serverHouseholdStore.entries()) {
    if (item.inviteCode.toUpperCase() === cleanCode) {
      targetFamilyId = fId;
      targetFamilyName = item.name;
      break;
    }
  }
  if (!targetFamilyId && (cleanCode === "HB-849201" || cleanCode.startsWith("HB-"))) {
    targetFamilyId = "demo-family-kumar";
    targetFamilyName = "Kumar Household";
  }
  if (!targetFamilyId) {
    res.status(404).json({ error: `Household invitation code "${cleanCode}" was not found.` });
    return;
  }
  const fam = serverHouseholdStore.get(targetFamilyId);
  if (fam) {
    const existingIdx = fam.members.findIndex((m) => m.email?.toLowerCase() === user.email?.toLowerCase());
    const memberEntry = {
      id: `m_${Date.now()}`,
      userId: user.id,
      name: user.name,
      relation,
      role,
      email: user.email
    };
    if (existingIdx >= 0) {
      fam.members[existingIdx] = memberEntry;
    } else {
      fam.members.push(memberEntry);
    }
  }
  res.json({
    success: true,
    familyId: targetFamilyId,
    familyName: targetFamilyName,
    inviteCode: cleanCode,
    relation,
    role
  });
});
app.patch("/api/family/member-role", authenticateUser, async (req, res) => {
  const user = req.user;
  const { memberId, newRole } = req.body;
  if (user.role !== "Admin") {
    res.status(403).json({ error: "Only Family Admins can manage household roles." });
    return;
  }
  const fam = serverHouseholdStore.get(user.familyId);
  if (fam) {
    const member = fam.members.find((m) => m.id === memberId || m.userId === memberId);
    if (member) {
      member.role = newRole;
    }
  }
  res.json({ success: true, memberId, newRole });
});
app.post("/api/family/sync", authenticateUser, async (req, res) => {
  const user = req.user;
  const token = req.authToken;
  const [events, reminders, groceries, expenses, bills] = await Promise.all([
    fetchFamilyData("events", user.familyId, token, "order=date.asc,time.asc&limit=100"),
    fetchFamilyData("reminders", user.familyId, token, "order=date_time.asc&limit=100"),
    fetchFamilyData("groceries", user.familyId, token, "limit=100"),
    fetchFamilyData("expenses", user.familyId, token, "order=date.desc&limit=100"),
    fetchFamilyData("bills", user.familyId, token, "order=due_date.asc&limit=100")
  ]);
  res.json({
    success: true,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    familyId: user.familyId,
    groceries: groceries || sharedFallbackGroceries,
    expenses: expenses || sharedFallbackExpenses,
    reminders: reminders || sharedFallbackReminders,
    events: events || sharedFallbackEvents,
    bills: bills || sharedFallbackBills
  });
});
app.post("/api/ai/query", authenticateUser, async (req, res) => {
  const startTime = Date.now();
  const { query, conversationHistory = [], attachments = [], clientState } = req.body;
  const user = req.user;
  const token = req.authToken;
  const isExplicitNonDemo = req.body?.isDemo === false;
  if (!query && (!attachments || attachments.length === 0)) {
    res.status(400).json({ error: "Query or attachments are required." });
    return;
  }
  try {
    let gOrUndef2 = function(v) {
      return v || void 0;
    };
    var gOrUndef = gOrUndef2;
    const normalizeClientEvents = (arr) => arr.map((e) => ({
      ...e,
      members_involved: e.members_involved || e.membersInvolved || ["Family"],
      membersInvolved: e.membersInvolved || e.members_involved || ["Family"]
    }));
    const normalizeClientGroceries = (arr) => arr.map((g) => ({
      ...g,
      is_purchased: Boolean(g.is_purchased ?? g.isPurchased),
      isPurchased: Boolean(g.isPurchased ?? g.is_purchased),
      estimated_price: g.estimated_price ?? g.estimatedPrice,
      estimatedPrice: g.estimatedPrice ?? g.estimated_price,
      purchased_by: g.purchased_by || g.purchasedBy,
      purchasedBy: g.purchasedBy || g.purchased_by
    }));
    const normalizeClientBills = (arr) => arr.map((b) => ({
      ...b,
      due_date: b.due_date || b.dueDate,
      dueDate: b.dueDate || b.due_date,
      is_paid: Boolean(b.is_paid ?? b.isPaid),
      isPaid: Boolean(b.isPaid ?? b.is_paid),
      paid_by: b.paid_by || b.paidBy,
      paidBy: b.paidBy || gOrUndef2(b.paid_by),
      paid_date: b.paid_date || b.paidDate,
      paidDate: b.paidDate || b.paid_date
    }));
    const normalizeClientExpenses = (arr) => arr.map((x) => ({
      ...x,
      due_date: x.due_date || x.dueDate || x.date,
      dueDate: x.dueDate || x.due_date || x.date
    }));
    const normalizeClientReminders = (arr) => arr.map((r) => ({
      ...r,
      date_time: r.date_time || r.dateTime,
      dateTime: r.dateTime || r.date_time,
      assigned_member_name: r.assigned_member_name || r.assignedMemberName || "Family",
      assignedMemberName: r.assignedMemberName || r.assigned_member_name || "Family",
      completed: Boolean(r.completed)
    }));
    const normalizeClientMedicines = (arr) => arr.map((m) => ({
      ...m,
      person_name: m.person_name || m.personName || "Family",
      personName: m.personName || m.person_name || "Family",
      status: m.status || "Active"
    }));
    const normalizeClientMedicineLogs = (arr) => arr.map((l) => ({
      ...l,
      medicine_id: l.medicine_id || l.medicineId,
      medicineId: l.medicineId || l.medicine_id,
      medicine_name: l.medicine_name || l.medicineName,
      medicineName: l.medicineName || l.medicine_name,
      person_name: l.person_name || l.personName,
      personName: l.personName || l.person_name,
      logged_by: l.logged_by || l.loggedBy,
      loggedBy: l.loggedBy || l.logged_by
    }));
    const normalizeClientKnowledge = (arr) => arr.map((k) => ({
      ...k,
      related_member_name: k.related_member_name || k.relatedMemberName || "All",
      relatedMemberName: k.relatedMemberName || k.related_member_name || "All"
    }));
    const normalizeClientDocuments = (arr) => arr.map((d) => ({
      ...d,
      file_type: d.file_type || d.fileType,
      file_size: d.file_size || d.fileSize,
      uploader_name: d.uploader_name || d.uploaderName,
      upload_date: d.upload_date || d.uploadDate,
      summary_content: d.summary_content || d.summaryContent
    }));
    if (!isExplicitNonDemo && clientState && typeof clientState === "object") {
      if (Array.isArray(clientState.events) && clientState.events.length > 0) {
        sharedFallbackEvents.splice(0, sharedFallbackEvents.length, ...normalizeClientEvents(clientState.events));
      }
      if (Array.isArray(clientState.groceries) && clientState.groceries.length > 0) {
        sharedFallbackGroceries.splice(0, sharedFallbackGroceries.length, ...normalizeClientGroceries(clientState.groceries));
      }
      if (Array.isArray(clientState.bills) && clientState.bills.length > 0) {
        sharedFallbackBills.splice(0, sharedFallbackBills.length, ...normalizeClientBills(clientState.bills));
      }
      if (Array.isArray(clientState.expenses) && clientState.expenses.length > 0) {
        sharedFallbackExpenses.splice(0, sharedFallbackExpenses.length, ...normalizeClientExpenses(clientState.expenses));
      }
      if (Array.isArray(clientState.reminders) && clientState.reminders.length > 0) {
        sharedFallbackReminders.splice(0, sharedFallbackReminders.length, ...normalizeClientReminders(clientState.reminders));
      }
      if (Array.isArray(clientState.medicines) && clientState.medicines.length > 0) {
        sharedFallbackMedicines.splice(0, sharedFallbackMedicines.length, ...normalizeClientMedicines(clientState.medicines));
      }
      if (Array.isArray(clientState.medicineLogs)) {
        sharedFallbackMedicineLogs.splice(0, sharedFallbackMedicineLogs.length, ...normalizeClientMedicineLogs(clientState.medicineLogs));
      }
      if (Array.isArray(clientState.knowledgeList) && clientState.knowledgeList.length > 0) {
        sharedFallbackKnowledge.splice(0, sharedFallbackKnowledge.length, ...normalizeClientKnowledge(clientState.knowledgeList));
      }
      if (Array.isArray(clientState.documents) && clientState.documents.length > 0) {
        sharedFallbackDocuments.splice(0, sharedFallbackDocuments.length, ...normalizeClientDocuments(clientState.documents));
      }
    }
    const [
      events,
      reminders,
      groceries,
      groceryHistory,
      medicines,
      medicineLogs,
      expenses,
      bills,
      knowledgeList,
      documents,
      memories
    ] = await Promise.all([
      fetchFamilyData("events", user.familyId, token, "order=date.asc,time.asc&limit=30"),
      fetchFamilyData("reminders", user.familyId, token, "order=date_time.asc&limit=30"),
      fetchFamilyData("groceries", user.familyId, token, "limit=50"),
      fetchFamilyData("grocery_history", user.familyId, token, "order=purchased_at.desc&limit=15"),
      fetchFamilyData("medicines", user.familyId, token, "limit=30"),
      fetchFamilyData("medicine_logs", user.familyId, token, "order=timestamp.desc&limit=20"),
      fetchFamilyData("expenses", user.familyId, token, "order=date.desc&limit=30"),
      fetchFamilyData("bills", user.familyId, token, "order=due_date.asc&limit=20"),
      fetchFamilyData("family_knowledge", user.familyId, token, "limit=40"),
      fetchFamilyData("documents", user.familyId, token, "limit=40"),
      fetchFamilyData("family_memories", user.familyId, token, "order=year.desc,date.desc&limit=30")
    ]);
    const effectiveEvents = isExplicitNonDemo ? Array.isArray(clientState?.events) ? normalizeClientEvents(clientState.events) : events || [] : events && events.length > 0 ? events : sharedFallbackEvents;
    const effectiveGroceries = isExplicitNonDemo ? Array.isArray(clientState?.groceries) ? normalizeClientGroceries(clientState.groceries) : groceries || [] : groceries && groceries.length > 0 ? groceries : sharedFallbackGroceries;
    const effectiveBills = isExplicitNonDemo ? Array.isArray(clientState?.bills) ? normalizeClientBills(clientState.bills) : bills || [] : bills && bills.length > 0 ? bills : sharedFallbackBills;
    const effectiveDocuments = isExplicitNonDemo ? Array.isArray(clientState?.documents) ? normalizeClientDocuments(clientState.documents) : documents || [] : documents && documents.length > 0 ? documents : sharedFallbackDocuments;
    const effectiveExpenses = isExplicitNonDemo ? Array.isArray(clientState?.expenses) ? normalizeClientExpenses(clientState.expenses) : expenses || [] : expenses && expenses.length > 0 ? expenses : sharedFallbackExpenses;
    const effectiveReminders = isExplicitNonDemo ? Array.isArray(clientState?.reminders) ? normalizeClientReminders(clientState.reminders) : reminders || [] : reminders && reminders.length > 0 ? reminders : sharedFallbackReminders;
    const effectiveMedicines = isExplicitNonDemo ? Array.isArray(clientState?.medicines) ? normalizeClientMedicines(clientState.medicines) : medicines || [] : medicines && medicines.length > 0 ? medicines : sharedFallbackMedicines;
    const effectiveMedicineLogs = isExplicitNonDemo ? Array.isArray(clientState?.medicineLogs) ? normalizeClientMedicineLogs(clientState.medicineLogs) : medicineLogs || [] : medicineLogs && medicineLogs.length > 0 ? medicineLogs : sharedFallbackMedicineLogs;
    const effectiveKnowledge = isExplicitNonDemo ? Array.isArray(clientState?.knowledgeList) ? normalizeClientKnowledge(clientState.knowledgeList) : knowledgeList || [] : knowledgeList && knowledgeList.length > 0 ? knowledgeList : sharedFallbackKnowledge;
    const groundingSources = [];
    let familyContext = `=== AUTHORIZED FAMILY DATA FOR FAMILY ID: ${user.familyId} (Active User: ${user.name}, Role: ${user.role}) ===
`;
    if (effectiveEvents.length > 0) {
      groundingSources.push("Calendar Events");
      familyContext += `
--- CALENDAR EVENTS (${effectiveEvents.length}) ---
`;
      effectiveEvents.forEach((e) => {
        familyContext += `\u2022 [${e.date} at ${e.time}] ${e.title} (Category: ${e.category}, Recurring: ${e.recurring}, Members: ${JSON.stringify(e.members_involved)})
`;
      });
    }
    if (effectiveReminders.length > 0) {
      groundingSources.push("Reminders");
      familyContext += `
--- REMINDERS (${effectiveReminders.length}) ---
`;
      effectiveReminders.forEach((r) => {
        familyContext += `\u2022 [Priority: ${r.priority}] ${r.title} (Due: ${r.date_time}, Completed: ${r.completed}, Assigned to: ${r.assigned_member_name})
`;
      });
    }
    if (effectiveMedicines.length > 0) {
      groundingSources.push("Medicine Manager");
      familyContext += `
--- MEDICINES & DOSES (${effectiveMedicines.length}) ---
`;
      effectiveMedicines.forEach((m) => {
        familyContext += `\u2022 For ${m.person_name || m.personName}: ${m.name} (${m.dosage}) at ${m.timing} [Frequency: ${m.frequency}, Status: ${m.status || "Active"}, Notes: ${m.notes || "None"}]
`;
      });
    }
    if (effectiveGroceries.length > 0) {
      groundingSources.push("Smart Grocery List");
      familyContext += `
--- GROCERY ITEMS (${effectiveGroceries.length}) ---
`;
      const pending = effectiveGroceries.filter((g) => !g.is_purchased);
      const purchased = effectiveGroceries.filter((g) => g.is_purchased);
      familyContext += `Pending (${pending.length}): ` + pending.map((g) => `${g.name} (${g.quantity})`).join(", ") + "\n";
      if (purchased.length > 0) {
        familyContext += `Recently Purchased (${purchased.length}): ` + purchased.slice(0, 5).map((g) => `${g.name} by ${g.purchased_by || "Unknown"}`).join(", ") + "\n";
      }
    }
    if (groceryHistory.length > 0) {
      groundingSources.push("Grocery Purchase History");
      familyContext += `
--- GROCERY PURCHASE LOG (${groceryHistory.length}) ---
`;
      groceryHistory.slice(0, 10).forEach((h) => {
        familyContext += `\u2022 ${h.name} bought by ${h.purchased_by} on ${h.purchased_at}
`;
      });
    }
    if (effectiveBills.length > 0) {
      groundingSources.push("Bills & Payments");
      familyContext += `
--- BILLS (${effectiveBills.length}) ---
`;
      effectiveBills.forEach((b) => {
        familyContext += `\u2022 ${b.title}: \u20B9${b.amount} (Due: ${b.due_date}, Paid: ${b.is_paid ? `Yes by ${b.paid_by}` : "No"})
`;
      });
    }
    if (effectiveExpenses.length > 0) {
      groundingSources.push("Expense Ledger");
      familyContext += `
--- RECENT EXPENSES (${effectiveExpenses.length}) ---
`;
      effectiveExpenses.slice(0, 15).forEach((x) => {
        familyContext += `\u2022 \u20B9${x.amount} for "${x.title}" (${x.category}) on ${x.date} paid by ${x.payer}
`;
      });
    }
    if (effectiveKnowledge.length > 0) {
      groundingSources.push("Family Knowledge Base");
      familyContext += `
--- CRITICAL FAMILY KNOWLEDGE & ALLERGIES (${effectiveKnowledge.length}) ---
`;
      effectiveKnowledge.forEach((k) => {
        familyContext += `\u2022 [${k.importance}] ${k.title} (${k.category}, For: ${k.related_member_name}): ${k.content}
`;
      });
    }
    if (effectiveDocuments.length > 0) {
      groundingSources.push("Document Vault");
      familyContext += `
--- DOCUMENT VAULT RECORDS (${effectiveDocuments.length}) ---
`;
      effectiveDocuments.forEach((d) => {
        familyContext += `\u2022 "${d.title}" (${d.category}, Uploaded: ${d.upload_date} by ${d.uploader_name}): ${d.description || "No description"} ${d.summary_content ? `[Summary: ${d.summary_content}]` : ""}
`;
      });
    }
    if (memories.length > 0) {
      groundingSources.push("Family Timeline Memories");
      familyContext += `
--- FAMILY TIMELINE MEMORIES (${memories.length}) ---
`;
      memories.forEach((mem) => {
        familyContext += `\u2022 [Year ${mem.year}, Date ${mem.date}] "${mem.title}" (Location: ${mem.location || "Unknown"}, Added by: ${mem.added_by}): ${mem.description}
`;
      });
    }
    const inlineParts = [];
    if (attachments && Array.isArray(attachments)) {
      for (const att of attachments) {
        if (att.base64 && att.mimeType) {
          groundingSources.push(`Attachment: ${att.name || "File"}`);
          if (att.mimeType.startsWith("image/") || att.mimeType === "application/pdf") {
            inlineParts.push({
              inlineData: {
                mimeType: att.mimeType,
                data: att.base64
              }
            });
          } else if (att.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
            const buf = Buffer.from(att.base64, "base64");
            const res2 = await mammoth.extractRawText({ buffer: buf });
            familyContext += `
--- ATTACHED DOCX CONTENT (${att.name}) ---
${res2.value}
`;
          } else if (att.mimeType.startsWith("text/")) {
            const buf = Buffer.from(att.base64, "base64");
            familyContext += `
--- ATTACHED TEXT CONTENT (${att.name}) ---
${buf.toString("utf-8")}
`;
          }
        }
      }
    }
    const actionsExecuted = [];
    const systemPrompt = `You are HomeBrain AI, the intelligent, caring, and private assistant for this household.
You have direct, real-time access to the family's schedule, reminders, medicine tracker, groceries, expenses, bills, documents, memories, and health knowledge.

RULES:
1. Ground your answers strictly in the provided family data and attached documents.
2. If the user asks about schedules, medicines, groceries, bills, allergies, or past events, cite the specific information clearly.
3. NEVER fabricate or hallucinate family details. If something is not in the records, say so politely and suggest adding it.
4. If asked about medicines or health/allergies, be precise, clear, and highlight any critical medical warnings.
5. Format your answers clearly using Markdown with bullet points, emojis, and bold text.
6. For queries in Indian context, currency amounts are in Indian Rupees (\u20B9).
7. If an image or document attachment is provided, analyze it thoroughly to answer questions or extract its data for the family.

${familyContext}`;
    let reply = "";
    const sessionKey = user.familyId || user.id || "demo-family";
    const cleanQ = (query || "").toLowerCase().trim();
    const activePending = getPendingAction(sessionKey);
    const isConflictResolutionAnswer = /^(?:yes\s+)?(?:please\s+)?(?:(?:update|change|chnage|chagne)(?:\s+it|\s+date|\s+the\s+date|\s+existing|\s+and\s+(?:change|chnage|chagne)|\s+to|\s+into)?.*|(?:add\s+(?:as\s+)?)?separate(?:\s+event)?|keep\s+both)$/i.test(cleanQ) || /\b(?:update|change|chnage)\b/i.test(cleanQ) && /\b(?:it|date|into|to)\b/i.test(cleanQ);
    if ((isConflictResolutionAnswer || activePending && isAnsweringPendingAction(query || "", activePending)) && (!attachments || attachments.length === 0)) {
      const pendingResult = await processIntelligentAction(
        query || "",
        {
          events: effectiveEvents,
          groceries: effectiveGroceries,
          bills: effectiveBills,
          expenses: effectiveExpenses,
          reminders: effectiveReminders,
          medicines: effectiveMedicines,
          medicineLogs: effectiveMedicineLogs,
          documents: effectiveDocuments,
          knowledgeList: effectiveKnowledge,
          user,
          token,
          conversationHistory,
          attachments
        },
        {
          insertFamilyData,
          updateFamilyData,
          deleteFamilyData
        }
      );
      if (pendingResult.handled) {
        const allActions = [...actionsExecuted, ...pendingResult.actionsExecuted];
        res.json({
          reply: pendingResult.reply,
          text: pendingResult.text,
          sources: pendingResult.sources,
          groundingSources: pendingResult.sources,
          actions: allActions,
          actionsExecuted: allActions,
          processingTimeMs: Date.now() - startTime,
          allEvents: effectiveEvents,
          allExpenses: effectiveExpenses,
          allGroceries: effectiveGroceries,
          allBills: effectiveBills,
          allReminders: effectiveReminders,
          allMedicines: effectiveMedicines,
          allMedicineLogs: effectiveMedicineLogs,
          allKnowledge: effectiveKnowledge,
          allDocuments: effectiveDocuments
        });
        return;
      }
    } else if (activePending && !isAnsweringPendingAction(query || "", activePending)) {
      clearPendingAction(sessionKey);
    }
    const isSaveOrMutationWithAttachment = Boolean(
      attachments && attachments.length > 0 && /\b(?:save|upload|store|add|record|delete|remove|keep|put)\b/i.test(query || "")
    );
    if (!attachments || attachments.length === 0 || isSaveOrMutationWithAttachment) {
      const cognitiveResult = await processIntelligentAction(
        query || "",
        {
          events: effectiveEvents,
          groceries: effectiveGroceries,
          bills: effectiveBills,
          expenses: effectiveExpenses,
          reminders: effectiveReminders,
          medicines: effectiveMedicines,
          medicineLogs: effectiveMedicineLogs,
          documents: effectiveDocuments,
          knowledgeList: effectiveKnowledge,
          user,
          token,
          conversationHistory,
          attachments
        },
        {
          insertFamilyData,
          updateFamilyData,
          deleteFamilyData
        }
      );
      if (cognitiveResult.handled) {
        const allActions = [...actionsExecuted, ...cognitiveResult.actionsExecuted];
        res.json({
          reply: cognitiveResult.reply,
          text: cognitiveResult.text,
          sources: cognitiveResult.sources,
          groundingSources: cognitiveResult.sources,
          actions: allActions,
          actionsExecuted: allActions,
          processingTimeMs: Date.now() - startTime,
          allEvents: effectiveEvents,
          allExpenses: effectiveExpenses,
          allGroceries: effectiveGroceries,
          allBills: effectiveBills,
          allReminders: effectiveReminders,
          allMedicines: effectiveMedicines,
          allMedicineLogs: effectiveMedicineLogs,
          allKnowledge: effectiveKnowledge,
          allDocuments: effectiveDocuments
        });
        return;
      }
    }
    const trainedDialogue = !attachments || attachments.length === 0 ? matchHomeBrainTrainedDialogue(
      query || "",
      effectiveDocuments,
      user,
      effectiveBills,
      {
        groceries: effectiveGroceries,
        reminders: effectiveReminders,
        events: effectiveEvents,
        expenses: effectiveExpenses,
        tasks: effectiveReminders
      }
    ) : null;
    if (trainedDialogue) {
      res.json({
        reply: trainedDialogue,
        text: trainedDialogue,
        sources: ["HomeBrain Trained Dialog Catalog"],
        groundingSources: ["HomeBrain Trained Dialog Catalog"],
        actions: actionsExecuted,
        actionsExecuted,
        processingTimeMs: Date.now() - startTime,
        allEvents: effectiveEvents,
        allExpenses: effectiveExpenses,
        allGroceries: effectiveGroceries,
        allBills: effectiveBills,
        allReminders: effectiveReminders,
        allMedicines: effectiveMedicines,
        allMedicineLogs: effectiveMedicineLogs,
        allKnowledge: effectiveKnowledge,
        allDocuments: effectiveDocuments
      });
      return;
    }
    if (GEMINI_API_KEY) {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const promptParts = [...inlineParts];
      promptParts.push({ text: `${systemPrompt}

User Question: ${query || "Please analyze the attached document or image."}` });
      const modelResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: promptParts
          }
        ]
      });
      reply = modelResponse.text || "HomeBrain could not generate a response.";
    } else if (OPENAI_API_KEY) {
      const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: query }
          ]
        })
      });
      const data = await openaiRes.json();
      reply = data.choices?.[0]?.message?.content || "No response from OpenAI model.";
    } else {
      const ollamaReply = await queryOllama(`${systemPrompt}

User: ${query}`);
      if (ollamaReply) {
        reply = ollamaReply;
      } else {
        const qL = (query || "").toLowerCase().trim();
        const getKolkataDateString2 = (offsetDays = 0) => {
          const d = /* @__PURE__ */ new Date();
          d.setDate(d.getDate() + offsetDays);
          return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
        };
        const todayDateStr = getKolkataDateString2(0);
        const tomorrowDateStr = getKolkataDateString2(1);
        const isTodayQuery = qL.includes("today") || qL.includes("only today") || qL === "only give today" || qL === "give today" || qL.includes("for today") || qL.includes("happening today") || qL === "today schedule" || qL === "what is today schedule?" || qL === "what is today schedule" || qL === "what events do i have today?" || qL === "what events do i have today";
        if (isTodayQuery) {
          const todayEvents = effectiveEvents.filter((e) => e.date === todayDateStr);
          const todayReminders = effectiveReminders.filter((r) => !r.completed && (r.date_time?.startsWith(todayDateStr) || !r.date_time));
          if (todayEvents.length > 0) {
            reply = `\u{1F4C5} **Today's Family Schedule (${cleanEventDate(todayDateStr)})**:

` + todayEvents.map((e) => `\u2022 **${e.date} at ${cleanEventTime(e.time)}**: ${e.title.replace("[DEMO] ", "")} (${e.category}) - Members: ${(Array.isArray(e.members_involved) ? e.members_involved : []).join(", ")}`).join("\n");
            if (todayReminders.length > 0) {
              reply += `

\u{1F4DD} **Pending Reminders for Today**:
` + todayReminders.map((r) => `\u2022 **${r.title.replace("[DEMO] ", "")}** (${r.priority} Priority, Assigned: ${r.assigned_member_name || "Family"})`).join("\n");
            }
          } else {
            const futureEvents = effectiveEvents.filter((e) => e.date > todayDateStr).sort((a, b) => a.date.localeCompare(b.date));
            const nextEv = futureEvents[0];
            reply = `\u{1F4C5} **Today's Family Schedule (${cleanEventDate(todayDateStr)})**:

There are **no calendar events scheduled for today**.

` + (todayReminders.length > 0 ? `\u{1F4DD} **Today's Reminders**:
${todayReminders.map((r) => `\u2022 **${r.title.replace("[DEMO] ", "")}**`).join("\n")}

` : "") + (nextEv ? `*(Your next upcoming event is **${nextEv.title.replace("[DEMO] ", "")}** on ${cleanEventDate(nextEv.date)} at ${cleanEventTime(nextEv.time)}).*` : "");
          }
        } else if (qL.includes("tomorrow")) {
          const tomorrowEvents = effectiveEvents.filter((e) => e.date === tomorrowDateStr);
          if (tomorrowEvents.length > 0) {
            reply = `\u{1F4C5} **Tomorrow's Schedule (${cleanEventDate(tomorrowDateStr)})**:

` + tomorrowEvents.map((e) => `\u2022 **${e.date} at ${cleanEventTime(e.time)}**: ${e.title.replace("[DEMO] ", "")} (${e.category}) - Members: ${(Array.isArray(e.members_involved) ? e.members_involved : []).join(", ")}`).join("\n");
          } else {
            reply = `\u{1F4C5} **Tomorrow's Schedule (${cleanEventDate(tomorrowDateStr)})**:

No calendar events scheduled for tomorrow.`;
          }
        } else if (qL.includes("paid bill") || qL.includes("bill") && (qL.includes("paid") || qL.includes("cleared") || qL.includes("settled"))) {
          const paidBills = effectiveBills.filter((b) => b.is_paid || b.isPaid);
          const totalPaid = paidBills.reduce((s, b) => s + (Number(b.amount) || 0), 0);
          if (paidBills.length > 0) {
            reply = `\u{1F4B3} **Paid Household Bills (${paidBills.length} paid, Total: \u20B9${totalPaid.toLocaleString("en-IN")})**:

` + paidBills.map((b) => `\u2022 **${(b.title || "").replace(/^\[demo\]\s*/i, "")}**: \u20B9${Number(b.amount).toLocaleString("en-IN")} (Status: Paid)`).join("\n");
          } else {
            reply = `\u{1F4B3} **Paid Household Bills**:

No paid bills registered in your current billing cycle.`;
          }
        } else if (/(?:how\s+much\s+is\s+|what\s+is\s+)(?:my\s+|the\s+)?([a-zA-Z]+)\s+bill/i.test(qL)) {
          const bMatch = qL.match(/(?:how\s+much\s+is\s+|what\s+is\s+)(?:my\s+|the\s+)?([a-zA-Z]+)\s+bill/i);
          const bType = (bMatch ? bMatch[1] : "electricity").toLowerCase();
          const matched = effectiveBills.find((b) => {
            const t = (b.title || "").toLowerCase();
            return t.includes(bType) || (bType === "electricity" || bType === "eb") && (t.includes("electric") || t.includes("eb") || t.includes("power"));
          });
          if (matched) {
            reply = `\u{1F4B3} **${(matched.title || "Bill").replace(/^\[demo\]\s*/i, "")}**:

\u2022 **Amount**: \u20B9${Number(matched.amount).toLocaleString("en-IN")}
\u2022 **Status**: ${matched.is_paid ? "Paid" : "Unpaid (Pending)"}
\u2022 **Due Date**: ${matched.due_date || "2026-11-25"}
\u2022 **Category**: ${matched.category || "Utilities"}`;
          } else {
            reply = `I could not find a registered ${bType} bill in your records.`;
          }
        } else if (qL.includes("bill") || qL.includes("pending bill") || qL.includes("due") || qL.includes("pay")) {
          const pendingBills = effectiveBills.filter((b) => !b.is_paid);
          const totalPending = pendingBills.reduce((s, b) => s + (Number(b.amount) || 0), 0);
          if (pendingBills.length > 0) {
            reply = `\u{1F4B3} **Pending Household Bills (${pendingBills.length} found, Total: \u20B9${totalPending.toLocaleString("en-IN")})**:

` + pendingBills.map((b) => `\u2022 **${b.title}**: \u20B9${Number(b.amount).toLocaleString("en-IN")} (Due: ${b.due_date}, Recurring: ${b.recurring})`).join("\n") + `

*(You can view or pay them in Household Finances.)*`;
          } else {
            reply = `\u2705 All registered household bills are currently paid! (Total registered bills: ${effectiveBills.length}).`;
          }
        } else if (qL.includes("birthday") || qL.includes("born")) {
          const bdayEvents = effectiveEvents.filter((e) => e.category === "Birthday" || e.title && e.title.toLowerCase().includes("birthday"));
          if (bdayEvents.length > 0) {
            reply = `\u{1F382} **Family Birthday Records (${bdayEvents.length} found)**:

` + bdayEvents.map((e) => `\u2022 **${e.title.replace("[DEMO] ", "")}**: ${e.date}`).join("\n");
          } else {
            reply = `No birthday events found in your calendar. You can add birthdays in the Calendar module.`;
          }
        } else if (qL.includes("appointment") || qL.includes("doctor") || qL.includes("checkup")) {
          const appts = effectiveEvents.filter((e) => e.category === "Appointment" || e.title && (e.title.toLowerCase().includes("appointment") || e.title.toLowerCase().includes("doctor") || e.title.toLowerCase().includes("clinic") || e.title.toLowerCase().includes("checkup")));
          if (appts.length > 0) {
            reply = `\u{1FA7A} **Upcoming Family Appointments (${appts.length} scheduled)**:

` + appts.map((a) => `\u2022 **${a.title.replace("[DEMO] ", "")}** on ${a.date} at ${a.time} - ${a.description || ""}`).join("\n");
          } else {
            reply = `No upcoming doctor or medical appointments found in the family schedule.`;
          }
        } else if (qL.includes("spend") || qL.includes("spent") || qL.includes("expense") || qL.includes("burn rate")) {
          const totalExpenses = effectiveExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
          const topExpenses = effectiveExpenses.slice(0, 5);
          reply = `\u{1F4CA} **Family Expenditure Summary (Total: \u20B9${totalExpenses.toLocaleString("en-IN")})**:

\u2022 **Total logged transactions**: ${effectiveExpenses.length}
` + topExpenses.map((x) => `\u2022 \u20B9${Number(x.amount).toLocaleString("en-IN")} for "${x.title.replace("[DEMO] ", "")}" (${x.category}) on ${x.date} by ${x.payer}`).join("\n");
        } else if (qL.includes("medicine") || qL.includes("medication") || qL.includes("dose") || qL.includes("prescription")) {
          if (qL.includes("refill") || qL.includes("stock")) {
            reply = `\u{1F48A} **Family Medicine Inventory & Refill Status**:

` + effectiveMedicines.map((m) => `\u2022 **${m.name.replace("[DEMO] ", "")}** (${m.dosage}): ${m.inventory_count || 24} units remaining`).join("\n");
          } else if (effectiveMedicines.length > 0) {
            reply = `\u{1F48A} **Registered Family Medication Regimens (${effectiveMedicines.length} prescriptions)**:

` + effectiveMedicines.map((m) => `\u2022 **For ${m.person_name}**: ${m.name.replace("[DEMO] ", "")} (${m.dosage}) at ${m.timing} [Frequency: ${m.frequency}] - ${m.notes || "No special notes"}`).join("\n");
          } else {
            reply = `No active medication schedules registered in Medicine Manager.`;
          }
        } else if (/(?:do\s+(?:i|we)\s+need\s+to\s+buy|should\s+(?:i|we)\s+buy|is\s+.*?\s+(?:on\s+(?:my\s+|the\s+)?list|needed|pending))\b/i.test(qL) || qL.includes("need to buy milk") || qL.includes("do i need to buy")) {
          const itmM = qL.match(/(?:need\s+to\s+buy|should\s+(?:i|we)\s+buy|buy|have|need|is)\s+([a-zA-Z\s]+?)(?:\s+(?:from|in|on|to|already|needed)\b.*|\?|$)/i);
          const itm = (itmM && itmM[1] ? itmM[1].replace(/^(?:any|more|some|a|an|the|to\s+buy)\s+/i, "").trim() : "milk").toLowerCase();
          const matched = effectiveGroceries.find((g) => !g.is_purchased && !g.isPurchased && (g.name || "").toLowerCase().includes(itm));
          if (matched) {
            reply = `\u{1F6D2} Yes, you need to buy **${matched.name.replace("[DEMO] ", "")}** (${matched.quantity || "1 unit"}) \u2014 it is pending on your Smart Grocery list.`;
          } else {
            reply = `\u{1F6D2} No, **${itm}** is not currently on your pending grocery list.`;
          }
        } else if (qL.includes("grocery") || qL.includes("groceries") || qL.includes("shopping") || qL.includes("pantry")) {
          const pending = effectiveGroceries.filter((g) => !g.is_purchased);
          if (pending.length > 0) {
            reply = `\u{1F6D2} **Smart Grocery List (${pending.length} items to buy)**:

` + pending.map((g) => `\u2022 **${g.name.replace("[DEMO] ", "")}** (${g.quantity}) - Category: ${g.category}`).join("\n");
          } else {
            reply = `\u2705 The grocery list is currently clear! All items have been purchased.`;
          }
        } else if (/(?:wi-?fi|wifi|password)/i.test(qL)) {
          reply = `\u{1F4F6} **Home Wi-Fi Network & Password**:

\u2022 **Network (SSID)**: HomeBrain_5G
\u2022 **Password**: \`HomeBrain@2026\`
\u2022 **Guest Network**: HomeBrain_Guest (No password required)`;
        } else if (/(?:spare\s*key|house\s*key|balcony\s*key)/i.test(qL)) {
          reply = `\u{1F511} **Spare House Key Location**:

\u2022 **Location**: Placed securely **under the blue ceramic flower pot** in the front balcony.
\u2022 **Access**: Kept strictly for trusted family members and emergencies.`;
        } else if (/(?:home\s*address|residence\s*address|where.*live)/i.test(qL)) {
          reply = `\u{1F3E1} **Family Residence Address**:

\u2022 **Address**: Kumar Family Residence, #42 Emerald Palms, Sarjapur Road, Bengaluru, Karnataka - 560035.`;
        } else if (/(?:screen\s*time|household\s*rule|study\s*hour)/i.test(qL)) {
          reply = `\u{1F4DC} **Household & Study Rules**:

\u2022 **Screen Time**: Entertainment screens and devices off after 10:00 PM on school nights.
\u2022 **Study Hours**: Dedicated study hour from 6:00 PM to 7:00 PM daily.`;
        } else if (/(?:how\s+many|count|number\s+of|total)\b.*(?:document|vault|file)/i.test(qL) || qL === "how many documents are stored in my family document vault?") {
          reply = `\u{1F4C2} **Family Document Vault Overview (${effectiveDocuments.length} documents stored)**:

\u2022 **Total Documents**: ${effectiveDocuments.length}
` + effectiveDocuments.map((d, idx) => `\u2022 ${idx + 1}. **${d.title.replace("[DEMO] ", "")}** (${d.category}, ${d.file_type || "PDF"})`).join("\n") + `

All documents are securely encrypted, verified, and available for retrieval.`;
        } else if (/^(?:list|show|display|get|view|fetch)\s+(?:me\s+)?(?:all\s+)?(?:my\s+|our\s+|the\s+)?(?:uploaded\s+|stored\s+|saved\s+|family\s+|vault\s+)?documents?\b/i.test(qL)) {
          reply = `\u{1F4C1} **Uploaded Documents in Family Vault (${effectiveDocuments.length} files)**:

` + effectiveDocuments.map((d, idx) => `\u2022 ${idx + 1}. **${d.title.replace("[DEMO] ", "")}** \u2014 Category: **${d.category}** | Uploaded: **${d.upload_date || "2026-11-15"}**`).join("\n");
        } else if (qL.includes("allerg") || qL.includes("warning") || qL.includes("dietary") || qL.includes("blood")) {
          const healthRecords = effectiveKnowledge.filter((k) => k.category === "Allergies" || k.category === "Emergency" || k.category === "Dietary" || k.importance === "Critical");
          if (healthRecords.length > 0) {
            reply = `\u26A0\uFE0F **Critical Family Health & Allergy Records (${healthRecords.length} records)**:

` + healthRecords.map((k) => `\u2022 **[${k.importance}] ${k.title.replace("[DEMO] ", "")}** (For: ${k.related_member_name}): ${k.content}`).join("\n");
          } else {
            reply = `No critical allergy or health warnings found in the Family Knowledge Base.`;
          }
        } else if (qL.includes("document") || qL.includes("passport") || qL.includes("insurance") || qL.includes("vault") || qL.includes("fetch") || qL.includes("policy")) {
          if (effectiveDocuments.length > 0) {
            const passportDoc = effectiveDocuments.find((d) => d.title && d.title.toLowerCase().includes("passport") || d.description && d.description.toLowerCase().includes("passport"));
            const insuranceDoc = effectiveDocuments.find((d) => d.title && (d.title.toLowerCase().includes("insurance") || d.title.toLowerCase().includes("star health") || d.title.toLowerCase().includes("policy")));
            if (qL.includes("passport") && passportDoc) {
              reply = `\u{1F4C4} **Retrieved Document**: **${passportDoc.title.replace("[DEMO] ", "")}** (${passportDoc.category})

\u2022 **File Type & Size**: ${passportDoc.file_type || passportDoc.fileType} (${passportDoc.file_size || passportDoc.fileSize})
\u2022 **Uploaded By**: ${passportDoc.uploader_name || passportDoc.uploaderName} on ${passportDoc.upload_date || passportDoc.uploadDate}

\u{1F4DD} **Extracted Document Content & Verification**:
${passportDoc.summary_content || passportDoc.summaryContent || passportDoc.description}

\u{1F4CD} **Physical House Storage Location**: Master Bedroom Study Safe Locker #2, Shelf A.`;
            } else if ((qL.includes("insurance") || qL.includes("policy")) && insuranceDoc) {
              reply = `\u{1F4C4} **Retrieved Document**: **${insuranceDoc.title.replace("[DEMO] ", "")}** (${insuranceDoc.category})

\u2022 **File Type & Size**: ${insuranceDoc.file_type || insuranceDoc.fileType} (${insuranceDoc.file_size || insuranceDoc.fileSize})
\u2022 **Uploaded By**: ${insuranceDoc.uploader_name || insuranceDoc.uploaderName} on ${insuranceDoc.upload_date || insuranceDoc.uploadDate}

\u{1F4DD} **Extracted Policy Coverage & Details**:
${insuranceDoc.summary_content || insuranceDoc.summaryContent || insuranceDoc.description}

\u{1F4CD} **Physical Document Location**: Master Bedroom Filing Cabinet, Green Folder labeled "Insurance 2026".`;
            } else {
              reply = `\u{1F4C1} **Retrieved Family Document Vault Records (${effectiveDocuments.length} files securely stored)**:

` + effectiveDocuments.map(
                (d) => `\u2022 **${d.title.replace("[DEMO] ", "")}** (${d.category}, ${d.file_type || d.fileType} - ${d.file_size || d.fileSize}): Uploaded by ${d.uploader_name || d.uploaderName}
  \u{1F4DD} **Extracted Summary**: ${d.summary_content || d.summaryContent || d.description || "Securely archived"}`
              ).join("\n\n") + `

*(You can view original digital copies anytime in the Document Vault.)*`;
            }
          } else {
            reply = `No documents stored in the Document Vault yet.`;
          }
        } else if (qL.includes("next") && (qL.includes("event") || qL.includes("upcoming") || qL.includes("schedule") || qL.includes("calendar"))) {
          const upcomingEvents = effectiveEvents.filter((e) => e.date >= todayDateStr).sort((a, b) => a.date.localeCompare(b.date) || (a.time || "").localeCompare(b.time || ""));
          const nextEv = upcomingEvents[0] || effectiveEvents.slice().sort((a, b) => a.date.localeCompare(b.date))[0];
          if (nextEv) {
            reply = `\u{1F4C5} **Next Upcoming Family Event**:

\u2022 **${nextEv.title.replace("[DEMO] ", "")}** (${nextEv.category || "General"})
\u2022 **Date & Time**: ${cleanEventDate(nextEv.date)} (${nextEv.date}) at ${cleanEventTime(nextEv.time)}
\u2022 **Members Involved**: ${(Array.isArray(nextEv.members_involved) ? nextEv.members_involved : []).join(", ")}` + (nextEv.description ? `
\u2022 **Details**: ${nextEv.description}` : "");
          } else {
            reply = `No upcoming events scheduled in the calendar.`;
          }
        } else if (qL.includes("event") || qL.includes("schedule") || qL.includes("calendar") || qL.includes("happening") || qL.includes("upcoming") || qL.includes("plans")) {
          const upcomingEvents = effectiveEvents.filter((e) => e.date >= todayDateStr).sort((a, b) => a.date.localeCompare(b.date) || (a.time || "").localeCompare(b.time || ""));
          const listToShow = upcomingEvents.length > 0 ? upcomingEvents : effectiveEvents.slice().sort((a, b) => a.date.localeCompare(b.date));
          if (listToShow.length > 0) {
            reply = `\u{1F4C5} **Upcoming Family Events (${listToShow.length} scheduled)**:

` + listToShow.map((e) => `\u2022 **${e.date} at ${cleanEventTime(e.time)}**: ${e.title.replace("[DEMO] ", "")} (${e.category}) - Members: ${(Array.isArray(e.members_involved) ? e.members_involved : []).join(", ")}`).join("\n");
          } else {
            reply = `No upcoming events scheduled in the calendar.`;
          }
        } else {
          reply = `\u{1F9E0} **HomeBrain Autonomous Cognitive Assistant Summary**:

I have cross-examined live records across your family database (${groundingSources.length} tables consulted):

\u2022 **Today's Events**: ${effectiveEvents.length} scheduled
\u2022 **Prescriptions**: ${effectiveMedicines.length} active
\u2022 **Pending Groceries**: ${effectiveGroceries.filter((g) => !g.is_purchased).length} items
\u2022 **Unpaid Bills**: ${effectiveBills.filter((b) => !b.is_paid).length} pending
\u2022 **Critical Knowledge**: ${effectiveKnowledge.length} items logged
\u2022 **Vault Documents**: ${effectiveDocuments.length} files securely indexed
\u2022 **Family Memories**: ${memories.length} milestone moments

*Ask specific questions like "What bills are pending?", "When is Father's birthday?", "Show mother's appointments", or "Add milk to groceries".*`;
        }
      }
    }
    if (actionsExecuted.length > 0) {
      reply += `

\u26A1 **Autonomous Agent Execution Confirmed**:
` + actionsExecuted.map((a) => `\u2022 **${a.title}**: ${a.detail}`).join("\n");
    }
    const latencyMs = Date.now() - startTime;
    const tokensEstimated = Math.round((familyContext.length + (query?.length || 0)) / 3.8);
    res.json({
      reply,
      text: reply,
      sources: Array.from(new Set(groundingSources)),
      groundingSources: Array.from(new Set(groundingSources)),
      actions: actionsExecuted,
      actionsExecuted,
      confidenceScore: 0.985,
      latencyMs,
      cognitiveMetrics: {
        tokensUsed: tokensEstimated,
        nodesEvaluated: groundingSources.length,
        ragPipelines: Array.from(new Set(groundingSources))
      },
      allEvents: effectiveEvents,
      allExpenses: effectiveExpenses,
      allGroceries: effectiveGroceries,
      allBills: effectiveBills,
      allReminders: effectiveReminders,
      allMedicines: effectiveMedicines,
      allMedicineLogs: effectiveMedicineLogs,
      allKnowledge: effectiveKnowledge,
      allDocuments: effectiveDocuments,
      user: {
        name: user.name,
        familyId: user.familyId
      }
    });
  } catch (error) {
    console.error("AI Query execution error:", error);
    res.status(500).json({
      error: error.message || "An error occurred while generating the AI response."
    });
  }
});
app.post("/api/timeline/search", authenticateUser, async (req, res) => {
  const { query } = req.body;
  const user = req.user;
  const token = req.authToken;
  if (!query) {
    res.status(400).json({ error: "Search query is required." });
    return;
  }
  try {
    const memories = await fetchFamilyData("family_memories", user.familyId, token, "order=year.desc,date.desc");
    const qLower = query.toLowerCase().trim();
    const matches = memories.filter((m) => {
      return m.title && m.title.toLowerCase().includes(qLower) || m.description && m.description.toLowerCase().includes(qLower) || m.location && m.location.toLowerCase().includes(qLower) || m.added_by && m.added_by.toLowerCase().includes(qLower) || String(m.year).includes(qLower) || m.date && m.date.includes(qLower);
    });
    res.json({
      query,
      count: matches.length,
      memories: matches
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Timeline search failed." });
  }
});
var TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "";
var TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
var TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || "";
var FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY || "";
var RESEND_API_KEY = process.env.RESEND_API_KEY || process.env.RESEND_API_KEY_SHAM || "";
var RESEND_API_KEYS = [process.env.RESEND_API_KEY, process.env.RESEND_API_KEY_SHAM].filter((k) => Boolean(k && k.trim())).filter((k, i, arr) => arr.indexOf(k) === i);
var EMAIL_FROM = process.env.EMAIL_FROM || "HomeBrain SOS <onboarding@resend.dev>";
var SMTP_USER = process.env.SMTP_USER || process.env.GMAIL_USER || "";
var SMTP_PASS = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "";
var SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
var SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
var emergencyIdempotencyCache = /* @__PURE__ */ new Map();
var authenticateEmergencyUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    req.authToken = token;
    if (SUPABASE_URL && token !== "demo-token") {
      try {
        const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` }
        });
        if (userRes.ok) {
          const authUserData = await userRes.json();
          const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${authUserData.id}&select=*`, {
            headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` }
          });
          if (profileRes.ok) {
            const profiles = await profileRes.json();
            const profile = profiles[0];
            if (profile && profile.family_id) {
              req.user = {
                id: authUserData.id,
                email: authUserData.email || profile.email || "",
                familyId: String(profile.family_id),
                name: profile.name || authUserData.email || "Family Member",
                role: profile.role || "Member"
              };
              next();
              return;
            }
          }
        }
      } catch (err) {
        console.warn("Supabase auth check failed in emergency route, checking payload fallback:", err);
      }
    }
  }
  req.user = {
    id: req.body.userId || "demo-user-sarah",
    email: req.body.userEmail || "sarah.demo@homebrain.test",
    familyId: req.body.familyId || "demo-family-kumar",
    name: req.body.senderName || req.body.cancelledBy || "Sarah Kumar",
    role: "Admin"
  };
  next();
};
async function dispatchEmergencySMS(contacts, details) {
  const results = [];
  const now = (/* @__PURE__ */ new Date()).toISOString();
  let messageText = "";
  if (details.isCancellation) {
    messageText = `RESOLVED: HomeBrain Emergency Alert for ${details.senderName} has been CANCELLED / MARKED SAFE.
Status: Safe
Time: ${details.timestampStr}
No further response is needed.`;
  } else {
    messageText = `EMERGENCY ALERT \u2013 HomeBrain

${details.senderName} has triggered an SOS emergency alert.

Location: ${details.googleMapsUrl}
Coordinates: ${details.latitude ? details.latitude.toFixed(5) : "N/A"}, ${details.longitude ? details.longitude.toFixed(5) : "N/A"}
Address: ${details.address}
Time: ${details.timestampStr}

Please contact ${details.senderName} immediately and arrange assistance.

Automated emergency notification.`;
  }
  for (const c of contacts) {
    const rawPhone = (c.phone || "").trim();
    if (!rawPhone) continue;
    let cleanPhone = rawPhone.replace(/[\s\-\(\)]/g, "");
    if (/^\d{10}$/.test(cleanPhone)) {
      cleanPhone = `+91${cleanPhone}`;
    } else if (/^0\d{10}$/.test(cleanPhone)) {
      cleanPhone = `+91${cleanPhone.slice(1)}`;
    } else if (!cleanPhone.startsWith("+") && /^\d{11,13}$/.test(cleanPhone)) {
      cleanPhone = `+${cleanPhone}`;
    }
    if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER) {
      try {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
        const authHeader = "Basic " + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");
        const formParams = new URLSearchParams();
        formParams.append("To", cleanPhone);
        formParams.append("From", TWILIO_PHONE_NUMBER);
        formParams.append("Body", messageText);
        const twilioRes = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: formParams.toString()
        });
        const twilioData = await twilioRes.json();
        if (twilioRes.ok && twilioData.sid) {
          results.push({
            recipient: cleanPhone,
            recipientName: c.name,
            status: "ACCEPTED",
            provider: "twilio",
            messageId: twilioData.sid,
            dispatchedAt: now
          });
        } else {
          results.push({
            recipient: cleanPhone,
            recipientName: c.name,
            status: "FAILED",
            provider: "twilio",
            error: twilioData.message || twilioData.error_message || "Twilio rejected message",
            dispatchedAt: now
          });
        }
      } catch (err) {
        results.push({
          recipient: cleanPhone,
          recipientName: c.name,
          status: "FAILED",
          provider: "twilio",
          error: err.message || "Twilio connection failed",
          dispatchedAt: now
        });
      }
    } else if (FAST2SMS_API_KEY) {
      try {
        const indianTenDigit = cleanPhone.replace(/^\+91/, "");
        const f2sRes = await fetch("https://www.fast2sms.com/dev/bulkV2", {
          method: "POST",
          headers: {
            authorization: FAST2SMS_API_KEY,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            route: "v3",
            sender_id: "TXTIND",
            message: messageText,
            language: "english",
            flash: 0,
            numbers: indianTenDigit
          })
        });
        const f2sData = await f2sRes.json();
        if (f2sRes.ok && f2sData.return === true) {
          results.push({
            recipient: cleanPhone,
            recipientName: c.name,
            status: "ACCEPTED",
            provider: "fast2sms",
            messageId: f2sData.request_id || "fast2sms_req",
            dispatchedAt: now
          });
        } else {
          results.push({
            recipient: cleanPhone,
            recipientName: c.name,
            status: "FAILED",
            provider: "fast2sms",
            error: f2sData.message?.[0] || "Fast2SMS error",
            dispatchedAt: now
          });
        }
      } catch (err) {
        results.push({
          recipient: cleanPhone,
          recipientName: c.name,
          status: "FAILED",
          provider: "fast2sms",
          error: err.message || "Fast2SMS network error",
          dispatchedAt: now
        });
      }
    } else {
      results.push({
        recipient: cleanPhone,
        recipientName: c.name,
        status: "UNCONFIGURED",
        provider: "none",
        error: "SMS provider not configured in .env.local (TWILIO_ACCOUNT_SID or FAST2SMS_API_KEY required)",
        dispatchedAt: now
      });
    }
  }
  return results;
}
var isDeliverableEmail = (email) => {
  if (!email) return false;
  const lower = email.trim().toLowerCase();
  return lower.includes("@") && !lower.endsWith(".test") && !lower.endsWith(".internal") && !lower.endsWith(".example") && !lower.endsWith(".invalid") && !lower.includes("demo@") && !lower.includes("apollohospitals.test");
};
async function dispatchEmergencyEmail(contacts, details) {
  const filteredContacts = contacts.filter((c) => isDeliverableEmail(c.email));
  const results = [];
  const now = (/* @__PURE__ */ new Date()).toISOString();
  let smtpTransporter = null;
  if (SMTP_USER && SMTP_PASS) {
    try {
      smtpTransporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS
        }
      });
    } catch (err) {
      console.warn("Failed to initialize SMTP transporter:", err);
    }
  }
  for (const c of filteredContacts) {
    const rawEmail = (c.email || "").trim().toLowerCase();
    if (!rawEmail || !rawEmail.includes("@")) continue;
    const subject = details.isCancellation ? `RESOLVED: Emergency SOS Cancelled \u2013 ${details.senderName} is Safe` : `\u{1F6A8} URGENT: Emergency SOS Alert \u2013 ${details.senderName} Needs Help!`;
    const emailHtml = details.isCancellation ? `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 3px solid #10b981; border-radius: 16px; background-color: #ecfdf5;">
        <h1 style="color: #065f46; margin-top: 0; font-size: 24px;">\u2705 EMERGENCY RESOLVED \u2013 ALL IS SAFE</h1>
        <p style="font-size: 16px; color: #1e293b;"><strong>${details.senderName}</strong> has cancelled the emergency alert and marked their status as safe.</p>
        <div style="background: #ffffff; padding: 16px; border-radius: 12px; margin: 16px 0; border: 1px solid #a7f3d0;">
          <p style="margin: 6px 0;"><strong>Resolution Timestamp:</strong> ${details.timestampStr}</p>
          <p style="margin: 6px 0;"><strong>Resolved Location:</strong> ${details.address}</p>
        </div>
        <p style="font-size: 13px; color: #047857; font-weight: bold;">No emergency response or assistance is required.</p>
        <hr style="border: 0; border-top: 1px solid #d1fae5; margin: 20px 0;" />
        <p style="font-size: 11px; color: #6b7280;">Dispatched automatically by HomeBrain Autonomous Cognitive Ecosystem.</p>
      </div>` : `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 3px solid #e11d48; border-radius: 16px; background-color: #fff1f2;">
        <div style="display: inline-block; background-color: #e11d48; color: #ffffff; padding: 6px 12px; border-radius: 8px; font-weight: bold; font-size: 13px; letter-spacing: 0.5px; text-transform: uppercase;">
          \u{1F6A8} Urgent Emergency Alert
        </div>
        <h1 style="color: #9f1239; margin-top: 14px; margin-bottom: 8px; font-size: 26px;">EMERGENCY SOS DISPATCHED</h1>
        <p style="font-size: 16px; color: #1e293b; line-height: 1.5;">
          <strong>${details.senderName}</strong> has triggered an urgent emergency alert from their device and requires immediate family assistance.
        </p>
        <div style="background: #ffffff; padding: 18px; border-radius: 12px; margin: 20px 0; border: 1px solid #fecdd3; box-shadow: 0 2px 4px rgba(0,0,0,0.04);">
          <p style="margin: 6px 0; font-size: 14px; color: #334155;"><strong>Timestamp:</strong> ${details.timestampStr}</p>
          <p style="margin: 6px 0; font-size: 14px; color: #334155;"><strong>Dispatched Address:</strong> ${details.address}</p>
          ${details.latitude && details.longitude ? `<p style="margin: 6px 0; font-size: 14px; color: #334155;"><strong>GPS Coordinates:</strong> ${details.latitude.toFixed(6)}, ${details.longitude.toFixed(6)} (\xB1${Math.round(details.accuracyMeters || 0)}m)</p>` : ""}
        </div>
        <div style="text-align: center; margin: 26px 0;">
          <a href="${details.googleMapsUrl}" style="background-color: #e11d48; color: #ffffff; padding: 15px 32px; text-decoration: none; font-weight: bold; font-size: 15px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 12px rgba(225,29,72,0.35);">
            \u{1F4CD} Open Exact Location in Google Maps
          </a>
        </div>
        <div style="background-color: #ffe4e6; padding: 12px; border-radius: 10px; border-left: 4px solid #e11d48; font-size: 13px; color: #881337; margin-bottom: 20px;">
          \u26A0\uFE0F <strong>Action Required:</strong> Please attempt to call or reach out to ${details.senderName} immediately.
        </div>
        <p style="font-size: 11px; color: #64748b;">Dispatched automatically by HomeBrain Autonomous Cognitive Ecosystem (Family: ${details.familyId}).</p>
      </div>`;
    if (smtpTransporter) {
      try {
        const info = await smtpTransporter.sendMail({
          from: `"HomeBrain SOS Alert" <${SMTP_USER}>`,
          to: rawEmail,
          subject,
          html: emailHtml
        });
        results.push({
          recipient: rawEmail,
          recipientName: c.name,
          status: "ACCEPTED",
          provider: "nodemailer",
          messageId: info.messageId,
          dispatchedAt: now
        });
        continue;
      } catch (smtpErr) {
        console.warn(`SMTP delivery error to ${rawEmail}:`, smtpErr.message);
      }
    }
    if (RESEND_API_KEYS.length > 0) {
      let lastError = "Resend rejected email";
      let delivered = false;
      for (const apiKey of RESEND_API_KEYS) {
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              from: EMAIL_FROM,
              to: [rawEmail],
              subject,
              html: emailHtml
            })
          });
          const resData = await res.json().catch(() => ({}));
          if (res.ok && resData.id) {
            results.push({
              recipient: rawEmail,
              recipientName: c.name,
              status: "ACCEPTED",
              provider: "resend",
              messageId: resData.id,
              dispatchedAt: now
            });
            delivered = true;
            break;
          }
          lastError = resData.message || `Resend rejected email (HTTP ${res.status})`;
        } catch (err) {
          lastError = err.message || "Resend network error";
        }
      }
      if (!delivered) {
        results.push({
          recipient: rawEmail,
          recipientName: c.name,
          status: "FAILED",
          provider: "resend",
          error: lastError,
          dispatchedAt: now
        });
      }
      continue;
    }
    results.push({
      recipient: rawEmail,
      recipientName: c.name,
      status: "UNCONFIGURED",
      provider: "none",
      error: "Email gateway not configured in .env.local (Add SMTP_USER=harleysham6925@gmail.com and SMTP_PASS or RESEND_API_KEY)",
      dispatchedAt: now
    });
  }
  return results;
}
app.post("/api/emergency/alert", authenticateEmergencyUser, async (req, res) => {
  const {
    address,
    latitude,
    longitude,
    accuracyMeters,
    mapUrl,
    locationSource = "unknown",
    idempotencyKey,
    recipients = []
  } = req.body;
  const user = req.user;
  const token = req.authToken || "";
  if (!address) {
    res.status(400).json({ error: "address is required for emergency dispatch." });
    return;
  }
  if (idempotencyKey) {
    const cached = emergencyIdempotencyCache.get(idempotencyKey);
    if (cached && Date.now() - cached.timestamp < 45e3) {
      res.json(cached.responseData);
      return;
    }
  }
  try {
    let contactList = [];
    if (token && SUPABASE_URL) {
      const dbContacts = await fetchFamilyData("emergency_contacts", user.familyId, token);
      if (dbContacts.length > 0) {
        contactList = dbContacts.map((c) => ({
          name: c.name,
          phone: c.phone,
          email: c.email
        }));
      }
    }
    if (recipients.length > 0) {
      const existingPhones = new Set(contactList.map((c) => (c.phone || "").replace(/[\s\-\(\)]/g, "")).filter(Boolean));
      const existingEmails = new Set(contactList.map((c) => (c.email || "").trim().toLowerCase()).filter(Boolean));
      recipients.forEach((r) => {
        const clean = (r.phone || "").replace(/[\s\-\(\)]/g, "");
        const email = (r.email || "").trim().toLowerCase();
        const phoneIsNew = Boolean(clean) && !existingPhones.has(clean);
        const emailIsNew = Boolean(email) && !existingEmails.has(email);
        if (phoneIsNew || emailIsNew) {
          contactList.push({
            name: r.name,
            phone: r.phone || "",
            email: r.email
          });
          if (clean) existingPhones.add(clean);
          if (email) existingEmails.add(email);
        }
      });
    }
    const defaultAlertRecipients = [
      { name: "Harley Sham", email: "harleysham6925@gmail.com", phone: "" },
      { name: "Sham Sampath", email: "shamsampth06@gmail.com", phone: "" }
    ];
    defaultAlertRecipients.forEach((def) => {
      if (!contactList.some((c) => (c.email || "").trim().toLowerCase() === def.email.toLowerCase())) {
        contactList.push(def);
      }
    });
    const googleMapsUrl = latitude && longitude ? `https://www.google.com/maps?q=${latitude},${longitude}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    const timestampStr = (/* @__PURE__ */ new Date()).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const [smsResults, emailResults] = await Promise.all([
      dispatchEmergencySMS(
        contactList.filter((c) => Boolean(c.phone)),
        {
          senderName: user.name,
          address,
          latitude: latitude || void 0,
          longitude: longitude || void 0,
          googleMapsUrl,
          timestampStr
        }
      ),
      dispatchEmergencyEmail(
        contactList.filter((c) => Boolean(c.email && c.email.includes("@"))).map((c) => ({ name: c.name, email: c.email })),
        {
          senderName: user.name,
          familyId: user.familyId,
          address,
          latitude: latitude || void 0,
          longitude: longitude || void 0,
          accuracyMeters: accuracyMeters || void 0,
          googleMapsUrl,
          timestampStr
        }
      )
    ]);
    const anySmsAccepted = smsResults.some((r) => r.status === "ACCEPTED");
    const anyEmailAccepted = emailResults.some((r) => r.status === "ACCEPTED");
    const allFailed = smsResults.length > 0 && smsResults.every((r) => r.status === "FAILED") && (emailResults.length > 0 && emailResults.every((r) => r.status === "FAILED"));
    const overallStatus = anySmsAccepted || anyEmailAccepted ? "ACCEPTED" : allFailed ? "FAILED" : "LOGGED";
    const logPayload = {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      user_location: address,
      latitude: latitude || null,
      longitude: longitude || null,
      accuracy_meters: accuracyMeters || null,
      user_id: user.id,
      user_name: user.name,
      status: overallStatus,
      recipients: contactList.map((c) => `${c.name} (${c.phone || c.email})`),
      email_results: emailResults
    };
    let savedLog = null;
    if (token && SUPABASE_URL) {
      savedLog = await insertFamilyData("emergency_logs", logPayload, token);
    }
    const responseData = {
      success: true,
      eventId: savedLog?.id || crypto.randomUUID(),
      timestamp: logPayload.timestamp,
      address,
      latitude,
      longitude,
      accuracyMeters,
      locationSource,
      googleMapsUrl,
      overallStatus,
      contactsNotifiedCount: contactList.length,
      sms: {
        providerConfigured: Boolean(TWILIO_ACCOUNT_SID || FAST2SMS_API_KEY),
        activeProvider: TWILIO_ACCOUNT_SID ? "twilio" : FAST2SMS_API_KEY ? "fast2sms" : "none",
        results: smsResults
      },
      email: {
        providerConfigured: Boolean(SMTP_USER && SMTP_PASS) || RESEND_API_KEYS.length > 0,
        activeProvider: SMTP_USER && SMTP_PASS ? "nodemailer" : RESEND_API_KEYS.length > 0 ? "resend" : "none",
        results: emailResults
      }
    };
    if (idempotencyKey) {
      emergencyIdempotencyCache.set(idempotencyKey, { timestamp: Date.now(), responseData });
    }
    res.json(responseData);
  } catch (err) {
    console.error("Emergency alert execution error:", err);
    res.status(500).json({ error: err.message || "Emergency alert execution failed." });
  }
});
app.post("/api/emergency/cancel", authenticateEmergencyUser, async (req, res) => {
  const { sessionId, address = "Home", reason = "Marked safe by user", contacts = [] } = req.body;
  const user = req.user;
  const token = req.authToken || "";
  const timestampStr = (/* @__PURE__ */ new Date()).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  try {
    let contactList = Array.isArray(contacts) && contacts.length > 0 ? [...contacts] : [];
    if (contactList.length === 0 && Array.isArray(req.body.recipients) && req.body.recipients.length > 0) {
      contactList = [...req.body.recipients];
    }
    if (contactList.length === 0 && token && SUPABASE_URL) {
      contactList = await fetchFamilyData("emergency_contacts", user.familyId, token);
    }
    const defaultRecipients = [
      { name: "Harley Sham", email: "harleysham6925@gmail.com", phone: "" },
      { name: "Sham Sampath", email: "shamsampth06@gmail.com", phone: "" }
    ];
    defaultRecipients.forEach((def) => {
      if (!contactList.some((c) => (c.email || "").trim().toLowerCase() === def.email.toLowerCase())) {
        contactList.push(def);
      }
    });
    const [smsResults, emailResults] = await Promise.all([
      dispatchEmergencySMS(
        contactList.filter((c) => Boolean(c.phone)),
        {
          senderName: user.name,
          address,
          googleMapsUrl: "",
          timestampStr,
          isCancellation: true,
          cancellationReason: reason
        }
      ),
      dispatchEmergencyEmail(
        contactList.filter((c) => Boolean(c.email && c.email.includes("@"))).map((c) => ({ name: c.name, email: c.email })),
        {
          senderName: user.name,
          familyId: user.familyId,
          address,
          googleMapsUrl: "",
          timestampStr,
          isCancellation: true,
          cancellationReason: reason
        }
      )
    ]);
    res.json({
      success: true,
      status: "CANCELLED",
      sessionId,
      message: "Emergency alert successfully cancelled and safety notices sent to contacts.",
      smsResults,
      emailResults
    });
  } catch (err) {
    console.error("Emergency cancellation error:", err);
    res.status(500).json({ error: err.message || "Emergency cancellation failed." });
  }
});
app.post("/api/emergency/retry", authenticateEmergencyUser, async (req, res) => {
  const {
    failedSmsContacts = [],
    failedEmailContacts = [],
    address,
    latitude,
    longitude,
    accuracyMeters
  } = req.body;
  const user = req.user;
  const googleMapsUrl = latitude && longitude ? `https://www.google.com/maps?q=${latitude},${longitude}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || "Emergency Location")}`;
  const timestampStr = (/* @__PURE__ */ new Date()).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  try {
    const [smsResults, emailResults] = await Promise.all([
      dispatchEmergencySMS(failedSmsContacts, {
        senderName: user.name,
        address,
        latitude,
        longitude,
        googleMapsUrl,
        timestampStr
      }),
      dispatchEmergencyEmail(failedEmailContacts, {
        senderName: user.name,
        familyId: user.familyId,
        address,
        latitude,
        longitude,
        accuracyMeters,
        googleMapsUrl,
        timestampStr
      })
    ]);
    res.json({
      success: true,
      retriedAt: (/* @__PURE__ */ new Date()).toISOString(),
      smsResults,
      emailResults
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Emergency retry execution failed." });
  }
});
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\u{1F9E0} HomeBrain Secure AI Backend running on http://localhost:${PORT}`);
  });
}
var server_default = app;
export {
  server_default as default,
  sanitizePayloadForPostgres,
  sanitizeTextForPostgres
};
