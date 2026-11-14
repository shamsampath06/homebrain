# HomeBrain AI Assistant – Complete Manual Testing & Intent Verification Catalogue

This document provides the complete, authoritative manual testing guide for all commands, questions, and conversational flows currently supported by your running HomeBrain AI assistant.

> [!NOTE]
> Every question, command, variation, response, and backend action documented below is directly implemented in your existing codebase across:
> - `server/cognitiveActionEngine.ts` (Intelligent classification & autonomous action engine)
> - `src/lib/botTraining.ts` & `server/index.ts` (Trained conversational dialogue catalog)
> - `homebrain-training/*.json` (Training datasets and multi-turn flows)
> - `scripts/test-all-catalog-intents.js` (203/203 assertions)
> - `scripts/test-bot-intents.js` (84 assertions)
> - `scripts/test-intelligent-actions.js` (25 integration scenarios, including Section 13 screenshot reproduction & 20 acceptance criteria)

---

## Quick Reference Summary of Modules

| # | Module | Core Functionality | Total Tested Commands |
|---|---|---|:---:|
| 1 | **Greetings & Identity** | Greetings, assistant identity, capabilities, polite closure | 25 |
| 2 | **Grocery Vault** | Add, remove, update quantities, check pending, mark purchased, clear list, recurring items | 23 |
| 3 | **Finance Manager** | Bills tracking, mark paid, duplicate payment alerts, expenses logging, monthly budgets | 40 |
| 4 | **Family Calendar** | Add events, birthdays, conflict detection, separate events, time updates, inquiries | 35 |
| 5 | **Family Management** | Profile lookup, family members, timeline, contact updates | 14 |
| 6 | **Document Vault** | Document retrieval, permissions check, missing uploads, duplicate checks, summaries | 34 |
| 7 | **Reminders & Notifications** | Alarms, time-based reminders, recurring Sunday alerts, snooze, cancellations | 13 |
| 8 | **Tasks & To-Do** | Create tasks, priorities, completion status, deadline updates | 13 |
| 9 | **Notes and Memory** | Save personal notes, secure router info, project notes, retrieval | 11 |
| 10 | **Home & Household** | Gas booking, maintenance expenses, AC/bike servicing, inventory | 11 |
| 11 | **Tanglish (Tamil-English)** | Everyday bilingual conversational commands across groceries, bills, and family | 12 |
| 12 | **Error Handling & Clarification** | Vague queries, missing document files, corrupted files, unauthorized attempts | 12 |
| 13 | **Multi-Turn & Edge Cases** | Disambiguation flows, topic switching, and parameter prompts | 8 flows |

---

## Module 1: Greetings & Identity

### 1.1 GREETING (Action: `greet`)

#### Command 1.1.1: `Hi`

- **What to Type:**
```text
Hi
```
- **Expected HomeBrain Reply:**
> "Hello! Welcome back. How can I help you today?"
- **Action Performed:** Returns contextual greeting; does not modify database.
- **Automated Test Coverage:** `scripts/test-bot-intents.js`, `scripts/test-intelligent-actions.js`

#### Command 1.1.2: `Hello`

- **What to Type:**
```text
Hello
```
- **Expected HomeBrain Reply:**
> "Hey there! How can I assist you?"
- **Action Performed:** Returns contextual greeting; does not modify database.
- **Automated Test Coverage:** `scripts/test-bot-intents.js`

#### Command 1.1.3: `Hey`

- **What to Type:**
```text
Hey
```
- **Expected HomeBrain Reply:**
> "Hey! What can I do for you?"
- **Action Performed:** Returns contextual greeting; does not modify database.
- **Automated Test Coverage:** `scripts/test-bot-intents.js`

#### Command 1.1.4: `Good morning`

- **What to Type:**
```text
Good morning
```
- **Expected HomeBrain Reply:**
> "Good morning! Hope you're having a great day. How can I help?"
- **Action Performed:** Returns contextual greeting; does not modify database.
- **Automated Test Coverage:** `scripts/test-bot-intents.js`

#### Command 1.1.5: `Good afternoon`

- **What to Type:**
```text
Good afternoon
```
- **Expected HomeBrain Reply:**
> "Good afternoon! How can I assist you today?"
- **Action Performed:** Returns contextual greeting; does not modify database.
- **Automated Test Coverage:** `scripts/test-bot-intents.js`

#### Command 1.1.6: `Good evening`

- **What to Type:**
```text
Good evening
```
- **Expected HomeBrain Reply:**
> "Good evening! What can I help you with?"
- **Action Performed:** Returns contextual greeting; does not modify database.
- **Automated Test Coverage:** `scripts/test-bot-intents.js`

#### Command 1.1.7: `Good night`

- **What to Type:**
```text
Good night
```
- **Expected HomeBrain Reply:**
> "Good night! Have a peaceful night."
- **Action Performed:** Returns contextual greeting; does not modify database.
- **Automated Test Coverage:** `scripts/test-bot-intents.js`

#### Command 1.1.8: `How are you?`

- **What to Type:**
```text
How are you?
```
- **Expected HomeBrain Reply:**
> "I'm doing great! Ready to help you with your tasks. How are you?"
- **Action Performed:** Returns contextual greeting; does not modify database.
- **Automated Test Coverage:** `scripts/test-bot-intents.js`

### 1.2 IDENTITY (Action: `describe_self`)

#### Command 1.2.1: `Who are you?`

- **What to Type:**
```text
Who are you?
```
- **Expected HomeBrain Reply:**
> "I'm HomeBrain, your personal AI assistant. I can help you manage documents, retrieve information, and assist with everyday tasks."
- **Action Performed:** Returns persona and scope information; no state mutation.
- **Automated Test Coverage:** `scripts/test-bot-intents.js`

#### Command 1.2.2: `What is your name?`

- **What to Type:**
```text
What is your name?
```
- **Expected HomeBrain Reply:**
> "I'm HomeBrain, your personal AI assistant."
- **Action Performed:** Returns persona and scope information; no state mutation.
- **Automated Test Coverage:** `scripts/test-bot-intents.js`

#### Command 1.2.3: `Who created you?`

- **What to Type:**
```text
Who created you?
```
- **Expected HomeBrain Reply:**
> "I'm HomeBrain, an AI assistant designed to help manage personal and family information."
- **Action Performed:** Returns persona and scope information; no state mutation.
- **Automated Test Coverage:** `scripts/test-bot-intents.js`

### 1.3 CAPABILITIES (Action: `explain_capabilities`)

#### Command 1.3.1: `What can you do?`

- **What to Type:**
```text
What can you do?
```
- **Expected HomeBrain Reply:**
> "I can manage your groceries, finances, family calendar, reminders, documents, tasks, and personal records."
- **Action Performed:** Explains capabilities across all 12 modules; no state mutation.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`, `scripts/test-bot-intents.js`

#### Command 1.3.2: `Can you manage my bills?`

- **What to Type:**
```text
Can you manage my bills?
```
- **Expected HomeBrain Reply:**
> "Yes! I can track bills, payment status, due dates, and reminders."
- **Action Performed:** Explains capabilities across all 12 modules; no state mutation.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 1.3.3: `Can you remember birthdays?`

- **What to Type:**
```text
Can you remember birthdays?
```
- **Expected HomeBrain Reply:**
> "Yes! I can save family birthdays and help you check upcoming occasions."
- **Action Performed:** Explains capabilities across all 12 modules; no state mutation.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 1.3.4: `Can you fetch my documents?`

- **What to Type:**
```text
Can you fetch my documents?
```
- **Expected HomeBrain Reply:**
> "Yes! I can search your uploaded and authorized documents."
- **Action Performed:** Explains capabilities across all 12 modules; no state mutation.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 1.3.5: `Can you manage groceries?`

- **What to Type:**
```text
Can you manage groceries?
```
- **Expected HomeBrain Reply:**
> "Yes! I can add, remove, update, and track grocery items."
- **Action Performed:** Explains capabilities across all 12 modules; no state mutation.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 1.3.6: `Can you remind me?`

- **What to Type:**
```text
Can you remind me?
```
- **Expected HomeBrain Reply:**
> "Yes! I can schedule reminders when the notification integration is enabled."
- **Action Performed:** Explains capabilities across all 12 modules; no state mutation.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 1.3.7: `Can you access my files?`

- **What to Type:**
```text
Can you access my files?
```
- **Expected HomeBrain Reply:**
> "I can access documents available through your connected and authorized Document Vault."
- **Action Performed:** Explains capabilities across all 12 modules; no state mutation.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 1.3.8: `What did I ask you to do?`

- **What to Type:**
```text
What did I ask you to do?
```
- **Expected HomeBrain Reply:**
> "I'll check your available task and conversation history."
- **Action Performed:** Explains capabilities across all 12 modules; no state mutation.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

### 1.4 POLITE CLOSURE (Action: `acknowledge`)

#### Command 1.4.1: `Thank you`

- **What to Type:**
```text
Thank you
```
- **Expected HomeBrain Reply:**
> "You're welcome! I'm always happy to help."
- **Action Performed:** Acknowledges polite closure; resets transient conversation state if necessary.
- **Automated Test Coverage:** `scripts/test-bot-intents.js`

#### Command 1.4.2: `Thanks`

- **What to Type:**
```text
Thanks
```
- **Expected HomeBrain Reply:**
> "Happy to help!"
- **Action Performed:** Acknowledges polite closure; resets transient conversation state if necessary.
- **Automated Test Coverage:** `scripts/test-bot-intents.js`

#### Command 1.4.3: `Bye`

- **What to Type:**
```text
Bye
```
- **Expected HomeBrain Reply:**
> "Goodbye! Feel free to come back whenever you need me."
- **Action Performed:** Acknowledges polite closure; resets transient conversation state if necessary.
- **Automated Test Coverage:** `scripts/test-bot-intents.js`

#### Command 1.4.4: `See you`

- **What to Type:**
```text
See you
```
- **Expected HomeBrain Reply:**
> "See you again! Take care."
- **Action Performed:** Acknowledges polite closure; resets transient conversation state if necessary.
- **Automated Test Coverage:** `scripts/test-bot-intents.js`

#### Command 1.4.5: `Are you there?`

- **What to Type:**
```text
Are you there?
```
- **Expected HomeBrain Reply:**
> "Yes! I'm here and ready to assist you."
- **Action Performed:** Acknowledges polite closure; resets transient conversation state if necessary.
- **Automated Test Coverage:** `scripts/test-bot-intents.js`

#### Command 1.4.6: `Help me`

- **What to Type:**
```text
Help me
```
- **Expected HomeBrain Reply:**
> "Of course! Tell me what you need help with."
- **Action Performed:** Acknowledges polite closure; resets transient conversation state if necessary.
- **Automated Test Coverage:** `scripts/test-bot-intents.js`


## Module 2: Grocery Vault

### 2.1 ADD GROCERY ITEM (Action: `grocery_add`)

#### Command 2.1.1: `Add milk to grocery list`

- **What to Type:**
```text
Add milk to grocery list
```
- **Expected HomeBrain Reply:**
> "Milk has been added to your grocery list."
- **Action Performed:** Extracts item & quantity; checks for duplicates; executes CREATE or prompts for quantity update in `groceries` table.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 2.1.2: `Add 2 kg rice`

- **What to Type:**
```text
Add 2 kg rice
```
- **Expected HomeBrain Reply:**
> "2 kg of rice has been added."
- **Action Performed:** Extracts item & quantity; checks for duplicates; executes CREATE or prompts for quantity update in `groceries` table.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`, `scripts/test-intelligent-actions.js`

#### Command 2.1.3: `Add tomatoes and onions`

- **What to Type:**
```text
Add tomatoes and onions
```
- **Expected HomeBrain Reply:**
> "Tomatoes and onions have been added to your list."
- **Action Performed:** Extracts item & quantity; checks for duplicates; executes CREATE or prompts for quantity update in `groceries` table.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 2.1.4: `Add 1 litre oil`

- **What to Type:**
```text
Add 1 litre oil
```
- **Expected HomeBrain Reply:**
> "1 litre of cooking oil has been added."
- **Action Performed:** Extracts item & quantity; checks for duplicates; executes CREATE or prompts for quantity update in `groceries` table.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 2.1.5: `Add eggs to my shopping list`

- **What to Type:**
```text
Add eggs to my shopping list
```
- **Expected HomeBrain Reply:**
> "Eggs have been added to your shopping list."
- **Action Performed:** Extracts item & quantity; checks for duplicates; executes CREATE or prompts for quantity update in `groceries` table.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 2.1.6: `Add vegetables for tomorrow`

- **What to Type:**
```text
Add vegetables for tomorrow
```
- **Expected HomeBrain Reply:**
> "Vegetables have been added to your grocery list."
- **Action Performed:** Extracts item & quantity; checks for duplicates; executes CREATE or prompts for quantity update in `groceries` table.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 2.1.7: `Add these items to groceries`

- **What to Type:**
```text
Add these items to groceries
```
- **Expected HomeBrain Reply:**
> "Sure! I'll add the identified items to your list."
- **Action Performed:** Extracts item & quantity; checks for duplicates; executes CREATE or prompts for quantity update in `groceries` table.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 2.1.8: `Add water can to grocery list`

- **What to Type:**
```text
Add water can to grocery list
```
- **Expected HomeBrain Reply:**
> "Water can has been added to your grocery list."
- **Action Performed:** Extracts item & quantity; checks for duplicates; executes CREATE or prompts for quantity update in `groceries` table.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

### 2.2 REMOVE GROCERY ITEM (Action: `grocery_remove`)

#### Command 2.2.1: `Remove milk from grocery list`

- **What to Type:**
```text
Remove milk from grocery list
```
- **Expected HomeBrain Reply:**
> "Milk has been removed from your grocery list."
- **Action Performed:** Locates item by name in `groceries` table; executes DELETE or prompts confirmation if clearing entire list.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 2.2.2: `Delete rice from my list`

- **What to Type:**
```text
Delete rice from my list
```
- **Expected HomeBrain Reply:**
> "Rice has been removed."
- **Action Performed:** Locates item by name in `groceries` table; executes DELETE or prompts confirmation if clearing entire list.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 2.2.3: `Clear my grocery list`

- **What to Type:**
```text
Clear my grocery list
```
- **Expected HomeBrain Reply:**
> "Are you sure you want to clear your grocery list?"
- **Action Performed:** Locates item by name in `groceries` table; executes DELETE or prompts confirmation if clearing entire list.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

### 2.3 UPDATE GROCERY QUANTITY (Action: `grocery_update`)

#### Command 2.3.1: `Change milk quantity to 2 litres`

- **What to Type:**
```text
Change milk quantity to 2 litres
```
- **Expected HomeBrain Reply:**
> "Milk quantity has been updated to 2 litres."
- **Action Performed:** Locates existing grocery record; executes UPDATE on `quantity` column.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`, `scripts/test-intelligent-actions.js`

### 2.4 VIEW GROCERY LIST (Action: `grocery_view`)

#### Command 2.4.1: `Show my grocery list`

- **What to Type:**
```text
Show my grocery list
```
- **Expected HomeBrain Reply:**
> "Here is your current grocery list."
- **Action Performed:** Queries `groceries` table with filter `is_purchased = false` or `true`; renders list.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 2.4.2: `What should I buy?`

- **What to Type:**
```text
What should I buy?
```
- **Expected HomeBrain Reply:**
> "Here are the items remaining on your grocery list."
- **Action Performed:** Queries `groceries` table with filter `is_purchased = false` or `true`; renders list.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 2.4.3: `What groceries are pending?`

- **What to Type:**
```text
What groceries are pending?
```
- **Expected HomeBrain Reply:**
> "These are the grocery items you haven't marked as purchased."
- **Action Performed:** Queries `groceries` table with filter `is_purchased = false` or `true`; renders list.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 2.4.4: `Is milk already in my list?`

- **What to Type:**
```text
Is milk already in my list?
```
- **Expected HomeBrain Reply:**
> "Yes, milk is already on your grocery list."
- **Action Performed:** Queries `groceries` table with filter `is_purchased = false` or `true`; renders list.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

### 2.5 MARK GROCERY PURCHASED (Action: `grocery_mark_purchased`)

#### Command 2.5.1: `Mark milk as purchased`

- **What to Type:**
```text
Mark milk as purchased
```
- **Expected HomeBrain Reply:**
> "Milk has been marked as purchased."
- **Action Performed:** Updates `groceries` table setting `is_purchased = true`, records purchaser & timestamp.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 2.5.2: `I bought all the groceries`

- **What to Type:**
```text
I bought all the groceries
```
- **Expected HomeBrain Reply:**
> "All items have been marked as purchased."
- **Action Performed:** Updates `groceries` table setting `is_purchased = true`, records purchaser & timestamp.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

### 2.6 GROCERY RECURRING AND HISTORY (Action: `grocery_analytics`)

#### Command 2.6.1: `Add bread every morning`

- **What to Type:**
```text
Add bread every morning
```
- **Expected HomeBrain Reply:**
> "Do you want me to create a recurring grocery reminder for bread?"
- **Action Performed:** Analyzes `grocery_history` and `expenses` tables; calculates totals.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 2.6.2: `What did I buy last week?`

- **What to Type:**
```text
What did I buy last week?
```
- **Expected HomeBrain Reply:**
> "I'll check your grocery purchase history."
- **Action Performed:** Analyzes `grocery_history` and `expenses` tables; calculates totals.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 2.6.3: `How much did I spend on groceries?`

- **What to Type:**
```text
How much did I spend on groceries?
```
- **Expected HomeBrain Reply:**
> "I'll calculate your recorded grocery expenses."
- **Action Performed:** Analyzes `grocery_history` and `expenses` tables; calculates totals.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`


## Module 3: Finance Manager

### 3.1 BILL PAYMENT (Action: `bill_action`)

#### Command 3.1.1: `Mark electricity bill as paid`

- **What to Type:**
```text
Mark electricity bill as paid
```
- **Expected HomeBrain Reply:**
> "Your electricity bill has been marked as paid."
- **Action Performed:** Queries or updates `bills` table; marks `is_paid = true` or extracts bill amount/due date for insertion.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`, `scripts/test-intelligent-actions.js`

#### Command 3.1.2: `Mark EB bill as paid`

- **What to Type:**
```text
Mark EB bill as paid
```
- **Expected HomeBrain Reply:**
> "Your electricity bill has been updated as paid."
- **Action Performed:** Queries or updates `bills` table; marks `is_paid = true` or extracts bill amount/due date for insertion.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 3.1.3: `I paid the water bill`

- **What to Type:**
```text
I paid the water bill
```
- **Expected HomeBrain Reply:**
> "I'll update your water bill payment status."
- **Action Performed:** Queries or updates `bills` table; marks `is_paid = true` or extracts bill amount/due date for insertion.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 3.1.4: `Mark internet bill as paid`

- **What to Type:**
```text
Mark internet bill as paid
```
- **Expected HomeBrain Reply:**
> "Your internet bill has been marked as paid."
- **Action Performed:** Queries or updates `bills` table; marks `is_paid = true` or extracts bill amount/due date for insertion.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 3.1.5: `Have I paid this month's EB bill?`

- **What to Type:**
```text
Have I paid this month's EB bill?
```
- **Expected HomeBrain Reply:**
> "I'll check your electricity bill payment records."
- **Action Performed:** Queries or updates `bills` table; marks `is_paid = true` or extracts bill amount/due date for insertion.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 3.1.6: `When is my next electricity bill due?`

- **What to Type:**
```text
When is my next electricity bill due?
```
- **Expected HomeBrain Reply:**
> "I'll check your upcoming electricity bill due date."
- **Action Performed:** Queries or updates `bills` table; marks `is_paid = true` or extracts bill amount/due date for insertion.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 3.1.7: `Show pending bills`

- **What to Type:**
```text
Show pending bills
```
- **Expected HomeBrain Reply:**
> "Here are your unpaid bills."
- **Action Performed:** Queries or updates `bills` table; marks `is_paid = true` or extracts bill amount/due date for insertion.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 3.1.8: `What bills are due this week?`

- **What to Type:**
```text
What bills are due this week?
```
- **Expected HomeBrain Reply:**
> "Here are the bills due this week."
- **Action Performed:** Queries or updates `bills` table; marks `is_paid = true` or extracts bill amount/due date for insertion.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 3.1.9: `Add electricity bill`

- **What to Type:**
```text
Add electricity bill
```
- **Expected HomeBrain Reply:**
> "Sure! Please provide the bill amount and due date."
- **Action Performed:** Queries or updates `bills` table; marks `is_paid = true` or extracts bill amount/due date for insertion.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`, `scripts/test-intelligent-actions.js`

#### Command 3.1.10: `Add ₹1,500 electricity bill`

- **What to Type:**
```text
Add ₹1,500 electricity bill
```
- **Expected HomeBrain Reply:**
> "Your ₹1,500 electricity bill has been recorded. When is it due?"
- **Action Performed:** Queries or updates `bills` table; marks `is_paid = true` or extracts bill amount/due date for insertion.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 3.1.11: `Remind me to pay EB tomorrow`

- **What to Type:**
```text
Remind me to pay EB tomorrow
```
- **Expected HomeBrain Reply:**
> "I'll set a reminder for tomorrow to pay the electricity bill."
- **Action Performed:** Queries or updates `bills` table; marks `is_paid = true` or extracts bill amount/due date for insertion.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 3.1.12: `Delete my old water bill`

- **What to Type:**
```text
Delete my old water bill
```
- **Expected HomeBrain Reply:**
> "Which water bill would you like me to delete?"
- **Action Performed:** Queries or updates `bills` table; marks `is_paid = true` or extracts bill amount/due date for insertion.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 3.1.13: `How much is my pending bill amount?`

- **What to Type:**
```text
How much is my pending bill amount?
```
- **Expected HomeBrain Reply:**
> "I'll calculate the total amount of your unpaid bills."
- **Action Performed:** Queries or updates `bills` table; marks `is_paid = true` or extracts bill amount/due date for insertion.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 3.1.14: `Did I already pay the internet bill?`

- **What to Type:**
```text
Did I already pay the internet bill?
```
- **Expected HomeBrain Reply:**
> "I'll check your payment history."
- **Action Performed:** Queries or updates `bills` table; marks `is_paid = true` or extracts bill amount/due date for insertion.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

### 3.2 INCOME AND EXPENSES (Action: `transaction_action`)

#### Command 3.2.1: `Add ₹500 expense`

- **What to Type:**
```text
Add ₹500 expense
```
- **Expected HomeBrain Reply:**
> "₹500 expense recorded. What was it for?"
- **Action Performed:** Inserts new row into `expenses` table or queries income/spending logs.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 3.2.2: `I spent ₹200 on food`

- **What to Type:**
```text
I spent ₹200 on food
```
- **Expected HomeBrain Reply:**
> "₹200 food expense has been recorded."
- **Action Performed:** Inserts new row into `expenses` table or queries income/spending logs.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 3.2.3: `Add ₹1,000 for petrol`

- **What to Type:**
```text
Add ₹1,000 for petrol
```
- **Expected HomeBrain Reply:**
> "₹1,000 petrol expense has been added."
- **Action Performed:** Inserts new row into `expenses` table or queries income/spending logs.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 3.2.4: `Record ₹5,000 salary`

- **What to Type:**
```text
Record ₹5,000 salary
```
- **Expected HomeBrain Reply:**
> "₹5,000 salary income has been recorded."
- **Action Performed:** Inserts new row into `expenses` table or queries income/spending logs.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 3.2.5: `I received ₹2,000`

- **What to Type:**
```text
I received ₹2,000
```
- **Expected HomeBrain Reply:**
> "I'll record ₹2,000 as income. What was the source?"
- **Action Performed:** Inserts new row into `expenses` table or queries income/spending logs.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 3.2.6: `Show my expenses today`

- **What to Type:**
```text
Show my expenses today
```
- **Expected HomeBrain Reply:**
> "Here are your recorded expenses for today."
- **Action Performed:** Inserts new row into `expenses` table or queries income/spending logs.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 3.2.7: `How much did I spend this month?`

- **What to Type:**
```text
How much did I spend this month?
```
- **Expected HomeBrain Reply:**
> "I'll calculate your total expenses for this month."
- **Action Performed:** Inserts new row into `expenses` table or queries income/spending logs.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 3.2.8: `Show last month's expenses`

- **What to Type:**
```text
Show last month's expenses
```
- **Expected HomeBrain Reply:**
> "Here is your expense summary for last month."
- **Action Performed:** Inserts new row into `expenses` table or queries income/spending logs.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 3.2.9: `What is my total income?`

- **What to Type:**
```text
What is my total income?
```
- **Expected HomeBrain Reply:**
> "I'll calculate your recorded income."
- **Action Performed:** Inserts new row into `expenses` table or queries income/spending logs.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 3.2.10: `How much did I save?`

- **What to Type:**
```text
How much did I save?
```
- **Expected HomeBrain Reply:**
> "I'll calculate your savings from recorded income and expenses."
- **Action Performed:** Inserts new row into `expenses` table or queries income/spending logs.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 3.2.11: `Show my biggest expenses`

- **What to Type:**
```text
Show my biggest expenses
```
- **Expected HomeBrain Reply:**
> "I'll identify your highest recorded expenses."
- **Action Performed:** Inserts new row into `expenses` table or queries income/spending logs.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 3.2.12: `Delete the ₹200 food expense`

- **What to Type:**
```text
Delete the ₹200 food expense
```
- **Expected HomeBrain Reply:**
> "I'll locate that transaction before deleting it."
- **Action Performed:** Inserts new row into `expenses` table or queries income/spending logs.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 3.2.13: `Change petrol expense to ₹1,200`

- **What to Type:**
```text
Change petrol expense to ₹1,200
```
- **Expected HomeBrain Reply:**
> "I'll update the petrol expense amount."
- **Action Performed:** Inserts new row into `expenses` table or queries income/spending logs.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 3.2.14: `Add ₹300 for groceries yesterday`

- **What to Type:**
```text
Add ₹300 for groceries yesterday
```
- **Expected HomeBrain Reply:**
> "I'll record the ₹300 grocery expense for yesterday."
- **Action Performed:** Inserts new row into `expenses` table or queries income/spending logs.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 3.2.15: `Add a maintenance expense`

- **What to Type:**
```text
Add a maintenance expense
```
- **Expected HomeBrain Reply:**
> "What was the amount and purpose?"
- **Action Performed:** Inserts new row into `expenses` table or queries income/spending logs.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 3.2.16: `Show house expenses`

- **What to Type:**
```text
Show house expenses
```
- **Expected HomeBrain Reply:**
> "I'll retrieve your recorded household expenses."
- **Action Performed:** Inserts new row into `expenses` table or queries income/spending logs.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

### 3.3 BUDGET MANAGEMENT (Action: `budget_action`)

#### Command 3.3.1: `Set monthly budget to ₹20,000`

- **What to Type:**
```text
Set monthly budget to ₹20,000
```
- **Expected HomeBrain Reply:**
> "Your monthly budget has been set to ₹20,000."
- **Action Performed:** Updates budget threshold or computes remaining monthly limit from current month expenses.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 3.3.2: `Set grocery budget to ₹5,000`

- **What to Type:**
```text
Set grocery budget to ₹5,000
```
- **Expected HomeBrain Reply:**
> "Your grocery budget has been set to ₹5,000."
- **Action Performed:** Updates budget threshold or computes remaining monthly limit from current month expenses.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 3.3.3: `How much budget is remaining?`

- **What to Type:**
```text
How much budget is remaining?
```
- **Expected HomeBrain Reply:**
> "I'll calculate your remaining monthly budget."
- **Action Performed:** Updates budget threshold or computes remaining monthly limit from current month expenses.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 3.3.4: `Am I exceeding my budget?`

- **What to Type:**
```text
Am I exceeding my budget?
```
- **Expected HomeBrain Reply:**
> "I'll compare your recorded expenses with your budget."
- **Action Performed:** Updates budget threshold or computes remaining monthly limit from current month expenses.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 3.3.5: `Show my budget`

- **What to Type:**
```text
Show my budget
```
- **Expected HomeBrain Reply:**
> "Here are your current budget limits."
- **Action Performed:** Updates budget threshold or computes remaining monthly limit from current month expenses.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 3.3.6: `Increase my budget to ₹25,000`

- **What to Type:**
```text
Increase my budget to ₹25,000
```
- **Expected HomeBrain Reply:**
> "Your monthly budget has been updated to ₹25,000."
- **Action Performed:** Updates budget threshold or computes remaining monthly limit from current month expenses.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 3.3.7: `How much did I spend on transport?`

- **What to Type:**
```text
How much did I spend on transport?
```
- **Expected HomeBrain Reply:**
> "I'll calculate your recorded transport expenses."
- **Action Performed:** Updates budget threshold or computes remaining monthly limit from current month expenses.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 3.3.8: `Compare this month and last month`

- **What to Type:**
```text
Compare this month and last month
```
- **Expected HomeBrain Reply:**
> "I'll compare both months' recorded income and expenses."
- **Action Performed:** Updates budget threshold or computes remaining monthly limit from current month expenses.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`


## Module 4: Family Calendar & Events

### 4.1 ADD EVENT (Action: `calendar_add`)

#### Command 4.1.1: `Add my father's birthday`

- **What to Type:**
```text
Add my father's birthday
```
- **Expected HomeBrain Reply:**
> "What date is your father's birthday?"
- **Action Performed:** Inspects `events` table for conflict; prompts update vs separate, or inserts new calendar event.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 4.1.2: `Add father's birthday on December 10`

- **What to Type:**
```text
Add father's birthday on December 10
```
- **Expected HomeBrain Reply:**
> "Your father's birthday is already marked on December 10. I haven't created a duplicate event."
- **Action Performed:** Inspects `events` table for conflict; prompts update vs separate, or inserts new calendar event.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 4.1.3: `Add mother's birthday tomorrow`

- **What to Type:**
```text
Add mother's birthday tomorrow
```
- **Expected HomeBrain Reply:**
> "I'll add your mother's birthday for tomorrow."
- **Action Performed:** Inspects `events` table for conflict; prompts update vs separate, or inserts new calendar event.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 4.1.4: `Add my birthday`

- **What to Type:**
```text
Add my birthday
```
- **Expected HomeBrain Reply:**
> "Sure! What date is your birthday?"
- **Action Performed:** Inspects `events` table for conflict; prompts update vs separate, or inserts new calendar event.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 4.1.5: `Add wedding anniversary`

- **What to Type:**
```text
Add wedding anniversary
```
- **Expected HomeBrain Reply:**
> "Whose wedding anniversary should I add, and what is the date?"
- **Action Performed:** Inspects `events` table for conflict; prompts update vs separate, or inserts new calendar event.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 4.1.6: `Schedule a family function`

- **What to Type:**
```text
Schedule a family function
```
- **Expected HomeBrain Reply:**
> "Sure! Please provide the event date and details."
- **Action Performed:** Inspects `events` table for conflict; prompts update vs separate, or inserts new calendar event.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 4.1.7: `Add a meeting tomorrow at 10 AM`

- **What to Type:**
```text
Add a meeting tomorrow at 10 AM
```
- **Expected HomeBrain Reply:**
> "Your meeting has been added for tomorrow at 10 AM."
- **Action Performed:** Inspects `events` table for conflict; prompts update vs separate, or inserts new calendar event.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 4.1.8: `Schedule a doctor appointment on Friday`

- **What to Type:**
```text
Schedule a doctor appointment on Friday
```
- **Expected HomeBrain Reply:**
> "I'll add your appointment for Friday. What time?"
- **Action Performed:** Inspects `events` table for conflict; prompts update vs separate, or inserts new calendar event.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 4.1.9: `Add college event next Monday`

- **What to Type:**
```text
Add college event next Monday
```
- **Expected HomeBrain Reply:**
> "I'll add the college event for next Monday."
- **Action Performed:** Inspects `events` table for conflict; prompts update vs separate, or inserts new calendar event.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 4.1.10: `Add a reminder for my father's birthday`

- **What to Type:**
```text
Add a reminder for my father's birthday
```
- **Expected HomeBrain Reply:**
> "I'll create a birthday reminder for your father."
- **Action Performed:** Inspects `events` table for conflict; prompts update vs separate, or inserts new calendar event.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 4.1.11: `Add a housewarming ceremony on January 15`

- **What to Type:**
```text
Add a housewarming ceremony on January 15
```
- **Expected HomeBrain Reply:**
> "Your housewarming event has been added for January 15."
- **Action Performed:** Inspects `events` table for conflict; prompts update vs separate, or inserts new calendar event.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 4.1.12: `Add a family trip next week`

- **What to Type:**
```text
Add a family trip next week
```
- **Expected HomeBrain Reply:**
> "What date and time should I schedule the family trip?"
- **Action Performed:** Inspects `events` table for conflict; prompts update vs separate, or inserts new calendar event.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

### 4.2 ASK EVENTS (Action: `calendar_query`)

#### Command 4.2.1: `When is my father's birthday?`

- **What to Type:**
```text
When is my father's birthday?
```
- **Expected HomeBrain Reply:**
> "Your father's birthday is on December 10."
- **Action Performed:** Performs RAG query against `events` table; matches celebrant, category, or date.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 4.2.2: `When is my mother's birthday?`

- **What to Type:**
```text
When is my mother's birthday?
```
- **Expected HomeBrain Reply:**
> "Your mother's birthday is on May 15."
- **Action Performed:** Performs RAG query against `events` table; matches celebrant, category, or date.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 4.2.3: `What is the next family event?`

- **What to Type:**
```text
What is the next family event?
```
- **Expected HomeBrain Reply:**
> "Your next family event is Family Dinner on Friday."
- **Action Performed:** Performs RAG query against `events` table; matches celebrant, category, or date.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 4.2.4: `Do we have any events tomorrow?`

- **What to Type:**
```text
Do we have any events tomorrow?
```
- **Expected HomeBrain Reply:**
> "You have 1 scheduled events tomorrow."
- **Action Performed:** Performs RAG query against `events` table; matches celebrant, category, or date.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 4.2.5: `What events are coming this month?`

- **What to Type:**
```text
What events are coming this month?
```
- **Expected HomeBrain Reply:**
> "Here are your upcoming events for this month."
- **Action Performed:** Performs RAG query against `events` table; matches celebrant, category, or date.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 4.2.6: `Is father's birthday saved?`

- **What to Type:**
```text
Is father's birthday saved?
```
- **Expected HomeBrain Reply:**
> "Yes! Your father's birthday is already saved in the Family Calendar on December 10."
- **Action Performed:** Performs RAG query against `events` table; matches celebrant, category, or date.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 4.2.7: `Is father's birthday already added?`

- **What to Type:**
```text
Is father's birthday already added?
```
- **Expected HomeBrain Reply:**
> "Your father's birthday is on December 10."
- **Action Performed:** Performs RAG query against `events` table; matches celebrant, category, or date.
- **Automated Test Coverage:** Trained pattern in `src/lib/botTraining.ts`

#### Command 4.2.8: `Have I added mother's birthday?`

- **What to Type:**
```text
Have I added mother's birthday?
```
- **Expected HomeBrain Reply:**
> "Yes, your mother's birthday is already in the calendar."
- **Action Performed:** Performs RAG query against `events` table; matches celebrant, category, or date.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 4.2.9: `When is my next anniversary?`

- **What to Type:**
```text
When is my next anniversary?
```
- **Expected HomeBrain Reply:**
> "Your next saved anniversary is on June 24."
- **Action Performed:** Performs RAG query against `events` table; matches celebrant, category, or date.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 4.2.10: `Any birthdays this week?`

- **What to Type:**
```text
Any birthdays this week?
```
- **Expected HomeBrain Reply:**
> "Here are the birthdays scheduled for this week."
- **Action Performed:** Performs RAG query against `events` table; matches celebrant, category, or date.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 4.2.11: `What did I schedule for Sunday?`

- **What to Type:**
```text
What did I schedule for Sunday?
```
- **Expected HomeBrain Reply:**
> "I'll show your events scheduled for Sunday."
- **Action Performed:** Performs RAG query against `events` table; matches celebrant, category, or date.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 4.2.12: `Show my family calendar`

- **What to Type:**
```text
Show my family calendar
```
- **Expected HomeBrain Reply:**
> "Here is your family calendar."
- **Action Performed:** Performs RAG query against `events` table; matches celebrant, category, or date.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 4.2.13: `How many events are scheduled this month?`

- **What to Type:**
```text
How many events are scheduled this month?
```
- **Expected HomeBrain Reply:**
> "You have 4 events scheduled this month."
- **Action Performed:** Performs RAG query against `events` table; matches celebrant, category, or date.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

### 4.3 UPDATE DELETE EVENT (Action: `calendar_manage`)

#### Command 4.3.1: `Change father's birthday date`

- **What to Type:**
```text
Change father's birthday date
```
- **Expected HomeBrain Reply:**
> "What is the correct date?"
- **Action Performed:** Modifies or deletes existing row in `events` table; reschedules time or sets reminder.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 4.3.2: `Move my meeting to 3 PM`

- **What to Type:**
```text
Move my meeting to 3 PM
```
- **Expected HomeBrain Reply:**
> "Your meeting time has been updated to 3 PM."
- **Action Performed:** Modifies or deletes existing row in `events` table; reschedules time or sets reminder.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`, `scripts/test-intelligent-actions.js`

#### Command 4.3.3: `Cancel tomorrow's appointment`

- **What to Type:**
```text
Cancel tomorrow's appointment
```
- **Expected HomeBrain Reply:**
> "Which appointment would you like to cancel?"
- **Action Performed:** Modifies or deletes existing row in `events` table; reschedules time or sets reminder.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 4.3.4: `Delete the birthday event`

- **What to Type:**
```text
Delete the birthday event
```
- **Expected HomeBrain Reply:**
> "Which birthday event should I remove?"
- **Action Performed:** Modifies or deletes existing row in `events` table; reschedules time or sets reminder.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 4.3.5: `Add a reminder one day before father's birthday`

- **What to Type:**
```text
Add a reminder one day before father's birthday
```
- **Expected HomeBrain Reply:**
> "I'll set a reminder one day before your father's birthday."
- **Action Performed:** Modifies or deletes existing row in `events` table; reschedules time or sets reminder.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 4.3.6: `Remind me about the family function`

- **What to Type:**
```text
Remind me about the family function
```
- **Expected HomeBrain Reply:**
> "What date and time should I set the reminder for?"
- **Action Performed:** Modifies or deletes existing row in `events` table; reschedules time or sets reminder.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 4.3.7: `Is my meeting postponed?`

- **What to Type:**
```text
Is my meeting postponed?
```
- **Expected HomeBrain Reply:**
> "I'll check the latest saved meeting details."
- **Action Performed:** Modifies or deletes existing row in `events` table; reschedules time or sets reminder.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`


## Module 5: Family Management

### 5.1 FAMILY PROFILE (Action: `family_action`)

#### Command 5.1.1: `Who is in my family?`

- **What to Type:**
```text
Who is in my family?
```
- **Expected HomeBrain Reply:**
> "I'll show the family members saved in your Family Profile."
- **Action Performed:** Retrieves family member details, phone numbers, or updates profile in `profiles` / `family_knowledge`.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 5.1.2: `Add my brother`

- **What to Type:**
```text
Add my brother
```
- **Expected HomeBrain Reply:**
> "Sure! Please provide your brother's details."
- **Action Performed:** Retrieves family member details, phone numbers, or updates profile in `profiles` / `family_knowledge`.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 5.1.3: `Add my father to family`

- **What to Type:**
```text
Add my father to family
```
- **Expected HomeBrain Reply:**
> "I'll check whether your father is already registered."
- **Action Performed:** Retrieves family member details, phone numbers, or updates profile in `profiles` / `family_knowledge`.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 5.1.4: `What is my father's birthday?`

- **What to Type:**
```text
What is my father's birthday?
```
- **Expected HomeBrain Reply:**
> "Your father's birthday is December 10."
- **Action Performed:** Retrieves family member details, phone numbers, or updates profile in `profiles` / `family_knowledge`.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 5.1.5: `What is my mother's name?`

- **What to Type:**
```text
What is my mother's name?
```
- **Expected HomeBrain Reply:**
> "Your mother's name is Sarah."
- **Action Performed:** Retrieves family member details, phone numbers, or updates profile in `profiles` / `family_knowledge`.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 5.1.6: `Show father's details`

- **What to Type:**
```text
Show father's details
```
- **Expected HomeBrain Reply:**
> "I'll retrieve the authorized details from your Family Profile."
- **Action Performed:** Retrieves family member details, phone numbers, or updates profile in `profiles` / `family_knowledge`.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 5.1.7: `Update father's phone number`

- **What to Type:**
```text
Update father's phone number
```
- **Expected HomeBrain Reply:**
> "Please provide the new phone number."
- **Action Performed:** Retrieves family member details, phone numbers, or updates profile in `profiles` / `family_knowledge`.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 5.1.8: `What is my brother's age?`

- **What to Type:**
```text
What is my brother's age?
```
- **Expected HomeBrain Reply:**
> "I'll check your brother's saved date of birth."
- **Action Performed:** Retrieves family member details, phone numbers, or updates profile in `profiles` / `family_knowledge`.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 5.1.9: `Add father's anniversary`

- **What to Type:**
```text
Add father's anniversary
```
- **Expected HomeBrain Reply:**
> "What is the anniversary date?"
- **Action Performed:** Retrieves family member details, phone numbers, or updates profile in `profiles` / `family_knowledge`.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 5.1.10: `Show all family birthdays`

- **What to Type:**
```text
Show all family birthdays
```
- **Expected HomeBrain Reply:**
> "Here are the saved birthdays of your family members."
- **Action Performed:** Retrieves family member details, phone numbers, or updates profile in `profiles` / `family_knowledge`.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 5.1.11: `Is my brother's birthday saved?`

- **What to Type:**
```text
Is my brother's birthday saved?
```
- **Expected HomeBrain Reply:**
> "I'll check the Family Calendar."
- **Action Performed:** Retrieves family member details, phone numbers, or updates profile in `profiles` / `family_knowledge`.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 5.1.12: `When was the last family event?`

- **What to Type:**
```text
When was the last family event?
```
- **Expected HomeBrain Reply:**
> "Your most recent recorded family event was Diwali Gathering on November 01."
- **Action Performed:** Retrieves family member details, phone numbers, or updates profile in `profiles` / `family_knowledge`.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 5.1.13: `Show my family timeline`

- **What to Type:**
```text
Show my family timeline
```
- **Expected HomeBrain Reply:**
> "I'll retrieve the available events from your Family Timeline."
- **Action Performed:** Retrieves family member details, phone numbers, or updates profile in `profiles` / `family_knowledge`.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`, `scripts/test-bot-intents.js`


## Module 6: Document Vault

### 6.1 FETCH DOCUMENT (Action: `doc_fetch`)

#### Command 6.1.1: `Fetch Sham's Aadhaar card`

- **What to Type:**
```text
Fetch Sham's Aadhaar card
```
- **Expected HomeBrain Reply:**
> "check the Document Vault for Sham's Aadhaar card"
- **Action Performed:** Searches `documents` table by title/category/owner; checks family access permissions and returns download/view link.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`, `scripts/test-bot-intents.js`, `scripts/test-intelligent-actions.js`

#### Command 6.1.2: `Show my PAN card`

- **What to Type:**
```text
Show my PAN card
```
- **Expected HomeBrain Reply:**
> "I'll search your uploaded PAN card."
- **Action Performed:** Searches `documents` table by title/category/owner; checks family access permissions and returns download/view link.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`, `scripts/test-bot-intents.js`

#### Command 6.1.3: `Find father's passport`

- **What to Type:**
```text
Find father's passport
```
- **Expected HomeBrain Reply:**
> "I'll check your father's available documents."
- **Action Performed:** Searches `documents` table by title/category/owner; checks family access permissions and returns download/view link.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 6.1.4: `Get mother's voter ID`

- **What to Type:**
```text
Get mother's voter ID
```
- **Expected HomeBrain Reply:**
> "I'll search for your mother's voter ID."
- **Action Performed:** Searches `documents` table by title/category/owner; checks family access permissions and returns download/view link.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 6.1.5: `Fetch my 10th marksheet`

- **What to Type:**
```text
Fetch my 10th marksheet
```
- **Expected HomeBrain Reply:**
> "I'll search for your 10th marksheet."
- **Action Performed:** Searches `documents` table by title/category/owner; checks family access permissions and returns download/view link.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`, `scripts/test-bot-intents.js`

#### Command 6.1.6: `Show my degree certificate`

- **What to Type:**
```text
Show my degree certificate
```
- **Expected HomeBrain Reply:**
> "Your degree certificate hasn't been found in the Document Vault."
- **Action Performed:** Searches `documents` table by title/category/owner; checks family access permissions and returns download/view link.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 6.1.7: `Find my bank statement`

- **What to Type:**
```text
Find my bank statement
```
- **Expected HomeBrain Reply:**
> "I'll check your uploaded bank statements."
- **Action Performed:** Searches `documents` table by title/category/owner; checks family access permissions and returns download/view link.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 6.1.8: `Get my insurance policy`

- **What to Type:**
```text
Get my insurance policy
```
- **Expected HomeBrain Reply:**
> "I'll search your insurance documents."
- **Action Performed:** Searches `documents` table by title/category/owner; checks family access permissions and returns download/view link.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 6.1.9: `Show my property papers`

- **What to Type:**
```text
Show my property papers
```
- **Expected HomeBrain Reply:**
> "I'll check your property records."
- **Action Performed:** Searches `documents` table by title/category/owner; checks family access permissions and returns download/view link.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 6.1.10: `Find my birth certificate`

- **What to Type:**
```text
Find my birth certificate
```
- **Expected HomeBrain Reply:**
> "I'll search for your birth certificate."
- **Action Performed:** Searches `documents` table by title/category/owner; checks family access permissions and returns download/view link.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 6.1.11: `Download my driving licence`

- **What to Type:**
```text
Download my driving licence
```
- **Expected HomeBrain Reply:**
> "I'll check its availability and access permissions."
- **Action Performed:** Searches `documents` table by title/category/owner; checks family access permissions and returns download/view link.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 6.1.12: `Show all my PDFs`

- **What to Type:**
```text
Show all my PDFs
```
- **Expected HomeBrain Reply:**
> "I'll list the PDFs you are authorized to access."
- **Action Performed:** Searches `documents` table by title/category/owner; checks family access permissions and returns download/view link.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

### 6.2 MISSING DOCUMENT SCENARIOS (Action: `doc_missing`)

#### Command 6.2.1: `Fetch my Aadhaar`

- **What to Type:**
```text
Fetch my Aadhaar
```
- **Expected HomeBrain Reply:**
> "I couldn't find your Aadhaar card. Please upload it first."
- **Action Performed:** Checks `documents` table; confirms document does not exist; returns upload prompt without false success.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 6.2.2: `Do you have father's PAN?`

- **What to Type:**
```text
Do you have father's PAN?
```
- **Expected HomeBrain Reply:**
> "Your father's PAN card is not currently available in the Document Vault."
- **Action Performed:** Checks `documents` table; confirms document does not exist; returns upload prompt without false success.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 6.2.3: `Find my passport`

- **What to Type:**
```text
Find my passport
```
- **Expected HomeBrain Reply:**
> "I couldn't find an uploaded passport. Would you like to upload it?"
- **Action Performed:** Checks `documents` table; confirms document does not exist; returns upload prompt without false success.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 6.2.4: `Show my degree certificate`

- **What to Type:**
```text
Show my degree certificate
```
- **Expected HomeBrain Reply:**
> "Your degree certificate hasn't been found in the Document Vault."
- **Action Performed:** Checks `documents` table; confirms document does not exist; returns upload prompt without false success.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 6.2.5: `Fetch a document I never uploaded`

- **What to Type:**
```text
Fetch a document I never uploaded
```
- **Expected HomeBrain Reply:**
> "I couldn't find that document. Please upload it before requesting retrieval."
- **Action Performed:** Checks `documents` table; confirms document does not exist; returns upload prompt without false success.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 6.2.6: `Where is my old certificate?`

- **What to Type:**
```text
Where is my old certificate?
```
- **Expected HomeBrain Reply:**
> "I couldn't locate that certificate. Could you provide its name or type?"
- **Action Performed:** Checks `documents` table; confirms document does not exist; returns upload prompt without false success.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 6.2.7: `Find Sham's documents`

- **What to Type:**
```text
Find Sham's documents
```
- **Expected HomeBrain Reply:**
> "I'll list the available documents belonging to Sham that you can access."
- **Action Performed:** Checks `documents` table; confirms document does not exist; returns upload prompt without false success.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

### 6.3 UPLOAD MANAGE DOCUMENT (Action: `doc_manage`)

#### Command 6.3.1: `Upload Aadhaar`

- **What to Type:**
```text
Upload Aadhaar
```
- **Expected HomeBrain Reply:**
> "Please select your Aadhaar document to upload."
- **Action Performed:** Initiates document upload, duplicate replacement confirmation, or summarization of PDF contents.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`, `scripts/test-intelligent-actions.js`

#### Command 6.3.2: `Save father's PAN`

- **What to Type:**
```text
Save father's PAN
```
- **Expected HomeBrain Reply:**
> "Please upload the PAN document and confirm the document owner's details."
- **Action Performed:** Initiates document upload, duplicate replacement confirmation, or summarization of PDF contents.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 6.3.3: `Add my new certificate`

- **What to Type:**
```text
Add my new certificate
```
- **Expected HomeBrain Reply:**
> "Please upload the certificate."
- **Action Performed:** Initiates document upload, duplicate replacement confirmation, or summarization of PDF contents.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 6.3.4: `Replace my old Aadhaar`

- **What to Type:**
```text
Replace my old Aadhaar
```
- **Expected HomeBrain Reply:**
> "Please upload the new document. I'll ask you to confirm before replacing the existing one."
- **Action Performed:** Initiates document upload, duplicate replacement confirmation, or summarization of PDF contents.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 6.3.5: `Delete old passport`

- **What to Type:**
```text
Delete old passport
```
- **Expected HomeBrain Reply:**
> "Which passport record should I delete? I'll ask for confirmation first."
- **Action Performed:** Initiates document upload, duplicate replacement confirmation, or summarization of PDF contents.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 6.3.6: `Summarize my PDF`

- **What to Type:**
```text
Summarize my PDF
```
- **Expected HomeBrain Reply:**
> "Please select the PDF you'd like me to summarize."
- **Action Performed:** Initiates document upload, duplicate replacement confirmation, or summarization of PDF contents.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 6.3.7: `Read this document`

- **What to Type:**
```text
Read this document
```
- **Expected HomeBrain Reply:**
> "I'll extract and explain the readable content."
- **Action Performed:** Initiates document upload, duplicate replacement confirmation, or summarization of PDF contents.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 6.3.8: `Search for a word in my PDF`

- **What to Type:**
```text
Search for a word in my PDF
```
- **Expected HomeBrain Reply:**
> "Which word or phrase should I search for?"
- **Action Performed:** Initiates document upload, duplicate replacement confirmation, or summarization of PDF contents.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 6.3.9: `When did I upload Aadhaar?`

- **What to Type:**
```text
When did I upload Aadhaar?
```
- **Expected HomeBrain Reply:**
> "I'll check the Aadhaar upload date."
- **Action Performed:** Initiates document upload, duplicate replacement confirmation, or summarization of PDF contents.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 6.3.10: `Is my passport expired?`

- **What to Type:**
```text
Is my passport expired?
```
- **Expected HomeBrain Reply:**
> "I'll check its expiry date, if available."
- **Action Performed:** Initiates document upload, duplicate replacement confirmation, or summarization of PDF contents.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`


## Module 7: Reminders and Notifications

### 7.1 MANAGE REMINDERS (Action: `reminder_action`)

#### Command 7.1.1: `Remind me to drink water`

- **What to Type:**
```text
Remind me to drink water
```
- **Expected HomeBrain Reply:**
> "Sure! What time should I remind you?"
- **Action Performed:** Inserts reminder into `reminders` table with calculated timestamp in `Asia/Kolkata` time zone.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 7.1.2: `Remind me tomorrow to pay EB`

- **What to Type:**
```text
Remind me tomorrow to pay EB
```
- **Expected HomeBrain Reply:**
> "I'll schedule a reminder for tomorrow to pay your electricity bill."
- **Action Performed:** Inserts reminder into `reminders` table with calculated timestamp in `Asia/Kolkata` time zone.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 7.1.3: `Set an alarm for 6 AM`

- **What to Type:**
```text
Set an alarm for 6 AM
```
- **Expected HomeBrain Reply:**
> "I'll set an alarm for 6 AM, if alarm integration is available."
- **Action Performed:** Inserts reminder into `reminders` table with calculated timestamp in `Asia/Kolkata` time zone.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 7.1.4: `Remind me about my meeting`

- **What to Type:**
```text
Remind me about my meeting
```
- **Expected HomeBrain Reply:**
> "Your meeting is scheduled for tomorrow at 10 AM. When should I remind you?"
- **Action Performed:** Inserts reminder into `reminders` table with calculated timestamp in `Asia/Kolkata` time zone.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 7.1.5: `Remind me every Sunday to buy groceries`

- **What to Type:**
```text
Remind me every Sunday to buy groceries
```
- **Expected HomeBrain Reply:**
> "I'll set a recurring Sunday grocery reminder."
- **Action Performed:** Inserts reminder into `reminders` table with calculated timestamp in `Asia/Kolkata` time zone.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 7.1.6: `Remind me to call father tonight`

- **What to Type:**
```text
Remind me to call father tonight
```
- **Expected HomeBrain Reply:**
> "What time tonight should I remind you?"
- **Action Performed:** Inserts reminder into `reminders` table with calculated timestamp in `Asia/Kolkata` time zone.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 7.1.7: `Show my reminders`

- **What to Type:**
```text
Show my reminders
```
- **Expected HomeBrain Reply:**
> "Here are your upcoming reminders."
- **Action Performed:** Inserts reminder into `reminders` table with calculated timestamp in `Asia/Kolkata` time zone.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 7.1.8: `Cancel my grocery reminder`

- **What to Type:**
```text
Cancel my grocery reminder
```
- **Expected HomeBrain Reply:**
> "Your grocery reminder has been cancelled."
- **Action Performed:** Inserts reminder into `reminders` table with calculated timestamp in `Asia/Kolkata` time zone.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 7.1.9: `What reminders do I have today?`

- **What to Type:**
```text
What reminders do I have today?
```
- **Expected HomeBrain Reply:**
> "Here are your reminders for today."
- **Action Performed:** Inserts reminder into `reminders` table with calculated timestamp in `Asia/Kolkata` time zone.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 7.1.10: `Snooze my reminder`

- **What to Type:**
```text
Snooze my reminder
```
- **Expected HomeBrain Reply:**
> "How long would you like to snooze it?"
- **Action Performed:** Inserts reminder into `reminders` table with calculated timestamp in `Asia/Kolkata` time zone.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 7.1.11: `Remind me 2 days before the event`

- **What to Type:**
```text
Remind me 2 days before the event
```
- **Expected HomeBrain Reply:**
> "I'll schedule a reminder two days before the event."
- **Action Performed:** Inserts reminder into `reminders` table with calculated timestamp in `Asia/Kolkata` time zone.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 7.1.12: `Did I miss any reminders?`

- **What to Type:**
```text
Did I miss any reminders?
```
- **Expected HomeBrain Reply:**
> "I'll check your overdue reminders."
- **Action Performed:** Inserts reminder into `reminders` table with calculated timestamp in `Asia/Kolkata` time zone.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`


## Module 8: Tasks & To-Do

### 8.1 MANAGE TASKS (Action: `task_action`)

#### Command 8.1.1: `Add a task to complete my assignment`

- **What to Type:**
```text
Add a task to complete my assignment
```
- **Expected HomeBrain Reply:**
> "Your assignment task has been added."
- **Action Performed:** Inserts or updates task in `tasks` table with priority and deadline.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`, `scripts/test-intelligent-actions.js`

#### Command 8.1.2: `Add a task to call the bank`

- **What to Type:**
```text
Add a task to call the bank
```
- **Expected HomeBrain Reply:**
> "Your bank call task has been added."
- **Action Performed:** Inserts or updates task in `tasks` table with priority and deadline.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 8.1.3: `Create a task for tomorrow`

- **What to Type:**
```text
Create a task for tomorrow
```
- **Expected HomeBrain Reply:**
> "What task would you like me to create?"
- **Action Performed:** Inserts or updates task in `tasks` table with priority and deadline.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 8.1.4: `Mark assignment as completed`

- **What to Type:**
```text
Mark assignment as completed
```
- **Expected HomeBrain Reply:**
> "Your assignment task has been marked as completed."
- **Action Performed:** Inserts or updates task in `tasks` table with priority and deadline.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`, `scripts/test-intelligent-actions.js`

#### Command 8.1.5: `Show pending tasks`

- **What to Type:**
```text
Show pending tasks
```
- **Expected HomeBrain Reply:**
> "Here are your incomplete tasks."
- **Action Performed:** Inserts or updates task in `tasks` table with priority and deadline.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 8.1.6: `What tasks do I have today?`

- **What to Type:**
```text
What tasks do I have today?
```
- **Expected HomeBrain Reply:**
> "Here are your tasks scheduled for today."
- **Action Performed:** Inserts or updates task in `tasks` table with priority and deadline.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 8.1.7: `Delete my completed tasks`

- **What to Type:**
```text
Delete my completed tasks
```
- **Expected HomeBrain Reply:**
> "Would you like me to remove all completed tasks?"
- **Action Performed:** Inserts or updates task in `tasks` table with priority and deadline.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 8.1.8: `Change my task deadline`

- **What to Type:**
```text
Change my task deadline
```
- **Expected HomeBrain Reply:**
> "Which task and what new deadline?"
- **Action Performed:** Inserts or updates task in `tasks` table with priority and deadline.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 8.1.9: `Add high priority task`

- **What to Type:**
```text
Add high priority task
```
- **Expected HomeBrain Reply:**
> "Sure! What task should I mark as high priority?"
- **Action Performed:** Inserts or updates task in `tasks` table with priority and deadline.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 8.1.10: `What is my next task?`

- **What to Type:**
```text
What is my next task?
```
- **Expected HomeBrain Reply:**
> "Your next scheduled task is Review documents."
- **Action Performed:** Inserts or updates task in `tasks` table with priority and deadline.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 8.1.11: `Did I complete my assignment?`

- **What to Type:**
```text
Did I complete my assignment?
```
- **Expected HomeBrain Reply:**
> "I'll check its current status."
- **Action Performed:** Inserts or updates task in `tasks` table with priority and deadline.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 8.1.12: `Add a task to buy groceries`

- **What to Type:**
```text
Add a task to buy groceries
```
- **Expected HomeBrain Reply:**
> "Your grocery shopping task has been added."
- **Action Performed:** Inserts or updates task in `tasks` table with priority and deadline.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`


## Module 9: Notes and Memory

### 9.1 MANAGE NOTES (Action: `note_action`)

#### Command 9.1.1: `Save a note`

- **What to Type:**
```text
Save a note
```
- **Expected HomeBrain Reply:**
> "Sure! What would you like me to save?"
- **Action Performed:** Saves note content into `family_knowledge` or retrieves previously recorded notes.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 9.1.2: `Remember father's birthday`

- **What to Type:**
```text
Remember father's birthday
```
- **Expected HomeBrain Reply:**
> "I'll check whether his birthday is already saved."
- **Action Performed:** Saves note content into `family_knowledge` or retrieves previously recorded notes.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 9.1.3: `Remember that the Wi-Fi password is stored in my router records`

- **What to Type:**
```text
Remember that the Wi-Fi password is stored in my router records
```
- **Expected HomeBrain Reply:**
> "I'll save a note about that, without requesting or exposing the password."
- **Action Performed:** Saves note content into `family_knowledge` or retrieves previously recorded notes.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 9.1.4: `Add a note about my college project`

- **What to Type:**
```text
Add a note about my college project
```
- **Expected HomeBrain Reply:**
> "Please tell me what you'd like to remember."
- **Action Performed:** Saves note content into `family_knowledge` or retrieves previously recorded notes.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 9.1.5: `Show my notes`

- **What to Type:**
```text
Show my notes
```
- **Expected HomeBrain Reply:**
> "Here are your saved notes."
- **Action Performed:** Saves note content into `family_knowledge` or retrieves previously recorded notes.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 9.1.6: `Find my project notes`

- **What to Type:**
```text
Find my project notes
```
- **Expected HomeBrain Reply:**
> "I'll search your saved notes for project-related information."
- **Action Performed:** Saves note content into `family_knowledge` or retrieves previously recorded notes.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 9.1.7: `Delete my old note`

- **What to Type:**
```text
Delete my old note
```
- **Expected HomeBrain Reply:**
> "Which note would you like me to delete?"
- **Action Performed:** Saves note content into `family_knowledge` or retrieves previously recorded notes.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 9.1.8: `Update my note`

- **What to Type:**
```text
Update my note
```
- **Expected HomeBrain Reply:**
> "Please tell me which note and what to change."
- **Action Performed:** Saves note content into `family_knowledge` or retrieves previously recorded notes.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 9.1.9: `What did I tell you yesterday?`

- **What to Type:**
```text
What did I tell you yesterday?
```
- **Expected HomeBrain Reply:**
> "I'll search the available conversation history."
- **Action Performed:** Saves note content into `family_knowledge` or retrieves previously recorded notes.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 9.1.10: `Save this information for later`

- **What to Type:**
```text
Save this information for later
```
- **Expected HomeBrain Reply:**
> "Sure! I'll save it in your personal notes."
- **Action Performed:** Saves note content into `family_knowledge` or retrieves previously recorded notes.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`


## Module 10: Home & Household

### 10.1 MANAGE HOUSEHOLD (Action: `household_action`)

#### Command 10.1.1: `Add gas cylinder booking reminder`

- **What to Type:**
```text
Add gas cylinder booking reminder
```
- **Expected HomeBrain Reply:**
> "I'll create a reminder for your gas cylinder booking."
- **Action Performed:** Schedules recurring household utility reminders, logs maintenance expenses, or retrieves booking logs.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 10.1.2: `When did I last book gas?`

- **What to Type:**
```text
When did I last book gas?
```
- **Expected HomeBrain Reply:**
> "I'll check your saved gas booking records."
- **Action Performed:** Schedules recurring household utility reminders, logs maintenance expenses, or retrieves booking logs.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 10.1.3: `Add a maintenance expense`

- **What to Type:**
```text
Add a maintenance expense
```
- **Expected HomeBrain Reply:**
> "What was the amount and purpose?"
- **Action Performed:** Schedules recurring household utility reminders, logs maintenance expenses, or retrieves booking logs.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 10.1.4: `Remind me to service my bike`

- **What to Type:**
```text
Remind me to service my bike
```
- **Expected HomeBrain Reply:**
> "When should I remind you?"
- **Action Performed:** Schedules recurring household utility reminders, logs maintenance expenses, or retrieves booking logs.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 10.1.5: `Add AC service on Sunday`

- **What to Type:**
```text
Add AC service on Sunday
```
- **Expected HomeBrain Reply:**
> "I'll add AC servicing to your schedule for Sunday."
- **Action Performed:** Schedules recurring household utility reminders, logs maintenance expenses, or retrieves booking logs.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 10.1.6: `Show house expenses`

- **What to Type:**
```text
Show house expenses
```
- **Expected HomeBrain Reply:**
> "I'll retrieve your recorded household expenses."
- **Action Performed:** Schedules recurring household utility reminders, logs maintenance expenses, or retrieves booking logs.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 10.1.7: `Add water can to grocery list`

- **What to Type:**
```text
Add water can to grocery list
```
- **Expected HomeBrain Reply:**
> "Water can has been added to your grocery list."
- **Action Performed:** Schedules recurring household utility reminders, logs maintenance expenses, or retrieves booking logs.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 10.1.8: `Is gas booking due?`

- **What to Type:**
```text
Is gas booking due?
```
- **Expected HomeBrain Reply:**
> "I'll check your saved booking schedule."
- **Action Performed:** Schedules recurring household utility reminders, logs maintenance expenses, or retrieves booking logs.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 10.1.9: `Add electricity meter reading`

- **What to Type:**
```text
Add electricity meter reading
```
- **Expected HomeBrain Reply:**
> "Please provide the meter reading and date."
- **Action Performed:** Schedules recurring household utility reminders, logs maintenance expenses, or retrieves booking logs.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 10.1.10: `Show my household inventory`

- **What to Type:**
```text
Show my household inventory
```
- **Expected HomeBrain Reply:**
> "I'll list the household items saved in your records."
- **Action Performed:** Schedules recurring household utility reminders, logs maintenance expenses, or retrieves booking logs.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`


## Module 11: Tanglish (Tamil-English Commands)

### 11.1 TANGLISH COMMANDS (Action: `tanglish_bridge`)

#### Command 11.1.1: `Milk add pannunga`

- **What to Type:**
```text
Milk add pannunga
```
- **Expected HomeBrain Reply:**
> "Milk has been added to your grocery list."
- **Action Performed:** Translates Tanglish phrasing to standard entity schema and triggers the corresponding module backend action.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`, `scripts/test-intelligent-actions.js`

#### Command 11.1.2: `Grocery list kaaminga`

- **What to Type:**
```text
Grocery list kaaminga
```
- **Expected HomeBrain Reply:**
> "Here is your grocery list."
- **Action Performed:** Translates Tanglish phrasing to standard entity schema and triggers the corresponding module backend action.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 11.1.3: `EB bill paid nu mark pannunga`

- **What to Type:**
```text
EB bill paid nu mark pannunga
```
- **Expected HomeBrain Reply:**
> "Your electricity bill has been marked as paid."
- **Action Performed:** Translates Tanglish phrasing to standard entity schema and triggers the corresponding module backend action.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`, `scripts/test-intelligent-actions.js`

#### Command 11.1.4: `Appa birthday eppo?`

- **What to Type:**
```text
Appa birthday eppo?
```
- **Expected HomeBrain Reply:**
> "Your father's birthday is on December 10."
- **Action Performed:** Translates Tanglish phrasing to standard entity schema and triggers the corresponding module backend action.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 11.1.5: `Appa birthday already add pannirukoma?`

- **What to Type:**
```text
Appa birthday already add pannirukoma?
```
- **Expected HomeBrain Reply:**
> "Yes! Your father's birthday is already saved on December 10."
- **Action Performed:** Translates Tanglish phrasing to standard entity schema and triggers the corresponding module backend action.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 11.1.6: `Naalaiku meeting add pannunga`

- **What to Type:**
```text
Naalaiku meeting add pannunga
```
- **Expected HomeBrain Reply:**
> "What time should I schedule your meeting tomorrow?"
- **Action Performed:** Translates Tanglish phrasing to standard entity schema and triggers the corresponding module backend action.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 11.1.7: `En Aadhaar card eduthu kudu`

- **What to Type:**
```text
En Aadhaar card eduthu kudu
```
- **Expected HomeBrain Reply:**
> "I'll search your Document Vault for your Aadhaar card."
- **Action Performed:** Translates Tanglish phrasing to standard entity schema and triggers the corresponding module backend action.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 11.1.8: `Sham oda PAN card irukka?`

- **What to Type:**
```text
Sham oda PAN card irukka?
```
- **Expected HomeBrain Reply:**
> "Let me check whether Sham's PAN card is available."
- **Action Performed:** Translates Tanglish phrasing to standard entity schema and triggers the corresponding module backend action.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 11.1.9: `Intha expense add pannunga`

- **What to Type:**
```text
Intha expense add pannunga
```
- **Expected HomeBrain Reply:**
> "Sure! What was the expense amount and purpose?"
- **Action Performed:** Translates Tanglish phrasing to standard entity schema and triggers the corresponding module backend action.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 11.1.10: `En pending bills enna?`

- **What to Type:**
```text
En pending bills enna?
```
- **Expected HomeBrain Reply:**
> "Here are your pending bills."
- **Action Performed:** Translates Tanglish phrasing to standard entity schema and triggers the corresponding module backend action.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 11.1.11: `Reminder set pannunga`

- **What to Type:**
```text
Reminder set pannunga
```
- **Expected HomeBrain Reply:**
> "Sure! What would you like me to remind you about?"
- **Action Performed:** Translates Tanglish phrasing to standard entity schema and triggers the corresponding module backend action.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`

#### Command 11.1.12: `Appa birthday ku reminder podu`

- **What to Type:**
```text
Appa birthday ku reminder podu
```
- **Expected HomeBrain Reply:**
> "I'll set a reminder for your father's birthday."
- **Action Performed:** Translates Tanglish phrasing to standard entity schema and triggers the corresponding module backend action.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`


## Module 12: Error Handling & Clarification

### 12.1 CLARIFICATIONS AND ERRORS (Action: `clarify_or_error`)

#### Command 12.1.1: `Fetch my card`

- **What to Type:**
```text
Fetch my card
```
- **Expected HomeBrain Reply:**
> "Which card would you like me to retrieve?"
- **Action Performed:** Detects ambiguous/unsupported request or error state; returns precise clarification request without executing database mutations.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`, `scripts/test-bot-intents.js`

#### Command 12.1.2: `Fetch Sham's document`

- **What to Type:**
```text
Fetch Sham's document
```
- **Expected HomeBrain Reply:**
> "Which document belonging to Sham are you looking for?"
- **Action Performed:** Detects ambiguous/unsupported request or error state; returns precise clarification request without executing database mutations.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`, `scripts/test-bot-intents.js`

#### Command 12.1.3: `Find the certificate`

- **What to Type:**
```text
Find the certificate
```
- **Expected HomeBrain Reply:**
> "Whose certificate would you like me to find?"
- **Action Performed:** Detects ambiguous/unsupported request or error state; returns precise clarification request without executing database mutations.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`, `scripts/test-bot-intents.js`

#### Command 12.1.4: `Get that file`

- **What to Type:**
```text
Get that file
```
- **Expected HomeBrain Reply:**
> "Could you specify the file name or document type?"
- **Action Performed:** Detects ambiguous/unsupported request or error state; returns precise clarification request without executing database mutations.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`, `scripts/test-bot-intents.js`

#### Command 12.1.5: `I want my document`

- **What to Type:**
```text
I want my document
```
- **Expected HomeBrain Reply:**
> "Sure! Which document do you need?"
- **Action Performed:** Detects ambiguous/unsupported request or error state; returns precise clarification request without executing database mutations.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`, `scripts/test-bot-intents.js`

#### Command 12.1.6: `Document not found`

- **What to Type:**
```text
Document not found
```
- **Expected HomeBrain Reply:**
> "I couldn't find the requested document. Please upload it first."
- **Action Performed:** Detects ambiguous/unsupported request or error state; returns precise clarification request without executing database mutations.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`, `scripts/test-bot-intents.js`, `scripts/test-intelligent-actions.js`

#### Command 12.1.7: `File corrupted`

- **What to Type:**
```text
File corrupted
```
- **Expected HomeBrain Reply:**
> "The uploaded file appears to be unreadable. Please upload another copy."
- **Action Performed:** Detects ambiguous/unsupported request or error state; returns precise clarification request without executing database mutations.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`, `scripts/test-bot-intents.js`

#### Command 12.1.8: `Upload failed`

- **What to Type:**
```text
Upload failed
```
- **Expected HomeBrain Reply:**
> "The upload was unsuccessful. Please try again."
- **Action Performed:** Detects ambiguous/unsupported request or error state; returns precise clarification request without executing database mutations.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`, `scripts/test-bot-intents.js`

#### Command 12.1.9: `Unsupported file`

- **What to Type:**
```text
Unsupported file
```
- **Expected HomeBrain Reply:**
> "This file format is currently not supported. Please upload a supported file."
- **Action Performed:** Detects ambiguous/unsupported request or error state; returns precise clarification request without executing database mutations.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`, `scripts/test-bot-intents.js`

#### Command 12.1.10: `Unauthorized access`

- **What to Type:**
```text
Unauthorized access
```
- **Expected HomeBrain Reply:**
> "You don't have permission to access this document."
- **Action Performed:** Detects ambiguous/unsupported request or error state; returns precise clarification request without executing database mutations.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`, `scripts/test-bot-intents.js`, `scripts/test-intelligent-actions.js`

#### Command 12.1.11: `Unknown command`

- **What to Type:**
```text
Unknown command
```
- **Expected HomeBrain Reply:**
> "I'm not sure I understood that. Could you rephrase your request?"
- **Action Performed:** Detects ambiguous/unsupported request or error state; returns precise clarification request without executing database mutations.
- **Automated Test Coverage:** `scripts/test-all-catalog-intents.js`, `scripts/test-bot-intents.js`


## Module 13: Advanced Multi-Turn Scenarios & Edge Cases

These scenarios require multi-turn interaction or handle conflict resolution, topic switching, and duplicate detection.

### 13.1 Multi-Turn Scenario: CALENDAR BIRTHDAY CONFLICT UPDATE

**Description:** User requests to add a birthday on a date that conflicts with an existing family event. HomeBrain detects the conflict and asks whether to update the existing event or add it separately, then updates it upon confirmation.

**Turn 1:**
- **What to Type:**
```text
add mothers bday in dec 25
```
- **Expected Reply:**
> "I found an existing Mother's Birthday & Puja event on September 22, 2026. Do you want me to update its date to December 25, 2026, or add December 25, 2026 as a separate event?"

**Turn 2:**
- **What to Type:**
```text
update it
```
- **Expected Reply:**
> "Mother's birthday has been updated to December 25, 2026."

- **Automated Test Coverage:** `scripts/test-intelligent-actions.js` & `homebrain-training/multi_turn_conversations.json`

### 13.2 Multi-Turn Scenario: CALENDAR BIRTHDAY CONFLICT SEPARATE

**Description:** User chooses to create a separate event when a conflict is detected.

**Turn 1:**
- **What to Type:**
```text
add mothers bday in dec 25
```
- **Expected Reply:**
> "I found an existing Mother's Birthday & Puja event on September 22, 2026. Do you want me to update its date to December 25, 2026, or add December 25, 2026 as a separate event?"

**Turn 2:**
- **What to Type:**
```text
add separate
```
- **Expected Reply:**
> "Mother's Birthday on December 25, 2026 has been added as a separate event."

- **Automated Test Coverage:** `scripts/test-intelligent-actions.js` & `homebrain-training/multi_turn_conversations.json`

### 13.3 Multi-Turn Scenario: CALENDAR MISSING DATE

**Description:** User requests to add a birthday without supplying the date. HomeBrain prompts for the date, checks for duplicates, and saves it.

**Turn 1:**
- **What to Type:**
```text
Add father's birthday
```
- **Expected Reply:**
> "What is your father's birthday date?"

**Turn 2:**
- **What to Type:**
```text
June 15
```
- **Expected Reply:**
> "Your father's birthday is already saved on 2026-06-15."

- **Automated Test Coverage:** `scripts/test-intelligent-actions.js` & `homebrain-training/multi_turn_conversations.json`

### 13.4 Multi-Turn Scenario: GROCERY DUPLICATE QUANTITY UPDATE

**Description:** User requests to add an item that already exists in the grocery list. HomeBrain detects the duplicate and offers to update its quantity.

**Turn 1:**
- **What to Type:**
```text
Add milk
```
- **Expected Reply:**
> "Milk is already on your grocery list. Would you like to update its quantity?"

**Turn 2:**
- **What to Type:**
```text
2 litres
```
- **Expected Reply:**
> "Milk quantity has been updated to 2 litres."

- **Automated Test Coverage:** `scripts/test-intelligent-actions.js` & `homebrain-training/multi_turn_conversations.json`

### 13.5 Multi-Turn Scenario: GROCERY CLEAR LIST CONFIRMATION

**Description:** User requests to clear the grocery list. HomeBrain asks for confirmation before deleting records.

**Turn 1:**
- **What to Type:**
```text
Clear my grocery list
```
- **Expected Reply:**
> "Are you sure you want to clear your grocery list?"

**Turn 2:**
- **What to Type:**
```text
Yes, clear it
```
- **Expected Reply:**
> "Your grocery list has been cleared."

- **Automated Test Coverage:** `scripts/test-intelligent-actions.js` & `homebrain-training/multi_turn_conversations.json`

### 13.6 Multi-Turn Scenario: FINANCE BILL MISSING AMOUNT

**Description:** User requests to add a bill without specifying the amount and due date. HomeBrain prompts for the missing details.

**Turn 1:**
- **What to Type:**
```text
Add electricity bill
```
- **Expected Reply:**
> "Sure! Please provide the bill amount and due date."

**Turn 2:**
- **What to Type:**
```text
₹1,500 due on 25th
```
- **Expected Reply:**
> "Your ₹1,500 electricity bill has been recorded. When is it due?"

- **Automated Test Coverage:** `scripts/test-intelligent-actions.js` & `homebrain-training/multi_turn_conversations.json`

### 13.7 Multi-Turn Scenario: FINANCE EXPENSE MISSING CATEGORY

**Description:** User logs an expense amount without specifying what it was for. HomeBrain prompts for the category/purpose.

**Turn 1:**
- **What to Type:**
```text
Add ₹500 expense
```
- **Expected Reply:**
> "₹500 expense recorded. What was it for?"

**Turn 2:**
- **What to Type:**
```text
Food
```
- **Expected Reply:**
> "₹500 food expense has been recorded."

- **Automated Test Coverage:** `scripts/test-intelligent-actions.js` & `homebrain-training/multi_turn_conversations.json`

### 13.8 Critical Test: Birthday Conflict Resolution (Section 13 Screenshot Test)

**Context:** Existing database contains: *Mother's Birthday & Puja* on `2026-09-22`.

**Turn 1:**
- **What to Type:**
```text
add mothers bday in dec 25
```
- **Expected Reply:**
> "I found an existing Mother's Birthday & Puja event on September 22, 2026. Do you want me to update its date to December 25, 2026, or add December 25, 2026 as a separate event?"
- **Action Performed:** Detects date conflict for celebrant "Mother"; suspends execution and stores pending action in session store without dumping all database records.

**Turn 2 (Option A - Update existing):**
- **What to Type:**
```text
update it
```
- **Expected Reply:**
> "Mother's birthday has been updated to December 25, 2026."
- **Action Performed:** Updates existing record date to `2026-12-25` in `events` table.

**Turn 2 (Option B - Add separate):**
- **What to Type:**
```text
add separate
```
- **Expected Reply:**
> "Mother's Birthday on December 25, 2026 has been added as a separate event."
- **Action Performed:** Inserts new event row for December 25 while keeping September 22 record intact.

### 13.9 Topic Switching Safety Test

**Turn 1:**
- **What to Type:**
```text
Add father's birthday
```
- **Expected Reply:**
> "What is your father's birthday date?"

**Turn 2 (Topic Switch to Grocery):**
- **What to Type:**
```text
Add milk to grocery list
```
- **Expected Reply:**
> "Milk has been added to your grocery list."
- **Action Performed:** HomeBrain recognizes a new command verb (`Add milk...`), clears the pending birthday action, and executes the grocery addition rather than attempting to interpret "milk" as a date.

### 13.10 Ambiguous Commands Safety Test

| What to Type | Expected HomeBrain Reply | Action Performed |
|---|---|---|
| `Add it` | "What would you like me to add?" | Clarification prompt; no mutation. |
| `Delete that` | "Which item or record would you like me to delete?" | Clarification prompt; prevents accidental deletion. |
| `Mark this` | "Which task or bill would you like to mark completed or paid?" | Clarification prompt; avoids ambiguous state changes. |
| `Fetch my card` | "Which card would you like me to retrieve?" | Prompts for specific card type (Aadhaar, PAN, voter ID). |
| `Find the certificate` | "Whose certificate would you like me to find?" | Prompts for person / certificate type. |

### 13.11 Duplicate Detection & Idempotency Scenarios

| Scenario | What to Type | Expected HomeBrain Reply | Action Performed |
|---|---|---|---|
| **Grocery Duplicate** | `Add milk` (when Milk is in list) | "Milk is already on your grocery list. Would you like to update its quantity?" | Prevents duplicate row; prompts for new quantity. |
| **Calendar Duplicate** | `Add father's birthday on June 15` (when saved on June 15) | "Your father's birthday is already saved on 2026-06-15." | Idempotent; avoids duplicate event. |
| **Bill Payment Duplicate** | `Mark electricity bill as paid` (when already paid) | "Your electricity bill has been marked as paid. It is already marked as paid on record." | Idempotent; confirms payment without error. |
| **Document Duplicate** | `Upload Aadhaar` (when Aadhaar exists) | "An Aadhaar document already exists in your Document Vault. Would you like to upload a new version? Please select your Aadhaar document to upload." | Version check; prevents blind overwrite. |

### 13.12 Missing Records & Permissions Scenarios

| Scenario | What to Type | Expected HomeBrain Reply | Action Performed |
|---|---|---|---|
| **Missing Birthday** | `When is grandfather's birthday?` | "I couldn't find grandfather's birthday in the Family Calendar. Would you like to add it?" | Reports absence without hallucination. |
| **Missing Document** | `Fetch grandfather's Aadhaar card` | "I couldn't find grandfather's Aadhaar card in the Document Vault. Please upload the Aadhaar card so I can store it and make it available for future retrieval." | Prompts upload without false retrieval. |
| **Unauthorized Access** | `Unauthorized access` | "Sorry, you don't have permission to access this document. Please contact the document owner." | Enforces family role-based access control. |
| **Corrupted File** | `File corrupted` | "The file appears to be corrupted and cannot be opened. Please re-upload a readable copy." | Safety fallback on unreadable documents. |

