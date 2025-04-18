export const sampleExcelStructure = [
  {
    SR_NO: "",
    BRANCH: "Main Branch",
    CUST_ID: "C001",
    ACC_NO: "191467310000967",
    CUSTOMER_NAME: "John Doe",
    SCHEME_CODE: "PL001",
    PRODUCT_TYPE: "Personal Loan",
    SANCTION_LIMIT: "800000",
    DATE_OF_NPA: "2024-01-15",
    OUTSTANDING_BALANCE: "",
    PRINCIPLE_OVERDUE: "650000",
    INTEREST_OVERDUE: "61618.08",
    NET_BALANCE: "711618.08",
    PROVISION: "",
    ANOMALIES: "",
    ASSET_CLASSIFICATION: "",
    ASSET_TAGGING: "",
    CONTACT_NO: "9876543210",
    ADDRESS: "",
    BANK: "Sample Bank",
    FEEDBACK: "WILL PAY",
    OTS_AMOUNT: "711618.08"
  }
];

// Map Excel column names to our internal names
export const columnMapping = {
  'Annexure-I': 'SR_NO',
  '__EMPTY': 'BRANCH',
  '__EMPTY_1': 'CUST_ID',
  '__EMPTY_2': 'ACC_NO',
  '__EMPTY_3': 'CUSTOMER_NAME',
  '__EMPTY_4': 'SCHEME_CODE',
  '__EMPTY_5': 'PRODUCT_TYPE',
  '__EMPTY_6': 'SANCTION_LIMIT',
  '__EMPTY_7': 'DATE_OF_NPA',
  '__EMPTY_8': 'OUTSTANDING_BALANCE',
  '__EMPTY_9': 'PRINCIPLE_OVERDUE',
  '__EMPTY_10': 'INTEREST_OVERDUE',
  '__EMPTY_11': 'NET_BALANCE',
  '__EMPTY_12': 'PROVISION',
  '__EMPTY_13': 'ANOMALIES',
  '__EMPTY_14': 'ASSET_CLASSIFICATION',
  '__EMPTY_15': 'ASSET_TAGGING',
  '__EMPTY_16': 'CONTACT_NO',
  '__EMPTY_17': 'ADDRESS'
};

// Required columns for validation
export const requiredColumns = [
  'Annexure-I',
  '__EMPTY',
  '__EMPTY_1',
  '__EMPTY_2',
  '__EMPTY_3',
  '__EMPTY_4',
  '__EMPTY_5',
  '__EMPTY_6',
  '__EMPTY_7',
  '__EMPTY_8',
  '__EMPTY_9',
  '__EMPTY_10',
  '__EMPTY_11',
  '__EMPTY_12',
  '__EMPTY_13',
  '__EMPTY_14',
  '__EMPTY_15',
  '__EMPTY_16',
  '__EMPTY_17'
];
