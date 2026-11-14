const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'public', 'demo-documents');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const docs = [
  {
    fileName: 'Father_Passport.txt',
    content: `REPUBLIC OF INDIA - PASSPORT
Type: P, Country Code: IND, Passport No: Z9876543
Surname: KUMAR, Given Name: RAJESH
Nationality: INDIAN, Sex: M
Date of Birth: 15/06/1974
Place of Birth: CHENNAI, TAMIL NADU
Place of Issue: CHENNAI, Date of Issue: 15/06/2014, Date of Expiry: 14/06/2034
Address: 42 Palm Grove Avenue, Anna Nagar, Chennai 600040
Spouse: PRIYA KUMAR
[DEMO] Fictional synthetic document for HomeBrain Document Vault testing.`
  },
  {
    fileName: 'Mother_Aadhaar_Sample.txt',
    content: `GOVERNMENT OF INDIA - UNIQUE IDENTIFICATION AUTHORITY OF INDIA
Aadhaar - Ordinary Resident Proof
Aadhaar Number: 0000 1111 2222 (Fictional Demo Identity)
Name: Demo Mother (Priya Kumar)
DOB: 22/09/1977 | Gender: Female
Address: 42 Palm Grove Avenue, Anna Nagar, Chennai - 600040, Tamil Nadu
Issued by: Unique Identification Authority of India (UIDAI)
[DEMO] Synthetic fictional record for Document Vault verification.`
  },
  {
    fileName: 'Family_Address_Proof.txt',
    content: `GREATER CHENNAI CORPORATION - CERTIFICATE OF RESIDENTIAL ADDRESS
Certificate ID: CHN-RES-2026-88192
Head of Household: Demo Father (Rajesh Kumar)
Registered Address: Door No. 42, Palm Grove Avenue, Anna Nagar West Extension,
Chennai, Tamil Nadu - 600040.
Electricity Service Connection No: EB-CHN-88219
Water Supply Account: CMW-44021
Status: Verified Permanent Household Residence
[DEMO] Synthetic address verification document.`
  },
  {
    fileName: 'Electricity_Bill_November.txt',
    content: `Household Electricity Bill
- Billing month: November 2026
- Consumer: Demo Household
- Amount: ₹3,450
- Due date: November 25, 2026
- Payment status: Unpaid
- Category: Utilities
- Consumer No: 01-234-567-890
- Tariff: LT-1A Domestic
- Units Consumed: 420 kWh
Synthetic document content for OCR and document-question-answering tests.`
  },
  {
    fileName: 'Water_Bill_November.txt',
    content: `CHENNAI METROPOLITAN WATER SUPPLY AND SEWERAGE BOARD (CMWSSB)
Water & Sewerage Tax / Consumption Bill - November 2026
Consumer Name: Demo Household
Connection ID: CMW-44021
Service Address: 42 Palm Grove Avenue, Anna Nagar, Chennai 600040
Billing Month: November 2026
Bill Amount: ₹850
Due Date: November 20, 2026
Payment Status: Unpaid
Category: Utilities
[DEMO] Fictional water bill record.`
  },
  {
    fileName: 'Hospital_Appointment_Report.txt',
    content: `APOLLO HOSPITALS CLINICAL CONSULTATION REPORT
Department of Endocrinology & Metabolic Wellness
Patient Name: Demo Mother (Priya Kumar)
Age: 49 Years | Gender: Female | UHID: APL-9921048
Consultation Date: 17/11/2026
Attending Physician: Dr. K. Sharma, MD (Endocrinology)
Chief Complaints: Routine diabetic management review
Clinical Observations: HbA1c: 6.8%, Blood Pressure: 122/80 mmHg, Fasting Blood Sugar: 112 mg/dL
Recommendations: Continue prescribed diet and physical exercise. Next follow-up in 3 months.
[DEMO] Synthetic medical report.`
  },
  {
    fileName: 'Family_Insurance_Policy.txt',
    content: `STAR HEALTH AND ALLIED INSURANCE COMPANY LIMITED
Family Health Optima Insurance Plan - Policy Schedule
Policy Number: POL-772910-FAM
Policyholder: Demo Father (Rajesh Kumar)
Total Sum Insured / Coverage Amount: ₹5,00,000 (Five Lakh Rupees)
Floater Coverage: Yes
Covered Members: Demo Father (52), Demo Mother (49), Demo Sarah (24), Demo Sneha (19), Demo Sham (15)
Policy Period: 06/12/2025 to 05/12/2027
Network Hospitals: 14,000+ cashless hospitals nationwide
TPA Helpdesk: 1800-425-2255
[DEMO] Synthetic insurance document.`
  },
  {
    fileName: 'Property_Ownership_Record.txt',
    content: `GOVERNMENT OF TAMIL NADU - REGISTRATION DEPARTMENT
Certificate of Property Ownership / Title Deed Extract
Document No: 2841/2012 | Sub-Registrar Office: Anna Nagar, Chennai
Registered Owners: Demo Father & Demo Mother
Property Description: Residential Plot with Two-Storey House, Plot No. 14,
Door No. 42, Palm Grove Avenue, Anna Nagar West, Chennai 600040
Survey Number: 284/1B, Extent: 2,400 Sq. Ft.
Encumbrance Status: Clear Nil Encumbrance
[DEMO] Synthetic property deed record.`
  },
  {
    fileName: 'Sarah_School_Certificate.txt',
    content: `CENTRAL BOARD OF SECONDARY EDUCATION (CBSE)
Senior School Certificate Examination (Class XII)
Roll Number: 8192034
Student Name: Demo Sarah (Sarah Kumar)
Mother's Name: Priya Kumar | Father's Name: Rajesh Kumar
School: St. Michael's Senior Secondary School, Chennai
Academic Year: 2018 | Stream: Science (PCMC)
Subjects & Marks: English Core (95), Mathematics (92), Physics (94), Chemistry (96), Computer Science (94)
Overall Aggregate: 94.2% - Passed with Distinction
[DEMO] Synthetic educational credential.`
  },
  {
    fileName: 'Grocery_Purchase_Receipt.txt',
    content: `NILGIRIS 1905 SUPERMARKET - RETAIL TAX INVOICE
Store: Anna Nagar 2nd Avenue Branch, Chennai
Invoice No: NIL-2026-11029 | Date: 02/11/2026 | Time: 18:45
Items Purchased:
1. Daawat Basmati Rice (10 kg bag) - ₹950.00
2. Farm Toor Dal (2 kg pack) - ₹280.00
3. Fortune Sunflower Cooking Oil (5 L can) - ₹750.00
4. Amul Fresh Cow Milk (2 litres) - ₹110.00
5. Household Essentials & Spices - ₹410.00
Total Items: 5 | Subtotal: ₹2,380.95 | GST (5%): ₹119.05
Total Amount Paid: ₹2,500.00
Payment Method: UPI (GPay - Transaction Ref: UPI/20261102/987123)
[DEMO] Synthetic grocery invoice.`
  },
  {
    fileName: 'Family_Emergency_Contacts.txt',
    content: `HOUSEHOLD EMERGENCY ACTION DIRECTORY - CHENNAI RESIDENCE
Address: 42 Palm Grove Avenue, Anna Nagar West, Chennai 600040
Local Police Station: Anna Nagar Police Station (Phone: 044-26151100 / 100)
Nearest Emergency Care: Apollo Clinic Anna Nagar (Phone: 044-28290200 / 1066)
Family Physician: Dr. K. Sharma (Mobile: +91 98400 12345)
City Ambulance Hotline: 108
Fire & Rescue Service: 101
Trusted Neighbor: Mr. V. Raman (Plot 15, Phone: +91 94440 98765)
[DEMO] Synthetic household emergency directory.`
  },
  {
    fileName: 'Vehicle_Insurance_Document.txt',
    content: `HDFC ERGO GENERAL INSURANCE COMPANY LIMITED
Private Car Package Policy Schedule
Policy Number: MOT-482019-2026
Insured: Demo Father (Rajesh Kumar)
Vehicle Make & Model: Hyundai Creta 1.5 SX (Petrol)
Registration Number: TN 01 AB 1234 | Year of Manufacture: 2022
Insured Declared Value (IDV): ₹11,50,000
Coverage: Comprehensive Package (Third Party Liability + Own Damage + Nil Depreciation)
Policy Validity: 16/10/2026 to 15/10/2027
24x7 Roadside Assistance: 1800-2666
[DEMO] Synthetic motor insurance policy.`
  }
];

docs.forEach(d => {
  const filePath = path.join(targetDir, d.fileName);
  fs.writeFileSync(filePath, d.content, 'utf8');
  console.log(`Created document file: ${d.fileName} (${d.content.length} bytes)`);
});
console.log('All 12 demo documents successfully generated in public/demo-documents/');
