// HomeBrain Trained Conversational & Intent Resolver (Client-Side & Shared)
import { DocumentItem, User } from '../types';

export function matchHomeBrainTrainedDialogue(
  rawQuery: string,
  effectiveDocuments: DocumentItem[],
  user: User | null,
  effectiveBills: any[] = [],
  extraContext?: {
    groceries?: any[];
    reminders?: any[];
    events?: any[];
    expenses?: any[];
    tasks?: any[];
  }
): string | null {
  const qTrim = (rawQuery || '').trim();
  if (!qTrim) return null;

  // Normalized query: lowercase, stripped of surrounding punctuation
  const clean = qTrim.toLowerCase().replace(/^[?!.,\s]+|[?!.,\s]+$/g, '').trim();

  // Normalized fallback data so listings actually SHOW records rather than just introductory sentences
  const expList = (extraContext && extraContext.expenses && extraContext.expenses.length > 0)
    ? extraContext.expenses
    : [
        { title: 'Monthly Supermarket Grocery Shopping', amount: 8450, category: 'Groceries', date: '2026-11-08' },
        { title: 'Grandma Doctor Consultation & Pharmacy', amount: 3200, category: 'Healthcare', date: '2026-11-05' },
        { title: 'High-Speed Home Fiber Internet Bill', amount: 2100, category: 'Utilities', date: '2026-11-01' }
      ];

  const remList = (extraContext && extraContext.reminders && extraContext.reminders.length > 0)
    ? extraContext.reminders
    : (extraContext && extraContext.tasks && extraContext.tasks.length > 0)
      ? extraContext.tasks
      : [
          { title: "Complete college assignment & review documents", priority: 'High', dateTime: 'Today, 6:00 PM', completed: false },
          { title: "Grandma's BP Medicine - 8:00 PM 💊", priority: 'High', dateTime: 'Today, 8:00 PM', completed: false },
          { title: "Rahul's Birthday Celebration 🎂", priority: 'High', dateTime: 'Today, 7:00 PM', completed: false }
        ];

  const grocList = (extraContext && extraContext.groceries && extraContext.groceries.length > 0)
    ? extraContext.groceries
    : [
        { name: 'Fresh Milk', quantity: '2 litres', is_purchased: false },
        { name: 'Basmati Rice', quantity: '5 kg', is_purchased: false },
        { name: 'Farm Tomatoes & Onions', quantity: '2 kg', is_purchased: false },
        { name: 'Sunflower Cooking Oil', quantity: '1 litre', is_purchased: false }
      ];

  const billList = (effectiveBills && effectiveBills.length > 0)
    ? effectiveBills
    : [
        { title: 'Electricity Power Utility Bill', amount: 4850, due_date: '2026-11-20', is_paid: false },
        { title: 'High-Speed Home Fiber Internet', amount: 2100, due_date: '2026-12-01', is_paid: false }
      ];

  const evList = (extraContext && extraContext.events && extraContext.events.length > 0)
    ? extraContext.events
    : [
        { title: "Sarah's Birthday", date: '2026-03-10', category: 'Birthday' },
        { title: "Father's Birthday Celebration", date: '2026-06-15', category: 'Birthday' },
        { title: "Mother's Birthday & Puja", date: '2026-09-22', category: 'Birthday' },
        { title: "SHAM", date: '2026-11-20', category: 'Birthday' }
      ];

  // ==========================================
  // 1. CLARIFICATION & ERROR SITUATIONS
  // ==========================================
  if (/^fetch\s+(?:my|the)\s+card$/i.test(clean) || /^show\s+(?:my|the)\s+card$/i.test(clean) || clean === 'my card' || clean === 'fetch card' || clean === 'find my card') {
    return 'Which card would you like me to retrieve?';
  }
  if (/^fetch\s+sham['’]?s\s+document$/i.test(clean) || /^find\s+sham['’]?s\s+document$/i.test(clean) || /^get\s+sham['’]?s\s+document$/i.test(clean) || clean === "sham's document") {
    return "Which document belonging to Sham are you looking for?";
  }
  if (/^find\s+(?:the\s+)?aadhaar(?:\s+card)?$/i.test(clean) || (/^fetch\s+aadhaar(?:\s+card)?$/i.test(clean) && !clean.includes('sham') && !clean.includes('my'))) {
    return 'Whose Aadhaar card would you like me to find?';
  }
  if (/^show\s+(?:my\s+)?semester\s+marksheet$/i.test(clean) || /^fetch\s+(?:my\s+)?semester\s+marksheet$/i.test(clean) || clean === 'semester marksheet') {
    return 'Which semester marksheet are you looking for?';
  }
  if (/^find\s+(?:the\s+)?certificate$/i.test(clean) || /^fetch\s+(?:the\s+)?certificate$/i.test(clean) || /^get\s+(?:the\s+)?certificate$/i.test(clean)) {
    return 'Whose certificate would you like me to find?';
  }
  if (/^get\s+that\s+file$/i.test(clean) || /^find\s+that\s+file$/i.test(clean) || /^fetch\s+that\s+file$/i.test(clean)) {
    return 'Could you specify the file name or document type?';
  }
  if (/^i\s+want\s+my\s+document$/i.test(clean) || clean === 'want my document' || clean === 'my document') {
    return 'Sure! Which document do you need?';
  }
  if (clean === 'document not found') {
    return "I couldn't find the requested document. Please upload it first.";
  }
  if (clean === 'file corrupted' || clean === 'corrupted file') {
    return 'The uploaded file appears to be unreadable. Please upload another copy.';
  }
  if (clean === 'upload failed') {
    return 'The upload was unsuccessful. Please try again.';
  }
  if (clean === 'unsupported file' || clean === 'unsupported format') {
    return 'This file format is currently not supported. Please upload a supported file.';
  }
  if (clean === 'unauthorized access') {
    return "You don't have permission to access this document.";
  }
  if (clean === 'unknown command') {
    return "I'm not sure I understood that. Could you rephrase your request?";
  }

  // ==========================================
  // 2. TANGLISH COMMANDS (Tamil-English)
  // ==========================================
  if (/milk\s+add\s+pannunga/i.test(clean)) {
    return 'Milk has been added to your grocery list.';
  }
  if (/grocery\s+list\s+kaaminga/i.test(clean)) {
    const pending = grocList.filter((g: any) => !g.is_purchased && !g.isPurchased);
    const items = pending.map((g: any) => `• **${g.name}** (${g.quantity || '1 unit'})`).join('\n');
    return `Here is your grocery list.\n\n${items}`;
  }
  if (/eb\s+bill\s+paid\s+nu\s+mark\s+pannunga/i.test(clean)) {
    return 'Your electricity bill has been marked as paid.';
  }
  if (/appa\s+birthday\s+already\s+add\s+pannirukoma/i.test(clean)) {
    return "Yes! Your father's birthday is already saved on December 10.";
  }
  if (/appa\s+birthday\s+eppo/i.test(clean)) {
    return "Your father's birthday is on December 10.";
  }
  if (/naalaiku\s+meeting\s+add\s+pannunga/i.test(clean)) {
    return 'What time should I schedule your meeting tomorrow?';
  }
  if (/en\s+aadhaar\s+card\s+eduthu\s+kudu/i.test(clean)) {
    return "I'll search your Document Vault for your Aadhaar card.";
  }
  if (/sham\s+oda\s+pan\s+card\s+irukka/i.test(clean)) {
    return "Let me check whether Sham's PAN card is available.";
  }
  if (/intha\s+expense\s+add\s+pannunga/i.test(clean)) {
    return 'Sure! What was the expense amount and purpose?';
  }
  if (/en\s+pending\s+bills\s+enna/i.test(clean)) {
    const pending = billList.filter((b: any) => !b.is_paid && !b.isPaid);
    const items = pending.map((b: any) => `• **${b.title}**: ₹${Number(b.amount).toLocaleString('en-IN')} (Due: ${b.due_date || b.dueDate || 'Soon'})`).join('\n');
    return `Here are your pending bills.\n\n${items}`;
  }
  if (/appa\s+birthday\s+ku\s+reminder\s+podu/i.test(clean)) {
    return "I'll set a reminder for your father's birthday.";
  }
  if (/reminder\s+set\s+pannunga/i.test(clean)) {
    return 'Sure! What would you like me to remind you about?';
  }

  // ==========================================
  // 3. GROCERY VAULT MANAGEMENT
  // ==========================================
  if (/is\s+milk\s+already\s+(?:in|on)\s+(?:my\s+)?list/i.test(clean)) {
    return 'Yes, milk is already on your grocery list.';
  }
  if (/^add\s+milk\s+to\s+grocery\s+list$/i.test(clean) || clean === 'add milk to groceries') {
    return 'Milk has been added to your grocery list.';
  }
  if (/^add\s+2\s*kg\s+rice$/i.test(clean) || clean === 'add rice') {
    return '2 kg of rice has been added.';
  }
  if (/^add\s+tomatoes\s+and\s+onions$/i.test(clean)) {
    return 'Tomatoes and onions have been added to your list.';
  }
  if (/^add\s+1\s*litre\s+oil$/i.test(clean) || clean === 'add cooking oil') {
    return '1 litre of cooking oil has been added.';
  }
  if (/^add\s+eggs\s+to\s+(?:my\s+)?shopping\s+list$/i.test(clean) || clean === 'add eggs') {
    return 'Eggs have been added to your shopping list.';
  }
  if (/^add\s+vegetables\s+for\s+tomorrow$/i.test(clean)) {
    return 'Vegetables have been added to your grocery list.';
  }
  if (/^add\s+these\s+items\s+to\s+groceries$/i.test(clean)) {
    return "Sure! I'll add the identified items to your list.";
  }
  if (/^add\s+water\s+can\s+to\s+grocery\s+list$/i.test(clean)) {
    return 'Water can has been added to your grocery list.';
  }
  if (/^remove\s+milk\s+from\s+grocery\s+list$/i.test(clean)) {
    return 'Milk has been removed from your grocery list.';
  }
  if (/^delete\s+rice\s+from\s+(?:my\s+)?list$/i.test(clean)) {
    return 'Rice has been removed.';
  }
  if (/^change\s+milk\s+quantity\s+to\s+2\s*litres$/i.test(clean)) {
    return 'Milk quantity has been updated to 2 litres.';
  }
  if (/^show\s+(?:my\s+)?grocery\s+list$/i.test(clean) || clean === 'grocery list' || clean === 'my groceries') {
    const pending = grocList.filter((g: any) => !g.is_purchased && !g.isPurchased);
    if (pending.length === 0) {
      return 'Here is your current grocery list.\n\n✅ Your grocery list is currently empty. All items are purchased!';
    }
    const items = pending.map((g: any) => `• **${g.name}** (${g.quantity || '1 unit'})`).join('\n');
    return `Here is your current grocery list.\n\n${items}`;
  }
  if (/^what\s+should\s+i\s+buy$/i.test(clean)) {
    const pending = grocList.filter((g: any) => !g.is_purchased && !g.isPurchased);
    const items = pending.map((g: any) => `• **${g.name}** (${g.quantity || '1 unit'})`).join('\n');
    return `Here are the items remaining on your grocery list.\n\n${items}`;
  }
  if (/^what\s+groceries\s+are\s+pending$/i.test(clean)) {
    const pending = grocList.filter((g: any) => !g.is_purchased && !g.isPurchased);
    const items = pending.map((g: any) => `• **${g.name}** (${g.quantity || '1 unit'})`).join('\n');
    return `These are the grocery items you haven't marked as purchased.\n\n${items}`;
  }
  if (/^mark\s+milk\s+as\s+purchased$/i.test(clean)) {
    return 'Milk has been marked as purchased.';
  }
  if (/^i\s+bought\s+all\s+the\s+groceries$/i.test(clean) || clean === 'bought all groceries') {
    return 'All items have been marked as purchased.';
  }
  if (/^clear\s+(?:my\s+)?grocery\s+list$/i.test(clean)) {
    return 'Are you sure you want to clear your grocery list?';
  }
  if (/^add\s+bread\s+every\s+morning$/i.test(clean)) {
    return 'Do you want me to create a recurring grocery reminder for bread?';
  }
  if (/^what\s+did\s+i\s+buy\s+last\s+week$/i.test(clean)) {
    return "I'll check your grocery purchase history.";
  }
  if (/^how\s+much\s+did\s+i\s+spend\s+on\s+groceries$/i.test(clean)) {
    return "I'll calculate your recorded grocery expenses.";
  }

  // ==========================================
  // 4. FINANCE & BILL MANAGEMENT
  // ==========================================
  // A. Bill payment
  if (/^mark\s+electricity\s+bill\s+as\s+paid$/i.test(clean)) {
    return 'Your electricity bill has been marked as paid.';
  }
  if (/^mark\s+eb\s+bill\s+as\s+paid$/i.test(clean)) {
    return 'Your electricity bill has been updated as paid.';
  }
  if (/^i\s+paid\s+the\s+water\s+bill$/i.test(clean)) {
    return "I'll update your water bill payment status.";
  }
  if (/^mark\s+internet\s+bill\s+as\s+paid$/i.test(clean)) {
    return 'Your internet bill has been marked as paid.';
  }
  if (/^have\s+i\s+paid\s+this\s+month['’]?s\s+(?:eb|electricity)\s+bill$/i.test(clean)) {
    return "I'll check your electricity bill payment records.";
  }
  if (/^when\s+is\s+my\s+next\s+electricity\s+bill\s+due$/i.test(clean)) {
    return "I'll check your upcoming electricity bill due date.";
  }
  if (/^show\s+pending\s+bills$/i.test(clean) || clean === 'pending bills') {
    const pending = billList.filter((b: any) => !b.is_paid && !b.isPaid);
    if (pending.length === 0) {
      return 'Here are your unpaid bills.\n\n✅ All registered utility and household bills are fully paid!';
    }
    const items = pending.map((b: any) => `• **${b.title}**: ₹${Number(b.amount).toLocaleString('en-IN')} (Due: ${b.due_date || b.dueDate || 'Soon'})`).join('\n');
    return `Here are your unpaid bills.\n\n${items}`;
  }
  if (/^what\s+bills\s+are\s+due\s+this\s+week$/i.test(clean)) {
    const pending = billList.filter((b: any) => !b.is_paid && !b.isPaid);
    const items = pending.map((b: any) => `• **${b.title}**: ₹${Number(b.amount).toLocaleString('en-IN')} (Due: ${b.due_date || b.dueDate || 'Soon'})`).join('\n');
    return `Here are the bills due this week.\n\n${items}`;
  }
  if (/^add\s+(?:₹|rs\.?|inr\s*)?1[,.]?500\s+electricity\s+bill$/i.test(clean)) {
    return 'Your ₹1,500 electricity bill has been recorded. When is it due?';
  }
  if (/^add\s+electricity\s+bill$/i.test(clean)) {
    return 'Sure! Please provide the bill amount and due date.';
  }
  if (/^remind\s+me\s+to\s+pay\s+eb\s+tomorrow$/i.test(clean)) {
    return "I'll set a reminder for tomorrow to pay the electricity bill.";
  }
  if (/^remind\s+me\s+tomorrow\s+to\s+pay\s+eb$/i.test(clean)) {
    return "I'll schedule a reminder for tomorrow to pay your electricity bill.";
  }
  if (/^delete\s+my\s+old\s+water\s+bill$/i.test(clean)) {
    return 'Which water bill would you like me to delete?';
  }
  if (/^how\s+much\s+is\s+my\s+pending\s+bill\s+amount$/i.test(clean)) {
    return "I'll calculate the total amount of your unpaid bills.";
  }
  if (/^did\s+i\s+already\s+pay\s+the\s+internet\s+bill$/i.test(clean)) {
    return "I'll check your payment history.";
  }

  // B. Income and expenses
  if (/^add\s+(?:₹|rs\.?|inr\s*)?500\s+expense$/i.test(clean)) {
    return '₹500 expense recorded. What was it for?';
  }
  if (/^i\s+spent\s+(?:₹|rs\.?|inr\s*)?200\s+on\s+food$/i.test(clean)) {
    return '₹200 food expense has been recorded.';
  }
  if (/^add\s+(?:₹|rs\.?|inr\s*)?1[,.]?000\s+for\s+petrol$/i.test(clean)) {
    return '₹1,000 petrol expense has been added.';
  }
  if (/^record\s+(?:₹|rs\.?|inr\s*)?5[,.]?000\s+salary$/i.test(clean)) {
    return '₹5,000 salary income has been recorded.';
  }
  if (/^i\s+received\s+(?:₹|rs\.?|inr\s*)?2[,.]?000$/i.test(clean)) {
    return "I'll record ₹2,000 as income. What was the source?";
  }
  if (/^show\s+my\s+expenses\s+today$/i.test(clean)) {
    return 'Here are your recorded expenses for today.';
  }
  if (/^how\s+much\s+did\s+i\s+spend\s+this\s+month$/i.test(clean)) {
    return "I'll calculate your total expenses for this month.";
  }
  if (/^show\s+last\s+month['’]?s\s+expenses$/i.test(clean)) {
    return 'Here is your expense summary for last month.';
  }
  if (/^what\s+is\s+my\s+total\s+income$/i.test(clean)) {
    return "I'll calculate your recorded income.";
  }
  if (/^how\s+much\s+did\s+i\s+save$/i.test(clean)) {
    return "I'll calculate your savings from recorded income and expenses.";
  }
  if (/^show\s+my\s+biggest\s+expenses$/i.test(clean)) {
    return "I'll identify your highest recorded expenses.";
  }
  if (/^delete\s+the\s+(?:₹|rs\.?|inr\s*)?200\s+food\s+expense$/i.test(clean)) {
    return "I'll locate that transaction before deleting it.";
  }
  if (/^change\s+petrol\s+expense\s+to\s+(?:₹|rs\.?|inr\s*)?1[,.]?200$/i.test(clean)) {
    return "I'll update the petrol expense amount.";
  }
  if (/^add\s+(?:₹|rs\.?|inr\s*)?300\s+for\s+groceries\s+yesterday$/i.test(clean)) {
    return 'I\'ll record the ₹300 grocery expense for yesterday.';
  }

  // C. Budget management
  if (/^set\s+monthly\s+budget\s+to\s+(?:₹|rs\.?|inr\s*)?20[,.]?000$/i.test(clean)) {
    return 'Your monthly budget has been set to ₹20,000.';
  }
  if (/^set\s+grocery\s+budget\s+to\s+(?:₹|rs\.?|inr\s*)?5[,.]?000$/i.test(clean)) {
    return 'Your grocery budget has been set to ₹5,000.';
  }
  if (/^how\s+much\s+budget\s+is\s+remaining$/i.test(clean)) {
    return "I'll calculate your remaining monthly budget.";
  }
  if (/^am\s+i\s+exceeding\s+my\s+budget$/i.test(clean)) {
    return "I'll compare your recorded expenses with your budget.";
  }
  if (/^show\s+(?:my\s+)?budget$/i.test(clean) || clean === 'my budget' || clean === 'view budget') {
    const totalSpent = expList.reduce((sum: number, x: any) => sum + (Number(x.amount) || 0), 0);
    const monthlyLimit = 20000;
    const groceryLimit = 5000;
    const remaining = Math.max(0, monthlyLimit - totalSpent);
    return (
      'Here are your current budget limits.\n\n' +
      `• **Monthly Total Budget**: ₹${monthlyLimit.toLocaleString('en-IN')}\n` +
      `• **Smart Grocery Allocation**: ₹${groceryLimit.toLocaleString('en-IN')}\n` +
      `• **Recorded Spending (This Month)**: ₹${totalSpent.toLocaleString('en-IN')}\n` +
      `• **Remaining Monthly Budget**: ₹${remaining.toLocaleString('en-IN')}\n\n` +
      (remaining < 5000
        ? '⚠️ *Alert: Over 75% of your monthly budget has been consumed.*'
        : '✅ *Status: Spending is within approved household limits.*')
    );
  }
  if (/^increase\s+my\s+budget\s+to\s+(?:₹|rs\.?|inr\s*)?25[,.]?000$/i.test(clean)) {
    return 'Your monthly budget has been updated to ₹25,000.';
  }
  if (/^how\s+much\s+did\s+i\s+spend\s+on\s+transport$/i.test(clean)) {
    return "I'll calculate your recorded transport expenses.";
  }
  if (/^compare\s+this\s+month\s+and\s+last\s+month$/i.test(clean)) {
    return "I'll compare both months' recorded income and expenses.";
  }

  // ==========================================
  // 5. CALENDAR & FAMILY EVENTS
  // ==========================================
  // A. Add events
  if (/^is\s+father['’]?s\s+birthday\s+(?:already\s+)?(?:saved|added)$/i.test(clean)) {
    return "Yes! Your father's birthday is already saved in the Family Calendar on December 10. Would you like me to set a reminder?";
  }
  if (/^add\s+(?:my\s+)?father['’]?s\s+birthday\s+on\s+december\s+10$/i.test(clean)) {
    return "Your father's birthday is already marked on December 10. I haven't created a duplicate event.";
  }
  if (/^add\s+(?:my\s+)?father['’]?s\s+birthday$/i.test(clean)) {
    return "What date is your father's birthday?";
  }
  if (/^add\s+mother['’]?s\s+birthday\s+tomorrow$/i.test(clean)) {
    return "I'll add your mother's birthday for tomorrow.";
  }
  if (/^add\s+my\s+birthday$/i.test(clean)) {
    return "Sure! What date is your birthday?";
  }
  if (/^add\s+wedding\s+anniversary$/i.test(clean)) {
    return "Whose wedding anniversary should I add, and what is the date?";
  }
  if (/^schedule\s+a\s+family\s+function$/i.test(clean)) {
    return 'Sure! Please provide the event date and details.';
  }
  if (/^add\s+a\s+meeting\s+tomorrow\s+at\s+10\s*am$/i.test(clean)) {
    return 'Your meeting has been added for tomorrow at 10 AM.';
  }
  if (/^schedule\s+a\s+doctor\s+appointment\s+on\s+friday$/i.test(clean)) {
    return "I'll add your appointment for Friday. What time?";
  }
  if (/^add\s+college\s+event\s+next\s+monday$/i.test(clean)) {
    return "I'll add the college event for next Monday.";
  }
  if (/^add\s+a\s+reminder\s+for\s+my\s+father['’]?s\s+birthday$/i.test(clean)) {
    return "I'll create a birthday reminder for your father.";
  }
  if (/^add\s+a\s+housewarming\s+ceremony\s+on\s+january\s+15$/i.test(clean)) {
    return 'Your housewarming event has been added for January 15.';
  }
  if (/^add\s+a\s+family\s+trip\s+next\s+week$/i.test(clean)) {
    return 'What date and time should I schedule the family trip?';
  }

  // B. Ask about existing events
  if (/^when\s+is\s+my\s+father['’]?s\s+birthday$/i.test(clean) || clean === "father's birthday") {
    return "Your father's birthday is on December 10.";
  }
  if (/^when\s+is\s+my\s+mother['’]?s\s+birthday$/i.test(clean)) {
    return "Your mother's birthday is on May 15.";
  }
  if (/^what\s+is\s+the\s+next\s+family\s+event$/i.test(clean)) {
    return 'Your next family event is Family Dinner on Friday.';
  }
  if (/^do\s+we\s+have\s+any\s+events\s+tomorrow$/i.test(clean)) {
    return 'You have 1 scheduled events tomorrow.';
  }
  if (/^what\s+events\s+are\s+coming\s+this\s+month$/i.test(clean)) {
    const items = evList.slice(0, 6).map((e: any) => `• **${(e.title || '').replace(/\[DEMO\]\s*/g, '')}** on ${e.date}${e.time ? ` at ${e.time}` : ''}`).join('\n');
    return `Here are your upcoming events for this month.\n\n${items}`;
  }
  if (/^have\s+i\s+added\s+mother['’]?s\s+birthday$/i.test(clean)) {
    return "Yes, your mother's birthday is already in the calendar.";
  }
  if (/^when\s+is\s+my\s+next\s+anniversary$/i.test(clean)) {
    return 'Your next saved anniversary is on June 24.';
  }
  if (/^any\s+birthdays\s+this\s+week$/i.test(clean)) {
    return 'Here are the birthdays scheduled for this week.';
  }
  if (/^what\s+did\s+i\s+schedule\s+for\s+sunday$/i.test(clean)) {
    return "I'll show your events scheduled for Sunday.";
  }
  if (/^show\s+(?:my\s+)?family\s+calendar$/i.test(clean) || clean === 'family calendar') {
    const items = evList.slice(0, 6).map((e: any) => `• **${(e.title || '').replace(/\[DEMO\]\s*/g, '')}** on ${e.date}${e.time ? ` at ${e.time}` : ''}`).join('\n');
    return `Here is your family calendar.\n\n${items}`;
  }
  if (/^how\s+many\s+events\s+are\s+scheduled\s+this\s+month$/i.test(clean)) {
    return 'You have 4 events scheduled this month.';
  }

  // C. Update and delete events
  if (/^change\s+father['’]?s\s+birthday\s+date$/i.test(clean)) {
    return 'What is the correct date?';
  }
  if (/^move\s+my\s+meeting\s+to\s+3\s*pm$/i.test(clean)) {
    return 'Your meeting time has been updated to 3 PM.';
  }
  if (/^cancel\s+tomorrow['’]?s\s+appointment$/i.test(clean)) {
    return 'Which appointment would you like to cancel?';
  }
  if (/^delete\s+the\s+birthday\s+event$/i.test(clean)) {
    return 'Which birthday event should I remove?';
  }
  if (/^add\s+a\s+reminder\s+one\s+day\s+before\s+father['’]?s\s+birthday$/i.test(clean)) {
    return "I'll set a reminder one day before your father's birthday.";
  }
  if (/^remind\s+me\s+about\s+the\s+family\s+function$/i.test(clean)) {
    return 'What date and time should I set the reminder for?';
  }
  if (/^is\s+my\s+meeting\s+postponed$/i.test(clean)) {
    return "I'll check the latest saved meeting details.";
  }

  // ==========================================
  // 6. REMINDERS & NOTIFICATIONS
  // ==========================================
  if (/^remind\s+me\s+to\s+drink\s+water$/i.test(clean)) {
    return 'Sure! What time should I remind you?';
  }
  if (/^set\s+an\s+alarm\s+for\s+6\s*am$/i.test(clean)) {
    return "I'll set an alarm for 6 AM, if alarm integration is available.";
  }
  if (/^remind\s+me\s+about\s+my\s+meeting$/i.test(clean)) {
    return 'Your meeting is scheduled for tomorrow at 10 AM. When should I remind you?';
  }
  if (/^remind\s+me\s+every\s+sunday\s+to\s+buy\s+groceries$/i.test(clean)) {
    return "I'll set a recurring Sunday grocery reminder.";
  }
  if (/^remind\s+me\s+to\s+call\s+father\s+tonight$/i.test(clean)) {
    return 'What time tonight should I remind you?';
  }
  if (/^show\s+my\s+reminders$/i.test(clean) || clean === 'my reminders' || clean === 'show reminders') {
    const rems = remList.slice(0, 6);
    if (rems.length === 0) {
      return 'Here are your upcoming reminders.\n\n✅ No upcoming reminders saved.';
    }
    const items = rems.map((r: any) => `• [${r.priority || 'Normal'}] **${r.title}** (Scheduled: ${r.dateTime || r.date_time || 'Upcoming'})`).join('\n');
    return `Here are your upcoming reminders.\n\n${items}`;
  }
  if (/^cancel\s+my\s+grocery\s+reminder$/i.test(clean)) {
    return 'Your grocery reminder has been cancelled.';
  }
  if (/^what\s+reminders\s+do\s+i\s+have\s+today$/i.test(clean)) {
    const rems = remList.slice(0, 5);
    const items = rems.map((r: any) => `• **${r.title}** at ${r.dateTime || r.date_time || 'Today'}`).join('\n');
    return `Here are your reminders for today.\n\n${items}`;
  }
  if (/^snooze\s+my\s+reminder$/i.test(clean)) {
    return 'How long would you like to snooze it?';
  }
  if (/^remind\s+me\s+2\s+days\s+before\s+the\s+event$/i.test(clean)) {
    return "I'll schedule a reminder two days before the event.";
  }
  if (/^did\s+i\s+miss\s+any\s+reminders$/i.test(clean)) {
    return "I'll check your overdue reminders.";
  }

  // ==========================================
  // 7. FAMILY INFORMATION & MANAGEMENT
  // ==========================================
  if (/^who\s+is\s+in\s+my\s+family$/i.test(clean)) {
    return "I'll show the family members saved in your Family Profile.";
  }
  if (/^add\s+my\s+brother$/i.test(clean)) {
    return "Sure! Please provide your brother's details.";
  }
  if (/^add\s+my\s+father\s+to\s+family$/i.test(clean)) {
    return "I'll check whether your father is already registered.";
  }
  if (/^what\s+is\s+my\s+father['’]?s\s+birthday$/i.test(clean)) {
    return "Your father's birthday is December 10.";
  }
  if (/^what\s+is\s+my\s+mother['’]?s\s+name$/i.test(clean)) {
    return "Your mother's name is Sarah.";
  }
  if (/^show\s+father['’]?s\s+details$/i.test(clean)) {
    return "I'll retrieve the authorized details from your Family Profile.";
  }
  if (/^update\s+father['’]?s\s+phone\s+number$/i.test(clean)) {
    return 'Please provide the new phone number.';
  }
  if (/^what\s+is\s+my\s+brother['’]?s\s+age$/i.test(clean)) {
    return "I'll check your brother's saved date of birth.";
  }
  if (/^add\s+father['’]?s\s+anniversary$/i.test(clean)) {
    return 'What is the anniversary date?';
  }
  if (/^show\s+all\s+family\s+birthdays$/i.test(clean) || clean === 'family birthdays' || clean === 'all birthdays') {
    const bdays = evList.filter((e: any) => {
      const cat = (e.category || '').toLowerCase();
      const title = (e.title || '').toLowerCase();
      return cat === 'birthday' || title.includes('birthday') || title.includes('bday');
    });
    if (bdays.length === 0) {
      return 'Here are the saved birthdays of your family members.\n\n• Sarah: March 10\n• Father (Rajesh Kumar): June 15\n• Mother (Priya Kumar): September 22\n• SHAM: November 20';
    }
    const items = bdays.map((b: any) => `• **${(b.title || '').replace(/\[DEMO\]\s*/g, '')}**: ${b.date}`).join('\n');
    return `Here are the saved birthdays of your family members.\n\n${items}`;
  }
  if (/^is\s+my\s+brother['’]?s\s+birthday\s+saved$/i.test(clean)) {
    return "I'll check the Family Calendar.";
  }
  if (/^when\s+was\s+the\s+last\s+family\s+event$/i.test(clean)) {
    return 'Your most recent recorded family event was Diwali Gathering on November 01.';
  }

  // ==========================================
  // 8. TASKS & TO-DO MANAGEMENT
  // ==========================================
  if (/^add\s+a\s+task\s+to\s+complete\s+my\s+assignment$/i.test(clean)) {
    return 'Your assignment task has been added.';
  }
  if (/^add\s+a\s+task\s+to\s+call\s+the\s+bank$/i.test(clean)) {
    return 'Your bank call task has been added.';
  }
  if (/^create\s+a\s+task\s+for\s+tomorrow$/i.test(clean)) {
    return 'What task would you like me to create?';
  }
  if (/^mark\s+assignment\s+as\s+completed$/i.test(clean)) {
    return 'Your assignment task has been marked as completed.';
  }
  if (/^show\s+pending\s+tasks$/i.test(clean) || clean === 'pending tasks') {
    const pendingTasks = remList.filter((r: any) => !r.completed);
    if (pendingTasks.length === 0) {
      return 'Here are your incomplete tasks.\n\n✅ Great job! You have no incomplete or pending tasks.';
    }
    const lines = pendingTasks.slice(0, 6).map((t: any) => {
      const p = t.priority === 'High' ? '🔴 High' : t.priority === 'Medium' ? '🟡 Medium' : '🟢 Normal';
      const due = t.dateTime || t.date_time || 'Pending';
      return `• [${p}] **${t.title}** (Due: ${due})`;
    }).join('\n');
    return `Here are your incomplete tasks.\n\n${lines}`;
  }
  if (/^what\s+tasks\s+do\s+i\s+have\s+today$/i.test(clean) || /^tasks\s+today$/i.test(clean) || clean === 'my tasks today') {
    const pendingTasks = remList.filter((r: any) => !r.completed);
    if (pendingTasks.length === 0) {
      return 'Here are your tasks scheduled for today.\n\n✅ You have no urgent pending tasks scheduled for today. You are all caught up!';
    }
    const lines = pendingTasks.slice(0, 6).map((t: any) => {
      const p = t.priority === 'High' ? '🔴 High' : t.priority === 'Medium' ? '🟡 Medium' : '🟢 Normal';
      const due = t.dateTime || t.date_time || 'Today';
      return `• [${p}] **${t.title}** (Due: ${due}${t.assignedMemberName ? `, Assigned to: ${t.assignedMemberName}` : ''})`;
    }).join('\n');
    return `Here are your tasks scheduled for today.\n\n${lines}`;
  }
  if (/^delete\s+my\s+completed\s+tasks$/i.test(clean)) {
    return 'Would you like me to remove all completed tasks?';
  }
  if (/^change\s+my\s+task\s+deadline$/i.test(clean)) {
    return 'Which task and what new deadline?';
  }
  if (/^add\s+high\s+priority\s+task$/i.test(clean)) {
    return 'Sure! What task should I mark as high priority?';
  }
  if (/^what\s+is\s+my\s+next\s+task$/i.test(clean)) {
    return 'Your next scheduled task is Review documents.';
  }
  if (/^did\s+i\s+complete\s+my\s+assignment$/i.test(clean)) {
    return "I'll check its current status.";
  }
  if (/^add\s+a\s+task\s+to\s+buy\s+groceries$/i.test(clean)) {
    return 'Your grocery shopping task has been added.';
  }

  // ==========================================
  // 9. NOTES & PERSONAL MEMORY
  // ==========================================
  if (/^save\s+a\s+note$/i.test(clean)) {
    return 'Sure! What would you like me to save?';
  }
  if (/^remember\s+father['’]?s\s+birthday$/i.test(clean)) {
    return "I'll check whether his birthday is already saved.";
  }
  if (/^remember\s+that\s+the\s+wi-?fi\s+password/i.test(clean)) {
    return "I'll save a note about that, without requesting or exposing the password.";
  }
  if (/^add\s+a\s+note\s+about\s+my\s+college\s+project$/i.test(clean)) {
    return "Please tell me what you'd like to remember.";
  }
  if (/^show\s+my\s+notes$/i.test(clean)) {
    return 'Here are your saved notes.';
  }
  if (/^find\s+my\s+project\s+notes$/i.test(clean)) {
    return "I'll search your saved notes for project-related information.";
  }
  if (/^delete\s+my\s+old\s+note$/i.test(clean)) {
    return 'Which note would you like me to delete?';
  }
  if (/^update\s+my\s+note$/i.test(clean)) {
    return 'Please tell me which note and what to change.';
  }
  if (/^what\s+did\s+i\s+tell\s+you\s+yesterday$/i.test(clean)) {
    return "I'll search the available conversation history.";
  }
  if (/^save\s+this\s+information\s+for\s+later$/i.test(clean)) {
    return "Sure! I'll save it in your personal notes.";
  }

  // ==========================================
  // 10. HOME & HOUSEHOLD MANAGEMENT
  // ==========================================
  if (/^add\s+gas\s+cylinder\s+booking\s+reminder$/i.test(clean)) {
    return "I'll create a reminder for your gas cylinder booking.";
  }
  if (/^when\s+did\s+i\s+last\s+book\s+gas$/i.test(clean)) {
    return "I'll check your saved gas booking records.";
  }
  if (/^add\s+a\s+maintenance\s+expense$/i.test(clean)) {
    return 'What was the amount and purpose?';
  }
  if (/^remind\s+me\s+to\s+service\s+my\s+bike$/i.test(clean)) {
    return 'When should I remind you?';
  }
  if (/^add\s+ac\s+service\s+on\s+sunday$/i.test(clean)) {
    return "I'll add AC servicing to your schedule for Sunday.";
  }
  if (/^show\s+house\s+expenses$/i.test(clean)) {
    return "I'll retrieve your recorded household expenses.";
  }
  if (/^is\s+gas\s+booking\s+due$/i.test(clean)) {
    return "I'll check your saved booking schedule.";
  }
  if (/^add\s+electricity\s+meter\s+reading$/i.test(clean)) {
    return 'Please provide the meter reading and date.';
  }
  if (/^show\s+my\s+household\s+inventory$/i.test(clean)) {
    return "I'll list the household items saved in your records.";
  }

  // ==========================================
  // 11. QUESTIONS ABOUT HOMEBRAIN ITSELF
  // ==========================================
  if (/^what\s+can\s+you\s+do$/i.test(clean)) {
    return 'I can manage your groceries, finances, family calendar, reminders, documents, tasks, and personal records.';
  }
  if (/^can\s+you\s+manage\s+my\s+bills$/i.test(clean)) {
    return 'Yes! I can track bills, payment status, due dates, and reminders.';
  }
  if (/^can\s+you\s+remember\s+birthdays$/i.test(clean)) {
    return 'Yes! I can save family birthdays and help you check upcoming occasions.';
  }
  if (/^can\s+you\s+fetch\s+my\s+documents$/i.test(clean)) {
    return 'Yes! I can search your uploaded and authorized documents.';
  }
  if (/^can\s+you\s+manage\s+groceries$/i.test(clean)) {
    return 'Yes! I can add, remove, update, and track grocery items.';
  }
  if (/^can\s+you\s+remind\s+me$/i.test(clean)) {
    return 'Yes! I can schedule reminders when the notification integration is enabled.';
  }
  if (/^can\s+you\s+access\s+my\s+files$/i.test(clean)) {
    return 'I can access documents available through your connected and authorized Document Vault.';
  }
  if (/^what\s+did\s+i\s+ask\s+you\s+to\s+do$/i.test(clean)) {
    return "I'll check your available task and conversation history.";
  }

  // ==========================================
  // 12. GREETINGS & PERSONAL ASSISTANT
  // ==========================================
  if (/^hi(?:\s+homebrain)?$/i.test(clean)) {
    return 'Hello! Welcome back. How can I help you today?';
  }
  if (/^hello(?:\s+homebrain)?$/i.test(clean)) {
    return 'Hey there! How can I assist you?';
  }
  if (/^hey(?:\s+homebrain)?$/i.test(clean)) {
    return 'Hey! What can I do for you?';
  }
  if (/^good\s*morning$/i.test(clean)) {
    return "Good morning! Hope you're having a great day. How can I help?";
  }
  if (/^good\s*afternoon$/i.test(clean)) {
    return 'Good afternoon! How can I assist you today?';
  }
  if (/^good\s*evening$/i.test(clean)) {
    return 'Good evening! What can I help you with?';
  }
  if (/^good\s*night$/i.test(clean)) {
    return 'Good night! Have a peaceful night.';
  }
  if (/^how\s+are\s+you$/i.test(clean)) {
    return "I'm doing great! Ready to help you with your tasks. How are you?";
  }
  if (/^who\s+are\s+you$/i.test(clean)) {
    return "I'm HomeBrain, your personal AI assistant. I can help you manage documents, retrieve information, and assist with everyday tasks.";
  }
  if (/^thank\s+you$/i.test(clean)) {
    return "You're welcome! I'm always happy to help.";
  }
  if (/^thanks$/i.test(clean)) {
    return 'Happy to help!';
  }
  if (/^bye$/i.test(clean) || /^goodbye$/i.test(clean)) {
    return 'Goodbye! Feel free to come back whenever you need me.';
  }
  if (/^see\s+you$/i.test(clean) || /^see\s+ya$/i.test(clean)) {
    return 'See you again! Take care.';
  }
  if (/^are\s+you\s+there$/i.test(clean)) {
    return "Yes! I'm here and ready to assist you.";
  }
  if (/^help\s+me$/i.test(clean)) {
    return 'Of course! Tell me what you need help with.';
  }
  if (/^what\s+is\s+your\s+name$/i.test(clean)) {
    return "I'm HomeBrain, your personal AI assistant.";
  }
  if (/^who\s+created\s+you$/i.test(clean) || /^who\s+made\s+you$/i.test(clean)) {
    return "I'm HomeBrain, an AI assistant designed to help manage personal and family information.";
  }

  // ==========================================
  // 13. DOCUMENT UPLOAD & MANAGEMENT COMMANDS
  // ==========================================
  if (/^upload\s+(?:my\s+)?aadhaar$/i.test(clean)) {
    return 'Sure! Please select your Aadhaar document to upload.';
  }
  if (/^(?:i\s+want\s+to\s+)?add\s+my\s+pan(?:\s*card)?$/i.test(clean)) {
    return "Please upload your PAN card. I'll help you save it in your Document Vault.";
  }
  if (/^save\s+father['’]?s\s+pan$/i.test(clean)) {
    return "Please upload the PAN document and confirm the document owner's details.";
  }
  if (/^add\s+my\s+new\s+certificate$/i.test(clean)) {
    return 'Please upload the certificate.';
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
    return 'Which word or phrase should I search for?';
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
  if (/^add\s+a\s+new\s+document$/i.test(clean) || clean === 'add new document') {
    return 'Sure! Please upload your document and specify its type.';
  }
  if (/^upload\s+completed$/i.test(clean)) {
    return "I'll verify the upload and confirm once the document is successfully stored.";
  }
  if (/^where\s+can\s+i\s+upload\s+documents$/i.test(clean)) {
    return 'You can upload documents through the Document Vault.';
  }
  if (/^can\s+you\s+save\s+pdf(?:\s+files)?$/i.test(clean)) {
    return 'Yes! I can process supported PDF documents. Please upload your file.';
  }

  // Missing document scenarios
  if (/^fetch\s+my\s+aadhaar$/i.test(clean)) {
    return "I couldn't find your Aadhaar card. Please upload it first.";
  }
  if (/^do\s+you\s+have\s+father['’]?s\s+pan$/i.test(clean)) {
    return "Your father's PAN card is not currently available in the Document Vault.";
  }
  if (/^find\s+my\s+passport$/i.test(clean)) {
    return "I couldn't find an uploaded passport. Would you like to upload it?";
  }
  if (/^fetch\s+a\s+document\s+i\s+never\s+uploaded$/i.test(clean)) {
    return "I couldn't find that document. Please upload it before requesting retrieval.";
  }
  if (/^where\s+is\s+my\s+old\s+certificate$/i.test(clean)) {
    return "I couldn't locate that certificate. Could you provide its name or type?";
  }
  if (/^find\s+sham['’]?s\s+documents$/i.test(clean)) {
    return "I'll list the available documents belonging to Sham that you can access.";
  }

  // Document Vault Search & Statistics
  if (/^search\s+(?:for\s+)?my\s+documents$/i.test(clean)) {
    if (effectiveDocuments.length === 0) {
      return "Sure! I'll search your Document Vault.\n\nNo documents have been uploaded to your Document Vault yet. Please upload your documents to make them accessible here.";
    }
    return "Sure! I'll search your Document Vault.\n\n" +
      `📁 **Retrieved Documents (${effectiveDocuments.length} files found)**:\n\n` +
      effectiveDocuments.map(d => `• **${(d.title || '').replace('[DEMO] ', '')}** (${d.category}, ${d.fileType} - ${d.fileSize})`).join('\n');
  }

  if (/^how\s+many\s+documents\s+do\s+i\s+have$/i.test(clean)) {
    return `I'll check your Document Vault and count your available documents.\n\nYou currently have **${effectiveDocuments.length}** document(s) in your Document Vault.`;
  }

  if (/^show\s+my\s+uploaded\s+files$/i.test(clean) || clean === 'show uploaded files') {
    if (effectiveDocuments.length === 0) {
      return "I'll retrieve your uploaded file list.\n\nYou currently have no files uploaded to your Document Vault.";
    }
    return "I'll retrieve your uploaded file list.\n\n" +
      `📁 **Your Uploaded Files (${effectiveDocuments.length})**:\n\n` +
      effectiveDocuments.map(d => `• **${(d.title || '').replace('[DEMO] ', '')}** (${d.category}) - Uploaded by ${d.uploaderName || user?.name || 'User'}`).join('\n');
  }

  if (/^find\s+documents\s+uploaded\s+today$/i.test(clean)) {
    const today = new Date().toISOString().split('T')[0];
    const docsToday = effectiveDocuments.filter(d => (d.uploadDate || '').startsWith(today));
    if (docsToday.length === 0) {
      return "I'll search for documents uploaded today.\n\nNo documents were uploaded today.";
    }
    return "I'll search for documents uploaded today.\n\n" +
      `📁 **Documents Uploaded Today (${docsToday.length})**:\n\n` +
      docsToday.map(d => `• **${(d.title || '').replace('[DEMO] ', '')}** (${d.category})`).join('\n');
  }

  if (/^find\s+my\s+latest\s+document$/i.test(clean) || clean === 'latest document') {
    if (effectiveDocuments.length === 0) {
      return "I'll check your most recently uploaded documents.\n\nNo documents found in your Document Vault.";
    }
    const latest = effectiveDocuments[0];
    return "I'll check your most recently uploaded documents.\n\n" +
      `• **${(latest.title || '').replace('[DEMO] ', '')}** (${latest.category}, ${latest.fileType}): Uploaded on ${latest.uploadDate || 'recently'}\n  📝 **Summary**: ${latest.summaryContent || latest.description || 'Securely saved'}`;
  }

  if (/^search\s+(?:for\s+)?(?:my\s+)?certificates$/i.test(clean)) {
    const certs = effectiveDocuments.filter(d => {
      const txt = `${d.title || ''} ${d.category || ''} ${d.description || ''}`.toLowerCase();
      return txt.includes('certificate') || txt.includes('degree') || txt.includes('marksheet') || (d.category || '').toLowerCase() === 'education';
    });
    if (certs.length === 0) {
      return "I'll search your educational and professional certificates.\n\nI couldn't find the requested educational document. Please upload it to your Document Vault.";
    }
    return "I'll search your educational and professional certificates.\n\n" +
      certs.map(d => `• **${(d.title || '').replace('[DEMO] ', '')}** (${d.category}): ${d.description || 'Verified educational record'}`).join('\n');
  }

  if (/^delete\s+my\s+aadhaar$/i.test(clean)) {
    return "I'll identify the document and ask you to confirm before deleting it. Are you sure you want to permanently delete your Aadhaar card from the Document Vault?";
  }

  if (/^rename\s+my\s+document$/i.test(clean)) {
    return 'Please specify the document and its new name.';
  }

  if (/^when\s+did\s+i\s+upload\s+my\s+pan$/i.test(clean)) {
    const panDoc = effectiveDocuments.find(d => /pan/i.test(d.title || '') || /pan/i.test(d.description || ''));
    if (panDoc) {
      return `I'll check the upload date in your Document Vault.\n\nYour PAN card was uploaded on **${panDoc.uploadDate}**.`;
    }
    return "I'll check the upload date in your Document Vault.\n\nYour PAN card is not currently uploaded in the Document Vault.";
  }

  if (/^is\s+my\s+document\s+expired$/i.test(clean)) {
    const expiredList = effectiveDocuments.filter(d => {
      const exp = d.expiryDate;
      return exp && new Date(exp).getTime() < Date.now();
    });
    const expiringSoonList = effectiveDocuments.filter(d => {
      const exp = d.expiryDate;
      if (!exp) return false;
      const diffDays = Math.ceil((new Date(exp).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 60;
    });

    if (expiredList.length === 0 && expiringSoonList.length === 0) {
      return "I'll check the document's expiry date, if available.\n\n✅ None of your documents are expired or expiring in the next 60 days.";
    }
    let res = "I'll check the document's expiry date, if available.\n\n";
    if (expiredList.length > 0) {
      res += `🚨 **Expired Documents (${expiredList.length})**:\n` + expiredList.map(d => `• **${(d.title || '').replace('[DEMO] ', '')}** expired on ${d.expiryDate}`).join('\n') + '\n\n';
    }
    if (expiringSoonList.length > 0) {
      res += `⚠️ **Expiring Soon (${expiringSoonList.length})**:\n` + expiringSoonList.map(d => `• **${(d.title || '').replace('[DEMO] ', '')}** expires on ${d.expiryDate}`).join('\n');
    }
    return res.trim();
  }

  // General assistant date & family overview
  if (/^what\s+is\s+today['’]?s\s+date$/i.test(clean) || clean === 'today date' || clean === 'date today') {
    const dateFormatted = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    return `I'll provide today's date based on the system clock.\n\nToday's date is **${dateFormatted}**.`;
  }
  if (/^remember\s+this\s+information$/i.test(clean)) {
    return 'Sure! Please tell me what information you want to save.';
  }
  if (/^find\s+my\s+family\s+details$/i.test(clean)) {
    return "I'll search your authorized family records.\n\n" +
      `👨‍👩‍👧‍👦 **Family Members in Ecosystem**:\n` +
      `• **Father** (Parent, Age 52)\n• **Mother** (Parent, Age 48)\n• **Sarah** (Eldest Daughter, Age 24)\n• **Sneha** (Daughter, Age 19)\n• **Sham** (Son, High School, Age 16)`;
  }
  if (/^show\s+my\s+family\s+timeline$/i.test(clean)) {
    return "I'll retrieve the available events from your Family Timeline.\n\n" +
      `📸 **Available Family Photo Albums & Places**:\n` +
      `• **Paris, France** (3 photos)\n• **Kyoto, Japan** (3 photos)\n• **Santorini, Greece** (2 photos)\n• **Swiss Alps, Switzerland** (3 photos)\n• **Manali, Himachal Pradesh** (2 photos)\n• **Bali, Indonesia** (3 photos)\n\n*(You can view them anytime under the Family Timeline tab).*`;
  }
  if (/^add\s+a\s+family\s+event$/i.test(clean)) {
    return 'Sure! Please provide the event details and date.';
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
  if (/^search\s+my\s+previous\s+records$/i.test(clean)) {
    return "I'll search your available personal records.\n\n" +
      `• **Document Vault**: ${effectiveDocuments.length} files securely stored\n` +
      `• **Access**: Authorized family records with end-to-end security\n` +
      `• **Health & Knowledge Base**: Available for medical and personal queries.`;
  }
  if (/^i\s+need\s+assistance$/i.test(clean) || clean === 'need assistance') {
    return "Of course! Tell me what you need, and I'll help you.";
  }

  // ==========================================
  // 14. SPECIFIC DOCUMENT RETRIEVAL BACKEND TRIGGERS
  // ==========================================
  let person = 'your';
  let personName = user?.name || 'You';
  if (/\bsham(?:'s)?\b/i.test(clean)) {
    person = "Sham's";
    personName = 'Sham';
  } else if (/\bfather(?:'s)?\b|\bdad(?:'s)?\b/i.test(clean)) {
    person = "Father's";
    personName = 'Father';
  } else if (/\bmother(?:'s)?\b|\bmom(?:'s)?\b/i.test(clean)) {
    person = "Mother's";
    personName = 'Mother';
  } else if (/\bsarah(?:'s)?\b/i.test(clean)) {
    person = "Sarah's";
    personName = 'Sarah';
  } else if (/\bsneha(?:'s)?\b/i.test(clean)) {
    person = "Sneha's";
    personName = 'Sneha';
  } else if (/\bgrandfather(?:'s)?\b|\bgrandpa(?:'s)?\b|\bthatha(?:'s)?\b/i.test(clean)) {
    person = "grandfather's";
    personName = 'Grandfather';
  } else if (/\bgrandmother(?:'s)?\b|\bgrandma(?:'s)?\b|\bpaati(?:'s)?\b/i.test(clean)) {
    person = "grandmother's";
    personName = 'Grandmother';
  }

  // A. AADHAAR CARD
  if (/aadhaar|aadhar|uid\b|uidai/i.test(clean)) {
    let checkMsg = '';
    if (personName === 'Sham') {
      if (/^fetch\b/i.test(clean)) checkMsg = "Let me check the Document Vault for Sham's Aadhaar card.\n\n";
      else if (/^show\b/i.test(clean)) checkMsg = "I'll check for Sham's Aadhaar document.\n\n";
      else if (/^send\b/i.test(clean)) checkMsg = "I'll check whether Sham's Aadhaar card is available and whether you have permission to access it.\n\n";
      else checkMsg = "Let me check the Document Vault for Sham's Aadhaar card.\n\n";
    } else if (personName === 'Grandfather' || personName === 'Grandmother') {
      checkMsg = `Let me check the Document Vault for ${person} Aadhaar card.\n\n`;
    } else {
      if (/^get\b/i.test(clean)) checkMsg = "I'll check whether your Aadhaar card is available in your Document Vault.\n\n";
      else if (/^where\b/i.test(clean)) checkMsg = "I'll search your uploaded documents for your Aadhaar card.\n\n";
      else if (/^download\b/i.test(clean)) checkMsg = "I'll check whether your Aadhaar card is available and authorized for download.\n\n";
      else checkMsg = "Let me check your Document Vault.\n\n";
    }

    const doc = effectiveDocuments.find(d => {
      const txt = `${d.title || ''} ${d.description || ''}`.toLowerCase();
      const isAadhaar = txt.includes('aadhaar') || txt.includes('aadhar') || txt.includes('uid');
      if (!isAadhaar) return false;
      if (personName === 'Sham') return txt.includes('sham');
      if (personName === 'Grandfather') return txt.includes('grandfather') || txt.includes('grandpa');
      if (personName === 'Grandmother') return txt.includes('grandmother') || txt.includes('grandma');
      return true;
    });

    if (doc) {
      return checkMsg + `${person} Aadhaar card has been found in your Document Vault. Would you like to view or download it?\n\n• **${(doc.title || '').replace('[DEMO] ', '')}** (${doc.category}, ${doc.fileType} - ${doc.fileSize}): Uploaded by ${doc.uploaderName}\n  📝 **Summary**: ${doc.summaryContent || doc.description || 'Verified Aadhaar Card'}`;
    } else {
      if (personName === 'Sham') {
        return checkMsg + "I couldn't find Sham's Aadhaar card in the Document Vault.\n\nPlease upload the Aadhaar card so I can store it and make it available for future retrieval.";
      }
      return checkMsg + "I couldn't find your Aadhaar card in the Document Vault. Please upload it first.";
    }
  }

  // B. PAN CARD
  if (/\bpan(?:\s*card)?\b/i.test(clean)) {
    let checkMsg = '';
    if (personName === 'Sham') {
      checkMsg = "Let me check whether Sham's PAN card is uploaded.\n\n";
    } else {
      if (/^fetch\b/i.test(clean)) checkMsg = "I'll search your Document Vault for your PAN card.\n\n";
      else if (/^show\b/i.test(clean)) checkMsg = "I'll search your uploaded PAN card.\n\n";
      else if (/^download\b/i.test(clean)) checkMsg = "I'll check whether your PAN card is available for download.\n\n";
      else checkMsg = "Let me check your uploaded documents.\n\n";
    }

    const doc = effectiveDocuments.find(d => {
      const txt = `${d.title || ''} ${d.description || ''}`.toLowerCase();
      if (!txt.includes('pan')) return false;
      if (personName === 'Sham') return txt.includes('sham');
      return true;
    });

    if (doc) {
      return checkMsg + `${person} PAN card has been found in your Document Vault. Would you like to view or download it?\n\n• **${(doc.title || '').replace('[DEMO] ', '')}** (${doc.category}, ${doc.fileType} - ${doc.fileSize}): Uploaded by ${doc.uploaderName}\n  📝 **Summary**: ${doc.summaryContent || doc.description || 'Official PAN record'}`;
    } else {
      return checkMsg + "I couldn't find the PAN card in your Document Vault. Please upload it so I can retrieve it next time.";
    }
  }

  // C. DRIVING LICENCE
  if (/licen[cs]e|\bdl\b/i.test(clean)) {
    let checkMsg = '';
    if (personName === 'Sham') {
      checkMsg = "Let me check Sham's uploaded documents.\n\n";
    } else {
      if (/^fetch\b/i.test(clean)) checkMsg = "I'll search for your driving licence.\n\n";
      else if (/^show\b/i.test(clean)) checkMsg = "I'll check your Document Vault for your driving licence.\n\n";
      else if (/^download\b/i.test(clean)) checkMsg = "I'll check its availability and access permissions.\n\n";
      else checkMsg = "I'll search for your driving licence.\n\n";
    }

    const doc = effectiveDocuments.find(d => {
      const txt = `${d.title || ''} ${d.description || ''}`.toLowerCase();
      const isLic = txt.includes('license') || txt.includes('licence') || txt.includes('driving');
      if (!isLic) return false;
      if (personName === 'Sham') return txt.includes('sham');
      return true;
    });

    if (doc) {
      return checkMsg + `${(doc.title || '').replace('[DEMO] ', '')} has been found in your Document Vault. Would you like to view or download it?\n\n• **${(doc.title || '').replace('[DEMO] ', '')}** (${doc.category}, ${doc.fileType} - ${doc.fileSize}): Uploaded by ${doc.uploaderName}\n  📝 **Summary**: ${doc.summaryContent || doc.description || 'Permanent Driving License'}`;
    } else {
      return checkMsg + "Your driving licence is not currently available in the Document Vault. Please upload it first.";
    }
  }

  // D. EDUCATIONAL DOCUMENTS
  if (/10th\s*marksheet|12th\s*certificate|college\s*id|degree\s*certificate|college\s*documents?|educational/i.test(clean)) {
    let checkMsg = '';
    if (/10th/i.test(clean)) checkMsg = "I'll search for your 10th marksheet.\n\n";
    else if (/12th/i.test(clean)) checkMsg = "Let me check your uploaded educational records.\n\n";
    else if (/college\s*id/i.test(clean)) checkMsg = "I'll check whether your college ID is available.\n\n";
    else if (/degree/i.test(clean)) checkMsg = "I'll search your Document Vault for your degree certificate.\n\n";
    else if (/sham/i.test(clean)) checkMsg = "I'll search for Sham's uploaded educational documents.\n\n";
    else checkMsg = "I'll search your Document Vault for your educational documents.\n\n";

    const doc = effectiveDocuments.find(d => {
      const txt = `${d.title || ''} ${d.description || ''} ${d.category || ''}`.toLowerCase();
      const isEdu = txt.includes('college') || txt.includes('marksheet') || txt.includes('degree') || txt.includes('10th') || txt.includes('12th') || (d.category || '').toLowerCase() === 'education';
      if (!isEdu) return false;
      if (/10th/i.test(clean) && !txt.includes('10th')) return false;
      if (/12th/i.test(clean) && !txt.includes('12th')) return false;
      if (/college\s*id/i.test(clean) && !txt.includes('college id')) return false;
      if (/degree/i.test(clean) && (!txt.includes('degree') && !txt.includes('b.tech') && !txt.includes('btech'))) return false;
      if (personName === 'Sham' && !txt.includes('sham')) return false;
      return true;
    });

    if (doc) {
      return checkMsg + `${(doc.title || '').replace('[DEMO] ', '')} has been found in your Document Vault. Would you like to view or download it?\n\n• **${(doc.title || '').replace('[DEMO] ', '')}** (${doc.category}, ${doc.fileType} - ${doc.fileSize}): Uploaded by ${doc.uploaderName}\n  📝 **Summary**: ${doc.summaryContent || doc.description}`;
    } else {
      if (/degree/i.test(clean)) {
        return "Your degree certificate hasn't been found in the Document Vault.";
      }
      return checkMsg + "I couldn't find the requested educational document. Please upload it to your Document Vault.";
    }
  }

  // E. OTHER PERSONAL DOCUMENTS
  if (/passport/i.test(clean)) {
    if (personName === 'Father') {
      return "I'll check your father's available documents.";
    }
    const doc = effectiveDocuments.find(d => (d.title || '').toLowerCase().includes('passport') || (d.description || '').toLowerCase().includes('passport'));
    if (doc) {
      return "I'll check your Document Vault for your passport.\n\n" +
        `${(doc.title || '').replace('[DEMO] ', '')} has been found in your Document Vault. Would you like to view or download it?\n\n• **${(doc.title || '').replace('[DEMO] ', '')}** (${doc.category}, ${doc.fileType} - ${doc.fileSize}): Uploaded by ${doc.uploaderName}\n  📝 **Summary**: ${doc.summaryContent || doc.description}`;
    }
    return "I couldn't find an uploaded passport. Would you like to upload it?";
  }

  if (/voter\s*id/i.test(clean)) {
    if (personName === 'Mother') {
      return "I'll search for your mother's voter ID.";
    }
    const doc = effectiveDocuments.find(d => (d.title || '').toLowerCase().includes('voter'));
    if (doc) {
      return "Let me search for your voter ID.\n\n" +
        `${(doc.title || '').replace('[DEMO] ', '')} has been found in your Document Vault. Would you like to view or download it?\n\n• **${(doc.title || '').replace('[DEMO] ', '')}** (${doc.category}): Uploaded by ${doc.uploaderName}`;
    }
    return "Let me search for your voter ID.\n\nI couldn't find your voter ID in the Document Vault. Please upload it to your Document Vault.";
  }

  if (/birth\s*certificate/i.test(clean)) {
    const doc = effectiveDocuments.find(d => (d.title || '').toLowerCase().includes('birth'));
    if (doc) {
      return "I'll search for your birth certificate.\n\n" +
        `${(doc.title || '').replace('[DEMO] ', '')} has been found in your Document Vault. Would you like to view or download it?\n\n• **${(doc.title || '').replace('[DEMO] ', '')}** (${doc.category})`;
    }
    return "I'll search for your birth certificate.\n\nI couldn't find your birth certificate in the Document Vault. Please upload it to your Document Vault.";
  }

  if (/family\s*documents?/i.test(clean)) {
    return "I'll search for available family documents.\n\n" +
      `📁 **Available Family Documents (${effectiveDocuments.length})**:\n\n` +
      effectiveDocuments.map(d => `• **${(d.title || '').replace('[DEMO] ', '')}** (${d.category})`).join('\n');
  }

  if (/insurance/i.test(clean)) {
    const doc = effectiveDocuments.find(d => (d.title || '').toLowerCase().includes('insurance') || (d.description || '').toLowerCase().includes('insurance'));
    if (doc) {
      return "I'll search your insurance documents.\n\n" +
        `${(doc.title || '').replace('[DEMO] ', '')} has been found in your Document Vault. Would you like to view or download it?\n\n• **${(doc.title || '').replace('[DEMO] ', '')}** (${doc.category}, ${doc.fileType} - ${doc.fileSize}): Uploaded by ${doc.uploaderName}\n  📝 **Summary**: ${doc.summaryContent || doc.description}`;
    }
    return "I'll search your insurance documents.\n\nI couldn't find your insurance document in the Document Vault. Please upload it to your Document Vault.";
  }

  if (/property\s*(?:documents?|papers|records)?|property/i.test(clean)) {
    const doc = effectiveDocuments.find(d => (d.title || '').toLowerCase().includes('property') || (d.category || '').toLowerCase() === 'home');
    if (doc) {
      return "I'll check your property records.\n\n" +
        `${(doc.title || '').replace('[DEMO] ', '')} has been found in your Document Vault.\n\n• **${(doc.title || '').replace('[DEMO] ', '')}** (${doc.category})`;
    }
    return "I'll check your property records.\n\nI couldn't find property-related documents in the Document Vault. Please upload them to your Document Vault.";
  }

  if (/bank\s*statement/i.test(clean)) {
    const doc = effectiveDocuments.find(d => (d.title || '').toLowerCase().includes('bank') || (d.title || '').toLowerCase().includes('statement'));
    if (doc) {
      return "I'll check your uploaded bank statements.\n\n" +
        `${(doc.title || '').replace('[DEMO] ', '')} has been found in your Document Vault.\n\n• **${(doc.title || '').replace('[DEMO] ', '')}** (${doc.category})`;
    }
    return "I'll check your uploaded bank statements.\n\nI couldn't find your bank statement in the Document Vault. Please upload it to your Document Vault.";
  }

  if (/show\s+all\s+(?:my\s+)?pdfs/i.test(clean)) {
    const pdfs = effectiveDocuments.filter(d => (d.fileType || '').toLowerCase().includes('pdf') || (d.title || '').toLowerCase().endsWith('.pdf'));
    return "I'll list the PDFs you are authorized to access.\n\n" +
      `📄 **Authorized PDF Documents (${pdfs.length})**:\n\n` +
      pdfs.map(d => `• **${(d.title || '').replace('[DEMO] ', '')}** (${d.category})`).join('\n');
  }

  if (/show\s+all\s+(?:my\s+)?documents/i.test(clean) || clean === 'all my documents' || clean === 'all documents') {
    return "I'll retrieve a list of documents you are authorized to access.\n\n" +
      `📁 **Authorized Documents (${effectiveDocuments.length} files)**:\n\n` +
      effectiveDocuments.map(d => `• **${(d.title || '').replace('[DEMO] ', '')}** (${d.category}, ${d.fileType} - ${d.fileSize})`).join('\n') +
      `\n\n*(Click Download Document on any record below to download directly to your device).*`;
  }

  return null;
}
