export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface Payee {
  id: string;
  name: string;
  icon: string;
  account?: Account;
}

export type AccountType = "DEBIT" | "SAVINGS" | "CREDIT";

export interface Transaction {
  id: string;
  date: Date;
  formattedDate: string;
  account: {
    id: string;
    name: string;
    type: AccountType;
  };
  payee: {
    id: string;
    name: string;
    account?: Account;
  };
  category: {
    id: string;
    name: string;
  };
  memo: string | null;
  outflow: number | null;
  inflow: number | null;
  accountId: string;
  payeeId: string;
  categoryId: string;
  toAccountId?: string;
}

export interface FormData {
  date: string;
  accountId: string;
  payeeId: string;
  categoryId: string;
  amount: string;
  memo: string;
  toAccountId?: string;
}
