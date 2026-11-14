import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = path.resolve(__dirname, '..');
const trainingDir = path.join(baseDir, 'homebrain-training');

if (!fs.existsSync(trainingDir)) {
  fs.mkdirSync(trainingDir, { recursive: true });
}

const greetings = {
  category: "Greetings & Identity",
  intents: [
    {
      intent: "greeting",
      examples: ["Hi", "Hello", "Hey", "Good morning", "Good afternoon", "Good evening", "Good night", "How are you?"],
      action: "greet",
      responses: {
        default: "Hello! Welcome back. How can I help you today?",
        morning: "Good morning! Hope you're having a great day. How can I help?",
        afternoon: "Good afternoon! How can I assist you today?",
        evening: "Good evening! What can I help you with?",
        night: "Good night! Have a peaceful night.",
        how_are_you: "I'm doing great! Ready to help you with your tasks. How are you?"
      }
    },
    {
      intent: "identity",
      examples: ["Who are you?", "What is your name?", "Who created you?"],
      action: "describe_self",
      responses: {
        who_are_you: "I'm HomeBrain, your personal AI assistant. I can help you manage documents, retrieve information, and assist with everyday tasks.",
        what_is_your_name: "I'm HomeBrain, your personal AI assistant.",
        who_created_you: "I'm HomeBrain, an AI assistant designed to help manage personal and family information."
      }
    },
    {
      intent: "capabilities",
      examples: ["What can you do?", "Can you manage my bills?", "Can you remember birthdays?", "Can you fetch my documents?", "Can you manage groceries?", "Can you remind me?", "Can you access my files?", "What did I ask you to do?"],
      action: "explain_capabilities",
      responses: {
        what_can_you_do: "I can manage your groceries, finances, family calendar, reminders, documents, tasks, and personal records.",
        manage_bills: "Yes! I can track bills, payment status, due dates, and reminders.",
        remember_birthdays: "Yes! I can save family birthdays and help you check upcoming occasions.",
        fetch_documents: "Yes! I can search your uploaded and authorized documents.",
        manage_groceries: "Yes! I can add, remove, update, and track grocery items.",
        remind_me: "Yes! I can schedule reminders when the notification integration is enabled.",
        access_files: "I can access documents available through your connected and authorized Document Vault.",
        what_did_i_ask: "I'll check your available task and conversation history."
      }
    },
    {
      intent: "polite_closure",
      examples: ["Thank you", "Thanks", "Bye", "See you", "Are you there?", "Help me"],
      action: "acknowledge",
      responses: {
        thank_you: "You're welcome! I'm always happy to help.",
        thanks: "Happy to help!",
        bye: "Goodbye! Feel free to come back whenever you need me.",
        see_you: "See you again! Take care.",
        are_you_there: "Yes! I'm here and ready to assist you.",
        help_me: "Of course! Tell me what you need help with."
      }
    }
  ]
};

const grocery = {
  category: "Grocery Vault",
  intents: [
    {
      intent: "add_grocery_item",
      examples: [
        "Add milk to grocery list",
        "Add 2 kg rice",
        "Add tomatoes and onions",
        "Add 1 litre oil",
        "Add eggs to my shopping list",
        "Add vegetables for tomorrow",
        "Add these items to groceries",
        "Add water can to grocery list"
      ],
      entities: { item: null, quantity: null },
      action: "grocery_add",
      workflow: ["extract_item", "check_duplicate", "add_or_ask_quantity"],
      responses: {
        success: "{item} has been added to your grocery list.",
        already_exists: "{item} is already on your grocery list. Would you like to update its quantity?",
        rice: "2 kg of rice has been added.",
        tomatoes_onions: "Tomatoes and onions have been added to your list.",
        oil: "1 litre of cooking oil has been added.",
        eggs: "Eggs have been added to your shopping list.",
        vegetables: "Vegetables have been added to your grocery list.",
        water_can: "Water can has been added to your grocery list.",
        these_items: "Sure! I'll add the identified items to your list."
      }
    },
    {
      intent: "remove_grocery_item",
      examples: [
        "Remove milk from grocery list",
        "Delete rice from my list",
        "Clear my grocery list"
      ],
      action: "grocery_remove",
      responses: {
        milk_removed: "Milk has been removed from your grocery list.",
        rice_removed: "Rice has been removed.",
        clear_confirm: "Are you sure you want to clear your grocery list?"
      }
    },
    {
      intent: "update_grocery_quantity",
      examples: ["Change milk quantity to 2 litres"],
      action: "grocery_update",
      responses: {
        updated: "Milk quantity has been updated to 2 litres."
      }
    },
    {
      intent: "view_grocery_list",
      examples: [
        "Show my grocery list",
        "What should I buy?",
        "What groceries are pending?",
        "Is milk already in my list?"
      ],
      action: "grocery_view",
      responses: {
        show: "Here is your current grocery list.",
        what_should_i_buy: "Here are the items remaining on your grocery list.",
        pending: "These are the grocery items you haven't marked as purchased.",
        is_in_list: "Yes, milk is already on your grocery list."
      }
    },
    {
      intent: "mark_grocery_purchased",
      examples: [
        "Mark milk as purchased",
        "I bought all the groceries"
      ],
      action: "grocery_mark_purchased",
      responses: {
        single: "Milk has been marked as purchased.",
        all: "All items have been marked as purchased."
      }
    },
    {
      intent: "grocery_recurring_and_history",
      examples: [
        "Add bread every morning",
        "What did I buy last week?",
        "How much did I spend on groceries?"
      ],
      action: "grocery_analytics",
      responses: {
        recurring: "Do you want me to create a recurring grocery reminder for bread?",
        history: "I'll check your grocery purchase history.",
        expenses: "I'll calculate your recorded grocery expenses."
      }
    }
  ]
};

const finance = {
  category: "Finance Manager",
  intents: [
    {
      intent: "bill_payment",
      examples: [
        "Mark electricity bill as paid",
        "Mark EB bill as paid",
        "I paid the water bill",
        "Mark internet bill as paid",
        "Have I paid this month's EB bill?",
        "When is my next electricity bill due?",
        "Show pending bills",
        "What bills are due this week?",
        "Add electricity bill",
        "Add ₹1,500 electricity bill",
        "Remind me to pay EB tomorrow",
        "Delete my old water bill",
        "How much is my pending bill amount?",
        "Did I already pay the internet bill?"
      ],
      action: "bill_action",
      responses: {
        eb_paid: "Your electricity bill has been marked as paid.",
        eb_updated: "Your electricity bill has been updated as paid.",
        water_paid: "I'll update your water bill payment status.",
        internet_paid: "Your internet bill has been marked as paid.",
        eb_check: "I'll check your electricity bill payment records.",
        eb_due: "I'll check your upcoming electricity bill due date.",
        pending_bills: "Here are your unpaid bills.",
        due_this_week: "Here are the bills due this week.",
        add_eb: "Sure! Please provide the bill amount and due date.",
        add_eb_amount: "Your ₹1,500 electricity bill has been recorded. When is it due?",
        remind_eb: "I'll set a reminder for tomorrow to pay the electricity bill.",
        delete_water: "Which water bill would you like me to delete?",
        pending_amount: "I'll calculate the total amount of your unpaid bills.",
        check_internet: "I'll check your payment history.",
        already_paid: "Your electricity bill is already marked as paid on {date}.",
        not_paid: "Your electricity bill is still pending. Would you like to mark it as paid?",
        not_found: "I couldn't find an electricity bill in your records. Would you like to add one?",
        missing_amount: "What was the amount of the electricity bill?",
        no_proof_confirm: "I've updated the payment status based on your confirmation."
      }
    },
    {
      intent: "income_and_expenses",
      examples: [
        "Add ₹500 expense",
        "I spent ₹200 on food",
        "Add ₹1,000 for petrol",
        "Record ₹5,000 salary",
        "I received ₹2,000",
        "Show my expenses today",
        "How much did I spend this month?",
        "Show last month's expenses",
        "What is my total income?",
        "How much did I save?",
        "Show my biggest expenses",
        "Delete the ₹200 food expense",
        "Change petrol expense to ₹1,200",
        "Add ₹300 for groceries yesterday",
        "Add a maintenance expense",
        "Show house expenses"
      ],
      action: "transaction_action",
      responses: {
        add_expense_prompt: "₹500 expense recorded. What was it for?",
        food_expense: "₹200 food expense has been recorded.",
        petrol_expense: "₹1,000 petrol expense has been added.",
        salary_income: "₹5,000 salary income has been recorded.",
        received_income: "I'll record ₹2,000 as income. What was the source?",
        expenses_today: "Here are your recorded expenses for today.",
        spend_this_month: "I'll calculate your total expenses for this month.",
        last_month_expenses: "Here is your expense summary for last month.",
        total_income: "I'll calculate your recorded income.",
        savings: "I'll calculate your savings from recorded income and expenses.",
        biggest_expenses: "I'll identify your highest recorded expenses.",
        delete_food: "I'll locate that transaction before deleting it.",
        change_petrol: "I'll update the petrol expense amount.",
        groceries_yesterday: "I'll record the ₹300 grocery expense for yesterday.",
        maintenance: "What was the amount and purpose?",
        house_expenses: "I'll retrieve your recorded household expenses."
      }
    },
    {
      intent: "budget_management",
      examples: [
        "Set monthly budget to ₹20,000",
        "Set grocery budget to ₹5,000",
        "How much budget is remaining?",
        "Am I exceeding my budget?",
        "Show my budget",
        "Increase my budget to ₹25,000",
        "How much did I spend on transport?",
        "Compare this month and last month"
      ],
      action: "budget_action",
      responses: {
        set_monthly: "Your monthly budget has been set to ₹20,000.",
        set_grocery: "Your grocery budget has been set to ₹5,000.",
        remaining: "I'll calculate your remaining monthly budget.",
        exceeding: "I'll compare your recorded expenses with your budget.",
        show: "Here are your current budget limits.",
        increase: "Your monthly budget has been updated to ₹25,000.",
        transport: "I'll calculate your recorded transport expenses.",
        compare: "I'll compare both months' recorded income and expenses."
      }
    }
  ]
};

const calendar = {
  category: "Family Calendar",
  intents: [
    {
      intent: "add_event",
      examples: [
        "Add my father's birthday",
        "Add father's birthday on December 10",
        "Add mother's birthday tomorrow",
        "Add my birthday",
        "Add wedding anniversary",
        "Schedule a family function",
        "Add a meeting tomorrow at 10 AM",
        "Schedule a doctor appointment on Friday",
        "Add college event next Monday",
        "Add a reminder for my father's birthday",
        "Add a housewarming ceremony on January 15",
        "Add a family trip next week"
      ],
      action: "calendar_add",
      responses: {
        father_bday_prompt: "What date is your father's birthday?",
        father_bday_dec10: "Your father's birthday has been added to the family calendar on December 10.",
        father_bday_duplicate: "Your father's birthday is already marked on December 10. I haven't created a duplicate event.",
        mother_bday_tomorrow: "I'll add your mother's birthday for tomorrow.",
        my_bday: "Sure! What date is your birthday?",
        anniversary: "Whose wedding anniversary should I add, and what is the date?",
        family_function: "Sure! Please provide the event date and details.",
        meeting_10am: "Your meeting has been added for tomorrow at 10 AM.",
        doctor_friday: "I'll add your appointment for Friday. What time?",
        college_event: "I'll add the college event for next Monday.",
        bday_reminder: "I'll create a birthday reminder for your father.",
        housewarming: "Your housewarming event has been added for January 15.",
        family_trip: "What date and time should I schedule the family trip?"
      }
    },
    {
      intent: "ask_events",
      examples: [
        "When is my father's birthday?",
        "When is my mother's birthday?",
        "What is the next family event?",
        "Do we have any events tomorrow?",
        "What events are coming this month?",
        "Is father's birthday saved?",
        "Is father's birthday already added?",
        "Have I added mother's birthday?",
        "When is my next anniversary?",
        "Any birthdays this week?",
        "What did I schedule for Sunday?",
        "Show my family calendar",
        "How many events are scheduled this month?"
      ],
      action: "calendar_query",
      responses: {
        when_father: "Your father's birthday is on December 10.",
        when_father_not_found: "I couldn't find your father's birthday in the Family Calendar. Would you like to add it?",
        when_mother: "Your mother's birthday is on May 15.",
        next_event: "Your next family event is Family Dinner on Friday.",
        tomorrow: "You have 1 scheduled events tomorrow.",
        coming_month: "Here are your upcoming events for this month.",
        father_saved: "Yes! Your father's birthday is already saved in the Family Calendar on December 10. Would you like me to set a reminder?",
        mother_saved: "Yes, your mother's birthday is already in the calendar.",
        next_anniversary: "Your next saved anniversary is on June 24.",
        birthdays_week: "Here are the birthdays scheduled for this week.",
        sunday_events: "I'll show your events scheduled for Sunday.",
        show_calendar: "Here is your family calendar.",
        count_month: "You have 4 events scheduled this month."
      }
    },
    {
      intent: "update_delete_event",
      examples: [
        "Change father's birthday date",
        "Move my meeting to 3 PM",
        "Cancel tomorrow's appointment",
        "Delete the birthday event",
        "Add a reminder one day before father's birthday",
        "Remind me about the family function",
        "Is my meeting postponed?"
      ],
      action: "calendar_manage",
      responses: {
        change_date: "What is the correct date?",
        move_meeting: "Your meeting time has been updated to 3 PM.",
        cancel_appt: "Which appointment would you like to cancel?",
        delete_bday: "Which birthday event should I remove?",
        remind_before: "I'll set a reminder one day before your father's birthday.",
        remind_function: "What date and time should I set the reminder for?",
        is_postponed: "I'll check the latest saved meeting details."
      }
    }
  ]
};

const reminders = {
  category: "Reminders and Notifications",
  intents: [
    {
      intent: "manage_reminders",
      examples: [
        "Remind me to drink water",
        "Remind me tomorrow to pay EB",
        "Set an alarm for 6 AM",
        "Remind me about my meeting",
        "Remind me every Sunday to buy groceries",
        "Remind me to call father tonight",
        "Show my reminders",
        "Cancel my grocery reminder",
        "What reminders do I have today?",
        "Snooze my reminder",
        "Remind me 2 days before the event",
        "Did I miss any reminders?"
      ],
      action: "reminder_action",
      responses: {
        drink_water: "Sure! What time should I remind you?",
        pay_eb_tomorrow: "I'll schedule a reminder for tomorrow to pay your electricity bill.",
        alarm_6am: "I'll set an alarm for 6 AM, if alarm integration is available.",
        about_meeting: "Your meeting is scheduled for tomorrow at 10 AM. When should I remind you?",
        recurring_groceries: "I'll set a recurring Sunday grocery reminder.",
        call_father: "What time tonight should I remind you?",
        show: "Here are your upcoming reminders.",
        cancel_grocery: "Your grocery reminder has been cancelled.",
        today: "Here are your reminders for today.",
        snooze: "How long would you like to snooze it?",
        two_days_before: "I'll schedule a reminder two days before the event.",
        missed: "I'll check your overdue reminders."
      }
    }
  ]
};

const family = {
  category: "Family Management",
  intents: [
    {
      intent: "family_profile",
      examples: [
        "Who is in my family?",
        "Add my brother",
        "Add my father to family",
        "What is my father's birthday?",
        "What is my mother's name?",
        "Show father's details",
        "Update father's phone number",
        "What is my brother's age?",
        "Add father's anniversary",
        "Show all family birthdays",
        "Is my brother's birthday saved?",
        "When was the last family event?",
        "Show my family timeline"
      ],
      action: "family_action",
      responses: {
        who_is_in_family: "I'll show the family members saved in your Family Profile.",
        add_brother: "Sure! Please provide your brother's details.",
        add_father: "I'll check whether your father is already registered.",
        father_bday: "Your father's birthday is December 10.",
        mother_name: "Your mother's name is Sarah.",
        father_details: "I'll retrieve the authorized details from your Family Profile.",
        update_father_phone: "Please provide the new phone number.",
        brother_age: "I'll check your brother's saved date of birth.",
        add_anniversary: "What is the anniversary date?",
        all_birthdays: "Here are the saved birthdays of your family members.",
        brother_bday_saved: "I'll check the Family Calendar.",
        last_event: "Your most recent recorded family event was Diwal Gathering on November 01.",
        timeline: "Here is your family's saved timeline."
      }
    }
  ]
};

const documents = {
  category: "Document Vault",
  intents: [
    {
      intent: "fetch_document",
      examples: [
        "Fetch Sham's Aadhaar card",
        "Show my PAN card",
        "Find father's passport",
        "Get mother's voter ID",
        "Fetch my 10th marksheet",
        "Show my degree certificate",
        "Find my bank statement",
        "Get my insurance policy",
        "Show my property papers",
        "Find my birth certificate",
        "Download my driving licence",
        "Show all my PDFs"
      ],
      action: "doc_fetch",
      responses: {
        sham_aadhaar: "I'll check the Document Vault for Sham's Aadhaar card.",
        my_pan: "I'll search your uploaded PAN card.",
        father_passport: "I'll check your father's available documents.",
        mother_voter: "I'll search for your mother's voter ID.",
        my_10th: "I'll check your educational documents.",
        my_degree: "I'll search your Document Vault.",
        bank_statement: "I'll check your uploaded bank statements.",
        insurance_policy: "I'll search your insurance documents.",
        property_papers: "I'll check your property records.",
        birth_certificate: "I'll search for your birth certificate.",
        driving_licence: "I'll check its availability and access permissions.",
        all_pdfs: "I'll list the PDFs you are authorized to access."
      }
    },
    {
      intent: "missing_document_scenarios",
      examples: [
        "Fetch my Aadhaar",
        "Do you have father's PAN?",
        "Find my passport",
        "Show my degree certificate",
        "Fetch a document I never uploaded",
        "Where is my old certificate?",
        "Find Sham's documents"
      ],
      action: "doc_missing",
      responses: {
        my_aadhaar_missing: "I couldn't find your Aadhaar card. Please upload it first.",
        father_pan_missing: "Your father's PAN card is not currently available in the Document Vault.",
        my_passport_missing: "I couldn't find an uploaded passport. Would you like to upload it?",
        degree_missing: "Your degree certificate hasn't been found in the Document Vault.",
        never_uploaded: "I couldn't find that document. Please upload it before requesting retrieval.",
        old_cert_missing: "I couldn't locate that certificate. Could you provide its name or type?",
        sham_docs: "I'll list the available documents belonging to Sham that you can access."
      }
    },
    {
      intent: "upload_manage_document",
      examples: [
        "Upload Aadhaar",
        "Save father's PAN",
        "Add my new certificate",
        "Replace my old Aadhaar",
        "Delete old passport",
        "Summarize my PDF",
        "Read this document",
        "Search for a word in my PDF",
        "When did I upload Aadhaar?",
        "Is my passport expired?"
      ],
      action: "doc_manage",
      responses: {
        upload_aadhaar: "Please select your Aadhaar document to upload.",
        save_father_pan: "Please upload the PAN document and confirm the document owner's details.",
        add_cert: "Please upload the certificate.",
        replace_aadhaar: "Please upload the new document. I'll ask you to confirm before replacing the existing one.",
        delete_passport: "Which passport record should I delete? I'll ask for confirmation first.",
        summarize_pdf: "Please select the PDF you'd like me to summarize.",
        read_doc: "I'll extract and explain the readable content.",
        search_word: "Which word or phrase should I search for?",
        when_uploaded: "I'll check the Aadhaar upload date.",
        is_expired: "I'll check its expiry date, if available."
      }
    }
  ]
};

const tasks = {
  category: "Tasks & To-Do",
  intents: [
    {
      intent: "manage_tasks",
      examples: [
        "Add a task to complete my assignment",
        "Add a task to call the bank",
        "Create a task for tomorrow",
        "Mark assignment as completed",
        "Show pending tasks",
        "What tasks do I have today?",
        "Delete my completed tasks",
        "Change my task deadline",
        "Add high priority task",
        "What is my next task?",
        "Did I complete my assignment?",
        "Add a task to buy groceries"
      ],
      action: "task_action",
      responses: {
        assignment_added: "Your assignment task has been added.",
        bank_call: "Your bank call task has been added.",
        create_tomorrow: "What task would you like me to create?",
        assignment_done: "Your assignment task has been marked as completed.",
        pending: "Here are your incomplete tasks.",
        today: "Here are your tasks scheduled for today.",
        delete_completed: "Would you like me to remove all completed tasks?",
        change_deadline: "Which task and what new deadline?",
        high_priority: "Sure! What task should I mark as high priority?",
        next_task: "Your next scheduled task is Review documents.",
        did_i_complete: "I'll check its current status.",
        buy_groceries: "Your grocery shopping task has been added."
      }
    }
  ]
};

const notes = {
  category: "Notes and Memory",
  intents: [
    {
      intent: "manage_notes",
      examples: [
        "Save a note",
        "Remember father's birthday",
        "Remember that the Wi-Fi password is stored in my router records",
        "Add a note about my college project",
        "Show my notes",
        "Find my project notes",
        "Delete my old note",
        "Update my note",
        "What did I tell you yesterday?",
        "Save this information for later"
      ],
      action: "note_action",
      responses: {
        save_note: "Sure! What would you like me to save?",
        remember_father_bday: "I'll check whether his birthday is already saved.",
        wifi_security: "I'll save a note about that, without requesting or exposing the password.",
        project_note: "Please tell me what you'd like to remember.",
        show_notes: "Here are your saved notes.",
        find_project: "I'll search your saved notes for project-related information.",
        delete_note: "Which note would you like me to delete?",
        update_note: "Please tell me which note and what to change.",
        yesterday: "I'll search the available conversation history.",
        save_later: "Sure! I'll save it in your personal notes."
      }
    }
  ]
};

const household = {
  category: "Home & Household",
  intents: [
    {
      intent: "manage_household",
      examples: [
        "Add gas cylinder booking reminder",
        "When did I last book gas?",
        "Add a maintenance expense",
        "Remind me to service my bike",
        "Add AC service on Sunday",
        "Show house expenses",
        "Add water can to grocery list",
        "Is gas booking due?",
        "Add electricity meter reading",
        "Show my household inventory"
      ],
      action: "household_action",
      responses: {
        gas_reminder: "I'll create a reminder for your gas cylinder booking.",
        last_gas: "I'll check your saved gas booking records.",
        maintenance: "What was the amount and purpose?",
        bike_service: "When should I remind you?",
        ac_service: "I'll add AC servicing to your schedule for Sunday.",
        house_expenses: "I'll retrieve your recorded household expenses.",
        water_can: "Water can has been added to your grocery list.",
        gas_due: "I'll check your saved booking schedule.",
        meter_reading: "Please provide the meter reading and date.",
        inventory: "I'll list the household items saved in your records."
      }
    }
  ]
};

const tanglish = {
  category: "Tanglish (Tamil-English Commands)",
  intents: [
    {
      intent: "tanglish_commands",
      examples: [
        "Milk add pannunga",
        "Grocery list kaaminga",
        "EB bill paid nu mark pannunga",
        "Appa birthday eppo?",
        "Appa birthday already add pannirukoma?",
        "Naalaiku meeting add pannunga",
        "En Aadhaar card eduthu kudu",
        "Sham oda PAN card irukka?",
        "Intha expense add pannunga",
        "En pending bills enna?",
        "Reminder set pannunga",
        "Appa birthday ku reminder podu"
      ],
      action: "tanglish_bridge",
      responses: {
        milk_add: "Milk has been added to your grocery list.",
        list_kaaminga: "Here is your grocery list.",
        eb_paid: "Your electricity bill has been marked as paid.",
        appa_bday_eppo: "Your father's birthday is on December 10.",
        appa_already_added: "Yes! Your father's birthday is already saved on December 10.",
        meeting_add: "What time should I schedule your meeting tomorrow?",
        aadhaar_eduthu: "I'll search your Document Vault for your Aadhaar card.",
        sham_pan_irukka: "Let me check whether Sham's PAN card is available.",
        expense_add: "Sure! What was the expense amount and purpose?",
        pending_bills: "Here are your pending bills.",
        reminder_set: "Sure! What would you like me to remind you about?",
        appa_reminder: "I'll set a reminder for your father's birthday."
      }
    }
  ]
};

const errorHandling = {
  category: "Error Handling & Clarification",
  intents: [
    {
      intent: "clarifications_and_errors",
      examples: [
        "Fetch my card",
        "Fetch Sham's document",
        "Find the certificate",
        "Get that file",
        "I want my document",
        "Document not found",
        "File corrupted",
        "Upload failed",
        "Unsupported file",
        "Unauthorized access",
        "Unknown command"
      ],
      action: "clarify_or_error",
      responses: {
        fetch_my_card: "Which card would you like me to retrieve?",
        fetch_sham_doc: "Which document belonging to Sham are you looking for?",
        find_cert: "Whose certificate would you like me to find?",
        get_file: "Could you specify the file name or document type?",
        want_my_doc: "Sure! Which document do you need?",
        not_found: "I couldn't find the requested document. Please upload it first.",
        corrupted: "The uploaded file appears to be unreadable. Please upload another copy.",
        upload_failed: "The upload was unsuccessful. Please try again.",
        unsupported: "This file format is currently not supported. Please upload a supported file.",
        unauthorized: "You don't have permission to access this document.",
        unknown: "I'm not sure I understood that. Could you rephrase your request?"
      }
    }
  ]
};

// Write individual JSON files
const fileMap = {
  'greetings.json': greetings,
  'grocery_intents.json': grocery,
  'finance_intents.json': finance,
  'calendar_intents.json': calendar,
  'family_intents.json': family,
  'document_intents.json': documents,
  'reminder_intents.json': reminders,
  'task_intents.json': tasks,
  'notes_intents.json': notes,
  'household_intents.json': household,
  'tanglish_intents.json': tanglish,
  'error_handling.json': errorHandling
};

for (const [filename, content] of Object.entries(fileMap)) {
  fs.writeFileSync(path.join(trainingDir, filename), JSON.stringify(content, null, 2), 'utf-8');
}

// Build consolidated master_intents.json
const master = {
  title: "HomeBrain Complete Master Intent Catalogue",
  version: "2.0.0",
  total_categories: Object.keys(fileMap).length,
  response_conditions: {
    successfully_created: "Action completed and record created in the corresponding module.",
    already_exists: "Item or event already found in database with duplicate prevention.",
    not_found: "Item or document absent from vault/calendar with upload/creation prompt.",
    missing_information: "Clarification prompt asking for missing parameters (date, time, amount, type).",
    failed_operation: "System safety error prompt explaining failure."
  },
  modules: Object.values(fileMap)
};

fs.writeFileSync(path.join(trainingDir, 'master_intents.json'), JSON.stringify(master, null, 2), 'utf-8');
console.log(`✅ Successfully generated all 12 intent files and master_intents.json in ${trainingDir}`);

